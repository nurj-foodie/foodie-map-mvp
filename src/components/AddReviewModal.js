import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { reviewsService } from '../services/reviewsService';
import './AddReviewModal.css';

const AddReviewModal = ({ isOpen, onClose, restaurant, onReviewSubmitted }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !restaurant) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please sign in to write a review');
      return;
    }

    if (!comment.trim()) {
      setError('Please enter your review comment');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await reviewsService.submitReview(user.uid, restaurant, {
        rating,
        comment: comment.trim(),
        userName: user.displayName || user.email || 'Anonymous',
        userPhotoURL: user.photoURL || null
      });

      if (result.success) {
        // Reset form
        setRating(5);
        setComment('');
        setError('');
        
        // Notify parent component
        if (onReviewSubmitted) {
          onReviewSubmitted(result.review);
        }
        
        // Close modal
        onClose();
        
        // Show success message
        alert('✅ Review submitted successfully! Thank you for your feedback.');
      } else {
        setError(result.error || 'Failed to submit review. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentRating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={`star-button ${star <= currentRating ? 'filled' : ''}`}
        onClick={() => setRating(star)}
        disabled={isSubmitting}
      >
        ⭐
      </button>
    ));
  };

  return (
    <div className="add-review-modal-overlay" onClick={onClose}>
      <div className="add-review-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="add-review-modal-header">
          <h2>📝 Write a Review</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="add-review-restaurant-info">
          <h3>{restaurant.name}</h3>
          <p>{restaurant.address || 'Address not available'}</p>
        </div>

        <form onSubmit={handleSubmit} className="add-review-form">
          {error && (
            <div className="add-review-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Your Rating</label>
            <div className="star-rating">
              {renderStars(rating)}
              <span className="rating-text">{rating} out of 5</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="comment">Your Review</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience at this restaurant..."
              rows={5}
              required
              disabled={isSubmitting}
              maxLength={1000}
            />
            <div className="character-count">
              {comment.length}/1000 characters
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReviewModal;

