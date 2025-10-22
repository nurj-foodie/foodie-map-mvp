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
import { notificationService } from './notificationService';

class AchievementService {
  constructor() {
    this.collectionName = 'achievements';
    this.userAchievementsCollection = 'userAchievements';
    
    // Achievement definitions
    this.ACHIEVEMENTS = {
      // Daily achievements
      DAILY_CHECK_IN: { 
        id: 'daily_check_in', 
        points: 10, 
        type: 'daily', 
        title: 'Daily Check-in', 
        description: 'Check into any restaurant',
        emoji: '📍',
        resetPeriod: 'daily'
      },
      DAILY_EXPLORER: { 
        id: 'daily_explorer', 
        points: 35, 
        type: 'daily', 
        title: 'Daily Explorer', 
        description: 'Check into a new restaurant',
        emoji: '🍽️',
        resetPeriod: 'daily'
      },
      DAILY_FAVORITES: { 
        id: 'daily_favorites', 
        points: 3, 
        type: 'daily', 
        title: 'Daily Favorites', 
        description: 'Add 1 restaurant to favorites',
        emoji: '❤️',
        resetPeriod: 'daily'
      },
      DAILY_REVIEWER: { 
        id: 'daily_reviewer', 
        points: 15, 
        type: 'daily', 
        title: 'Daily Reviewer', 
        description: 'Write 1 review',
        emoji: '⭐',
        resetPeriod: 'daily'
      },
      DAILY_NAVIGATOR: { 
        id: 'daily_navigator', 
        points: 5, 
        type: 'daily', 
        title: 'Daily Navigator', 
        description: 'Plan 1 route',
        emoji: '🗺️',
        resetPeriod: 'daily'
      },
      
      // Weekly achievements
      WEEKLY_STREAK: { 
        id: 'weekly_streak', 
        points: 100, 
        type: 'weekly', 
        title: 'Weekly Streak', 
        description: 'Check in 3 days in a row',
        emoji: '🔥',
        resetPeriod: 'weekly'
      },
      WEEKLY_EXPLORER: { 
        id: 'weekly_explorer', 
        points: 200, 
        type: 'weekly', 
        title: 'Weekly Explorer', 
        description: 'Check into 5 different restaurants',
        emoji: '🍽️',
        resetPeriod: 'weekly'
      },
      WEEKLY_LOCAL: { 
        id: 'weekly_local', 
        points: 150, 
        type: 'weekly', 
        title: 'Weekly Local', 
        description: 'Check into 3 restaurants in the same city',
        emoji: '📍',
        resetPeriod: 'weekly'
      },
      WEEKLY_REVIEWER: { 
        id: 'weekly_reviewer', 
        points: 100, 
        type: 'weekly', 
        title: 'Weekly Reviewer', 
        description: 'Write 3 reviews',
        emoji: '⭐',
        resetPeriod: 'weekly'
      },
      WEEKLY_COLLECTOR: { 
        id: 'weekly_collector', 
        points: 50, 
        type: 'weekly', 
        title: 'Weekly Collector', 
        description: 'Add 5 restaurants to favorites',
        emoji: '❤️',
        resetPeriod: 'weekly'
      },
      WEEKLY_PLANNER: { 
        id: 'weekly_planner', 
        points: 75, 
        type: 'weekly', 
        title: 'Weekly Planner', 
        description: 'Plan 3 routes',
        emoji: '🗺️',
        resetPeriod: 'weekly'
      },
      
      // Monthly achievements
      MONTHLY_CHAMPION: { 
        id: 'monthly_champion', 
        points: 500, 
        type: 'monthly', 
        title: 'Monthly Champion', 
        description: 'Check into 20 different restaurants',
        emoji: '🏆',
        resetPeriod: 'monthly'
      },
      MONTHLY_STREAK: { 
        id: 'monthly_streak', 
        points: 300, 
        type: 'monthly', 
        title: 'Monthly Streak', 
        description: 'Maintain a 7-day streak',
        emoji: '🔥',
        resetPeriod: 'monthly'
      },
      MONTHLY_EXPERT: { 
        id: 'monthly_expert', 
        points: 400, 
        type: 'monthly', 
        title: 'Monthly Expert', 
        description: 'Check into 10 restaurants in the same city',
        emoji: '📍',
        resetPeriod: 'monthly'
      },
      MONTHLY_REVIEWER: { 
        id: 'monthly_reviewer', 
        points: 300, 
        type: 'monthly', 
        title: 'Monthly Reviewer', 
        description: 'Write 10 reviews',
        emoji: '⭐',
        resetPeriod: 'monthly'
      },
      MONTHLY_COLLECTOR: { 
        id: 'monthly_collector', 
        points: 200, 
        type: 'monthly', 
        title: 'Monthly Collector', 
        description: 'Add 25 restaurants to favorites',
        emoji: '❤️',
        resetPeriod: 'monthly'
      },
      MONTHLY_NAVIGATOR: { 
        id: 'monthly_navigator', 
        points: 150, 
        type: 'monthly', 
        title: 'Monthly Navigator', 
        description: 'Plan 10 routes',
        emoji: '🗺️',
        resetPeriod: 'monthly'
      },
      DISTANCE_MASTER: { 
        id: 'distance_master', 
        points: 250, 
        type: 'monthly', 
        title: 'Distance Master', 
        description: 'Check in to restaurants 5km+ away',
        emoji: '🎯',
        resetPeriod: 'monthly'
      },
      
      // Lifetime achievements
      FIRST_CHECK_IN: { 
        id: 'first_check_in', 
        points: 50, 
        type: 'lifetime', 
        title: 'First Check-in', 
        description: 'Check into your first restaurant',
        emoji: '🥇',
        resetPeriod: 'never'
      },
      FOOD_EXPLORER_50: { 
        id: 'food_explorer_50', 
        points: 1000, 
        type: 'lifetime', 
        title: 'Food Explorer', 
        description: 'Check into 50 different restaurants',
        emoji: '🍽️',
        resetPeriod: 'never'
      },
      FOOD_EXPLORER_100: { 
        id: 'food_explorer_100', 
        points: 2500, 
        type: 'lifetime', 
        title: 'Food Explorer', 
        description: 'Check into 100 different restaurants',
        emoji: '🍽️',
        resetPeriod: 'never'
      },
      FOOD_EXPLORER_250: { 
        id: 'food_explorer_250', 
        points: 5000, 
        type: 'lifetime', 
        title: 'Food Explorer', 
        description: 'Check into 250 different restaurants',
        emoji: '🍽️',
        resetPeriod: 'never'
      },
      FOOD_EXPLORER_500: { 
        id: 'food_explorer_500', 
        points: 10000, 
        type: 'lifetime', 
        title: 'Food Explorer', 
        description: 'Check into 500 different restaurants',
        emoji: '🍽️',
        resetPeriod: 'never'
      },
      STREAK_MASTER_30: { 
        id: 'streak_master_30', 
        points: 2000, 
        type: 'lifetime', 
        title: 'Streak Master', 
        description: 'Achieve 30-day streak',
        emoji: '🔥',
        resetPeriod: 'never'
      },
      STREAK_MASTER_60: { 
        id: 'streak_master_60', 
        points: 5000, 
        type: 'lifetime', 
        title: 'Streak Master', 
        description: 'Achieve 60-day streak',
        emoji: '🔥',
        resetPeriod: 'never'
      },
      STREAK_MASTER_100: { 
        id: 'streak_master_100', 
        points: 10000, 
        type: 'lifetime', 
        title: 'Streak Master', 
        description: 'Achieve 100-day streak',
        emoji: '🔥',
        resetPeriod: 'never'
      },
      STREAK_MASTER_365: { 
        id: 'streak_master_365', 
        points: 25000, 
        type: 'lifetime', 
        title: 'Streak Master', 
        description: 'Achieve 365-day streak',
        emoji: '🔥',
        resetPeriod: 'never'
      },
      LOCAL_LEGEND: { 
        id: 'local_legend', 
        points: 2000, 
        type: 'lifetime', 
        title: 'Local Legend', 
        description: 'Check into 50 restaurants in the same city',
        emoji: '📍',
        resetPeriod: 'never'
      },
      REVIEW_MASTER_50: { 
        id: 'review_master_50', 
        points: 1000, 
        type: 'lifetime', 
        title: 'Review Master', 
        description: 'Write 50 reviews',
        emoji: '⭐',
        resetPeriod: 'never'
      },
      REVIEW_MASTER_100: { 
        id: 'review_master_100', 
        points: 2500, 
        type: 'lifetime', 
        title: 'Review Master', 
        description: 'Write 100 reviews',
        emoji: '⭐',
        resetPeriod: 'never'
      },
      REVIEW_MASTER_250: { 
        id: 'review_master_250', 
        points: 5000, 
        type: 'lifetime', 
        title: 'Review Master', 
        description: 'Write 250 reviews',
        emoji: '⭐',
        resetPeriod: 'never'
      },
      FAVORITES_KING_100: { 
        id: 'favorites_king_100', 
        points: 500, 
        type: 'lifetime', 
        title: 'Favorites King', 
        description: 'Add 100 restaurants to favorites',
        emoji: '❤️',
        resetPeriod: 'never'
      },
      FAVORITES_KING_250: { 
        id: 'favorites_king_250', 
        points: 1000, 
        type: 'lifetime', 
        title: 'Favorites King', 
        description: 'Add 250 restaurants to favorites',
        emoji: '❤️',
        resetPeriod: 'never'
      },
      FAVORITES_KING_500: { 
        id: 'favorites_king_500', 
        points: 2000, 
        type: 'lifetime', 
        title: 'Favorites King', 
        description: 'Add 500 restaurants to favorites',
        emoji: '❤️',
        resetPeriod: 'never'
      },
      ROUTE_MASTER_50: { 
        id: 'route_master_50', 
        points: 500, 
        type: 'lifetime', 
        title: 'Route Master', 
        description: 'Plan 50 routes',
        emoji: '🗺️',
        resetPeriod: 'never'
      },
      ROUTE_MASTER_100: { 
        id: 'route_master_100', 
        points: 1000, 
        type: 'lifetime', 
        title: 'Route Master', 
        description: 'Plan 100 routes',
        emoji: '🗺️',
        resetPeriod: 'never'
      },
      ROUTE_MASTER_250: { 
        id: 'route_master_250', 
        points: 2000, 
        type: 'lifetime', 
        title: 'Route Master', 
        description: 'Plan 250 routes',
        emoji: '🗺️',
        resetPeriod: 'never'
      },
      DISTANCE_CHAMPION_10: { 
        id: 'distance_champion_10', 
        points: 1000, 
        type: 'lifetime', 
        title: 'Distance Champion', 
        description: 'Check in to restaurants 10km+ away',
        emoji: '🎯',
        resetPeriod: 'never'
      },
      DISTANCE_CHAMPION_25: { 
        id: 'distance_champion_25', 
        points: 2500, 
        type: 'lifetime', 
        title: 'Distance Champion', 
        description: 'Check in to restaurants 25km+ away',
        emoji: '🎯',
        resetPeriod: 'never'
      },
      DISTANCE_CHAMPION_50: { 
        id: 'distance_champion_50', 
        points: 5000, 
        type: 'lifetime', 
        title: 'Distance Champion', 
        description: 'Check in to restaurants 50km+ away',
        emoji: '🎯',
        resetPeriod: 'never'
      }
    };
  }

