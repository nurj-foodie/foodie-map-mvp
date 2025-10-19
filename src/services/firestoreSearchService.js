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
    const googleResults = await this.fallbackToGooglePlaces(bounds, filters);
    
    // Step 3: Save Google results to Firestore for future use
    if (googleResults.length > 0) {
      await this.saveToFirestore(googleResults);
    }
    
    return googleResults;
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
        
        // Filter by bounds in memory
        if (data.location && 
            data.location.lat >= bounds.south && 
            data.location.lat <= bounds.north &&
            data.location.lng >= bounds.west && 
            data.location.lng <= bounds.east) {
          
          results.push({
            id: doc.id,
            ...data,
            source: 'firestore'
          });
        }
      });
      
      console.log(`📊 Found ${results.length} restaurants in bounds`);
      return results;
    } catch (error) {
      console.error('❌ Firestore query error:', error);
      return [];
    }
  }

  // Fallback to Google Places API (NEW API)
  async fallbackToGooglePlaces(bounds, filters) {
    try {
      console.log('🔄 Using NEW Google Places API for fallback...');
      
      // Import the new Places API
      const { Place } = await google.maps.importLibrary("places");
      
      const request = {
        textQuery: filters.foodType !== 'all' 
          ? `${filters.foodType} restaurant` 
          : 'restaurant',
        fields: [
          'id', 'displayName', 'location', 'rating', 'userRatingCount', 
          'priceLevel', 'types', 'formattedAddress', 'photos', 
          'currentOpeningHours', 'formattedPhoneNumber', 'websiteUri',
          'businessStatus', 'utcOffsetMinutes', 'viewport', 'attributions'
        ],
        locationBias: {
          center: {
            lat: (bounds.north + bounds.south) / 2,
            lng: (bounds.east + bounds.west) / 2
          },
          radius: 5000 // 5km radius
        },
        maxResultCount: 20,
        language: 'en-MY',
        region: 'MY',
      };
      
      const { places } = await Place.searchByText(request);
      
      console.log(`✅ Found ${places.length} restaurants via NEW API`);
      
      // Normalize format with ALL available Google Places data
      const normalizedResults = places.map(place => ({
        // Basic Info
        place_id: place.id,
        name: place.displayName,
        address: place.formattedAddress,
        location: {
          lat: typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat,
          lng: typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng
        },
        
        // Rich Google Places Data
        rating: place.rating || 0,
        userRatingCount: place.userRatingCount || 0,
        priceLevel: place.priceLevel || null,
        types: place.types || [],
        photos: place.photos || [],
        
        // Contact & Business Info
        phone: place.formattedPhoneNumber || '',
        website: place.websiteUri || '',
        businessStatus: place.businessStatus || 'OPERATIONAL',
        
        // Operating Hours
        currentOpeningHours: place.currentOpeningHours ? {
          openNow: place.currentOpeningHours.openNow,
          periods: place.currentOpeningHours.periods || [],
          weekdayDescriptions: place.currentOpeningHours.weekdayDescriptions || []
        } : null,
        
        // Location Details
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
        
        // Attribution
        attributions: place.attributions || [],
        
        // System Metadata
        source: 'google_places_new',
        lastUpdated: new Date()
      }));
      
      return normalizedResults;
    } catch (error) {
      console.error('❌ NEW Google Places API error:', error);
      return [];
    }
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
        
        const existing = await getDocs(existingQuery);
        
        if (existing.empty) {
          await addDoc(collection(db, 'eateries'), {
            ...restaurant,
            // System Metadata
            verified: false,
            createdBy: 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'google_places_auto',
            status: 'active',
            
            // Additional Fields for User Experience
            cuisineType: 'unknown', // Will be filled by user submissions or admin
            halalStatus: 'unknown', // Will be filled by user submissions or admin
            description: '', // Will be filled by user submissions
            tags: [], // Will be populated based on types and user input
            popularity: 0, // Will be tracked based on user interactions
            lastVerified: null // For admin verification tracking
          });
          console.log(`✅ Saved rich eatery data: ${restaurant.name} (${Object.keys(restaurant).length} fields)`);
        } else {
          // Update existing record with new data (if available)
          console.log(`📝 Eatery already exists: ${restaurant.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error saving to Firestore:', error);
    }
  }
}

export const firestoreSearchService = new FirestoreSearchService();
export default firestoreSearchService;
