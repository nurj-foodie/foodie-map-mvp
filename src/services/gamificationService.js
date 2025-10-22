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
  updateDoc,
  increment,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { notificationService } from './notificationService';
import { achievementService } from './achievementService';
import { challengeService } from './challengeService';
import { streakService } from './streakService';

class GamificationService {
  constructor() {
    this.collectionName = 'userPoints';
    this.achievementsCollection = 'achievements';
    this.leaderboardCollection = 'leaderboard';
    this.streaksCollection = 'userStreaks';
    this.challengesCollection = 'userChallenges';
    this.notificationsCollection = 'userNotifications';
    
    // Enhanced point system
    this.POINTS = {
      // Check-in points
      CHECK_IN: 10,
      FIRST_CHECK_IN_BONUS: 25,
      CHECK_IN_STREAK: 5, // per consecutive day, max 50
      
      // Review points
      REVIEW: 15,
      REVIEW_WITH_PHOTO: 25, // 15 + 10 bonus
      REVIEW_DETAILED: 25, // 15 + 10 bonus for 100+ words
      REVIEW_HELPFUL: 20, // 15 + 5 bonus
      
      // Photo points
      PHOTO_FIRST: 25,
      PHOTO_ADDITIONAL: 10,
      PHOTO_WITH_REVIEW: 40, // 25 + 15 bonus
      PHOTO_WITH_CHECKIN: 45, // 25 + 20 bonus
      PHOTO_HIGH_QUALITY: 30, // 25 + 5 bonus
      PHOTO_LOCATION_TAGGED: 35, // 25 + 10 bonus
      
      // Favorites points
      FAVORITE: 3,
      FAVORITE_STREAK: 1, // per consecutive day, max 10
      
      // Route planning points
      ROUTE_PLAN: 5,
      ROUTE_WITH_RESTAURANTS: 15, // 5 + 10 bonus
      ROUTE_SHARE: 10, // 5 + 5 bonus
      
      // Social points
      SHARE_RESTAURANT: 5,
      SHARE_ROUTE: 10,
      SHARE_ACHIEVEMENT: 15,
      
      // Video points (future)
      VIDEO_FIRST: 100,
      VIDEO_ADDITIONAL: 50,
      VIDEO_WITH_REVIEW: 175, // 100 + 75 bonus
      VIDEO_WITH_CHECKIN: 200, // 100 + 100 bonus
      VIDEO_HIGH_QUALITY: 125, // 100 + 25 bonus
      VIDEO_LOCATION_TAGGED: 150, // 100 + 50 bonus
      
      // Streak freeze
      STREAK_FREEZE_COST: 50,
      
      // Premium multiplier
      PREMIUM_MULTIPLIER: 5
    };
    
    // Level thresholds
    this.LEVEL_THRESHOLDS = {
      BRONZE: 10,
      SILVER: 25,
      GOLD: 50,
      PLATINUM: 100,
      LEGENDARY: 200
    };
    
    // Badge tiers
    this.BADGE_TIERS = {
      BRONZE: { level: 10, emoji: '🥉', name: 'Bronze', color: '#CD7F32' },
      SILVER: { level: 25, emoji: '🥈', name: 'Silver', color: '#C0C0C0' },
      GOLD: { level: 50, emoji: '🥇', name: 'Gold', color: '#FFD700' },
      PLATINUM: { level: 100, emoji: '💎', name: 'Platinum', color: '#E5E4E2' },
      LEGENDARY: { level: 200, emoji: '👑', name: 'Legendary', color: '#B8860B' }
    };
    
    // Achievement definitions
    this.ACHIEVEMENTS = {
      // Daily achievements
      DAILY_CHECK_IN: { id: 'daily_check_in', points: 10, type: 'daily', title: 'Daily Check-in', description: 'Check into any restaurant' },
      DAILY_EXPLORER: { id: 'daily_explorer', points: 35, type: 'daily', title: 'Daily Explorer', description: 'Check into a new restaurant' },
      DAILY_FAVORITES: { id: 'daily_favorites', points: 3, type: 'daily', title: 'Daily Favorites', description: 'Add 1 restaurant to favorites' },
      DAILY_REVIEWER: { id: 'daily_reviewer', points: 15, type: 'daily', title: 'Daily Reviewer', description: 'Write 1 review' },
      DAILY_NAVIGATOR: { id: 'daily_navigator', points: 5, type: 'daily', title: 'Daily Navigator', description: 'Plan 1 route' },
      
      // Weekly achievements
      WEEKLY_STREAK: { id: 'weekly_streak', points: 100, type: 'weekly', title: 'Weekly Streak', description: 'Check in 3 days in a row' },
      WEEKLY_EXPLORER: { id: 'weekly_explorer', points: 200, type: 'weekly', title: 'Weekly Explorer', description: 'Check into 5 different restaurants' },
      WEEKLY_LOCAL: { id: 'weekly_local', points: 150, type: 'weekly', title: 'Weekly Local', description: 'Check into 3 restaurants in the same city' },
      WEEKLY_REVIEWER: { id: 'weekly_reviewer', points: 100, type: 'weekly', title: 'Weekly Reviewer', description: 'Write 3 reviews' },
      WEEKLY_COLLECTOR: { id: 'weekly_collector', points: 50, type: 'weekly', title: 'Weekly Collector', description: 'Add 5 restaurants to favorites' },
      WEEKLY_PLANNER: { id: 'weekly_planner', points: 75, type: 'weekly', title: 'Weekly Planner', description: 'Plan 3 routes' },
      
      // Monthly achievements
      MONTHLY_CHAMPION: { id: 'monthly_champion', points: 500, type: 'monthly', title: 'Monthly Champion', description: 'Check into 20 different restaurants' },
      MONTHLY_STREAK: { id: 'monthly_streak', points: 300, type: 'monthly', title: 'Monthly Streak', description: 'Maintain a 7-day streak' },
      MONTHLY_EXPERT: { id: 'monthly_expert', points: 400, type: 'monthly', title: 'Monthly Expert', description: 'Check into 10 restaurants in the same city' },
      MONTHLY_REVIEWER: { id: 'monthly_reviewer', points: 300, type: 'monthly', title: 'Monthly Reviewer', description: 'Write 10 reviews' },
      MONTHLY_COLLECTOR: { id: 'monthly_collector', points: 200, type: 'monthly', title: 'Monthly Collector', description: 'Add 25 restaurants to favorites' },
      MONTHLY_NAVIGATOR: { id: 'monthly_navigator', points: 150, type: 'monthly', title: 'Monthly Navigator', description: 'Plan 10 routes' },
      DISTANCE_MASTER: { id: 'distance_master', points: 250, type: 'monthly', title: 'Distance Master', description: 'Check in to restaurants 5km+ away' },
      
      // Lifetime achievements
      FIRST_CHECK_IN: { id: 'first_check_in', points: 50, type: 'lifetime', title: 'First Check-in', description: 'Check into your first restaurant' },
      FOOD_EXPLORER_50: { id: 'food_explorer_50', points: 1000, type: 'lifetime', title: 'Food Explorer', description: 'Check into 50 different restaurants' },
      FOOD_EXPLORER_100: { id: 'food_explorer_100', points: 2500, type: 'lifetime', title: 'Food Explorer', description: 'Check into 100 different restaurants' },
      FOOD_EXPLORER_250: { id: 'food_explorer_250', points: 5000, type: 'lifetime', title: 'Food Explorer', description: 'Check into 250 different restaurants' },
      FOOD_EXPLORER_500: { id: 'food_explorer_500', points: 10000, type: 'lifetime', title: 'Food Explorer', description: 'Check into 500 different restaurants' },
      STREAK_MASTER_30: { id: 'streak_master_30', points: 2000, type: 'lifetime', title: 'Streak Master', description: 'Achieve 30-day streak' },
      STREAK_MASTER_60: { id: 'streak_master_60', points: 5000, type: 'lifetime', title: 'Streak Master', description: 'Achieve 60-day streak' },
      STREAK_MASTER_100: { id: 'streak_master_100', points: 10000, type: 'lifetime', title: 'Streak Master', description: 'Achieve 100-day streak' },
      STREAK_MASTER_365: { id: 'streak_master_365', points: 25000, type: 'lifetime', title: 'Streak Master', description: 'Achieve 365-day streak' },
      LOCAL_LEGEND: { id: 'local_legend', points: 2000, type: 'lifetime', title: 'Local Legend', description: 'Check into 50 restaurants in the same city' },
      REVIEW_MASTER_50: { id: 'review_master_50', points: 1000, type: 'lifetime', title: 'Review Master', description: 'Write 50 reviews' },
      REVIEW_MASTER_100: { id: 'review_master_100', points: 2500, type: 'lifetime', title: 'Review Master', description: 'Write 100 reviews' },
      REVIEW_MASTER_250: { id: 'review_master_250', points: 5000, type: 'lifetime', title: 'Review Master', description: 'Write 250 reviews' },
      FAVORITES_KING_100: { id: 'favorites_king_100', points: 500, type: 'lifetime', title: 'Favorites King', description: 'Add 100 restaurants to favorites' },
      FAVORITES_KING_250: { id: 'favorites_king_250', points: 1000, type: 'lifetime', title: 'Favorites King', description: 'Add 250 restaurants to favorites' },
      FAVORITES_KING_500: { id: 'favorites_king_500', points: 2000, type: 'lifetime', title: 'Favorites King', description: 'Add 500 restaurants to favorites' },
      ROUTE_MASTER_50: { id: 'route_master_50', points: 500, type: 'lifetime', title: 'Route Master', description: 'Plan 50 routes' },
      ROUTE_MASTER_100: { id: 'route_master_100', points: 1000, type: 'lifetime', title: 'Route Master', description: 'Plan 100 routes' },
      ROUTE_MASTER_250: { id: 'route_master_250', points: 2000, type: 'lifetime', title: 'Route Master', description: 'Plan 250 routes' },
      DISTANCE_CHAMPION_10: { id: 'distance_champion_10', points: 1000, type: 'lifetime', title: 'Distance Champion', description: 'Check in to restaurants 10km+ away' },
      DISTANCE_CHAMPION_25: { id: 'distance_champion_25', points: 2500, type: 'lifetime', title: 'Distance Champion', description: 'Check in to restaurants 25km+ away' },
      DISTANCE_CHAMPION_50: { id: 'distance_champion_50', points: 5000, type: 'lifetime', title: 'Distance Champion', description: 'Check in to restaurants 50km+ away' }
    };
  }

