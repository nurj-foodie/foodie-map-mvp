import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { enhancedSearchService } from '../services/enhancedSearchService';
import { searchAnalyticsService } from '../services/searchAnalyticsService';
import { searchKeywordService } from '../services/searchKeywordService';
import FavoriteButton from './FavoriteButton';
import RestaurantModal from './RestaurantModal';
import './SearchTabRedesign.css'; // New CSS

const SearchTabNew = () => {
    const { user } = useAuth();
    // Favorites hook might be needed for initial hydration if logic depends on it, 
    // but FavoriteButton handles its own state mostly. Kept for consistency.
    const { isFavorite } = useFavorites();

    // --- STATE MANAGEMENT (Ported from SearchTab.js) ---
    const [searchQuery, setSearchQuery] = useState('');
    const [rawSearchResults, setRawSearchResults] = useState([]); // Store broad results for client-side filtering
    const [searchResults, setSearchResults] = useState([]); // Displayed (filtered) results
    const [browseResults, setBrowseResults] = useState({
        location: [],
        popular: [],
        trending: [],
        category: []
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
    const [searchHistory, setSearchHistory] = useState([]); // Simplified for new UI

    // Filters
    const [filters, setFilters] = useState({
        cuisineType: 'all',
        minRating: 0,
        halalStatus: 'all',
        distance: 10,
        priceRange: 'all',
        openNow: false,
        nearMe: false, // UI Toggle for "5km radius"
        sortBy: 'rating'
    });

    // Categories ref
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

    // --- EFFECTS (Logic Persistence) ---

    // Load User Location
    useEffect(() => {
        const loadLocation = async () => {
            try {
                const location = await enhancedSearchService.getUserLocation();
                setUserLocation(location);
            } catch (error) {
                console.log('⚠️ Could not get user location:', error.message);
            }
        };
        loadLocation();

        // Load History
        try {
            const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            setSearchHistory(history);
        } catch (e) {
            setSearchHistory([]);
        }
    }, []);

    // --- CLIENT-SIDE FILTERING LOGIC ---
    const applyClientSideFilters = (results, currentFilters) => {
        if (!results || results.length === 0) return [];

        return results.filter(r => {
            // 1. Near Me (Distance < 5km)
            if (currentFilters.nearMe && r.distanceFromUser > 5) return false;

            // 2. Rating
            if (currentFilters.minRating > 0 && (r.rating || 0) < currentFilters.minRating) return false;

            // 3. Halal
            if (currentFilters.halalStatus === 'halal') {
                if (r.halalStatus !== 'halal' && r.halalStatus !== 'pork-free') return false;
            }

            // 4. Open Now
            // Note: enhancedSearchService already attaches currentOpeningHours or openNow boolean
            if (currentFilters.openNow) {
                // Check both possible properties from different APIs
                const isOpen = r.openNow || (r.currentOpeningHours && r.currentOpeningHours.openNow);
                if (!isOpen) return false;
            }

            // 5. Price (Budget)
            if (currentFilters.priceRange === 'cheap') {
                if (r.priceLevel > 1) return false; // Assuming 1=$
            }

            return true;
        });
    };

    // --- HANDLERS (Brain & Logic) ---

    const handleSearchInputChange = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length >= 2) {
            try {
                const intelligentSuggestions = await searchKeywordService.getIntelligentSuggestions(query, 5);
                setSuggestions(intelligentSuggestions.map(s => s.text));
                setShowSuggestions(true);
            } catch (error) {
                const fallback = enhancedSearchService.getSearchSuggestions(query);
                setSuggestions(fallback);
                setShowSuggestions(true);
            }
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSearch = async (overrideQuery = null, overrideFilters = null) => {
        const queryToUse = overrideQuery !== null ? overrideQuery : searchQuery;

        // Switch to search tab if not already
        if (activeTab !== 'search') setActiveTab('search');

        const filtersToUse = overrideFilters || filters;

        if (!queryToUse.trim() && filtersToUse.cuisineType === 'all' && filtersToUse.minRating === 0) {
            return;
        }

        setIsSearching(true);
        setShowSuggestions(false);

        try {
            // 1. Brain Tracking
            if (queryToUse.trim()) {
                const newHistory = [queryToUse, ...searchHistory.filter(i => i !== queryToUse)].slice(0, 10);
                setSearchHistory(newHistory);
                localStorage.setItem('searchHistory', JSON.stringify(newHistory));
            }

            // 2. FETCH BROAD (The Superset)
            // We ignore strict filters for the fetch to allow client-side toggling
            const parsedQuery = searchKeywordService.parseCompoundQuery(queryToUse);
            const locationToUse = (userLocation && !parsedQuery?.location) ? userLocation : null;

            // Create "Broad Request" filters
            // We keep cuisineType as it's a fundamental search param, but relax others
            const broadFilters = {
                ...filtersToUse,
                minRating: 0,      // Fetch all ratings
                halalStatus: 'all', // Fetch all halal statuses
                openNow: false,    // Fetch closed ones too
                nearMe: false,     // Fetch broad radius (service default)
                distance: 25       // Broad default radius
            };

            const broadResults = await enhancedSearchService.searchRestaurants(
                queryToUse,
                broadFilters,
                locationToUse
            );

            // 3. Analytics
            searchAnalyticsService.trackSearch(queryToUse, parsedQuery, broadResults.length, filtersToUse).catch(console.warn);

            // 4. Store Raw & Apply Local Filters
            setRawSearchResults(broadResults);

            const filteredResults = applyClientSideFilters(broadResults, filtersToUse);
            setSearchResults(filteredResults);

        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
            setRawSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleFilterToggle = (key, value) => {
        // 1. Calculate new filters
        let newFilters = { ...filters };

        if (key === 'openNow') {
            newFilters.openNow = !filters.openNow;
        } else if (key === 'nearMe') {
            newFilters.nearMe = !filters.nearMe;
        } else {
            const isSameValue = filters[key] === value;
            const defaultValue = key === 'minRating' ? 0 : 'all';
            newFilters[key] = isSameValue ? defaultValue : value;
        }

        // 2. Update State
        setFilters(newFilters);

        // 3. INSTANT Client-Side Filter (No Network Call)
        // Use the existing rawSearchResults
        const filtered = applyClientSideFilters(rawSearchResults, newFilters);
        setSearchResults(filtered);
    };

    const clearFilters = () => {
        const resetFilters = {
            cuisineType: 'all',
            minRating: 0,
            halalStatus: 'all',
            distance: 10,
            priceRange: 'all',
            openNow: false,
            nearMe: false,
            sortBy: 'rating'
        };
        setFilters(resetFilters);
        setSearchQuery('');
        setSearchResults([]);
        setRawSearchResults([]); // Clear raw results too
    };

    const handleRestaurantClick = useCallback((restaurant) => {
        setSelectedRestaurant(restaurant);
        setShowRestaurantModal(true);
    }, []);

    const handleCategoryClick = (category) => {
        setActiveTab('search');
        setSearchQuery(category.name);

        // Create new filters object strictly for this search
        const newFilters = { ...filters, cuisineType: category.name };
        setFilters(newFilters);

        // Pass both query and filters explicitly to properly trigger search
        // No timeout needed if we pass data directly
        handleSearch(category.name, newFilters);
    };

    // --- COMPONENT HELPERS ---

    const renderPrice = (level) => level ? '$'.repeat(level) : '';

    const renderMidnightCard = (restaurant) => (
        <div
            key={restaurant.id || restaurant.place_id}
            className="midnight-card"
            onClick={() => handleRestaurantClick(restaurant)}
        >
            <div className="card-content">
                <div className="card-header">
                    <h4 className="card-title">{restaurant.name || restaurant.displayName}</h4>
                    {restaurant.distanceFromUser && (
                        <span className="card-distance-badge">
                            📍 {restaurant.distanceFromUser.toFixed(1)}km
                        </span>
                    )}
                </div>

                <p className="card-address">
                    {restaurant.address || restaurant.formattedAddress}
                </p>

                <div className="card-meta-row">
                    <span className="meta-item rating">
                        ⭐ {restaurant.rating?.toFixed(1) || 'N/A'}
                    </span>
                    {restaurant.priceLevel > 0 && (
                        <span className="meta-item price">
                            {renderPrice(restaurant.priceLevel)}
                        </span>
                    )}
                    {restaurant.halalStatus && restaurant.halalStatus !== 'unknown' && (
                        <span className="meta-item halal">
                            {restaurant.halalStatus === 'halal' ? '🕌 Halal' : '🍖 ' + restaurant.halalStatus}
                        </span>
                    )}
                </div>

                <div className="card-actions">
                    {user && <FavoriteButton restaurant={restaurant} size="small" />}
                    <button
                        className="card-action-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Directions Logic
                            const placeId = restaurant.place_id || restaurant.placeId;
                            if (placeId) {
                                window.open(`https://www.google.com/maps/place/?q=place_id:${placeId}`, '_blank');
                            } else if (restaurant.geometry?.location) {
                                const { lat, lng } = restaurant.geometry.location;
                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                            }
                        }}
                    >
                        🗺️ Directions
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="search-page-root">
            {/* 1. FIXED HEADER */}
            <div className="floating-search-header">
                {/* Search Pill */}
                <div className="search-input-container">
                    <div className="search-icon-wrapper">🔍</div>
                    <input
                        className="redesign-search-input"
                        type="text"
                        placeholder="Search for Nasi Lemak..."
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    {searchQuery && (
                        <button
                            className="card-action-btn"
                            style={{ width: 'auto', padding: '4px 12px' }}
                            onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Suggestions Dropdown (Absolute) */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-dropdown animate-enter">
                        {suggestions.map((s, i) => (
                            <div key={i} className="suggestion-row" onClick={() => {
                                setSearchQuery(s);
                                handleSearch(s);
                            }}>
                                <span>🔍</span> {s}
                            </div>
                        ))}
                    </div>
                )}

                {/* Horizontal Filters */}
                <div className="filter-scroll-container">
                    <div
                        className={`minimal-filter-chip ${activeTab === 'browse' ? 'active' : ''}`}
                        onClick={() => setActiveTab(activeTab === 'search' ? 'browse' : 'search')}
                    >
                        {activeTab === 'search' ? '⬅️ Back to Browse' : '🍽️ Browse'}
                    </div>

                    <div
                        className={`minimal-filter-chip ${filters.nearMe ? 'active' : ''}`}
                        onClick={() => handleFilterToggle('nearMe', true)}
                    >
                        📍 Near Me
                    </div>

                    <div
                        className={`minimal-filter-chip ${filters.minRating >= 4 ? 'active' : ''}`}
                        onClick={() => handleFilterToggle('minRating', 4)}
                    >
                        ⭐ 4.0+
                    </div>

                    <div
                        className={`minimal-filter-chip ${filters.halalStatus === 'halal' ? 'active' : ''}`}
                        onClick={() => handleFilterToggle('halalStatus', 'halal')}
                    >
                        🕌 Halal
                    </div>

                    <div
                        className={`minimal-filter-chip ${filters.openNow ? 'active' : ''}`}
                        onClick={() => handleFilterToggle('openNow', true)}
                    >
                        🕒 Open Now
                    </div>

                    <div
                        className={`minimal-filter-chip ${filters.priceRange === 'cheap' ? 'active' : ''}`}
                        onClick={() => handleFilterToggle('priceRange', 'cheap')}
                    >
                        💵 Budget
                    </div>
                </div>
            </div>

            {/* 2. SCROLLABLE BODY */}
            <div className="search-results-body">
                {/* SEARCH TAB CONTENT */}
                {activeTab === 'search' && (
                    <div className="animate-enter">
                        {isSearching ? (
                            <div className="loading-spinner-container">
                                <div className="loading-spinner"></div>
                                <p>Finding best spots...</p>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <>
                                <div className="section-title">
                                    <span>Found {searchResults.length} places</span>
                                </div>
                                {searchResults.map(renderMidnightCard)}
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">🍜</div>
                                <p>Search for a dish or restaurant to get started.</p>
                                <button
                                    className="card-action-btn"
                                    style={{ marginTop: '16px', width: 'auto', padding: '12px 24px' }}
                                    onClick={() => setActiveTab('browse')}
                                >
                                    Browse Categories
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* BROWSE TAB CONTENT (Replaces the "Dashboard") */}
                {activeTab === 'browse' && (
                    <div className="animate-enter">
                        <div className="section-title">
                            <span>Browse by Cuisine</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    className="minimal-filter-chip"
                                    style={{ justifyContent: 'center', height: '80px', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.05)' }}
                                    onClick={() => handleCategoryClick(cat)}
                                >
                                    <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL */}
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

export default SearchTabNew;
