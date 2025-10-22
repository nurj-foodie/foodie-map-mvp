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
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { notificationService } from './notificationService';
import { gamificationService } from './gamificationService';

class ChallengeService {
  constructor() {
    this.collectionName = 'userChallenges';
    this.challengeTypes = {
      DAILY: 'daily',
      WEEKLY: 'weekly',
      MONTHLY: 'monthly'
    };
    
    // Challenge definitions
    this.CHALLENGES = {
      // Daily challenges
      DAILY_CHECK_IN: {
        id: 'daily_check_in',
        type: 'daily',
        title: 'Daily Check-in',
        description: 'Check into a restaurant today',
        points: 10,
        emoji: '📍',
        difficulty: 'easy',
        target: 1,
        action: 'checkIn'
      },
      DAILY_FAVORITES: {
        id: 'daily_favorites',
        type: 'daily',
        title: 'Daily Favorites',
        description: 'Add 2 restaurants to favorites',
        points: 25,
        emoji: '❤️',
        difficulty: 'medium',
        target: 2,
        action: 'favorite'
      },
      DAILY_REVIEW: {
        id: 'daily_review',
        type: 'daily',
        title: 'Daily Reviewer',
        description: 'Write a review',
        points: 50,
        emoji: '⭐',
        difficulty: 'hard',
        target: 1,
        action: 'review'
      },
      DAILY_ROUTE: {
        id: 'daily_route',
        type: 'daily',
        title: 'Daily Navigator',
        description: 'Plan a route',
        points: 15,
        emoji: '🗺️',
        difficulty: 'easy',
        target: 1,
        action: 'route'
      },
      DAILY_PHOTO: {
        id: 'daily_photo',
        type: 'daily',
        title: 'Daily Photographer',
        description: 'Upload a restaurant photo',
        points: 30,
        emoji: '📸',
        difficulty: 'medium',
        target: 1,
        action: 'photo'
      },
      
      // Weekly challenges
      WEEKLY_EXPLORER: {
        id: 'weekly_explorer',
        type: 'weekly',
        title: 'Weekly Explorer',
        description: 'Visit 3 different restaurants',
        points: 100,
        emoji: '🍽️',
        difficulty: 'medium',
        target: 3,
        action: 'checkIn'
      },
      WEEKLY_CITY_EXPLORER: {
        id: 'weekly_city_explorer',
        type: 'weekly',
        title: 'City Explorer',
        description: 'Explore a new city',
        points: 200,
        emoji: '🏙️',
        difficulty: 'hard',
        target: 1,
        action: 'newCity'
      },
      WEEKLY_STREAK: {
        id: 'weekly_streak',
        type: 'weekly',
        title: 'Weekly Streak',
        description: 'Maintain a 3-day streak',
        points: 300,
        emoji: '🔥',
        difficulty: 'hard',
        target: 3,
        action: 'streak'
      },
      WEEKLY_REVIEWER: {
        id: 'weekly_reviewer',
        type: 'weekly',
        title: 'Weekly Reviewer',
        description: 'Write 3 reviews',
        points: 150,
        emoji: '⭐',
        difficulty: 'medium',
        target: 3,
        action: 'review'
      },
      WEEKLY_COLLECTOR: {
        id: 'weekly_collector',
        type: 'weekly',
        title: 'Weekly Collector',
        description: 'Add 5 restaurants to favorites',
        points: 75,
        emoji: '❤️',
        difficulty: 'easy',
        target: 5,
        action: 'favorite'
      },
      WEEKLY_PLANNER: {
        id: 'weekly_planner',
        type: 'weekly',
        title: 'Weekly Planner',
        description: 'Plan 3 routes',
        points: 90,
        emoji: '🗺️',
        difficulty: 'medium',
        target: 3,
        action: 'route'
      },
      
      // Monthly challenges
      MONTHLY_CHAMPION: {
        id: 'monthly_champion',
        type: 'monthly',
        title: 'Monthly Champion',
        description: 'Become a local expert in your city',
        points: 500,
        emoji: '🏆',
        difficulty: 'hard',
        target: 1,
        action: 'localExpert'
      },
      MONTHLY_EXPLORER: {
        id: 'monthly_explorer',
        type: 'monthly',
        title: 'Monthly Explorer',
        description: 'Discover 20 new restaurants',
        points: 1000,
        emoji: '🍽️',
        difficulty: 'hard',
        target: 20,
        action: 'checkIn'
      },
      MONTHLY_STREAK: {
        id: 'monthly_streak',
        type: 'monthly',
        title: 'Monthly Streak',
        description: 'Maintain a 7-day streak',
        points: 1500,
        emoji: '🔥',
        difficulty: 'hard',
        target: 7,
        action: 'streak'
      },
      MONTHLY_REVIEWER: {
        id: 'monthly_reviewer',
        type: 'monthly',
        title: 'Monthly Reviewer',
        description: 'Write 10 reviews',
        points: 750,
        emoji: '⭐',
        difficulty: 'medium',
        target: 10,
        action: 'review'
      },
      MONTHLY_COLLECTOR: {
        id: 'monthly_collector',
        type: 'monthly',
        title: 'Monthly Collector',
        description: 'Add 25 restaurants to favorites',
        points: 500,
        emoji: '❤️',
        difficulty: 'medium',
        target: 25,
        action: 'favorite'
      },
      MONTHLY_NAVIGATOR: {
        id: 'monthly_navigator',
        type: 'monthly',
        title: 'Monthly Navigator',
        description: 'Plan 10 routes',
        points: 600,
        emoji: '🗺️',
        difficulty: 'medium',
        target: 10,
        action: 'route'
      }
    };
  }

