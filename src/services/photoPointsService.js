import { gamificationService } from './gamificationService';

class PhotoPointsService {
  constructor() {
    this.photoTypes = {
      FIRST: 'first',
      ADDITIONAL: 'additional',
      WITH_REVIEW: 'with_review',
      WITH_CHECKIN: 'with_checkin',
      HIGH_QUALITY: 'high_quality',
      LOCATION_TAGGED: 'location_tagged'
    };
  }

  // Award points for photo upload
  async awardPhotoPoints(userId, restaurantId, restaurantName, photoType = 'first', isPremium = false) {
    try {
      const result = await gamificationService.awardPhotoPoints(
        userId,
        restaurantId,
        restaurantName,
        photoType,
        isPremium
      );

      if (result.success) {
        console.log(`✅ Photo points awarded: ${result.points} points for ${photoType} photo`);
        
        // Check for achievements
        if (result.achievements && result.achievements.length > 0) {
          console.log(`🏆 Achievements unlocked: ${result.achievements.length} achievements`);
        }
        
        // Check for level up
        if (result.levelUp) {
          console.log(`📈 Level up: Level ${result.levelUp.newLevel} reached!`);
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Error awarding photo points:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Determine photo type based on context
  determinePhotoType(restaurantId, userId, hasReview = false, hasCheckIn = false, isHighQuality = false, hasLocationTag = false) {
    if (hasReview) return this.photoTypes.WITH_REVIEW;
    if (hasCheckIn) return this.photoTypes.WITH_CHECKIN;
    if (isHighQuality) return this.photoTypes.HIGH_QUALITY;
    if (hasLocationTag) return this.photoTypes.LOCATION_TAGGED;
    
    // Check if this is the first photo for this restaurant by this user
    // This would need to be implemented with a database check
    return this.photoTypes.FIRST; // Default to first for now
  }

  // Award points for restaurant photo upload
  async awardRestaurantPhotoPoints(userId, restaurant, photoData = {}) {
    try {
      const restaurantId = restaurant.id || restaurant.place_id;
      const restaurantName = restaurant.name || restaurant.displayName || 'Unknown Restaurant';
      
      // Determine photo type based on context
      const photoType = this.determinePhotoType(
        restaurantId,
        userId,
        photoData.hasReview || false,
        photoData.hasCheckIn || false,
        photoData.isHighQuality || false,
        photoData.hasLocationTag || false
      );

      // Check if user is premium (TODO: implement premium check)
      const isPremium = false;

      return await this.awardPhotoPoints(userId, restaurantId, restaurantName, photoType, isPremium);
    } catch (error) {
      console.error('❌ Error awarding restaurant photo points:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Award points for review photo
  async awardReviewPhotoPoints(userId, restaurant, reviewData = {}) {
    try {
      const restaurantId = restaurant.id || restaurant.place_id;
      const restaurantName = restaurant.name || restaurant.displayName || 'Unknown Restaurant';
      
      return await this.awardPhotoPoints(
        userId,
        restaurantId,
        restaurantName,
        this.photoTypes.WITH_REVIEW,
        false // TODO: check premium status
      );
    } catch (error) {
      console.error('❌ Error awarding review photo points:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Award points for check-in photo
  async awardCheckInPhotoPoints(userId, restaurant, checkInData = {}) {
    try {
      const restaurantId = restaurant.id || restaurant.place_id;
      const restaurantName = restaurant.name || restaurant.displayName || 'Unknown Restaurant';
      
      return await this.awardPhotoPoints(
        userId,
        restaurantId,
        restaurantName,
        this.photoTypes.WITH_CHECKIN,
        false // TODO: check premium status
      );
    } catch (error) {
      console.error('❌ Error awarding check-in photo points:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const photoPointsService = new PhotoPointsService();
