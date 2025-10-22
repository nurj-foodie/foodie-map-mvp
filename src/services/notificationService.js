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
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

class NotificationService {
  constructor() {
    this.collectionName = 'userNotifications';
    this.notificationTypes = {
      ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
      LEVEL_UP: 'level_up',
      STREAK_MILESTONE: 'streak_milestone',
      LEADERBOARD_UPDATE: 'leaderboard_update',
      STREAK_FREEZE: 'streak_freeze',
      CHALLENGE_COMPLETE: 'challenge_complete',
      BADGE_UNLOCKED: 'badge_unlocked'
    };
  }

  // Send notification to user
  async sendNotification(userId, notification) {
    try {
      const notificationData = {
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        read: false,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, this.collectionName), notificationData);
      console.log(`✅ Notification sent to user ${userId}: ${notification.title}`);
      
      return {
        success: true,
        notificationId: docRef.id,
        notification: notificationData
      };
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send achievement unlocked notification
  async sendAchievementNotification(userId, achievement) {
    const notification = {
      type: this.notificationTypes.ACHIEVEMENT_UNLOCKED,
      title: '🏆 Achievement Unlocked!',
      message: `${achievement.title}: ${achievement.description}`,
      data: {
        achievement,
        points: achievement.points || 0
      }
    };

    return await this.sendNotification(userId, notification);
  }

  // Send level up notification
  async sendLevelUpNotification(userId, levelUpData) {
    const notification = {
      type: this.notificationTypes.LEVEL_UP,
      title: '📈 Level Up!',
      message: `Congratulations! You reached Level ${levelUpData.newLevel} and unlocked the ${levelUpData.badgeTier.name} badge!`,
      data: levelUpData
    };

    return await this.sendNotification(userId, notification);
  }

  // Send streak milestone notification
  async sendStreakMilestoneNotification(userId, streakData) {
    const notification = {
      type: this.notificationTypes.STREAK_MILESTONE,
      title: '🔥 Streak Milestone!',
      message: `Amazing! You've maintained a ${streakData.currentStreak}-day streak!`,
      data: streakData
    };

    return await this.sendNotification(userId, notification);
  }

  // Send leaderboard update notification
  async sendLeaderboardNotification(userId, leaderboardData) {
    const notification = {
      type: this.notificationTypes.LEADERBOARD_UPDATE,
      title: '🏆 Leaderboard Update!',
      message: `You moved up to #${leaderboardData.newPosition} on the leaderboard!`,
      data: leaderboardData
    };

    return await this.sendNotification(userId, notification);
  }

  // Send streak freeze notification
  async sendStreakFreezeNotification(userId, freezeData) {
    const notification = {
      type: this.notificationTypes.STREAK_FREEZE,
      title: '❄️ Streak Frozen!',
      message: `Your streak is frozen for 24 hours. Check in before it expires!`,
      data: freezeData
    };

    return await this.sendNotification(userId, notification);
  }

  // Send challenge complete notification
  async sendChallengeCompleteNotification(userId, challengeData) {
    const notification = {
      type: this.notificationTypes.CHALLENGE_COMPLETE,
      title: '🎯 Challenge Complete!',
      message: `${challengeData.title} completed! +${challengeData.points} points!`,
      data: challengeData
    };

    return await this.sendNotification(userId, notification);
  }

  // Send badge unlocked notification
  async sendBadgeUnlockedNotification(userId, badgeData) {
    const notification = {
      type: this.notificationTypes.BADGE_UNLOCKED,
      title: '🎖️ Badge Unlocked!',
      message: `${badgeData.emoji} ${badgeData.name} badge unlocked!`,
      data: badgeData
    };

    return await this.sendNotification(userId, notification);
  }

  // Get user notifications
  async getUserNotifications(userId, limitCount = 20) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        notifications
      };
    } catch (error) {
      console.error('❌ Error getting user notifications:', error);
      return {
        success: false,
        error: error.message,
        notifications: []
      };
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const notificationRef = doc(db, this.collectionName, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mark all notifications as read for user
  async markAllNotificationsAsRead(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = [];

      querySnapshot.forEach((doc) => {
        updatePromises.push(
          updateDoc(doc.ref, {
            read: true,
            readAt: serverTimestamp()
          })
        );
      });

      await Promise.all(updatePromises);

      return {
        success: true,
        updatedCount: updatePromises.length
      };
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get unread notification count
  async getUnreadNotificationCount(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('❌ Error getting unread notification count:', error);
      return 0;
    }
  }

  // Delete old notifications (cleanup)
  async deleteOldNotifications(userId, daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('timestamp', '<', cutoffDate)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = [];

      querySnapshot.forEach((doc) => {
        deletePromises.push(doc.ref.delete());
      });

      await Promise.all(deletePromises);

      return {
        success: true,
        deletedCount: deletePromises.length
      };
    } catch (error) {
      console.error('❌ Error deleting old notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const notificationService = new NotificationService();
