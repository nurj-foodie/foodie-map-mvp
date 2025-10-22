class RateLimitService {
  constructor() {
    this.userLimits = new Map();
    this.defaultLimits = {
      routesPerDay: 20,
      searchesPerDay: 100,
      apiCallsPerHour: 50
    };
  }

  // Check if user has exceeded rate limits
  checkRateLimit(userId, action) {
    const now = new Date();
    const userKey = `user_${userId}`;
    
    if (!this.userLimits.has(userKey)) {
      this.userLimits.set(userKey, {
        routes: [],
        searches: [],
        apiCalls: []
      });
    }
    
    const userData = this.userLimits.get(userKey);
    
    // Clean old entries (older than 24 hours for daily limits, 1 hour for hourly)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    userData.routes = userData.routes.filter(time => time > oneDayAgo);
    userData.searches = userData.searches.filter(time => time > oneDayAgo);
    userData.apiCalls = userData.apiCalls.filter(time => time > oneHourAgo);
    
    // Check limits
    switch (action) {
      case 'route':
        if (userData.routes.length >= this.defaultLimits.routesPerDay) {
          return {
            allowed: false,
            reason: `Daily route limit exceeded (${this.defaultLimits.routesPerDay})`,
            resetTime: new Date(userData.routes[0].getTime() + 24 * 60 * 60 * 1000)
          };
        }
        userData.routes.push(now);
        break;
        
      case 'search':
        if (userData.searches.length >= this.defaultLimits.searchesPerDay) {
          return {
            allowed: false,
            reason: `Daily search limit exceeded (${this.defaultLimits.searchesPerDay})`,
            resetTime: new Date(userData.searches[0].getTime() + 24 * 60 * 60 * 1000)
          };
        }
        userData.searches.push(now);
        break;
        
      case 'apiCall':
        if (userData.apiCalls.length >= this.defaultLimits.apiCallsPerHour) {
          return {
            allowed: false,
            reason: `Hourly API call limit exceeded (${this.defaultLimits.apiCallsPerHour})`,
            resetTime: new Date(userData.apiCalls[0].getTime() + 60 * 60 * 1000)
          };
        }
        userData.apiCalls.push(now);
        break;
        
      default:
        return { allowed: true };
    }
    
    return { allowed: true };
  }

  // Get user's current usage stats
  getUserStats(userId) {
    const userKey = `user_${userId}`;
    const userData = this.userLimits.get(userKey);
    
    if (!userData) {
      return {
        routesToday: 0,
        searchesToday: 0,
        apiCallsThisHour: 0,
        limits: this.defaultLimits
      };
    }
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    return {
      routesToday: userData.routes.filter(time => time > oneDayAgo).length,
      searchesToday: userData.searches.filter(time => time > oneDayAgo).length,
      apiCallsThisHour: userData.apiCalls.filter(time => time > oneHourAgo).length,
      limits: this.defaultLimits
    };
  }

  // Reset user's limits (for testing or admin use)
  resetUserLimits(userId) {
    const userKey = `user_${userId}`;
    this.userLimits.delete(userKey);
    console.log(`🔄 Rate limits reset for user: ${userId}`);
  }
}

export const rateLimitService = new RateLimitService();
export default rateLimitService;