  // Check if user has completed an achievement
  async checkAchievement(userId, achievementId, userStats = {}) {
    try {
      const achievement = this.ACHIEVEMENTS[achievementId];
      if (!achievement) {
        console.warn(`⚠️ Achievement not found: ${achievementId}`);
        return null;
      }

      // Check if user already has this achievement
      const hasAchievement = await this.userHasAchievement(userId, achievementId);
      if (hasAchievement) {
        return null; // Already earned
      }

      // Check achievement conditions based on type
      let isCompleted = false;
      let progress = 0;

      switch (achievementId) {
        case 'daily_check_in':
          isCompleted = userStats.dailyCheckIns >= 1;
          progress = Math.min(userStats.dailyCheckIns, 1);
          break;

        case 'daily_explorer':
          isCompleted = userStats.dailyNewRestaurants >= 1;
          progress = Math.min(userStats.dailyNewRestaurants, 1);
          break;

        case 'daily_favorites':
          isCompleted = userStats.dailyFavorites >= 1;
          progress = Math.min(userStats.dailyFavorites, 1);
          break;

        case 'daily_reviewer':
          isCompleted = userStats.dailyReviews >= 1;
          progress = Math.min(userStats.dailyReviews, 1);
          break;

        case 'daily_navigator':
          isCompleted = userStats.dailyRoutes >= 1;
          progress = Math.min(userStats.dailyRoutes, 1);
          break;

        case 'weekly_streak':
          isCompleted = userStats.currentStreak >= 3;
          progress = Math.min(userStats.currentStreak, 3);
          break;

        case 'weekly_explorer':
          isCompleted = userStats.weeklyCheckIns >= 5;
          progress = Math.min(userStats.weeklyCheckIns, 5);
          break;

        case 'weekly_local':
          isCompleted = userStats.weeklySameCityCheckIns >= 3;
          progress = Math.min(userStats.weeklySameCityCheckIns, 3);
          break;

        case 'weekly_reviewer':
          isCompleted = userStats.weeklyReviews >= 3;
          progress = Math.min(userStats.weeklyReviews, 3);
          break;

        case 'weekly_collector':
          isCompleted = userStats.weeklyFavorites >= 5;
          progress = Math.min(userStats.weeklyFavorites, 5);
          break;

        case 'weekly_planner':
          isCompleted = userStats.weeklyRoutes >= 3;
          progress = Math.min(userStats.weeklyRoutes, 3);
          break;

        case 'monthly_champion':
          isCompleted = userStats.monthlyCheckIns >= 20;
          progress = Math.min(userStats.monthlyCheckIns, 20);
          break;

        case 'monthly_streak':
          isCompleted = userStats.maxStreak >= 7;
          progress = Math.min(userStats.maxStreak, 7);
          break;

        case 'monthly_expert':
          isCompleted = userStats.monthlySameCityCheckIns >= 10;
          progress = Math.min(userStats.monthlySameCityCheckIns, 10);
          break;

        case 'monthly_reviewer':
          isCompleted = userStats.monthlyReviews >= 10;
          progress = Math.min(userStats.monthlyReviews, 10);
          break;

        case 'monthly_collector':
          isCompleted = userStats.monthlyFavorites >= 25;
          progress = Math.min(userStats.monthlyFavorites, 25);
          break;

        case 'monthly_navigator':
          isCompleted = userStats.monthlyRoutes >= 10;
          progress = Math.min(userStats.monthlyRoutes, 10);
          break;

        case 'distance_master':
          isCompleted = userStats.monthlyDistanceCheckIns >= 1;
          progress = Math.min(userStats.monthlyDistanceCheckIns, 1);
          break;

        case 'first_check_in':
          isCompleted = userStats.totalCheckIns >= 1;
          progress = Math.min(userStats.totalCheckIns, 1);
          break;

        case 'food_explorer_50':
          isCompleted = userStats.totalCheckIns >= 50;
          progress = Math.min(userStats.totalCheckIns, 50);
          break;

        case 'food_explorer_100':
          isCompleted = userStats.totalCheckIns >= 100;
          progress = Math.min(userStats.totalCheckIns, 100);
          break;

        case 'food_explorer_250':
          isCompleted = userStats.totalCheckIns >= 250;
          progress = Math.min(userStats.totalCheckIns, 250);
          break;

        case 'food_explorer_500':
          isCompleted = userStats.totalCheckIns >= 500;
          progress = Math.min(userStats.totalCheckIns, 500);
          break;

        case 'streak_master_30':
          isCompleted = userStats.maxStreak >= 30;
          progress = Math.min(userStats.maxStreak, 30);
          break;

        case 'streak_master_60':
          isCompleted = userStats.maxStreak >= 60;
          progress = Math.min(userStats.maxStreak, 60);
          break;

        case 'streak_master_100':
          isCompleted = userStats.maxStreak >= 100;
          progress = Math.min(userStats.maxStreak, 100);
          break;

        case 'streak_master_365':
          isCompleted = userStats.maxStreak >= 365;
          progress = Math.min(userStats.maxStreak, 365);
          break;

        case 'local_legend':
          isCompleted = userStats.maxSameCityCheckIns >= 50;
          progress = Math.min(userStats.maxSameCityCheckIns, 50);
          break;

        case 'review_master_50':
          isCompleted = userStats.totalReviews >= 50;
          progress = Math.min(userStats.totalReviews, 50);
          break;

        case 'review_master_100':
          isCompleted = userStats.totalReviews >= 100;
          progress = Math.min(userStats.totalReviews, 100);
          break;

        case 'review_master_250':
          isCompleted = userStats.totalReviews >= 250;
          progress = Math.min(userStats.totalReviews, 250);
          break;

        case 'favorites_king_100':
          isCompleted = userStats.totalFavorites >= 100;
          progress = Math.min(userStats.totalFavorites, 100);
          break;

        case 'favorites_king_250':
          isCompleted = userStats.totalFavorites >= 250;
          progress = Math.min(userStats.totalFavorites, 250);
          break;

        case 'favorites_king_500':
          isCompleted = userStats.totalFavorites >= 500;
          progress = Math.min(userStats.totalFavorites, 500);
          break;

        case 'route_master_50':
          isCompleted = userStats.totalRoutes >= 50;
          progress = Math.min(userStats.totalRoutes, 50);
          break;

        case 'route_master_100':
          isCompleted = userStats.totalRoutes >= 100;
          progress = Math.min(userStats.totalRoutes, 100);
          break;

        case 'route_master_250':
          isCompleted = userStats.totalRoutes >= 250;
          progress = Math.min(userStats.totalRoutes, 250);
          break;

        case 'distance_champion_10':
          isCompleted = userStats.totalDistanceCheckIns >= 1;
          progress = Math.min(userStats.totalDistanceCheckIns, 1);
          break;

        case 'distance_champion_25':
          isCompleted = userStats.totalDistanceCheckIns >= 1;
          progress = Math.min(userStats.totalDistanceCheckIns, 1);
          break;

        case 'distance_champion_50':
          isCompleted = userStats.totalDistanceCheckIns >= 1;
          progress = Math.min(userStats.totalDistanceCheckIns, 1);
          break;

        default:
          console.warn(`⚠️ Unknown achievement: ${achievementId}`);
          return null;
      }

      if (isCompleted) {
        return {
          ...achievement,
          progress: 100,
          completed: true
        };
      }

      return {
        ...achievement,
        progress: (progress / this.getAchievementTarget(achievementId)) * 100,
        completed: false
      };
    } catch (error) {
      console.error('❌ Error checking achievement:', error);
      return null;
    }
  }

