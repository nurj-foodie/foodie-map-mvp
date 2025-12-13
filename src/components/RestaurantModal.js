import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import FavoriteButton from './FavoriteButton';
import { useAuth } from '../contexts/AuthContext';
import { checkInService } from '../services/checkInService';
import { reviewsService } from '../services/reviewsService';
import ReviewsModal from './ReviewsModal';
import AddReviewModal from './AddReviewModal';
import EditRestaurantModal from './EditRestaurantModal';
import './RestaurantModal.css';

// Restaurant Modal - Redesigned with Dark Theme
const RestaurantModal = ({ isOpen, onClose, restaurant }) => {
  const { user } = useAuth();
  const [fullRestaurantData, setFullRestaurantData] = useState(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [photos, setPhotos] = useState({ user: [], google: [] });
  const [reviews, setReviews] = useState([]);
  const [checkIns, setCheckIns] = useState([]);

  // Fetch restaurant data from Firestore
  const fetchRestaurantFromFirestore = useCallback(async () => {
    if (!restaurant) {
      setFullRestaurantData(null);
      return;
    }

    const restaurantId = restaurant.place_id || restaurant.placeId || restaurant.id;

    if (!restaurantId) {
      console.warn('⚠️ No restaurant ID found, using provided restaurant data');
      setFullRestaurantData(restaurant);
      return;
    }

    setIsLoadingRestaurant(true);
    try {
      const restaurantRef = doc(db, 'eateries', restaurantId);
      const restaurantSnap = await getDoc(restaurantRef);

      if (restaurantSnap.exists()) {
        const firestoreData = restaurantSnap.data();
        setFullRestaurantData({
          ...restaurant,
          ...firestoreData,
          id: restaurantSnap.id,
          place_id: restaurantId,
          placeId: restaurantId
        });
      } else {
        setFullRestaurantData(restaurant);
      }
    } catch (error) {
      console.error('❌ Error fetching restaurant from Firestore:', error);
      setFullRestaurantData(restaurant);
    } finally {
      setIsLoadingRestaurant(false);
    }
  }, [restaurant]);

  // Load photos, reviews, and check-ins
  useEffect(() => {
    if (isOpen && restaurant) {
      fetchRestaurantFromFirestore();
      loadPhotos();
      loadReviews();
      loadCheckIns();
    } else {
      // Reset state when modal closes
      setPhotos({ user: [], google: [] });
      setReviews([]);
      setCheckIns([]);
    }
  }, [isOpen, restaurant, fetchRestaurantFromFirestore]);

  const loadPhotos = () => {
    try {
      const restaurantData = fullRestaurantData || restaurant;
      if (!restaurantData) {
        setPhotos({ user: [], google: [] });
        return;
      }

      let userPhotos = restaurantData.userPhotos || [];
      let googlePhotos = restaurantData.photos || [];

      // Parse if stored as JSON strings
      if (typeof userPhotos === 'string') {
        try { userPhotos = JSON.parse(userPhotos); } catch (e) { userPhotos = []; }
      }
      if (typeof googlePhotos === 'string') {
        try { googlePhotos = JSON.parse(googlePhotos); } catch (e) { googlePhotos = []; }
      }

      if (!Array.isArray(userPhotos)) userPhotos = [];
      if (!Array.isArray(googlePhotos)) googlePhotos = [];

      const formattedUser = userPhotos.map(photo => photo.data || photo.url).filter(Boolean);
      const formattedGoogle = googlePhotos
        .filter(p => typeof p === 'string' ? (p.trim() && p !== '[ ]' && p !== '[]') : p?.url || p?.photo_reference?.startsWith?.('http'))
        .map(p => typeof p === 'string' ? p : (p.url || p.photo_reference));

      setPhotos({ user: formattedUser, google: formattedGoogle });
    } catch (error) {
      console.error('Error loading photos:', error);
      setPhotos({ user: [], google: [] });
    }
  };

  const loadReviews = async () => {
    const restaurantId = (fullRestaurantData || restaurant).place_id || (fullRestaurantData || restaurant).id;
    if (!restaurantId) {
      setReviews([]);
      return;
    }

    try {
      const result = await reviewsService.getRestaurantReviews(restaurantId, 3);
      setReviews(result.reviews || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]); // Ensure reviews is always an array
    }
  };

  const loadCheckIns = async () => {
    const restaurantId = (fullRestaurantData || restaurant).place_id || (fullRestaurantData || restaurant).id;
    if (!restaurantId) {
      setCheckIns([]);
      return;
    }

    try {
      const result = await checkInService.getRestaurantCheckIns(restaurantId, 2);
      setCheckIns(result.checkIns || []);
    } catch (error) {
      console.error('Error loading check-ins:', error);
      setCheckIns([]); // Ensure checkIns is always an array
    }
  };

  const displayRestaurant = fullRestaurantData || restaurant;

  if (!isOpen || !restaurant) return null;

  // Get primary photo URL
  const getPrimaryPhotoUrl = () => {
    if (photos.user.length > 0) return photos.user[0];
    if (photos.google.length > 0) return photos.google[0];
    return null;
  };

  // Get rating
  const getRating = () => {
    if (typeof displayRestaurant.rating === 'object') {
      const { foodQuality = 0, valueForMoney = 0, serviceQuality = 0, ambiance = 0 } = displayRestaurant.rating;
      return ((foodQuality + valueForMoney + serviceQuality + ambiance) / 4).toFixed(1);
    }
    return displayRestaurant.rating || 0;
  };

  // Get rating breakdown
  const getRatingBreakdown = () => {
    if (typeof displayRestaurant.rating === 'object') {
      return {
        'Food Quality': displayRestaurant.rating.foodQuality || 0,
        'Value for Money': displayRestaurant.rating.valueForMoney || 0,
        'Service': displayRestaurant.rating.serviceQuality || 0,
        'Ambiance': displayRestaurant.rating.ambiance || 0
      };
    }
    return {};
  };

  // Handle navigate
  const handleNavigate = () => {
    if (displayRestaurant.location?.lat && displayRestaurant.location?.lng) {
      const lat = typeof displayRestaurant.location.lat === 'function' ? displayRestaurant.location.lat() : displayRestaurant.location.lat;
      const lng = typeof displayRestaurant.location.lng === 'function' ? displayRestaurant.location.lng() : displayRestaurant.location.lng;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  // Handle check-in
  const handleCheckIn = async () => {
    if (!user) {
      alert('Please sign in to check in to restaurants');
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // Calculate distance
      const R = 6371e3;
      const φ1 = userLocation.lat * Math.PI / 180;
      const φ2 = displayRestaurant.location.lat * Math.PI / 180;
      const Δφ = (displayRestaurant.location.lat - userLocation.lat) * Math.PI / 180;
      const Δλ = (displayRestaurant.location.lng - userLocation.lng) * Math.PI / 180;
      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance > 100) {
        alert(`You're ${distance.toFixed(0)}m away. Please get closer (within 100m) to check in.`);
        return;
      }

      const result = await checkInService.addCheckIn(user.uid, displayRestaurant, userLocation, distance);
      if (result.success) {
        alert(`✅ Checked in successfully! (${distance.toFixed(0)}m away)`);
        loadCheckIns();
      }
    } catch (error) {
      alert('❌ Failed to get location. Please enable location services.');
    }
  };

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: displayRestaurant.name || 'Restaurant',
      text: `Check out ${displayRestaurant.name} - ${displayRestaurant.address || ''}`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        const text = `${displayRestaurant.name}\\n${displayRestaurant.address}\\n${window.location.href}`;
        await navigator.clipboard.writeText(text);
        alert('✅ Restaurant info copied to clipboard!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        alert('Failed to share. Please try again.');
      }
    }
  };

  const primaryPhoto = getPrimaryPhotoUrl();
  const rating = getRating();
  const ratingBreakdown = getRatingBreakdown();
  const totalReviews = Array.isArray(reviews) ? reviews.length : 0;

  return (
    <>
      <div className="restaurant-modal-overlay" onClick={onClose}>
        <div className="restaurant-modal-content" onClick={(e) => e.stopPropagation()}>
          {isLoadingRestaurant ? (
            <div className="modal-loading">
              <div className="loading-spinner"></div>
              <p>Loading restaurant details...</p>
            </div>
          ) : (
            <>
              {/* Hero Section */}
              <div className="modal-hero" style={{ backgroundImage: primaryPhoto ? `url(${primaryPhoto})` : 'none' }}>
                <div className="modal-hero-overlay">
                  <button className="modal-close-btn" onClick={onClose}>✕</button>
                  <div className="modal-hero-favorite">
                    <FavoriteButton restaurant={displayRestaurant} />
                  </div>
                  <div className="modal-hero-content">
                    <h1 className="modal-restaurant-name">{displayRestaurant.name || 'Restaurant'}</h1>
                    <div className="modal-rating-display">
                      <span className="modal-stars">{'⭐'.repeat(Math.round(rating))}</span>
                      <span className="modal-rating-text">{rating} ({totalReviews} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="modal-body">
                {/* Status Bar */}
                <div className="modal-status-bar">
                  <span className="status-indicator">
                    <span className="status-dot status-open"></span>
                    Open
                  </span>
                  <span className="status-hours">Closes at 10 PM</span>
                </div>

                {/* Quick Actions */}
                <div className="modal-quick-actions">
                  <button className="action-btn action-btn-primary" onClick={handleNavigate}>
                    <span className="action-icon">🧭</span>
                    <span>Navigate</span>
                  </button>
                  <button className="action-btn action-btn-secondary" onClick={handleCheckIn}>
                    <span className="action-icon">📍</span>
                    <span>Check In</span>
                  </button>
                  <button className="action-btn action-btn-secondary" onClick={() => setShowAddReviewModal(true)}>
                    <span className="action-icon">⭐</span>
                    <span>Add Review</span>
                  </button>
                  <button className="action-btn action-btn-secondary" onClick={handleShare}>
                    <span className="action-icon">📤</span>
                    <span>Share</span>
                  </button>
                </div>

                {/* Address */}
                {displayRestaurant.address && (
                  <div className="modal-section">
                    <div className="section-header">
                      <span className="section-icon">📍</span>
                      <h3 className="section-title">Address</h3>
                    </div>
                    <p className="address-text">{displayRestaurant.address}</p>
                    <button className="view-map-link" onClick={handleNavigate}>View on Map →</button>
                  </div>
                )}

                {/* Rating Breakdown */}
                {Object.keys(ratingBreakdown).length > 0 && (
                  <div className="modal-section">
                    <div className="section-header">
                      <span className="section-icon">⭐</span>
                      <h3 className="section-title">Rating Breakdown</h3>
                    </div>
                    <div className="rating-breakdown">
                      {Object.entries(ratingBreakdown).map(([category, value]) => (
                        <div key={category} className="rating-category">
                          <span className="category-label">{category}</span>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${(value / 5) * 100}%` }}></div>
                          </div>
                          <span className="category-value">{value.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                {(displayRestaurant.phone || displayRestaurant.website) && (
                  <div className="modal-section">
                    <div className="section-header">
                      <span className="section-icon">📞</span>
                      <h3 className="section-title">Contact</h3>
                    </div>
                    <div className="contact-info">
                      {displayRestaurant.phone && (
                        <div className="contact-item">
                          <span className="contact-icon">📱</span>
                          <a href={`tel:${displayRestaurant.phone}`} className="contact-link">{displayRestaurant.phone}</a>
                        </div>
                      )}
                      {displayRestaurant.website && (
                        <div className="contact-item">
                          <span className="contact-icon">🌐</span>
                          <a href={displayRestaurant.website} target="_blank" rel="noreferrer" className="contact-link">Visit Website</a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Photos Gallery */}
                {(photos.user.length > 0 || photos.google.length > 0) && (
                  <div className="modal-section">
                    <div className="section-header">
                      <span className="section-icon">📸</span>
                      <h3 className="section-title">Photos</h3>
                      <span className="photo-count">({photos.user.length + photos.google.length})</span>
                    </div>
                    <div className="photos-gallery">
                      {[...photos.user, ...photos.google].map((photo, index) => (
                        <div key={index} className="gallery-photo">
                          <img src={photo} alt={`Photo ${index + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {reviews.length > 0 && (
                  <div className="modal-section">
                    <div className="section-header">
                      <span className="section-icon">💬</span>
                      <h3 className="section-title">Reviews</h3>
                    </div>
                    <div className="reviews-list">
                      {Array.isArray(reviews) && reviews.slice(0, 3).map(review => (
                        <div key={review.id} className="review-card">
                          <div className="review-header">
                            <div className="review-avatar">{review.userName?.[0] || 'A'}</div>
                            <div className="review-meta">
                              <div className="review-user">{review.userName || 'Anonymous'}</div>
                              <div className="review-rating">{'⭐'.repeat(review.rating || 0)}</div>
                            </div>
                          </div>
                          <p className="review-comment">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                    {totalReviews > 3 && (
                      <button className="view-all-btn" onClick={() => setShowReviewsModal(true)}>
                        View All {totalReviews} Reviews →
                      </button>
                    )}
                  </div>
                )}

                {/* Check-ins */}
                {checkIns.length > 0 && (
                  <div className="modal-section">
                    <div className="section-header">
                      <span className="section-icon">📍</span>
                      <h3 className="section-title">Recent Check-ins</h3>
                    </div>
                    <div className="checkins-list">
                      {Array.isArray(checkIns) && checkIns.slice(0, 2).map(checkIn => (
                        <div key={checkIn.id} className="checkin-item">
                          <div className="checkin-avatar">{checkIn.userName?.[0] || 'A'}</div>
                          <div className="checkin-info">
                            <span className="checkin-user">{checkIn.userName || 'Anonymous'}</span>
                            {checkIn.verified && <span className="verified-badge">✓</span>}
                          </div>
                          <span className="checkin-time">
                            {checkIn.timestamp?.toDate ? new Date(checkIn.timestamp.toDate()).toLocaleTimeString() : 'Recently'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <ReviewsModal
        isOpen={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        reviews={reviews}
        totalCount={totalReviews}
        restaurantName={displayRestaurant?.name || 'Restaurant'}
        onLikeReview={(reviewId) => console.log('Like review:', reviewId)}
      />
      <AddReviewModal
        isOpen={showAddReviewModal}
        onClose={() => setShowAddReviewModal(false)}
        restaurant={displayRestaurant}
        onReviewSubmitted={() => {
          setShowAddReviewModal(false);
          loadReviews();
        }}
      />
      <EditRestaurantModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        restaurant={displayRestaurant}
        onEditSubmitted={() => {
          setShowEditModal(false);
          fetchRestaurantFromFirestore();
        }}
      />
    </>
  );
};

export default RestaurantModal;
