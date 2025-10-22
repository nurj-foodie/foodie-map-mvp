import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { enhancedSearchService } from '../services/enhancedSearchService';
import FavoriteButton from './FavoriteButton';
import RestaurantModal from './RestaurantModal';
import './SearchTab.css';

const SearchTab = () => {
  const { user } = useAuth();
  const { isFavorite } = useFavorites();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'nearby', 'popular', 'trending', 'categories'
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
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

  // Load user location and search history on component mount
  useEffect(() => {
    loadUserLocation();
    loadSearchHistory();
    loadSavedSearches();
    loadSearchAnalytics();
  }, []);

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

  // Handle search input change
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      const newSuggestions = enhancedSearchService.getSearchSuggestions(query);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() && filters.cuisineType === 'all' && filters.minRating === 0) {
      return;
    }

    // Save to search history
    if (searchQuery.trim()) {
      saveToSearchHistory(searchQuery.trim());
    }

    // Track search analytics
    trackSearchAnalytics(searchQuery, filters);

    setIsSearching(true);
    try {
      const results = await enhancedSearchService.searchRestaurants(
        searchQuery, 
        filters, 
        userLocation
      );
      setSearchResults(results);
      setShowSuggestions(false);
      setShowSearchHistory(false);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle category search
  const handleCategorySearch = async (category) => {
    setSearchQuery(category.name);
    setFilters(prev => ({ ...prev, cuisineType: category.name }));
    saveToSearchHistory(category.name);
    
    setIsSearching(true);
    try {
      const results = await enhancedSearchService.searchRestaurants(
        category.name, 
        { ...filters, cuisineType: category.name }, 
        userLocation
      );
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error('Category search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle "Near Me" search
  const handleNearMeSearch = async () => {
    if (!userLocation) {
      try {
        await loadUserLocation();
        if (!userLocation) {
          alert('Please enable location access to use "Near Me" search');
          return;
        }
      } catch (error) {
        alert('Could not get your location. Please try again.');
        return;
      }
    }

    setIsSearching(true);
    try {
      const results = await enhancedSearchService.searchRestaurants(
        '', 
        { ...filters, distance: 5 }, 
        userLocation
      );
      setSearchResults(results);
      setSearchQuery('Near Me');
    } catch (error) {
      console.error('Near me search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
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
      sortBy: 'rating'
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  // Load popular restaurants
  const loadPopularRestaurants = async () => {
    setIsSearching(true);
    try {
      const results = await enhancedSearchService.getPopularRestaurants(userLocation);
      setSearchResults(results);
      setSearchQuery('Popular Restaurants');
    } catch (error) {
      console.error('Error loading popular restaurants:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Load trending restaurants
  const loadTrendingRestaurants = async () => {
    setIsSearching(true);
    try {
      const results = await enhancedSearchService.getTrendingRestaurants(userLocation);
      setSearchResults(results);
      setSearchQuery('Trending Restaurants');
    } catch (error) {
      console.error('Error loading trending restaurants:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchResults([]);
    setShowSuggestions(false);
    setShowSearchHistory(false);
    
    switch (tab) {
      case 'popular':
        loadPopularRestaurants();
        break;
      case 'trending':
        loadTrendingRestaurants();
        break;
      case 'categories':
        // Categories tab doesn't need to load data
        break;
      default:
        break;
    }
  };

  // Quick actions for restaurant results
  const handleQuickAction = (action, restaurant) => {
    switch (action) {
      case 'call':
        if (restaurant.phoneNumber) {
          window.open(`tel:${restaurant.phoneNumber}`);
        } else {
          alert('Phone number not available');
        }
        break;
      case 'directions':
        if (restaurant.lat && restaurant.lng) {
          const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.lat},${restaurant.lng}`;
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

  // Handle restaurant click
  const handleRestaurantClick = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowRestaurantModal(true);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.cuisineType !== 'all') count++;
    if (filters.minRating > 0) count++;
    if (filters.halalStatus !== 'all') count++;
    if (filters.distance !== 10) count++;
    if (filters.priceRange !== 'all') count++;
    if (filters.openNow) count++;
    return count;
  };

  // Get active filter chips for display
  const getActiveFilterChips = () => {
    const chips = [];
    
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
    
    if (filters.distance !== 10) {
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
      
      {/* Search Tabs */}
      <div className="search-tabs">
        <button 
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => handleTabChange('search')}
        >
          🔍 Search
        </button>
        <button 
          className={`tab-button ${activeTab === 'nearby' ? 'active' : ''}`}
          onClick={() => handleTabChange('nearby')}
        >
          📍 Near Me
        </button>
        <button 
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => handleTabChange('categories')}
        >
          🍽️ Categories
        </button>
        <button 
          className={`tab-button ${activeTab === 'popular' ? 'active' : ''}`}
          onClick={() => handleTabChange('popular')}
        >
          ⭐ Popular
        </button>
        <button 
          className={`tab-button ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => handleTabChange('trending')}
        >
          🔥 Trending
        </button>
        <button 
          className={`tab-button ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => handleTabChange('saved')}
        >
          💾 Saved
        </button>
      </div>

      {/* Search Interface */}
      {(activeTab === 'search' || activeTab === 'nearby') && (
        <div className="search-interface">
          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search restaurants, cuisines, or locations..."
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

            {/* Near Me Button */}
            <button 
              className="near-me-btn"
              onClick={handleNearMeSearch}
              disabled={isSearching}
            >
              📍 Near Me
            </button>
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

          {/* Active Filter Chips */}
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

          {/* Quick Filters */}
          <div className="quick-filters">
            <div className="filters-header">
              <h3>Quick Filters</h3>
              <div className="filters-actions">
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
        </div>
      )}

      {/* Category Browsing */}
      {activeTab === 'categories' && (
        <div className="category-browsing">
          <div className="category-header">
            <h3>Browse by Cuisine</h3>
            <p>Discover restaurants by food type</p>
          </div>
          
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
        </div>
      )}

      {/* Saved Searches */}
      {activeTab === 'saved' && (
        <div className="saved-searches">
          <div className="saved-header">
            <h3>💾 Saved Searches</h3>
            <p>Your saved search queries and filter combinations</p>
          </div>
          
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
                      onClick={() => loadSavedSearch(savedSearch)}
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
              <p>No saved searches yet. Save your favorite search queries and filters!</p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="search-loading">
          <div className="loading-spinner"></div>
          <p>Searching restaurants...</p>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <div className="results-title">
              <h3>
                {activeTab === 'search' && `Found ${searchResults.length} restaurants`}
                {activeTab === 'nearby' && `Found ${searchResults.length} restaurants near you`}
                {activeTab === 'popular' && `Popular Restaurants (${searchResults.length})`}
                {activeTab === 'trending' && `Trending Restaurants (${searchResults.length})`}
                {activeTab === 'categories' && `Found ${searchResults.length} restaurants`}
              </h3>
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
          
          {/* Map View */}
          {showMapView && (
            <div className="map-view">
              <div className="map-container">
                <div className="map-placeholder">
                  <div className="map-placeholder-content">
                    <h4>🗺️ Map View</h4>
                    <p>Interactive map showing {searchResults.length} restaurants</p>
                    <div className="map-restaurants">
                      {searchResults.slice(0, 5).map((restaurant, index) => (
                        <div key={index} className="map-restaurant-marker">
                          <span className="marker-icon">📍</span>
                          <span className="marker-name">{restaurant.name}</span>
                        </div>
                      ))}
                      {searchResults.length > 5 && (
                        <div className="map-restaurant-marker">
                          <span className="marker-icon">📍</span>
                          <span className="marker-name">+{searchResults.length - 5} more</span>
                        </div>
                      )}
                    </div>
                    <p className="map-note">Full map integration coming soon!</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className={`results-list ${showMapView ? 'with-map' : ''}`}>
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
                      title="Call Restaurant"
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchResults.length === 0 && !isSearching && (activeTab === 'search' || activeTab === 'nearby') && (
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
