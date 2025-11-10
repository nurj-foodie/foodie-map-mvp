/* global google */
import { collection, query, where, getDocs, addDoc, limit, GeoPoint } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * Unified Place Search Service
 * Handles search for restaurants, R&R stops, and petrol stations
 */
class PlaceSearchService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Search R&R stops along route
   * Uses type filter (establishment) + name keyword filtering
   */
  async searchRNRStops(bounds, filters = {}) {
    console.log('🛣️ Searching R&R stops...');
    
    // Step 1: Query Firestore first
    const firestoreResults = await this.queryFirestoreByType('rnr_stops', bounds, filters);
    
    if (firestoreResults.length > 0) {
      console.log(`✅ Found ${firestoreResults.length} R&R stops in Firestore`);
      return firestoreResults;
    }
    
    // Step 2: Fallback to Google Places API
    console.log('⚠️ No Firestore R&R results, falling back to Google Places API...');
    const googleResults = await this.searchRNRFromGoogle(bounds, filters);
    
    // Step 3: Auto-populate Firestore
    if (googleResults.length > 0) {
      console.log(`💾 Auto-populating Firestore with ${googleResults.length} R&R stops...`);
      await this.saveToFirestore('rnr_stops', googleResults);
      console.log('✅ R&R auto-population completed!');
    }
    
    return googleResults;
  }

  /**
   * Search petrol stations along route
   * Uses gas_station type filter
   */
  async searchPetrolStations(bounds, filters = {}) {
    console.log('⛽ Searching petrol stations...');
    
    // Step 1: Query Firestore first
    const firestoreResults = await this.queryFirestoreByType('petrol_stations', bounds, filters);
    
    if (firestoreResults.length > 0) {
      console.log(`✅ Found ${firestoreResults.length} petrol stations in Firestore`);
      return firestoreResults;
    }
    
    // Step 2: Fallback to Google Places API
    console.log('⚠️ No Firestore petrol results, falling back to Google Places API...');
    const googleResults = await this.searchPetrolFromGoogle(bounds, filters);
    
    // Step 3: Auto-populate Firestore
    if (googleResults.length > 0) {
      console.log(`💾 Auto-populating Firestore with ${googleResults.length} petrol stations...`);
      await this.saveToFirestore('petrol_stations', googleResults);
      console.log('✅ Petrol auto-population completed!');
    }
    
    return googleResults;
  }

  /**
   * Query Firestore by place type
   */
  async queryFirestoreByType(collectionName, bounds, filters = {}) {
    try {
      const placesRef = collection(db, collectionName);
      
      // Create bounds query (simplified - Firestore doesn't support native geo queries)
      // We'll use a simple bounds check in memory after fetching
      const q = query(placesRef, limit(100)); // Get more than needed, filter in memory
      
      const snapshot = await getDocs(q);
      const results = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const location = data.location;
        
        // Check if location is within bounds
        if (location && 
            location.lat >= bounds.south && 
            location.lat <= bounds.north &&
            location.lng >= bounds.west && 
            location.lng <= bounds.east) {
          results.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      console.log(`📊 Found ${results.length} ${collectionName} in bounds`);
      return results;
    } catch (error) {
      console.error(`❌ Error querying ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Search R&R stops from Google Places API
   */
  async searchRNRFromGoogle(bounds, filters = {}) {
    try {
      // Try NEW API first
      try {
        return await this.searchRNRFromNewAPI(bounds, filters);
      } catch (newApiError) {
        console.log('⚠️ NEW API failed for R&R, falling back to LEGACY API:', newApiError.message);
        return await this.searchRNRFromLegacyAPI(bounds, filters);
      }
    } catch (error) {
      console.error('❌ R&R search failed:', error);
      return [];
    }
  }

  /**
   * Search R&R from NEW Google Places API
   */
  async searchRNRFromNewAPI(bounds, filters = {}) {
    const { Place } = await google.maps.importLibrary("places");
    
    const request = {
      textQuery: 'rest stop OR R&R OR highway rest area',
      fields: [
        'id', 'displayName', 'location', 'rating', 'userRatingCount',
        'types', 'formattedAddress', 'photos',
        'regularOpeningHours', 'nationalPhoneNumber',
        'businessStatus', 'utcOffsetMinutes', 'viewport'
      ],
      locationBias: {
        center: {
          lat: (bounds.north + bounds.south) / 2,
          lng: (bounds.east + bounds.west) / 2
        },
        radius: 50000 // 50km radius
      },
      maxResultCount: 30,
      language: 'en-MY',
      region: 'MY'
    };
    
    const { places } = await Place.searchByText(request);
    
    // Filter by R&R keywords in name
    const rnrPlaces = places.filter(place => {
      const name = place.displayName?.toLowerCase() || '';
      return name.includes('r&r') || 
             name.includes('rest stop') || 
             name.includes('rest area') ||
             name.includes('layby') ||
             name.includes('rnr');
    });
    
    console.log(`✅ Found ${rnrPlaces.length} R&R stops via NEW API`);
    return this.normalizeRNRResults(rnrPlaces, bounds);
  }

  /**
   * Search R&R from LEGACY Google Places API
   */
  async searchRNRFromLegacyAPI(bounds, filters = {}) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve, reject) => {
      const request = {
        query: 'rest stop OR R&R OR highway rest area',
        location: new google.maps.LatLng(
          (bounds.north + bounds.south) / 2,
          (bounds.east + bounds.west) / 2
        ),
        radius: 50000 // 50km
      };
      
      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Filter by R&R keywords
          const rnrResults = results.filter(place => {
            const name = place.name?.toLowerCase() || '';
            return name.includes('r&r') || 
                   name.includes('rest stop') || 
                   name.includes('rest area') ||
                   name.includes('layby') ||
                   name.includes('rnr');
          });
          
          console.log(`✅ Found ${rnrResults.length} R&R stops via LEGACY API`);
          resolve(this.normalizeRNRLegacyResults(rnrResults, bounds));
        } else {
          reject(new Error(`R&R search failed: ${status}`));
        }
      });
    });
  }

  /**
   * Search Petrol stations from Google Places API
   */
  async searchPetrolFromGoogle(bounds, filters = {}) {
    try {
      // Try NEW API first
      try {
        return await this.searchPetrolFromNewAPI(bounds, filters);
      } catch (newApiError) {
        console.log('⚠️ NEW API failed for Petrol, falling back to LEGACY API:', newApiError.message);
        return await this.searchPetrolFromLegacyAPI(bounds, filters);
      }
    } catch (error) {
      console.error('❌ Petrol search failed:', error);
      return [];
    }
  }

  /**
   * Search Petrol from NEW Google Places API
   */
  async searchPetrolFromNewAPI(bounds, filters = {}) {
    const { Place } = await google.maps.importLibrary("places");
    
    const request = {
      textQuery: 'petrol station OR gas station OR fuel',
      fields: [
        'id', 'displayName', 'location', 'rating', 'userRatingCount',
        'types', 'formattedAddress', 'photos',
        'regularOpeningHours', 'nationalPhoneNumber',
        'businessStatus', 'utcOffsetMinutes', 'viewport'
      ],
      locationBias: {
        center: {
          lat: (bounds.north + bounds.south) / 2,
          lng: (bounds.east + bounds.west) / 2
        },
        radius: 50000 // 50km radius
      },
      maxResultCount: 30,
      language: 'en-MY',
      region: 'MY'
    };
    
    const { places } = await Place.searchByText(request);
    
    // Filter by gas_station type or petrol keywords
    const petrolPlaces = places.filter(place => {
      const types = place.types || [];
      const name = place.displayName?.toLowerCase() || '';
      return types.includes('gas_station') ||
             name.includes('petrol') ||
             name.includes('gas station') ||
             name.includes('fuel');
    });
    
    console.log(`✅ Found ${petrolPlaces.length} petrol stations via NEW API`);
    return this.normalizePetrolResults(petrolPlaces, bounds);
  }

  /**
   * Search Petrol from LEGACY Google Places API
   */
  async searchPetrolFromLegacyAPI(bounds, filters = {}) {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    
    return new Promise((resolve, reject) => {
      const request = {
        query: 'petrol station',
        location: new google.maps.LatLng(
          (bounds.north + bounds.south) / 2,
          (bounds.east + bounds.west) / 2
        ),
        radius: 50000, // 50km
        type: 'gas_station' // Use type filter for petrol stations
      };
      
      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          console.log(`✅ Found ${results.length} petrol stations via LEGACY API`);
          resolve(this.normalizePetrolLegacyResults(results, bounds));
        } else {
          reject(new Error(`Petrol search failed: ${status}`));
        }
      });
    });
  }

  /**
   * Normalize R&R results from NEW API
   */
  normalizeRNRResults(places, bounds) {
    return places.map(place => ({
      place_id: place.id,
      name: place.displayName,
      address: place.formattedAddress || '',
      location: {
        lat: typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat,
        lng: typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng
      },
      type: 'rnr',
      rating: place.rating || 0,
      userRatingCount: place.userRatingCount || 0,
      types: place.types || [],
      photos: place.photos ? place.photos.map(photo => ({
        photo_reference: typeof photo.getUrl === 'function' ? photo.getUrl({ maxWidth: 400 }) : photo.photo_reference || photo
      })) : [],
      phone: place.nationalPhoneNumber || '',
      website: '',
      businessStatus: place.businessStatus || 'OPERATIONAL',
      currentOpeningHours: place.regularOpeningHours ? {
        openNow: place.regularOpeningHours.openNow,
        periods: place.regularOpeningHours.periods || [],
        weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions || []
      } : null,
      utcOffsetMinutes: place.utcOffsetMinutes || 0,
      viewport: this.extractViewport(place.viewport),
      source: 'google_places_new_api',
      fetchedAt: new Date().toISOString(),
      searchBounds: bounds
    }));
  }

  /**
   * Normalize R&R results from LEGACY API
   */
  normalizeRNRLegacyResults(results, bounds) {
    return results.map(place => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address || '',
      location: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      },
      type: 'rnr',
      rating: place.rating || 0,
      userRatingCount: place.user_ratings_total || 0,
      types: place.types || [],
      photos: place.photos ? place.photos.map(photo => ({
        photo_reference: typeof photo.getUrl === 'function' ? photo.getUrl({ maxWidth: 400 }) : photo.photo_reference || photo
      })) : [],
      phone: place.formatted_phone_number || '',
      website: place.website || '',
      businessStatus: place.business_status || 'OPERATIONAL',
      currentOpeningHours: place.opening_hours ? {
        openNow: typeof place.opening_hours.isOpen === 'function' 
          ? place.opening_hours.isOpen() 
          : (place.opening_hours.open_now ?? false),
        periods: place.opening_hours.periods || [],
        weekdayDescriptions: place.opening_hours.weekday_text || []
      } : null,
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
      searchBounds: bounds
    }));
  }

  /**
   * Normalize Petrol results from NEW API
   */
  normalizePetrolResults(places, bounds) {
    return places.map(place => {
      const name = place.displayName || '';
      const brand = this.extractBrand(name);
      
      return {
        place_id: place.id,
        name: name,
        address: place.formattedAddress || '',
        location: {
          lat: typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat,
          lng: typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng
        },
        type: 'petrol_station',
        brand: brand, // Extracted brand
        rating: place.rating || 0,
        userRatingCount: place.userRatingCount || 0,
        types: place.types || [],
        photos: place.photos ? place.photos.map(photo => ({
          photo_reference: typeof photo.getUrl === 'function' ? photo.getUrl({ maxWidth: 400 }) : photo.photo_reference || photo
        })) : [],
        phone: place.nationalPhoneNumber || '',
        website: '',
        businessStatus: place.businessStatus || 'OPERATIONAL',
        currentOpeningHours: place.regularOpeningHours ? {
          openNow: place.regularOpeningHours.openNow,
          periods: place.regularOpeningHours.periods || [],
          weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions || []
        } : null,
        utcOffsetMinutes: place.utcOffsetMinutes || 0,
        viewport: this.extractViewport(place.viewport),
        source: 'google_places_new_api',
        fetchedAt: new Date().toISOString(),
        searchBounds: bounds
      };
    });
  }

  /**
   * Normalize Petrol results from LEGACY API
   */
  normalizePetrolLegacyResults(results, bounds) {
    return results.map(place => {
      const name = place.name || '';
      const brand = this.extractBrand(name);
      
      return {
        place_id: place.place_id,
        name: name,
        address: place.formatted_address || '',
        location: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        },
        type: 'petrol_station',
        brand: brand, // Extracted brand
        rating: place.rating || 0,
        userRatingCount: place.user_ratings_total || 0,
        types: place.types || [],
        photos: place.photos ? place.photos.map(photo => ({
          photo_reference: typeof photo.getUrl === 'function' ? photo.getUrl({ maxWidth: 400 }) : photo.photo_reference || photo
        })) : [],
        phone: place.formatted_phone_number || '',
        website: place.website || '',
        businessStatus: place.business_status || 'OPERATIONAL',
        currentOpeningHours: place.opening_hours ? {
          openNow: typeof place.opening_hours.isOpen === 'function' 
            ? place.opening_hours.isOpen() 
            : (place.opening_hours.open_now ?? false),
          periods: place.opening_hours.periods || [],
          weekdayDescriptions: place.opening_hours.weekday_text || []
        } : null,
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
        searchBounds: bounds
      };
    });
  }

  /**
   * Extract brand from petrol station name
   */
  extractBrand(name) {
    if (!name) return null;
    
    const brands = [
      'Petronas', 'Shell', 'BHP', 'Caltex', 'Petron',
      'Petronas Dagangan', 'Petronas Mesra', 'Shell Select',
      'BHPetrol', 'Caltex Star Mart'
    ];
    
    const nameUpper = name.toUpperCase();
    
    // Check for exact brand matches
    for (const brand of brands) {
      if (nameUpper.includes(brand.toUpperCase())) {
        // Return the main brand name (not variations)
        if (brand.includes('Petronas')) return 'Petronas';
        if (brand.includes('Shell')) return 'Shell';
        if (brand.includes('BHP')) return 'BHP';
        if (brand.includes('Caltex')) return 'Caltex';
        if (brand.includes('Petron')) return 'Petron';
        return brand;
      }
    }
    
    // Try to extract from common patterns
    // "Petronas Station" → "Petronas"
    // "Shell Select" → "Shell"
    const patterns = [
      /(Petronas|Shell|BHP|Caltex|Petron)\s*(Station|Select|Mesra|Dagangan)?/i
    ];
    
    for (const pattern of patterns) {
      const match = name.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Safely extract viewport from place object
   */
  extractViewport(viewport) {
    if (!viewport) return null;
    
    const northeast = viewport.northeast;
    const southwest = viewport.southwest;
    
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
      console.warn('⚠️ Error extracting viewport:', error);
      return null;
    }
  }

  /**
   * Deep clean object to remove any Google Maps objects
   * Recursively checks for objects with methods (Google Maps objects) and removes them
   */
  deepCleanForFirestore(obj, depth = 0) {
    // Prevent infinite recursion
    if (depth > 10) return null;
    
    if (obj === null || obj === undefined) return null;
    
    // Primitive types are safe
    if (typeof obj !== 'object') return obj;
    
    // Date objects are safe
    if (obj instanceof Date) return obj;
    
    // Arrays - recursively clean each element
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCleanForFirestore(item, depth + 1)).filter(item => item !== null);
    }
    
    // Check if this is a Google Maps object (has methods that aren't standard object methods)
    const hasGoogleMapsMethods = Object.getOwnPropertyNames(obj).some(prop => {
      const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
      return descriptor && typeof descriptor.value === 'function' && 
             !['toString', 'valueOf', 'hasOwnProperty'].includes(prop);
    });
    
    // If it looks like a Google Maps object, skip it
    if (hasGoogleMapsMethods && depth > 0) {
      return null;
    }
    
    // Plain object - recursively clean each property
    const cleaned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = this.deepCleanForFirestore(obj[key], depth + 1);
        if (value !== null && value !== undefined) {
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned;
  }

  /**
   * Serialize place data for Firestore (remove Google Maps objects)
   */
  serializePlaceForFirestore(place) {
    if (!place) return null;
    
    const serialized = {
      place_id: place.place_id,
      name: place.name,
      address: place.address || '',
      location: place.location ? {
        lat: typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat,
        lng: typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng
      } : null,
      type: place.type,
      brand: place.brand || null,
      rating: place.rating || 0,
      userRatingCount: place.userRatingCount || 0,
      types: Array.isArray(place.types) ? place.types : [],
      phone: place.phone || '',
      website: place.website || '',
      businessStatus: place.businessStatus || 'OPERATIONAL',
      utcOffsetMinutes: place.utcOffsetMinutes || 0,
      source: place.source || 'unknown',
      fetchedAt: place.fetchedAt || new Date().toISOString(),
      searchBounds: place.searchBounds ? {
        north: place.searchBounds.north,
        south: place.searchBounds.south,
        east: place.searchBounds.east,
        west: place.searchBounds.west
      } : null
    };
    
    // Serialize photos (extract photo_reference strings only)
    if (place.photos && Array.isArray(place.photos)) {
      serialized.photos = place.photos.map(photo => {
        if (typeof photo === 'string') return { photo_reference: photo };
        if (photo.photo_reference) return { photo_reference: photo.photo_reference };
        return null;
      }).filter(p => p !== null);
    }
    
    // Serialize viewport (extract plain objects only)
    if (place.viewport) {
      serialized.viewport = this.extractViewport(place.viewport);
    }
    
    // Serialize operatingHours to match Firestore structure
    // Firestore expects: operatingHours { isOpen, isOpenNow, isOpen24Hours, periods: [{day, openTime, closeTime}], weekdayText, timezone }
    if (place.currentOpeningHours) {
      // Extract periods as flat objects matching Firestore structure
      const periods = Array.isArray(place.currentOpeningHours.periods)
        ? place.currentOpeningHours.periods.map(period => {
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
            
            // Return flat structure matching Firestore
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
          }).filter(p => p !== null)
        : [];
      
      serialized.operatingHours = {
        isOpen: place.currentOpeningHours.openNow || false,
        isOpenNow: place.currentOpeningHours.openNow || false,
        isOpen24Hours: false, // Will be calculated if needed
        periods: periods,
        weekdayText: Array.isArray(place.currentOpeningHours.weekdayDescriptions) 
          ? place.currentOpeningHours.weekdayDescriptions 
          : [],
        timezone: place.utcOffsetMinutes !== undefined 
          ? `UTC${place.utcOffsetMinutes >= 0 ? '+' : ''}${Math.floor(place.utcOffsetMinutes / 60)}` 
          : 'Asia/Kuala_Lumpur', // Default to Malaysia timezone
        specialHours: [] // Empty array for now
      };
    }
    
    // Remove null/undefined values
    Object.keys(serialized).forEach(key => {
      if (serialized[key] === null || serialized[key] === undefined) {
        delete serialized[key];
      }
    });
    
    // Final deep clean to catch any remaining Google Maps objects
    return this.deepCleanForFirestore(serialized);
  }

  /**
   * Save places to Firestore collection
   */
  async saveToFirestore(collectionName, places) {
    try {
      for (const place of places) {
        // Check if already exists by place_id
        const existingQuery = query(
          collection(db, collectionName),
          where('place_id', '==', place.place_id),
          limit(1)
        );
        
        const existingSnapshot = await getDocs(existingQuery);
        
        if (existingSnapshot.empty) {
          // Serialize place data before saving
          const serializedPlace = this.serializePlaceForFirestore(place);
          
          if (serializedPlace) {
            await addDoc(collection(db, collectionName), {
              ...serializedPlace,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            console.log(`💾 Saved new ${collectionName}: ${place.name}`);
          } else {
            console.warn(`⚠️ Failed to serialize ${collectionName}: ${place.name}`);
          }
        } else {
          console.log(`⏭️ ${collectionName} already exists: ${place.name}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error saving ${collectionName} to Firestore:`, error);
    }
  }
}

export const placeSearchService = new PlaceSearchService();

