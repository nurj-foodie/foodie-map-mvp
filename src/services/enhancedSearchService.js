import { firestoreSearchService } from './firestoreSearchService';
import { calculateHaversineDistance } from '../utils/distanceUtils';

class EnhancedSearchService {
  constructor() {
    this.searchHistory = this.loadSearchHistory();
    this.userLocation = null;
  }

  // Load search history from localStorage
  loadSearchHistory() {
    try {
      const history = localStorage.getItem('foodie_search_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  // Save search to history
  saveSearchToHistory(query, filters) {
    const searchEntry = {
      query,
      filters,
      timestamp: new Date().toISOString()
    };

    // Remove duplicates and keep only last 10 searches
    this.searchHistory = this.searchHistory.filter(
      entry => entry.query !== query
    );
    this.searchHistory.unshift(searchEntry);
    this.searchHistory = this.searchHistory.slice(0, 10);

    try {
      localStorage.setItem('foodie_search_history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  // Get user's current location
  async getUserLocation() {
    if (this.userLocation) {
      return this.userLocation;
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          resolve(this.userLocation);
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Create search bounds from location and radius
  createSearchBounds(center, radiusKm) {
    const lat = center.lat;
    const lng = center.lng;
    
    // Approximate conversion: 1 degree ≈ 111 km
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    return {
      north: lat + latDelta,
      south: lat - latDelta,
      east: lng + lngDelta,
      west: lng - lngDelta
    };
  }

  // Enhanced search with multiple strategies
  async searchRestaurants(searchQuery, filters, userLocation = null) {
    console.log('🔍 Enhanced search started:', { searchQuery, filters, userLocation });

    try {
      let searchBounds;
      let searchCenter;

      // Determine search center
      if (searchQuery && this.isLocationQuery(searchQuery)) {
        // Try to geocode the location query first
        console.log('🔍 Detected location query:', searchQuery);
        try {
          searchCenter = await this.geocodeLocation(searchQuery);
          if (searchCenter) {
            console.log('📍 Geocoded location:', searchCenter);
            searchBounds = this.createSearchBounds(searchCenter, filters.distance || 25);
          } else {
            throw new Error('Geocoding failed');
          }
        } catch (error) {
          console.log('⚠️ Geocoding failed, using predefined locations:', error.message);
          // Fallback to predefined city coordinates
          searchCenter = this.getPredefinedLocation(searchQuery);
          if (searchCenter) {
            searchBounds = this.createSearchBounds(searchCenter, filters.distance || 25);
          } else {
            // If no predefined location, use Malaysia center with larger bounds
            searchCenter = { lat: 4.2105, lng: 101.9758 };
            searchBounds = this.createSearchBounds(searchCenter, 100); // Large search area
          }
        }
      } else if (userLocation) {
        searchCenter = userLocation;
        searchBounds = this.createSearchBounds(userLocation, filters.distance || 10);
      } else {
        // Default to Malaysia center if no location specified
        searchCenter = { lat: 4.2105, lng: 101.9758 }; // Malaysia center
        searchBounds = this.createSearchBounds(searchCenter, filters.distance || 50);
      }

      if (!searchBounds) {
        throw new Error('Could not determine search location');
      }

      // Perform search using existing firestoreSearchService
      const results = await firestoreSearchService.searchRestaurants(searchBounds, {
        foodType: filters.cuisineType !== 'all' ? filters.cuisineType : 'all',
        minRating: filters.minRating || 0,
        halalOnly: filters.halalStatus === 'halal',
        openNow: filters.openNow || false
      });

      // Apply text-based filtering if search query is provided
      let filteredResults = results;
      if (searchQuery && !this.isLocationQuery(searchQuery)) {
        console.log('🔍 Applying text-based filtering for query:', searchQuery);
        filteredResults = this.filterByTextQuery(results, searchQuery);
        console.log(`📊 Text filtering: ${results.length} → ${filteredResults.length} results`);
      }

      // Apply additional filters
      filteredResults = this.applyFilters(filteredResults, filters);

      // Calculate distances if user location is available
      if (searchCenter) {
        filteredResults = filteredResults.map(restaurant => ({
          ...restaurant,
          distanceFromUser: this.calculateDistance(searchCenter, restaurant.location)
        }));
      }

      // Sort results
      filteredResults = this.sortResults(filteredResults, filters.sortBy || 'rating');

      // Save to search history
      this.saveSearchToHistory(searchQuery, filters);

      console.log(`✅ Enhanced search completed: ${filteredResults.length} results`);
      return filteredResults;

    } catch (error) {
      console.error('❌ Enhanced search error:', error);
      throw error;
    }
  }

  // Check if query looks like a location
  isLocationQuery(query) {
    const locationKeywords = [
      'kuala lumpur', 'kl', 'petaling jaya', 'pj', 'shah alam', 'subang',
      'cheras', 'ampang', 'kepong', 'selayang', 'gombak', 'klang',
      'malacca', 'melaka', 'penang', 'georgetown', 'johor bahru', 'jb',
      'ipoh', 'kuching', 'kota kinabalu', 'kk', 'alor setar', 'kangar',
      'kedah', 'perak', 'selangor', 'johor', 'pahang', 'terengganu',
      'kelantan', 'perlis', 'sabah', 'sarawak', 'labuan',
      'near', 'around', 'close to', 'nearby'
    ];

    const lowerQuery = query.toLowerCase();
    return locationKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  // Get predefined location coordinates for major Malaysian cities
  getPredefinedLocation(query) {
    const lowerQuery = query.toLowerCase();
    
    const predefinedLocations = {
      'kuala lumpur': { lat: 3.1390, lng: 101.6869 },
      'kl': { lat: 3.1390, lng: 101.6869 },
      'petaling jaya': { lat: 3.1073, lng: 101.6085 },
      'pj': { lat: 3.1073, lng: 101.6085 },
      'shah alam': { lat: 3.0733, lng: 101.5185 },
      'subang': { lat: 3.1502, lng: 101.5327 },
      'cheras': { lat: 3.0833, lng: 101.7500 },
      'ampang': { lat: 3.1500, lng: 101.7667 },
      'kepong': { lat: 3.2167, lng: 101.6333 },
      'selayang': { lat: 3.2333, lng: 101.6500 },
      'gombak': { lat: 3.2167, lng: 101.6500 },
      'klang': { lat: 3.0333, lng: 101.4500 },
      'malacca': { lat: 2.1896, lng: 102.2501 },
      'melaka': { lat: 2.1896, lng: 102.2501 },
      'penang': { lat: 5.4164, lng: 100.3327 },
      'georgetown': { lat: 5.4164, lng: 100.3327 },
      'johor bahru': { lat: 1.4927, lng: 103.7414 },
      'jb': { lat: 1.4927, lng: 103.7414 },
      'ipoh': { lat: 4.5841, lng: 101.0829 },
      'kuching': { lat: 1.5533, lng: 110.3591 },
      'kota kinabalu': { lat: 5.9804, lng: 116.0735 },
      'kk': { lat: 5.9804, lng: 116.0735 },
      'alor setar': { lat: 6.1214, lng: 100.3681 },
      'kangar': { lat: 6.4414, lng: 100.1986 },
      'kedah': { lat: 6.1214, lng: 100.3681 }, // Alor Setar as Kedah center
      'perak': { lat: 4.5841, lng: 101.0829 }, // Ipoh as Perak center
      'selangor': { lat: 3.1073, lng: 101.6085 }, // PJ as Selangor center
      'johor': { lat: 1.4927, lng: 103.7414 }, // JB as Johor center
      'pahang': { lat: 3.8077, lng: 103.3260 }, // Kuantan as Pahang center
      'terengganu': { lat: 5.3117, lng: 103.1192 }, // Kuala Terengganu
      'kelantan': { lat: 6.1256, lng: 102.2431 }, // Kota Bharu
      'perlis': { lat: 6.4414, lng: 100.1986 }, // Kangar
      'sabah': { lat: 5.9804, lng: 116.0735 }, // Kota Kinabalu as Sabah center
      'sarawak': { lat: 1.5533, lng: 110.3591 }, // Kuching as Sarawak center
      'labuan': { lat: 5.2831, lng: 115.2308 }
    };

    // Find matching location
    for (const [key, coords] of Object.entries(predefinedLocations)) {
      if (lowerQuery.includes(key)) {
        console.log('📍 Using predefined location:', key, coords);
        return coords;
      }
    }

    return null;
  }

  // Filter results by text query
  filterByTextQuery(results, searchQuery) {
    const query = searchQuery.toLowerCase().trim();
    const queryWords = query.split(/\s+/);
    
    return results.filter(restaurant => {
      const searchableText = [
        restaurant.name || '',
        restaurant.address || '',
        restaurant.cuisineType || '',
        restaurant.types ? restaurant.types.join(' ') : '',
        restaurant.vicinity || ''
      ].join(' ').toLowerCase();
      
      // Check if all query words are found in the searchable text
      return queryWords.every(word => searchableText.includes(word));
    });
  }

  // Geocode location using Google Geocoding API
  async geocodeLocation(address) {
    try {
      if (!window.google?.maps?.importLibrary) {
        throw new Error('Google Maps not loaded');
      }

      const { Geocoder } = await window.google.maps.importLibrary("geocoding");
      const geocoder = new Geocoder();

      return new Promise((resolve, reject) => {
        const query = /malaysia/i.test(address) ? address : `${address}, Malaysia`;
        
        geocoder.geocode({ address: query }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              address: results[0].formatted_address
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  // Apply filters to search results
  applyFilters(results, filters) {
    return results.filter(restaurant => {
      // Rating filter
      if (filters.minRating > 0 && restaurant.rating < filters.minRating) {
        return false;
      }

      // Halal status filter
      if (filters.halalStatus !== 'all') {
        if (filters.halalStatus === 'halal' && restaurant.halalStatus !== 'halal') {
          return false;
        }
        if (filters.halalStatus === 'pork-free' && restaurant.halalStatus !== 'pork-free') {
          return false;
        }
        if (filters.halalStatus === 'non-halal' && restaurant.halalStatus !== 'non-halal') {
          return false;
        }
      }

      // Price range filter
      if (filters.priceRange !== 'all') {
        const priceLevel = restaurant.priceLevel;
        if (filters.priceRange === '$' && priceLevel !== 1) return false;
        if (filters.priceRange === '$$' && priceLevel !== 2) return false;
        if (filters.priceRange === '$$$' && priceLevel !== 3) return false;
        if (filters.priceRange === '$$$$' && priceLevel !== 4) return false;
      }

      // Cuisine type filter
      if (filters.cuisineType !== 'all') {
        const types = restaurant.types || [];
        const cuisineType = restaurant.cuisineType || '';
        
        if (!types.some(type => 
          type.toLowerCase().includes(filters.cuisineType.toLowerCase())
        ) && !cuisineType.toLowerCase().includes(filters.cuisineType.toLowerCase())) {
          return false;
        }
      }

      // Open now filter
      if (filters.openNow && restaurant.currentOpeningHours) {
        if (!restaurant.currentOpeningHours.openNow) {
          return false;
        }
      }

      // Verified only filter
      if (filters.verifiedOnly && !restaurant.verified) {
        return false;
      }

      // Has photos filter
      if (filters.hasPhotos && (!restaurant.photos || restaurant.photos.length === 0)) {
        return false;
      }

      return true;
    });
  }

  // Sort search results
  sortResults(results, sortBy) {
    switch (sortBy) {
      case 'rating':
        return results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      case 'distance':
        return results.sort((a, b) => (a.distanceFromUser || 0) - (b.distanceFromUser || 0));
      
      case 'newest':
        return results.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
      
      case 'mostReviews':
        return results.sort((a, b) => (b.userRatingCount || 0) - (a.userRatingCount || 0));
      
      case 'price_low':
        return results.sort((a, b) => (a.priceLevel || 0) - (b.priceLevel || 0));
      
      case 'price_high':
        return results.sort((a, b) => (b.priceLevel || 0) - (a.priceLevel || 0));
      
      default:
        return results;
    }
  }

  // Calculate distance between two points
  calculateDistance(point1, point2) {
    if (!point1 || !point2) return null;
    return calculateHaversineDistance(point1, point2);
  }

  // Get popular restaurants (mock implementation)
  async getPopularRestaurants(userLocation = null) {
    // This would typically query a popularity/trending collection
    // For now, we'll do a broad search and sort by rating
    const bounds = userLocation 
      ? this.createSearchBounds(userLocation, 25)
      : this.createSearchBounds({ lat: 4.2105, lng: 101.9758 }, 100);

    const results = await firestoreSearchService.searchRestaurants(bounds, {
      foodType: 'all',
      minRating: 4.0,
      halalOnly: false,
      openNow: false
    });

    return this.sortResults(results, 'rating').slice(0, 10);
  }

  // Get trending restaurants (mock implementation)
  async getTrendingRestaurants(userLocation = null) {
    // This would typically query recent user activity
    // For now, we'll return recently added restaurants
    const bounds = userLocation 
      ? this.createSearchBounds(userLocation, 25)
      : this.createSearchBounds({ lat: 4.2105, lng: 101.9758 }, 100);

    const results = await firestoreSearchService.searchRestaurants(bounds, {
      foodType: 'all',
      minRating: 0,
      halalOnly: false,
      openNow: false
    });

    return this.sortResults(results, 'newest').slice(0, 10);
  }

  // Get search suggestions
  getSearchSuggestions(query) {
    if (!query || query.length < 2) return [];

    const suggestions = [
      // Popular restaurants
      'McDonald\'s', 'KFC', 'Pizza Hut', 'Subway', 'Starbucks',
      // Popular cuisines
      'Chinese food', 'Indian food', 'Malay food', 'Western food',
      // Popular locations
      'Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Subang Jaya',
      // Popular landmarks
      'Near KLCC', 'Near Sunway Pyramid', 'Near Mid Valley', 'Near Pavilion'
    ];

    return suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);
  }

  // Get recent searches
  getRecentSearches() {
    return this.searchHistory.slice(0, 5);
  }
}

export const enhancedSearchService = new EnhancedSearchService();
export default enhancedSearchService;
