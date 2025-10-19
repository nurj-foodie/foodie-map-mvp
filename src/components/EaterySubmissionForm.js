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
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [showNearbyRestaurants, setShowNearbyRestaurants] = useState(false);

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
        verified: false,
        createdBy: 'user_submission', // In a real app, this would be currentUser.uid
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending_review',
        source: 'user_submission',
        // Additional fields for better data structure
        types: ['restaurant', 'food', 'point_of_interest', 'establishment'],
        operatingHours: {
          isOpen: true, // Default assumption
          hours: 'Not specified'
        }
      });
      
      console.log('✅ Restaurant submitted successfully:', formData.name);
      alert('Restaurant submitted successfully! It will be reviewed by admin.');
      
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
        description: ''
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
