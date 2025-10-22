import React, { useState, useEffect } from 'react';
import './GlobalSearch.css';

const GlobalSearch = ({ onSearchResults, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    // Basic filters (visible by default)
    cuisineType: 'all',
    minRating: 0,
    halalStatus: 'all',
    distance: 10,
    
    // Advanced filters (hidden by default)
    mealType: 'all',
    priceRange: 'all',
    openNow: false,
    verifiedOnly: false,
    hasPhotos: false
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [sortBy, setSortBy] = useState('rating'); // rating, distance, newest, mostReviews

  // Cuisine types
  const cuisineTypes = [
    'all', 'Malay', 'Chinese', 'Indian', 'Western', 
    'Japanese', 'Korean', 'Thai', 'Italian', 'Fast Food', 
    'Cafe', 'Dessert', 'Local'
  ];

  // Meal types
  const mealTypes = [
    'all', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 
    'Dessert', 'Drinks', 'Late Night'
  ];

  // Price ranges
  const priceRanges = [
    { value: 'all', label: 'Any Price' },
    { value: '$', label: '$ (Budget)' },
    { value: '$$', label: '$$ (Moderate)' },
    { value: '$$$', label: '$$$ (Expensive)' },
    { value: '$$$$', label: '$$$$ (Very Expensive)' }
  ];

  // Rating options
  const ratingOptions = [
    { value: 0, label: 'Any Rating' },
    { value: 3, label: '3.0+ Stars' },
    { value: 3.5, label: '3.5+ Stars' },
    { value: 4, label: '4.0+ Stars' },
    { value: 4.5, label: '4.5+ Stars' }
  ];

  // Distance options
  const distanceOptions = [
    { value: 1, label: 'Within 1km' },
    { value: 5, label: 'Within 5km' },
    { value: 10, label: 'Within 10km' },
    { value: 25, label: 'Within 25km' },
    { value: 50, label: 'Within 50km' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest' },
    { value: 'newest', label: 'Newest' },
    { value: 'mostReviews', label: 'Most Reviews' }
  ];

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() && filters.cuisineType === 'all' && filters.minRating === 0) {
      return;
    }

    setIsSearching(true);
    
    try {
      // Simulate API call - replace with actual search service
      const results = await performSearch(searchQuery, filters, sortBy);
      setSearchResults(results);
      onSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Simulate search function - replace with actual implementation
  const performSearch = async (query, filters, sortBy) => {
    // This would call your actual search service
    // For now, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'Sample Restaurant 1',
            address: '123 Main Street, Kuala Lumpur',
            cuisineType: 'Malay',
            halalStatus: 'halal',
            rating: { overall: 4.2, foodQuality: 4.5, valueForMoney: 3.8, serviceQuality: 4.0, ambiance: 4.3 },
            userReviews: [{ verified: true }, { verified: true }, { verified: false }],
            userPhotos: ['photo1.jpg', 'photo2.jpg'],
            photos: ['google_photo1.jpg']
          },
          {
            id: '2',
            name: 'Sample Restaurant 2',
            address: '456 Oak Avenue, Petaling Jaya',
            cuisineType: 'Chinese',
            halalStatus: 'pork-free',
            rating: { overall: 3.8, foodQuality: 4.0, valueForMoney: 3.5, serviceQuality: 3.8, ambiance: 4.0 },
            userReviews: [{ verified: true }, { verified: false }],
            userPhotos: [],
            photos: ['google_photo2.jpg']
          }
        ]);
      }, 1000);
    });
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
      mealType: 'all',
      priceRange: 'all',
      openNow: false,
      verifiedOnly: false,
      hasPhotos: false
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.cuisineType !== 'all') count++;
    if (filters.minRating > 0) count++;
    if (filters.halalStatus !== 'all') count++;
    if (filters.distance !== 10) count++;
    if (filters.mealType !== 'all') count++;
    if (filters.priceRange !== 'all') count++;
    if (filters.openNow) count++;
    if (filters.verifiedOnly) count++;
    if (filters.hasPhotos) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="global-search">
      <div className="search-header">
        <h2>Search Restaurants</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search restaurants, cuisines, or locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="search-input"
        />
        <button 
          className="search-btn"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? '🔍' : '🔍'} Search
        </button>
      </div>

      {/* Basic Filters */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filters</h3>
          {activeFilterCount > 0 && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All ({activeFilterCount})
            </button>
          )}
        </div>

        <div className="basic-filters">
          {/* Cuisine Type */}
          <div className="filter-group">
            <label>Cuisine Type</label>
            <select
              value={filters.cuisineType}
              onChange={(e) => handleFilterChange('cuisineType', e.target.value)}
            >
              {cuisineTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Cuisines' : type}
                </option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div className="filter-group">
            <label>Minimum Rating</label>
            <select
              value={filters.minRating}
              onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
            >
              {ratingOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Halal Status */}
          <div className="filter-group">
            <label>Halal Status</label>
            <select
              value={filters.halalStatus}
              onChange={(e) => handleFilterChange('halalStatus', e.target.value)}
            >
              <option value="all">All</option>
              <option value="halal">🕌 Halal</option>
              <option value="pork-free">🥩 Pork-Free</option>
              <option value="non-halal">🍖 Non-Halal</option>
            </select>
          </div>

          {/* Distance */}
          <div className="filter-group">
            <label>Distance</label>
            <select
              value={filters.distance}
              onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
            >
              {distanceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button 
          className="advanced-toggle"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          {showAdvancedFilters ? '▼' : '▶'} Advanced Filters
        </button>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="advanced-filters">
            {/* Meal Type */}
            <div className="filter-group">
              <label>Meal Type</label>
              <select
                value={filters.mealType}
                onChange={(e) => handleFilterChange('mealType', e.target.value)}
              >
                {mealTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Meals' : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <label>Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
              >
                {priceRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkboxes */}
            <div className="checkbox-filters">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.openNow}
                  onChange={(e) => handleFilterChange('openNow', e.target.checked)}
                />
                <span>Open Now</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                />
                <span>Verified Reviews Only</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.hasPhotos}
                  onChange={(e) => handleFilterChange('hasPhotos', e.target.checked)}
                />
                <span>Has Photos</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Sort Options */}
      <div className="sort-section">
        <label>Sort by:</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <h3>Search Results ({searchResults.length})</h3>
          </div>
          <div className="results-list">
            {searchResults.map(restaurant => (
              <div key={restaurant.id} className="result-item">
                <h4>{restaurant.name}</h4>
                <p>{restaurant.address}</p>
                <div className="result-meta">
                  <span className="cuisine">{restaurant.cuisineType}</span>
                  <span className="rating">⭐ {restaurant.rating.overall}</span>
                  <span className="halal">{restaurant.halalStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchResults.length === 0 && !isSearching && (
        <div className="no-results">
          <p>No restaurants found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
