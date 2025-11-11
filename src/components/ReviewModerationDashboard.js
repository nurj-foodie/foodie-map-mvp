import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { reviewsService } from '../services/reviewsService';
import './ReviewModerationDashboard.css';

const ReviewModerationDashboard = () => {
  const [unverifiedReviews, setUnverifiedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [filterStatus, setFilterStatus] = useState('unverified'); // unverified, verified, all
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState(new Set()); // For bulk actions

  // Load unverified reviews
  const loadReviews = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading reviews for moderation...');
      
      let reviews = [];
      
      if (filterStatus === 'all') {
        // Get all reviews
        const q = query(
          collection(db, 'reviews'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const snapshot = await getDocs(q);
        reviews = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } else if (filterStatus === 'unverified') {
        // Get unverified reviews (client-side filter since we can't query by verified field easily)
        const q = query(
          collection(db, 'reviews'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const snapshot = await getDocs(q);
        reviews = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(review => !review.verified);
      } else if (filterStatus === 'verified') {
        // Get verified reviews
        const q = query(
          collection(db, 'reviews'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const snapshot = await getDocs(q);
        reviews = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(review => review.verified === true);
      }
      
      setUnverifiedReviews(reviews);
      console.log(`✅ Loaded ${reviews.length} reviews`);
    } catch (error) {
      console.error('❌ Error loading reviews:', error);
      setUnverifiedReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [filterStatus]);

  // Approve review (verify it)
  const approveReview = async (reviewId) => {
    try {
      setIsProcessing(true);
      console.log('✅ Approving review:', reviewId);
      
      await updateDoc(doc(db, 'reviews', reviewId), {
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: 'admin'
      });

      // Reload reviews
      await loadReviews();
      setSelectedReview(null);
      
      console.log('✅ Review approved successfully');
      window.alert('✅ Review verified and approved');
    } catch (error) {
      console.error('❌ Error approving review:', error);
      window.alert('Error approving review. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk approve reviews
  const bulkApproveReviews = async () => {
    if (selectedReviews.size === 0) {
      window.alert('Please select at least one review to verify.');
      return;
    }

    if (!window.confirm(`Are you sure you want to verify ${selectedReviews.size} review(s)?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const reviewIds = Array.from(selectedReviews);
      let successCount = 0;
      let failCount = 0;

      for (const reviewId of reviewIds) {
        try {
          await updateDoc(doc(db, 'reviews', reviewId), {
            verified: true,
            verifiedAt: new Date(),
            verifiedBy: 'admin'
          });
          successCount++;
        } catch (error) {
          console.error(`Error approving review ${reviewId}:`, error);
          failCount++;
        }
      }

      setSelectedReviews(new Set());
      await loadReviews();
      
      window.alert(`✅ Verified ${successCount} review(s)${failCount > 0 ? `, ${failCount} failed` : ''}`);
    } catch (error) {
      console.error('❌ Error in bulk approve:', error);
      window.alert('Error during bulk verification. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk reject reviews
  const bulkRejectReviews = async () => {
    if (selectedReviews.size === 0) {
      window.alert('Please select at least one review to delete.');
      return;
    }

    const reason = window.prompt(`Please provide a reason for deleting ${selectedReviews.size} review(s) (optional):`);
    if (reason === null) return; // User cancelled

    if (!window.confirm(`Are you sure you want to delete ${selectedReviews.size} review(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const reviewIds = Array.from(selectedReviews);
      let successCount = 0;
      let failCount = 0;

      for (const reviewId of reviewIds) {
        try {
          await deleteDoc(doc(db, 'reviews', reviewId));
          successCount++;
        } catch (error) {
          console.error(`Error rejecting review ${reviewId}:`, error);
          failCount++;
        }
      }

      setSelectedReviews(new Set());
      await loadReviews();
      
      window.alert(`❌ Deleted ${successCount} review(s)${failCount > 0 ? `, ${failCount} failed` : ''}`);
    } catch (error) {
      console.error('❌ Error in bulk reject:', error);
      window.alert('Error during bulk deletion. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle review selection
  const toggleReviewSelection = (reviewId) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  // Select all visible reviews
  const selectAllReviews = () => {
    const allIds = unverifiedReviews.map(review => review.id);
    setSelectedReviews(new Set(allIds));
  };

  // Deselect all reviews
  const deselectAllReviews = () => {
    setSelectedReviews(new Set());
  };

  // Reject review (delete it)
  const rejectReview = async (reviewId, reason = '') => {
    try {
      setIsProcessing(true);
      console.log('❌ Rejecting review:', reviewId);
      
      if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        await deleteDoc(doc(db, 'reviews', reviewId));

        // Reload reviews
        await loadReviews();
        setSelectedReview(null);
        
        console.log('❌ Review deleted successfully');
        window.alert('❌ Review deleted');
      }
    } catch (error) {
      console.error('❌ Error rejecting review:', error);
      window.alert('Error deleting review. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  // Render stars
  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  // Render review details modal
  const renderReviewModal = () => {
    if (!selectedReview) return null;

    return (
      <div className="review-modal-overlay" onClick={() => setSelectedReview(null)}>
        <div className="review-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Review Moderation</h3>
            <button 
              className="close-btn"
              onClick={() => setSelectedReview(null)}
            >
              ×
            </button>
          </div>
          
          <div className="modal-content">
            <div className="review-info">
              <h4>Review Information</h4>
              <div className="info-grid">
                <div><strong>Restaurant:</strong> {selectedReview.restaurantName}</div>
                <div><strong>Restaurant ID:</strong> {selectedReview.restaurantId}</div>
                <div><strong>Rating:</strong> {renderStars(selectedReview.rating)} ({selectedReview.rating}/5)</div>
                <div><strong>User:</strong> {selectedReview.userName || 'Anonymous'}</div>
                <div><strong>Submitted at:</strong> {formatDate(selectedReview.createdAt)}</div>
                <div><strong>Status:</strong> 
                  <span className={`status-badge ${selectedReview.verified ? 'verified' : 'unverified'}`}>
                    {selectedReview.verified ? '✅ Verified' : '⏳ Unverified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="review-content">
              <h4>Review Content</h4>
              <div className="review-comment">
                <p>{selectedReview.comment || 'No comment provided'}</p>
              </div>
            </div>

            {selectedReview.photos && selectedReview.photos.length > 0 && (
              <div className="review-photos">
                <h4>Review Photos ({selectedReview.photos.length})</h4>
                <div className="photos-grid">
                  {selectedReview.photos.map((photo, index) => (
                    <img 
                      key={index} 
                      src={photo.data || photo.url} 
                      alt={`Review photo ${index + 1}`}
                      className="review-photo"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="review-stats">
              <h4>Review Statistics</h4>
              <div className="stats-grid">
                <div><strong>Helpful:</strong> {selectedReview.helpful || 0}</div>
                <div><strong>Likes:</strong> {selectedReview.likes?.length || 0}</div>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            {!selectedReview.verified && (
              <>
                <button 
                  className="btn-reject"
                  onClick={() => {
                    const reason = window.prompt('Please provide a reason for rejection (optional):');
                    rejectReview(selectedReview.id, reason);
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : '❌ Delete Review'}
                </button>
                <button 
                  className="btn-approve"
                  onClick={() => approveReview(selectedReview.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : '✅ Verify Review'}
                </button>
              </>
            )}
            {selectedReview.verified && (
              <button 
                className="btn-reject"
                onClick={() => {
                  const reason = window.prompt('Please provide a reason for unverifying (optional):');
                  // Unverify review
                  updateDoc(doc(db, 'reviews', selectedReview.id), {
                    verified: false,
                    verifiedAt: null,
                    verifiedBy: null
                  }).then(() => {
                    loadReviews();
                    setSelectedReview(null);
                    window.alert('Review unverified');
                  });
                }}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : '🔄 Unverify Review'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="review-moderation-dashboard">
      <div className="dashboard-header">
        <h2>📝 Review Moderation</h2>
        <p>Review and verify user-submitted restaurant reviews</p>
      </div>

      <div className="dashboard-controls">
        <div className="status-filter">
          <label>Filter by status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setSelectedReviews(new Set()); // Clear selection when filter changes
            }}
          >
            <option value="unverified">Unverified</option>
            <option value="verified">Verified</option>
            <option value="all">All Reviews</option>
          </select>
        </div>

        {selectedReviews.size > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">{selectedReviews.size} selected</span>
            <button 
              className="bulk-approve-btn"
              onClick={bulkApproveReviews}
              disabled={isProcessing || filterStatus !== 'unverified'}
            >
              ✅ Verify Selected
            </button>
            <button 
              className="bulk-reject-btn"
              onClick={bulkRejectReviews}
              disabled={isProcessing || filterStatus !== 'unverified'}
            >
              ❌ Delete Selected
            </button>
            <button 
              className="deselect-btn"
              onClick={deselectAllReviews}
            >
              Clear Selection
            </button>
          </div>
        )}
        
        <button 
          className="refresh-btn"
          onClick={loadReviews}
          disabled={loading}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">🔄</div>
          <p>Loading reviews...</p>
        </div>
      ) : (
        <div className="reviews-list">
          {unverifiedReviews.length === 0 ? (
            <div className="empty-state">
              <p>No reviews found for the selected status.</p>
            </div>
          ) : (
            <>
              {filterStatus === 'unverified' && unverifiedReviews.length > 0 && (
                <div className="select-all-controls">
                  <label className="select-all-label">
                    <input
                      type="checkbox"
                      checked={selectedReviews.size === unverifiedReviews.length && unverifiedReviews.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllReviews();
                        } else {
                          deselectAllReviews();
                        }
                      }}
                    />
                    <span>Select All ({unverifiedReviews.length})</span>
                  </label>
                </div>
              )}
              {unverifiedReviews.map((review) => (
                <div 
                  key={review.id} 
                  className={`review-card ${selectedReviews.has(review.id) ? 'selected' : ''}`}
                  onClick={() => {
                    if (filterStatus === 'unverified') {
                      toggleReviewSelection(review.id);
                    } else {
                      setSelectedReview(review);
                    }
                  }}
                >
                  {filterStatus === 'unverified' && (
                    <div className="review-checkbox" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedReviews.has(review.id)}
                        onChange={() => toggleReviewSelection(review.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div className="review-header">
                    <div className="review-restaurant">
                      <h4>{review.restaurantName}</h4>
                      <div className="review-rating">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <span className={`status-badge ${review.verified ? 'verified' : 'unverified'}`}>
                      {review.verified ? '✅ Verified' : '⏳ Unverified'}
                    </span>
                  </div>
                
                <div className="review-details">
                  <p className="review-comment-preview">
                    {review.comment ? (review.comment.length > 150 ? review.comment.substring(0, 150) + '...' : review.comment) : 'No comment'}
                  </p>
                  <div className="review-meta">
                    <p><strong>By:</strong> {review.userName || 'Anonymous'}</p>
                    <p><strong>Date:</strong> {formatDate(review.createdAt)}</p>
                    {review.photos && review.photos.length > 0 && (
                      <p><strong>Photos:</strong> {review.photos.length}</p>
                    )}
                  </div>
                </div>
                
                <div className="review-actions">
                  <button 
                    className="view-details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReview(review);
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

      {renderReviewModal()}
    </div>
  );
};

export default ReviewModerationDashboard;

