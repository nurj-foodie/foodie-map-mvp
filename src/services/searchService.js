import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

class SearchService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Main search function
  async searchRestaurants(searchParams) {
    const {
      query: searchQuery = '',
      filters = {},
      sortBy = 'rating',
      page = 1,
      pageSize = 20,
      userLocation = null
    } = searchParams;

    console.log('🔍 Starting restaurant search:', { searchQuery, filters, sortBy });

    try {
      // Build Firestore query
      let q = collection(db, 'eateries');
      
      // Apply filters
      q = this.applyFilters(q, filters);
      
      // Apply sorting
      q = this.applySorting(q, sortBy);
      
      // Apply pagination
      q = query(q, limit(pageSize));

      // Execute query
      const snapshot = await getDocs(q);
      let results = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        results.push({
          id: doc.id,
          ...data
        });
      });

      // Apply text search if query provided
      if (searchQuery.trim()) {
        results = this.applyTextSearch(results, searchQuery);
      }

      // Apply distance filtering if user location provided
      if (userLocation && filters.distance) {
        results = this.applyDistanceFilter(results, userLocation, filters.distance);
      }

      // Apply additional filters that can't be done in Firestore
      results = this.applyAdditionalFilters(results, filters);

      console.log(`✅ Found ${results.length} restaurants`);
      return {
        results,
        totalCount: results.length,
        page,
        pageSize,
        hasMore: results.length === pageSize
      };

    } catch (error) {
      console.error('❌ Search error:', error);
      throw new Error('Search failed. Please try again.');
    }
  }

  // Apply Firestore filters
  applyFilters(q, filters) {
    const { minRating, halalStatus, cuisineType, openNow } = filters;

    // Rating filter
    if (minRating > 0) {
      q = query(q, where('rating.overall', '>=', minRating));
    }

    // Halal status filter
    if (halalStatus && halalStatus !== 'all') {
      q = query(q, where('halalStatus', '==', halalStatus));
    }

    // Cuisine type filter
    if (cuisineType && cuisineType !== 'all') {
      q = query(q, where('cuisineType', '==', cuisineType));
    }

    // Open now filter
    if (openNow) {
      q = query(q, where('operatingHours.isOpen', '==', true));
    }

    return q;
  }

  // Apply sorting
  applySorting(q, sortBy) {
    switch (sortBy) {
      case 'rating':
        return query(q, orderBy('rating.overall', 'desc'));
      case 'newest':
        return query(q, orderBy('createdAt', 'desc'));
      case 'mostReviews':
        return query(q, orderBy('userReviews', 'desc'));
      case 'distance':
        // Distance sorting will be done after distance calculation
        return query(q, orderBy('rating.overall', 'desc'));
      default:
        return query(q, orderBy('rating.overall', 'desc'));
    }
  }

  // Apply text search
  applyTextSearch(results, searchQuery) {
    const query = searchQuery.toLowerCase();
    
    return results.filter(restaurant => {
      const name = restaurant.name?.toLowerCase() || '';
      const address = restaurant.address?.toLowerCase() || '';
      const cuisineType = restaurant.cuisineType?.toLowerCase() || '';
      const types = restaurant.types?.join(' ').toLowerCase() || '';
      
      return name.includes(query) || 
             address.includes(query) || 
             cuisineType.includes(query) || 
             types.includes(query);
    });
  }

  // Apply distance filter
  applyDistanceFilter(results, userLocation, maxDistance) {
    return results.filter(restaurant => {
      if (!restaurant.location || !userLocation) return true;
      
      const distance = this.calculateDistance(
        userLocation,
        restaurant.location
      );
      
      return distance <= maxDistance;
    });
  }

  // Apply additional filters
  applyAdditionalFilters(results, filters) {
    const { mealType, priceRange, verifiedOnly, hasPhotos } = filters;

    return results.filter(restaurant => {
      // Meal type filter
      if (mealType && mealType !== 'all') {
        // This would need to be implemented based on your data structure
        // For now, we'll skip this filter
      }

      // Price range filter
      if (priceRange && priceRange !== 'all') {
        if (restaurant.priceLevel !== priceRange) {
          return false;
        }
      }

      // Verified only filter
      if (verifiedOnly) {
        if (!restaurant.userReviews || restaurant.userReviews.length === 0) {
          return false;
        }
        const hasVerifiedReview = restaurant.userReviews.some(review => review.verified);
        if (!hasVerifiedReview) {
          return false;
        }
      }

      // Has photos filter
      if (hasPhotos) {
        const hasUserPhotos = restaurant.userPhotos && restaurant.userPhotos.length > 0;
        const hasGooglePhotos = restaurant.photos && restaurant.photos.length > 0;
        if (!hasUserPhotos && !hasGooglePhotos) {
          return false;
        }
      }

      return true;
    });
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
    const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * 
              Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  // Get popular restaurants
  async getPopularRestaurants(limit = 10) {
    try {
      const q = query(
        collection(db, 'eateries'),
        where('rating.overall', '>=', 4.0),
        orderBy('rating.overall', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      const results = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        results.push({
          id: doc.id,
          ...data
        });
      });

      return results;
    } catch (error) {
      console.error('❌ Error getting popular restaurants:', error);
      return [];
    }
  }

  // Get restaurants by cuisine
  async getRestaurantsByCuisine(cuisineType, limit = 20) {
    try {
      const q = query(
        collection(db, 'eateries'),
        where('cuisineType', '==', cuisineType),
        orderBy('rating.overall', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      const results = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        results.push({
          id: doc.id,
          ...data
        });
      });

      return results;
    } catch (error) {
      console.error('❌ Error getting restaurants by cuisine:', error);
      return [];
    }
  }

  // Get nearby restaurants
  async getNearbyRestaurants(userLocation, radius = 5, limit = 20) {
    try {
      // Get all restaurants first (Firestore doesn't support geo queries natively)
      const q = query(
        collection(db, 'eateries'),
        orderBy('rating.overall', 'desc'),
        limit(100) // Get more to filter by distance
      );

      const snapshot = await getDocs(q);
      const results = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.location) {
          const distance = this.calculateDistance(userLocation, data.location);
          if (distance <= radius) {
            results.push({
              id: doc.id,
              ...data,
              distance
            });
          }
        }
      });

      // Sort by distance and limit results
      return results
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

    } catch (error) {
      console.error('❌ Error getting nearby restaurants:', error);
      return [];
    }
  }

  // Search suggestions
  async getSearchSuggestions(query, limit = 5) {
    if (!query.trim()) return [];

    try {
      const q = query(
        collection(db, 'eateries'),
        where('name', '>=', query),
        where('name', '<=', query + '\uf8ff'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      const suggestions = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        suggestions.push({
          id: doc.id,
          name: data.name,
          address: data.address,
          cuisineType: data.cuisineType
        });
      });

      return suggestions;
    } catch (error) {
      console.error('❌ Error getting search suggestions:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();
export default searchService;