  // Get achievement target for progress calculation
  getAchievementTarget(achievementId) {
    const targets = {
      'daily_check_in': 1,
      'daily_explorer': 1,
      'daily_favorites': 1,
      'daily_reviewer': 1,
      'daily_navigator': 1,
      'weekly_streak': 3,
      'weekly_explorer': 5,
      'weekly_local': 3,
      'weekly_reviewer': 3,
      'weekly_collector': 5,
      'weekly_planner': 3,
      'monthly_champion': 20,
      'monthly_streak': 7,
      'monthly_expert': 10,
      'monthly_reviewer': 10,
      'monthly_collector': 25,
      'monthly_navigator': 10,
      'distance_master': 1,
      'first_check_in': 1,
      'food_explorer_50': 50,
      'food_explorer_100': 100,
      'food_explorer_250': 250,
      'food_explorer_500': 500,
      'streak_master_30': 30,
      'streak_master_60': 60,
      'streak_master_100': 100,
      'streak_master_365': 365,
      'local_legend': 50,
      'review_master_50': 50,
      'review_master_100': 100,
      'review_master_250': 250,
      'favorites_king_100': 100,
      'favorites_king_250': 250,
      'favorites_king_500': 500,
      'route_master_50': 50,
      'route_master_100': 100,
      'route_master_250': 250,
      'distance_champion_10': 1,
      'distance_champion_25': 1,
      'distance_champion_50': 1
    };

    return targets[achievementId] || 1;
  }

