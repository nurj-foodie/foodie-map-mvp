import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { restaurantEditService } from '../services/restaurantEditService';
import './RestaurantEditReviewDashboard.css';

const RestaurantEditReviewDashboard = () => {
  const [pendingEdits, setPendingEdits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEdit, setSelectedEdit] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending'); // pending, approved, rejected, all
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedEdits, setSelectedEdits] = useState(new Set()); // For bulk actions

  // Load pending restaurant edits
  const loadPendingEdits = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading restaurant edits...');
      
      let edits = [];
      
      if (filterStatus === 'all') {
        // Get all edits (need to query without status filter first, then filter client-side)
        const q = query(
          collection(db, 'restaurant_edits'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const snapshot = await getDocs(q);
        edits = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        // Get edits by status
        const q = query(
          collection(db, 'restaurant_edits'),
          where('status', '==', filterStatus),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        edits = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      setPendingEdits(edits);
      console.log(`✅ Loaded ${edits.length} edits`);
    } catch (error) {
      console.error('❌ Error loading edits:', error);
      setPendingEdits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingEdits();
  }, [filterStatus]);

  // Approve edit and apply changes to restaurant
  const approveEdit = async (editId) => {
    try {
      setIsProcessing(true);
      console.log('✅ Approving edit:', editId);
      
      const edit = pendingEdits.find(e => e.id === editId);
      if (!edit) {
        window.alert('Edit not found');
        return;
      }

      // Get restaurant document
      const restaurantRef = doc(db, 'eateries', edit.restaurantId);
      const restaurantSnap = await getDoc(restaurantRef);
      
      if (!restaurantSnap.exists()) {
        window.alert('Restaurant not found in database');
        return;
      }

      const restaurantData = restaurantSnap.data();
      const proposedChanges = edit.proposedChanges || {};

      // Apply changes to restaurant document
      const updates = {};
      
      // Photos: Add new photos to userPhotos array
      if (proposedChanges.photos && proposedChanges.photos.length > 0) {
        const currentPhotos = restaurantData.userPhotos || [];
        updates.userPhotos = [...currentPhotos, ...proposedChanges.photos];
      }

      // Operating Hours: Update operating hours
      if (proposedChanges.operatingHours) {
        updates.operatingHours = proposedChanges.operatingHours;
      }

      // Name: Update name
      if (proposedChanges.name) {
        updates.name = proposedChanges.name;
      }

      // Business Status: Update status
      if (proposedChanges.businessStatus) {
        updates.businessStatus = proposedChanges.businessStatus;
        updates.isActive = proposedChanges.isActive !== undefined ? proposedChanges.isActive : true;
      }

      // Update restaurant document
      await updateDoc(restaurantRef, {
        ...updates,
        lastUpdated: new Date()
      });

      // Update edit status
      await updateDoc(doc(db, 'restaurant_edits', editId), {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: 'admin',
        reviewNotes: 'Edit approved and applied to restaurant'
      });

      // Reload edits
      await loadPendingEdits();
      setSelectedEdit(null);
      
      console.log('✅ Edit approved and applied successfully');
      window.alert('✅ Edit approved and applied to restaurant');
    } catch (error) {
      console.error('❌ Error approving edit:', error);
      window.alert('Error approving edit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk approve edits
  const bulkApproveEdits = async () => {
    if (selectedEdits.size === 0) {
      window.alert('Please select at least one edit to approve.');
      return;
    }

    if (!window.confirm(`Are you sure you want to approve ${selectedEdits.size} edit(s)?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const editIds = Array.from(selectedEdits);
      let successCount = 0;
      let failCount = 0;

      for (const editId of editIds) {
        try {
          const edit = pendingEdits.find(e => e.id === editId);
          if (!edit) {
            failCount++;
            continue;
          }

          // Get restaurant document
          const restaurantRef = doc(db, 'eateries', edit.restaurantId);
          const restaurantSnap = await getDoc(restaurantRef);
          
          if (!restaurantSnap.exists()) {
            failCount++;
            continue;
          }

          const restaurantData = restaurantSnap.data();
          const proposedChanges = edit.proposedChanges || {};

          // Apply changes to restaurant document
          const updates = {};
          
          // Photos: Add new photos to userPhotos array
          if (proposedChanges.photos && proposedChanges.photos.length > 0) {
            const currentPhotos = restaurantData.userPhotos || [];
            updates.userPhotos = [...currentPhotos, ...proposedChanges.photos];
          }

          // Operating Hours: Update operating hours
          if (proposedChanges.operatingHours) {
            updates.operatingHours = proposedChanges.operatingHours;
          }

          // Name: Update name
          if (proposedChanges.name) {
            updates.name = proposedChanges.name;
          }

          // Business Status: Update status
          if (proposedChanges.businessStatus) {
            updates.businessStatus = proposedChanges.businessStatus;
            updates.isActive = proposedChanges.isActive !== undefined ? proposedChanges.isActive : true;
          }

          // Update restaurant document
          await updateDoc(restaurantRef, {
            ...updates,
            lastUpdated: new Date()
          });

          // Update edit status
          await updateDoc(doc(db, 'restaurant_edits', editId), {
            status: 'approved',
            reviewedAt: new Date(),
            reviewedBy: 'admin',
            reviewNotes: 'Edit approved and applied to restaurant'
          });

          successCount++;
        } catch (error) {
          console.error(`Error approving edit ${editId}:`, error);
          failCount++;
        }
      }

      setSelectedEdits(new Set());
      await loadPendingEdits();
      
      window.alert(`✅ Approved ${successCount} edit(s)${failCount > 0 ? `, ${failCount} failed` : ''}`);
    } catch (error) {
      console.error('❌ Error in bulk approve:', error);
      window.alert('Error during bulk approval. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk reject edits
  const bulkRejectEdits = async () => {
    if (selectedEdits.size === 0) {
      window.alert('Please select at least one edit to reject.');
      return;
    }

    const reason = window.prompt(`Please provide a reason for rejecting ${selectedEdits.size} edit(s) (optional):`);
    if (reason === null) return; // User cancelled

    if (!window.confirm(`Are you sure you want to reject ${selectedEdits.size} edit(s)?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const editIds = Array.from(selectedEdits);
      let successCount = 0;
      let failCount = 0;

      for (const editId of editIds) {
        try {
          await rejectEdit(editId, reason);
          successCount++;
        } catch (error) {
          console.error(`Error rejecting edit ${editId}:`, error);
          failCount++;
        }
      }

      setSelectedEdits(new Set());
      await loadPendingEdits();
      
      window.alert(`❌ Rejected ${successCount} edit(s)${failCount > 0 ? `, ${failCount} failed` : ''}`);
    } catch (error) {
      console.error('❌ Error in bulk reject:', error);
      window.alert('Error during bulk rejection. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle edit selection
  const toggleEditSelection = (editId) => {
    const newSelected = new Set(selectedEdits);
    if (newSelected.has(editId)) {
      newSelected.delete(editId);
    } else {
      newSelected.add(editId);
    }
    setSelectedEdits(newSelected);
  };

  // Select all visible edits
  const selectAllEdits = () => {
    const allIds = pendingEdits.map(edit => edit.id);
    setSelectedEdits(new Set(allIds));
  };

  // Deselect all edits
  const deselectAllEdits = () => {
    setSelectedEdits(new Set());
  };

  // Reject edit
  const rejectEdit = async (editId, reason = '') => {
    try {
      setIsProcessing(true);
      console.log('❌ Rejecting edit:', editId);
      
      await updateDoc(doc(db, 'restaurant_edits', editId), {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: 'admin',
        reviewNotes: reason || 'Edit rejected by admin'
      });

      // Reload edits
      await loadPendingEdits();
      setSelectedEdit(null);
      
      console.log('❌ Edit rejected successfully');
      window.alert('❌ Edit rejected');
    } catch (error) {
      console.error('❌ Error rejecting edit:', error);
      window.alert('Error rejecting edit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  // Get edit type label
  const getEditTypeLabel = (editType) => {
    const types = {
      'photos': '📸 Photos',
      'hours': '🕐 Operating Hours',
      'name': '📝 Name',
      'closed': '🚫 Closed Status',
      'general': '✏️ General'
    };
    return types[editType] || editType;
  };

  // Render edit details modal
  const renderEditModal = () => {
    if (!selectedEdit) return null;

    const original = selectedEdit.originalData || {};
    const proposed = selectedEdit.proposedChanges || {};

    return (
      <div className="edit-modal-overlay" onClick={() => setSelectedEdit(null)}>
        <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Restaurant Edit Review</h3>
            <button 
              className="close-btn"
              onClick={() => setSelectedEdit(null)}
            >
              ×
            </button>
          </div>
          
          <div className="modal-content">
            <div className="edit-info">
              <h4>Restaurant Information</h4>
              <div className="info-grid">
                <div><strong>Restaurant:</strong> {selectedEdit.restaurantName}</div>
                <div><strong>Restaurant ID:</strong> {selectedEdit.restaurantId}</div>
                <div><strong>Edit Type:</strong> {getEditTypeLabel(selectedEdit.editType)}</div>
                <div><strong>Submitted by:</strong> {selectedEdit.userName || 'Unknown'}</div>
                <div><strong>Submitted at:</strong> {formatDate(selectedEdit.createdAt)}</div>
                <div><strong>Status:</strong> 
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusBadgeColor(selectedEdit.status) }}
                  >
                    {selectedEdit.status?.toUpperCase()}
                  </span>
                </div>
                {selectedEdit.reason && (
                  <div><strong>Reason:</strong> {selectedEdit.reason}</div>
                )}
              </div>
            </div>

            {/* Before/After Comparison */}
            <div className="comparison-section">
              <h4>Changes Comparison</h4>
              
              {/* Photos */}
              {proposed.photos && proposed.photos.length > 0 && (
                <div className="comparison-item">
                  <h5>📸 New Photos ({proposed.photos.length})</h5>
                  <div className="photos-grid">
                    {proposed.photos.map((photo, index) => (
                      <img 
                        key={index} 
                        src={photo.data || photo.url} 
                        alt={`New photo ${index + 1}`}
                        className="edit-photo"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Operating Hours */}
              {proposed.operatingHours && (
                <div className="comparison-item">
                  <h5>🕐 Operating Hours</h5>
                  <div className="comparison-grid">
                    <div className="comparison-col">
                      <strong>Current:</strong>
                      <pre>{JSON.stringify(original.operatingHours || {}, null, 2)}</pre>
                    </div>
                    <div className="comparison-col">
                      <strong>Proposed:</strong>
                      <pre>{JSON.stringify(proposed.operatingHours, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Name */}
              {proposed.name && (
                <div className="comparison-item">
                  <h5>📝 Restaurant Name</h5>
                  <div className="comparison-grid">
                    <div className="comparison-col">
                      <strong>Current:</strong>
                      <p>{original.name || 'N/A'}</p>
                    </div>
                    <div className="comparison-col">
                      <strong>Proposed:</strong>
                      <p>{proposed.name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Status */}
              {proposed.businessStatus && (
                <div className="comparison-item">
                  <h5>🚫 Business Status</h5>
                  <div className="comparison-grid">
                    <div className="comparison-col">
                      <strong>Current:</strong>
                      <p>{original.businessStatus || 'OPERATIONAL'}</p>
                    </div>
                    <div className="comparison-col">
                      <strong>Proposed:</strong>
                      <p>{proposed.businessStatus}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-actions">
            {selectedEdit.status === 'pending' && (
              <>
                <button 
                  className="btn-reject"
                  onClick={() => {
                    const reason = window.prompt('Please provide a reason for rejection (optional):');
                    rejectEdit(selectedEdit.id, reason);
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : '❌ Reject'}
                </button>
                <button 
                  className="btn-approve"
                  onClick={() => approveEdit(selectedEdit.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : '✅ Approve & Apply'}
                </button>
              </>
            )}
            {selectedEdit.status === 'rejected' && (
              <button 
                className="btn-approve"
                onClick={() => approveEdit(selectedEdit.id)}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : '✅ Approve (Override)'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="restaurant-edit-review-dashboard">
      <div className="dashboard-header">
        <h2>✏️ Restaurant Edit Review</h2>
        <p>Review and approve/reject restaurant edits submitted by users</p>
      </div>

      <div className="dashboard-controls">
        <div className="status-filter">
          <label>Filter by status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setSelectedEdits(new Set()); // Clear selection when filter changes
            }}
          >
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Edits</option>
          </select>
        </div>

        {selectedEdits.size > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">{selectedEdits.size} selected</span>
            <button 
              className="bulk-approve-btn"
              onClick={bulkApproveEdits}
              disabled={isProcessing || filterStatus !== 'pending'}
            >
              ✅ Approve Selected
            </button>
            <button 
              className="bulk-reject-btn"
              onClick={bulkRejectEdits}
              disabled={isProcessing || filterStatus !== 'pending'}
            >
              ❌ Reject Selected
            </button>
            <button 
              className="deselect-btn"
              onClick={deselectAllEdits}
            >
              Clear Selection
            </button>
          </div>
        )}
        
        <button 
          className="refresh-btn"
          onClick={loadPendingEdits}
          disabled={loading}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">🔄</div>
          <p>Loading edits...</p>
        </div>
      ) : (
        <div className="edits-list">
          {pendingEdits.length === 0 ? (
            <div className="empty-state">
              <p>No edits found for the selected status.</p>
            </div>
          ) : (
            <>
              {filterStatus === 'pending' && pendingEdits.length > 0 && (
                <div className="select-all-controls">
                  <label className="select-all-label">
                    <input
                      type="checkbox"
                      checked={selectedEdits.size === pendingEdits.length && pendingEdits.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllEdits();
                        } else {
                          deselectAllEdits();
                        }
                      }}
                    />
                    <span>Select All ({pendingEdits.length})</span>
                  </label>
                </div>
              )}
              {pendingEdits.map((edit) => (
                <div 
                  key={edit.id} 
                  className={`edit-card ${selectedEdits.has(edit.id) ? 'selected' : ''}`}
                  onClick={() => {
                    if (filterStatus === 'pending') {
                      toggleEditSelection(edit.id);
                    } else {
                      setSelectedEdit(edit);
                    }
                  }}
                >
                  {filterStatus === 'pending' && (
                    <div className="edit-checkbox" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedEdits.has(edit.id)}
                        onChange={() => toggleEditSelection(edit.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div className="edit-header">
                    <h4>{edit.restaurantName}</h4>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusBadgeColor(edit.status) }}
                    >
                      {edit.status?.toUpperCase()}
                    </span>
                  </div>
                
                <div className="edit-details">
                  <p><strong>Edit Type:</strong> {getEditTypeLabel(edit.editType)}</p>
                  <p><strong>Submitted by:</strong> {edit.userName || 'Unknown'}</p>
                  <p><strong>Submitted:</strong> {formatDate(edit.createdAt)}</p>
                  {edit.reason && (
                    <p><strong>Reason:</strong> {edit.reason}</p>
                  )}
                </div>
                
                <div className="edit-actions">
                  <button 
                    className="view-details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdit(edit);
                    }}
                  >
                    👁️ View Details
                  </button>
                </div>
              </div>
              ))}
            </>
          )}
        </div>
      )}

      {renderEditModal()}
    </div>
  );
};

export default RestaurantEditReviewDashboard;

