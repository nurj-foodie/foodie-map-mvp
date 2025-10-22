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
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { notificationService } from './notificationService';
import { gamificationService } from './gamificationService';

class StreakService {
  constructor() {
    this.collectionName = 'userStreaks';
    this.streakTypes = {
      DAILY: 'daily',
      WEEKLY: 'weekly',
      MONTHLY: 'monthly'
    };
    
    // Streak milestones for bonus points
    this.streakMilestones = {
      daily: [3, 7, 14, 30, 60, 100, 365],
      weekly: [2, 4, 8, 12, 24, 52],
      monthly: [2, 3, 6, 12, 24]
    };
    
    // Streak freeze cost (in points)
    this.streakFreezeCost = 50;
  }

  // Update user streak
  async updateStreak(userId, action, metadata = {}) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = this.getWeekStart();
      const monthStart = this.getMonthStart();

      // Update daily streak
      const dailyStreak = await this.updateDailyStreak(userId, action, today, metadata);
      
      // Update weekly streak
      const weeklyStreak = await this.updateWeeklyStreak(userId, action, weekStart, metadata);
      
      // Update monthly streak
      const monthlyStreak = await this.updateMonthlyStreak(userId, action, monthStart, metadata);

      // Check for streak milestones and award bonus points
      const milestones = await this.checkStreakMilestones(userId, {
        daily: dailyStreak,
        weekly: weeklyStreak,
        monthly: monthlyStreak
      });