  // Calculate user level based on points (square root formula)
  calculateLevel(totalPoints, isPremium = false) {
    const adjustedPoints = isPremium ? totalPoints * this.POINTS.PREMIUM_MULTIPLIER : totalPoints;
    return Math.floor(Math.sqrt(adjustedPoints / 100)) + 1;
  }

  // Get badge tier based on level
  getBadgeTier(level) {
    if (level >= this.LEVEL_THRESHOLDS.LEGENDARY) return this.BADGE_TIERS.LEGENDARY;
    if (level >= this.LEVEL_THRESHOLDS.PLATINUM) return this.BADGE_TIERS.PLATINUM;
    if (level >= this.LEVEL_THRESHOLDS.GOLD) return this.BADGE_TIERS.GOLD;
    if (level >= this.LEVEL_THRESHOLDS.SILVER) return this.BADGE_TIERS.SILVER;
    if (level >= this.LEVEL_THRESHOLDS.BRONZE) return this.BADGE_TIERS.BRONZE;
    return { level: 0, emoji: '🌟', name: 'Rookie', color: '#87CEEB' };
  }

  // Get points needed for next level
  getNextLevelPoints(totalPoints, isPremium = false) {
    const currentLevel = this.calculateLevel(totalPoints, isPremium);
    const nextLevel = currentLevel + 1;
    const nextLevelPoints = Math.pow(nextLevel - 1, 2) * 100;
    return nextLevelPoints;
  }

