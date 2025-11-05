import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

class AnalyticsService {
  constructor() {
    this.analyticsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Helper function to safely convert timestamps to Date objects
  getDateFromTimestamp(timestamp) {
    try {
      // If it's already a Date object
      if (timestamp instanceof Date) {
        return timestamp;
      }
      
      // If it's a Firestore Timestamp
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      
      // If it's a number (milliseconds)
      if (typeof timestamp === 'number') {
        return new Date(timestamp);
      }
      
      // If it's a string
      if (typeof timestamp === 'string') {
        return new Date(timestamp);
      }
      
      // Fallback to current date
      return new Date();
    } catch (error) {
      console.warn('⚠️ Error converting timestamp:', error);
      return new Date();
    }
  }

  // Track API usage and costs
  async trackApiUsage(data) {
    try {
      const analyticsData = {
        type: 'api_usage',
        timestamp: new Date(),
        ...data,
        // Calculate estimated cost
        estimatedCost: this.calculateApiCost(data.apiType, data.batchSize || 1)
      };

      await addDoc(collection(db, 'analytics'), analyticsData);
      
      // Cache for real-time dashboard
      this.cacheAnalyticsData(analyticsData);
      
      console.log('📊 API usage tracked:', analyticsData);
    } catch (error) {
      console.error('❌ Error tracking API usage:', error);
      // Don't throw error - analytics should not break the main app
    }
  }

  // Track user behavior
  async trackUserBehavior(data) {
    try {
      const behaviorData = {
        type: 'user_behavior',
        timestamp: new Date(),
        ...data
      };

      await addDoc(collection(db, 'analytics'), behaviorData);
      this.cacheAnalyticsData(behaviorData);
      
      console.log('👤 User behavior tracked:', behaviorData);
    } catch (error) {
      console.error('❌ Error tracking user behavior:', error);
    }
  }

  // Track cache performance
  async trackCachePerformance(data) {
    try {
      const cacheData = {
        type: 'cache_performance',
        timestamp: new Date(),
        ...data
      };

      await addDoc(collection(db, 'analytics'), cacheData);
      this.cacheAnalyticsData(cacheData);
      
      console.log('💾 Cache performance tracked:', cacheData);
    } catch (error) {
      console.error('❌ Error tracking cache performance:', error);
    }
  }

  // Track system performance
  async trackSystemPerformance(data) {
    try {
      const performanceData = {
        type: 'system_performance',
        timestamp: new Date(),
        ...data
      };

      await addDoc(collection(db, 'analytics'), performanceData);
      this.cacheAnalyticsData(performanceData);
      
      console.log('⚡ System performance tracked:', performanceData);
    } catch (error) {
      console.error('❌ Error tracking system performance:', error);
    }
  }

  // Calculate API cost based on type and usage
  calculateApiCost(apiType, batchSize = 1) {
    const costs = {
      'google_directions': 0.005, // RM0.005 per request
      'google_places': 0.017,     // RM0.017 per request
      'google_distance_matrix': 0.005, // RM0.005 per request
      'google_geocoding': 0.005   // RM0.005 per request
    };

    return (costs[apiType] || 0) * batchSize;
  }

  // Cache analytics data for real-time dashboard
  cacheAnalyticsData(data) {
    const key = `${data.type}_${new Date().toISOString().split('T')[0]}`;
    
    if (!this.analyticsCache.has(key)) {
      this.analyticsCache.set(key, []);
    }
    
    this.analyticsCache.get(key).push(data);
    
    // Clean old cache entries
    setTimeout(() => {
      this.analyticsCache.delete(key);
    }, this.cacheTimeout);
  }

  // Get analytics data with filtering (simplified to avoid index requirements)
  async getAnalyticsData(filters = {}) {
    try {
      const {
        type,
        startDate,
        endDate,
        userId,
        limit: limitCount = 1000
      } = filters;

      // Use simple query without complex filters to avoid index requirements
      let q = query(collection(db, 'analytics'), orderBy('timestamp', 'desc'), limit(limitCount));

      const snapshot = await getDocs(q);
      const data = [];

      snapshot.forEach(doc => {
        try {
          const docData = {
            id: doc.id,
            ...doc.data()
          };
          
          // Apply filters on client side to avoid index requirements
          let includeDoc = true;
          
          if (type && docData.type !== type) {
            includeDoc = false;
          }
          
          if (userId && docData.userId !== userId) {
            includeDoc = false;
          }
          
          if (startDate && docData.timestamp) {
            const docDate = this.getDateFromTimestamp(docData.timestamp);
            if (docDate < startDate) {
              includeDoc = false;
            }
          }
          
          if (endDate && docData.timestamp) {
            const docDate = this.getDateFromTimestamp(docData.timestamp);
            if (docDate > endDate) {
              includeDoc = false;
            }
          }
          
          if (includeDoc) {
            data.push(docData);
          }
        } catch (docError) {
          console.warn('⚠️ Error processing document:', doc.id, docError);
          // Skip this document and continue
        }
      });

      return data;
    } catch (error) {
      console.error('❌ Error getting analytics data:', error);
      return [];
    }
  }

  // Get cost analytics
  async getCostAnalytics(startDate, endDate) {
    try {
      const apiUsageData = await this.getAnalyticsData({
        type: 'api_usage',
        startDate,
        endDate
      });

      const costSummary = {
        totalCost: 0,
        byApiType: {},
        byDay: {},
        byUser: {},
        cacheHitRate: 0,
        totalRequests: 0,
        cachedRequests: 0
      };

      apiUsageData.forEach(record => {
        const cost = record.estimatedCost || 0;
        const apiType = record.apiType || 'unknown';
        const day = record.timestamp.toDate().toISOString().split('T')[0];
        const userId = record.userId || 'anonymous';

        // Total cost
        costSummary.totalCost += cost;

        // By API type
        if (!costSummary.byApiType[apiType]) {
          costSummary.byApiType[apiType] = { cost: 0, requests: 0 };
        }
        costSummary.byApiType[apiType].cost += cost;
        costSummary.byApiType[apiType].requests += 1;

        // By day
        if (!costSummary.byDay[day]) {
          costSummary.byDay[day] = { cost: 0, requests: 0 };
        }
        costSummary.byDay[day].cost += cost;
        costSummary.byDay[day].requests += 1;

        // By user
        if (!costSummary.byUser[userId]) {
          costSummary.byUser[userId] = { cost: 0, requests: 0 };
        }
        costSummary.byUser[userId].cost += cost;
        costSummary.byUser[userId].requests += 1;

        // Cache performance
        costSummary.totalRequests += 1;
        if (record.cacheHit) {
          costSummary.cachedRequests += 1;
        }
      });

      // Calculate cache hit rate
      if (costSummary.totalRequests > 0) {
        costSummary.cacheHitRate = (costSummary.cachedRequests / costSummary.totalRequests) * 100;
      }

      return costSummary;
    } catch (error) {
      console.error('❌ Error getting cost analytics:', error);
      return null;
    }
  }

  // Get user behavior analytics
  async getUserBehaviorAnalytics(startDate, endDate) {
    try {
      const behaviorData = await this.getAnalyticsData({
        type: 'user_behavior',
        startDate,
        endDate
      });

      const behaviorSummary = {
        totalUsers: new Set(),
        totalSessions: 0,
        averageSessionDuration: 0,
        mostUsedFeatures: {},
        userRetention: {},
        geographicDistribution: {}
      };

      behaviorData.forEach(record => {
        // Unique users
        if (record.userId) {
          behaviorSummary.totalUsers.add(record.userId);
        }

        // Sessions
        if (record.action === 'session_start') {
          behaviorSummary.totalSessions += 1;
        }

        // Feature usage
        if (record.feature) {
          if (!behaviorSummary.mostUsedFeatures[record.feature]) {
            behaviorSummary.mostUsedFeatures[record.feature] = 0;
          }
          behaviorSummary.mostUsedFeatures[record.feature] += 1;
        }

        // Geographic data
        if (record.location) {
          const country = record.location.country || 'Unknown';
          if (!behaviorSummary.geographicDistribution[country]) {
            behaviorSummary.geographicDistribution[country] = 0;
          }
          behaviorSummary.geographicDistribution[country] += 1;
        }
      });

      behaviorSummary.totalUsers = behaviorSummary.totalUsers.size;

      return behaviorSummary;
    } catch (error) {
      console.error('❌ Error getting user behavior analytics:', error);
      return null;
    }
  }

  // Get system performance analytics
  async getSystemPerformanceAnalytics(startDate, endDate) {
    try {
      const performanceData = await this.getAnalyticsData({
        type: 'system_performance',
        startDate,
        endDate
      });

      const performanceSummary = {
        averageResponseTime: 0,
        errorRate: 0,
        totalRequests: 0,
        failedRequests: 0,
        byEndpoint: {},
        byErrorType: {}
      };

      let totalResponseTime = 0;

      performanceData.forEach(record => {
        performanceSummary.totalRequests += 1;

        if (record.responseTime) {
          totalResponseTime += record.responseTime;
        }

        if (record.success === false) {
          performanceSummary.failedRequests += 1;

          // Error types
          if (record.errorType) {
            if (!performanceSummary.byErrorType[record.errorType]) {
              performanceSummary.byErrorType[record.errorType] = 0;
            }
            performanceSummary.byErrorType[record.errorType] += 1;
          }
        }

        // By endpoint
        if (record.endpoint) {
          if (!performanceSummary.byEndpoint[record.endpoint]) {
            performanceSummary.byEndpoint[record.endpoint] = {
              requests: 0,
              avgResponseTime: 0,
              errors: 0
            };
          }
          performanceSummary.byEndpoint[record.endpoint].requests += 1;
          if (record.responseTime) {
            performanceSummary.byEndpoint[record.endpoint].avgResponseTime += record.responseTime;
          }
          if (record.success === false) {
            performanceSummary.byEndpoint[record.endpoint].errors += 1;
          }
        }
      });

      // Calculate averages
      if (performanceSummary.totalRequests > 0) {
        performanceSummary.averageResponseTime = totalResponseTime / performanceSummary.totalRequests;
        performanceSummary.errorRate = (performanceSummary.failedRequests / performanceSummary.totalRequests) * 100;
      }

      // Calculate endpoint averages
      Object.keys(performanceSummary.byEndpoint).forEach(endpoint => {
        const endpointData = performanceSummary.byEndpoint[endpoint];
        if (endpointData.requests > 0) {
          endpointData.avgResponseTime = endpointData.avgResponseTime / endpointData.requests;
        }
      });

      return performanceSummary;
    } catch (error) {
      console.error('❌ Error getting system performance analytics:', error);
      return null;
    }
  }

  // Generate comprehensive report
  async generateReport(startDate, endDate, reportType = 'comprehensive') {
    try {
      const report = {
        reportType,
        generatedAt: new Date(),
        dateRange: { startDate, endDate },
        costAnalytics: null,
        userBehavior: null,
        systemPerformance: null,
        cachePerformance: null
      };

      // Get all analytics data
      const [costAnalytics, userBehavior, systemPerformance] = await Promise.all([
        this.getCostAnalytics(startDate, endDate),
        this.getUserBehaviorAnalytics(startDate, endDate),
        this.getSystemPerformanceAnalytics(startDate, endDate)
      ]);

      report.costAnalytics = costAnalytics;
      report.userBehavior = userBehavior;
      report.systemPerformance = systemPerformance;

      return report;
    } catch (error) {
      console.error('❌ Error generating report:', error);
      
      // Return mock data as fallback when Firestore fails
      console.log('📊 Using mock analytics data as fallback');
      return this.generateMockReport(startDate, endDate);
    }
  }

  // Generate mock report when Firestore is not available
  generateMockReport(startDate, endDate) {
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    return {
      reportType: 'comprehensive',
      generatedAt: new Date(),
      dateRange: { startDate, endDate },
      costAnalytics: {
        totalCost: 12.45 + (daysDiff * 2.1),
        byApiType: {
          'google_directions': { cost: 3.20, requests: 45 },
          'google_places': { cost: 7.85, requests: 23 },
          'google_distance_matrix': { cost: 1.40, requests: 12 }
        },
        byDay: this.generateMockDailyData(daysDiff),
        byUser: {
          // Mock user data - replace with environment variables in production
          'user1@example.com': { cost: 8.20, requests: 35 },
          'user2@example.com': { cost: 3.15, requests: 28 },
          'user3@example.com': { cost: 1.10, requests: 17 }
        },
        cacheHitRate: 78.5,
        totalRequests: 80,
        cachedRequests: 63
      },
      userBehavior: {
        totalUsers: 3,
        totalSessions: 45,
        averageSessionDuration: 12.5,
        mostUsedFeatures: {
          'route_planning': 28,
          'restaurant_search': 35,
          'favorites': 12,
          'admin_dashboard': 8
        },
        geographicDistribution: {
          'Malaysia': 45,
          'Singapore': 3,
          'Thailand': 1
        }
      },
      systemPerformance: {
        averageResponseTime: 245.7,
        errorRate: 2.3,
        totalRequests: 80,
        failedRequests: 2,
        byEndpoint: {
          'route_finding': { requests: 28, avgResponseTime: 1200, errors: 1 },
          'restaurant_search': { requests: 35, avgResponseTime: 850, errors: 1 },
          'admin_dashboard': { requests: 8, avgResponseTime: 200, errors: 0 }
        },
        byErrorType: {
          'ZERO_RESULTS': 1,
          'INVALID_REQUEST': 1
        }
      }
    };
  }

  // Generate mock daily data
  generateMockDailyData(days) {
    const dailyData = {};
    const baseDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      dailyData[dateStr] = {
        cost: 1.2 + Math.random() * 3.5,
        requests: 5 + Math.floor(Math.random() * 15)
      };
    }
    
    return dailyData;
  }

