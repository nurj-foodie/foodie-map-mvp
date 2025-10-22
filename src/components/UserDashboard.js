import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GamificationDashboard from './GamificationDashboard';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    await logout();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="dashboard-tab">
            <h3>Overview</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">12</div>
                <div className="stat-label">Routes Discovered</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">8</div>
                <div className="stat-label">Restaurants Visited</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">24</div>
                <div className="stat-label">Reviews Written</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">156</div>
                <div className="stat-label">Points Earned</div>
              </div>
            </div>
            
            <div className="recent-activity">
              <h4>Recent Activity</h4>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">🍽️</div>
                  <div className="activity-content">
                    <div className="activity-title">Reviewed Nasi Lemak Stall</div>
                    <div className="activity-time">2 hours ago</div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">🗺️</div>
                  <div className="activity-content">
                    <div className="activity-title">Discovered new route to KL</div>
                    <div className="activity-time">1 day ago</div>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">⭐</div>
                  <div className="activity-content">
                    <div className="activity-title">Earned Explorer badge</div>
                    <div className="activity-time">3 days ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'social':
        return (
          <div className="dashboard-tab">
            <h3>Social</h3>
            <div className="social-stats">
              <div className="social-stat">
                <div className="social-number">42</div>
                <div className="social-label">Followers</div>
              </div>
              <div className="social-stat">
                <div className="social-number">28</div>
                <div className="social-label">Following</div>
              </div>
            </div>
            
            <div className="social-feed">
              <h4>Recent Posts</h4>
              <div className="post-list">
                <div className="post-item">
                  <div className="post-content">
                    <div className="post-text">Just discovered an amazing laksa place in Penang! 🍜</div>
                    <div className="post-meta">2 hours ago • 5 likes</div>
                  </div>
                </div>
                <div className="post-item">
                  <div className="post-content">
                    <div className="post-text">Road trip to Ipoh was incredible! Found 3 hidden gems 🚗</div>
                    <div className="post-meta">1 day ago • 12 likes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'gamification':
        return <GamificationDashboard />;

      default:
        return null;
    }
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <div className="user-info">
          <div className="user-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="user-details">
            <h2>{user?.displayName || 'User'}</h2>
            <p>{user?.email}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          Social
        </button>
        <button 
          className={`tab-btn ${activeTab === 'gamification' ? 'active' : ''}`}
          onClick={() => setActiveTab('gamification')}
        >
          Gamification
        </button>
      </div>

      <div className="dashboard-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default UserDashboard;