  // Generate daily challenges for user
  async generateDailyChallenges(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if challenges already exist for today
      const existingChallenges = await this.getUserChallenges(userId, 'daily', today);
      if (existingChallenges.length > 0) {
        return existingChallenges;
      }

      // Select 3-5 random daily challenges
      const dailyChallenges = this.getDailyChallenges();
      const selectedChallenges = this.selectRandomChallenges(dailyChallenges, 3, 5);

      const challenges = [];
      for (const challenge of selectedChallenges) {
        const challengeData = {
          userId,
          challengeId: challenge.id,
          type: challenge.type,
          title: challenge.title,
          description: challenge.description,
          points: challenge.points,
          emoji: challenge.emoji,
          difficulty: challenge.difficulty,
          target: challenge.target,
          action: challenge.action,
          progress: 0,
          completed: false,
          date: today,
          createdAt: serverTimestamp(),
          expiresAt: this.getChallengeExpiry('daily')
        };

        const docRef = await addDoc(collection(db, this.collectionName), challengeData);
        challenges.push({
          id: docRef.id,
          ...challengeData
        });
      }

      console.log(`✅ Generated ${challenges.length} daily challenges for user ${userId}`);
      return challenges;
    } catch (error) {
      console.error('❌ Error generating daily challenges:', error);
      return [];
    }
  }

  // Generate weekly challenges for user
  async generateWeeklyChallenges(userId) {
    try {
      const weekStart = this.getWeekStart();
      
      // Check if challenges already exist for this week
      const existingChallenges = await this.getUserChallenges(userId, 'weekly', weekStart);
      if (existingChallenges.length > 0) {
        return existingChallenges;
      }

      // Select 5-7 random weekly challenges
      const weeklyChallenges = this.getWeeklyChallenges();
      const selectedChallenges = this.selectRandomChallenges(weeklyChallenges, 5, 7);

      const challenges = [];
      for (const challenge of selectedChallenges) {
        const challengeData = {
          userId,
          challengeId: challenge.id,
          type: challenge.type,
          title: challenge.title,
          description: challenge.description,
          points: challenge.points,
          emoji: challenge.emoji,
          difficulty: challenge.difficulty,
          target: challenge.target,
          action: challenge.action,
          progress: 0,
          completed: false,
          date: weekStart,
          createdAt: serverTimestamp(),
          expiresAt: this.getChallengeExpiry('weekly')
        };

        const docRef = await addDoc(collection(db, this.collectionName), challengeData);
        challenges.push({
          id: docRef.id,
          ...challengeData
        });
      }

      console.log(`✅ Generated ${challenges.length} weekly challenges for user ${userId}`);
      return challenges;
    } catch (error) {
      console.error('❌ Error generating weekly challenges:', error);
      return [];
    }
  }

  // Generate monthly challenges for user
  async generateMonthlyChallenges(userId) {
    try {
      const monthStart = this.getMonthStart();
      
      // Check if challenges already exist for this month
      const existingChallenges = await this.getUserChallenges(userId, 'monthly', monthStart);
      if (existingChallenges.length > 0) {
        return existingChallenges;
      }

      // Select 10-15 random monthly challenges
      const monthlyChallenges = this.getMonthlyChallenges();
      const selectedChallenges = this.selectRandomChallenges(monthlyChallenges, 10, 15);

      const challenges = [];
      for (const challenge of selectedChallenges) {
        const challengeData = {
          userId,
          challengeId: challenge.id,
          type: challenge.type,
          title: challenge.title,
          description: challenge.description,
          points: challenge.points,
          emoji: challenge.emoji,
          difficulty: challenge.difficulty,
          target: challenge.target,
          action: challenge.action,
          progress: 0,
          completed: false,
          date: monthStart,
          createdAt: serverTimestamp(),
          expiresAt: this.getChallengeExpiry('monthly')
        };

        const docRef = await addDoc(collection(db, this.collectionName), challengeData);
        challenges.push({
          id: docRef.id,
          ...challengeData
        });
      }

      console.log(`✅ Generated ${challenges.length} monthly challenges for user ${userId}`);
      return challenges;
    } catch (error) {
      console.error('❌ Error generating monthly challenges:', error);
      return [];
    }
  }

  // Update challenge progress
  async updateChallengeProgress(userId, action, metadata = {}) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = this.getWeekStart();
      const monthStart = this.getMonthStart();

      // Get active challenges for all periods
      const [dailyChallenges, weeklyChallenges, monthlyChallenges] = await Promise.all([
        this.getUserChallenges(userId, 'daily', today),
        this.getUserChallenges(userId, 'weekly', weekStart),
        this.getUserChallenges(userId, 'monthly', monthStart)
      ]);

      const allChallenges = [...dailyChallenges, ...weeklyChallenges, ...monthlyChallenges];
      const completedChallenges = [];

      for (const challenge of allChallenges) {
        if (challenge.completed || challenge.action !== action) {
          continue;
        }

        let newProgress = challenge.progress;
        let isCompleted = false;

        // Update progress based on action
        switch (action) {
          case 'checkIn':
            newProgress = Math.min(challenge.progress + 1, challenge.target);
            break;
          case 'favorite':
            newProgress = Math.min(challenge.progress + 1, challenge.target);
            break;
          case 'review':
            newProgress = Math.min(challenge.progress + 1, challenge.target);
            break;
          case 'route':
            newProgress = Math.min(challenge.progress + 1, challenge.target);
            break;
          case 'photo':
            newProgress = Math.min(challenge.progress + 1, challenge.target);
            break;
          case 'streak':
            newProgress = Math.min(metadata.streakDays || 0, challenge.target);
            break;
          case 'newCity':
            newProgress = metadata.isNewCity ? 1 : challenge.progress;
            break;
          case 'localExpert':
            newProgress = metadata.isLocalExpert ? 1 : challenge.progress;
            break;
        }

        isCompleted = newProgress >= challenge.target;

        // Update challenge in database
        const challengeRef = doc(db, this.collectionName, challenge.id);
        await updateDoc(challengeRef, {
          progress: newProgress,
          completed: isCompleted,
          completedAt: isCompleted ? serverTimestamp() : null,
          lastUpdated: serverTimestamp()
        });

        if (isCompleted) {
          // Award points
          await gamificationService.awardPoints(userId, 'challenge', {
            challengeId: challenge.id,
            challengeTitle: challenge.title,
            points: challenge.points
          });

          // Send notification
          await notificationService.sendChallengeCompleteNotification(userId, {
            title: challenge.title,
            points: challenge.points,
            challengeId: challenge.id
          });

          completedChallenges.push({
            ...challenge,
            progress: newProgress,
            completed: true
          });
        }
      }

      return {
        success: true,
        completedChallenges
      };
    } catch (error) {
      console.error('❌ Error updating challenge progress:', error);
      return {
        success: false,
        error: error.message,
        completedChallenges: []
      };
    }
  }

  // Get user challenges
  async getUserChallenges(userId, type = null, date = null) {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (type) {
        q = query(
          collection(db, this.collectionName),
          where('userId', '==', userId),
          where('type', '==', type),
          orderBy('createdAt', 'desc')
        );
      }

      if (date) {
        q = query(
          collection(db, this.collectionName),
          where('userId', '==', userId),
          where('date', '==', date),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const challenges = [];

      querySnapshot.forEach((doc) => {
        challenges.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return challenges;
    } catch (error) {
      console.error('❌ Error getting user challenges:', error);
      return [];
    }
  }

  // Get daily challenges
  getDailyChallenges() {
    return Object.values(this.CHALLENGES).filter(challenge => challenge.type === 'daily');
  }

  // Get weekly challenges
  getWeeklyChallenges() {
    return Object.values(this.CHALLENGES).filter(challenge => challenge.type === 'weekly');
  }

  // Get monthly challenges
  getMonthlyChallenges() {
    return Object.values(this.CHALLENGES).filter(challenge => challenge.type === 'monthly');
  }

  // Select random challenges
  selectRandomChallenges(challenges, minCount, maxCount) {
    const shuffled = [...challenges].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    return shuffled.slice(0, count);
  }

  // Get week start date
  getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }

  // Get month start date
  getMonthStart() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return monthStart.toISOString().split('T')[0];
  }

  // Get challenge expiry date
  getChallengeExpiry(type) {
    const now = new Date();
    
    switch (type) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
        
      case 'weekly':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek;
        
      case 'monthly':
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return nextMonth;
        
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  }
}

export const challengeService = new ChallengeService();
