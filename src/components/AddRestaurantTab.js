import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './AddRestaurantTab.css';

const AddRestaurantTab = () => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [duplicateCheck, setDuplicateCheck] = useState(null);
  
  // Form data state
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

  // Photo upload state
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  // Location verification state
  const [userLocation, setUserLocation] = useState(null);
  const [locationVerification, setLocationVerification] = useState({
    isVerified: false,
    distance: null,
    verificationMessage: ''
  });

  // Google Places search state
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Get user location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or failed:', error);
        }
      );
    }
  }, []);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested object changes
  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Handle operating hours changes
  const handleOperatingHoursChange = (dayIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        periods: prev.operatingHours.periods.map((period, index) => 
          index === dayIndex ? { ...period, [field]: value } : period
        )
      }
    }));
  };

  // Search for existing restaurants to prevent duplicates
  const checkForDuplicates = async (name, address) => {
    try {
      console.log('🔍 Checking for duplicate restaurants...');
      
      // Search by name
      const nameQuery = query(
        collection(db, 'eateries'),
        where('name', '>=', name.toLowerCase()),
        where('name', '<=', name.toLowerCase() + '\uf8ff'),
        limit(5)
      );
      
      const nameSnapshot = await getDocs(nameQuery);
      const nameMatches = nameSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Search by address
      const addressQuery = query(
        collection(db, 'eateries'),
        where('address', '>=', address.toLowerCase()),
        where('address', '<=', address.toLowerCase() + '\uf8ff'),
        limit(5)
      );
      
      const addressSnapshot = await getDocs(addressQuery);
      const addressMatches = addressSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const allMatches = [...nameMatches, ...addressMatches];
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => m.id === match.id)
      );
      
      if (uniqueMatches.length > 0) {
        setDuplicateCheck({
          hasDuplicates: true,
          matches: uniqueMatches
        });
        return true;
      } else {
        setDuplicateCheck({
          hasDuplicates: false,
          matches: []
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking for duplicates:', error);
      return false;
    }
  };

  // Search Google Places for restaurant information
  const searchGooglePlaces = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setIsSearching(true);
      console.log('🔍 Searching Google Places for:', query);
      
      // Create a temporary map element for PlacesService
      const tempMapDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(tempMapDiv);
      
      const request = {
        query: query,
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'rating', 'types', 'formatted_phone_number', 'website', 'price_level']
      };
      
      service.textSearch(request, (results, status) => {
        setIsSearching(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          console.log(`✅ Found ${results.length} places`);
          setSearchResults(results.slice(0, 5)); // Limit to 5 results
          setShowSearchResults(true);
        } else {
          console.log('❌ Places search failed:', status);
          setSearchResults([]);
          setShowSearchResults(false);
        }
      });
    } catch (error) {
      setIsSearching(false);
      console.error('❌ Error searching Google Places:', error);
    }
  };

  // Select a place from search results
  const selectPlace = (place) => {
    setFormData(prev => ({
      ...prev,
      name: place.name || '',
      address: place.formatted_address || '',
      location: {
        lat: place.geometry?.location?.lat() || 0,
        lng: place.geometry?.location?.lng() || 0
      },
      place_id: place.place_id || '',
      rating: place.rating || 0,
      phone: place.formatted_phone_number || '',
      website: place.website || '',
      priceLevel: place.price_level || 1,
      types: place.types || ['restaurant', 'food', 'establishment']
    }));
    
    setShowSearchResults(false);
    setSearchResults([]);
    
    // Check for duplicates after selecting a place
    if (place.name && place.formatted_address) {
      checkForDuplicates(place.name, place.formatted_address);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Check total photo limit (max 10 photos)
    const MAX_PHOTOS = 10;
    const currentPhotoCount = uploadedPhotos.length;
    const newPhotoCount = files.length;
    
    if (currentPhotoCount + newPhotoCount > MAX_PHOTOS) {
      alert(`Maximum ${MAX_PHOTOS} photos allowed. You currently have ${currentPhotoCount} photos and are trying to add ${newPhotoCount} more.`);
      return;
    }

    // Check individual file size (max 5MB per photo)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      alert(`Some files are too large. Maximum file size is 5MB. Please compress or resize your photos.`);
      return;
    }

    setIsUploadingPhotos(true);
    
    try {
      const newPhotos = [];
      
      for (const file of files) {
        // Compress image
        const compressedFile = await compressImage(file);
        
        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onload = (e) => {
          newPhotos.push({
            id: Date.now() + Math.random(),
            name: file.name,
            size: compressedFile.size,
            type: compressedFile.type,
            data: e.target.result,
            uploadedAt: new Date()
          });
        };
        reader.readAsDataURL(compressedFile);
      }
      
      // Wait for all files to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadedPhotos(prev => [...prev, ...newPhotos]);
      console.log(`✅ Uploaded ${files.length} photos (${currentPhotoCount + newPhotoCount}/${MAX_PHOTOS} total)`);
    } catch (error) {
      console.error('❌ Error uploading photos:', error);
      alert('Error uploading photos. Please try again.');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  // Compress image
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(resolve, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Remove photo
  const removePhoto = (photoId) => {
    setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  // Verify location
  const verifyLocation = () => {
    if (!userLocation || !formData.location.lat || !formData.location.lng) {
      setLocationVerification({
        isVerified: false,
        distance: null,
        verificationMessage: 'Location data not available'
      });
      return;
    }

    // Calculate distance between user and restaurant
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      formData.location.lat, formData.location.lng
    );

    const isVerified = distance <= 0.5; // Within 500m
    setLocationVerification({
      isVerified,
      distance,
      verificationMessage: isVerified 
        ? `✅ Location verified (${distance.toFixed(2)}km away)`
        : `⚠️ Location not verified (${distance.toFixed(2)}km away)`
    });
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to submit a restaurant');
      return;
    }

    // Check for duplicates first
    const hasDuplicates = await checkForDuplicates(formData.name, formData.address);
    if (hasDuplicates && duplicateCheck?.hasDuplicates) {
      // Show warning but allow user to proceed if they confirm
      const proceed = window.confirm(
        'Similar restaurants already exist in our database. Are you sure this is a different restaurant that should be added?'
      );
      if (!proceed) {
        setSubmissionStatus({
          type: 'warning',
          message: 'Submission cancelled. Please review the duplicate restaurants or modify your submission.'
        });
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      const cleanFormData = {
        ...formData,
        name: formData.name.trim(),
        address: formData.address.trim(),
        description: formData.description.trim() || '',
        // Metadata
        verified: false,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending_review',
        source: 'user_submission',
        // Analytics
        totalViews: 0,
        totalClicks: 0,
        totalCheckIns: 0,
        userCheckIns: 0,
        userReviews: [],
        userPhotos: uploadedPhotos,
        // Location verification
        locationVerification: {
          isVerified: locationVerification.isVerified,
          distance: locationVerification.distance,
          verifiedAt: new Date()
        }
      };

      await addDoc(collection(db, 'eateries'), cleanFormData);
      
      console.log('✅ Restaurant submitted successfully:', formData.name);
      
      setSubmissionStatus({
        type: 'success',
        message: `Restaurant "${formData.name}" submitted successfully! It will be reviewed and published within 24 hours.`
      });
      
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
      
      setUploadedPhotos([]);
      setDuplicateCheck(null);
      setLocationVerification({
        isVerified: false,
        distance: null,
        verificationMessage: ''
      });
      setActiveStep(1);
      
    } catch (error) {
      console.error('❌ Error submitting restaurant:', error);
      setSubmissionStatus({
        type: 'error',
        message: 'Failed to submit restaurant. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step 1: Basic Information
  const renderStep1 = () => (
    <div className="add-restaurant-step">
      <h3>🍽️ Basic Information</h3>
      
      <div className="form-group">
        <label>Restaurant Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter restaurant name"
          required
        />
      </div>

      <div className="form-group">
        <label>Search for Restaurant</label>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search Google Places for restaurant info..."
            onChange={(e) => searchGooglePlaces(e.target.value)}
          />
          {isSearching && <div className="loading-spinner">🔍</div>}
          
          {showSearchResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((place, index) => (
                <div
                  key={index}
                  className="search-result-item"
                  onClick={() => selectPlace(place)}
                >
                  <div className="place-name">{place.name}</div>
                  <div className="place-address">{place.formatted_address}</div>
                  {place.rating && (
                    <div className="place-rating">⭐ {place.rating}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Address *</label>
        <textarea
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Enter full address"
          rows={3}
          required
        />
      </div>

      <div className="form-group">
        <label>Cuisine Type</label>
        <select
          value={formData.cuisineType}
          onChange={(e) => handleInputChange('cuisineType', e.target.value)}
        >
          <option value="">Select cuisine type</option>
          <option value="malay">Malay</option>
          <option value="chinese">Chinese</option>
          <option value="indian">Indian</option>
          <option value="western">Western</option>
          <option value="japanese">Japanese</option>
          <option value="korean">Korean</option>
          <option value="thai">Thai</option>
          <option value="italian">Italian</option>
          <option value="mexican">Mexican</option>
          <option value="fast-food">Fast Food</option>
          <option value="cafe">Cafe</option>
          <option value="dessert">Dessert</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Halal Status</label>
        <select
          value={formData.halalStatus}
          onChange={(e) => handleInputChange('halalStatus', e.target.value)}
        >
          <option value="unknown">Unknown</option>
          <option value="halal">Halal</option>
          <option value="non-halal">Non-Halal</option>
          <option value="pork-free">Pork-Free</option>
        </select>
      </div>

      <div className="form-group">
        <label>Price Level</label>
        <select
          value={formData.priceLevel}
          onChange={(e) => handleInputChange('priceLevel', parseInt(e.target.value))}
        >
          <option value={1}>$ - Budget</option>
          <option value={2}>$$ - Moderate</option>
          <option value={3}>$$$ - Expensive</option>
          <option value={4}>$$$$ - Very Expensive</option>
        </select>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe the restaurant, specialties, atmosphere..."
          rows={4}
        />
      </div>

      <div className="form-group">
        <label>Phone Number</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="e.g., +60 3-1234 5678"
        />
      </div>

      <div className="form-group">
        <label>Website</label>
        <input
          type="url"
          value={formData.website}
          onChange={(e) => handleInputChange('website', e.target.value)}
          placeholder="https://example.com"
        />
      </div>
    </div>
  );

  // Render step 2: Photos
  const renderStep2 = () => (
    <div className="add-restaurant-step">
      <h3>📸 Photos</h3>
      <p>Add photos to help others discover this restaurant</p>
      
      <div className="photo-upload-section">
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />
        <label htmlFor="photo-upload" className="photo-upload-button">
          {isUploadingPhotos ? '📤 Uploading...' : '📷 Add Photos'}
        </label>
        <div className="photo-limits">
          <small>📸 Multiple photos supported • Max 10 photos • Max 5MB per photo</small>
          {uploadedPhotos.length > 0 && (
            <small>Current: {uploadedPhotos.length}/10 photos</small>
          )}
        </div>
        
        {uploadedPhotos.length > 0 && (
          <div className="uploaded-photos">
            {uploadedPhotos.map((photo) => (
              <div key={photo.id} className="photo-item">
                <img src={photo.data} alt={photo.name} />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="remove-photo"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render step 3: Operating Hours
  const renderStep3 = () => (
    <div className="add-restaurant-step">
      <h3>🕒 Operating Hours</h3>
      
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.operatingHours.isOpen24Hours}
            onChange={(e) => handleNestedChange('operatingHours', 'isOpen24Hours', e.target.checked)}
          />
          Open 24 Hours
        </label>
      </div>

      {!formData.operatingHours.isOpen24Hours && (
        <div className="operating-hours">
          {formData.operatingHours.periods.map((period, index) => (
            <div key={index} className="day-hours">
              <div className="day-name">{period.day}</div>
              <div className="hours-controls">
                <label>
                  <input
                    type="checkbox"
                    checked={period.isClosed}
                    onChange={(e) => handleOperatingHoursChange(index, 'isClosed', e.target.checked)}
                  />
                  Closed
                </label>
                {!period.isClosed && (
                  <>
                    <input
                      type="time"
                      value={period.open}
                      onChange={(e) => handleOperatingHoursChange(index, 'open', e.target.value)}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={period.close}
                      onChange={(e) => handleOperatingHoursChange(index, 'close', e.target.value)}
                    />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render step 4: Accessibility & Features
  const renderStep4 = () => (
    <div className="add-restaurant-step">
      <h3>♿ Accessibility & Features</h3>
      
      <div className="accessibility-grid">
        {Object.entries(formData.accessibility).map(([key, value]) => (
          <label key={key} className="accessibility-item">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleNestedChange('accessibility', key, e.target.checked)}
            />
            <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
          </label>
        ))}
      </div>
    </div>
  );

  // Render step 5: Review & Submit
  const renderStep5 = () => (
    <div className="add-restaurant-step">
      <h3>📋 Review & Submit</h3>
      
      <div className="review-section">
        <h4>Restaurant Information</h4>
        <div className="review-item">
          <strong>Name:</strong> {formData.name}
        </div>
        <div className="review-item">
          <strong>Address:</strong> {formData.address}
        </div>
        <div className="review-item">
          <strong>Cuisine:</strong> {formData.cuisineType || 'Not specified'}
        </div>
        <div className="review-item">
          <strong>Halal Status:</strong> {formData.halalStatus}
        </div>
        <div className="review-item">
          <strong>Price Level:</strong> {'$'.repeat(formData.priceLevel)}
        </div>
        {formData.phone && (
          <div className="review-item">
            <strong>Phone:</strong> {formData.phone}
          </div>
        )}
        {formData.website && (
          <div className="review-item">
            <strong>Website:</strong> {formData.website}
          </div>
        )}
        {formData.description && (
          <div className="review-item">
            <strong>Description:</strong> {formData.description}
          </div>
        )}
      </div>

      {uploadedPhotos.length > 0 && (
        <div className="review-section">
          <h4>Photos ({uploadedPhotos.length})</h4>
          <div className="review-photos">
            {uploadedPhotos.map((photo) => (
              <img key={photo.id} src={photo.data} alt={photo.name} />
            ))}
          </div>
        </div>
      )}

      <div className="review-section">
        <h4>Location Verification</h4>
        <button
          type="button"
          onClick={verifyLocation}
          className="verify-location-btn"
        >
          🔍 Verify Location
        </button>
        {locationVerification.verificationMessage && (
          <div className={`verification-message ${locationVerification.isVerified ? 'verified' : 'not-verified'}`}>
            {locationVerification.verificationMessage}
          </div>
        )}
      </div>

      {duplicateCheck && duplicateCheck.hasDuplicates && (
        <div className="duplicate-warning">
          <h4>⚠️ Similar Restaurants Found</h4>
          <p>Please check if any of these are the same restaurant:</p>
          {duplicateCheck.matches.map((match, index) => (
            <div key={index} className="duplicate-item">
              <strong>{match.name}</strong>
              <div>{match.address}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="add-restaurant-tab">
      <div className="add-restaurant-header">
        <h2>➕ Add Restaurant</h2>
        <p>Help others discover amazing restaurants in Malaysia</p>
      </div>

      {!user && (
        <div className="login-prompt">
          <h3>🔐 Login Required</h3>
          <p>Please log in to submit a restaurant</p>
        </div>
      )}

      {user && (
        <>
          {/* Progress Steps */}
          <div className="progress-steps">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`step ${activeStep >= step ? 'active' : ''} ${activeStep === step ? 'current' : ''}`}
              >
                <div className="step-number">{step}</div>
                <div className="step-label">
                  {step === 1 && 'Basic Info'}
                  {step === 2 && 'Photos'}
                  {step === 3 && 'Hours'}
                  {step === 4 && 'Features'}
                  {step === 5 && 'Review'}
                </div>
              </div>
            ))}
          </div>

          {/* Form Steps */}
          <form onSubmit={handleSubmit} className="add-restaurant-form">
            {activeStep === 1 && renderStep1()}
            {activeStep === 2 && renderStep2()}
            {activeStep === 3 && renderStep3()}
            {activeStep === 4 && renderStep4()}
            {activeStep === 5 && renderStep5()}

            {/* Navigation Buttons */}
            <div className="form-navigation">
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="btn-secondary"
                >
                  ← Previous
                </button>
              )}
              
              {activeStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="btn-primary"
                  disabled={!formData.name || !formData.address}
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || !formData.name || !formData.address}
                >
                  {isSubmitting ? '📤 Submitting...' : '✅ Submit Restaurant'}
                </button>
              )}
            </div>
          </form>

          {/* Submission Status */}
          {submissionStatus && (
            <div className={`submission-status ${submissionStatus.type}`}>
              {submissionStatus.message}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AddRestaurantTab;
