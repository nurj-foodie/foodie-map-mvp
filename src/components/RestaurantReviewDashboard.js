import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './RestaurantReviewDashboard.css';

const RestaurantReviewDashboard = () => {
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('all'); // all, pending, approved, rejected
  const [isProcessing, setIsProcessing] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  // Load pending restaurant submissions
  const loadPendingSubmissions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading pending restaurant submissions...');
      
      let submissions = [];
      
      // Strategy: Fetch ALL documents and filter client-side
      // This ensures we get user submissions even if they're not in the first 200 by createdAt
      try {
        console.log('📊 Fetching all eateries documents...');
        const q = query(collection(db, 'eateries'));
        const snapshot = await getDocs(q);
        submissions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`📊 Fetched ${submissions.length} total documents from Firestore`);
        
        // Sort client-side by createdAt (most recent first)
        submissions.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
          return bDate - aDate; // Descending order (newest first)
        });
        
        console.log(`✅ Sorted ${submissions.length} documents by createdAt`);
        
        // Debug: Log status values from first 5 documents
        if (submissions.length > 0) {
          console.log('🔍 Sample document statuses (first 5):');
          submissions.slice(0, 5).forEach((sub, idx) => {
            console.log(`  [${idx + 1}] ID: ${sub.id}, Name: ${sub.name || 'NO_NAME'}, Status: ${sub.status || 'NO_STATUS'}, Has status field: ${sub.hasOwnProperty('status')}, Source: ${sub.source || 'NO_SOURCE'}`);
          });
        }
      } catch (fetchError) {
        console.error('❌ Error fetching documents:', fetchError);
        // Fallback: Try with limit if full fetch fails
        try {
          const q = query(collection(db, 'eateries'), limit(500));
          const snapshot = await getDocs(q);
          submissions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          submissions.sort((a, b) => {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
            return bDate - aDate;
          });
          
          console.log(`📊 Fetched ${submissions.length} documents (with limit fallback)`);
        } catch (fallbackError) {
          console.error('❌ Fallback fetch also failed:', fallbackError);
          submissions = [];
        }
      }
      
      // Debug: Log all unique status values before filtering
      const allStatuses = [...new Set(submissions.map(sub => sub.status || 'NO_STATUS'))];
      console.log('📊 All unique status values found:', allStatuses);
      console.log('📊 Documents with status field:', submissions.filter(sub => sub.hasOwnProperty('status')).length);
      console.log('📊 Documents without status field:', submissions.filter(sub => !sub.hasOwnProperty('status')).length);
      
      // Filter client-side based on review status
      // Also include documents without status field if they're user submissions (legacy support)
      if (reviewStatus === 'all') {
        submissions = submissions.filter(sub => {
          // Include if status is pending_review, approved, or rejected
          if (sub.status && ['pending_review', 'approved', 'rejected'].includes(sub.status)) {
            return true;
          }
          // Include if no status but is a user submission (legacy documents)
          if (!sub.status && (sub.source === 'user_submission' || sub.createdBy)) {
            return true;
          }
          return false;
        });
      } else if (reviewStatus === 'pending_review') {
        // For pending_review, include documents with status 'pending_review' OR no status but user submission
        submissions = submissions.filter(sub => {
          if (sub.status === 'pending_review') return true;
          // Legacy: no status but is user submission = pending
          if (!sub.status && (sub.source === 'user_submission' || sub.createdBy)) return true;
          return false;
        });
      } else {
        submissions = submissions.filter(sub => sub.status === reviewStatus);
      }
      
      console.log(`🔍 After filtering for status "${reviewStatus}": ${submissions.length} submissions`);
      
      // Prioritize pending_review submissions by sorting them first
      submissions.sort((a, b) => {
        // First, prioritize by status (pending_review first)
        if (a.status === 'pending_review' && b.status !== 'pending_review') return -1;
        if (a.status !== 'pending_review' && b.status === 'pending_review') return 1;
        
        // Then by createdAt (newest first)
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
        return bDate - aDate;
      });
      
      // Limit to 100 after filtering (increased to show more submissions)
      submissions = submissions.slice(0, 100);
      
      setPendingSubmissions(submissions);
      console.log(`✅ Loaded ${submissions.length} submissions (status: ${reviewStatus})`);
      
      // Log status breakdown for debugging
      const statusBreakdown = submissions.reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 Status breakdown:', statusBreakdown);
    } catch (error) {
      console.error('❌ Error loading submissions:', error);
      alert('Error loading submissions. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingSubmissions();
  }, [reviewStatus]);

  // Approve restaurant submission
  const approveSubmission = async (submissionId) => {
    try {
      setIsProcessing(true);
      console.log('✅ Approving submission:', submissionId);
      
      await updateDoc(doc(db, 'eateries', submissionId), {
        status: 'approved',
        verified: true,
        reviewedAt: new Date(),
        reviewedBy: 'admin'
      });
      
      // Reload submissions
      await loadPendingSubmissions();
      setSelectedSubmission(null);
      
      console.log('✅ Submission approved successfully');
    } catch (error) {
      console.error('❌ Error approving submission:', error);
      alert('Error approving submission. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject restaurant submission
  const rejectSubmission = async (submissionId, reason = '') => {
    try {
      setIsProcessing(true);
      console.log('❌ Rejecting submission:', submissionId);
      
      await updateDoc(doc(db, 'eateries', submissionId), {
        status: 'rejected',
        verified: false,
        reviewedAt: new Date(),
        reviewedBy: 'admin',
        rejectionReason: reason
      });
      
      // Reload submissions
      await loadPendingSubmissions();
      setSelectedSubmission(null);
      
      console.log('❌ Submission rejected successfully');
    } catch (error) {
      console.error('❌ Error rejecting submission:', error);
      alert('Error rejecting submission. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending_review': return '#ffc107';
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

  // Check for potential duplicates in Firestore (Firestore only, no Google Places API)
  const checkForDuplicates = async (name, address, location) => {
    try {
      setIsCheckingDuplicates(true);
      console.log('🔍 Checking for potential duplicates in Firestore...', { name, address });
      
      const duplicates = [];
      
      // Strategy 1: Search by name (case-insensitive partial match)
      try {
        const nameLower = name.toLowerCase().trim();
        const nameQuery = query(
          collection(db, 'eateries'),
          where('name', '>=', nameLower),
          where('name', '<=', nameLower + '\uf8ff'),
          limit(10)
        );
        const nameSnapshot = await getDocs(nameQuery);
        nameSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Exclude the current submission itself
          if (doc.id !== selectedSubmission?.id) {
            duplicates.push({
              id: doc.id,
              name: data.name,
              address: data.address,
              location: data.location,
              matchType: 'name',
              similarity: calculateNameSimilarity(name, data.name),
              ...data
            });
          }
        });
      } catch (nameError) {
        console.warn('⚠️ Name query failed (may need index):', nameError);
      }
      
      // Strategy 2: Search by address (case-insensitive partial match)
      try {
        const addressLower = address.toLowerCase().trim();
        const addressQuery = query(
          collection(db, 'eateries'),
          where('address', '>=', addressLower),
          where('address', '<=', addressLower + '\uf8ff'),
          limit(10)
        );
        const addressSnapshot = await getDocs(addressQuery);
        addressSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Exclude the current submission itself
          if (doc.id !== selectedSubmission?.id) {
            duplicates.push({
              id: doc.id,
              name: data.name,
              address: data.address,
              location: data.location,
              matchType: 'address',
              similarity: calculateAddressSimilarity(address, data.address),
              ...data
            });
          }
        });
      } catch (addressError) {
        console.warn('⚠️ Address query failed (may need index):', addressError);
      }
      
      // Strategy 3: Search by location proximity (within 100m)
      if (location && location.lat && location.lng) {
        try {
          // Get all restaurants and filter by distance client-side
          // (Firestore doesn't support geo queries without additional setup)
          const allQuery = query(collection(db, 'eateries'), limit(500));
          const allSnapshot = await getDocs(allQuery);
          
          allSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // Exclude the current submission itself
            if (doc.id !== selectedSubmission?.id) {
              if (data.location && data.location.lat && data.location.lng) {
                const distance = calculateDistance(
                  location.lat,
                  location.lng,
                  data.location.lat,
                  data.location.lng
                );
                
                // If within 100m, it's a potential duplicate
                if (distance <= 0.1) { // 100 meters = 0.1 km
                  duplicates.push({
                    id: doc.id,
                    name: data.name,
                    address: data.address,
                    location: data.location,
                    matchType: 'location',
                    distance: distance,
                    similarity: 100 - (distance * 1000), // Convert to percentage
                    ...data
                  });
                }
              }
            }
          });
        } catch (locationError) {
          console.warn('⚠️ Location search failed:', locationError);
        }
      }
      
      // Remove duplicates and sort by similarity
      const uniqueDuplicates = duplicates.filter((dup, index, self) => 
        index === self.findIndex(d => d.id === dup.id)
      );
      
      // Sort by similarity (highest first)
      uniqueDuplicates.sort((a, b) => {
        const aSim = a.similarity || 0;
        const bSim = b.similarity || 0;
        return bSim - aSim;
      });
      
      // Limit to top 10 most similar
      const topDuplicates = uniqueDuplicates.slice(0, 10);
      
      setPotentialDuplicates(topDuplicates);
      console.log(`✅ Found ${topDuplicates.length} potential duplicates`);
      
      return topDuplicates;
    } catch (error) {
      console.error('❌ Error checking for duplicates:', error);
      setPotentialDuplicates([]);
      return [];
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Calculate name similarity (simple Levenshtein-like approach)
  const calculateNameSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    // Exact match
    if (s1 === s2) return 100;
    
    // One contains the other
    if (s1.includes(s2) || s2.includes(s1)) return 80;
    
    // Calculate word overlap
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));
    const totalWords = Math.max(words1.length, words2.length);
    
    return (commonWords.length / totalWords) * 100;
  };

  // Calculate address similarity
  const calculateAddressSimilarity = (addr1, addr2) => {
    const a1 = addr1.toLowerCase().trim();
    const a2 = addr2.toLowerCase().trim();
    
    // Exact match
    if (a1 === a2) return 100;
    
    // One contains the other
    if (a1.includes(a2) || a2.includes(a1)) return 85;
    
    // Calculate word overlap
    const words1 = a1.split(/[,\s]+/);
    const words2 = a2.split(/[,\s]+/);
    const commonWords = words1.filter(w => w.length > 2 && words2.includes(w));
    const totalWords = Math.max(words1.length, words2.length);
    
    return (commonWords.length / totalWords) * 100;
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Check for duplicates when submission modal opens
  useEffect(() => {
    if (selectedSubmission) {
      checkForDuplicates(
        selectedSubmission.name,
        selectedSubmission.address,
        selectedSubmission.location
      );
    } else {
      setPotentialDuplicates([]);
    }
  }, [selectedSubmission]);

  // Render submission details modal
  const renderSubmissionModal = () => {
    if (!selectedSubmission) return null;

    return (
      <div className="submission-modal-overlay">
        <div className="submission-modal">
          <div className="modal-header">
            <h3>Restaurant Submission Review</h3>
            <button 
              className="close-btn"
              onClick={() => setSelectedSubmission(null)}
            >
              ×
            </button>
          </div>
          
          <div className="modal-content">
            <div className="submission-info">
              <h4>Basic Information</h4>
              <div className="info-grid">
                <div><strong>Name:</strong> {selectedSubmission.name}</div>
                <div><strong>Address:</strong> {selectedSubmission.address}</div>
                <div><strong>Cuisine:</strong> {selectedSubmission.cuisineType || 'Not specified'}</div>
                <div><strong>Halal Status:</strong> {selectedSubmission.halalStatus}</div>
                <div><strong>Price Level:</strong> {'$'.repeat(selectedSubmission.priceLevel || 1)}</div>
                <div><strong>Phone:</strong> {selectedSubmission.phone || 'Not provided'}</div>
                <div><strong>Website:</strong> {selectedSubmission.website || 'Not provided'}</div>
                <div><strong>Status:</strong> 
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusBadgeColor(selectedSubmission.status) }}
                  >
                    {selectedSubmission.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              
              {selectedSubmission.description && (
                <div className="description-section">
                  <h4>Description</h4>
                  <p>{selectedSubmission.description}</p>
                </div>
              )}
              
              {selectedSubmission.userPhotos && selectedSubmission.userPhotos.length > 0 && (
                <div className="photos-section">
                  <h4>Submitted Photos ({selectedSubmission.userPhotos.length})</h4>
                  <div className="submission-photos">
                    {selectedSubmission.userPhotos.map((photo, index) => (
                      <img 
                        key={index} 
                        src={photo.data} 
                        alt={`Restaurant photo ${index + 1}`}
                        className="submission-photo"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Potential Duplicates Section */}
              <div className="duplicates-section">
                <h4>
                  🔍 Potential Duplicates in Firestore
                  {isCheckingDuplicates && <span className="checking-indicator"> (Checking...)</span>}
                </h4>
                {potentialDuplicates.length > 0 ? (
                  <div className="duplicates-warning">
                    <p className="warning-text">
                      ⚠️ Found {potentialDuplicates.length} potential duplicate(s) in Firestore database. 
                      Please review before approving.
                    </p>
                    <div className="duplicates-list">
                      {potentialDuplicates.map((dup, index) => (
                        <div key={dup.id} className="duplicate-item">
                          <div className="duplicate-header">
                            <strong>{dup.name}</strong>
                            <span className="match-badge" style={{
                              backgroundColor: dup.similarity >= 80 ? '#dc3545' : 
                                              dup.similarity >= 60 ? '#ffc107' : '#6c757d'
                            }}>
                              {dup.matchType} ({Math.round(dup.similarity)}% match)
                              {dup.distance && ` - ${Math.round(dup.distance * 1000)}m away`}
                            </span>
                          </div>
                          <div className="duplicate-details">
                            <div><strong>Address:</strong> {dup.address || 'N/A'}</div>
                            {dup.cuisineType && <div><strong>Cuisine:</strong> {dup.cuisineType}</div>}
                            {dup.status && (
                              <div><strong>Status:</strong> 
                                <span className="status-badge-small" style={{
                                  backgroundColor: dup.status === 'approved' ? '#28a745' : 
                                                  dup.status === 'rejected' ? '#dc3545' : '#ffc107'
                                }}>
                                  {dup.status}
                                </span>
                              </div>
                            )}
                            {dup.source && <div><strong>Source:</strong> {dup.source}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !isCheckingDuplicates ? (
                  <div className="no-duplicates">
                    ✅ No potential duplicates found in Firestore database.
                  </div>
                ) : null}
              </div>
              
              <div className="submission-meta">
                <h4>Submission Details</h4>
                <div className="meta-grid">
                  <div><strong>Submitted by:</strong> {selectedSubmission.createdBy || 'Unknown'}</div>
                  <div><strong>Submitted at:</strong> {formatDate(selectedSubmission.createdAt)}</div>
                  {selectedSubmission.reviewedAt && (
                    <div><strong>Reviewed at:</strong> {formatDate(selectedSubmission.reviewedAt)}</div>
                  )}
                  {selectedSubmission.rejectionReason && (
                    <div><strong>Rejection reason:</strong> {selectedSubmission.rejectionReason}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            {selectedSubmission.status === 'pending_review' && (
              <>
                <button 
                  className="btn-reject"
                  onClick={() => {
                    const reason = prompt('Please provide a reason for rejection (optional):');
                    rejectSubmission(selectedSubmission.id, reason);
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : '❌ Reject'}
                </button>
                <button 
                  className="btn-approve"
                  onClick={() => approveSubmission(selectedSubmission.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : '✅ Approve'}
                </button>
              </>
            )}
            {selectedSubmission.status === 'rejected' && (
              <button 
                className="btn-approve"
                onClick={() => approveSubmission(selectedSubmission.id)}
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
    <div className="restaurant-review-dashboard">
      <div className="dashboard-header">
        <h2>🍽️ Restaurant Submission Review</h2>
        <p>Review and approve/reject restaurant submissions from users</p>
      </div>

      <div className="dashboard-controls">
        <div className="status-filter">
          <label>Filter by status:</label>
          <select 
            value={reviewStatus} 
            onChange={(e) => setReviewStatus(e.target.value)}
          >
            <option value="all">All Submissions</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <button 
          className="refresh-btn"
          onClick={loadPendingSubmissions}
          disabled={loading}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">🔄</div>
          <p>Loading submissions...</p>
        </div>
      ) : (
        <div className="submissions-list">
          {pendingSubmissions.length === 0 ? (
            <div className="empty-state">
              <p>No submissions found for the selected status.</p>
            </div>
          ) : (
            pendingSubmissions.map((submission) => (
              <div 
                key={submission.id} 
                className="submission-card"
                onClick={() => setSelectedSubmission(submission)}
              >
                <div className="submission-header">
                  <h4>{submission.name}</h4>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusBadgeColor(submission.status) }}
                  >
                    {submission.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="submission-details">
                  <p><strong>Address:</strong> {submission.address}</p>
                  <p><strong>Cuisine:</strong> {submission.cuisineType || 'Not specified'}</p>
                  <p><strong>Submitted:</strong> {formatDate(submission.createdAt)}</p>
                  {submission.userPhotos && submission.userPhotos.length > 0 && (
                    <p><strong>Photos:</strong> {submission.userPhotos.length} submitted</p>
                  )}
                </div>
                
                <div className="submission-actions">
                  <button 
                    className="view-details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSubmission(submission);
                    }}
                  >
                    👁️ View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {renderSubmissionModal()}
    </div>
  );
};

export default RestaurantReviewDashboard;
