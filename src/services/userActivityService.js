// User Activity Tracking Service - Foundation for Gamification
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

class UserActivityService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Generate unique activity ID
  generateActivityId(userId, action, timestamp) {
    return `${userId}_${action}_${timestamp.getTime()}`;
  }

  // Track route search activity
  async trackRouteSearch(userId, startLocation, endLocation, routeCount, alternativeRoutes = []) {
    try {
      const activityData = {
        userId,
        action: 'route_search',
        data: {
          startLocation: {
            name: startLocation.name,
            lat: startLocation.lat,
            lng: startLocation.lng
          },
          endLocation: {
            name: endLocation.name,
            lat: endLocation.lat,
            lng: endLocation.lng
          },
          routeCount,
          alternativeRoutes: alternativeRoutes.map(route => ({
            summary: route.summary,
            distance: route.legs?.[0]?.distance?.text || 'Unknown',
            duration: route.legs?.[0]?.duration?.text || 'Unknown'
          })),
          searchType: 'route_discovery'
        },
        timestamp: new Date(),
        points: 10, // Base points for route search
        category: 'exploration'
      };

      await addDoc(collection(db, 'user_activities'), activityData);
      console.log('✅ Tracked route search:', userId, startLocation.name, '→', endLocation.name);
      
      return activityData;
    } catch (error) {
      console.error('❌ Error tracking route search:', error);
      throw error;
    }
  }

  // Track restaurant discovery activity
  async trackRestaurantDiscovery(userId, restaurantId, restaurantName, routeId, discoveryMethod) {
    try {
      const activityData = {
        userId,
        action: 'restaurant_discovery',
        data: {
          restaurantId,
          restaurantName,
          routeId,
          discoveryMethod, // 'route_search', 'nearby_search', 'manual_search'
          location: {
            // Will be populated from restaurant data
          }
        },
        timestamp: new Date(),
        points: 5, // Points for discovering a restaurant
        category: 'discovery'
      };

      await addDoc(collection(db, 'user_activities'), activityData);
      console.log('✅ Tracked restaurant discovery:', userId, restaurantName);
      
      return activityData;
    } catch (error) {
      console.error('❌ Error tracking restaurant discovery:', error);
      throw error;
    }
  }

  // Track restaurant selection activity
  async trackRestaurantSelection(userId, restaurantId, restaurantName, routeId, selectionType) {
    try {
      const activityData = {
        userId,
        action: 'restaurant_selection',
        data: {
          restaurantId,
          restaurantName,
          routeId,
          selectionType, // 'single_selection', 'multi_selection', 'deselection'
          selectionCount: 1
        },
        timestamp: new Date(),
        points: 3, // Points for selecting a restaurant
        category: 'engagement'
      };

      await addDoc(collection(db, 'user_activities'), activityData);
      console.log('✅ Tracked restaurant selection:', userId, restaurantName);
      
      return activityData;
    } catch (error) {
      console.error('❌ Error tracking restaurant selection:', error);
      throw error;
    }
  }

  // Track route saving activity
  async trackRouteSave(userId, routeName, routeData, selectedEateries) {
    try {
      const activityData = {
        userId,
        action: 'route_save',
        data: {
          routeName,
          startLocation: routeData.startLocation,
          endLocation: routeData.endLocation,
          selectedEateries: selectedEateries.map(eatery => ({
            name: eatery.name,
            id: eatery.id || eatery.place_id
          })),
          totalStops: selectedEateries.length,
          totalDistance: routeData.totalDistance,
          totalDuration: routeData.totalDuration
        },
        timestamp: new Date(),
        points: 15, // Higher points for saving routes
        category: 'creation'
      };

      await addDoc(collection(db, 'user_activities'), activityData);
      console.log('✅ Tracked route save:', userId, routeName);
      
      return activityData;
    } catch (error) {
      console.error('❌ Error tracking route save:', error);
      throw error;
    }
  }

  // Track navigation activity
  async trackNavigation(userId, routeId, navigationType, selectedEateries = []) {
    try {
      const activityData = {
        userId,
        action: 'navigation_start',
        data: {
          routeId,
          navigationType, // 'start', 'preview', 'direct', 'multi_stop'
          selectedEateries: selectedEateries.map(eatery => ({
            name: eatery.name,
            id: eatery.id || eatery.place_id
          })),
          stopCount: selectedEateries.length,
          navigationMode: selectedEateries.length > 0 ? 'multi_stop' : 'direct'
        },
        timestamp: new Date(),
        points: 8, // Points for starting navigation
        category: 'action'
      };

      await addDoc(collection(db, 'user_activities'), activityData);
      console.log('✅ Tracked navigation start:', userId, navigationType);
      
      return activityData;
    } catch (error) {
      console.error('❌ Error tracking navigation:', error);
      throw error;
    }
  }

  // Track restaurant submission activity
  async trackRestaurantSubmission(userId, restaurantData, submissionType) {
    try {
      const activityData = {
        userId,
        action: 'restaurant_submission',
        data: {
          restaurantName: restaurantData.name,
          restaurantAddress: restaurantData.address,
          cuisineType: restaurantData.cuisineType,
          halalStatus: restaurantData.halalStatus,
          submissionType, // 'new_restaurant', 'update_existing', 'add_details'
          location: restaurantData.location
        },
        timestamp: new Date(),
        points: 20, // High points for community contribution
        category: 'contribution'
      };

      await addDoc(collection(db, 'user_activities'), activityData);
      console.log('✅ Tracked restaurant submission:', userId, restaurantData.name);
      
      return activityData;
    } catch (error) {
      console.error('❌ Error tracking restaurant submission:', error);
      throw error;
    }
  }

  // Track location permission activity
  async trackLocationPermission(userId, permissionGranted, locationData) {
    try {
      const activityData = {
        userId,
        action: 'location_permission',
        data: {
          permissionGranted,
          locationData: permissionGranted ? {
            lat: locationData.lat,
            lng: locationData.lng,
            accuracy: locationData.accuracy
          } : null,
          permissionType: 'geolocation'
        },
        timestamp: new Date(),
        points: permissionGranted ? 5 : 0,
        category: 'privacy'
      };

      await addDoc(collection(db, 'user_activities'), activityData);
      console.log('✅ Tracked location permission:', userId, permissionGranted);
      
      return activityData;
    } catch (error) {
      console.error('❌ Error tracking location permission:', error);
      throw error;
    }
  }

  // Get user activity summary
  async getUserActivitySummary(userId, timeRange = '30d') {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      const q = query(
        collection(db, 'user_activities'),
        where('userId', '==', userId),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const activities = [];
      
      snapshot.forEach(doc => {
        activities.push(doc.data());
      });

      // Calculate summary statistics
      const summary = {
        totalActivities: activities.length,
        totalPoints: activities.reduce((sum, activity) => sum + (activity.points || 0), 0),
        categories: {},
        actions: {},
        recentActivity: activities.slice(0, 10)
      };

      // Group by categories and actions
      activities.forEach(activity => {
        const category = activity.category || 'other';
        const action = activity.action || 'unknown';
        
        summary.categories[category] = (summary.categories[category] || 0) + 1;
        summary.actions[action] = (summary.actions[action] || 0) + 1;
      });

      console.log('✅ Generated activity summary for user:', userId);
      return summary;
    } catch (error) {
      console.error('❌ Error getting user activity summary:', error);
      return null;
    }
  }

  // Get user achievements (for gamification)
  async getUserAchievements(userId) {
    try {
      const summary = await this.getUserActivitySummary(userId, '30d');
      if (!summary) return [];

      const achievements = [];

      // Route Explorer Achievement
      if (summary.actions.route_search >= 10) {
        achievements.push({
          id: 'route_explorer',
          name: 'Route Explorer',
          description: 'Searched 10+ routes',
          icon: '🗺️',
          points: 50,
          unlocked: true
        });
      }

      // Restaurant Hunter Achievement
      if (summary.actions.restaurant_discovery >= 20) {
        achievements.push({
          id: 'restaurant_hunter',
          name: 'Restaurant Hunter',
          description: 'Discovered 20+ restaurants',
          icon: '🍽️',
          points: 100,
          unlocked: true
        });
      }

      // Route Saver Achievement
      if (summary.actions.route_save >= 5) {
        achievements.push({
          id: 'route_saver',
          name: 'Route Saver',
          description: 'Saved 5+ custom routes',
          icon: '💾',
          points: 75,
          unlocked: true
        });
      }

      // Community Contributor Achievement
      if (summary.actions.restaurant_submission >= 3) {
        achievements.push({
          id: 'community_contributor',
          name: 'Community Contributor',
          description: 'Submitted 3+ restaurants',
          icon: '🌟',
          points: 150,
          unlocked: true
        });
      }

      // Navigation Master Achievement
      if (summary.actions.navigation_start >= 15) {
        achievements.push({
          id: 'navigation_master',
          name: 'Navigation Master',
          description: 'Started 15+ navigation sessions',
          icon: '🧭',
          points: 80,
          unlocked: true
        });
      }

      console.log('✅ Generated achievements for user:', userId, achievements.length);
      return achievements;
    } catch (error) {
      console.error('❌ Error getting user achievements:', error);
      return [];
    }
  }

  // Get leaderboard data
  async getLeaderboard(timeRange = '30d', limit = 10) {
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      const q = query(
        collection(db, 'user_activities'),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc'),
        limit(1000) // Get more data to calculate leaderboard
      );

      const snapshot = await getDocs(q);
      const userStats = {};

      snapshot.forEach(doc => {
        const activity = doc.data();
        const userId = activity.userId;
        
        if (!userStats[userId]) {
          userStats[userId] = {
            userId,
            totalPoints: 0,
            totalActivities: 0,
            categories: {}
          };
        }

        userStats[userId].totalPoints += activity.points || 0;
        userStats[userId].totalActivities += 1;
        
        const category = activity.category || 'other';
        userStats[userId].categories[category] = (userStats[userId].categories[category] || 0) + 1;
      });

      // Convert to array and sort by points
      const leaderboard = Object.values(userStats)
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, limit);

      console.log('✅ Generated leaderboard:', leaderboard.length, 'users');
      return leaderboard;
    } catch (error) {
      console.error('❌ Error getting leaderboard:', error);
      return [];
    }
  }
}

export const userActivityService = new UserActivityService();
export default userActivityService;
