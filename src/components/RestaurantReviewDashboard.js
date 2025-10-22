import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './RestaurantReviewDashboard.css';

const RestaurantReviewDashboard = () => {
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('all'); // all, pending, approved, rejected
  const [isProcessing, setIsProcessing] = useState(false);

  // Load pending restaurant submissions
  const loadPendingSubmissions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading pending restaurant submissions...');
      
      // Get all submissions and filter client-side to avoid composite index requirement
      const q = query(
        collection(db, 'eateries'),
        orderBy('createdAt', 'desc'),
        limit(100) // Get more records to filter client-side
      );
      
      const snapshot = await getDocs(q);
      let submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter client-side based on review status
      if (reviewStatus === 'all') {
        submissions = submissions.filter(sub => 
          ['pending_review', 'approved', 'rejected'].includes(sub.status)
        );
      } else {
        submissions = submissions.filter(sub => sub.status === reviewStatus);
      }
      
      // Limit to 50 after filtering
      submissions = submissions.slice(0, 50);
      
      setPendingSubmissions(submissions);
      console.log(`✅ Loaded ${submissions.length} submissions`);
    } catch (error) {
      console.error('❌ Error loading submissions:', error);
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
