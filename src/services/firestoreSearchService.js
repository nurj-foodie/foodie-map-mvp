/* global google */
import { collection, query, where, getDocs, addDoc, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

class FirestoreSearchService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Search Firestore first, fallback to Google Places
  async searchRestaurants(bounds, filters = {}) {
    console.log('🔍 Firestore-first search started...');
    
    // Step 1: Query Firestore
    const firestoreResults = await this.queryFirestore(bounds, filters);
    
    if (firestoreResults.length > 0) {
      console.log(`✅ Found ${firestoreResults.length} restaurants in Firestore`);
      return firestoreResults;
    }
    
    // Step 2: Fallback to Google Places API
    console.log('⚠️ No Firestore results, falling back to Google Places API...');
    console.log('💰 API Call:', {
      type: 'Google Places API',
      cost: '~RM0.017 per request',
      cacheHit: false,
      reason: 'No Firestore data for this area',
      bounds: bounds,
      filters: filters
    });
    const googleResults = await this.fallbackToGooglePlaces(bounds, filters);
    
    // Step 3: Auto-populate Firestore with Google results for future use
    if (googleResults.length > 0) {
      console.log(`💾 Auto-populating Firestore with ${googleResults.length} restaurants...`);
      await this.saveToFirestore(googleResults);
      console.log('✅ Auto-population completed! Future searches will use Firestore data.');
    }
    
    return googleResults;
  }

  // Generate cache key for API calls
  getCacheKey(bounds, filters) {
    const center = {
      lat: Math.round(((bounds.north + bounds.south) / 2) * 1000) / 1000,
      lng: Math.round(((bounds.east + bounds.west) / 2) * 1000) / 1000
    };
    return `${center.lat},${center.lng}-${filters.foodType || 'all'}`;
  }

  // Query Firestore by bounds and filters (simplified to avoid index requirements)
  async queryFirestore(bounds, filters) {
    try {
      console.log('🔍 Querying Firestore (simplified query)...');
      
      // Simple query without complex filters to avoid index requirements
      const q = query(
        collection(db, 'eateries'),
        limit(100) // Get more results and filter in memory
      );
      
      const snapshot = await getDocs(q);
      const results = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Check if restaurant is within bounds
        if (data.location && 
            data.location.lat >= bounds.south && 
            data.location.lat <= bounds.north &&
            data.location.lng >= bounds.west && 
            data.location.lng <= bounds.east) {
          
          // Apply filters in memory
          if (this.matchesFilters(data, filters)) {
            results.push({
              id: doc.id,
              ...data
            });
          }
        }
      });
      
      console.log(`📊 Found ${results.length} restaurants in bounds`);
      return results;
      
    } catch (error) {
      console.error('❌ Firestore query error:', error);
      return [];
    }
  }

  // Check if restaurant matches filters
  matchesFilters(restaurant, filters) {
    // Food type filter
    if (filters.foodType && filters.foodType !== 'all') {
      const types = restaurant.types || [];
      const cuisineType = restaurant.cuisineType || '';
      
      if (!types.some(type => 
        type.toLowerCase().includes(filters.foodType.toLowerCase())
      ) && !cuisineType.toLowerCase().includes(filters.foodType.toLowerCase())) {
        return false;
      }
    }

    // Rating filter
    if (filters.minRating && restaurant.rating < filters.minRating) {
      return false;
    }

    // Halal filter
    if (filters.halalOnly && restaurant.halalStatus !== 'halal') {
      return false;
    }

    // Open now filter
    if (filters.openNow && restaurant.currentOpeningHours) {
      if (!restaurant.currentOpeningHours.openNow) {
        return false;
      }
    }

    return true;
  }

  // Fallback to Google Places API (with legacy fallback)
  async fallbackToGooglePlaces(bounds, filters) {
    try {
      // Check if we've already made an API call for this area recently
      const cacheKey = this.getCacheKey(bounds, filters);
      if (this.cache.has(cacheKey)) {
        console.log('📋 Using cached API results...');
        console.log('💰 API Call:', {
          type: 'Google Places API',
          cost: 'FREE (cached)',
          cacheHit: true,
          reason: '5-minute cache hit',
          cacheKey: cacheKey
        });
        return this.cache.get(cacheKey);
      }

      // Try NEW Google Places API first
      try {
        console.log('🔄 Trying NEW Google Places API...');
        return await this.tryNewPlacesAPI(bounds, filters, cacheKey);
      } catch (newApiError) {
        console.log('⚠️ NEW API failed, falling back to LEGACY Places API:', newApiError.message);
        return await this.tryLegacyPlacesAPI(bounds, filters, cacheKey);
      }
      
    } catch (error) {
      console.error('❌ All Google Places API methods failed:', error);
      throw error;
    }
  }

  // Try NEW Google Places API
  async tryNewPlacesAPI(bounds, filters, cacheKey) {
    const { Place } = await google.maps.importLibrary("places");
    
    const request = {
      textQuery: filters.foodType !== 'all' 
        ? `${filters.foodType} restaurant` 
        : 'restaurant',
      fields: [
        'id', 'displayName', 'location', 'rating', 'userRatingCount', 
        'priceLevel', 'types', 'formattedAddress', 'photos', 
        'regularOpeningHours', 'nationalPhoneNumber',
        'businessStatus', 'utcOffsetMinutes', 'viewport', 'attributions'
      ],
      locationBias: {
        center: {
          lat: (bounds.north + bounds.south) / 2,
          lng: (bounds.east + bounds.west) / 2
        },
        radius: 10000
      },
      maxResultCount: 30,
      language: 'en-MY',
      region: 'MY',
    };
    
    const { places } = await Place.searchByText(request);
    console.log(`✅ Found ${places.length} restaurants via NEW API`);
    
    // Cache the results
    this.cache.set(cacheKey, places);
    setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
    
    return this.normalizeNewAPIResults(places, bounds, filters);
  }

  // Try LEGACY Google Places API
  async tryLegacyPlacesAPI(bounds, filters, cacheKey) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve, reject) => {
      const request = {
        query: filters.foodType !== 'all' 
          ? `${filters.foodType} restaurant` 
          : 'restaurant',
        location: new google.maps.LatLng(
          (bounds.north + bounds.south) / 2,
          (bounds.east + bounds.west) / 2
        ),
        radius: 10000,
        type: 'restaurant'
      };

      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          console.log(`✅ Found ${results.length} restaurants via LEGACY API`);
          
          // Cache the results
          this.cache.set(cacheKey, results);
          setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
          
          const normalizedResults = this.normalizeLegacyAPIResults(results, bounds, filters);
          resolve(normalizedResults);
        } else {
          reject(new Error(`Legacy Places API error: ${status}`));
        }
      });
    });
  }

  // Normalize NEW API results
  normalizeNewAPIResults(places, bounds, filters) {
    return places.map(place => ({
      place_id: place.id,
      name: place.displayName,
      address: place.formattedAddress,
      location: {
        lat: typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat,
        lng: typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng
      },
      rating: place.rating || 0,
      userRatingCount: place.userRatingCount || 0,
      priceLevel: place.priceLevel || null,
      types: place.types || [],
      photos: place.photos ? place.photos.map(photo => ({
        photo_reference: typeof photo.getUrl === 'function' ? photo.getUrl({ maxWidth: 400 }) : photo.photo_reference || photo
      })) : [],
      phone: place.nationalPhoneNumber || '',
      website: '', // NEW API doesn't provide website in basic fields
      businessStatus: place.businessStatus || 'OPERATIONAL',
      currentOpeningHours: place.regularOpeningHours ? {
        openNow: place.regularOpeningHours.openNow,
        periods: place.regularOpeningHours.periods || [],
        weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions || []
      } : null,
      utcOffsetMinutes: place.utcOffsetMinutes || 0,
      viewport: place.viewport ? {
        northeast: {
          lat: typeof place.viewport.northeast.lat === 'function' ? place.viewport.northeast.lat() : place.viewport.northeast.lat,
          lng: typeof place.viewport.northeast.lng === 'function' ? place.viewport.northeast.lng() : place.viewport.northeast.lng
        },
        southwest: {
          lat: typeof place.viewport.southwest.lat === 'function' ? place.viewport.southwest.lat() : place.viewport.southwest.lat,
          lng: typeof place.viewport.southwest.lng === 'function' ? place.viewport.southwest.lng() : place.viewport.southwest.lng
        }
      } : null,
      source: 'google_places_new_api',
      fetchedAt: new Date().toISOString(),
      searchBounds: bounds,
      searchFilters: filters
    }));
  }

  // Normalize LEGACY API results
  normalizeLegacyAPIResults(results, bounds, filters) {
    return results.map(place => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      rating: place.rating || 0,
      userRatingCount: place.user_ratings_total || 0,
      priceLevel: place.price_level || null,
      types: place.types || [],
      photos: place.photos ? place.photos.map(photo => ({
        photo_reference: typeof photo.getUrl === 'function' ? photo.getUrl({ maxWidth: 400 }) : photo.photo_reference || photo
      })) : [],
      phone: place.formatted_phone_number || '',
      website: place.website || '',
      businessStatus: place.business_status || 'OPERATIONAL',
      currentOpeningHours: place.opening_hours ? {
        openNow: place.opening_hours.open_now,
        periods: place.opening_hours.periods || [],
        weekdayDescriptions: place.opening_hours.weekday_text || []
      } : null,
      utcOffsetMinutes: place.utc_offset || 0,
      viewport: place.geometry.viewport ? {
        northeast: {
          lat: place.geometry.viewport.getNorthEast().lat(),
          lng: place.geometry.viewport.getNorthEast().lng()
        },
        southwest: {
          lat: place.geometry.viewport.getSouthWest().lat(),
          lng: place.geometry.viewport.getSouthWest().lng()
        }
      } : null,
      source: 'google_places_legacy_api',
      fetchedAt: new Date().toISOString(),
      searchBounds: bounds,
      searchFilters: filters
    }));
  }

  // Save Google Places results to Firestore
  async saveToFirestore(restaurants) {
    try {
      for (const restaurant of restaurants) {
        // Check if already exists by place_id
        const existingQuery = query(
          collection(db, 'eateries'),
          where('place_id', '==', restaurant.place_id),
          limit(1)
        );
        
        const existingSnapshot = await getDocs(existingQuery);
        
        if (existingSnapshot.empty) {
          // Add new restaurant
          await addDoc(collection(db, 'eateries'), {
            ...restaurant,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log(`💾 Saved new restaurant: ${restaurant.name}`);
        } else {
          console.log(`⏭️ Restaurant already exists: ${restaurant.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error saving to Firestore:', error);
    }
  }
}

export const firestoreSearchService = new FirestoreSearchService();