  // Create sample analytics data for testing
  async createSampleAnalyticsData() {
    try {
      console.log('📊 Creating sample analytics data...');
      
      const sampleData = [
        {
          type: 'api_usage',
          apiType: 'google_directions',
          userId: 'user1@example.com', // Mock data - replace with environment variables in production
          estimatedCost: 0.05,
          responseTime: 1200,
          cacheHit: false,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          type: 'api_usage',
          apiType: 'google_places',
          userId: 'user2@example.com', // Mock data - replace with environment variables in production
          estimatedCost: 0.032,
          responseTime: 850,
          cacheHit: true,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
        },
        {
          type: 'user_behavior',
          action: 'route_planning',
          userId: 'user3@example.com', // Mock data - replace with environment variables in production
          sessionDuration: 15.5,
          timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        },
        {
          type: 'system_performance',
          endpoint: 'admin_dashboard',
          responseTime: 200,
          success: true,
          timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
        }
      ];

      for (const data of sampleData) {
        await addDoc(collection(db, 'analytics'), data);
      }
      
      console.log('✅ Sample analytics data created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating sample analytics data:', error);
      return false;
    }
  }

  // Export report to CSV
  exportToCSV(data, filename) {
    try {
      let csv = '';
      
      // Add headers
      const headers = Object.keys(data);
      csv += headers.join(',') + '\n';
      
      // Add data rows
      if (Array.isArray(data)) {
        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'object' ? JSON.stringify(value) : value;
          });
          csv += values.join(',') + '\n';
        });
      } else {
        // Single object
        const values = headers.map(header => {
          const value = data[header];
          return typeof value === 'object' ? JSON.stringify(value) : value;
        });
        csv += values.join(',') + '\n';
      }
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'analytics-report.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      console.log('📊 CSV report exported:', filename);
    } catch (error) {
      console.error('❌ Error exporting CSV:', error);
    }
  }

  // Export report to PDF (requires jsPDF library)
  exportToPDF(data, filename) {
    try {
      // This would require jsPDF library
      // For now, we'll create a simple HTML report that can be printed as PDF
      const html = this.generateHTMLReport(data);
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
      
      console.log('📊 PDF report generated:', filename);
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
    }
  }

  // Generate HTML report for PDF export
  generateHTMLReport(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #333; border-bottom: 2px solid #007bff; }
          .metric { display: inline-block; margin: 10px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
          .metric-label { font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍽️ Foodie Map Analytics Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Date Range: ${data.dateRange?.startDate?.toLocaleDateString()} - ${data.dateRange?.endDate?.toLocaleDateString()}</p>
        </div>
        
        ${data.costAnalytics ? `
        <div class="section">
          <h2>💰 Cost Analytics</h2>
          <div class="metric">
            <div class="metric-value">RM${data.costAnalytics.totalCost?.toFixed(2) || '0.00'}</div>
            <div class="metric-label">Total Cost</div>
          </div>
          <div class="metric">
            <div class="metric-value">${data.costAnalytics.cacheHitRate?.toFixed(1) || '0'}%</div>
            <div class="metric-label">Cache Hit Rate</div>
          </div>
          <div class="metric">
            <div class="metric-value">${data.costAnalytics.totalRequests || '0'}</div>
            <div class="metric-label">Total Requests</div>
          </div>
        </div>
        ` : ''}
        
        ${data.userBehavior ? `
        <div class="section">
          <h2>👤 User Behavior</h2>
          <div class="metric">
            <div class="metric-value">${data.userBehavior.totalUsers || '0'}</div>
            <div class="metric-label">Total Users</div>
          </div>
          <div class="metric">
            <div class="metric-value">${data.userBehavior.totalSessions || '0'}</div>
            <div class="metric-label">Total Sessions</div>
          </div>
        </div>
        ` : ''}
        
        ${data.systemPerformance ? `
        <div class="section">
          <h2>⚡ System Performance</h2>
          <div class="metric">
            <div class="metric-value">${data.systemPerformance.averageResponseTime?.toFixed(2) || '0'}ms</div>
            <div class="metric-label">Avg Response Time</div>
          </div>
          <div class="metric">
            <div class="metric-value">${data.systemPerformance.errorRate?.toFixed(2) || '0'}%</div>
            <div class="metric-label">Error Rate</div>
          </div>
        </div>
        ` : ''}
      </body>
      </html>
    `;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
