import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

class FavoritesService {
  constructor() {
    this.collectionName = 'favorites';
  }

  // Add restaurant to favorites
  async addToFavorites(userId, restaurant) {
    try {
      // Validate restaurant data and generate ID if needed
      let restaurantId = restaurant.place_id || restaurant.id;
      
      // If no ID exists, generate a temporary one based on name and location
      if (!restaurantId && restaurant.name) {
        const lat = restaurant.geometry?.location?.lat || restaurant.lat || 0;
        const lng = restaurant.geometry?.location?.lng || restaurant.lng || 0;
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

      // Check if already favorited
      const existing = await this.getFavoriteByPlaceId(userId, restaurantId);
      if (existing) {
        console.log('✅ Restaurant already in favorites');
        return { success: true, message: 'Already in favorites' };
      }

      const favoriteData = {
        userId,
        restaurantId,
        restaurantName: restaurant.name || 'Unknown Restaurant',
        restaurantAddress: restaurant.vicinity || restaurant.formatted_address || 'Address not available',
        restaurantRating: restaurant.rating || 0,
        restaurantPriceLevel: restaurant.price_level || null,
        restaurantTypes: restaurant.types || [],
        restaurantLocation: {
          lat: restaurant.geometry?.location?.lat || restaurant.lat || 0,
          lng: restaurant.geometry?.location?.lng || restaurant.lng || 0
        },
        restaurantPhoto: restaurant.photos?.[0]?.photo_reference || null,
        addedAt: serverTimestamp(),
        // Store full restaurant data for quick access
        restaurantData: restaurant
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
      
      if (allDocs.length === 0) {
        return null;
      }

      const doc = allDocs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('❌ Error checking favorite status:', error);
      return null;
    }
  }

  // Toggle favorite status
  async toggleFavorite(userId, restaurant) {
    try {
      let restaurantId = restaurant.place_id || restaurant.id;
      
      // If no ID exists, generate a temporary one based on name and location
      if (!restaurantId && restaurant.name) {
        const lat = restaurant.geometry?.location?.lat || restaurant.lat || 0;
        const lng = restaurant.geometry?.location?.lng || restaurant.lng || 0;
        restaurantId = `temp_${restaurant.name.replace(/\s+/g, '_').toLowerCase()}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
        console.log('🔧 Generated temporary ID for toggle:', restaurantId);
      }
      
      if (!restaurantId) {
        console.error('❌ Restaurant ID is required for toggle');
        return { success: false, error: 'Restaurant ID is required' };
      }

      const existing = await this.getFavoriteByPlaceId(userId, restaurantId);
      
      if (existing) {
        return await this.removeFromFavorites(userId, restaurantId);
      } else {
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
}

export const favoritesService = new FavoritesService();
