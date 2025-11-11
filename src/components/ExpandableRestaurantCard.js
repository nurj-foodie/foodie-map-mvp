import React, { useState, useEffect } from 'react';
import FavoriteButton from './FavoriteButton';
import { useAuth } from '../contexts/AuthContext';
import { checkInService } from '../services/checkInService';
import { reviewsService } from '../services/reviewsService';
import './ExpandableRestaurantCard.css';
import ReviewsModal from './ReviewsModal';

const ExpandableRestaurantCard = ({ restaurant, onViewDetails, onAddReview, onShare, onEdit }) => {
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState({
    photos: false,
    reviews: false,
    checkIns: false
  });
  
  const [loadingStates, setLoadingStates] = useState({
    photos: false,
    reviews: false,
    checkIns: false,
    checkInButton: false
  });
  
  const [loadedData, setLoadedData] = useState({
    photos: null,
    reviews: null,
    checkIns: null
  });

  // Review navigation system state
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [mobileReviewsShown, setMobileReviewsShown] = useState(3);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile/Desktop detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check-in functionality with location verification
  const handleCheckIn = async () => {
    if (!user) {
      alert('Please sign in to check in to restaurants');
      return;
    }

    setLoadingStates(prev => ({ ...prev, checkInButton: true }));

    try {
      // Get user's current location
      const userLocation = await getUserCurrentLocation();
      
      if (!userLocation) {
        alert('❌ Unable to get your location. Please enable location services and try again.');
        return;
      }

      // Calculate distance to restaurant
      const distance = calculateDistanceToRestaurant(userLocation, restaurant);
      
      // Check if user is within 100m of restaurant
      if (distance > 100) {
        alert(`❌ You're ${distance.toFixed(0)}m away from ${restaurant.name}. Please get closer (within 100m) to check in.`);
        return;
      }

      // Check if user has already checked in recently (within 2 hours)
      const hasRecentCheckIn = await checkInService.hasRecentCheckIn(
        user.uid, 
        restaurant.id || restaurant.place_id
      );

      if (hasRecentCheckIn) {
        alert(`⏰ You've already checked in to ${restaurant.name} recently. Please wait 2 hours before checking in again.`);
        return;
      }

      // User is close enough and hasn't checked in recently - proceed with check-in
      const result = await checkInService.addCheckIn(
        user.uid,
        restaurant,
        userLocation,
        distance
      );

      if (result.success) {
        const pointsMessage = result.points > 0 ? ` +${result.points} points!` : '';
        const firstCheckInMessage = result.isFirstCheckIn ? ' (First check-in bonus!)' : '';
        alert(`✅ ${result.message} (${distance.toFixed(0)}m away)${pointsMessage}${firstCheckInMessage}`);
      } else {
        alert(`❌ Check-in failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Check-in error:', error);
      if (error.code === 'PERMISSION_DENIED') {
        alert('❌ Location access denied. Please enable location services to check in.');
      } else {
        alert('❌ Failed to check in. Please try again.');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, checkInButton: false }));
    }
  };

  // Get user's current location
  const getUserCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  // Calculate distance between user location and restaurant
  const calculateDistanceToRestaurant = (userLocation, restaurant) => {
    if (!restaurant.location || !restaurant.location.lat || !restaurant.location.lng) {
      throw new Error('Restaurant location not available');
    }

    const R = 6371e3; // Earth's radius in meters
    const φ1 = userLocation.lat * Math.PI / 180;
    const φ2 = restaurant.location.lat * Math.PI / 180;
    const Δφ = (restaurant.location.lat - userLocation.lat) * Math.PI / 180;
    const Δλ = (restaurant.location.lng - userLocation.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Navigate to restaurant - Opens Google Maps
  const handleNavigateToRestaurant = () => {
    if (restaurant.place_id) {
      // Use Google Maps with place ID for better accuracy
      const url = `https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`;
      window.open(url, '_blank');
    } else if (restaurant.location && restaurant.location.lat && restaurant.location.lng) {
      // Use coordinates as fallback
      const url = `https://www.google.com/maps/search/?api=1&query=${restaurant.location.lat},${restaurant.location.lng}`;
      window.open(url, '_blank');
    } else {
      // Use restaurant name and address as last resort
      const query = encodeURIComponent(`${restaurant.name} ${restaurant.address}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank');
    }
  };


  // Get primary photo URL (user-uploaded first, then Google Places)
  const getPrimaryPhotoUrl = () => {
    // Check user photos first
    let userPhotos = restaurant.userPhotos || [];
    if (typeof userPhotos === 'string') {
      try {
        userPhotos = JSON.parse(userPhotos);
      } catch (e) {
        userPhotos = [];
      }
    }
    if (Array.isArray(userPhotos) && userPhotos.length > 0) {
      const userPhoto = userPhotos[0];
      if (userPhoto.data) return userPhoto.data; // Base64
      if (userPhoto.url) return userPhoto.url;
      return null;
    }
    
    // Check Google photos
    let googlePhotos = restaurant.photos || [];
    if (typeof googlePhotos === 'string') {
      try {
        googlePhotos = JSON.parse(googlePhotos);
      } catch (e) {
        googlePhotos = [];
      }
    }
    if (Array.isArray(googlePhotos) && googlePhotos.length > 0) {
      const googlePhoto = googlePhotos[0];
      if (typeof googlePhoto === 'string') {
        // Skip empty strings like "[ ]"
        if (googlePhoto.trim() && googlePhoto !== '[ ]' && googlePhoto !== '[]') {
          return googlePhoto; // Already a URL string
        }
        return null;
      }
      if (typeof googlePhoto === 'object' && googlePhoto !== null) {
        // Check if it's a URL
        if (googlePhoto.url && typeof googlePhoto.url === 'string') {
          return googlePhoto.url;
        }
        // Check if photo_reference is a URL
        if (googlePhoto.photo_reference && typeof googlePhoto.photo_reference === 'string') {
          if (googlePhoto.photo_reference.startsWith('http')) {
            return googlePhoto.photo_reference;
          }
          // It's a photo_reference ID - would need Google Places API to convert
          console.warn('⚠️ Primary photo is photo_reference ID, not URL:', googlePhoto.photo_reference);
          return null;
        }
      }
    }
    
    // Check photoUrl field (fallback)
    if (restaurant.photoUrl && typeof restaurant.photoUrl === 'string') {
      if (restaurant.photoUrl.startsWith('http')) {
        return restaurant.photoUrl;
      }
    }
    
    return null;
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

  // Toggle section expansion
  const toggleSection = async (section) => {
    const isExpanding = !expandedSections[section];
    setExpandedSections(prev => ({
      ...prev,
      [section]: isExpanding
    }));

    // Load data on demand when expanding
    if (isExpanding && !loadedData[section]) {
      setLoadingStates(prev => ({
        ...prev,
        [section]: true
      }));

      try {
        // Get restaurant ID (support both place_id and id)
        const restaurantId = restaurant.place_id || restaurant.placeId || restaurant.id;
        
        if (!restaurantId) {
          console.warn('⚠️ No restaurant ID found, cannot load data');
          setLoadingStates(prev => ({
            ...prev,
            [section]: false
          }));
          return;
        }

        let data = null;

        switch (section) {
          case 'photos':
            // Load photos from restaurant data
            // Handle case where photos might be stored as JSON strings
            let userPhotos = restaurant.userPhotos || [];
            let googlePhotos = restaurant.photos || [];
            
            // Parse if stored as JSON strings
            if (typeof userPhotos === 'string') {
              try {
                userPhotos = JSON.parse(userPhotos);
              } catch (e) {
                console.warn('⚠️ Failed to parse userPhotos JSON string:', e);
                userPhotos = [];
              }
            }
            if (typeof googlePhotos === 'string') {
              try {
                googlePhotos = JSON.parse(googlePhotos);
              } catch (e) {
                console.warn('⚠️ Failed to parse googlePhotos JSON string:', e);
                googlePhotos = [];
              }
            }
            
            // Ensure they're arrays
            if (!Array.isArray(userPhotos)) userPhotos = [];
            if (!Array.isArray(googlePhotos)) googlePhotos = [];
            
            console.log('📸 Loading photos:', { 
              userPhotosCount: userPhotos.length, 
              googlePhotosCount: googlePhotos.length,
              googlePhotosSample: googlePhotos.slice(0, 2),
              userPhotosType: typeof restaurant.userPhotos,
              googlePhotosType: typeof restaurant.photos
            });
            
            // Format user photos (they're stored as base64 objects)
            const formattedUserPhotos = userPhotos.map((photo, index) => {
              try {
                return {
                  id: photo.id || index,
                  url: photo.data || photo.url || null,
                  user: photo.uploadedBy || 'User',
                  verified: photo.verified || false,
                  uploadedAt: photo.uploadedAt || new Date()
                };
              } catch (error) {
                console.warn('⚠️ Error formatting user photo:', error, photo);
                return null;
              }
            }).filter(photo => photo && photo.url);

            // Format Google photos (they might be strings or objects)
            // Photos from Firestore can be:
            // 1. String URLs (already converted from Google Places)
            // 2. Objects with photo_reference (URL string from getUrl())
            // 3. Objects with url property
            const formattedGooglePhotos = googlePhotos.map((photo, index) => {
              try {
                if (typeof photo === 'string') {
                  // Skip invalid strings like "[ ]" or empty strings
                  if (!photo.trim() || photo === '[ ]' || photo === '[]') {
                    return null;
                  }
                  // Already a URL string
                  return { url: photo, source: 'google_places' };
                }
                if (typeof photo === 'object' && photo !== null) {
                  // Check if photo_reference exists and is a string URL (starts with http)
                  if (photo.photo_reference) {
                    if (typeof photo.photo_reference === 'string') {
                      if (photo.photo_reference.startsWith('http')) {
                        return { url: photo.photo_reference, source: 'google_places' };
                      } else {
                        // This is a photo_reference ID, not a URL - skip it
                        console.warn('⚠️ Photo reference ID found (not URL), skipping:', photo.photo_reference);
                        return null;
                      }
                    } else {
                      console.warn('⚠️ photo_reference is not a string:', typeof photo.photo_reference, photo);
                      return null;
                    }
                  }
                  // Check if url property exists
                  if (photo.url && typeof photo.url === 'string') {
                    return { url: photo.url, source: 'google_places' };
                  }
                  return null;
                }
                return null;
              } catch (error) {
                console.warn('⚠️ Error formatting Google photo:', error, photo);
                return null;
              }
            }).filter(photo => photo && photo.url);

            console.log('✅ Formatted photos:', {
              userPhotos: formattedUserPhotos.length,
              googlePhotos: formattedGooglePhotos.length,
              total: formattedUserPhotos.length + formattedGooglePhotos.length
            });

            data = {
              userPhotos: formattedUserPhotos,
              googlePhotos: formattedGooglePhotos,
              totalCount: formattedUserPhotos.length + formattedGooglePhotos.length
            };
            break;

          case 'reviews':
            // Load reviews from Firestore
            const reviewsResult = await reviewsService.getRestaurantReviews(restaurantId, 20);
            const reviews = reviewsResult.reviews || [];
            
            // Format reviews for display
            const formattedReviews = reviews.map(review => ({
              id: review.id,
              user: {
                name: review.userName || 'Anonymous',
                avatar: review.userPhotoURL || null
              },
              rating: review.rating || 0,
              comment: review.comment || '',
              verified: review.verified || false,
              photos: review.photos || [],
              likes: {
                count: review.likes?.length || 0,
                userLiked: review.likes?.includes(user?.uid) || false
              },
              helpful: review.helpful || 0,
              createdAt: review.createdAt || new Date()
            }));

            // Calculate average rating
            const avgRating = formattedReviews.length > 0
              ? formattedReviews.reduce((sum, r) => sum + r.rating, 0) / formattedReviews.length
              : 0;

            data = {
              topReviews: formattedReviews,
              totalCount: formattedReviews.length,
              averageRating: parseFloat(avgRating.toFixed(1)),
              categoryRatings: {
                foodQuality: 0,
                valueForMoney: 0,
                serviceQuality: 0,
                ambiance: 0
              }
            };
            break;

          case 'checkIns':
            // Load check-ins from Firestore
            const checkInsResult = await checkInService.getRestaurantCheckIns(restaurantId, 50);
            const checkIns = checkInsResult.checkIns || [];
            
            // Format check-ins for display
            const formattedCheckIns = checkIns.map(checkIn => ({
              id: checkIn.id,
              user: {
                name: checkIn.userName || 'Anonymous',
                avatar: checkIn.userPhotoURL || null
              },
              verified: checkIn.verified || false,
              location: checkIn.userLocation || null,
              distance: checkIn.distance || null,
              timestamp: checkIn.timestamp?.toDate ? checkIn.timestamp.toDate() : new Date(checkIn.timestamp)
            }));

            data = {
              recentCheckIns: formattedCheckIns,
              totalCount: formattedCheckIns.length,
              verifiedCount: formattedCheckIns.filter(ci => ci.verified).length
            };
            break;

          default:
            data = null;
        }

        if (data) {
          setLoadedData(prev => ({
            ...prev,
            [section]: data
          }));
        }
      } catch (error) {
        console.error(`❌ Error loading ${section} data:`, error);
        // Set empty data on error
        setLoadedData(prev => ({
          ...prev,
          [section]: section === 'photos' ? { userPhotos: [], googlePhotos: [], totalCount: 0 } :
                     section === 'reviews' ? { 
                       topReviews: [], 
                       totalCount: 0, 
                       averageRating: 0,
                       categoryRatings: {
                         foodQuality: 0,
                         valueForMoney: 0,
                         serviceQuality: 0,
                         ambiance: 0
                       }
                     } :
                     { recentCheckIns: [], totalCount: 0, verifiedCount: 0 }
        }));
      } finally {
        setLoadingStates(prev => ({
          ...prev,
          [section]: false
        }));
      }
    }
  };

  // Generate mock data for demonstration (DEPRECATED - kept for reference)
  const generateMockData_DEPRECATED = (section) => {
    switch (section) {
      case 'photos':
        return {
          userPhotos: [
            { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400', user: 'John Doe', verified: true },
            { url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', user: 'Jane Smith', verified: true },
            { url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', user: 'Mike Johnson', verified: false }
          ],
          googlePhotos: [
            { url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400', source: 'google_places' }
          ],
          totalCount: 15
        };
      
      case 'reviews':
        return {
          topReviews: [
            {
              id: 'review_1',
              user: { name: 'John Doe', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' },
              rating: 4.5,
              categories: { foodQuality: 4.5, valueForMoney: 4.0, serviceQuality: 4.5, ambiance: 4.0 },
              comment: 'Great food and service! The nasi lemak was amazing.',
              verified: true,
              visitDetails: { visitType: 'dine-in', partySize: 2, mealType: 'dinner', visitDate: '2024-01-15' },
              photos: ['photo1.jpg'],
              likes: { count: 12, userLiked: false },
              helpful: 5,
              createdAt: '2024-01-15T10:30:00Z'
            },
            {
              id: 'review_2',
              user: { name: 'Jane Smith', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100' },
              rating: 4.0,
              categories: { foodQuality: 4.0, valueForMoney: 3.5, serviceQuality: 4.0, ambiance: 4.5 },
              comment: 'Good value for money. The ambiance is nice.',
              verified: true,
              visitDetails: { visitType: 'takeaway', partySize: 1, mealType: 'lunch', visitDate: '2024-01-14' },
              photos: [],
              likes: { count: 8, userLiked: true },
              helpful: 3,
              createdAt: '2024-01-14T12:30:00Z'
            },
            {
              id: 'review_3',
              user: { name: 'Mike Johnson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
              rating: 3.8,
              categories: { foodQuality: 3.5, valueForMoney: 4.0, serviceQuality: 3.8, ambiance: 4.0 },
              comment: 'Decent food but a bit crowded during peak hours.',
              verified: false,
              visitDetails: { visitType: 'dine-in', partySize: 4, mealType: 'dinner', visitDate: '2024-01-13' },
              photos: ['photo2.jpg'],
              likes: { count: 5, userLiked: false },
              helpful: 2,
              createdAt: '2024-01-13T19:45:00Z'
            },
            {
              id: 'review_4',
              user: { name: 'Sarah Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
              rating: 4.8,
              categories: { foodQuality: 5.0, valueForMoney: 4.5, serviceQuality: 4.8, ambiance: 4.5 },
              comment: 'Absolutely fantastic! Best roti canai in town. Highly recommended!',
              verified: true,
              visitDetails: { visitType: 'dine-in', partySize: 2, mealType: 'breakfast', visitDate: '2024-01-12' },
              photos: ['photo3.jpg'],
              likes: { count: 15, userLiked: true },
              helpful: 8,
              createdAt: '2024-01-12T08:15:00Z'
            },
            {
              id: 'review_5',
              user: { name: 'David Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
              rating: 4.2,
              categories: { foodQuality: 4.0, valueForMoney: 4.5, serviceQuality: 4.0, ambiance: 4.0 },
              comment: 'Good portion size and reasonable prices. Will come back again.',
              verified: true,
              visitDetails: { visitType: 'takeaway', partySize: 1, mealType: 'lunch', visitDate: '2024-01-11' },
              photos: [],
              likes: { count: 7, userLiked: false },
              helpful: 4,
              createdAt: '2024-01-11T13:20:00Z'
            },
            {
              id: 'review_6',
              user: { name: 'Lisa Brown', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
              rating: 3.5,
              categories: { foodQuality: 3.5, valueForMoney: 3.0, serviceQuality: 3.5, ambiance: 4.0 },
              comment: 'Food was okay but service was a bit slow. Nice atmosphere though.',
              verified: false,
              visitDetails: { visitType: 'dine-in', partySize: 3, mealType: 'dinner', visitDate: '2024-01-10' },
              photos: ['photo4.jpg'],
              likes: { count: 3, userLiked: false },
              helpful: 1,
              createdAt: '2024-01-10T20:30:00Z'
            },
            {
              id: 'review_7',
              user: { name: 'Alex Kumar', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' },
              rating: 4.6,
              categories: { foodQuality: 4.8, valueForMoney: 4.2, serviceQuality: 4.5, ambiance: 4.5 },
              comment: 'Excellent curry and fresh ingredients. Staff was very friendly and helpful.',
              verified: true,
              visitDetails: { visitType: 'dine-in', partySize: 4, mealType: 'dinner', visitDate: '2024-01-09' },
              photos: ['photo5.jpg', 'photo6.jpg'],
              likes: { count: 11, userLiked: true },
              helpful: 6,
              createdAt: '2024-01-09T19:00:00Z'
            },
            {
              id: 'review_8',
              user: { name: 'Emma Davis', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100' },
              rating: 4.0,
              categories: { foodQuality: 4.0, valueForMoney: 4.0, serviceQuality: 4.0, ambiance: 4.0 },
              comment: 'Solid choice for Malaysian food. Nothing extraordinary but consistently good.',
              verified: true,
              visitDetails: { visitType: 'takeaway', partySize: 2, mealType: 'lunch', visitDate: '2024-01-08' },
              photos: [],
              likes: { count: 6, userLiked: false },
              helpful: 3,
              createdAt: '2024-01-08T12:45:00Z'
            }
          ],
          totalCount: 25,
          averageRating: 4.2,
          categoryRatings: {
            foodQuality: 4.5,
            valueForMoney: 3.8,
            serviceQuality: 4.0,
            ambiance: 4.3
          }
        };
      
      case 'checkIns':
        return {
          recentCheckIns: [
            {
              id: 'checkin_1',
              user: { name: 'Sarah Lee', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
              verified: true,
              location: { lat: 3.1390, lng: 101.6869 },
              distance: 50,
              visitType: 'dine-in',
              partySize: 3,
              mealType: 'lunch',
              visitDate: '2024-01-16',
              photos: ['checkin_photo1.jpg'],
              createdAt: '2024-01-16T13:30:00Z'
            },
            {
              id: 'checkin_2',
              user: { name: 'David Chen', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
              verified: true,
              location: { lat: 3.1391, lng: 101.6870 },
              distance: 75,
              visitType: 'takeaway',
              partySize: 1,
              mealType: 'breakfast',
              visitDate: '2024-01-16',
              photos: [],
              createdAt: '2024-01-16T08:15:00Z'
            }
          ],
          totalCount: 12,
          verifiedCount: 8
        };
      
      default:
        return null;
    }
  };

  // Handle like review
  const handleLikeReview = (reviewId) => {
    if (loadedData.reviews) {
      const updatedReviews = loadedData.reviews.topReviews.map(review => {
        if (review.id === reviewId) {
          const newLiked = !review.likes.userLiked;
          return {
            ...review,
            likes: {
              ...review.likes,
              userLiked: newLiked,
              count: newLiked ? review.likes.count + 1 : review.likes.count - 1
            }
          };
        }
        return review;
      });
      
      setLoadedData(prev => ({
        ...prev,
        reviews: {
          ...prev.reviews,
          topReviews: updatedReviews
        }
      }));
    }
  };

  // Review navigation functions
  const handleShowMoreReviews = () => {
    setMobileReviewsShown(prev => prev + 5);
  };

  const handleViewAllReviews = () => {
    setShowReviewsModal(true);
  };

  const getDisplayedReviews = () => {
    if (!loadedData.reviews) return [];
    
    if (isMobile) {
      return loadedData.reviews.topReviews.slice(0, mobileReviewsShown);
    } else {
      return loadedData.reviews.topReviews.slice(0, 3);
    }
  };

  const hasMoreReviews = () => {
    if (!loadedData.reviews) return false;
    return mobileReviewsShown < loadedData.reviews.topReviews.length;
  };

  const primaryPhotoUrl = getPrimaryPhotoUrl();
  const overallRating = getOverallRating();
  const ratingBreakdown = getRatingBreakdown();
  const verificationStatus = getVerificationStatus();

  return (
    <div className="expandable-restaurant-card">
      {/* Photo Section */}
      <div className="photo-section">
        {primaryPhotoUrl ? (
          <div className="main-photo">
            <img 
              src={primaryPhotoUrl} 
              alt={restaurant.name || restaurant.displayName || 'Restaurant'}
              className="restaurant-image"
              onError={(e) => {
                console.warn('⚠️ Failed to load primary photo:', primaryPhotoUrl);
                e.target.style.display = 'none';
              }}
            />
            <button 
              className="photo-count-badge"
              onClick={() => toggleSection('photos')}
            >
              +{restaurant.userPhotos?.length + restaurant.photos?.length - 1 || 0} photos
            </button>
          </div>
        ) : (
          <div className="no-photo-placeholder">
            <span className="no-photo-icon">📷</span>
            <span className="no-photo-text">No photos yet</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="content-section">
        {/* Restaurant Header */}
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
          
          {/* Detour Information */}
          {(restaurant.detourDistanceKm || restaurant.detourDurationMinutes) && (
            <div className="detour-info">
              <span className="detour-distance">
                🚗 {restaurant.detourDistanceKm ? `${restaurant.detourDistanceKm.toFixed(1)}km detour` : 'Distance N/A'}
              </span>
              <span className="detour-duration">
                ⏱️ {restaurant.detourDurationMinutes ? `${restaurant.detourDurationMinutes.toFixed(0)}min` : 'Time N/A'}
              </span>
            </div>
          )}
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

          {/* Category Ratings - Clean Design */}
          <div className="rating-categories-clean">
            <div className="rating-grid">
              <div className="rating-item">
                <div className="rating-label">🍽️ Food</div>
                <div className="rating-score">{ratingBreakdown.foodQuality}/5</div>
              </div>
              <div className="rating-item">
                <div className="rating-label">💰 Value</div>
                <div className="rating-score">{ratingBreakdown.valueForMoney}/5</div>
              </div>
              <div className="rating-item">
                <div className="rating-label">👥 Service</div>
                <div className="rating-score">{ratingBreakdown.serviceQuality}/5</div>
              </div>
              <div className="rating-item">
                <div className="rating-label">🏠 Ambiance</div>
                <div className="rating-score">{ratingBreakdown.ambiance}/5</div>
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

        {/* Facilities Section */}
        <div className="facilities-section">
          <h4 className="facilities-title">Facilities</h4>
          <div className="facilities-grid">
            {/* Show facilities based on available data */}
            {restaurant.accessibility?.parkingAvailable && (
              <div className="facility-item" title="Parking Available">
                <span className="facility-icon">🅿️</span>
              </div>
            )}
            {restaurant.accessibility?.outdoorSeating && (
              <div className="facility-item" title="Outdoor Seating">
                <span className="facility-icon">🌳</span>
              </div>
            )}
            {restaurant.accessibility?.wifiAvailable && (
              <div className="facility-item" title="WiFi Available">
                <span className="facility-icon">📶</span>
              </div>
            )}
            {restaurant.accessibility?.airConditioned && (
              <div className="facility-item" title="Air Conditioned">
                <span className="facility-icon">❄️</span>
              </div>
            )}
            {restaurant.accessibility?.wheelchairAccessible && (
              <div className="facility-item" title="Wheelchair Accessible">
                <span className="facility-icon">♿</span>
              </div>
            )}
            {restaurant.accessibility?.deliveryAvailable && (
              <div className="facility-item" title="Delivery Available">
                <span className="facility-icon">🚚</span>
              </div>
            )}
            {restaurant.accessibility?.takeoutAvailable && (
              <div className="facility-item" title="Takeout Available">
                <span className="facility-icon">🥡</span>
              </div>
            )}
            {restaurant.accessibility?.dineInAvailable && (
              <div className="facility-item" title="Dine-in Available">
                <span className="facility-icon">🍽️</span>
              </div>
            )}
            
            {/* Show basic facilities based on restaurant types */}
            {restaurant.types?.includes('meal_takeaway') && (
              <div className="facility-item" title="Takeout Available">
                <span className="facility-icon">🥡</span>
              </div>
            )}
            {restaurant.types?.includes('meal_delivery') && (
              <div className="facility-item" title="Delivery Available">
                <span className="facility-icon">🚚</span>
              </div>
            )}
            {restaurant.types?.includes('restaurant') && (
              <div className="facility-item" title="Dine-in Available">
                <span className="facility-icon">🍽️</span>
              </div>
            )}
            
            {/* Show message if no facilities are available */}
            {!restaurant.accessibility && 
             !restaurant.types?.includes('meal_takeaway') && 
             !restaurant.types?.includes('meal_delivery') && 
             !restaurant.types?.includes('restaurant') && (
              <div className="no-facilities">
                <span className="facility-icon">ℹ️</span>
                <span className="facility-text">Facility information not available</span>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="expandable-sections">
          {/* Photos Section */}
          <div className="expandable-section">
            <button 
              className="section-header"
              onClick={() => toggleSection('photos')}
            >
              <span className="section-title">
                📸 Photos ({restaurant.userPhotos?.length + restaurant.photos?.length || 0})
              </span>
              <span className="section-toggle">
                {expandedSections.photos ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedSections.photos && (
              <div className="section-content">
                {loadingStates.photos ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <span>Loading photos...</span>
                  </div>
                ) : loadedData.photos ? (
                  <div className="photo-gallery">
                    <div className="photo-grid">
                      {loadedData.photos.userPhotos.map((photo, index) => (
                        <div key={index} className="photo-item">
                          <img src={photo.url} alt={`Photo by ${photo.user}`} />
                          <div className="photo-info">
                            <span className="photo-user">{photo.user}</span>
                            {photo.verified && <span className="verified-icon">✅</span>}
                          </div>
                        </div>
                      ))}
                      {loadedData.photos.googlePhotos.map((photo, index) => (
                        <div key={`google-${index}`} className="photo-item">
                          <img src={photo.url} alt="Restaurant photo" />
                          <div className="photo-info">
                            <span className="photo-source">Google Places</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="expandable-section">
            <button 
              className="section-header"
              onClick={() => toggleSection('reviews')}
            >
              <span className="section-title">
                ⭐ Reviews ({verificationStatus.totalReviews})
              </span>
              <span className="section-toggle">
                {expandedSections.reviews ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedSections.reviews && (
              <div className="section-content">
                {loadingStates.reviews ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <span>Loading reviews...</span>
                  </div>
                ) : loadedData.reviews ? (
                  <div className="reviews-section">
                    <div className="reviews-summary">
                      <div className="average-rating">
                        <span className="rating-number">{loadedData.reviews.averageRating}</span>
                        <span className="rating-stars">{renderStars(loadedData.reviews.averageRating)}</span>
                      </div>
                      <div className="category-breakdown">
                        {loadedData.reviews?.categoryRatings && typeof loadedData.reviews.categoryRatings === 'object' && Object.entries(loadedData.reviews.categoryRatings).map(([category, rating]) => (
                          <div key={category} className="category-item">
                            <span className="category-name">{category}</span>
                            <span className="category-rating">{rating}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="top-reviews">
                      <div className="reviews-header">
                        <h4>Top Reviews</h4>
                      </div>
                      
                      {getDisplayedReviews().map(review => (
                        <div key={review.id} className="review-item">
                          <div className="review-header">
                            <div className="reviewer-info">
                              <img src={review.user.avatar} alt={review.user.name} className="reviewer-avatar" />
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
                                className={`like-button ${review.likes.userLiked ? 'liked' : ''}`}
                                onClick={() => handleLikeReview(review.id)}
                              >
                                ❤️ {review.likes.count}
                              </button>
                            </div>
                          </div>
                          
                          <div className="review-content">
                            <p className="review-comment">{review.comment}</p>
                            <div className="review-details">
                              {review.visitDetails && (
                                <>
                                  {review.visitDetails.visitType && (
                                    <span className="visit-type">{review.visitDetails.visitType}</span>
                                  )}
                                  {review.visitDetails.partySize && (
                                    <span className="party-size">{review.visitDetails.partySize} people</span>
                                  )}
                                  {review.visitDetails.mealType && (
                                    <span className="meal-type">{review.visitDetails.mealType}</span>
                                  )}
                                </>
                              )}
                              {review.verified && <span className="verified-badge">✅ Verified</span>}
                              <span className="review-date">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Review Navigation Controls */}
                      <div className="reviews-navigation">
                        {isMobile ? (
                          hasMoreReviews() && (
                            <button 
                              className="show-more-reviews-btn"
                              onClick={handleShowMoreReviews}
                            >
                              Show More Reviews ({loadedData.reviews.topReviews.length - mobileReviewsShown} remaining)
                            </button>
                          )
                        ) : (
                          <button 
                            className="view-all-reviews-btn"
                            onClick={handleViewAllReviews}
                          >
                            View All Reviews ({loadedData.reviews.topReviews.length} total)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Check-ins Section */}
          <div className="expandable-section">
            <button 
              className="section-header"
              onClick={() => toggleSection('checkIns')}
            >
              <span className="section-title">
                📍 Check-ins ({restaurant.totalCheckIns || 0})
              </span>
              <span className="section-toggle">
                {expandedSections.checkIns ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedSections.checkIns && (
              <div className="section-content">
                {loadingStates.checkIns ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <span>Loading check-ins...</span>
                  </div>
                ) : loadedData.checkIns ? (
                  <div className="checkins-section">
                    <div className="checkins-summary">
                      <span className="total-checkins">{loadedData.checkIns.totalCount} total check-ins</span>
                      <span className="verified-checkins">{loadedData.checkIns.verifiedCount} verified</span>
                    </div>
                    
                    <div className="recent-checkins">
                      <h4>Recent Check-ins</h4>
                      {loadedData.checkIns.recentCheckIns.map(checkIn => (
                        <div key={checkIn.id} className="checkin-item">
                          <div className="checkin-header">
                            <img src={checkIn.user.avatar} alt={checkIn.user.name} className="checkin-avatar" />
                            <div className="checkin-details">
                              <span className="checkin-user">{checkIn.user.name}</span>
                              <div className="checkin-info">
                                <span className="visit-type">{checkIn.visitType}</span>
                                <span className="party-size">{checkIn.partySize} people</span>
                                <span className="meal-type">{checkIn.mealType}</span>
                                {checkIn.verified && <span className="verified-badge">✅ Verified</span>}
                              </div>
                            </div>
                            <div className="checkin-distance">
                              {checkIn.distance}m away
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
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
            className="btn btn-navigate"
            onClick={handleNavigateToRestaurant}
          >
            🧭 Navigate Here
          </button>
          {user && (
            <button 
              className="btn btn-checkin"
              onClick={handleCheckIn}
              disabled={loadingStates.checkInButton}
            >
              {loadingStates.checkInButton ? '⏳ Checking...' : '📍 Check In'}
            </button>
          )}
          <button 
            className="btn btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              console.log('📝 Add Review button clicked in ExpandableRestaurantCard');
              console.log('📝 onAddReview handler:', typeof onAddReview);
              if (onAddReview) {
                console.log('📝 Calling onAddReview handler');
                onAddReview(restaurant);
              } else {
                console.warn('⚠️ onAddReview handler not provided');
              }
            }}
          >
            Add Review
          </button>
          <button 
            className="btn btn-share"
            onClick={() => onShare(restaurant)}
          >
            Share
          </button>
          <FavoriteButton
            restaurant={restaurant}
            size="medium"
            showText={true}
            className="btn-favorite"
          />
          {user && onEdit && (
            <button 
              className="btn btn-edit"
              onClick={() => {
                try {
                  console.log('✏️ Edit button clicked for:', restaurant.name || restaurant.displayName);
                  onEdit(restaurant);
                } catch (error) {
                  console.error('❌ Error opening edit modal:', error);
                }
              }}
            >
              ✏️ Edit Details
            </button>
          )}
        </div>
      </div>

      {/* Reviews Modal */}
      <ReviewsModal
        isOpen={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        reviews={loadedData.reviews?.topReviews || []}
        totalCount={loadedData.reviews?.topReviews?.length || 0}
        onLikeReview={handleLikeReview}
        restaurantName={restaurant.name}
      />
    </div>
  );
};

export default ExpandableRestaurantCard;
