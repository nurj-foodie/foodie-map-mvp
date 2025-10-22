import React, { useState } from 'react';
import './EnhancedRestaurantCard.css';

const EnhancedRestaurantCard = ({ restaurant, onViewDetails, onAddReview, onShare }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // Get primary photo (user-uploaded first, then Google Places)
  const getPrimaryPhoto = () => {
    if (restaurant.userPhotos && restaurant.userPhotos.length > 0) {
      return restaurant.userPhotos[0];
    }
    if (restaurant.photos && restaurant.photos.length > 0) {
      return restaurant.photos[0];
    }
    return null;
  };

  // Get all photos for gallery
  const getAllPhotos = () => {
    const userPhotos = restaurant.userPhotos || [];
    const googlePhotos = restaurant.photos || [];
    return [...userPhotos, ...googlePhotos];
  };

  // Calculate overall rating from categories
  const getOverallRating = () => {
    if (restaurant.rating && typeof restaurant.rating === 'object') {
      const { foodQuality = 0, valueForMoney = 0, serviceQuality = 0, ambiance = 0 } = restaurant.rating;
      return ((foodQuality + valueForMoney + serviceQuality + ambiance) / 4).toFixed(1);
    }
    return restaurant.rating || 0;
  };

  // Get rating breakdown
  const getRatingBreakdown = () => {
    if (restaurant.rating && typeof restaurant.rating === 'object') {
      return {
        foodQuality: restaurant.rating.foodQuality || 0,
        valueForMoney: restaurant.rating.valueForMoney || 0,
        serviceQuality: restaurant.rating.serviceQuality || 0,
        ambiance: restaurant.rating.ambiance || 0
      };
    }
    return {
      foodQuality: 0,
      valueForMoney: 0,
      serviceQuality: 0,
      ambiance: 0
    };
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

  // Get verification status
  const getVerificationStatus = () => {
    if (restaurant.userReviews && restaurant.userReviews.length > 0) {
      const verifiedReviews = restaurant.userReviews.filter(review => review.verified);
      return {
        hasVerifiedReviews: verifiedReviews.length > 0,
        verifiedCount: verifiedReviews.length,
        totalReviews: restaurant.userReviews.length
      };
    }
    return { hasVerifiedReviews: false, verifiedCount: 0, totalReviews: 0 };
  };

  const primaryPhoto = getPrimaryPhoto();
  const allPhotos = getAllPhotos();
  const overallRating = getOverallRating();
  const ratingBreakdown = getRatingBreakdown();
  const verificationStatus = getVerificationStatus();

  return (
    <div className="enhanced-restaurant-card">
      {/* Photo Section */}
      <div className="photo-section">
        {primaryPhoto ? (
          <div className="main-photo">
            <img 
              src={primaryPhoto} 
              alt={restaurant.name}
              className="restaurant-image"
            />
            {allPhotos.length > 1 && (
              <button 
                className="photo-count-badge"
                onClick={() => setShowAllPhotos(!showAllPhotos)}
              >
                +{allPhotos.length - 1} photos
              </button>
            )}
          </div>
        ) : (
          <div className="no-photo-placeholder">
            <span className="no-photo-icon">📷</span>
            <span className="no-photo-text">No photos yet</span>
          </div>
        )}

        {/* Photo Gallery Modal */}
        {showAllPhotos && allPhotos.length > 1 && (
          <div className="photo-gallery-modal" onClick={() => setShowAllPhotos(false)}>
            <div className="photo-gallery-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-gallery" onClick={() => setShowAllPhotos(false)}>×</button>
              <div className="gallery-photos">
                {allPhotos.map((photo, index) => (
                  <img 
                    key={index}
                    src={photo} 
                    alt={`${restaurant.name} photo ${index + 1}`}
                    className="gallery-photo"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="content-section">
        {/* Restaurant Name and Basic Info */}
        <div className="restaurant-header">
          <h3 className="restaurant-name">{restaurant.name}</h3>
          <div className="restaurant-meta">
            <span className="cuisine-type">{restaurant.cuisineType || 'Restaurant'}</span>
            {restaurant.halalStatus && (
              <span className={`halal-badge ${restaurant.halalStatus}`}>
                {restaurant.halalStatus === 'halal' ? '🕌 Halal' : 
                 restaurant.halalStatus === 'pork-free' ? '🥩 Pork-Free' : 
                 restaurant.halalStatus === 'non-halal' ? '🍖 Non-Halal' : '❓ Unknown'}
              </span>
            )}
          </div>
        </div>

        {/* Rating Section */}
        <div className="rating-section">
          <div className="overall-rating">
            <div className="rating-stars">
              {renderStars(overallRating)}
            </div>
            <div className="rating-number">
              <span className="rating-value">{overallRating}</span>
              <span className="rating-max">/5.0</span>
            </div>
          </div>

          {/* Category Ratings */}
          <div className="category-ratings">
            <div className="category-rating">
              <span className="category-label">Food</span>
              <div className="category-stars">
                {renderStars(ratingBreakdown.foodQuality)}
                <span className="category-value">({ratingBreakdown.foodQuality})</span>
              </div>
            </div>
            <div className="category-rating">
              <span className="category-label">Value</span>
              <div className="category-stars">
                {renderStars(ratingBreakdown.valueForMoney)}
                <span className="category-value">({ratingBreakdown.valueForMoney})</span>
              </div>
            </div>
            <div className="category-rating">
              <span className="category-label">Service</span>
              <div className="category-stars">
                {renderStars(ratingBreakdown.serviceQuality)}
                <span className="category-value">({ratingBreakdown.serviceQuality})</span>
              </div>
            </div>
            <div className="category-rating">
              <span className="category-label">Ambiance</span>
              <div className="category-stars">
                {renderStars(ratingBreakdown.ambiance)}
                <span className="category-value">({ratingBreakdown.ambiance})</span>
              </div>
            </div>
          </div>

          {/* Review Stats */}
          <div className="review-stats">
            <span className="review-count">
              {verificationStatus.totalReviews} reviews
            </span>
            {verificationStatus.hasVerifiedReviews && (
              <span className="verified-badge">
                ✅ {verificationStatus.verifiedCount} verified
              </span>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="address-section">
          <span className="address-icon">📍</span>
          <span className="address-text">{restaurant.address}</span>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => onViewDetails(restaurant)}
          >
            View Details
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => onAddReview(restaurant)}
          >
            Add Review
          </button>
          <button 
            className="btn btn-share"
            onClick={() => onShare(restaurant)}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRestaurantCard;
