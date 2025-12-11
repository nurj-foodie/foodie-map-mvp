import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { getAdminAccess, revokeAdminAccess } from '../utils/adminAuth';
import AdminLogin from './AdminLogin';
import RestaurantReviewDashboard from './RestaurantReviewDashboard';
import RestaurantEditReviewDashboard from './RestaurantEditReviewDashboard';
import ReviewModerationDashboard from './ReviewModerationDashboard';
import UserManagementDashboard from './UserManagementDashboard';
import AdminCohortDashboard from './AdminCohortDashboard';
import AdminWaveDashboard from './AdminWaveDashboard';
import AdminCreatorDashboard from './AdminCreatorDashboard';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('analytics'); // analytics, restaurants, users, beta
  const [activeSubTab, setActiveSubTab] = useState({
    analytics: 'overview', // overview, cost, users, performance
    restaurants: 'submissions', // submissions, edits, reviews
    beta: 'cohort' // cohort, waves, creators
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date()
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [realTimeData, setRealTimeData] = useState({
    totalCost: 0,
    totalUsers: 0,
    cacheHitRate: 0,
    errorRate: 0
  });

  // Check admin access on mount
  useEffect(() => {
    setHasAdminAccess(getAdminAccess());
  }, []);

  // Load analytics data
  useEffect(() => {
    if (hasAdminAccess) {
      loadAnalyticsData();
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(loadAnalyticsData, 30000);
      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [dateRange, hasAdminAccess]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const report = await analyticsService.generateReport(
        dateRange.startDate,
        dateRange.endDate
      );
      setReportData(report);
      
      // Update real-time data
      if (report) {
        setRealTimeData({
          totalCost: report.costAnalytics?.totalCost || 0,
          totalUsers: report.userBehavior?.totalUsers || 0,
          cacheHitRate: report.costAnalytics?.cacheHitRate || 0,
          errorRate: report.systemPerformance?.errorRate || 0
        });
      }
    } catch (error) {
      console.error('❌ Error loading analytics data:', error);
      // Set mock data as fallback
      setReportData(analyticsService.generateMockReport(
        dateRange.startDate,
        dateRange.endDate
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (type, value) => {
    setDateRange(prev => ({
      ...prev,
      [type]: new Date(value)
    }));
  };

  const handleLoginSuccess = () => {
    setHasAdminAccess(true);
  };

  const handleLogout = () => {
    revokeAdminAccess();
    setHasAdminAccess(false);
  };

  const exportReport = (format) => {
    if (!reportData) return;
    
    const filename = `foodie-analytics-${dateRange.startDate.toISOString().split('T')[0]}-to-${dateRange.endDate.toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      analyticsService.exportToCSV(reportData, `${filename}.csv`);
    } else if (format === 'pdf') {
      analyticsService.exportToPDF(reportData, `${filename}.pdf`);
    }
  };

  const renderOverview = () => (
    <div className="admin-overview">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-value">RM{realTimeData.totalCost.toFixed(2)}</div>
            <div className="metric-label">Total Cost</div>
            <div className="metric-trend">+5.2% from last week</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <div className="metric-value">{realTimeData.totalUsers}</div>
            <div className="metric-label">Active Users</div>
            <div className="metric-trend">+12.3% from last week</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">💾</div>
          <div className="metric-content">
            <div className="metric-value">{realTimeData.cacheHitRate.toFixed(1)}%</div>
            <div className="metric-label">Cache Hit Rate</div>
            <div className="metric-trend">+2.1% from last week</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <div className="metric-value">{realTimeData.errorRate.toFixed(1)}%</div>
            <div className="metric-label">Error Rate</div>
            <div className="metric-trend">-0.8% from last week</div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>📊 Cost Breakdown by API Type</h3>
          {reportData?.costAnalytics?.byApiType ? (
            <div className="cost-breakdown">
              {Object.entries(reportData.costAnalytics.byApiType).map(([apiType, data]) => (
                <div key={apiType} className="cost-item">
                  <div className="cost-label">{apiType.replace('_', ' ').toUpperCase()}</div>
                  <div className="cost-bar">
                    <div 
                      className="cost-fill" 
                      style={{ width: `${(data.cost / reportData.costAnalytics.totalCost) * 100}%` }}
                    ></div>
                  </div>
                  <div className="cost-value">RM{data.cost.toFixed(2)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No cost data available</div>
          )}
        </div>

        <div className="chart-card">
          <h3>📈 Daily Cost Trend</h3>
          {reportData?.costAnalytics?.byDay ? (
            <div className="daily-trend">
              {Object.entries(reportData.costAnalytics.byDay)
                .sort(([a], [b]) => new Date(a) - new Date(b))
                .map(([day, data]) => (
                <div key={day} className="trend-item">
                  <div className="trend-date">{new Date(day).toLocaleDateString()}</div>
                  <div className="trend-bar">
                    <div 
                      className="trend-fill" 
                      style={{ height: `${(data.cost / Math.max(...Object.values(reportData.costAnalytics.byDay).map(d => d.cost))) * 100}%` }}
                    ></div>
                  </div>
                  <div className="trend-value">RM{data.cost.toFixed(2)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No trend data available</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCostAnalytics = () => (
    <div className="admin-section">
      <h2>💰 Cost Analytics</h2>
      
      {reportData?.costAnalytics ? (
        <div className="analytics-content">
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Total Cost</h4>
              <div className="summary-value">RM{reportData.costAnalytics.totalCost.toFixed(2)}</div>
            </div>
            <div className="summary-card">
              <h4>Total Requests</h4>
              <div className="summary-value">{reportData.costAnalytics.totalRequests}</div>
            </div>
            <div className="summary-card">
              <h4>Cache Hit Rate</h4>
              <div className="summary-value">{reportData.costAnalytics.cacheHitRate.toFixed(1)}%</div>
            </div>
            <div className="summary-card">
              <h4>Cached Requests</h4>
              <div className="summary-value">{reportData.costAnalytics.cachedRequests}</div>
            </div>
          </div>

          <div className="detailed-tables">
            <div className="table-section">
              <h4>Cost by API Type</h4>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>API Type</th>
                    <th>Requests</th>
                    <th>Cost (RM)</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.costAnalytics.byApiType).map(([apiType, data]) => (
                    <tr key={apiType}>
                      <td>{apiType.replace('_', ' ').toUpperCase()}</td>
                      <td>{data.requests}</td>
                      <td>{data.cost.toFixed(2)}</td>
                      <td>{((data.cost / reportData.costAnalytics.totalCost) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-section">
              <h4>Top Users by Cost</h4>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Requests</th>
                    <th>Cost (RM)</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.costAnalytics.byUser)
                    .sort(([,a], [,b]) => b.cost - a.cost)
                    .slice(0, 10)
                    .map(([userId, data]) => (
                    <tr key={userId}>
                      <td>{userId}</td>
                      <td>{data.requests}</td>
                      <td>{data.cost.toFixed(2)}</td>
                      <td>{((data.cost / reportData.costAnalytics.totalCost) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-data">No cost analytics data available</div>
      )}
    </div>
  );

  const renderUserBehavior = () => (
    <div className="admin-section">
      <h2>👤 User Behavior Analytics</h2>
      
      {reportData?.userBehavior ? (
        <div className="analytics-content">
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Total Users</h4>
              <div className="summary-value">{reportData.userBehavior.totalUsers}</div>
            </div>
            <div className="summary-card">
              <h4>Total Sessions</h4>
              <div className="summary-value">{reportData.userBehavior.totalSessions}</div>
            </div>
            <div className="summary-card">
              <h4>Avg Session Duration</h4>
              <div className="summary-value">{reportData.userBehavior.averageSessionDuration.toFixed(1)}m</div>
            </div>
          </div>

          <div className="detailed-tables">
            <div className="table-section">
              <h4>Most Used Features</h4>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Usage Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.userBehavior.mostUsedFeatures)
                    .sort(([,a], [,b]) => b - a)
                    .map(([feature, count]) => (
                    <tr key={feature}>
                      <td>{feature}</td>
                      <td>{count}</td>
                      <td>{((count / Object.values(reportData.userBehavior.mostUsedFeatures).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-section">
              <h4>Geographic Distribution</h4>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Users</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.userBehavior.geographicDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .map(([country, count]) => (
                    <tr key={country}>
                      <td>{country}</td>
                      <td>{count}</td>
                      <td>{((count / Object.values(reportData.userBehavior.geographicDistribution).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-data">No user behavior data available</div>
      )}
    </div>
  );

  const renderSystemPerformance = () => (
    <div className="admin-section">
      <h2>⚡ System Performance Analytics</h2>
      
      {reportData?.systemPerformance ? (
        <div className="analytics-content">
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Avg Response Time</h4>
              <div className="summary-value">{reportData.systemPerformance.averageResponseTime.toFixed(2)}ms</div>
            </div>
            <div className="summary-card">
              <h4>Error Rate</h4>
              <div className="summary-value">{reportData.systemPerformance.errorRate.toFixed(2)}%</div>
            </div>
            <div className="summary-card">
              <h4>Total Requests</h4>
              <div className="summary-value">{reportData.systemPerformance.totalRequests}</div>
            </div>
            <div className="summary-card">
              <h4>Failed Requests</h4>
              <div className="summary-value">{reportData.systemPerformance.failedRequests}</div>
            </div>
          </div>

          <div className="detailed-tables">
            <div className="table-section">
              <h4>Performance by Endpoint</h4>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Requests</th>
                    <th>Avg Response Time</th>
                    <th>Errors</th>
                    <th>Error Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.systemPerformance.byEndpoint).map(([endpoint, data]) => (
                    <tr key={endpoint}>
                      <td>{endpoint}</td>
                      <td>{data.requests}</td>
                      <td>{data.avgResponseTime.toFixed(2)}ms</td>
                      <td>{data.errors}</td>
                      <td>{((data.errors / data.requests) * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-section">
              <h4>Error Types</h4>
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Error Type</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reportData.systemPerformance.byErrorType)
                    .sort(([,a], [,b]) => b - a)
                    .map(([errorType, count]) => (
                    <tr key={errorType}>
                      <td>{errorType}</td>
                      <td>{count}</td>
                      <td>{((count / reportData.systemPerformance.failedRequests) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-data">No system performance data available</div>
      )}
    </div>
  );

  // Show login if no admin access
  if (!hasAdminAccess) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🍽️ Foodie Map Admin Dashboard</h1>
        <div className="admin-controls">
          <div className="date-range-selector">
            <label>From:</label>
            <input
              type="date"
              value={dateRange.startDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
            />
            <label>To:</label>
            <input
              type="date"
              value={dateRange.endDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
            />
          </div>
          
          <div className="export-buttons">
            <button 
              className="export-btn csv-btn"
              onClick={() => exportReport('csv')}
              disabled={!reportData}
            >
              📊 Export CSV
            </button>
            <button 
              className="export-btn pdf-btn"
              onClick={() => exportReport('pdf')}
              disabled={!reportData}
            >
              📄 Export PDF
            </button>
            <button 
              className="export-btn logout-btn"
              onClick={handleLogout}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="admin-main-tabs">
        <button 
          className={`main-tab-btn ${activeMainTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('analytics')}
        >
          📊 Analytics
        </button>
        <button 
          className={`main-tab-btn ${activeMainTab === 'restaurants' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('restaurants')}
        >
          🍽️ Restaurants
        </button>
        <button 
          className={`main-tab-btn ${activeMainTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={`main-tab-btn ${activeMainTab === 'beta' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('beta')}
        >
          🎯 Beta
        </button>
      </div>

      {/* Sub-tabs based on main tab */}
      {activeMainTab === 'analytics' && (
        <div className="admin-sub-tabs">
          <button 
            className={`sub-tab-btn ${activeSubTab.analytics === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSubTab({ ...activeSubTab, analytics: 'overview' })}
          >
            📊 Overview
          </button>
          <button 
            className={`sub-tab-btn ${activeSubTab.analytics === 'cost' ? 'active' : ''}`}
            onClick={() => setActiveSubTab({ ...activeSubTab, analytics: 'cost' })}
          >
            💰 Cost Analytics
          </button>
          <button 
            className={`sub-tab-btn ${activeSubTab.analytics === 'users' ? 'active' : ''}`}
            onClick={() => setActiveSubTab({ ...activeSubTab, analytics: 'users' })}
          >
            👤 User Behavior
          </button>
          <button 
            className={`sub-tab-btn ${activeSubTab.analytics === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveSubTab({ ...activeSubTab, analytics: 'performance' })}
          >
            ⚡ System Performance
          </button>
        </div>
      )}

      {activeMainTab === 'restaurants' && (
        <div className="admin-sub-tabs">
          <button 
            className={`sub-tab-btn ${activeSubTab.restaurants === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveSubTab({ ...activeSubTab, restaurants: 'submissions' })}
          >
            📝 Submissions
          </button>
          <button 
            className={`sub-tab-btn ${activeSubTab.restaurants === 'edits' ? 'active' : ''}`}
            onClick={() => setActiveSubTab({ ...activeSubTab, restaurants: 'edits' })}
          >
            ✏️ Edits
          </button>
          <button 
            className={`sub-tab-btn ${activeSubTab.restaurants === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveSubTab({ ...activeSubTab, restaurants: 'reviews' })}
          >
            ⭐ Reviews
          </button>
        </div>
      )}

      {activeMainTab === 'beta' && (
        <div className="admin-sub-tabs">
          <button 
            className={`sub-tab-btn ${activeSubTab.beta === 'cohort' ? 'active' : ''}`}
            onClick={() => setActiveSubTab({ ...activeSubTab, beta: 'cohort' })}
          >
            🎯 Cohort Scoring
          </button>
          <button 
            className={`sub-tab-btn ${activeSubTab.beta === 'waves' ? 'active' : ''}`}
            onClick={() => setActiveSubTab({ ...activeSubTab, beta: 'waves' })}
          >
            🌊 Waves
          </button>
          <button 
            className={`sub-tab-btn ${activeSubTab.beta === 'creators' ? 'active' : ''}`}
            onClick={() => setActiveSubTab({ ...activeSubTab, beta: 'creators' })}
          >
            ⭐ Creators
          </button>
        </div>
      )}

      <div className="admin-content">
        {loading && activeMainTab === 'analytics' ? (
          <div className="loading">Loading analytics data...</div>
        ) : (
          <>
            {/* Analytics Sub-tabs */}
            {activeMainTab === 'analytics' && activeSubTab.analytics === 'overview' && renderOverview()}
            {activeMainTab === 'analytics' && activeSubTab.analytics === 'cost' && renderCostAnalytics()}
            {activeMainTab === 'analytics' && activeSubTab.analytics === 'users' && renderUserBehavior()}
            {activeMainTab === 'analytics' && activeSubTab.analytics === 'performance' && renderSystemPerformance()}
            
            {/* Restaurants Sub-tabs */}
            {activeMainTab === 'restaurants' && activeSubTab.restaurants === 'submissions' && <RestaurantReviewDashboard />}
            {activeMainTab === 'restaurants' && activeSubTab.restaurants === 'edits' && <RestaurantEditReviewDashboard />}
            {activeMainTab === 'restaurants' && activeSubTab.restaurants === 'reviews' && <ReviewModerationDashboard />}
            
            {/* Users Tab */}
            {activeMainTab === 'users' && <UserManagementDashboard />}
            
            {/* Beta Sub-tabs */}
            {activeMainTab === 'beta' && activeSubTab.beta === 'cohort' && <AdminCohortDashboard />}
            {activeMainTab === 'beta' && activeSubTab.beta === 'waves' && <AdminWaveDashboard />}
            {activeMainTab === 'beta' && activeSubTab.beta === 'creators' && <AdminCreatorDashboard />}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
