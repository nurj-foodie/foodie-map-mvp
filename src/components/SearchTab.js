import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { enhancedSearchService } from '../services/enhancedSearchService';
import { searchAnalyticsService } from '../services/searchAnalyticsService';
import { searchKeywordService } from '../services/searchKeywordService';
import FavoriteButton from './FavoriteButton';
import RestaurantModal from './RestaurantModal';
import './SearchTab.css';

const SearchTab = () => {
  const { user } = useAuth();
  const { isFavorite } = useFavorites();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]); // For Search tab
  const [browseResults, setBrowseResults] = useState({
    location: [],      // Near Me / All Areas results
    popular: [],       // Popular restaurants
    trending: [],      // Trending restaurants
    category: []       // Category search results
  });
  const [isSearching, setIsSearching] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    location: false,
    popular: false,
    trending: false,
    category: false
  });
  const [userLocation, setUserLocation] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'browse'
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [savedSearches, setSavedSearches] = useState([]);
  // Filters visibility: collapsed on mobile by default, always visible on desktop
  const [showFilters, setShowFilters] = useState(window.innerWidth > 768); // Desktop: true, Mobile: false
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Track mobile state
  const [browseLocation, setBrowseLocation] = useState('all'); // 'all' or 'nearMe' for Browse tab
  const [searchAnalytics, setSearchAnalytics] = useState({
    totalSearches: 0,
    popularQueries: [],
    filterUsage: {}
  });
  
  const [filters, setFilters] = useState({
    cuisineType: 'all',
    minRating: 0,
    halalStatus: 'all',
    distance: 10,
    priceRange: 'all',
    openNow: false,
    nearMe: false, // NEW: Near Me as filter
    sortBy: 'rating'
  });

  // Category data for browsing
  const categories = [
    { id: 'malay', name: 'Malay', icon: '🍛', color: '#FF6B6B' },
    { id: 'chinese', name: 'Chinese', icon: '🥢', color: '#4ECDC4' },
    { id: 'indian', name: 'Indian', icon: '🍛', color: '#45B7D1' },
    { id: 'western', name: 'Western', icon: '🍽️', color: '#96CEB4' },
    { id: 'japanese', name: 'Japanese', icon: '🍣', color: '#FFEAA7' },
    { id: 'korean', name: 'Korean', icon: '🥘', color: '#DDA0DD' },
    { id: 'thai', name: 'Thai', icon: '🌶️', color: '#98D8C8' },
    { id: 'italian', name: 'Italian', icon: '🍝', color: '#F7DC6F' },
    { id: 'fast-food', name: 'Fast Food', icon: '🍔', color: '#BB8FCE' },
    { id: 'cafe', name: 'Cafe', icon: '☕', color: '#85C1E9' }
  ];

  // Handle window resize to update filter visibility
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowFilters(true); // Always show on desktop
      }
      // On mobile, keep current state (don't auto-collapse if user expanded)
    };
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle restaurant click - defined early for use in map useEffect
  const handleRestaurantClick = useCallback((restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowRestaurantModal(true);
  }, []);

  // Load user location and search history on component mount
  useEffect(() => {
    loadUserLocation();
    loadSearchHistory();
    loadSavedSearches();
    loadSearchAnalytics();
  }, []);

  // Initialize map when map view is toggled on
  useEffect(() => {
    if (!showMapView || !searchResults.length) {
      // Clean up markers when map view is closed
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
      return;
    }

    // Wait for Google Maps to load
    const initMap = () => {
      if (!window.google?.maps || !mapRef.current) {
        setTimeout(initMap, 100);
        return;
      }

      const { Map } = window.google.maps;
      const mapElement = mapRef.current;

      // Determine map center and bounds based on search type
      let mapCenter;
      let bounds = null;
      const shouldShowUserLocation = filters.nearMe && userLocation;
      
      // Check if search query is a food item without location (e.g., "nasi lemak" vs "nasi lemak in Alor Star")
      // Parse query to detect if it's food-only (no location)
      let parsedQuery = null;
      try {
        parsedQuery = searchKeywordService.parseCompoundQuery(searchQuery);
      } catch (e) {
        // Ignore parsing errors
      }
      const isFoodItemOnly = parsedQuery && parsedQuery.foodItem && !parsedQuery.location;
      const hasLocationInQuery = parsedQuery && parsedQuery.location;

      if (shouldShowUserLocation) {
        // Near Me: Center on user location
        mapCenter = {
          lat: userLocation.lat,
          lng: userLocation.lng
        };
      } else if (isFoodItemOnly && userLocation) {
        // Food item search without location: Center on user location (e.g., "nasi lemak" when user is in Kluang)
        mapCenter = {
          lat: userLocation.lat,
          lng: userLocation.lng
        };
      } else if (searchResults.length > 0) {
        // Location-specific search or search with results: Calculate bounds from restaurant locations
        bounds = new window.google.maps.LatLngBounds();
        searchResults.forEach(restaurant => {
          const location = restaurant.location || restaurant.geometry?.location;
          if (location) {
            const lat = typeof location === 'object' ? location.lat : location.latitude;
            const lng = typeof location === 'object' ? location.lng : location.longitude;
            if (lat && lng) {
              bounds.extend({ lat, lng });
            }
          }
        });
        
        // If we have valid bounds, use center of bounds
        if (!bounds.isEmpty()) {
          mapCenter = bounds.getCenter().toJSON();
        } else {
          // Fallback: use first restaurant location
          const firstRestaurant = searchResults[0];
          const location = firstRestaurant.location || firstRestaurant.geometry?.location;
          if (location) {
            mapCenter = {
              lat: typeof location === 'object' ? location.lat : location.latitude,
              lng: typeof location === 'object' ? location.lng : location.longitude
            };
          } else if (userLocation) {
            // Use user location if available
            mapCenter = {
              lat: userLocation.lat,
              lng: userLocation.lng
            };
          } else {
            // Final fallback: Malaysia center
            mapCenter = { lat: 4.2105, lng: 101.9758 };
          }
        }
      } else if (userLocation) {
        // No results but user location available: center on user location
        mapCenter = {
          lat: userLocation.lat,
          lng: userLocation.lng
        };
      } else {
        // Final fallback: Malaysia center
        mapCenter = { lat: 4.2105, lng: 101.9758 };
      }

      // Initialize map
      // Determine zoom level: Near Me = 13, Results with bounds = auto-fit, User location = 12, Default = 10
      let initialZoom = 10;
      if (shouldShowUserLocation) {
        initialZoom = 13;
      } else if (bounds && !bounds.isEmpty()) {
        initialZoom = 12; // Will be overridden by fitBounds
      } else if (userLocation && mapCenter.lat === userLocation.lat && mapCenter.lng === userLocation.lng) {
        initialZoom = 12; // User location center
      }

      const map = new Map(mapElement, {
        center: mapCenter,
        zoom: initialZoom,
        mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'
      });

      mapInstanceRef.current = map;

      // Determine if map is centered on user location
      const isCenteredOnUserLocation = userLocation && 
        Math.abs(mapCenter.lat - userLocation.lat) < 0.01 && 
        Math.abs(mapCenter.lng - userLocation.lng) < 0.01;
      
      // Fit bounds logic:
      // - If food item only search: Don't fit bounds, keep user-centered view
      // - If location-specific search: Fit bounds to show all results
      // - If Near Me: Don't fit bounds, keep user-centered view
      if (isFoodItemOnly && isCenteredOnUserLocation) {
        // Food item search: Keep centered on user, zoom to show nearby area
        map.setZoom(12);
      } else if (bounds && !bounds.isEmpty() && searchResults.length > 1 && !isCenteredOnUserLocation) {
        // Location-specific search: Fit bounds to show all results
        map.fitBounds(bounds);
      } else if (isCenteredOnUserLocation && userLocation) {
        // User location center: Set appropriate zoom
        map.setZoom(12);
      }

      // Helper function to create marker content element
      const createMarkerContent = (color, emoji) => {
        const content = document.createElement('div');
        content.style.width = '24px';
        content.style.height = '24px';
        content.style.borderRadius = '50%';
        content.style.backgroundColor = color;
        content.style.border = '2px solid white';
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'center';
        content.style.fontSize = '12px';
        content.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        content.textContent = emoji;
        return content;
      };

      // Always add user location marker if userLocation is available
      // This helps users understand where they are relative to search results
      if (userLocation) {
        // Use AdvancedMarkerElement if available, fallback to Marker
        if (window.google.maps.marker?.AdvancedMarkerElement) {
          const userMarker = new window.google.maps.marker.AdvancedMarkerElement({
            position: userLocation,
            map: map,
            title: 'Your Location',
            content: createMarkerContent('#4285F4', '📍')
          });
          markersRef.current.push(userMarker);
        } else {
          // Fallback to deprecated Marker
          const userMarker = new window.google.maps.Marker({
            position: userLocation,
            map: map,
            title: 'Your Location',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 8
            },
            zIndex: 1000
          });
          markersRef.current.push(userMarker);
        }
      }

      // Add restaurant markers
      searchResults.forEach((restaurant, index) => {
        const location = restaurant.location || restaurant.geometry?.location;
        if (!location) return;

        const lat = typeof location === 'object' ? location.lat : location.latitude;
        const lng = typeof location === 'object' ? location.lng : location.longitude;
        
        if (!lat || !lng) return;

        // Use AdvancedMarkerElement if available, fallback to Marker
        if (window.google.maps.marker?.AdvancedMarkerElement) {
          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: { lat, lng },
            map: map,
            title: restaurant.name || restaurant.displayName,
            content: createMarkerContent('#CC0001', '🍽️')
          });

          // Add click listener to open restaurant modal
          marker.addListener('click', () => {
            handleRestaurantClick(restaurant);
          });

          markersRef.current.push(marker);
        } else {
          // Fallback to deprecated Marker
          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: restaurant.name || restaurant.displayName,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: '#CC0001',
              fillOpacity: 0.8,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 6
            },
            zIndex: 500 + index
          });

          // Add click listener to open restaurant modal
          marker.addListener('click', () => {
            handleRestaurantClick(restaurant);
          });

          markersRef.current.push(marker);
        }
      });
    };

    initMap();

    // Cleanup function
    return () => {
      if (markersRef.current.length > 0) {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
      }
    };
  }, [showMapView, searchResults, filters.nearMe, userLocation, handleRestaurantClick]);

  // Load search history from localStorage
  const loadSearchHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
      setSearchHistory([]);
    }
  };

  // Save search to history
  const saveToSearchHistory = (query) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Load saved searches from localStorage
  const loadSavedSearches = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedSearches') || '[]');
      setSavedSearches(saved);
    } catch (error) {
      console.error('Error loading saved searches:', error);
      setSavedSearches([]);
    }
  };

  // Save current search query and filters
  const saveCurrentSearch = () => {
    if (!searchQuery.trim() && filters.cuisineType === 'all' && filters.minRating === 0) {
      alert('Please enter a search query or set filters to save');
      return;
    }

    const searchToSave = {
      id: Date.now().toString(),
      name: searchQuery || `${filters.cuisineType} restaurants`,
      query: searchQuery,
      filters: { ...filters },
      timestamp: new Date().toISOString(),
      resultCount: searchResults.length
    };

    const newSavedSearches = [searchToSave, ...savedSearches].slice(0, 10);
    setSavedSearches(newSavedSearches);
    localStorage.setItem('savedSearches', JSON.stringify(newSavedSearches));
    alert('Search saved successfully!');
  };

  // Load saved search
  const loadSavedSearch = (savedSearch) => {
    setSearchQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setActiveTab('search');
    // Auto-trigger search
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  // Load search analytics from localStorage
  const loadSearchAnalytics = () => {
    try {
      const analytics = JSON.parse(localStorage.getItem('searchAnalytics') || '{}');
      setSearchAnalytics({
        totalSearches: analytics.totalSearches || 0,
        popularQueries: analytics.popularQueries || [],
        filterUsage: analytics.filterUsage || {}
      });
    } catch (error) {
      console.error('Error loading search analytics:', error);
    }
  };

  // Track search analytics
  const trackSearchAnalytics = (query, filters) => {
    const newAnalytics = {
      totalSearches: searchAnalytics.totalSearches + 1,
      popularQueries: [...searchAnalytics.popularQueries, query].slice(-50),
      filterUsage: {
        ...searchAnalytics.filterUsage,
        [filters.cuisineType]: (searchAnalytics.filterUsage[filters.cuisineType] || 0) + 1
      }
    };
    setSearchAnalytics(newAnalytics);
    localStorage.setItem('searchAnalytics', JSON.stringify(newAnalytics));
  };

  // Load user location
  const loadUserLocation = async () => {
    try {
      const location = await enhancedSearchService.getUserLocation();
      setUserLocation(location);
      console.log('📍 User location loaded:', location);
    } catch (error) {
      console.log('⚠️ Could not get user location:', error.message);
    }
  };

  // Handle search input change with intelligent suggestions
  const handleSearchInputChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      // Use intelligent keyword service for better suggestions
      try {
        const { searchKeywordService } = await import('../services/searchKeywordService');
        const intelligentSuggestions = await searchKeywordService.getIntelligentSuggestions(query, 8);
        // Convert to simple string array for backward compatibility
        const suggestionStrings = intelligentSuggestions.map(s => s.text);
        setSuggestions(suggestionStrings);
        setShowSuggestions(true);
      } catch (error) {
        console.warn('⚠️ Error loading intelligent suggestions, using fallback:', error);
        // Fallback to basic suggestions
        const newSuggestions = enhancedSearchService.getSearchSuggestions(query);
        setSuggestions(newSuggestions);
        setShowSuggestions(true);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() && filters.cuisineType === 'all' && filters.minRating === 0 && !filters.nearMe) {
      return;
    }

    // Save to search history
    if (searchQuery.trim()) {
      saveToSearchHistory(searchQuery.trim());
    }

    // Track search analytics (local only)
    trackSearchAnalytics(searchQuery, filters);

    setIsSearching(true);
    try {
      // Parse query to determine search type
      const parsedQuery = searchKeywordService.parseCompoundQuery(searchQuery);
      const isFoodItemOnly = parsedQuery && parsedQuery.foodItem && !parsedQuery.location;
      
      // Always use userLocation if available (for better UX - show nearby results first)
      // Exception: If search has explicit location (e.g., "nasi lemak in Alor Star"), don't use user location
      const locationToUse = (userLocation && !parsedQuery?.location) ? userLocation : (filters.nearMe ? userLocation : null);
      
      // Adjust distance filter based on search type
      let searchFilters = { ...filters };
      if (filters.nearMe) {
        searchFilters.distance = 5; // Near Me = 5km
      } else if (isFoodItemOnly && userLocation) {
        // Food item search: Start with reasonable radius (will expand if needed)
        searchFilters.distance = searchFilters.distance || 25; // Default 25km for food items
      }
      
      const results = await enhancedSearchService.searchRestaurants(
        searchQuery, 
        searchFilters, 
        locationToUse
      );
      
      // Track search with analytics service (includes parsed query and result count)
      searchAnalyticsService.trackSearch(
        searchQuery,
        parsedQuery,
        results.length,
        searchFilters
      ).catch(error => {
        console.warn('⚠️ Error tracking search analytics:', error);
      });
      
      setSearchResults(results);
      setShowSuggestions(false);
      setShowSearchHistory(false);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      
      // Track failed search
      const parsedQuery = searchKeywordService.parseCompoundQuery(searchQuery);
      searchAnalyticsService.trackSearch(
        searchQuery,
        parsedQuery,
        0,
        filters
      ).catch(err => console.warn('⚠️ Error tracking failed search:', err));
    } finally {
      setIsSearching(false);
    }
  };

  // Handle category search - Keep results in Browse tab
  const handleCategorySearch = async (category) => {
    setSearchQuery(category.name);
    setFilters(prev => ({ ...prev, cuisineType: category.name }));
    saveToSearchHistory(category.name);
    
    setLoadingStates(prev => ({ ...prev, category: true }));
    try {
      const results = await enhancedSearchService.searchRestaurants(
        category.name, 
        { ...filters, cuisineType: category.name }, 
        userLocation
      );
      // Store in browseResults.category instead of searchResults
      setBrowseResults(prev => ({ ...prev, category: results }));
      // Keep user in Browse tab (don't switch to Search tab)
    } catch (error) {
      console.error('Category search error:', error);
      setBrowseResults(prev => ({ ...prev, category: [] }));
    } finally {
      setLoadingStates(prev => ({ ...prev, category: false }));
    }
  };

  // Handle "Near Me" filter toggle
  const handleNearMeToggle = async (enabled) => {
    if (enabled && !userLocation) {
      try {
        await loadUserLocation();
        if (!userLocation) {
          alert('Please enable location access to use "Near Me" filter');
          return;
        }
      } catch (error) {
        alert('Could not get your location. Please try again.');
        return;
      }
    }

    setFilters(prev => ({
      ...prev,
      nearMe: enabled,
      distance: enabled ? 5 : prev.distance // Auto-set distance to 5km when Near Me enabled
    }));

    // Auto-search if we have a query or other filters
    if (searchQuery.trim() || enabled) {
      setTimeout(() => {
        handleSearch();
      }, 100);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    // Auto-search when suggestion is clicked
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      cuisineType: 'all',
      minRating: 0,
      halalStatus: 'all',
      distance: 10,
      priceRange: 'all',
      openNow: false,
      nearMe: false, // NEW: Clear Near Me filter
      sortBy: 'rating'
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  // Load popular restaurants - Store in browseResults
  const loadPopularRestaurants = async () => {
    setLoadingStates(prev => ({ ...prev, popular: true }));
    try {
      const results = await enhancedSearchService.getPopularRestaurants(userLocation);
      setBrowseResults(prev => ({ ...prev, popular: results }));
      setSearchQuery('Popular Restaurants');
    } catch (error) {
      console.error('Error loading popular restaurants:', error);
      setBrowseResults(prev => ({ ...prev, popular: [] }));
    } finally {
      setLoadingStates(prev => ({ ...prev, popular: false }));
    }
  };

  // Load trending restaurants - Store in browseResults
  const loadTrendingRestaurants = async () => {
    setLoadingStates(prev => ({ ...prev, trending: true }));
    try {
      const results = await enhancedSearchService.getTrendingRestaurants(userLocation);
      setBrowseResults(prev => ({ ...prev, trending: results }));
      setSearchQuery('Trending Restaurants');
    } catch (error) {
      console.error('Error loading trending restaurants:', error);
      setBrowseResults(prev => ({ ...prev, trending: [] }));
    } finally {
      setLoadingStates(prev => ({ ...prev, trending: false }));
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Don't clear searchResults when switching tabs - keep them separate
    setShowSuggestions(false);
    setShowSearchHistory(false);
    
    if (tab === 'browse') {
      // Load popular and trending when Browse tab is opened
      loadPopularRestaurants();
      loadTrendingRestaurants();
    }
  };

  // Quick actions for restaurant results
  const handleQuickAction = (action, restaurant) => {
    switch (action) {
      case 'call':
        // Check multiple phone number fields
        const phoneNumber = restaurant.phoneNumber || restaurant.phone || restaurant.formattedPhoneNumber || restaurant.nationalPhoneNumber;
        if (phoneNumber) {
          // Clean phone number (remove spaces, dashes, parentheses)
          const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
          window.open(`tel:${cleanPhone}`);
        } else {
          alert('Phone number not available for this restaurant');
        }
        break;
      case 'directions':
        // Use place_id first (same as discover tab "Navigate Here" button)
        const placeId = restaurant.place_id || restaurant.placeId || restaurant.id;
        if (placeId) {
          // Use Google Maps place URL (same as discover tab)
          const url = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
          window.open(url, '_blank');
        } else if (restaurant.lat && restaurant.lng) {
          // Fallback to coordinates with navigation mode
          const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}&travelmode=driving`;
          window.open(url, '_blank');
        } else if (restaurant.geometry?.location?.lat && restaurant.geometry?.location?.lng) {
          // Fallback to geometry location
          const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.geometry.location.lat},${restaurant.geometry.location.lng}&travelmode=driving`;
          window.open(url, '_blank');
        } else if (restaurant.location?.lat && restaurant.location?.lng) {
          // Fallback to location object
          const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}&travelmode=driving`;
          window.open(url, '_blank');
        } else {
          alert('Location not available for directions');
        }
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: restaurant.name,
            text: `Check out ${restaurant.name} at ${restaurant.address}`,
            url: window.location.href
          });
        } else {
          // Fallback: copy to clipboard
          const text = `${restaurant.name} - ${restaurant.address}`;
          navigator.clipboard.writeText(text).then(() => {
            alert('Restaurant info copied to clipboard!');
          });
        }
        break;
      default:
        break;
    }
  };


  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.nearMe) count++;
    if (filters.cuisineType !== 'all') count++;
    if (filters.minRating > 0) count++;
    if (filters.halalStatus !== 'all') count++;
    if (filters.distance !== 10 && !filters.nearMe) count++;
    if (filters.priceRange !== 'all') count++;
    if (filters.openNow) count++;
    return count;
  };

  // Get active filter chips for display
  const getActiveFilterChips = () => {
    const chips = [];
    
    // Near Me filter chip (NEW)
    if (filters.nearMe) {
      chips.push({
        key: 'nearMe',
        label: 'Near Me',
        icon: '📍',
        onRemove: () => handleNearMeToggle(false)
      });
    }
    
    if (filters.cuisineType !== 'all') {
      chips.push({
        key: 'cuisine',
        label: filters.cuisineType,
        icon: '🍽️',
        onRemove: () => handleFilterChange('cuisineType', 'all')
      });
    }
    
    if (filters.minRating > 0) {
      chips.push({
        key: 'rating',
        label: `${filters.minRating}+ Stars`,
        icon: '⭐',
        onRemove: () => handleFilterChange('minRating', 0)
      });
    }
    
    if (filters.halalStatus !== 'all') {
      const halalIcon = filters.halalStatus === 'halal' ? '🕌' : 
                       filters.halalStatus === 'pork-free' ? '🥩' : '🍖';
      chips.push({
        key: 'halal',
        label: filters.halalStatus.replace('-', ' ').toUpperCase(),
        icon: halalIcon,
        onRemove: () => handleFilterChange('halalStatus', 'all')
      });
    }
    
    if (filters.distance !== 10 && !filters.nearMe) {
      chips.push({
        key: 'distance',
        label: `Within ${filters.distance}km`,
        icon: '📍',
        onRemove: () => handleFilterChange('distance', 10)
      });
    }
    
    if (filters.priceRange !== 'all') {
      chips.push({
        key: 'price',
        label: filters.priceRange,
        icon: '💰',
        onRemove: () => handleFilterChange('priceRange', 'all')
      });
    }
    
    if (filters.openNow) {
      chips.push({
        key: 'open',
        label: 'Open Now',
        icon: '🟢',
        onRemove: () => handleFilterChange('openNow', false)
      });
    }
    
    return chips;
  };

  const activeFilterCount = getActiveFilterCount();
  const activeFilterChips = getActiveFilterChips();

  return (
    <div className="search-tab">
      <div className="search-header">
        <h2>🔍 Search & Discover</h2>
        <p>Find amazing restaurants across Malaysia</p>
      </div>
      
      {/* Search Tabs - Reduced to 2 tabs */}
      <div className="search-tabs">
        <button 
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => handleTabChange('search')}
        >
          🔍 Search
        </button>
        <button 
          className={`tab-button ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => handleTabChange('browse')}
        >
          🍽️ Browse
        </button>
      </div>

      {/* Search Interface */}
      {activeTab === 'search' && (
        <div className="search-interface">
          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Try: 'Nasi Lemak', 'Kuala Lumpur', 'Halal Chinese'..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => {
                  setShowSuggestions(searchQuery.length >= 2);
                  if (searchHistory.length > 0) {
                    setShowSearchHistory(true);
                  }
                }}
                className="search-input"
              />
              <button 
                className="search-btn"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? '⏳' : '🔍'}
              </button>
            </div>
          </div>

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Search History */}
          {showSearchHistory && searchHistory.length > 0 && (
            <div className="search-history">
              <div className="history-header">
                <h4>Recent Searches</h4>
                <button 
                  className="clear-history-btn"
                  onClick={() => {
                    setSearchHistory([]);
                    localStorage.removeItem('searchHistory');
                  }}
                >
                  Clear
                </button>
              </div>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  className="history-item"
                  onClick={() => {
                    setSearchQuery(item);
                    setShowSearchHistory(false);
                    setTimeout(() => handleSearch(), 100);
                  }}
                >
                  <span className="history-icon">🕒</span>
                  {item}
                </button>
              ))}
            </div>
          )}

          {/* Active Filter Chips - Always visible */}
          {activeFilterChips.length > 0 && (
            <div className="active-filter-chips">
              <div className="chips-header">
                <span>Active Filters:</span>
                <button className="clear-all-chips-btn" onClick={clearFilters}>
                  Clear All
                </button>
              </div>
              <div className="filter-chips">
                {activeFilterChips.map((chip) => (
                  <div key={chip.key} className="filter-chip">
                    <span className="chip-icon">{chip.icon}</span>
                    <span className="chip-label">{chip.label}</span>
                    <button 
                      className="chip-remove"
                      onClick={chip.onRemove}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Filters - Collapsible on mobile */}
          <div className={`quick-filters ${!showFilters ? 'filters-collapsed' : ''}`}>
            <div className="filters-header">
              <button 
                className="filters-toggle-btn"
                onClick={() => {
                  // Only toggle on mobile
                  if (isMobile) {
                    setShowFilters(!showFilters);
                  }
                }}
              >
                <h3>Quick Filters</h3>
                {isMobile && (
                  <span className="toggle-icon">
                    {showFilters ? '🔼' : '🔽'}
                  </span>
                )}
                {activeFilterCount > 0 && (
                  <span className="filter-count-badge">({activeFilterCount})</span>
                )}
              </button>
              <div className={`filters-actions ${!showFilters && isMobile ? 'filters-actions-collapsed' : ''}`}>
                {activeFilterCount > 0 && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    Clear ({activeFilterCount})
                  </button>
                )}
                <button 
                  className="save-search-btn"
                  onClick={saveCurrentSearch}
                  title="Save this search"
                >
                  💾 Save
                </button>
              </div>
            </div>

            {/* Filter Panel - Collapsible */}
            {showFilters && (
              <div className="filters-panel">
                {/* Near Me Filter - NEW */}
                <div className="filter-row">
                  <label className="checkbox-filter near-me-filter">
                    <input
                      type="checkbox"
                      checked={filters.nearMe}
                      onChange={(e) => handleNearMeToggle(e.target.checked)}
                    />
                    <span>📍 Near Me (within 5km)</span>
                  </label>
                </div>

                <div className="filter-row">
                  <select
                    value={filters.cuisineType}
                    onChange={(e) => handleFilterChange('cuisineType', e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Cuisines</option>
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
                  </select>

              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                className="filter-select"
              >
                <option value={0}>Any Rating</option>
                <option value={3}>3+ Stars</option>
                <option value={3.5}>3.5+ Stars</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>

              <select
                value={filters.halalStatus}
                onChange={(e) => handleFilterChange('halalStatus', e.target.value)}
                className="filter-select"
              >
                <option value="all">All</option>
                <option value="halal">🕌 Halal</option>
                <option value="pork-free">🥩 Pork-Free</option>
                <option value="non-halal">🍖 Non-Halal</option>
              </select>

              <select
                value={filters.distance}
                onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                className="filter-select"
              >
                <option value={1}>Within 1km</option>
                <option value={5}>Within 5km</option>
                <option value={10}>Within 10km</option>
                <option value={25}>Within 25km</option>
                <option value={50}>Within 50km</option>
              </select>
            </div>

            <div className="filter-row">
              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="filter-select"
              >
                <option value="all">Any Price</option>
                <option value="$">$ Budget</option>
                <option value="$$">$$ Moderate</option>
                <option value="$$$">$$$ Expensive</option>
                <option value="$$$$">$$$$ Very Expensive</option>
              </select>

              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="filter-select"
              >
                <option value="rating">Highest Rated</option>
                <option value="distance">Nearest</option>
                <option value="newest">Newest</option>
                <option value="mostReviews">Most Reviews</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>

              <label className="checkbox-filter">
                <input
                  type="checkbox"
                  checked={filters.openNow}
                  onChange={(e) => handleFilterChange('openNow', e.target.checked)}
                />
                <span>Open Now</span>
              </label>
            </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Browse Tab - NEW */}
      {activeTab === 'browse' && (
        <div className="browse-tab">
          {/* Browse by Location */}
          <div className="browse-section">
            <h3>📍 Browse by Location</h3>
            <div className="location-options">
              <button
                className={`location-option ${browseLocation === 'nearMe' ? 'active' : ''}`}
                onClick={async () => {
                  if (!userLocation) {
                    try {
                      await loadUserLocation();
                      if (!userLocation) {
                        alert('Please enable location access to use "Near Me"');
                        return;
                      }
                    } catch (error) {
                      alert('Could not get your location. Please try again.');
                      return;
                    }
                  }
                  setBrowseLocation('nearMe');
                  setLoadingStates(prev => ({ ...prev, location: true }));
                  try {
                    const results = await enhancedSearchService.searchRestaurants(
                      '', 
                      { ...filters, distance: 5 }, 
                      userLocation
                    );
                    // Store in browseResults.location (NOT searchResults)
                    setBrowseResults(prev => ({ ...prev, location: results }));
                    // Don't set searchQuery - keep Browse tab independent
                    // Don't set Search tab filter - keep them separate
                  } catch (error) {
                    console.error('Near me search error:', error);
                    setBrowseResults(prev => ({ ...prev, location: [] }));
                  } finally {
                    setLoadingStates(prev => ({ ...prev, location: false }));
                  }
                }}
              >
                📍 Near Me
              </button>
              <button
                className={`location-option ${browseLocation === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setBrowseLocation('all');
                  setBrowseResults(prev => ({ ...prev, location: [] }));
                  // Don't clear searchQuery - keep Browse tab independent
                }}
              >
                🌍 All Areas
              </button>
            </div>
            
            {/* Location Search Results (Near Me) */}
            {browseLocation === 'nearMe' && browseResults.location.length > 0 && (
              <div className="browse-results" style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '16px', color: '#333' }}>
                  📍 Restaurants Near Me ({browseResults.location.length})
                </h4>
                {browseResults.location.slice(0, 6).map((restaurant, index) => (
                  <div 
                    key={restaurant.id || restaurant.place_id || index} 
                    className="result-item"
                    onClick={() => handleRestaurantClick(restaurant)}
                  >
                    <div className="result-content">
                      <div className="result-header">
                        <h4>{restaurant.name || restaurant.displayName}</h4>
                        {user && (
                          <FavoriteButton 
                            restaurant={restaurant}
                            size="small"
                          />
                        )}
                      </div>
                      <p className="result-address">
                        {restaurant.address || restaurant.formattedAddress || 'Address not available'}
                      </p>
                      <div className="result-meta">
                        <span className="rating">⭐ {restaurant.rating?.toFixed(1) || 'N/A'}</span>
                        {restaurant.distanceFromUser && (
                          <span className="distance">
                            📍 {restaurant.distanceFromUser.toFixed(1)}km
                          </span>
                        )}
                        {restaurant.priceLevel && (
                          <span className="price">
                            {'$'.repeat(restaurant.priceLevel)}
                          </span>
                        )}
                        {restaurant.halalStatus && restaurant.halalStatus !== 'unknown' && (
                          <span className="halal">
                            {restaurant.halalStatus === 'halal' ? '🕌' : 
                             restaurant.halalStatus === 'pork-free' ? '🥩' : '🍖'}
                          </span>
                        )}
                      </div>
                      <button 
                        className="view-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestaurantClick(restaurant);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Browse by Cuisine */}
          <div className="browse-section">
            <h3>🍽️ Browse by Cuisine</h3>
            <p className="section-description">Discover restaurants by food type</p>
            <div className="category-grid">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className="category-card"
                  onClick={() => handleCategorySearch(category)}
                  style={{ '--category-color': category.color }}
                >
                  <div className="category-icon">{category.icon}</div>
                  <div className="category-name">{category.name}</div>
                </button>
              ))}
            </div>
            
            {/* Category Search Results */}
            {browseResults.category.length > 0 && (
              <div className="browse-results" style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '16px', color: '#333' }}>
                  {searchQuery} Restaurants ({browseResults.category.length})
                </h4>
                {browseResults.category.slice(0, 6).map((restaurant, index) => (
                  <div 
                    key={restaurant.id || restaurant.place_id || index} 
                    className="result-item"
                    onClick={() => handleRestaurantClick(restaurant)}
                  >
                    <div className="result-content">
                      <div className="result-header">
                        <h4>{restaurant.name || restaurant.displayName}</h4>
                        {user && (
                          <FavoriteButton 
                            restaurant={restaurant}
                            size="small"
                          />
                        )}
                      </div>
                      <p className="result-address">
                        {restaurant.address || restaurant.formattedAddress || 'Address not available'}
                      </p>
                      <div className="result-meta">
                        <span className="rating">⭐ {restaurant.rating?.toFixed(1) || 'N/A'}</span>
                        {restaurant.priceLevel && (
                          <span className="price">
                            {'$'.repeat(restaurant.priceLevel)}
                          </span>
                        )}
                        {restaurant.halalStatus && restaurant.halalStatus !== 'unknown' && (
                          <span className="halal">
                            {restaurant.halalStatus === 'halal' ? '🕌' : 
                             restaurant.halalStatus === 'pork-free' ? '🥩' : '🍖'}
                          </span>
                        )}
                      </div>
                      <button 
                        className="view-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestaurantClick(restaurant);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popular Restaurants */}
          <div className="browse-section">
            <h3>⭐ Popular Restaurants</h3>
            <p className="section-description">Most loved restaurants in Malaysia</p>
            {loadingStates.popular && browseResults.popular.length === 0 ? (
              <div className="section-loading">Loading popular restaurants...</div>
            ) : browseResults.popular.length > 0 ? (
              <div className="browse-results">
                {browseResults.popular.slice(0, 6).map((restaurant, index) => (
                  <div 
                    key={restaurant.id || restaurant.place_id || index} 
                    className="result-item"
                    onClick={() => handleRestaurantClick(restaurant)}
                  >
                    <div className="result-content">
                      <div className="result-header">
                        <h4>{restaurant.name || restaurant.displayName}</h4>
                        {user && (
                          <FavoriteButton 
                            restaurant={restaurant}
                            size="small"
                          />
                        )}
                      </div>
                      <p className="result-address">
                        {restaurant.address || restaurant.formattedAddress || 'Address not available'}
                      </p>
                      <div className="result-meta">
                        <span className="rating">⭐ {restaurant.rating?.toFixed(1) || 'N/A'}</span>
                        {restaurant.priceLevel && (
                          <span className="price">
                            {'$'.repeat(restaurant.priceLevel)}
                          </span>
                        )}
                        {restaurant.halalStatus && restaurant.halalStatus !== 'unknown' && (
                          <span className="halal">
                            {restaurant.halalStatus === 'halal' ? '🕌' : 
                             restaurant.halalStatus === 'pork-free' ? '🥩' : '🍖'}
                          </span>
                        )}
                      </div>
                      <button 
                        className="view-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestaurantClick(restaurant);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button 
                className="load-section-btn"
                onClick={loadPopularRestaurants}
              >
                Load Popular Restaurants
              </button>
            )}
          </div>

          {/* Trending Restaurants */}
          <div className="browse-section">
            <h3>🔥 Trending Now</h3>
            <p className="section-description">Restaurants gaining popularity</p>
            {loadingStates.trending && browseResults.trending.length === 0 ? (
              <div className="section-loading">Loading trending restaurants...</div>
            ) : browseResults.trending.length > 0 ? (
              <div className="browse-results">
                {browseResults.trending.slice(0, 6).map((restaurant, index) => (
                  <div 
                    key={restaurant.id || restaurant.place_id || index} 
                    className="result-item"
                    onClick={() => handleRestaurantClick(restaurant)}
                  >
                    <div className="result-content">
                      <div className="result-header">
                        <h4>{restaurant.name || restaurant.displayName}</h4>
                        {user && (
                          <FavoriteButton 
                            restaurant={restaurant}
                            size="small"
                          />
                        )}
                      </div>
                      <p className="result-address">
                        {restaurant.address || restaurant.formattedAddress || 'Address not available'}
                      </p>
                      <div className="result-meta">
                        <span className="rating">⭐ {restaurant.rating?.toFixed(1) || 'N/A'}</span>
                        {restaurant.priceLevel && (
                          <span className="price">
                            {'$'.repeat(restaurant.priceLevel)}
                          </span>
                        )}
                        {restaurant.halalStatus && restaurant.halalStatus !== 'unknown' && (
                          <span className="halal">
                            {restaurant.halalStatus === 'halal' ? '🕌' : 
                             restaurant.halalStatus === 'pork-free' ? '🥩' : '🍖'}
                          </span>
                        )}
                      </div>
                      <button 
                        className="view-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestaurantClick(restaurant);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button 
                className="load-section-btn"
                onClick={loadTrendingRestaurants}
              >
                Load Trending Restaurants
              </button>
            )}
          </div>

          {/* Saved Searches - Moved to Browse Tab */}
          <div className="browse-section">
            <h3>💾 Saved Searches</h3>
            <p className="section-description">Your saved search queries and filter combinations</p>
            {savedSearches.length > 0 ? (
              <div className="saved-searches-list">
                {savedSearches.map((savedSearch) => (
                  <div key={savedSearch.id} className="saved-search-item">
                    <div className="saved-search-content">
                      <h4>{savedSearch.name}</h4>
                      <p className="saved-search-query">
                        {savedSearch.query || 'Filter-based search'}
                      </p>
                      <div className="saved-search-meta">
                        <span>📅 {new Date(savedSearch.timestamp).toLocaleDateString()}</span>
                        <span>🔍 {savedSearch.resultCount} results</span>
                      </div>
                    </div>
                    <div className="saved-search-actions">
                      <button 
                        className="load-search-btn"
                        onClick={() => {
                          loadSavedSearch(savedSearch);
                          setActiveTab('search'); // Switch to Search tab when loading
                        }}
                      >
                        🔄 Load
                      </button>
                      <button 
                        className="delete-search-btn"
                        onClick={() => {
                          const newSaved = savedSearches.filter(s => s.id !== savedSearch.id);
                          setSavedSearches(newSaved);
                          localStorage.setItem('savedSearches', JSON.stringify(newSaved));
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-saved-searches">
                <p>No saved searches yet. Save your favorite search queries and filters from the Search tab!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="search-loading">
          <div className="loading-spinner"></div>
          <p>Searching restaurants...</p>
        </div>
      )}

      {/* Search Results - Only show in Search tab */}
      {searchResults.length > 0 && activeTab === 'search' && (
        <div className={`search-results ${showMapView ? 'map-view-active' : ''}`}>
          {!showMapView && (
            <div className="results-header">
              <div className="results-title">
                <h3>Found {searchResults.length} restaurants</h3>
                <div className="results-actions">
                  <button 
                    className={`view-toggle-btn ${showMapView ? 'active' : ''}`}
                    onClick={() => setShowMapView(!showMapView)}
                  >
                    {showMapView ? '📋 List View' : '🗺️ Map View'}
                  </button>
                  <button 
                    className="save-search-btn"
                    onClick={saveCurrentSearch}
                    title="Save this search"
                  >
                    💾 Save Search
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Map View - Full Screen Experience */}
          {showMapView && (
            <>
              <div className="map-view-fullscreen">
                <div className="map-container-fullscreen">
                  <div 
                    ref={mapRef}
                    id="search-map"
                    className="map-fullscreen"
                  />
                  {userLocation && (
                    <div className="map-legend">
                      <span className="legend-dot user-location-dot"></span>
                      Your Location
                      <span className="legend-dot restaurant-dot"></span>
                      Restaurants
                    </div>
                  )}
                </div>
              </div>
              {/* Map View Exit Button */}
              <div className="map-view-controls">
                <button 
                  className="map-exit-btn"
                  onClick={() => setShowMapView(false)}
                >
                  📋 List View
                </button>
              </div>
            </>
          )}
          
          {/* Results List - Only show when map view is NOT active */}
          {!showMapView && (
          <div className="results-list">
            {searchResults.map((restaurant, index) => (
              <div 
                key={restaurant.id || restaurant.place_id || index} 
                className="result-item"
                onClick={() => handleRestaurantClick(restaurant)}
              >
                <div className="result-content">
                  <div className="result-header">
                    <h4>{restaurant.name || restaurant.displayName}</h4>
                    <div className="result-actions">
                      {user && (
                        <FavoriteButton 
                          restaurant={restaurant}
                          size="small"
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="quick-actions">
                    <button 
                      className="quick-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAction('call', restaurant);
                      }}
                      title={restaurant.phoneNumber || restaurant.phone ? `Call ${restaurant.phoneNumber || restaurant.phone}` : 'Phone number not available'}
                    >
                      📞
                    </button>
                    <button 
                      className="quick-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAction('directions', restaurant);
                      }}
                      title="Get Directions"
                    >
                      🗺️
                    </button>
                    <button 
                      className="quick-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAction('share', restaurant);
                      }}
                      title="Share Restaurant"
                    >
                      📤
                    </button>
                  </div>
                  
                  <p className="result-address">
                    {restaurant.address || restaurant.formattedAddress || 'Address not available'}
                  </p>
                  
                  <div className="result-meta">
                    <span className="rating">⭐ {restaurant.rating?.toFixed(1) || 'N/A'}</span>
                    {restaurant.priceLevel && (
                      <span className="price">
                        {'$'.repeat(restaurant.priceLevel)}
                      </span>
                    )}
                    {restaurant.distanceFromUser && (
                      <span className="distance">
                        📍 {restaurant.distanceFromUser.toFixed(1)}km
                      </span>
                    )}
                    {restaurant.halalStatus && restaurant.halalStatus !== 'unknown' && (
                      <span className="halal">
                        {restaurant.halalStatus === 'halal' ? '🕌' : 
                         restaurant.halalStatus === 'pork-free' ? '🥩' : '🍖'}
                      </span>
                    )}
                  </div>

                  {restaurant.currentOpeningHours && (
                    <div className="result-hours">
                      {restaurant.currentOpeningHours.openNow ? (
                        <span className="open-now">🟢 Open Now</span>
                      ) : (
                        <span className="closed-now">🔴 Closed</span>
                      )}
                    </div>
                  )}

                  {/* View Details Button - NEW */}
                  <button 
                    className="view-details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestaurantClick(restaurant);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* No Results */}
      {searchResults.length === 0 && !isSearching && activeTab === 'search' && (
        <div className="no-results">
          <p>No restaurants found. Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Restaurant Modal */}
      {showRestaurantModal && selectedRestaurant && (
        <RestaurantModal
          isOpen={true}
          restaurant={selectedRestaurant}
          onClose={() => setShowRestaurantModal(false)}
        />
      )}
    </div>
  );
};

export default SearchTab;
