/* global google */
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const EaterySubmissionForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    location: { lat: 0, lng: 0 },
    place_id: '',
    cuisineType: '',
    halalStatus: 'unknown',
    rating: 0,
    phone: '',
    website: '',
    description: '',
    // Enhanced fields to match database structure
    businessStatus: 'OPERATIONAL',
    priceLevel: 1,
    types: ['restaurant', 'food', 'establishment'],
    operatingHours: {
      isOpen: true,
      isOpen24Hours: false,
      periods: [
        { day: 'Monday', open: '09:00', close: '22:00', isClosed: false },
        { day: 'Tuesday', open: '09:00', close: '22:00', isClosed: false },
        { day: 'Wednesday', open: '09:00', close: '22:00', isClosed: false },
        { day: 'Thursday', open: '09:00', close: '22:00', isClosed: false },
        { day: 'Friday', open: '09:00', close: '22:00', isClosed: false },
        { day: 'Saturday', open: '09:00', close: '22:00', isClosed: false },
        { day: 'Sunday', open: '09:00', close: '22:00', isClosed: false }
      ]
    },
    accessibility: {
      wheelchairAccessible: false,
      parkingAvailable: false,
      deliveryAvailable: false,
      takeoutAvailable: true,
      dineInAvailable: true,
      outdoorSeating: false,
      wifiAvailable: false,
      airConditioned: false
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [showNearbyRestaurants, setShowNearbyRestaurants] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [initialReview, setInitialReview] = useState({
    rating: {
      foodQuality: 0,
      valueForMoney: 0,
      serviceQuality: 0,
      ambiance: 0
    },
    comment: '',
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'dine-in',
    partySize: 'solo',
    mealType: 'lunch'
  });
  const [showCheckInOption, setShowCheckInOption] = useState(false);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
  const [locationVerification, setLocationVerification] = useState({
    isVerified: false,
    distance: null,
    userLocation: null,
    verificationMessage: ''
  });

  // Search Google Places for restaurant
  const searchGooglePlaces = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      console.log('🔍 Searching Google Places for:', query);
      
      // Create a temporary map element for PlacesService
      const tempMapDiv = document.createElement('div');
      const service = new google.maps.places.PlacesService(tempMapDiv);
      
      const request = {
        query: query,
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'rating', 'types', 'formatted_phone_number', 'website']
      };
      
      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          console.log(`✅ Found ${results.length} places`);
          setSearchResults(results.slice(0, 5)); // Limit to 5 results
          setShowSearchResults(true);
        } else {
          console.log('❌ No places found');
          setSearchResults([]);
          setShowSearchResults(false);
        }
      });
    } catch (error) {
      console.error('❌ Google Places search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle place selection from search results
  const handlePlaceSelect = (place) => {
    setFormData({
      ...formData,
      name: place.name,
      address: place.formatted_address,
      location: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      place_id: place.place_id,
      rating: place.rating || 0,
      phone: place.formatted_phone_number || '',
      website: place.website || ''
    });
    setShowSearchResults(false);
    console.log('📍 Selected place:', place.name);
  };

  // Discover nearby restaurants for auto-population
  const discoverNearbyRestaurants = async (lat, lng) => {
    try {
      console.log('🍽️ Discovering restaurants within 8km...');
      
      // Create bounds around the location (8km radius)
      const radiusKm = 8;
      const bounds = {
        north: lat + (radiusKm / 111), // Rough conversion: 1 degree ≈ 111km
        south: lat - (radiusKm / 111),
        east: lng + (radiusKm / (111 * Math.cos(lat * Math.PI / 180))),
        west: lng - (radiusKm / (111 * Math.cos(lat * Math.PI / 180)))
      };
      
      // Use Firestore-first search
      const { firestoreSearchService } = await import('../services/firestoreSearchService');
      const places = await firestoreSearchService.searchRestaurants(bounds, {
        foodType: 'all',
        minRating: 0,
        halalOnly: false,
        openNow: false
      });
      
      console.log(`🍽️ Found ${places.length} restaurants nearby`);
      
      // Calculate distances and sort by proximity
      const restaurantsWithDistance = places.map(place => {
        const distance = calculateHaversineDistance({ lat, lng }, place.location);
        return {
          ...place,
          distanceFromUser: distance,
          distanceFromUserKm: distance.toFixed(1) + ' km'
        };
      }).sort((a, b) => a.distanceFromUser - b.distanceFromUser)
        .slice(0, 10); // Show top 10 closest
      
      setNearbyRestaurants(restaurantsWithDistance);
      setShowNearbyRestaurants(true);
      
      console.log(`📍 Showing ${restaurantsWithDistance.length} closest restaurants`);
      
    } catch (error) {
      console.error('❌ Nearby restaurant discovery failed:', error);
    }
  };

  // Helper function for Haversine distance calculation
  const calculateHaversineDistance = (point1, point2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
    const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * 
              Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Helper functions for operating hours management
  const updateOperatingHours = (dayIndex, field, value) => {
    const newPeriods = [...formData.operatingHours.periods];
    newPeriods[dayIndex] = { ...newPeriods[dayIndex], [field]: value };
    
    setFormData({
      ...formData,
      operatingHours: {
        ...formData.operatingHours,
        periods: newPeriods
      }
    });
  };

  const toggle24Hours = () => {
    setFormData({
      ...formData,
      operatingHours: {
        ...formData.operatingHours,
        isOpen24Hours: !formData.operatingHours.isOpen24Hours
      }
    });
  };

  const updateAccessibility = (field, value) => {
    setFormData({
      ...formData,
      accessibility: {
        ...formData.accessibility,
        [field]: value
      }
    });
  };

  // Handle photo upload
  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploadingPhotos(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        // In a real app, you would upload to Firebase Storage
        // For now, we'll create a mock URL and store file info
        const mockUrl = URL.createObjectURL(file);
        
        return {
          id: Date.now() + Math.random(),
          url: mockUrl,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          uploadedBy: 'user_submission' // In real app: currentUser.uid
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setUploadedPhotos(prev => [...prev, ...uploadedFiles]);
      
      console.log(`✅ Uploaded ${uploadedFiles.length} photos`);
    } catch (error) {
      console.error('❌ Photo upload error:', error);
      alert('Failed to upload photos: ' + error.message);
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  // Remove uploaded photo
  const removePhoto = (photoId) => {
    setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  // Handle initial review submission
  const handleInitialReview = (field, value) => {
    setInitialReview(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle category rating update
  const handleCategoryRating = (category, value) => {
    setInitialReview(prev => ({
      ...prev,
      rating: {
        ...prev.rating,
        [category]: parseInt(value)
      }
    }));
  };

  // Calculate overall rating from categories
  const calculateOverallRating = (ratings) => {
    const values = Object.values(ratings).filter(r => r > 0);
    if (values.length === 0) return 0;
    return values.reduce((sum, rating) => sum + rating, 0) / values.length;
  };

  // Verify user location for check-in (100m radius)
  const verifyLocationForCheckIn = async () => {
    if (!formData.location || formData.location.lat === 0) {
      alert('Please set the restaurant location first before verifying check-in.');
      return;
    }

    setIsVerifyingLocation(true);
    
    try {
      // Get user's current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // Calculate distance using Haversine formula
      const distance = calculateHaversineDistance(userLocation, formData.location);
      const distanceMeters = distance * 1000;

      console.log(`📍 Location verification: ${distanceMeters.toFixed(0)}m from restaurant`);

      if (distanceMeters <= 100) {
        // Within 100m - verified check-in
        setLocationVerification({
          isVerified: true,
          distance: distanceMeters,
          userLocation: userLocation,
          verificationMessage: `✅ Verified! You're ${distanceMeters.toFixed(0)}m from the restaurant.`
        });
        setShowCheckInOption(true);
        console.log('✅ Location verified for check-in');
      } else {
        // Too far - not verified
        setLocationVerification({
          isVerified: false,
          distance: distanceMeters,
          userLocation: userLocation,
          verificationMessage: `❌ Too far! You're ${distanceMeters.toFixed(0)}m from the restaurant. Must be within 100m for verified check-in.`
        });
        setShowCheckInOption(false);
        console.log('❌ Location not verified - too far from restaurant');
      }
    } catch (error) {
      console.error('❌ Location verification failed:', error);
      setLocationVerification({
        isVerified: false,
        distance: null,
        userLocation: null,
        verificationMessage: '❌ Location verification failed. Please ensure location access is enabled.'
      });
    } finally {
      setIsVerifyingLocation(false);
    }
  };

  // Get user's current location
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use Google Geocoding to get address from coordinates
          const geocoder = new google.maps.Geocoder();
          const latlng = new google.maps.LatLng(latitude, longitude);
          
          geocoder.geocode({ location: latlng }, async (results, status) => {
            if (status === 'OK' && results[0]) {
              const address = results[0].formatted_address;
              
              setFormData({
                ...formData,
                address: address,
                location: {
                  lat: latitude,
                  lng: longitude
                }
              });
              
              console.log('📍 Current location found:', address);
              
              // Auto-discover nearby restaurants
              await discoverNearbyRestaurants(latitude, longitude);
              
              alert(`Location found: ${address}\n🍽️ Found ${nearbyRestaurants.length} nearby restaurants!`);
            } else {
              console.error('❌ Geocoding failed:', status);
              alert('Could not get address for current location');
            }
            setIsLocating(false);
          });
        } catch (error) {
          console.error('❌ Location error:', error);
          alert('Error getting location: ' + error.message);
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        let errorMessage = 'Error getting location: ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Permission denied. Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Unknown error occurred.';
            break;
        }
        
        alert(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Handle selecting a nearby restaurant
  const handleSelectNearbyRestaurant = (restaurant) => {
    setFormData({
      ...formData,
      name: restaurant.name || restaurant.displayName,
      address: restaurant.address || restaurant.formattedAddress,
      location: restaurant.location,
      place_id: restaurant.place_id || restaurant.id,
      rating: restaurant.rating || 0
    });
    setShowNearbyRestaurants(false);
    console.log('📍 Selected nearby restaurant:', restaurant.name);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address) {
      alert('Please fill in restaurant name and address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Clean and validate form data to prevent NaN values
      const cleanFormData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        location: formData.location,
        place_id: formData.place_id || '',
        cuisineType: formData.cuisineType || 'unknown',
        halalStatus: formData.halalStatus || 'unknown',
        rating: isNaN(formData.rating) ? 0 : Math.max(0, Math.min(5, formData.rating)),
        phone: formData.phone.trim() || '',
        website: formData.website.trim() || '',
        description: formData.description.trim() || ''
      };

      await addDoc(collection(db, 'eateries'), {
        ...cleanFormData,
        // Enhanced database structure
        businessStatus: formData.businessStatus,
        priceLevel: formData.priceLevel,
        types: formData.types,
        operatingHours: formData.operatingHours,
        accessibility: formData.accessibility,
        // Metadata
        verified: false,
        createdBy: 'user_submission', // In a real app, this would be currentUser.uid
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending_review',
        source: 'user_submission',
        // Analytics
        totalViews: 0,
        totalClicks: 0,
        totalCheckIns: showCheckInOption ? 1 : 0,
        userCheckIns: showCheckInOption ? 1 : 0,
        userReviews: calculateOverallRating(initialReview.rating) > 0 ? [{
          userId: 'user_submission', // In real app: currentUser.uid
          rating: {
            overall: calculateOverallRating(initialReview.rating),
            foodQuality: initialReview.rating.foodQuality,
            valueForMoney: initialReview.rating.valueForMoney,
            serviceQuality: initialReview.rating.serviceQuality,
            ambiance: initialReview.rating.ambiance
          },
          comment: initialReview.comment,
          visitDate: initialReview.visitDate,
          visitType: initialReview.visitType,
          partySize: initialReview.partySize,
          mealType: initialReview.mealType,
          createdAt: new Date(),
          verified: locationVerification.isVerified,
          verificationDistance: locationVerification.distance,
          helpfulVotes: 0,
          reactions: { thumbsUp: 0, heart: 0, food: 0, sad: 0 }
        }] : [],
        userPhotos: uploadedPhotos
      });
      
      console.log('✅ Restaurant submitted successfully:', formData.name);
      
      // Create success message with details
      let successMessage = `Restaurant "${formData.name}" submitted successfully!`;
      if (uploadedPhotos.length > 0) {
        successMessage += `\n📸 ${uploadedPhotos.length} photos uploaded`;
      }
      if (calculateOverallRating(initialReview.rating) > 0) {
        const overallRating = calculateOverallRating(initialReview.rating).toFixed(1);
        successMessage += `\n⭐ ${overallRating}-star review added (${Object.values(initialReview.rating).filter(r => r > 0).length}/4 categories rated)`;
        if (locationVerification.isVerified) {
          successMessage += `\n✅ Verified review (${locationVerification.distance.toFixed(0)}m from restaurant)`;
        }
      }
      if (showCheckInOption) {
        successMessage += `\n📍 Check-in recorded`;
      }
      successMessage += `\n\nIt will be reviewed by admin before going live.`;
      
      alert(successMessage);
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        location: { lat: 0, lng: 0 },
        place_id: '',
        cuisineType: '',
        halalStatus: 'unknown',
        rating: 0,
        phone: '',
        website: '',
        description: '',
        // Reset enhanced fields
        businessStatus: 'OPERATIONAL',
        priceLevel: 1,
        types: ['restaurant', 'food', 'establishment'],
        operatingHours: {
          isOpen: true,
          isOpen24Hours: false,
          periods: [
            { day: 'Monday', open: '09:00', close: '22:00', isClosed: false },
            { day: 'Tuesday', open: '09:00', close: '22:00', isClosed: false },
            { day: 'Wednesday', open: '09:00', close: '22:00', isClosed: false },
            { day: 'Thursday', open: '09:00', close: '22:00', isClosed: false },
            { day: 'Friday', open: '09:00', close: '22:00', isClosed: false },
            { day: 'Saturday', open: '09:00', close: '22:00', isClosed: false },
            { day: 'Sunday', open: '09:00', close: '22:00', isClosed: false }
          ]
        },
        accessibility: {
          wheelchairAccessible: false,
          parkingAvailable: false,
          deliveryAvailable: false,
          takeoutAvailable: true,
          dineInAvailable: true,
          outdoorSeating: false,
          wifiAvailable: false,
          airConditioned: false
        }
      });
      
      // Reset additional features
      setUploadedPhotos([]);
      setInitialReview({
        rating: {
          foodQuality: 0,
          valueForMoney: 0,
          serviceQuality: 0,
          ambiance: 0
        },
        comment: '',
        visitDate: new Date().toISOString().split('T')[0],
        visitType: 'dine-in',
        partySize: 'solo',
        mealType: 'lunch'
      });
      setShowCheckInOption(false);
      setLocationVerification({
        isVerified: false,
        distance: null,
        userLocation: null,
        verificationMessage: ''
      });
      
      onClose();
    } catch (error) {
      console.error('❌ Submission error:', error);
      alert('Submission failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '500px',
      margin: '0 auto',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ color: '#CC0001', marginBottom: '20px' }}>🍽️ Add New Restaurant</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Google Places Search */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Search Google Places (optional):
          </label>
          <input
            type="text"
            placeholder="Search for restaurant..."
            onChange={(e) => searchGooglePlaces(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          
          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              zIndex: 1000,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              width: '100%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {searchResults.map((place, index) => (
                <div
                  key={index}
                  onClick={() => handlePlaceSelect(place)}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    ':hover': { backgroundColor: '#f0f0f0' }
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{place.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{place.formatted_address}</div>
                  {place.rating && <div style={{ fontSize: '12px', color: '#666' }}>⭐ {place.rating}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Restaurant Name */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Restaurant Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Enter restaurant name"
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Address */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Address *
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Enter full address"
              required
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              style={{
                padding: '10px 15px',
                backgroundColor: isLocating ? '#ccc' : '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: isLocating ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {isLocating ? '📍 Locating...' : '📍 Locate Me'}
            </button>
                  </div>
                </div>

                {/* Nearby Restaurants */}
                {showNearbyRestaurants && nearbyRestaurants.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      🍽️ Nearby Restaurants (8km radius)
                    </label>
                    <div style={{ 
                      backgroundColor: '#f0f8ff', 
                      padding: '10px', 
                      borderRadius: '4px', 
                      border: '1px solid #2196F3',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                        💡 Found {nearbyRestaurants.length} restaurants nearby. Click to auto-fill form:
                      </div>
                      {nearbyRestaurants.map((restaurant, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectNearbyRestaurant(restaurant)}
                          style={{
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            marginBottom: '5px',
                            cursor: 'pointer',
                            backgroundColor: '#fff',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#e3f2fd'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                        >
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                            {restaurant.name || restaurant.displayName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {restaurant.address || restaurant.formattedAddress}
                          </div>
                          <div style={{ fontSize: '11px', color: '#888' }}>
                            📍 {restaurant.distanceFromUserKm} | ⭐ {restaurant.rating || 'N/A'} | Source: {restaurant.source || 'unknown'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNearbyRestaurants(false)}
                      style={{
                        marginTop: '5px',
                        padding: '5px 10px',
                        backgroundColor: '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Hide Nearby Restaurants
                    </button>
                  </div>
                )}

                {/* Cuisine Type */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Cuisine Type
          </label>
          <select
            value={formData.cuisineType}
            onChange={(e) => setFormData({...formData, cuisineType: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">Select cuisine type</option>
            <option value="Malay">Malay</option>
            <option value="Chinese">Chinese</option>
            <option value="Indian">Indian</option>
            <option value="Western">Western</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
            <option value="Thai">Thai</option>
            <option value="Italian">Italian</option>
            <option value="Fast Food">Fast Food</option>
            <option value="Cafe">Cafe</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Halal Status */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Halal Status
          </label>
          <select
            value={formData.halalStatus}
            onChange={(e) => setFormData({...formData, halalStatus: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="halal">Halal</option>
            <option value="pork-free">Pork-Free</option>
            <option value="non-halal">Non-Halal</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        {/* Rating */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Rating (1-5)
          </label>
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={formData.rating || ''}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({...formData, rating: value === '' ? 0 : parseFloat(value) || 0});
            }}
            placeholder="Enter rating (optional)"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Phone */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="Enter phone number"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Website */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({...formData, website: e.target.value})}
            placeholder="Enter website URL"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Enter restaurant description"
            rows="3"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Enhanced Fields Section */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ color: '#CC0001', marginBottom: '15px', fontSize: '16px' }}>
            🏪 Business Information
          </h3>

          {/* Business Status */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Business Status
            </label>
            <select
              value={formData.businessStatus}
              onChange={(e) => setFormData({...formData, businessStatus: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="OPERATIONAL">🟢 Operational</option>
              <option value="CLOSED_TEMPORARILY">🟡 Closed Temporarily</option>
              <option value="CLOSED_PERMANENTLY">🔴 Closed Permanently</option>
            </select>
          </div>

          {/* Price Level */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Price Level
            </label>
            <select
              value={formData.priceLevel}
              onChange={(e) => setFormData({...formData, priceLevel: parseInt(e.target.value)})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value={1}>💰 $ (Budget-friendly)</option>
              <option value={2}>💰💰 $$ (Moderate)</option>
              <option value={3}>💰💰💰 $$$ (Expensive)</option>
              <option value={4}>💰💰💰💰 $$$$ (Very Expensive)</option>
            </select>
          </div>
        </div>

        {/* Operating Hours Section */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f0f8ff', 
          borderRadius: '8px',
          border: '1px solid #2196F3'
        }}>
          <h3 style={{ color: '#CC0001', marginBottom: '15px', fontSize: '16px' }}>
            🕒 Operating Hours
          </h3>

          {/* 24 Hours Toggle */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.operatingHours.isOpen24Hours}
                onChange={toggle24Hours}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontWeight: 'bold' }}>🕐 Open 24 Hours</span>
            </label>
          </div>

          {/* Day-by-day Schedule */}
          {!formData.operatingHours.isOpen24Hours && (
            <div>
              {formData.operatingHours.periods.map((period, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '10px',
                  gap: '10px'
                }}>
                  <div style={{ 
                    width: '80px', 
                    fontWeight: 'bold', 
                    fontSize: '14px' 
                  }}>
                    {period.day}
                  </div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={period.isClosed}
                      onChange={(e) => updateOperatingHours(index, 'isClosed', e.target.checked)}
                      style={{ marginRight: '5px' }}
                    />
                    <span style={{ fontSize: '12px' }}>Closed</span>
                  </label>

                  {!period.isClosed && (
                    <>
                      <input
                        type="time"
                        value={period.open}
                        onChange={(e) => updateOperatingHours(index, 'open', e.target.value)}
                        style={{
                          padding: '5px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      />
                      <span style={{ fontSize: '12px' }}>to</span>
                      <input
                        type="time"
                        value={period.close}
                        onChange={(e) => updateOperatingHours(index, 'close', e.target.value)}
                        style={{
                          padding: '5px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accessibility & Features Section */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f0fff0', 
          borderRadius: '8px',
          border: '1px solid #4CAF50'
        }}>
          <h3 style={{ color: '#CC0001', marginBottom: '15px', fontSize: '16px' }}>
            ♿ Accessibility & Features
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {Object.entries(formData.accessibility).map(([key, value]) => (
              <label key={key} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateAccessibility(key, e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <span>
                  {key === 'wheelchairAccessible' && '♿ Wheelchair Accessible'}
                  {key === 'parkingAvailable' && '🅿️ Parking Available'}
                  {key === 'deliveryAvailable' && '🚚 Delivery Available'}
                  {key === 'takeoutAvailable' && '🥡 Takeout Available'}
                  {key === 'dineInAvailable' && '🍽️ Dine-in Available'}
                  {key === 'outdoorSeating' && '🌳 Outdoor Seating'}
                  {key === 'wifiAvailable' && '📶 WiFi Available'}
                  {key === 'airConditioned' && '❄️ Air Conditioned'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Photo Upload Section */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#fff3e0', 
          borderRadius: '8px',
          border: '1px solid #ff9800'
        }}>
          <h3 style={{ color: '#CC0001', marginBottom: '15px', fontSize: '16px' }}>
            📸 Upload Photos
          </h3>

          <div style={{ marginBottom: '15px' }}>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={isUploadingPhotos}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            {isUploadingPhotos && (
              <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                📤 Uploading photos...
              </div>
            )}
          </div>

          {/* Display uploaded photos */}
          {uploadedPhotos.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
              gap: '10px',
              marginTop: '10px'
            }}>
              {uploadedPhotos.map((photo) => (
                <div key={photo.id} style={{ position: 'relative' }}>
                  <img
                    src={photo.url}
                    alt={photo.name}
                    style={{
                      width: '100%',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'rgba(255, 0, 0, 0.8)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Review Section */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f3e5f5', 
          borderRadius: '8px',
          border: '1px solid #9c27b0'
        }}>
          <h3 style={{ color: '#CC0001', marginBottom: '15px', fontSize: '16px' }}>
            ⭐ Enhanced Review System
          </h3>

          {/* Category Ratings */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
              Rate by Category (1-5 stars each):
            </h4>
            
            {/* Food Quality */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                🍽️ Food Quality
              </label>
              <select
                value={initialReview.rating.foodQuality}
                onChange={(e) => handleCategoryRating('foodQuality', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value={0}>Select rating (optional)</option>
                <option value={1}>⭐ (1) Poor</option>
                <option value={2}>⭐⭐ (2) Fair</option>
                <option value={3}>⭐⭐⭐ (3) Good</option>
                <option value={4}>⭐⭐⭐⭐ (4) Very Good</option>
                <option value={5}>⭐⭐⭐⭐⭐ (5) Excellent</option>
              </select>
            </div>

            {/* Value for Money */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                💰 Value for Money
              </label>
              <select
                value={initialReview.rating.valueForMoney}
                onChange={(e) => handleCategoryRating('valueForMoney', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value={0}>Select rating (optional)</option>
                <option value={1}>⭐ (1) Poor</option>
                <option value={2}>⭐⭐ (2) Fair</option>
                <option value={3}>⭐⭐⭐ (3) Good</option>
                <option value={4}>⭐⭐⭐⭐ (4) Very Good</option>
                <option value={5}>⭐⭐⭐⭐⭐ (5) Excellent</option>
              </select>
            </div>

            {/* Service Quality */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                🏪 Service Quality
              </label>
              <select
                value={initialReview.rating.serviceQuality}
                onChange={(e) => handleCategoryRating('serviceQuality', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value={0}>Select rating (optional)</option>
                <option value={1}>⭐ (1) Poor</option>
                <option value={2}>⭐⭐ (2) Fair</option>
                <option value={3}>⭐⭐⭐ (3) Good</option>
                <option value={4}>⭐⭐⭐⭐ (4) Very Good</option>
                <option value={5}>⭐⭐⭐⭐⭐ (5) Excellent</option>
              </select>
            </div>

            {/* Ambiance */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                🌍 Ambiance/Environment
              </label>
              <select
                value={initialReview.rating.ambiance}
                onChange={(e) => handleCategoryRating('ambiance', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value={0}>Select rating (optional)</option>
                <option value={1}>⭐ (1) Poor</option>
                <option value={2}>⭐⭐ (2) Fair</option>
                <option value={3}>⭐⭐⭐ (3) Good</option>
                <option value={4}>⭐⭐⭐⭐ (4) Very Good</option>
                <option value={5}>⭐⭐⭐⭐⭐ (5) Excellent</option>
              </select>
            </div>

            {/* Overall Rating Display */}
            {calculateOverallRating(initialReview.rating) > 0 && (
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#e8f5e8', 
                borderRadius: '4px',
                marginBottom: '15px'
              }}>
                <strong>Overall Rating: {calculateOverallRating(initialReview.rating).toFixed(1)}/5.0</strong>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Based on {Object.values(initialReview.rating).filter(r => r > 0).length} category ratings
                </div>
              </div>
            )}
          </div>

          {/* Visit Details */}
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
              Visit Details:
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
                  Visit Type
                </label>
                <select
                  value={initialReview.visitType}
                  onChange={(e) => handleInitialReview('visitType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  <option value="dine-in">🍽️ Dine-in</option>
                  <option value="takeaway">🥡 Takeaway</option>
                  <option value="delivery">🚚 Delivery</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
                  Party Size
                </label>
                <select
                  value={initialReview.partySize}
                  onChange={(e) => handleInitialReview('partySize', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  <option value="solo">👤 Solo</option>
                  <option value="couple">👫 Couple</option>
                  <option value="family">👨‍👩‍👧‍👦 Family</option>
                  <option value="group">👥 Group</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
                  Meal Type
                </label>
                <select
                  value={initialReview.mealType}
                  onChange={(e) => handleInitialReview('mealType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  <option value="breakfast">🌅 Breakfast</option>
                  <option value="lunch">☀️ Lunch</option>
                  <option value="dinner">🌙 Dinner</option>
                  <option value="snack">🍿 Snack</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
                  Visit Date
                </label>
                <input
                  type="date"
                  value={initialReview.visitDate}
                  onChange={(e) => handleInitialReview('visitDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Review Comment */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Review Comment
            </label>
            <textarea
              value={initialReview.comment}
              onChange={(e) => handleInitialReview('comment', e.target.value)}
              placeholder="Share your detailed experience (optional)"
              rows="3"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Enhanced Check-in Option with Location Verification */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#e8f5e8', 
          borderRadius: '8px',
          border: '1px solid #4caf50'
        }}>
          <h3 style={{ color: '#CC0001', marginBottom: '15px', fontSize: '16px' }}>
            📍 Verified Check-in System
          </h3>

          {/* Location Verification Button */}
          <div style={{ marginBottom: '15px' }}>
            <button
              type="button"
              onClick={verifyLocationForCheckIn}
              disabled={isVerifyingLocation || !formData.location || formData.location.lat === 0}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: isVerifyingLocation ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: isVerifyingLocation ? 'not-allowed' : 'pointer',
                marginBottom: '10px'
              }}
            >
              {isVerifyingLocation ? '📍 Verifying Location...' : '📍 Verify Location for Check-in'}
            </button>
            
            {!formData.location || formData.location.lat === 0 ? (
              <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
                ⚠️ Please set restaurant location first
              </div>
            ) : null}
          </div>

          {/* Verification Status */}
          {locationVerification.verificationMessage && (
            <div style={{ 
              marginBottom: '15px', 
              padding: '10px', 
              backgroundColor: locationVerification.isVerified ? '#f0f8f0' : '#fff3e0', 
              borderRadius: '4px',
              fontSize: '14px',
              color: locationVerification.isVerified ? '#2e7d32' : '#f57c00',
              border: `1px solid ${locationVerification.isVerified ? '#4caf50' : '#ff9800'}`
            }}>
              {locationVerification.verificationMessage}
            </div>
          )}

          {/* Check-in Option */}
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showCheckInOption}
              onChange={(e) => setShowCheckInOption(e.target.checked)}
              disabled={!locationVerification.isVerified}
              style={{ marginRight: '8px' }}
            />
            <span style={{ 
              fontWeight: 'bold',
              color: locationVerification.isVerified ? '#2e7d32' : '#999'
            }}>
              ✅ I want to check-in to this restaurant now
              {!locationVerification.isVerified && ' (Location verification required)'}
            </span>
          </label>
          
          {showCheckInOption && locationVerification.isVerified && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#f0f8f0', 
              borderRadius: '4px',
              fontSize: '14px',
              color: '#2e7d32'
            }}>
              🎉 Great! You'll be automatically checked-in when you submit this restaurant.
              <br />
              <strong>Verified at {locationVerification.distance.toFixed(0)}m from restaurant</strong>
              <br />
              This will help other users discover your favorite spots!
            </div>
          )}

          {/* Future Check-in Feature Info */}
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666'
          }}>
            💡 <strong>Future Feature:</strong> Users will be able to check-in to existing restaurants 
            using this same location verification system (100m radius).
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#CC0001',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '12px 20px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EaterySubmissionForm;
