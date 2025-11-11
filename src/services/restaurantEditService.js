import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { gamificationService } from './gamificationService';

class RestaurantEditService {
  constructor() {
    this.collectionName = 'restaurant_edits';
  }

  // Submit an edit for a restaurant
  async submitEdit(userId, restaurant, editData) {
    try {
      if (!userId || !restaurant) {
        return { 
          success: false, 
          error: 'User ID and restaurant are required' 
        };
      }

      // Get restaurant ID (support both place_id and id)
      const restaurantId = restaurant.place_id || restaurant.placeId || restaurant.id;
      
      if (!restaurantId) {
        return { 
          success: false, 
          error: 'Restaurant ID is required' 
        };
      }

      // Get current restaurant data from Firestore (if exists)
      let currentRestaurantData = null;
      try {
        // Try to get from eateries collection
        const restaurantRef = doc(db, 'eateries', restaurantId);
        const restaurantSnap = await getDoc(restaurantRef);
        if (restaurantSnap.exists()) {
          currentRestaurantData = restaurantSnap.data();
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch current restaurant data:', error);
        // Continue anyway - we'll use the restaurant prop data
        currentRestaurantData = restaurant;
      }

      // Build edit document with original + proposed changes
      const editDoc = {
        restaurantId,
        restaurantName: restaurant.name || restaurant.displayName || 'Unknown Restaurant',
        userId,
        userName: editData.userName || 'Anonymous',
        status: 'pending', // pending, approved, rejected
        originalData: currentRestaurantData || restaurant, // Store original data
        proposedChanges: {
          // Photos: Add new photos (array of base64 objects)
          photos: editData.photos || [],
          
          // Operating Hours: New periods array
          operatingHours: editData.operatingHours || null,
          
          // Name: New name if changed
          name: editData.name || null,
          
          // Business Status: Mark as closed
          businessStatus: editData.businessStatus || null,
          isActive: editData.isActive !== undefined ? editData.isActive : null,
          
          // Other fields
          address: editData.address || null,
          phone: editData.phone || null,
          website: editData.website || null,
          description: editData.description || null,
          halalStatus: editData.halalStatus || null,
          cuisineType: editData.cuisineType || null,
          priceLevel: editData.priceLevel || null
        },
        editType: editData.editType || 'general', // photos, hours, name, closed, general
        reason: editData.reason || '', // User's reason for edit
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
        reviewNotes: null
      };

      const docRef = await addDoc(collection(db, this.collectionName), editDoc);
      console.log('✅ Restaurant edit submitted:', docRef.id);

      // Award points for submitting edit (+5 XP per edit session)
      try {
        await gamificationService.awardPoints(userId, 'RESTAURANT_EDIT', {
          restaurantId,
          restaurantName: restaurant.name || restaurant.displayName,
          editId: docRef.id,
          editType: editData.editType || 'general'
        });
      } catch (pointsError) {
        console.warn('⚠️ Failed to award edit points:', pointsError);
        // Don't fail the edit submission if points fail
      }

      return { 
        success: true, 
        editId: docRef.id,
        edit: {
          id: docRef.id,
          ...editDoc,
          createdAt: new Date()
        }
      };
    } catch (error) {
      console.error('❌ Error submitting restaurant edit:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Get pending edits for a restaurant
  async getRestaurantEdits(restaurantId, status = null) {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const querySnapshot = await getDocs(q);
      const edits = [];

      querySnapshot.forEach((doc) => {
        edits.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { 
        success: true, 
        edits 
      };
    } catch (error) {
      console.error('❌ Error getting restaurant edits:', error);
      return { 
        success: false, 
        error: error.message,
        edits: []
      };
    }
  }

  // Get user's pending edits
  async getUserPendingEdits(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const edits = [];

      querySnapshot.forEach((doc) => {
        edits.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { 
        success: true, 
        edits 
      };
    } catch (error) {
      console.error('❌ Error getting user pending edits:', error);
      return { 
        success: false, 
        error: error.message,
        edits: []
      };
    }
  }

  // Get all pending edits (for admin)
  async getAllPendingEdits(limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const edits = [];

      querySnapshot.forEach((doc) => {
        edits.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { 
        success: true, 
        edits 
      };
    } catch (error) {
      console.error('❌ Error getting all pending edits:', error);
      return { 
        success: false, 
        error: error.message,
        edits: []
      };
    }
  }
}

export const restaurantEditService = new RestaurantEditService();

