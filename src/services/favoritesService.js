import { 
  collection, 
  addDoc, 
  deleteDoc, 
  deleteField,
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { firestoreSearchService } from './firestoreSearchService';

class FavoritesService {
  constructor() {
    this.collectionName = 'favorites';
  }

  // Add restaurant to favorites
  async addToFavorites(userId, restaurant) {
    try {
      // IMPORTANT: Prioritize place_id over id to avoid Firestore document ID conflicts
      // place_id is the Google Place ID (persistent identifier)
      // id might be a Firestore document ID (not reliable for matching)
      let restaurantId = restaurant.place_id || restaurant.placeId;
      
      // Only use restaurant.id if it looks like a Google Place ID (starts with "ChIJ")
      // or if it's a temp ID (starts with "temp_")
      if (!restaurantId && restaurant.id) {
        if (restaurant.id.startsWith('ChIJ') || restaurant.id.startsWith('temp_')) {
          restaurantId = restaurant.id;
        } else {
          console.warn('⚠️ Ignoring Firestore document ID, generating temp ID instead:', restaurant.id);
        }
      }
      
      // If no ID exists, generate a temporary one based on name and location
      if (!restaurantId && restaurant.name) {
        const lat = restaurant.geometry?.location?.lat || restaurant.location?.lat || restaurant.lat || 0;
        const lng = restaurant.geometry?.location?.lng || restaurant.location?.lng || restaurant.lng || 0;
        restaurantId = `temp_${restaurant.name.replace(/\s+/g, '_').toLowerCase()}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
        console.log('🔧 Generated temporary ID for restaurant:', restaurantId);
      }
      
      if (!restaurantId) {
        console.error('❌ Restaurant ID is required');
        return { success: false, error: 'Restaurant ID is required' };
      }

      if (!restaurant.name) {
        console.error('❌ Restaurant name is required');
        return { success: false, error: 'Restaurant name is required' };
      }

      // Check if already favorited (including soft-deleted ones to prevent duplicates)
      const existing = await this.getFavoriteByPlaceId(userId, restaurantId);
      if (existing) {
        // If it's soft-deleted, restore it instead of creating duplicate
        if (existing.removedAt) {
          console.log('🔄 Restaurant was previously removed, restoring instead of creating duplicate');
          return await this.restoreFavorite(userId, existing.id);
        }
        console.log('✅ Restaurant already in favorites');
        return { success: true, message: 'Already in favorites' };
      }
      
      // Additional check: Look for any duplicates with same name and location (within 100m)
      // This prevents adding the same restaurant multiple times with different IDs
      if (restaurant.geometry?.location || restaurant.location) {
        const lat = restaurant.geometry?.location?.lat || restaurant.location?.lat || restaurant.lat || 0;
        const lng = restaurant.geometry?.location?.lng || restaurant.location?.lng || restaurant.lng || 0;
        const duplicates = await this.findDuplicatesByNameAndLocation(userId, restaurant.name, lat, lng);
        if (duplicates.length > 0) {
          console.warn(`⚠️ Found ${duplicates.length} potential duplicate(s) for "${restaurant.name}"`);
          // Use the first existing favorite instead of creating a new one
          const existingDuplicate = duplicates.find(d => !d.removedAt) || duplicates[0];
          if (existingDuplicate && !existingDuplicate.removedAt) {
            // If the existing duplicate has a different (likely incorrect) restaurantId,
            // update it to the correct Google Place ID
            const existingRestaurantId = existingDuplicate.restaurantId || existingDuplicate.eateryId;
            if (existingRestaurantId !== restaurantId) {
              // Check if existing ID is a Firestore document ID (not a valid Google Place ID)
              const isFirestoreDocId = existingRestaurantId && 
                !existingRestaurantId.startsWith('ChIJ') && 
                !existingRestaurantId.startsWith('temp_');
              
              if (isFirestoreDocId || restaurantId.startsWith('ChIJ')) {
                // Update the favorite with the correct restaurantId
                console.log(`🔧 Updating favorite restaurantId from "${existingRestaurantId}" to "${restaurantId}"`);
                try {
                  const favoriteRef = doc(db, this.collectionName, existingDuplicate.id);
                  const updateData = {
                    restaurantId: restaurantId,
                    // Remove eateryId if it exists to avoid conflicts (standardize on restaurantId)
                    eateryId: deleteField(),
                    // Also update restaurantData if it exists
                    ...(restaurant.name && { restaurantName: restaurant.name }),
                    ...(restaurant.geometry?.location || restaurant.location ? {
                      restaurantLocation: {
                        lat: restaurant.geometry?.location?.lat || restaurant.location?.lat || restaurant.lat || 0,
                        lng: restaurant.geometry?.location?.lng || restaurant.location?.lng || restaurant.lng || 0
                      }
                    } : {})
                  };
                  await updateDoc(favoriteRef, updateData);
                  console.log('✅ Updated favorite with correct restaurantId (removed eateryId to avoid conflicts)');
                  return { success: true, message: 'Already in favorites (updated ID)' };
                } catch (updateError) {
                  console.error('❌ Error updating favorite ID:', updateError);
                  // Fall through to return "already in favorites" anyway
                }
              }
            }
            console.log('✅ Using existing favorite instead of creating duplicate');
            return { success: true, message: 'Already in favorites (found duplicate)' };
          }
        }
      }

      // Extract photo_reference safely (handle Google Maps Photo objects)
      let photoReference = null;
      if (restaurant.photos && restaurant.photos.length > 0) {
        const firstPhoto = restaurant.photos[0];
        // Handle both plain objects and Google Maps Photo objects
        if (typeof firstPhoto === 'object') {
          if (firstPhoto.photo_reference) {
            photoReference = firstPhoto.photo_reference;
          } else if (typeof firstPhoto.getUrl === 'function') {
            // Google Maps Photo object - extract URL instead
            try {
              photoReference = firstPhoto.getUrl({ maxWidth: 400 });
            } catch (e) {
              console.warn('⚠️ Could not extract photo URL from Google Maps Photo object');
            }
          }
        }
      }

      // Clean restaurant data before storing (remove Google Maps objects)
      const cleanedRestaurantData = firestoreSearchService.deepCleanForFirestore(restaurant);

      const favoriteData = {
        userId,
        restaurantId,
        restaurantName: restaurant.name || restaurant.displayName || 'Unknown Restaurant',
        restaurantAddress: restaurant.vicinity || restaurant.formatted_address || restaurant.address || 'Address not available',
        restaurantRating: restaurant.rating || 0,
        restaurantPriceLevel: restaurant.price_level || restaurant.priceLevel || null,
        restaurantTypes: restaurant.types || [],
        restaurantLocation: {
          lat: restaurant.geometry?.location?.lat || restaurant.location?.lat || restaurant.lat || 0,
          lng: restaurant.geometry?.location?.lng || restaurant.location?.lng || restaurant.lng || 0
        },
        restaurantPhoto: photoReference,
        addedAt: serverTimestamp(),
        // Store cleaned restaurant data for quick access (no Google Maps objects)
        restaurantData: cleanedRestaurantData
      };

      const docRef = await addDoc(collection(db, this.collectionName), favoriteData);
      console.log('✅ Restaurant added to favorites:', docRef.id);
      
      return { 
        success: true, 
        favoriteId: docRef.id,
        message: 'Added to favorites' 
      };
    } catch (error) {
      console.error('❌ Error adding to favorites:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Remove restaurant from favorites (soft delete)
  async removeFromFavorites(userId, restaurantId) {
    try {
      const favorite = await this.getFavoriteByPlaceId(userId, restaurantId);
      
      if (!favorite) {
        return { 
          success: false, 
          error: 'Restaurant not in favorites' 
        };
      }

      // Soft delete: Add removedAt timestamp instead of deleting
      await updateDoc(doc(db, this.collectionName, favorite.id), {
        removedAt: serverTimestamp()
      });
      
      console.log('✅ Restaurant moved to recently removed');
      
      return { 
        success: true, 
        message: 'Removed from favorites' 
      };
    } catch (error) {
      console.error('❌ Error removing from favorites:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Get all active favorites for a user (not removed)
  async getUserFavorites(userId) {
    try {
      // Simplified query to avoid index requirements
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const favorites = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out removed items in JavaScript instead of Firestore
        if (!data.removedAt) {
          favorites.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Sort by addedAt in JavaScript
      favorites.sort((a, b) => {
        const aTime = a.addedAt?.toDate?.() || new Date(0);
        const bTime = b.addedAt?.toDate?.() || new Date(0);
        return bTime - aTime; // Descending order
      });

      console.log(`✅ Retrieved ${favorites.length} active favorites for user ${userId}`);
      return { 
        success: true, 
        favorites 
      };
    } catch (error) {
      console.error('❌ Error getting user favorites:', error);
      return { 
        success: false, 
        error: error.message,
        favorites: []
      };
    }
  }

  // Get recently removed favorites for a user
  async getRecentlyRemovedFavorites(userId) {
    try {
      // Simplified query to avoid index requirements
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const removedFavorites = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter for removed items in JavaScript instead of Firestore
        if (data.removedAt) {
          removedFavorites.push({
            id: doc.id,
            ...data
          });
        }
      });

      // Sort by removedAt in JavaScript
      removedFavorites.sort((a, b) => {
        const aTime = a.removedAt?.toDate?.() || new Date(0);
        const bTime = b.removedAt?.toDate?.() || new Date(0);
        return bTime - aTime; // Descending order
      });

      console.log(`✅ Retrieved ${removedFavorites.length} recently removed favorites for user ${userId}`);
      return { 
        success: true, 
        removedFavorites 
      };
    } catch (error) {
      console.error('❌ Error getting recently removed favorites:', error);
      return { 
        success: false, 
        error: error.message,
        removedFavorites: []
      };
    }
  }

  // Restore a removed favorite
  async restoreFavorite(userId, favoriteId) {
    try {
      const favoriteRef = doc(db, this.collectionName, favoriteId);
      
      // Remove the removedAt timestamp to restore the favorite
      await updateDoc(favoriteRef, {
        removedAt: null
      });
      
      console.log('✅ Favorite restored successfully');
      
      return { 
        success: true, 
        message: 'Favorite restored' 
      };
    } catch (error) {
      console.error('❌ Error restoring favorite:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Permanently delete expired removed favorites (24+ hours old) for a specific user
  async cleanupExpiredRemovals(userId) {
    try {
      if (!userId) {
        console.log('⚠️ No user ID provided for cleanup');
        return { success: true, cleanedCount: 0 };
      }

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Simplified query to avoid index requirements
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Check if item is removed and expired in JavaScript
        if (data.removedAt) {
          const removedTime = data.removedAt?.toDate?.() || new Date(data.removedAt);
          if (removedTime < twentyFourHoursAgo) {
            deletePromises.push(deleteDoc(doc.ref));
          }
        }
      });

      await Promise.all(deletePromises);
      
      console.log(`✅ Cleaned up ${deletePromises.length} expired removed favorites for user ${userId}`);
      
      return { 
        success: true, 
        cleanedCount: deletePromises.length 
      };
    } catch (error) {
      console.error('❌ Error cleaning up expired removals:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Check if restaurant is favorited
  async getFavoriteByPlaceId(userId, placeId) {
    try {
      // Validate inputs
      if (!userId || !placeId) {
        console.error('❌ User ID and Place ID are required');
        return null;
      }

      // Try both restaurantId and eateryId fields
      const q1 = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('restaurantId', '==', placeId)
      );

      const q2 = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('eateryId', '==', placeId)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      const allDocs = [...snapshot1.docs, ...snapshot2.docs];
      
      // Remove duplicates (in case both queries return the same doc)
      const uniqueDocs = allDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      );
      
      if (uniqueDocs.length === 0) {
        return null;
      }

      // Filter out soft-deleted items first
      const activeDocs = uniqueDocs.filter(doc => {
        const data = doc.data();
        return !data.removedAt; // Only include non-soft-deleted items
      });
      
      // If multiple active matches found, log warning and prefer the most recent one
      if (activeDocs.length > 1) {
        console.warn(`⚠️ Multiple active favorites found for placeId "${placeId}":`, activeDocs.map(d => d.id));
        // Sort by addedAt (most recent first) and return the first one
        activeDocs.sort((a, b) => {
          const aTime = a.data().addedAt?.toDate?.() || new Date(a.data().addedAt || 0);
          const bTime = b.data().addedAt?.toDate?.() || new Date(b.data().addedAt || 0);
          return bTime - aTime; // Most recent first
        });
      }
      
      // If no active favorites, return null (all are soft-deleted)
      if (activeDocs.length === 0) {
        return null;
      }

      const doc = activeDocs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data
      };
    } catch (error) {
      console.error('❌ Error checking favorite status:', error);
      return null;
    }
  }

  // Toggle favorite status
  async toggleFavorite(userId, restaurant) {
    try {
      // IMPORTANT: Use the same ID extraction logic as addToFavorites
      // Prioritize place_id over id to avoid Firestore document ID conflicts
      let restaurantId = restaurant.place_id || restaurant.placeId;
      
      // Only use restaurant.id if it looks like a Google Place ID (starts with "ChIJ")
      // or if it's a temp ID (starts with "temp_")
      if (!restaurantId && restaurant.id) {
        if (restaurant.id.startsWith('ChIJ') || restaurant.id.startsWith('temp_')) {
          restaurantId = restaurant.id;
        } else {
          console.warn('⚠️ Ignoring Firestore document ID in toggle, generating temp ID instead:', restaurant.id);
        }
      }
      
      // If no ID exists, generate a temporary one based on name and location
      if (!restaurantId && restaurant.name) {
        const lat = restaurant.geometry?.location?.lat || restaurant.location?.lat || restaurant.lat || 0;
        const lng = restaurant.geometry?.location?.lng || restaurant.location?.lng || restaurant.lng || 0;
        restaurantId = `temp_${restaurant.name.replace(/\s+/g, '_').toLowerCase()}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
        console.log('🔧 Generated temporary ID for toggle:', restaurantId, 'for restaurant:', restaurant.name);
      }
      
      if (!restaurantId) {
        console.error('❌ Restaurant ID is required for toggle');
        return { success: false, error: 'Restaurant ID is required' };
      }

      console.log('🔍 Checking if restaurant is favorited:', restaurantId, 'for restaurant:', restaurant.name);
      const existing = await this.getFavoriteByPlaceId(userId, restaurantId);
      
      if (existing) {
        console.log('✅ Restaurant already favorited, removing:', restaurantId);
        return await this.removeFromFavorites(userId, restaurantId);
      } else {
        console.log('➕ Restaurant not favorited, adding:', restaurantId);
        return await this.addToFavorites(userId, restaurant);
      }
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      return { 
        success: false,
        error: error.message 
      };
    }
  }
  
  // Find duplicates by name and location (within 100m)
  async findDuplicatesByNameAndLocation(userId, restaurantName, lat, lng) {
    try {
      if (!userId || !restaurantName) {
        return [];
      }

      // Query all favorites for this user
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const duplicates = [];
      const nameLower = restaurantName.toLowerCase().trim();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const storedName = (data.restaurantName || '').toLowerCase().trim();
        
        // Check if name matches (fuzzy match - contains or is contained)
        if (storedName === nameLower || storedName.includes(nameLower) || nameLower.includes(storedName)) {
          // Check if location is within 100m (approximately 0.001 degrees)
          if (data.restaurantLocation) {
            const storedLat = data.restaurantLocation.lat || 0;
            const storedLng = data.restaurantLocation.lng || 0;
            const latDiff = Math.abs(storedLat - lat);
            const lngDiff = Math.abs(storedLng - lng);
            
            // Rough check: 0.001 degrees ≈ 111m
            if (latDiff < 0.001 && lngDiff < 0.001) {
              duplicates.push({
                id: doc.id,
                ...data
              });
            }
          }
        }
      });

      return duplicates;
    } catch (error) {
      console.error('❌ Error finding duplicates:', error);
      return [];
    }
  }

  // Get favorite count for a restaurant
  async getFavoriteCount(restaurantId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('restaurantId', '==', restaurantId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('❌ Error getting favorite count:', error);
      return 0;
    }
  }

  // Clean up duplicate favorites for a user
  // Keeps the most recent favorite for each restaurantId, removes older duplicates
  async cleanupDuplicateFavorites(userId) {
    try {
      if (!userId) {
        console.error('❌ User ID is required');
        return { success: false, error: 'User ID is required' };
      }

      console.log('🧹 Starting duplicate favorites cleanup for user:', userId);

      // Get all favorites for this user
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const favoritesByRestaurantId = new Map();

      // Group favorites by restaurantId
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const restaurantId = data.restaurantId || data.eateryId;
        
        if (!restaurantId) {
          console.warn('⚠️ Favorite document without restaurantId:', doc.id);
          return;
        }

        if (!favoritesByRestaurantId.has(restaurantId)) {
          favoritesByRestaurantId.set(restaurantId, []);
        }

        favoritesByRestaurantId.get(restaurantId).push({
          docId: doc.id,
          data: data,
          addedAt: data.addedAt?.toDate?.() || new Date(data.addedAt || 0)
        });
      });

      let totalRemoved = 0;
      const deletePromises = [];

      // For each restaurantId with duplicates, keep the most recent, delete others
      favoritesByRestaurantId.forEach((favorites, restaurantId) => {
        if (favorites.length > 1) {
          // Sort by addedAt (most recent first)
          favorites.sort((a, b) => b.addedAt - a.addedAt);
          
          // Keep the first one (most recent), mark others for deletion
          const toKeep = favorites[0];
          const toDelete = favorites.slice(1);

          console.log(`🔧 Found ${favorites.length} duplicates for restaurantId "${restaurantId}", keeping most recent (${toKeep.docId}), removing ${toDelete.length} older ones`);

          // Delete older duplicates
          toDelete.forEach(fav => {
            deletePromises.push(deleteDoc(doc(db, this.collectionName, fav.docId)));
            totalRemoved++;
          });
        }
      });

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        console.log(`✅ Cleaned up ${totalRemoved} duplicate favorites for user ${userId}`);
      } else {
        console.log('✅ No duplicates found for user', userId);
      }

      return {
        success: true,
        removedCount: totalRemoved
      };
    } catch (error) {
      console.error('❌ Error cleaning up duplicate favorites:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const favoritesService = new FavoritesService();