  // Check if user has a specific achievement
  async userHasAchievement(userId, achievementId) {
    try {
      const q = query(
        collection(db, this.userAchievementsCollection),
        where('userId', '==', userId),
        where('achievementId', '==', achievementId)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('❌ Error checking user achievement:', error);
      return false;
    }
  }

  // Award achievement to user
  async awardAchievement(userId, achievement) {
    try {
      const achievementData = {
        userId,
        achievementId: achievement.id,
        title: achievement.title,
        description: achievement.description,
        type: achievement.type,
        points: achievement.points,
        emoji: achievement.emoji,
        resetPeriod: achievement.resetPeriod,
        unlockedAt: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, this.userAchievementsCollection), achievementData);
      
      // Send notification
      await notificationService.sendAchievementNotification(userId, achievement);
      
      console.log(`✅ Achievement awarded: ${achievement.title} to user ${userId}`);
      return {
        success: true,
        achievementId: docRef.id,
        achievement: achievementData
      };
    } catch (error) {
      console.error('❌ Error awarding achievement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user's achievements
  async getUserAchievements(userId, type = null) {
    try {
      let q = query(
        collection(db, this.userAchievementsCollection),
        where('userId', '==', userId),
        orderBy('unlockedAt', 'desc')
      );

      if (type) {
        q = query(
          collection(db, this.userAchievementsCollection),
          where('userId', '==', userId),
          where('type', '==', type),
          orderBy('unlockedAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const achievements = [];

      querySnapshot.forEach((doc) => {
        achievements.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        achievements
      };
    } catch (error) {
      console.error('❌ Error getting user achievements:', error);
      return {
        success: false,
        error: error.message,
        achievements: []
      };
    }
  }

  // Get all available achievements
  getAllAchievements() {
    return Object.values(this.ACHIEVEMENTS);
  }

  // Get achievements by type
  getAchievementsByType(type) {
    return Object.values(this.ACHIEVEMENTS).filter(achievement => achievement.type === type);
  }

  // Get daily achievements
  getDailyAchievements() {
    return this.getAchievementsByType('daily');
  }

  // Get weekly achievements
  getWeeklyAchievements() {
    return this.getAchievementsByType('weekly');
  }

  // Get monthly achievements
  getMonthlyAchievements() {
    return this.getAchievementsByType('monthly');
  }

  // Get lifetime achievements
  getLifetimeAchievements() {
    return this.getAchievementsByType('lifetime');
  }
}

export const achievementService = new AchievementService();
