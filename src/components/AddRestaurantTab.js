import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './AddRestaurantTab.css';

// Build structured menu database from menu photos
// Organizes menu items by meal time for better search and display
const buildMenuDatabase = (menuPhotos) => {
  const menu = {
    breakfast: [],
    lunch: [],
    dinner: [],
    all: [], // Items available all day
    allItems: [] // Flat list of all items for search
  };
  
  menuPhotos.forEach(photo => {
    if (!photo.menuName || !photo.menuName.trim()) return; // Skip unnamed items
    
    const menuItem = {
      id: photo.id,
      name: photo.menuName.trim(),
      photo: photo.data,
      photoId: photo.id,
      addedAt: photo.uploadedAt || new Date()
    };
    
    // Add to appropriate meal time category
    const mealTime = photo.mealTime || 'all';
    if (mealTime === 'all') {
      menu.all.push(menuItem);
      menu.breakfast.push(menuItem);
      menu.lunch.push(menuItem);
      menu.dinner.push(menuItem);
    } else if (menu[mealTime]) {
      menu[mealTime].push(menuItem);
    }
    
    // Add to flat list for search
    menu.allItems.push(menuItem.name.toLowerCase());
  });
  
  return menu;
};

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
  
  // Menu photos state (photos with names)
  const [menuPhotos, setMenuPhotos] = useState([]);
  const [isUploadingMenu, setIsUploadingMenu] = useState(false);

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

  // Nearby restaurants state (for auto-detection)
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  // Map state for location pinning
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapMarker, setMapMarker] = useState(null);

  // Calculate distance between two points (helper function)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Get user location on component mount and auto-detect nearby restaurants
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          
          // Auto-detect nearby restaurants (100m radius)
          await checkNearbyRestaurants(location);
        },
        (error) => {
          console.log('Location access denied or failed:', error);
        }
      );
    }
  }, []);

  // Check for nearby restaurants (100m radius)
  const checkNearbyRestaurants = async (location) => {
    if (!location || !location.lat || !location.lng) return;
    
    try {
      setIsLoadingNearby(true);
      console.log('🔍 Checking for nearby restaurants (100m radius)...');
      
      // Query Firestore for restaurants
      const eateriesRef = collection(db, 'eateries');
      const snapshot = await getDocs(eateriesRef);
      
      const nearby = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.location && data.location.lat && data.location.lng) {
          // Calculate distance in meters
          const distance = calculateDistance(
            location.lat, location.lng,
            data.location.lat, data.location.lng
          ) * 1000; // Convert km to meters
          
          // Check if within 100m radius
          if (distance <= 100) {
            nearby.push({
              id: doc.id,
              ...data,
              distance: distance.toFixed(0) // Distance in meters
            });
          }
        }
      });
      
      // Sort by distance (closest first)
      nearby.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      
      setNearbyRestaurants(nearby);
      console.log(`✅ Found ${nearby.length} nearby restaurants within 100m`);
      
      if (nearby.length > 0) {
        console.log('📍 Nearby restaurants:', nearby.map(r => r.name));
      }
    } catch (error) {
      console.error('❌ Error checking nearby restaurants:', error);
    } finally {
      setIsLoadingNearby(false);
    }
  };

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
  // NOTE: Using legacy PlacesService (deprecated but still functional)
  // TODO: Migrate to google.maps.places.Place API when stable
  // Deprecation notice: As of March 2025, PlacesService is deprecated but will continue to work
  // At least 12 months notice will be given before discontinuation
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
    
    // Check for duplicates after selecting a place (only once)
    // Using setTimeout to prevent double-check from React StrictMode re-renders
    if (place.name && place.formatted_address) {
      const checkTimeout = setTimeout(() => {
        checkForDuplicates(place.name, place.formatted_address);
        clearTimeout(checkTimeout);
      }, 100);
    }
  };

  // Handle photo upload from file input
  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    await processPhotoFiles(files);
  };

  // Handle photo capture from camera
  const handleCameraCapture = async () => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera not available on this device');
        return;
      }

      // Create video element for camera preview
      const video = document.createElement('video');
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.zIndex = '10000';
      video.style.objectFit = 'cover';
      video.autoplay = true;
      video.playsInline = true;

      // Create overlay with capture button
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.zIndex = '10001';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.justifyContent = 'flex-end';
      overlay.style.alignItems = 'center';
      overlay.style.paddingBottom = '50px';

      const captureBtn = document.createElement('button');
      captureBtn.textContent = '📷 Capture Photo';
      captureBtn.style.padding = '15px 30px';
      captureBtn.style.fontSize = '18px';
      captureBtn.style.backgroundColor = '#4CAF50';
      captureBtn.style.color = 'white';
      captureBtn.style.border = 'none';
      captureBtn.style.borderRadius = '50px';
      captureBtn.style.cursor = 'pointer';
      captureBtn.style.marginBottom = '20px';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '❌ Cancel';
      cancelBtn.style.padding = '10px 20px';
      cancelBtn.style.fontSize = '16px';
      cancelBtn.style.backgroundColor = '#f44336';
      cancelBtn.style.color = 'white';
      cancelBtn.style.border = 'none';
      cancelBtn.style.borderRadius = '25px';
      cancelBtn.style.cursor = 'pointer';

      overlay.appendChild(captureBtn);
      overlay.appendChild(cancelBtn);
      document.body.appendChild(video);
      document.body.appendChild(overlay);

      // Start camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      video.srcObject = stream;

      // Capture photo
      const capturePhoto = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
          // Stop camera stream
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(video);
          document.body.removeChild(overlay);
          
          // Convert blob to file
          const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          await processPhotoFiles([file]);
        }, 'image/jpeg', 0.9);
      };

      captureBtn.onclick = capturePhoto;
      cancelBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(video);
        document.body.removeChild(overlay);
      };
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  // Process photo files (from file input or camera)
  const processPhotoFiles = async (files) => {
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

  // Handle menu photo upload
  const handleMenuPhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    await processMenuPhotoFiles(files);
  };

  // Process menu photo files
  const processMenuPhotoFiles = async (files) => {
    if (files.length === 0) return;

    const MAX_MENU_PHOTOS = 10;
    const currentMenuCount = menuPhotos.length;
    const newMenuCount = files.length;
    
    if (currentMenuCount + newMenuCount > MAX_MENU_PHOTOS) {
      alert(`Maximum ${MAX_MENU_PHOTOS} menu photos allowed. You currently have ${currentMenuCount} photos and are trying to add ${newMenuCount} more.`);
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      alert(`Some files are too large. Maximum file size is 5MB. Please compress or resize your photos.`);
      return;
    }

    setIsUploadingMenu(true);
    
    try {
      const newMenuPhotos = [];
      
      for (const file of files) {
        const compressedFile = await compressImage(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          newMenuPhotos.push({
            id: Date.now() + Math.random(),
            name: file.name,
            menuName: '', // User will name this menu item
            mealTime: 'all', // Default: 'breakfast', 'lunch', 'dinner', 'all'
            size: compressedFile.size,
            type: compressedFile.type,
            data: e.target.result,
            uploadedAt: new Date()
          });
        };
        reader.readAsDataURL(compressedFile);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMenuPhotos(prev => [...prev, ...newMenuPhotos]);
      console.log(`✅ Uploaded ${files.length} menu photos (${currentMenuCount + newMenuCount}/${MAX_MENU_PHOTOS} total)`);
    } catch (error) {
      console.error('❌ Error uploading menu photos:', error);
      alert('Error uploading menu photos. Please try again.');
    } finally {
      setIsUploadingMenu(false);
    }
  };

  // Update menu photo name
  const updateMenuPhotoName = (photoId, menuName) => {
    setMenuPhotos(prev => prev.map(photo => 
      photo.id === photoId ? { ...photo, menuName: menuName.trim() } : photo
    ));
  };

  // Update menu photo meal time
  const updateMenuPhotoMealTime = (photoId, mealTime) => {
    setMenuPhotos(prev => prev.map(photo => 
      photo.id === photoId ? { ...photo, mealTime: mealTime } : photo
    ));
  };

  // Remove menu photo
  const removeMenuPhoto = (photoId) => {
    setMenuPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  // Initialize map for location pinning
  const initializeLocationMap = () => {
    if (!window.google || !window.google.maps) {
      alert('Google Maps not loaded. Please wait a moment and try again.');
      return;
    }

    setShowLocationMap(true);
    
    // Initialize map after a short delay to ensure DOM is ready
    setTimeout(() => {
      const mapDiv = document.getElementById('location-map');
      if (!mapDiv) return;

      const initialLocation = formData.location.lat && formData.location.lng
        ? { lat: formData.location.lat, lng: formData.location.lng }
        : userLocation || { lat: 3.1390, lng: 101.6869 }; // Default to KL

      const map = new window.google.maps.Map(mapDiv, {
        center: initialLocation,
        zoom: 17,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      // Create marker
      const marker = new window.google.maps.Marker({
        position: initialLocation,
        map: map,
        draggable: true,
        title: 'Drag to set restaurant location'
      });

      // Update form data when marker is dragged
      marker.addListener('dragend', (e) => {
        const newLocation = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        };
        setFormData(prev => ({
          ...prev,
          location: newLocation
        }));
        
        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: newLocation }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setFormData(prev => ({
              ...prev,
              address: results[0].formatted_address
            }));
          }
        });
      });

      // Update marker when clicking on map
      map.addListener('click', (e) => {
        const newLocation = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        };
        marker.setPosition(newLocation);
        setFormData(prev => ({
          ...prev,
          location: newLocation
        }));
        
        // Reverse geocode
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: newLocation }, (results, status) => {
          if (status === 'OK' && results[0]) {
            setFormData(prev => ({
              ...prev,
              address: results[0].formatted_address
            }));
          }
        });
      });

      setMapInstance(map);
      setMapMarker(marker);
    }, 100);
  };

  // Verify location (calculate distance from user location)
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


  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent submission if not on Step 5 (Review & Submit)
    if (activeStep !== 5) {
      console.log('⚠️ Form submission prevented: Not on Review & Submit step');
      return;
    }
    
    if (!user) {
      alert('Please log in to submit a restaurant');
      return;
    }
    
    // Ensure location is set
    if (!formData.location.lat || !formData.location.lng || formData.location.lat === 0 || formData.location.lng === 0) {
      alert('Please set the restaurant location on the map before submitting.');
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
      // Convert operating hours to Firestore format
      // Firestore expects: day (0-6), openTime ("0800"), closeTime ("2200")
      const dayMap = {
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6,
        'Sunday': 0
      };
      
      const convertTimeToFirestore = (timeStr) => {
        // Convert "09:00" to "0900" or "22:00" to "2200"
        if (!timeStr) return null;
        return timeStr.replace(':', '').padStart(4, '0');
      };
      
      const firestorePeriods = formData.operatingHours.periods
        .filter(period => !period.isClosed)
        .map(period => ({
          day: dayMap[period.day] !== undefined ? dayMap[period.day] : 0,
          openTime: convertTimeToFirestore(period.open) || '0800',
          closeTime: convertTimeToFirestore(period.close) || '2200'
        }));
      
      // Generate weekdayText array
      const weekdayText = formData.operatingHours.periods.map(period => {
        if (period.isClosed) {
          return `${period.day}: Closed`;
        }
        const openFormatted = period.open || '08:00';
        const closeFormatted = period.close || '22:00';
        return `${period.day}: ${openFormatted} – ${closeFormatted}`;
      });
      
      // Build Firestore structure matching actual schema
      const cleanFormData = {
        // Basic Information (top-level)
        name: formData.name.trim(),
        address: formData.address.trim(),
        placeId: formData.place_id || '',
        location: {
          lat: formData.location.lat,
          lng: formData.location.lng
        },
        cuisineType: formData.cuisineType || '',
        cuisineCategory: formData.cuisineType || '', // Same as cuisineType for now
        cuisineTags: formData.cuisineType ? [formData.cuisineType.toLowerCase()] : [],
        halalStatus: formData.halalStatus || 'unknown',
        rating: formData.rating || 0,
        priceLevel: formData.priceLevel || 1,
        types: formData.types || ['restaurant', 'food', 'establishment'],
        businessStatus: formData.businessStatus || 'OPERATIONAL',
        isActive: true,
        
        // Operating Hours (Firestore format)
        operatingHours: {
          isOpen: formData.operatingHours.isOpen,
          isOpenNow: false, // Will be calculated by backend
          isOpen24Hours: formData.operatingHours.isOpen24Hours,
          periods: firestorePeriods,
          weekdayText: weekdayText,
          timezone: 'Asia/Kuala_Lumpur',
          specialHours: []
        },
        
        // Nested Maps (matching actual Firestore structure)
        analytics: {
          totalViews: 0,
          totalClicks: 0,
          totalCheckIns: 0,
          totalFavorites: 0,
          lastViewed: null,
          popularityScore: 0
        },
        
        business: {
          priceLevel: formData.priceLevel || 1,
          priceRange: '$'.repeat(formData.priceLevel || 1),
          acceptsReservations: false,
          deliveryAvailable: formData.accessibility.deliveryAvailable || false,
          dineInAvailable: formData.accessibility.dineInAvailable !== undefined ? formData.accessibility.dineInAvailable : true,
          takeoutAvailable: formData.accessibility.takeoutAvailable !== undefined ? formData.accessibility.takeoutAvailable : true,
          wheelchairAccessible: formData.accessibility.wheelchairAccessible || false
        },
        
        contact: {
          phone: formData.phone || '',
          internationalPhone: formData.phone || '',
          email: ''
        },
        
        socialMedia: {
          website: formData.website || ''
        },
        
        metadata: {
          dataSource: 'user_submission',
          discoveredAt: new Date().toISOString(),
          lastUpdated: new Date(),
          qualityScore: 0,
          version: 2
        },
        
        // Top-level fields (for compatibility)
        phone: formData.phone || '',
        website: formData.website || '',
        description: formData.description.trim() || '',
        
        // Photos
        photos: [], // Will be populated by admin after approval
        userPhotos: uploadedPhotos,
        menuPhotos: menuPhotos, // Menu photos with names and meal times
        
        // Structured Menu Database (built from menuPhotos)
        // This enables accurate food item searches and meal-time filtering
        menu: buildMenuDatabase(menuPhotos),
        
        // User engagement
        userCheckIns: 0,
        userReviews: [],
        userRatingTotal: 0,
        
        // Timestamps
        createdAt: new Date(),
        lastUpdated: new Date(),
        discoveredAt: new Date().toISOString(),
        
        // Submission metadata
        verified: false,
        createdBy: user.uid,
        status: 'pending_review',
        source: 'user_submission',
        
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
      setMenuPhotos([]);
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
      
      {/* Show nearby restaurants if found */}
      {nearbyRestaurants.length > 0 && (
        <div className="nearby-restaurants-warning">
          <h4>⚠️ Nearby Restaurants Found</h4>
          <p>We found {nearbyRestaurants.length} restaurant(s) within 100m of your location. Please check if the restaurant you want to add already exists:</p>
          <div className="nearby-restaurants-list">
            {nearbyRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="nearby-restaurant-item">
                <div className="restaurant-name">{restaurant.name}</div>
                <div className="restaurant-address">{restaurant.address}</div>
                <div className="restaurant-distance">📍 {restaurant.distance}m away</div>
              </div>
            ))}
          </div>
          <p className="warning-note">If your restaurant is not listed above, you can proceed to add it.</p>
        </div>
      )}
      
      {isLoadingNearby && (
        <div className="loading-nearby">
          🔍 Checking for nearby restaurants...
        </div>
      )}
      
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
        <div className="photo-upload-buttons">
          <label htmlFor="photo-upload" className="photo-upload-button">
            {isUploadingPhotos ? '📤 Uploading...' : '📁 Choose from Gallery'}
          </label>
          <button
            type="button"
            onClick={handleCameraCapture}
            className="photo-upload-button camera-button"
          >
            📷 Take Photo
          </button>
        </div>
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

      {/* Menu Photos Section */}
      <div className="menu-photos-section">
        <h4>🍽️ Menu Photos (Optional)</h4>
        <p>Upload photos of menu items and name them</p>
        
        <div className="photo-upload-section">
          <input
            type="file"
            id="menu-photo-upload"
            multiple
            accept="image/*"
            onChange={handleMenuPhotoUpload}
            style={{ display: 'none' }}
          />
          <div className="photo-upload-buttons">
            <label htmlFor="menu-photo-upload" className="photo-upload-button menu-button">
              {isUploadingMenu ? '📤 Uploading...' : '📁 Add Menu Photos'}
            </label>
            <button
              type="button"
              onClick={async () => {
                try {
                  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    alert('Camera not available on this device');
                    return;
                  }

                  const video = document.createElement('video');
                  video.style.position = 'fixed';
                  video.style.top = '0';
                  video.style.left = '0';
                  video.style.width = '100%';
                  video.style.height = '100%';
                  video.style.zIndex = '10000';
                  video.style.objectFit = 'cover';
                  video.autoplay = true;
                  video.playsInline = true;

                  const overlay = document.createElement('div');
                  overlay.style.position = 'fixed';
                  overlay.style.top = '0';
                  overlay.style.left = '0';
                  overlay.style.width = '100%';
                  overlay.style.height = '100%';
                  overlay.style.zIndex = '10001';
                  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                  overlay.style.display = 'flex';
                  overlay.style.flexDirection = 'column';
                  overlay.style.justifyContent = 'flex-end';
                  overlay.style.alignItems = 'center';
                  overlay.style.paddingBottom = '50px';

                  const captureBtn = document.createElement('button');
                  captureBtn.textContent = '📷 Capture Menu Photo';
                  captureBtn.style.padding = '15px 30px';
                  captureBtn.style.fontSize = '18px';
                  captureBtn.style.backgroundColor = '#17a2b8';
                  captureBtn.style.color = 'white';
                  captureBtn.style.border = 'none';
                  captureBtn.style.borderRadius = '50px';
                  captureBtn.style.cursor = 'pointer';
                  captureBtn.style.marginBottom = '20px';

                  const cancelBtn = document.createElement('button');
                  cancelBtn.textContent = '❌ Cancel';
                  cancelBtn.style.padding = '10px 20px';
                  cancelBtn.style.fontSize = '16px';
                  cancelBtn.style.backgroundColor = '#f44336';
                  cancelBtn.style.color = 'white';
                  cancelBtn.style.border = 'none';
                  cancelBtn.style.borderRadius = '25px';
                  cancelBtn.style.cursor = 'pointer';

                  overlay.appendChild(captureBtn);
                  overlay.appendChild(cancelBtn);
                  document.body.appendChild(video);
                  document.body.appendChild(overlay);

                  const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' }
                  });
                  video.srcObject = stream;

                  const capturePhoto = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0);
                    
                    canvas.toBlob(async (blob) => {
                      stream.getTracks().forEach(track => track.stop());
                      document.body.removeChild(video);
                      document.body.removeChild(overlay);
                      
                      const file = new File([blob], `menu-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
                      await processMenuPhotoFiles([file]);
                    }, 'image/jpeg', 0.9);
                  };

                  captureBtn.onclick = capturePhoto;
                  cancelBtn.onclick = () => {
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(video);
                    document.body.removeChild(overlay);
                  };
                } catch (error) {
                  console.error('❌ Error accessing camera:', error);
                  alert('Could not access camera. Please check permissions.');
                }
              }}
              className="photo-upload-button camera-button"
            >
              📷 Capture Menu
            </button>
          </div>
          <div className="photo-limits">
            <small>📸 Max 10 menu photos • Name each menu item</small>
            {menuPhotos.length > 0 && (
              <small>Current: {menuPhotos.length}/10 menu photos</small>
            )}
          </div>
          
          {menuPhotos.length > 0 && (
            <div className="uploaded-menu-photos">
              {menuPhotos.map((photo) => (
                <div key={photo.id} className="menu-photo-item">
                  <img src={photo.data} alt={photo.menuName || 'Menu item'} />
                  <input
                    type="text"
                    placeholder="Menu item name (e.g., Nasi Lemak, Roti Canai)"
                    value={photo.menuName || ''}
                    onChange={(e) => updateMenuPhotoName(photo.id, e.target.value)}
                    className="menu-name-input"
                  />
                  <select
                    value={photo.mealTime || 'all'}
                    onChange={(e) => updateMenuPhotoMealTime(photo.id, e.target.value)}
                    className="meal-time-select"
                    title="When is this item available?"
                  >
                    <option value="all">🌅 All Day</option>
                    <option value="breakfast">🌅 Breakfast</option>
                    <option value="lunch">☀️ Lunch</option>
                    <option value="dinner">🌙 Dinner</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMenuPhoto(photo.id)}
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

      {menuPhotos.length > 0 && (
        <div className="review-section">
          <h4>Menu Photos ({menuPhotos.length})</h4>
          <div className="review-menu-photos">
            {menuPhotos.map((photo) => (
              <div key={photo.id} className="review-menu-item">
                <img src={photo.data} alt={photo.menuName || 'Menu item'} />
                {photo.menuName && (
                  <div className="menu-item-name">{photo.menuName}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="review-section">
        <h4>Set Restaurant Location *</h4>
        <p>Pin the exact location of the restaurant on the map</p>
        
        {(!formData.location.lat || !formData.location.lng || formData.location.lat === 0 || formData.location.lng === 0) && (
          <div className="location-required-warning">
            ⚠️ Location is required. Please open the map and set the restaurant location.
          </div>
        )}
        
        {!showLocationMap ? (
          <button
            type="button"
            onClick={initializeLocationMap}
            className="verify-location-btn"
          >
            🗺️ Open Map to Set Location
          </button>
        ) : (
          <div className="location-map-container">
            <div id="location-map" style={{ width: '100%', height: '400px', marginBottom: '10px' }}></div>
            <div className="map-instructions">
              <p>📍 Drag the marker or click on the map to set the restaurant location</p>
              <button
                type="button"
                onClick={() => {
                  setShowLocationMap(false);
                  verifyLocation();
                }}
                className="btn-secondary"
              >
                ✅ Confirm Location
              </button>
            </div>
          </div>
        )}
        
        {locationVerification.verificationMessage && (
          <div className={`verification-message ${locationVerification.isVerified ? 'verified' : 'not-verified'}`}>
            {locationVerification.verificationMessage}
          </div>
        )}
        
        {formData.location.lat && formData.location.lng && (
          <div className="location-coordinates">
            <small>📍 Coordinates: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}</small>
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
          <form 
            onSubmit={handleSubmit} 
            className="add-restaurant-form"
            onKeyDown={(e) => {
              // Prevent form submission on Enter key unless on Step 5
              if (e.key === 'Enter' && activeStep !== 5) {
                e.preventDefault();
                // Instead, move to next step if valid
                if (formData.name && formData.address && activeStep < 5) {
                  setActiveStep(activeStep + 1);
                }
              }
            }}
          >
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
                  onClick={() => {
                    // Validate before moving to next step
                    if (!formData.name || !formData.address) {
                      alert('Please fill in restaurant name and address before proceeding.');
                      return;
                    }
                    setActiveStep(activeStep + 1);
                  }}
                  className="btn-primary"
                  disabled={!formData.name || !formData.address}
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    isSubmitting || 
                    !formData.name || 
                    !formData.address ||
                    !formData.location.lat ||
                    !formData.location.lng ||
                    formData.location.lat === 0 ||
                    formData.location.lng === 0
                  }
                  title={
                    (!formData.location.lat || !formData.location.lng || formData.location.lat === 0 || formData.location.lng === 0)
                      ? 'Please set the restaurant location on the map'
                      : 'Submit restaurant for review'
                  }
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