      return {
        success: true,
        streaks: {
          daily: dailyStreak,
          weekly: weeklyStreak,
          monthly: monthlyStreak
        },
        milestones
      };
    } catch (error) {
      console.error('❌ Error updating streak:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update daily streak
  async updateDailyStreak(userId, action, date, metadata = {}) {
    try {
      // Get current daily streak
      const currentStreak = await this.getUserStreak(userId, 'daily');
      
      if (!currentStreak) {
        // Create new daily streak
        const streakData = {
          userId,
          streakType: 'daily',
          currentStreak: 1,
          maxStreak: 1,
          lastActivityDate: date,
          lastActivity: action,
          totalActivities: 1,
          streakFreezes: 0,
          lastFreezeDate: null,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, this.collectionName), streakData);
        
        // Award points for starting streak
        await gamificationService.awardPoints(userId, 'streak', {
          streakType: 'daily',
          streakCount: 1,
          isNewStreak: true
        });

        return {
          id: docRef.id,
          ...streakData,
          isNewStreak: true
        };
      }

      const lastActivityDate = currentStreak.lastActivityDate;
      const daysDifference = this.getDaysDifference(lastActivityDate, date);

      let newStreak = { ...currentStreak };

      if (daysDifference === 0) {
        // Same day - no change to streak
        newStreak.totalActivities += 1;
        newStreak.lastActivity = action;
        newStreak.lastUpdated = serverTimestamp();
      } else if (daysDifference === 1) {
        // Consecutive day - increment streak
        newStreak.currentStreak += 1;
        newStreak.maxStreak = Math.max(newStreak.maxStreak, newStreak.currentStreak);
        newStreak.lastActivityDate = date;
        newStreak.lastActivity = action;
        newStreak.totalActivities += 1;
        newStreak.lastUpdated = serverTimestamp();
      } else if (daysDifference === 2 && currentStreak.streakFreezes > 0) {
        // Used streak freeze - maintain streak
        newStreak.currentStreak += 1;
        newStreak.maxStreak = Math.max(newStreak.maxStreak, newStreak.currentStreak);
        newStreak.lastActivityDate = date;
        newStreak.lastActivity = action;
        newStreak.totalActivities += 1;
        newStreak.streakFreezes -= 1;
        newStreak.lastFreezeDate = date;
        newStreak.lastUpdated = serverTimestamp();
      } else {
        // Streak broken - reset
        newStreak.currentStreak = 1;
        newStreak.lastActivityDate = date;
        newStreak.lastActivity = action;
        newStreak.totalActivities += 1;
        newStreak.streakFreezes = 0;
        newStreak.lastFreezeDate = null;
        newStreak.lastUpdated = serverTimestamp();
      }

      // Update streak in database
      const streakRef = doc(db, this.collectionName, currentStreak.id);
      await updateDoc(streakRef, {
        currentStreak: newStreak.currentStreak,
        maxStreak: newStreak.maxStreak,
        lastActivityDate: newStreak.lastActivityDate,
        lastActivity: newStreak.lastActivity,
        totalActivities: newStreak.totalActivities,
        streakFreezes: newStreak.streakFreezes,
        lastFreezeDate: newStreak.lastFreezeDate,
        lastUpdated: newStreak.lastUpdated
      });

      // Award points for streak activity
      await gamificationService.awardPoints(userId, 'streak', {
        streakType: 'daily',
        streakCount: newStreak.currentStreak,
        isNewStreak: daysDifference > 1
      });

      return newStreak;
    } catch (error) {
      console.error('❌ Error updating daily streak:', error);
      return null;
    }
  }

  // Update weekly streak
  async updateWeeklyStreak(userId, action, weekStart, metadata = {}) {
    try {
      const currentStreak = await this.getUserStreak(userId, 'weekly');
      
      if (!currentStreak) {
        const streakData = {
          userId,
          streakType: 'weekly',
          currentStreak: 1,
          maxStreak: 1,
          lastActivityDate: weekStart,
          lastActivity: action,
          totalActivities: 1,
          streakFreezes: 0,
          lastFreezeDate: null,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, this.collectionName), streakData);
        return { id: docRef.id, ...streakData };
      }

      const lastWeekStart = currentStreak.lastActivityDate;
      const weeksDifference = this.getWeeksDifference(lastWeekStart, weekStart);

      let newStreak = { ...currentStreak };

      if (weeksDifference === 0) {
        // Same week - no change to streak
        newStreak.totalActivities += 1;
        newStreak.lastActivity = action;
        newStreak.lastUpdated = serverTimestamp();
      } else if (weeksDifference === 1) {
        // Consecutive week - increment streak
        newStreak.currentStreak += 1;
        newStreak.maxStreak = Math.max(newStreak.maxStreak, newStreak.currentStreak);
        newStreak.lastActivityDate = weekStart;
        newStreak.lastActivity = action;
        newStreak.totalActivities += 1;
        newStreak.lastUpdated = serverTimestamp();
      } else {
        // Streak broken - reset
        newStreak.currentStreak = 1;
        newStreak.lastActivityDate = weekStart;
        newStreak.lastActivity = action;
        newStreak.totalActivities += 1;
        newStreak.streakFreezes = 0;
        newStreak.lastFreezeDate = null;
        newStreak.lastUpdated = serverTimestamp();
      }

      // Update streak in database
      const streakRef = doc(db, this.collectionName, currentStreak.id);
      await updateDoc(streakRef, {
        currentStreak: newStreak.currentStreak,
        maxStreak: newStreak.maxStreak,
        lastActivityDate: newStreak.lastActivityDate,
        lastActivity: newStreak.lastActivity,
        totalActivities: newStreak.totalActivities,
        streakFreezes: newStreak.streakFreezes,
        lastFreezeDate: newStreak.lastFreezeDate,
        lastUpdated: newStreak.lastUpdated
      });

      return newStreak;
    } catch (error) {
      console.error('❌ Error updating weekly streak:', error);
      return null;
    }
  }

  // Update monthly streak
  async updateMonthlyStreak(userId, action, monthStart, metadata = {}) {
    try {
      const currentStreak = await this.getUserStreak(userId, 'monthly');
      
      if (!currentStreak) {
        const streakData = {
          userId,
          streakType: 'monthly',
          currentStreak: 1,
          maxStreak: 1,
          lastActivityDate: monthStart,
          lastActivity: action,
          totalActivities: 1,
          streakFreezes: 0,
          lastFreezeDate: null,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, this.collectionName), streakData);
        return { id: docRef.id, ...streakData };
      }

      const lastMonthStart = currentStreak.lastActivityDate;
      const monthsDifference = this.getMonthsDifference(lastMonthStart, monthStart);

      let newStreak = { ...currentStreak };

      if (monthsDifference === 0) {
        // Same month - no change to streak
        newStreak.totalActivities += 1;
        newStreak.lastActivity = action;
        newStreak.lastUpdated = serverTimestamp();
      } else if (monthsDifference === 1) {
        // Consecutive month - increment streak
        newStreak.currentStreak += 1;
        newStreak.maxStreak = Math.max(newStreak.maxStreak, newStreak.currentStreak);
        newStreak.lastActivityDate = monthStart;
        newStreak.lastActivity = action;
        newStreak.totalActivities += 1;
        newStreak.lastUpdated = serverTimestamp();
      } else {
        // Streak broken - reset
        newStreak.currentStreak = 1;
        newStreak.lastActivityDate = monthStart;
        newStreak.lastActivity = action;
        newStreak.totalActivities += 1;
        newStreak.streakFreezes = 0;
        newStreak.lastFreezeDate = null;
        newStreak.lastUpdated = serverTimestamp();
      }

      // Update streak in database
      const streakRef = doc(db, this.collectionName, currentStreak.id);
      await updateDoc(streakRef, {
        currentStreak: newStreak.currentStreak,
        maxStreak: newStreak.maxStreak,
        lastActivityDate: newStreak.lastActivityDate,
        lastActivity: newStreak.lastActivity,
        totalActivities: newStreak.totalActivities,
        streakFreezes: newStreak.streakFreezes,
        lastFreezeDate: newStreak.lastFreezeDate,
        lastUpdated: newStreak.lastUpdated
      });

      return newStreak;
    } catch (error) {
      console.error('❌ Error updating monthly streak:', error);
      return null;
    }
  }

  // Get user streak
  async getUserStreak(userId, streakType) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('streakType', '==', streakType),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('❌ Error getting user streak:', error);
      return null;
    }
  }

  // Get all user streaks
  async getUserStreaks(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('streakType', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const streaks = [];

      querySnapshot.forEach((doc) => {
        streaks.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        streaks
      };
    } catch (error) {
      console.error('❌ Error getting user streaks:', error);
      return {
        success: false,
        error: error.message,
        streaks: []
      };
    }
  }

  // Use streak freeze
  async useStreakFreeze(userId, streakType = 'daily') {
    try {
      // Check if user has enough points
      const userStats = await gamificationService.getUserStats(userId);
      if (!userStats.success || userStats.stats.totalPoints < this.streakFreezeCost) {
        return {
          success: false,
          error: 'Insufficient points to use streak freeze'
        };
      }

      // Deduct points
      await gamificationService.awardPoints(userId, 'streakFreeze', {
        streakType,
        cost: this.streakFreezeCost
      });

      // Add streak freeze to user's streak
      const currentStreak = await this.getUserStreak(userId, streakType);
      if (currentStreak) {
        const streakRef = doc(db, this.collectionName, currentStreak.id);
        await updateDoc(streakRef, {
          streakFreezes: currentStreak.streakFreezes + 1,
          lastUpdated: serverTimestamp()
        });
      }

      // Send notification
      await notificationService.sendNotification(userId, 'streak_freeze_used', 
        `🔥 Streak freeze used! Your ${streakType} streak is protected.`, {
          streakType,
          cost: this.streakFreezeCost
        });

      return {
        success: true,
        message: 'Streak freeze used successfully'
      };
    } catch (error) {
      console.error('❌ Error using streak freeze:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check streak milestones
  async checkStreakMilestones(userId, streaks) {
    const milestones = [];

    for (const [streakType, streak] of Object.entries(streaks)) {
      if (!streak) continue;

      const milestonesForType = this.streakMilestones[streakType] || [];
      
      for (const milestone of milestonesForType) {
        if (streak.currentStreak === milestone) {
          // Award milestone bonus points
          const bonusPoints = milestone * 10; // 10 points per milestone day/week/month
          
          await gamificationService.awardPoints(userId, 'streakMilestone', {
            streakType,
            milestone,
            bonusPoints
          });

          // Send notification
          await notificationService.sendNotification(userId, 'streak_milestone', 
            `🔥 ${streakType.charAt(0).toUpperCase() + streakType.slice(1)} Streak Milestone! ${milestone} ${streakType === 'daily' ? 'days' : streakType === 'weekly' ? 'weeks' : 'months'} in a row!`, {
              streakType,
              milestone,
              bonusPoints
            });

          milestones.push({
            streakType,
            milestone,
            bonusPoints
          });
        }
      }
    }

    return milestones;
  }

  // Helper methods
  getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getWeeksDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  }

  getMonthsDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  }

  getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }

  getMonthStart() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return monthStart.toISOString().split('T')[0];
  }
}

export const streakService = new StreakService();