  // Get progress to next level
  getLevelProgress(totalPoints, isPremium = false) {
    const currentLevel = this.calculateLevel(totalPoints, isPremium);
    const currentLevelPoints = Math.pow(currentLevel - 1, 2) * 100;
    const nextLevelPoints = this.getNextLevelPoints(totalPoints, isPremium);
    const progress = ((totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  // Award points for check-in
  async awardCheckInPoints(userId, restaurantId, restaurantName, isFirstCheckIn = false, isPremium = false) {
    try {
      let points = isFirstCheckIn ? this.POINTS.FIRST_CHECK_IN_BONUS : this.POINTS.CHECK_IN;
      
      // Apply premium multiplier
      if (isPremium) {
        points *= this.POINTS.PREMIUM_MULTIPLIER;
      }
      
      const pointData = {
        userId,
        action: 'checkIn',
        points,
        restaurantId,
        restaurantName,
        timestamp: serverTimestamp(),
        verified: true,
        isPremium,
        metadata: {
          isFirstCheckIn,
          actionType: 'location_verified'
        }
      };

      // Add point record
      const docRef = await addDoc(collection(db, this.collectionName), pointData);
      
      // Update user's total points
      await this.updateUserTotalPoints(userId, points);
      
      // Update streak
      await streakService.updateStreak(userId, 'checkIn', {
        restaurantId,
        restaurantName,
        isFirstCheckIn
      });
      
      // Update challenge progress
      await challengeService.updateChallengeProgress(userId, 'checkIn', {
        isFirstCheckIn,
        restaurantId,
        restaurantName
      });
      
      // Check for achievements
      const achievements = await this.checkAchievements(userId, isPremium);
      
      // Check for level up
      const levelUp = await this.checkLevelUp(userId, isPremium);
      
      console.log(`✅ Awarded ${points} points to user ${userId} for check-in`);
      return { 
        success: true, 
        points, 
        totalPoints: await this.getUserTotalPoints(userId),
        pointId: docRef.id,
        achievements,
        levelUp
      };
    } catch (error) {
      console.error('❌ Error awarding check-in points:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Award points for photo upload
  async awardPhotoPoints(userId, restaurantId, restaurantName, photoType = 'first', isPremium = false) {
    try {
      let points = 0;
      
      switch (photoType) {
        case 'first':
          points = this.POINTS.PHOTO_FIRST;
          break;
        case 'additional':
          points = this.POINTS.PHOTO_ADDITIONAL;
          break;
        case 'with_review':
          points = this.POINTS.PHOTO_WITH_REVIEW;
          break;
        case 'with_checkin':
          points = this.POINTS.PHOTO_WITH_CHECKIN;
          break;
        case 'high_quality':
          points = this.POINTS.PHOTO_HIGH_QUALITY;
          break;
        case 'location_tagged':
          points = this.POINTS.PHOTO_LOCATION_TAGGED;
          break;
        default:
          points = this.POINTS.PHOTO_FIRST;
      }
      
      // Apply premium multiplier
      if (isPremium) {
        points *= this.POINTS.PREMIUM_MULTIPLIER;
      }
      
      const pointData = {
        userId,
        action: 'photo',
        points,
        restaurantId,
        restaurantName,
        timestamp: serverTimestamp(),
        verified: true,
        isPremium,
        metadata: {
          photoType,
          actionType: 'photo_upload'
        }
      };

      // Add point record
      const docRef = await addDoc(collection(db, this.collectionName), pointData);
      
      // Update user's total points
      await this.updateUserTotalPoints(userId, points);
      
      // Update challenge progress
      await challengeService.updateChallengeProgress(userId, 'photo', {
        photoType,
        restaurantId,
        restaurantName
      });
      
      // Check for achievements
      const achievements = await this.checkAchievements(userId, isPremium);
      
      // Check for level up
      const levelUp = await this.checkLevelUp(userId, isPremium);
      
      console.log(`✅ Awarded ${points} points to user ${userId} for photo upload`);
      return { 
        success: true, 
        points, 
        totalPoints: await this.getUserTotalPoints(userId),
        pointId: docRef.id,
        achievements,
        levelUp
      };
    } catch (error) {
      console.error('❌ Error awarding photo points:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Award points for other actions
  async awardPoints(userId, action, metadata = {}, isPremium = false) {
    try {
      const points = this.POINTS[action.toUpperCase()] || 0;
      
      if (points === 0) {
        console.warn(`⚠️ No point value defined for action: ${action}`);
        return { success: false, error: 'Invalid action' };
      }

      const adjustedPoints = isPremium ? points * this.POINTS.PREMIUM_MULTIPLIER : points;

      const pointData = {
        userId,
        action,
        points: adjustedPoints,
        timestamp: serverTimestamp(),
        verified: true,
        isPremium,
        metadata
      };

      // Add point record
      const docRef = await addDoc(collection(db, this.collectionName), pointData);
      
      // Update user's total points
      await this.updateUserTotalPoints(userId, adjustedPoints);
      
      // Update challenge progress
      await challengeService.updateChallengeProgress(userId, action, metadata);
      
      // Check for achievements
      const achievements = await this.checkAchievements(userId, isPremium);
      
      // Check for level up
      const levelUp = await this.checkLevelUp(userId, isPremium);
      
      console.log(`✅ Awarded ${adjustedPoints} points to user ${userId} for ${action}`);
      return { 
        success: true, 
        points: adjustedPoints, 
        totalPoints: await this.getUserTotalPoints(userId),
        pointId: docRef.id,
        achievements,
        levelUp
      };
    } catch (error) {
      console.error('❌ Error awarding points:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Update user's total points (for leaderboard)
  async updateUserTotalPoints(userId, pointsToAdd) {
    try {
      const userPointsRef = doc(db, 'userPoints', userId);
      
      await updateDoc(userPointsRef, {
        totalPoints: increment(pointsToAdd),
        lastUpdated: serverTimestamp()
      }).catch(async () => {
        // If document doesn't exist, create it
        await setDoc(userPointsRef, {
          userId,
          totalPoints: pointsToAdd,
          lastUpdated: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('❌ Error updating user total points:', error);
    }
  }

  // Get user's total points
  async getUserTotalPoints(userId) {
    try {
      const userPointsRef = doc(db, 'userPoints', userId);
      const docSnap = await getDoc(userPointsRef);
      
      if (docSnap.exists()) {
        return docSnap.data().totalPoints || 0;
      }
      return 0;
    } catch (error) {
      console.error('❌ Error getting user total points:', error);
      return 0;
    }
  }

  // Get user's point history
  async getUserPointHistory(userId, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const points = [];

      querySnapshot.forEach((doc) => {
        points.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { 
        success: true, 
        points 
      };
    } catch (error) {
      console.error('❌ Error getting user point history:', error);
      return { 
        success: false, 
        error: error.message,
        points: []
      };
    }
  }

  // Get leaderboard
  async getLeaderboard(limitCount = 100) {
    try {
      const q = query(
        collection(db, 'userPoints'),
        orderBy('totalPoints', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const leaderboard = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leaderboard.push({
          id: doc.id,
          ...data,
          level: this.calculateLevel(data.totalPoints || 0),
          badgeTier: this.getBadgeTier(this.calculateLevel(data.totalPoints || 0))
        });
      });

      return { 
        success: true, 
        leaderboard 
      };
    } catch (error) {
      console.error('❌ Error getting leaderboard:', error);
      return { 
        success: false, 
        error: error.message,
        leaderboard: []
      };
    }
  }

  // Check for achievements
  async checkAchievements(userId, isPremium = false) {
    try {
      const totalPoints = await this.getUserTotalPoints(userId);
      const checkIns = await this.getUserCheckInCount(userId);
      const reviews = await this.getUserReviewCount(userId);
      const favorites = await this.getUserFavoritesCount(userId);
      const routes = await this.getUserRoutesCount(userId);
      
      const achievements = [];
      const currentLevel = this.calculateLevel(totalPoints, isPremium);
      const badgeTier = this.getBadgeTier(currentLevel);

      // Check for level-based achievements
      if (currentLevel >= this.LEVEL_THRESHOLDS.BRONZE && currentLevel < this.LEVEL_THRESHOLDS.SILVER) {
        achievements.push({
          id: 'bronze_badge',
          type: 'badge',
          title: 'Bronze Badge',
          description: `Reached Level ${this.LEVEL_THRESHOLDS.BRONZE}`,
          badge: this.BADGE_TIERS.BRONZE,
          points: 100
        });
      }

      if (currentLevel >= this.LEVEL_THRESHOLDS.SILVER && currentLevel < this.LEVEL_THRESHOLDS.GOLD) {
        achievements.push({
          id: 'silver_badge',
          type: 'badge',
          title: 'Silver Badge',
          description: `Reached Level ${this.LEVEL_THRESHOLDS.SILVER}`,
          badge: this.BADGE_TIERS.SILVER,
          points: 250
        });
      }

      if (currentLevel >= this.LEVEL_THRESHOLDS.GOLD && currentLevel < this.LEVEL_THRESHOLDS.PLATINUM) {
        achievements.push({
          id: 'gold_badge',
          type: 'badge',
          title: 'Gold Badge',
          description: `Reached Level ${this.LEVEL_THRESHOLDS.GOLD}`,
          badge: this.BADGE_TIERS.GOLD,
          points: 500
        });
      }

      if (currentLevel >= this.LEVEL_THRESHOLDS.PLATINUM && currentLevel < this.LEVEL_THRESHOLDS.LEGENDARY) {
        achievements.push({
          id: 'platinum_badge',
          type: 'badge',
          title: 'Platinum Badge',
          description: `Reached Level ${this.LEVEL_THRESHOLDS.PLATINUM}`,
          badge: this.BADGE_TIERS.PLATINUM,
          points: 1000
        });
      }

      if (currentLevel >= this.LEVEL_THRESHOLDS.LEGENDARY) {
        achievements.push({
          id: 'legendary_badge',
          type: 'badge',
          title: 'Legendary Badge',
          description: `Reached Level ${this.LEVEL_THRESHOLDS.LEGENDARY}`,
          badge: this.BADGE_TIERS.LEGENDARY,
          points: 2500
        });
      }

      // Check for check-in achievements
      if (checkIns >= 1) {
        achievements.push({
          id: 'first_check_in',
          type: 'lifetime',
          title: 'First Check-in',
          description: 'Check into your first restaurant',
          points: 50
        });
      }

      if (checkIns >= 50) {
        achievements.push({
          id: 'food_explorer_50',
          type: 'lifetime',
          title: 'Food Explorer',
          description: 'Check into 50 different restaurants',
          points: 1000
        });
      }

      if (checkIns >= 100) {
        achievements.push({
          id: 'food_explorer_100',
          type: 'lifetime',
          title: 'Food Explorer',
          description: 'Check into 100 different restaurants',
          points: 2500
        });
      }

      // Check for review achievements
      if (reviews >= 50) {
        achievements.push({
          id: 'review_master_50',
          type: 'lifetime',
          title: 'Review Master',
          description: 'Write 50 reviews',
          points: 1000
        });
      }

      // Check for favorites achievements
      if (favorites >= 100) {
        achievements.push({
          id: 'favorites_king_100',
          type: 'lifetime',
          title: 'Favorites King',
          description: 'Add 100 restaurants to favorites',
          points: 500
        });
      }

      // Check for route achievements
      if (routes >= 50) {
        achievements.push({
          id: 'route_master_50',
          type: 'lifetime',
          title: 'Route Master',
          description: 'Plan 50 routes',
          points: 500
        });
      }

      // Award achievement points and save achievements
      for (const achievement of achievements) {
        await this.saveAchievement(userId, achievement);
        await this.awardPoints(userId, 'achievement', { achievement }, isPremium);
        
        // Send achievement notification
        await notificationService.sendAchievementNotification(userId, achievement);
      }

      return achievements;
    } catch (error) {
      console.error('❌ Error checking achievements:', error);
      return [];
    }
  }

  // Save achievement to user's profile
  async saveAchievement(userId, achievement) {
    try {
      const achievementData = {
        userId,
        achievementId: achievement.id,
        title: achievement.title,
        description: achievement.description,
        type: achievement.type,
        points: achievement.points,
        badge: achievement.badge || null,
        unlockedAt: serverTimestamp()
      };

      await addDoc(collection(db, this.achievementsCollection), achievementData);
      console.log(`✅ Achievement saved: ${achievement.title} for user ${userId}`);
    } catch (error) {
      console.error('❌ Error saving achievement:', error);
    }
  }

  // Check for level up
  async checkLevelUp(userId, isPremium = false) {
    try {
      const totalPoints = await this.getUserTotalPoints(userId);
      const currentLevel = this.calculateLevel(totalPoints, isPremium);
      const previousLevel = this.calculateLevel(totalPoints - 100, isPremium); // Approximate previous level
      
      if (currentLevel > previousLevel) {
        const badgeTier = this.getBadgeTier(currentLevel);
        
        const levelUpData = {
          userId,
          newLevel: currentLevel,
          previousLevel,
          badgeTier,
          totalPoints,
          timestamp: serverTimestamp()
        };

        // Save level up record
        await addDoc(collection(db, 'userLevelUps'), levelUpData);
        
        // Send notification
        await notificationService.sendLevelUpNotification(userId, levelUpData);

        return levelUpData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error checking level up:', error);
      return null;
    }
  }


  // Update user streak
  async updateStreak(userId, streakType) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const streakRef = doc(db, this.streaksCollection, `${userId}_${streakType}`);
      
      const docSnap = await getDoc(streakRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const lastDate = data.lastDate;
        
        if (lastDate === today) {
          // Already updated today
          return data;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastDate === yesterdayStr) {
          // Consecutive day
          await updateDoc(streakRef, {
            currentStreak: increment(1),
            lastDate: today,
            lastUpdated: serverTimestamp()
          });
        } else {
          // Streak broken, reset
          await updateDoc(streakRef, {
            currentStreak: 1,
            lastDate: today,
            lastUpdated: serverTimestamp()
          });
        }
      } else {
        // First streak
        await setDoc(streakRef, {
          userId,
          streakType,
          currentStreak: 1,
          lastDate: today,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });
      }
      
      // Get updated streak data
      const updatedDoc = await getDoc(streakRef);
      return updatedDoc.data();
    } catch (error) {
      console.error('❌ Error updating streak:', error);
      return null;
    }
  }

  // Get user's check-in count
  async getUserCheckInCount(userId) {
    try {
      const q = query(
        collection(db, 'checkIns'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('❌ Error getting user check-in count:', error);
      return 0;
    }
  }

  // Get user's review count
  async getUserReviewCount(userId) {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('❌ Error getting user review count:', error);
      return 0;
    }
  }

  // Get user's favorites count
  async getUserFavoritesCount(userId) {
    try {
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        where('removed', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('❌ Error getting user favorites count:', error);
      return 0;
    }
  }

  // Get user's routes count
  async getUserRoutesCount(userId) {
    try {
      const q = query(
        collection(db, 'userRoutes'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('❌ Error getting user routes count:', error);
      return 0;
    }
  }

  // Get user's stats for gamification
  async getUserStats(userId, isPremium = false) {
    try {
      const [totalPoints, checkInCount, reviewCount, favoritesCount, routesCount, pointHistory] = await Promise.all([
        this.getUserTotalPoints(userId),
        this.getUserCheckInCount(userId),
        this.getUserReviewCount(userId),
        this.getUserFavoritesCount(userId),
        this.getUserRoutesCount(userId),
        this.getUserPointHistory(userId, 20)
      ]);

      const currentLevel = this.calculateLevel(totalPoints, isPremium);
      const badgeTier = this.getBadgeTier(currentLevel);
      const nextLevelPoints = this.getNextLevelPoints(totalPoints, isPremium);
      const levelProgress = this.getLevelProgress(totalPoints, isPremium);

      return {
        success: true,
        stats: {
          totalPoints,
          checkInCount,
          reviewCount,
          favoritesCount,
          routesCount,
          currentLevel,
          badgeTier,
          nextLevelPoints,
          levelProgress,
          recentPoints: pointHistory.points || [],
          isPremium
        }
      };
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

export const gamificationService = new GamificationService();