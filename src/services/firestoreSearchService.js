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

  // Fallback to Google Places API (Legacy)
  async fallbackToGooglePlaces(bounds, filters) {
    try {
      console.log('🔄 Using legacy Google Places API for fallback...');
      
      // Create a temporary map element for PlacesService
      const tempMapDiv = document.createElement('div');
      const service = new google.maps.places.PlacesService(tempMapDiv);
      
      const request = {
        location: new google.maps.LatLng(
          (bounds.north + bounds.south) / 2,
          (bounds.east + bounds.west) / 2
        ),
        radius: 5000, // 5km radius
        type: 'restaurant',
        keyword: filters.foodType !== 'all' ? filters.foodType : 'food'
      };
      
      return new Promise((resolve) => {
        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            console.log(`✅ Found ${results.length} restaurants via legacy API`);
            
            // Normalize format
            const normalizedResults = results.map(place => ({
              place_id: place.place_id,
              name: place.name,
              address: place.vicinity,
              location: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              },
              rating: place.rating || 0,
              photos: place.photos || [],
              types: place.types || [],
              source: 'google_places_legacy'
            }));
            
            resolve(normalizedResults);
          } else {
            console.error('❌ Legacy Places API error:', status);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('❌ Google Places fallback error:', error);
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
            verified: false,
            createdBy: 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'google_places_auto'
          });
          console.log(`✅ Saved new eatery: ${restaurant.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error saving to Firestore:', error);
    }
  }
}

export const firestoreSearchService = new FirestoreSearchService();
export default firestoreSearchService;
