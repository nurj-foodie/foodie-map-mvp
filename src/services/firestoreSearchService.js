/* global google */
import { collection, query, where, getDocs, addDoc, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

class FirestoreSearchService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Search Firestore first, fallback to Google Places
  async searchRestaurants(bounds, filters = {}, forceGooglePlaces = false, customTextQuery = null) {
    console.log('🔍 Firestore-first search started...');
    
    // If forceGooglePlaces is true, skip Firestore and go directly to Google Places
    if (forceGooglePlaces) {
      console.log('🔄 Forcing Google Places API (bypassing Firestore)...');
      console.log('💰 API Call:', {
        type: 'Google Places API',
        cost: '~RM0.017 per request',
        cacheHit: false,
        reason: 'Force Google Places requested',
        bounds: bounds,
        filters: filters
      });
      const googleResults = await this.fallbackToGooglePlaces(bounds, filters, customTextQuery);
      
      // Auto-populate Firestore with Google results
      if (googleResults.length > 0) {
        console.log(`💾 Auto-populating Firestore with ${googleResults.length} restaurants...`);
        await this.saveToFirestore(googleResults);
        console.log('✅ Auto-population completed! Future searches will use Firestore data.');
      }
      
      return googleResults;
    }
    
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
    const googleResults = await this.fallbackToGooglePlaces(bounds, filters, customTextQuery);
    
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
  async fallbackToGooglePlaces(bounds, filters, customTextQuery = null) {
    try {
      // Check if we've already made an API call for this area recently
      // Note: Cache key doesn't include customTextQuery to allow reuse
      const cacheKey = this.getCacheKey(bounds, filters);
      if (this.cache.has(cacheKey) && !customTextQuery) {
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
        return await this.tryNewPlacesAPI(bounds, filters, cacheKey, customTextQuery);
      } catch (newApiError) {
        console.log('⚠️ NEW API failed, falling back to LEGACY Places API:', newApiError.message);
        return await this.tryLegacyPlacesAPI(bounds, filters, cacheKey, customTextQuery);
      }
      
    } catch (error) {
      console.error('❌ All Google Places API methods failed:', error);
      throw error;
    }
  }

  // Try NEW Google Places API
  async tryNewPlacesAPI(bounds, filters, cacheKey, customTextQuery = null) {
    try {
      const { Place } = await google.maps.importLibrary("places");
      
      // Use custom text query if provided (for compound queries like "roti canai petaling jaya")
      const textQuery = customTextQuery || (filters.foodType !== 'all' 
        ? `${filters.foodType} restaurant` 
        : 'restaurant');
      
      const request = {
        textQuery: textQuery,
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
      
      // Normalize results with error handling
      let normalizedResults;
      try {
        normalizedResults = this.normalizeNewAPIResults(places, bounds, filters);
      } catch (normalizeError) {
        console.error('❌ Error normalizing NEW API results:', normalizeError);
        throw new Error(`Failed to normalize NEW API results: ${normalizeError.message}`);
      }
      
      // Cache the normalized results (not raw API objects)
      this.cache.set(cacheKey, normalizedResults);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
      
      return normalizedResults;
    } catch (error) {
      // Re-throw with more context
      const errorMessage = error.message || String(error);
      console.error('❌ NEW Places API error:', errorMessage);
      throw new Error(`NEW Places API failed: ${errorMessage}`);
    }
  }

  // Try LEGACY Google Places API
  async tryLegacyPlacesAPI(bounds, filters, cacheKey, customTextQuery = null) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve, reject) => {
      // Use custom text query if provided (for compound queries)
      const textQuery = customTextQuery || (filters.foodType !== 'all' 
        ? `${filters.foodType} restaurant` 
        : 'restaurant');
      
      const request = {
        query: textQuery,
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
          
          // Normalize results first
          const normalizedResults = this.normalizeLegacyAPIResults(results, bounds, filters);
          
          // Cache the normalized results (not raw API objects)
          this.cache.set(cacheKey, normalizedResults);
          setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
          
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
      // Safely extract viewport with null checks for NEW API structure
      viewport: (() => {
        if (!place.viewport) return null;
        
        // Check if viewport has northeast and southwest properties
        const northeast = place.viewport.northeast;
        const southwest = place.viewport.southwest;
        
        if (!northeast || !southwest) return null;
        
        try {
          return {
            northeast: {
              lat: typeof northeast.lat === 'function' ? northeast.lat() : (northeast.lat ?? null),
              lng: typeof northeast.lng === 'function' ? northeast.lng() : (northeast.lng ?? null)
            },
            southwest: {
              lat: typeof southwest.lat === 'function' ? southwest.lat() : (southwest.lat ?? null),
              lng: typeof southwest.lng === 'function' ? southwest.lng() : (southwest.lng ?? null)
            }
          };
        } catch (error) {
          console.warn('⚠️ Error extracting viewport from NEW API place:', error);
          return null;
        }
      })(),
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
        // Use isOpen() method if available (NEW API), otherwise fallback to deprecated open_now
        openNow: typeof place.opening_hours.isOpen === 'function' 
          ? place.opening_hours.isOpen() 
          : (place.opening_hours.open_now ?? false),
        periods: place.opening_hours.periods || [],
        weekdayDescriptions: place.opening_hours.weekday_text || []
      } : null,
      // Use utc_offset_minutes if available (NEW API), otherwise fallback to deprecated utc_offset
      // utc_offset is in minutes already, so no conversion needed
      utcOffsetMinutes: place.utc_offset_minutes ?? (place.utc_offset || 0),
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

  /**
   * Serialize periods from Google Maps objects to Firestore structure
   * Firestore expects: [{day: 0, openTime: "0800", closeTime: "2200"}]
   */
  serializePeriods(periods) {
    if (!Array.isArray(periods)) return [];
    
    return periods.map(period => {
      if (!period || typeof period !== 'object') return null;
      
      // Extract day and times
      let day = null;
      let openTime = null;
      let closeTime = null;
      
      // Get day from open period (Google Maps structure)
      if (period.open) {
        if (typeof period.open.day === 'function') {
          day = period.open.day();
        } else if (typeof period.open.day !== 'undefined') {
          day = period.open.day;
        }
        if (typeof period.open.time === 'function') {
          openTime = period.open.time();
        } else if (typeof period.open.time !== 'undefined') {
          openTime = period.open.time;
        }
      }
      
      // Get close time
      if (period.close) {
        if (typeof period.close.time === 'function') {
          closeTime = period.close.time();
        } else if (typeof period.close.time !== 'undefined') {
          closeTime = period.close.time;
        }
      }
      
      // Return flat structure matching Firestore: {day, openTime, closeTime}
      if (day !== null && openTime !== null) {
        const flatPeriod = {
          day: day,
          openTime: String(openTime).padStart(4, '0') // Ensure 4-digit format "0800"
        };
        
        if (closeTime !== null) {
          flatPeriod.closeTime = String(closeTime).padStart(4, '0');
        }
        
        return flatPeriod;
      }
      
      return null;
    }).filter(p => p !== null);
  }

  /**
   * Deep clean object to remove Google Maps objects
   * Recursively removes any objects with non-standard methods
   */
  deepCleanForFirestore(obj) {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCleanForFirestore(item));
    }
    
    // Handle objects
    if (typeof obj === 'object') {
      // Check if it's a Google Maps object (has non-standard methods)
      const hasNonStandardMethods = Object.getOwnPropertyNames(obj).some(prop => {
        const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
        return descriptor && typeof descriptor.value === 'function' && 
               !['toString', 'valueOf', 'hasOwnProperty'].includes(prop);
      });
      
      // If it's a Google Maps object, return null or a cleaned version
      if (hasNonStandardMethods) {
        // Try to extract primitive values
        if (obj.lat && typeof obj.lat === 'function') {
          return { lat: obj.lat(), lng: obj.lng() };
        }
        if (obj.day && typeof obj.day === 'function') {
          return { day: obj.day(), time: obj.time ? (typeof obj.time === 'function' ? obj.time() : obj.time) : null };
        }
        return null;
      }
      
      // Regular object - clean recursively
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = this.deepCleanForFirestore(value);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
      return cleaned;
    }
    
    // Primitive values
    return obj;
  }

  /**
   * Extract cuisine information from types array and name
   */
  extractCuisineInfo(types, name) {
    if (!Array.isArray(types)) types = [];
    const typesLower = types.map(t => String(t).toLowerCase());
    const nameLower = (name || '').toLowerCase();
    
    // Cuisine type mapping
    const cuisineMap = {
      'cafe': 'Cafe',
      'coffee_shop': 'Cafe',
      'bakery': 'Bakery',
      'fast_food': 'Fast Food',
      'meal_takeaway': 'Fast Food',
      'restaurant': 'Western', // Default
      'food': 'Western'
    };
    
    // Malaysian cuisine keywords
    const malaysianKeywords = ['nasi lemak', 'char kway teow', 'roti canai', 'satay', 'rendang', 'laksa', 'mee goreng'];
    const isMalaysian = malaysianKeywords.some(keyword => nameLower.includes(keyword));
    
    // Check types for cuisine
    let cuisineCategory = 'Western';
    let cuisineType = 'Western';
    
    for (const [type, cuisine] of Object.entries(cuisineMap)) {
      if (typesLower.includes(type)) {
        cuisineCategory = cuisine;
        cuisineType = cuisine;
        break;
      }
    }
    
    // Override if Malaysian keywords found
    if (isMalaysian) {
      cuisineCategory = 'Malay';
      cuisineType = 'Malay';
    }
    
    // Extract cuisine tags
    const cuisineTags = [];
    if (typesLower.includes('halal') || nameLower.includes('halal')) {
      cuisineTags.push('halal');
    }
    if (typesLower.includes('vegetarian') || nameLower.includes('vegetarian')) {
      cuisineTags.push('vegetarian');
    }
    if (typesLower.includes('vegan') || nameLower.includes('vegan')) {
      cuisineTags.push('vegan');
    }
    
    // Add cuisine type as tag
    if (cuisineType && !cuisineTags.includes(cuisineType.toLowerCase())) {
      cuisineTags.push(cuisineType.toLowerCase());
    }
    
    return {
      cuisineCategory,
      cuisineType,
      cuisineTags
    };
  }

  /**
   * Extract halal status from types and name
   */
  extractHalalStatus(types, name) {
    if (!Array.isArray(types)) types = [];
    const typesLower = types.map(t => String(t).toLowerCase());
    const nameLower = (name || '').toLowerCase();
    
    // Check for halal indicators
    if (typesLower.includes('halal') || nameLower.includes('halal')) {
      return 'halal';
    }
    if (nameLower.includes('pork-free') || nameLower.includes('pork free')) {
      return 'pork-free';
    }
    if (nameLower.includes('non-halal') || nameLower.includes('non halal')) {
      return 'non-halal';
    }
    
    return 'unknown';
  }

  /**
   * Extract business features from types
   */
  extractBusinessFeatures(types) {
    if (!Array.isArray(types)) types = [];
    const typesLower = types.map(t => String(t).toLowerCase());
    
    return {
      acceptsReservations: typesLower.includes('restaurant'), // Guess based on type
      deliveryAvailable: typesLower.includes('meal_delivery'),
      dineInAvailable: typesLower.includes('restaurant'),
      takeoutAvailable: typesLower.includes('meal_takeaway'),
      wheelchairAccessible: false, // Not available in types, default to false
    };
  }

  /**
   * Calculate quality score based on available data
   */
  calculateQualityScore(restaurant) {
    let score = 0;
    const maxScore = 100;
    
    // Basic info (40 points)
    if (restaurant.name) score += 10;
    if (restaurant.address) score += 10;
    if (restaurant.location?.lat && restaurant.location?.lng) score += 10;
    if (restaurant.rating) score += 10;
    
    // Contact info (20 points)
    if (restaurant.phone) score += 10;
    if (restaurant.website) score += 10;
    
    // Operating hours (20 points)
    if (restaurant.operatingHours?.periods?.length > 0) score += 10;
    if (restaurant.operatingHours?.weekdayText?.length > 0) score += 10;
    
    // Photos (10 points)
    if (restaurant.photos?.length > 0) score += 10;
    
    // Reviews (10 points)
    if (restaurant.userRatingTotal > 0) score += 10;
    
    return Math.min(score, maxScore);
  }

  // Save Google Places results to Firestore with STRUCTURED SCHEMA
  async saveToFirestore(restaurants) {
    try {
      for (const restaurant of restaurants) {
        // Get place_id (support both place_id and placeId)
        const placeId = restaurant.place_id || restaurant.placeId;
        
        // Skip if place_id is missing (required for duplicate check)
        if (!placeId) {
          console.warn(`⚠️ Skipping restaurant without place_id: ${restaurant.name || 'Unknown'}`);
          continue;
        }
        
        // Check if already exists by BOTH place_id and placeId (backward compatibility)
        const query1 = query(
          collection(db, 'eateries'),
          where('place_id', '==', placeId),
          limit(1)
        );
        const query2 = query(
          collection(db, 'eateries'),
          where('placeId', '==', placeId),
          limit(1)
        );
        
        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(query1),
          getDocs(query2)
        ]);
        
        const exists = !snapshot1.empty || !snapshot2.empty;
        
        if (!exists) {
          // Extract cuisine info
          const cuisineInfo = this.extractCuisineInfo(restaurant.types || [], restaurant.name);
          const halalStatus = this.extractHalalStatus(restaurant.types || [], restaurant.name);
          const businessFeatures = this.extractBusinessFeatures(restaurant.types || []);
          
          // Convert currentOpeningHours to operatingHours (Firestore structure)
          let operatingHours = {
            isOpen: false,
            isOpenNow: false,
            isOpen24Hours: false,
            periods: [],
            weekdayText: [],
            timezone: 'Asia/Kuala_Lumpur',
            specialHours: []
          };
          
          if (restaurant.currentOpeningHours) {
            const periods = this.serializePeriods(restaurant.currentOpeningHours.periods || []);
            
            operatingHours = {
              isOpen: restaurant.currentOpeningHours.openNow || false,
              isOpenNow: restaurant.currentOpeningHours.openNow || false,
              isOpen24Hours: false,
              periods: periods,
              weekdayText: Array.isArray(restaurant.currentOpeningHours.weekdayDescriptions)
                ? restaurant.currentOpeningHours.weekdayDescriptions
                : [],
              timezone: restaurant.utcOffsetMinutes !== undefined
                ? `UTC${restaurant.utcOffsetMinutes >= 0 ? '+' : ''}${Math.floor(restaurant.utcOffsetMinutes / 60)}`
                : 'Asia/Kuala_Lumpur',
              specialHours: []
            };
          }
          
          // Calculate quality score
          const qualityScore = this.calculateQualityScore(restaurant);
          
          // Build structured schema
          const structuredData = {
            // Basic Information
            name: restaurant.name || 'Unknown Restaurant',
            address: restaurant.address || '',
            placeId: placeId, // Use camelCase (structured schema)
            location: {
              lat: restaurant.location?.lat || (typeof restaurant.location?.lat === 'function' ? restaurant.location.lat() : 0),
              lng: restaurant.location?.lng || (typeof restaurant.location?.lng === 'function' ? restaurant.location.lng() : 0)
            },
            
            // Rating and Reviews
            rating: restaurant.rating || 0,
            userRatingTotal: restaurant.userRatingCount || restaurant.userRatingTotal || 0,
            
            // Operating Hours
            operatingHours: operatingHours,
            
            // Cuisine Information
            cuisineCategory: cuisineInfo.cuisineCategory,
            cuisineType: cuisineInfo.cuisineType,
            cuisineTags: cuisineInfo.cuisineTags,
            
            // Halal Status
            halalStatus: halalStatus,
            
            // Business Status
            businessStatus: restaurant.businessStatus || 'OPERATIONAL',
            isActive: true,
            
            // Price Level (keep top-level for queries, also in business map)
            priceLevel: restaurant.priceLevel || null,
            
            // Types (Google Places types)
            types: Array.isArray(restaurant.types) ? restaurant.types : [],
            
            // Photos
            photos: Array.isArray(restaurant.photos) ? restaurant.photos : [],
            photoUrl: restaurant.photos?.[0]?.photo_reference || restaurant.photoUrl || '',
            
            // Phone (keep top-level for compatibility, also in contact map)
            phone: restaurant.phone || '',
            
            // Website (keep top-level for compatibility, also in socialMedia map)
            website: restaurant.website || '',
            
            // Nested Maps - Analytics
            analytics: {
              lastViewed: null,
              popularityScore: 0, // Will be calculated based on views, favorites, etc.
              totalCheckIns: 0,
              totalClicks: 0,
              totalFavorites: 0,
              totalViews: 0
            },
            
            // Nested Maps - Business
            business: {
              acceptsReservations: businessFeatures.acceptsReservations,
              deliveryAvailable: businessFeatures.deliveryAvailable,
              dineInAvailable: businessFeatures.dineInAvailable,
              priceLevel: restaurant.priceLevel || null,
              priceRange: restaurant.priceLevel ? '$'.repeat(restaurant.priceLevel) : '$',
              takeoutAvailable: businessFeatures.takeoutAvailable,
              wheelchairAccessible: businessFeatures.wheelchairAccessible,
              businessStatus: restaurant.businessStatus || 'OPERATIONAL'
            },
            
            // Nested Maps - Contact
            contact: {
              email: '',
              internationalPhone: '',
              phone: restaurant.phone || '',
              socialMedia: {} // Will be populated if available
            },
            
            // Nested Maps - Social Media
            socialMedia: {
              website: restaurant.website || ''
            },
            
            // Nested Maps - Metadata
            metadata: {
              dataSource: restaurant.source || 'google_places',
              discoveredAt: restaurant.fetchedAt || new Date().toISOString(),
              lastUpdated: new Date(),
              qualityScore: qualityScore,
              version: 2 // Schema version
            },
            
            // User-Generated Content (initialize)
            userCheckIns: 0,
            userReviews: [],
            userPhotos: [],
            
            // Timestamps
            createdAt: new Date(),
            lastUpdated: new Date()
          };
          
          // Deep clean to remove any remaining Google Maps objects
          const cleanedData = this.deepCleanForFirestore(structuredData);
          
          // Add new restaurant
          await addDoc(collection(db, 'eateries'), cleanedData);
          console.log(`💾 Saved new restaurant (structured schema): ${restaurant.name}`);
        } else {
          console.log(`⏭️ Restaurant already exists: ${restaurant.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error saving to Firestore:', error);
      throw error;
    }
  }
}

export const firestoreSearchService = new FirestoreSearchService();