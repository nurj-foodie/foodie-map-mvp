import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { gamificationService } from '../services/gamificationService';
import GamificationDashboard from './GamificationDashboard';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user, logout, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    routesCount: 0,
    favoritesCount: 0,
    reviewCount: 0,
    totalPoints: 0,
    recentPoints: []
  });
  const [loading, setLoading] = useState(true);
  
  // Settings state
  const [displayName, setDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [userPhotoURL, setUserPhotoURL] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.uid) {
      loadUserStats();
      loadUserPhoto();
      setDisplayName(user.displayName || '');
    }
  }, [user?.uid, user?.displayName]);

  // Load user photo from Firestore (supports base64)
  const loadUserPhoto = async () => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        // Use Firestore photoURL if available (supports base64), otherwise use Auth photoURL
        setUserPhotoURL(userData.photoURL || user.photoURL || null);
      } else {
        // Fallback to Auth photoURL
        setUserPhotoURL(user.photoURL || null);
      }
    } catch (error) {
      console.error('Error loading user photo:', error);
      setUserPhotoURL(user.photoURL || null);
    }
  };

  const loadUserStats = async () => {
    try {
      setLoading(true);
      
      // Check if user has a custom userId stored (for routes saved before login)
      const customUserId = localStorage.getItem('foodie_user_id');
      console.log('📊 Loading stats:', { 
        firebaseUid: user.uid, 
        customUserId: customUserId || 'none' 
      });
      
      // Try Firebase auth uid first (for favorites, reviews, etc.)
      const result = await gamificationService.getUserStats(user.uid);
      
      if (result.success && result.stats) {
        // If we have a custom userId, also check routes with that ID
        let routesCount = result.stats.routesCount || 0;
        if (customUserId && customUserId !== user.uid) {
          console.log('🔍 Checking routes with custom userId:', customUserId);
          const customRoutesCount = await gamificationService.getUserRoutesCount(customUserId);
          routesCount += customRoutesCount;
          console.log(`📊 Total routes: ${routesCount} (${result.stats.routesCount} + ${customRoutesCount})`);
        }
        
        setStats({
          routesCount,
          favoritesCount: result.stats.favoritesCount || 0,
          reviewCount: result.stats.reviewCount || 0,
          totalPoints: result.stats.totalPoints || 0,
          recentPoints: result.stats.recentPoints || []
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('check') || actionLower.includes('visit')) return '📍';
    if (actionLower.includes('review')) return '🍽️';
    if (actionLower.includes('route') || actionLower.includes('discover')) return '🗺️';
    if (actionLower.includes('favorite') || actionLower.includes('save')) return '❤️';
    if (actionLower.includes('badge') || actionLower.includes('achievement')) return '⭐';
    return '✨';
  };

  // Handle photo upload (using base64 - no Firebase Storage needed)
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSettingsError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB for base64 - smaller than Storage limit)
    if (file.size > 2 * 1024 * 1024) {
      setSettingsError('Image size must be less than 2MB');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setSettingsError('');
      setSettingsSuccess('');

      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result;
          
          // Update user profile with base64 image
          const result = await updateUserProfile({ photoURL: base64String });
          
          if (result.success) {
            // Reload photo from Firestore
            await loadUserPhoto();
            setSettingsSuccess('Profile photo updated successfully!');
            // Clear success message after 3 seconds
            setTimeout(() => setSettingsSuccess(''), 3000);
          } else {
            setSettingsError(result.error || 'Failed to update profile photo');
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          setSettingsError('Failed to update profile photo. Please try again.');
        } finally {
          setIsUploadingPhoto(false);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      
      reader.onerror = () => {
        setSettingsError('Failed to read image file');
        setIsUploadingPhoto(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setSettingsError('Failed to upload photo. Please try again.');
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle username change
  const handleUsernameChange = async () => {
    if (!displayName.trim()) {
      setSettingsError('Username cannot be empty');
      return;
    }

    if (displayName === user.displayName) {
      setIsEditingName(false);
      return;
    }

    try {
      setSettingsError('');
      setSettingsSuccess('');

      const result = await updateUserProfile({ displayName: displayName.trim() });
      
      if (result.success) {
        setSettingsSuccess('Username updated successfully!');
        setIsEditingName(false);
        // Clear success message after 3 seconds
        setTimeout(() => setSettingsSuccess(''), 3000);
      } else {
        setSettingsError(result.error || 'Failed to update username');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      setSettingsError('Failed to update username. Please try again.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="dashboard-tab">
            <h3>Overview</h3>
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading your stats...</p>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-number">{stats.routesCount}</div>
                    <div className="stat-label">Routes Discovered</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.favoritesCount}</div>
                    <div className="stat-label">Restaurants Favorited</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.reviewCount}</div>
                    <div className="stat-label">Reviews Written</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.totalPoints}</div>
                    <div className="stat-label">Points Earned</div>
                  </div>
                </div>
                
                <div className="recent-activity">
                  <h4>Recent Activity</h4>
                  {stats.recentPoints && stats.recentPoints.length > 0 ? (
                    <div className="activity-list">
                      {stats.recentPoints.slice(0, 5).map((point, index) => (
                        <div key={index} className="activity-item">
                          <div className="activity-icon">{getActivityIcon(point.action)}</div>
                          <div className="activity-content">
                            <div className="activity-title">{point.action || 'Earned points'}</div>
                            <div className="activity-time">{formatTimeAgo(point.timestamp)}</div>
                          </div>
                          <div className="activity-points">+{point.points || 0}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📊</div>
                      <div className="empty-text">No recent activity yet. Start exploring to see your activity here!</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );

      case 'social':
        return (
          <div className="dashboard-tab">
            <h3>Social</h3>
            <div className="coming-soon-placeholder">
              <div className="coming-soon-icon">👥</div>
              <div className="coming-soon-title">Social Features Coming Soon</div>
              <div className="coming-soon-description">
                Connect with other foodies, share your discoveries, and follow your friends' food adventures.
                <br />
                <br />
                Stay tuned for updates!
              </div>
            </div>
          </div>
        );

      case 'gamification':
        return <GamificationDashboard />;

      case 'settings':
        return (
          <div className="dashboard-tab">
            <h3>Settings</h3>
            
            {settingsError && (
              <div className="settings-message settings-error">
                {settingsError}
              </div>
            )}
            
            {settingsSuccess && (
              <div className="settings-message settings-success">
                {settingsSuccess}
              </div>
            )}

            <div className="settings-section">
              <h4>Profile Photo</h4>
              <div className="settings-photo-section">
                <div className="settings-photo-preview">
                  {userPhotoURL ? (
                    <img src={userPhotoURL} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="settings-photo-actions">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                    id="photo-upload-input"
                  />
                  <label htmlFor="photo-upload-input" className="settings-btn settings-btn-primary">
                    {isUploadingPhoto ? '📤 Uploading...' : '📷 Change Photo'}
                  </label>
                  <p className="settings-hint">Max file size: 2MB. Supported formats: JPG, PNG, GIF</p>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h4>Display Name</h4>
              <div className="settings-name-section">
                {isEditingName ? (
                  <div className="settings-name-edit">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="settings-input"
                      placeholder="Enter your display name"
                      maxLength={50}
                    />
                    <div className="settings-name-actions">
                      <button
                        onClick={handleUsernameChange}
                        className="settings-btn settings-btn-primary"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setDisplayName(user.displayName || '');
                          setIsEditingName(false);
                          setSettingsError('');
                        }}
                        className="settings-btn settings-btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="settings-name-display">
                    <p className="settings-name-value">{user?.displayName || 'Not set'}</p>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="settings-btn settings-btn-secondary"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="settings-section">
              <h4>Email</h4>
              <p className="settings-email">{user?.email}</p>
              <p className="settings-hint">Email cannot be changed. Contact support if you need to update your email.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <div className="user-info">
          <div className="user-avatar">
            {userPhotoURL ? (
              <img src={userPhotoURL} alt="Profile" />
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
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('settings');
            setSettingsError('');
            setSettingsSuccess('');
          }}
        >
          Settings
        </button>
      </div>

      <div className="dashboard-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default UserDashboard;



