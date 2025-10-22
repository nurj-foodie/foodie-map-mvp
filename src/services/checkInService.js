import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { gamificationService } from './gamificationService';

class CheckInService {
  constructor() {
    this.collectionName = 'checkIns';
  }

  // Add a verified check-in
  async addCheckIn(userId, restaurant, userLocation, distance) {
    try {
      const checkInData = {
        userId,
        restaurantId: restaurant.id || restaurant.place_id,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address,
        restaurantLocation: restaurant.location,
        userLocation: userLocation,
        distance: distance,
        verified: true,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, this.collectionName), checkInData);
      
      // Check if this is the user's first check-in to this restaurant
      const isFirstCheckIn = await this.isFirstCheckInToRestaurant(userId, restaurant.id || restaurant.place_id);
      
      // Award points for check-in (check if user is premium)
      const isPremium = false; // TODO: Check user's premium status
      const pointsResult = await gamificationService.awardCheckInPoints(
        userId, 
        restaurant.id || restaurant.place_id, 
        restaurant.name, 
        isFirstCheckIn,
        isPremium
      );
      
      console.log(`✅ Check-in saved: ${docRef.id}`);
      return { 
        success: true, 
        checkInId: docRef.id,
        message: `Successfully checked in to ${restaurant.name}!`,
        points: pointsResult.points || 0,
        totalPoints: pointsResult.totalPoints || 0,
        isFirstCheckIn
      };
    } catch (error) {
      console.error('❌ Error saving check-in:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Get user's check-ins
  async getUserCheckIns(userId, limitCount = 20) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const checkIns = [];

      querySnapshot.forEach((doc) => {
        checkIns.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { 
        success: true, 
        checkIns 
      };
    } catch (error) {
      console.error('❌ Error getting user check-ins:', error);
      return { 
        success: false, 
        error: error.message,
        checkIns: []
      };
    }
  }

  // Get restaurant's check-ins
  async getRestaurantCheckIns(restaurantId, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('restaurantId', '==', restaurantId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const checkIns = [];

      querySnapshot.forEach((doc) => {
        checkIns.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { 
        success: true, 
        checkIns 
      };
    } catch (error) {
      console.error('❌ Error getting restaurant check-ins:', error);
      return { 
        success: false, 
        error: error.message,
        checkIns: []
      };
    }
  }

  // Get recent check-ins for a restaurant (last 24 hours)
  async getRecentCheckIns(restaurantId, hours = 24) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);

      const q = query(
        collection(db, this.collectionName),
        where('restaurantId', '==', restaurantId),
        where('timestamp', '>=', cutoffTime),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const checkIns = [];

      querySnapshot.forEach((doc) => {
        checkIns.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { 
        success: true, 
        checkIns,
        totalCount: checkIns.length
      };
    } catch (error) {
      console.error('❌ Error getting recent check-ins:', error);
      return { 
        success: false, 
        error: error.message,
        checkIns: [],
        totalCount: 0
      };
    }
  }

  // Check if user has already checked in recently (within last 2 hours)
  async hasRecentCheckIn(userId, restaurantId) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 2);

      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('restaurantId', '==', restaurantId),
        where('timestamp', '>=', cutoffTime),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('❌ Error checking recent check-in:', error);
      return false;
    }
  }

  // Check if this is the user's first check-in to this restaurant
  async isFirstCheckInToRestaurant(userId, restaurantId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('restaurantId', '==', restaurantId),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.empty; // If no results, it's the first check-in
    } catch (error) {
      console.error('❌ Error checking first check-in:', error);
      return false;
    }
  }
}

export const checkInService = new CheckInService();
