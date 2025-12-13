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

// Mock Data for Demo
const MOCK_DATA = {
  rating: {
    foodQuality: 4.8,
    valueForMoney: 4.5,
    serviceQuality: 4.7,
    ambiance: 4.9
  },
  reviews: [
    {
      id: 'mock1',
      userName: 'Sarah Tan',
      userAvatar: 'https://ui-avatars.com/api/?name=Sarah+Tan&background=D4AF37&color=fff',
      rating: 5,
      comment: 'Absolutely amazing dry chili pan mee! The texture of the noodles was perfect, springy and consistent. The chili had just the right amount of kick without being overwhelming.',
      date: '2 days ago'
    },
    {
      id: 'mock2',
      userName: 'John Lee',
      userAvatar: 'https://ui-avatars.com/api/?name=John+Lee&background=333&color=fff',
      rating: 4,
      comment: 'Great atmosphere and friendly staff. The waiting time was a bit long during peak hours but definitely worth the wait.',
      date: '1 week ago'
    },
    {
      id: 'mock3',
      userName: 'Emily Chen',
      userAvatar: 'https://ui-avatars.com/api/?name=Emily+Chen&background=D4AF37&color=fff',
      rating: 5,
      comment: 'Best spot for late night supper. The ambiance is cozy and the food consistently good.',
      date: '2 weeks ago'
    }
  ],
  checkIns: [
    {
      id: 'c1',
      userName: 'David Wong',
      timestamp: { toDate: () => new Date(Date.now() - 1000 * 60 * 30) }, // 30 mins ago
      verified: true
    },
    {
      id: 'c2',
      userName: 'Alicia Keys',
      timestamp: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 2) }, // 2 hours ago
      verified: true
    }
  ]
};

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

    // Always fallback to mock data initially if needed, or if no ID
    if (!restaurantId) {
      setReviews(MOCK_DATA.reviews);
      return;
    }

    try {
      const result = await reviewsService.getRestaurantReviews(restaurantId, 3);
      if (result.reviews && result.reviews.length > 0) {
        setReviews(result.reviews);
      } else {
        setReviews(MOCK_DATA.reviews); // Force mock data if empty
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews(MOCK_DATA.reviews);
    }
  };

  const loadCheckIns = async () => {
    const restaurantId = (fullRestaurantData || restaurant).place_id || (fullRestaurantData || restaurant).id;
    if (!restaurantId) {
      setCheckIns(MOCK_DATA.checkIns);
      return;
    }

    try {
      const result = await checkInService.getRestaurantCheckIns(restaurantId, 2);
      if (result.checkIns && result.checkIns.length > 0) {
        setCheckIns(result.checkIns);
      } else {
        setCheckIns(MOCK_DATA.checkIns); // Force mock data
      }
    } catch (error) {
      console.error('Error loading check-ins:', error);
      setCheckIns(MOCK_DATA.checkIns);
    }
  };

  const displayRestaurant = fullRestaurantData || restaurant;

  if (!isOpen || !restaurant) return null;

  // Get primary photo URL
  const getPrimaryPhotoUrl = () => {
    if (photos.user.length > 0) return photos.user[0];
    if (photos.google.length > 0) return photos.google[0];
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'; // Fallback Hero
  };

  // Get rating with fallback
  const getRating = () => {
    if (displayRestaurant.rating) {
      if (typeof displayRestaurant.rating === 'object') {
        const { foodQuality = 0, valueForMoney = 0, serviceQuality = 0, ambiance = 0 } = displayRestaurant.rating;
        const avg = (foodQuality + valueForMoney + serviceQuality + ambiance) / 4;
        return avg > 0 ? avg.toFixed(1) : '4.8';
      }
      return displayRestaurant.rating || '4.8';
    }
    return '4.8'; // Mock rating
  };

  // Get rating breakdown with fallback
  const getRatingBreakdown = () => {
    const data = fullRestaurantData || restaurant;
    if (data.rating && typeof data.rating === 'object' && Object.keys(data.rating).length > 0) {
      return {
        'Food Quality': data.rating.foodQuality || 4.5,
        'Value for Money': data.rating.valueForMoney || 4.0,
        'Service': data.rating.serviceQuality || 4.2,
        'Ambiance': data.rating.ambiance || 4.3
      };
    }
    return MOCK_DATA.rating; // Mock ratings
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

    // try {
    //   const position = await new Promise((resolve, reject) => {
    //     navigator.geolocation.getCurrentPosition(resolve, reject, {
    //       enableHighAccuracy: true,
    //       timeout: 10000,
    //       maximumAge: 300000
    //     });
    //   });

    //   const userLocation = {
    //     lat: position.coords.latitude,
    //     lng: position.coords.longitude
    //   };

    //   // Calculate distance
    //   const R = 6371e3;
    //   const φ1 = userLocation.lat * Math.PI / 180;
    //   const φ2 = displayRestaurant.location.lat * Math.PI / 180;
    //   const Δφ = (displayRestaurant.location.lat - userLocation.lat) * Math.PI / 180;
    //   const Δλ = (displayRestaurant.location.lng - userLocation.lng) * Math.PI / 180;
    //   const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    //   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //   const distance = R * c;

    //   if (distance > 100) {
    //     alert(`You're ${distance.toFixed(0)}m away. Please get closer (within 100m) to check in.`);
    //     return;
    //   }

    //   const result = await checkInService.addCheckIn(user.uid, displayRestaurant, userLocation, distance);
    //   if (result.success) {
    //     alert(`✅ Checked in successfully! (${distance.toFixed(0)}m away)`);
    //     loadCheckIns();
    //   }
    // } catch (error) {
    //   alert('❌ Failed to get location. Please enable location services.');
    // }
    alert('Mock Check-in successful!');
  };

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: displayRestaurant.name || 'Restaurant',
      text: `Check out ${displayRestaurant.name} - ${displayRestaurant.address || ''}`,
      url: window.location.href
    };

    try {
      // if (navigator.share && navigator.canShare?.(shareData)) {
      //   await navigator.share(shareData);
      // } else {
      // const text = `${displayRestaurant.name}\n${displayRestaurant.address}\n${window.location.href}`;
      await navigator.clipboard.writeText(shareData.url);
      alert('✅ Restaurant info copied to clipboard!');
      // }
    } catch (error) {
      // if (error.name !== 'AbortError') {
      console.log('Share failed', error);
      // }
    }
  };

  const primaryPhoto = getPrimaryPhotoUrl();
  const rating = getRating();
  const ratingBreakdown = getRatingBreakdown();
  const totalReviews = Array.isArray(reviews) ? reviews.length : MOCK_DATA.reviews.length;

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
              <div className="modal-hero" style={{ backgroundImage: `url(${primaryPhoto})` }}>
                <div className="modal-hero-overlay">
                  <button className="modal-close-btn" onClick={onClose}>✕</button>
                  <div className="modal-hero-favorite">
                    <FavoriteButton restaurant={displayRestaurant} />
                  </div>
                  <div className="modal-hero-content">
                    <h1 className="modal-restaurant-name">{displayRestaurant.name || 'Restaurant Name'}</h1>
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
                    Open Now
                  </span>
                  <span className="status-hours">Closes at 10:00 PM</span>
                </div>

                {/* Quick Actions (Design Update) */}
                <div className="modal-quick-actions">
                  <button className="action-btn action-btn-primary" onClick={handleNavigate}>
                    <span className="action-icon">🧭</span>
                    <span>Navigate</span>
                  </button>
                  <button className="action-btn action-btn-glass" onClick={handleCheckIn}>
                    <span className="action-icon">📍</span>
                    <span>Check In</span>
                  </button>
                  <button className="action-btn action-btn-glass" onClick={() => setShowAddReviewModal(true)}>
                    <span className="action-icon">⭐</span>
                    <span>Review</span>
                  </button>
                  <button className="action-btn action-btn-glass" onClick={handleShare}>
                    <span className="action-icon">📤</span>
                    <span>Share</span>
                  </button>
                </div>

                {/* Address */}
                <div className="modal-section">
                  <div className="section-header">
                    <span className="section-icon">📍</span>
                    <h3 className="section-title">Address</h3>
                  </div>
                  <p className="address-text">{displayRestaurant.address || '123 Foodie Lane, Culinary District'}</p>
                </div>

                {/* Rating Breakdown */}
                <div className="modal-section">
                  <div className="section-header">
                    <span className="section-icon">📊</span>
                    <h3 className="section-title">Rating Breakdown</h3>
                  </div>
                  <div className="rating-breakdown">
                    {Object.entries(ratingBreakdown).map(([category, value]) => (
                      <div key={category} className="rating-category">
                        <span className="category-label">{category}</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${(value / 5) * 100}%` }}></div>
                        </div>
                        <span className="category-value">{value.toString().slice(0, 3)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photos Gallery (Mock if empty) */}
                <div className="modal-section">
                  <div className="section-header">
                    <span className="section-icon">📸</span>
                    <h3 className="section-title">Photos</h3>
                  </div>
                  <div className="photos-gallery">
                    {(photos.user.length + photos.google.length) > 0 ?
                      [...photos.user, ...photos.google].map((photo, index) => (
                        <div key={index} className="gallery-photo">
                          <img src={photo} alt={`Photo ${index + 1}`} />
                        </div>
                      )) :
                      // Mock Photos
                      [1, 2, 3, 4].map(i => (
                        <div key={i} className="gallery-photo">
                          <img src={`https://source.unsplash.com/random/200x200?food&sig=${i}`} alt="Mock Food" />
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Reviews */}
                <div className="modal-section">
                  <div className="section-header">
                    <span className="section-icon">💬</span>
                    <h3 className="section-title">Reviews</h3>
                  </div>
                  <div className="reviews-list">
                    {reviews.slice(0, 3).map((review, i) => (
                      <div key={review.id || i} className="review-card">
                        <div className="review-header">
                          <div className="review-avatar">
                            {review.userAvatar ? <img src={review.userAvatar} alt="ava" /> : (review.userName?.[0] || 'A')}
                          </div>
                          <div className="review-meta">
                            <div className="review-user">{review.userName || 'Anonymous'}</div>
                            <div className="review-rating">{'⭐'.repeat(review.rating || 0)}</div>
                          </div>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                  <button className="view-all-btn" onClick={() => setShowReviewsModal(true)}>
                    View All Reviews →
                  </button>
                </div>

                {/* Check-ins */}
                <div className="modal-section" style={{ paddingBottom: '40px' }}>
                  <div className="section-header">
                    <span className="section-icon">📍</span>
                    <h3 className="section-title">Recent Check-ins</h3>
                  </div>
                  <div className="checkins-list">
                    {checkIns.slice(0, 2).map((checkIn, i) => (
                      <div key={checkIn.id || i} className="checkin-item">
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
