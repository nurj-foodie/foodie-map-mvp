// Test script for analytics service
// Run this to test the analytics functionality

import { analyticsService } from '../services/analyticsService';

export const testAnalyticsService = async () => {
  console.log('🧪 Testing Analytics Service...');
  
  try {
    // Test 1: Create sample data
    console.log('📊 Creating sample analytics data...');
    const sampleCreated = await analyticsService.createSampleAnalyticsData();
    console.log('Sample data created:', sampleCreated);
    
    // Test 2: Get analytics data
    console.log('📈 Fetching analytics data...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    
    const data = await analyticsService.getAnalyticsData({
      startDate,
      endDate,
      limit: 10
    });
    console.log('Analytics data:', data);
    
    // Test 3: Generate report
    console.log('📋 Generating report...');
    const report = await analyticsService.generateReport(startDate, endDate);
    console.log('Report generated:', report ? 'Success' : 'Failed');
    
    if (report) {
      console.log('Report summary:');
      console.log('- Total cost:', report.costAnalytics?.totalCost);
      console.log('- Total users:', report.userBehavior?.totalUsers);
      console.log('- Cache hit rate:', report.costAnalytics?.cacheHitRate);
      console.log('- Error rate:', report.systemPerformance?.errorRate);
    }
    
    console.log('✅ Analytics service test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Analytics service test failed:', error);
    return false;
  }
};

// Test timestamp conversion
export const testTimestampConversion = () => {
  console.log('🕐 Testing timestamp conversion...');
  
  const testCases = [
    new Date(), // Date object
    { toDate: () => new Date() }, // Firestore Timestamp mock
    1640995200000, // Number (milliseconds)
    '2022-01-01T00:00:00.000Z', // String
    null, // Null
    undefined // Undefined
  ];
  
  testCases.forEach((testCase, index) => {
    try {
      const result = analyticsService.getDateFromTimestamp(testCase);
      console.log(`Test ${index + 1}:`, typeof testCase, '→', result instanceof Date ? 'Date' : typeof result);
    } catch (error) {
      console.error(`Test ${index + 1} failed:`, error.message);
    }
  });
  
  console.log('✅ Timestamp conversion test completed!');
};

// Uncomment to run tests
// testAnalyticsService();
// testTimestampConversion();
