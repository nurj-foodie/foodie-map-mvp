import React, { useState, useEffect } from 'react';
import './ReviewsModal.css';

const ReviewsModal = ({
  isOpen,
  onClose,
  reviews,
  totalCount,
  onLikeReview,
  restaurantName
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('mostLiked');
  const [filterBy, setFilterBy] = useState('all');
  const [displayedReviews, setDisplayedReviews] = useState([]);

  const reviewsPerPage = 10; // Desktop: 10 reviews per page
  const totalPages = Math.ceil(totalCount / reviewsPerPage);

  // Sort and filter reviews
  useEffect(() => {
    let processedReviews = Array.isArray(reviews) ? [...reviews] : [];

    // Apply sorting
    switch (sortBy) {
      case 'mostLiked':
        processedReviews.sort((a, b) => (b.likes?.count || 0) - (a.likes?.count || 0));
        break;
      case 'latest':
        processedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'rating':
        processedReviews.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    // Apply filtering
    switch (filterBy) {
      case 'latest':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        processedReviews = processedReviews.filter(review =>
          new Date(review.createdAt) >= thirtyDaysAgo
        );
        break;
      case 'rating_5':
        processedReviews = processedReviews.filter(review => review.rating >= 5);
        break;
      case 'rating_4':
        processedReviews = processedReviews.filter(review => review.rating >= 4);
        break;
      case 'rating_3':
        processedReviews = processedReviews.filter(review => review.rating >= 3);
        break;
      default:
        break;
    }

    setDisplayedReviews(processedReviews);
    setCurrentPage(1); // Reset to first page when sorting/filtering changes
  }, [reviews, sortBy, filterBy]);

  // Get current page reviews
  const getCurrentPageReviews = () => {
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    return displayedReviews.slice(startIndex, endIndex);
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">⭐</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">⭐</span>);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }

    return stars;
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of reviews
    const reviewsContainer = document.querySelector('.reviews-list');
    if (reviewsContainer) {
      reviewsContainer.scrollTop = 0;
    }
  };

  // Handle modal close
  const handleClose = () => {
    setCurrentPage(1);
    setSortBy('mostLiked');
    setFilterBy('all');
    onClose();
  };

  if (!isOpen) return null;

  const currentReviews = getCurrentPageReviews();
  const filteredTotalPages = Math.ceil(displayedReviews.length / reviewsPerPage);

  return (
    <div className="reviews-modal-overlay" onClick={handleClose}>
      <div className="reviews-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reviews-modal-header">
          <h2>All Reviews for {restaurantName}</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <div className="reviews-modal-content">
          {/* Controls */}
          <div className="reviews-controls">
            <div className="sort-controls">
              <label>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="mostLiked">❤️ Most Liked</option>
                <option value="latest">🕒 Latest</option>
                <option value="rating">⭐ Highest Rating</option>
              </select>
            </div>

            <div className="filter-controls">
              <label>Filter by:</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Reviews</option>
                <option value="latest">Latest Reviews</option>
                <option value="rating_5">5★ Only</option>
                <option value="rating_4">4★+ Only</option>
                <option value="rating_3">3★+ Only</option>
              </select>
            </div>
          </div>

          {/* Reviews Stats */}
          <div className="reviews-stats">
            <span className="total-reviews">
              Showing {currentReviews.length} of {displayedReviews.length} reviews
            </span>
            {filterBy !== 'all' && (
              <span className="filter-indicator">
                (Filtered from {totalCount} total)
              </span>
            )}
          </div>

          {/* Reviews List */}
          <div className="reviews-list">
            {currentReviews.map(review => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <img
                      src={review.user.avatar}
                      alt={review.user.name}
                      className="reviewer-avatar"
                    />
                    <div className="reviewer-details">
                      <span className="reviewer-name">{review.user.name}</span>
                      <div className="review-rating">
                        {renderStars(review.rating)}
                        <span className="rating-number">({review.rating})</span>
                      </div>
                    </div>
                  </div>
                  <div className="review-actions">
                    <button
                      className={`like-button ${review.likes?.userLiked ? 'liked' : ''}`}
                      onClick={() => onLikeReview(review.id)}
                    >
                      ❤️ {review.likes?.count || 0}
                    </button>
                  </div>
                </div>

                <div className="review-content">
                  <p className="review-comment">{review.comment}</p>

                  {/* Category Ratings */}
                  {review.categories && (
                    <div className="category-ratings">
                      {Object.entries(review.categories).map(([category, rating]) => (
                        <div key={category} className="category-item">
                          <span className="category-name">{category}</span>
                          <span className="category-rating">{rating}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="review-details">
                    <span className="visit-type">{review.visitDetails.visitType}</span>
                    <span className="party-size">{review.visitDetails.partySize} people</span>
                    <span className="meal-type">{review.visitDetails.mealType}</span>
                    <span className="visit-date">
                      {new Date(review.visitDetails.visitDate).toLocaleDateString()}
                    </span>
                    {review.verified && <span className="verified-badge">✅ Verified</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredTotalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>

              <div className="page-numbers">
                {Array.from({ length: filteredTotalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`page-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                className="pagination-button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === filteredTotalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;
