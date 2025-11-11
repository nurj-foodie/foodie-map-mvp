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

class ReviewsService {
  constructor() {
    this.collectionName = 'reviews';
  }

  // Get reviews for a specific restaurant/eatery
  async getRestaurantReviews(restaurantId, limitCount = 20) {
    try {
      console.log('🔍 Fetching reviews for restaurant:', restaurantId);
      
      const reviewsRef = collection(db, this.collectionName);
      const q = query(
        reviewsRef,
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        });
      });
      
      console.log(`✅ Fetched ${reviews.length} reviews for restaurant ${restaurantId}`);
      return { 
        success: true, 
        reviews 
      };
    } catch (error) {
      console.error('❌ Error fetching restaurant reviews:', error);
      return { 
        success: false, 
        error: error.message,
        reviews: []
      };
    }
  }

  // Get reviews written by a specific user
  async getUserReviews(userId, limitCount = 20) {
    try {
      console.log('🔍 Fetching reviews for user:', userId);
      
      const reviewsRef = collection(db, this.collectionName);
      const q = query(
        reviewsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        });
      });
      
      console.log(`✅ Fetched ${reviews.length} reviews for user ${userId}`);
      return { 
        success: true, 
        reviews 
      };
    } catch (error) {
      console.error('❌ Error fetching user reviews:', error);
      return { 
        success: false, 
        error: error.message,
        reviews: []
      };
    }
  }

  // Submit a new review
  async submitReview(userId, restaurant, reviewData) {
    try {
      if (!userId || !restaurant) {
        return { 
          success: false, 
          error: 'User ID and restaurant are required' 
        };
      }

      if (!reviewData.comment || !reviewData.comment.trim()) {
        return { 
          success: false, 
          error: 'Review comment is required' 
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

      // Check if user already reviewed this restaurant
      const existingReviews = await this.getUserReviews(userId, 1000);
      const hasExistingReview = existingReviews.reviews.some(
        review => (review.restaurantId === restaurantId || review.eateryId === restaurantId)
      );

      if (hasExistingReview) {
        return { 
          success: false, 
          error: 'You have already reviewed this restaurant' 
        };
      }

      const reviewDoc = {
        restaurantId,
        restaurantName: restaurant.name || restaurant.displayName || 'Unknown Restaurant',
        restaurantAddress: restaurant.address || restaurant.formatted_address || '',
        userId,
        userName: reviewData.userName || 'Anonymous',
        userPhotoURL: reviewData.userPhotoURL || null,
        rating: reviewData.rating || 5,
        comment: reviewData.comment.trim(),
        photos: reviewData.photos || [],
        verified: false, // Can be verified later via check-in
        helpful: 0,
        likes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), reviewDoc);
      console.log('✅ Review submitted:', docRef.id);

      // Award points for writing a review
      try {
        await gamificationService.awardPoints(userId, 'REVIEW', {
          restaurantId,
          restaurantName: restaurant.name || restaurant.displayName,
          reviewId: docRef.id,
          rating: reviewDoc.rating
        });
      } catch (pointsError) {
        console.warn('⚠️ Failed to award review points:', pointsError);
        // Don't fail the review submission if points fail
      }

      return { 
        success: true, 
        reviewId: docRef.id,
        review: {
          id: docRef.id,
          ...reviewDoc,
          createdAt: new Date()
        }
      };
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Get review statistics for a restaurant
  async getRestaurantReviewStats(restaurantId) {
    try {
      const result = await this.getRestaurantReviews(restaurantId, 1000);
      const reviews = result.reviews || [];

      if (reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
      const averageRating = totalRating / reviews.length;

      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        const rating = Math.round(review.rating || 0);
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating]++;
        }
      });

      return {
        totalReviews: reviews.length,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratingDistribution
      };
    } catch (error) {
      console.error('❌ Error calculating review stats:', error);
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  }
}

export const reviewsService = new ReviewsService();

