import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { gamificationService } from '../services/gamificationService';
import { notificationService } from '../services/notificationService';
import { challengeService } from '../services/challengeService';
import { achievementService } from '../services/achievementService';
import { streakService } from '../services/streakService';
import './GamificationDashboard.css';

const GamificationDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [streaks, setStreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      loadUserStats();
      loadNotifications();
      loadChallenges();
      loadAchievements();
      loadStreaks();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const result = await gamificationService.getUserStats(user.uid);
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const result = await notificationService.getUserNotifications(user.uid, 10);
      if (result.success) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadChallenges = async () => {
    try {
      const result = await challengeService.getUserChallenges(user.uid);
      if (result.success) {
        setChallenges(result.challenges);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      const result = await achievementService.getUserAchievements(user.uid);
      if (result.success) {
        setAchievements(result.achievements);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadStreaks = async () => {
    try {
      const result = await streakService.getUserStreaks(user.uid);
      if (result.success) {
        setStreaks(result.streaks);
      }
    } catch (error) {
      console.error('Error loading streaks:', error);
    }
  };

  const handleUseStreakFreeze = async (streakType) => {
    try {
      const result = await streakService.useStreakFreeze(user.uid, streakType);
      if (result.success) {
        // Reload streaks and stats
        await loadStreaks();
        await loadUserStats();
        alert('Streak freeze used successfully!');
      } else {
        alert(result.error || 'Failed to use streak freeze');
      }
    } catch (error) {
      console.error('Error using streak freeze:', error);
      alert('An error occurred while using streak freeze');
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getBadgeColor = (badgeTier) => {
    return badgeTier?.color || '#87CEEB';
  };

  const getLevelProgressWidth = (progress) => {
    return Math.min(100, Math.max(0, progress));
  };

  if (loading) {
    return (
      <div className="gamification-dashboard">
        <div className="loading">Loading your gamification stats...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="gamification-dashboard">
        <div className="error">Failed to load gamification stats</div>
      </div>
    );
  }

  return (
    <div className="gamification-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2>🎮 Gamification Dashboard</h2>
        <div className="user-level">
          <span className="level-badge" style={{ backgroundColor: getBadgeColor(stats.badgeTier) }}>
            {stats.badgeTier?.emoji} Level {stats.currentLevel}
          </span>
          <span className="badge-name">{stats.badgeTier?.name}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Achievements
        </button>
        <button 
          className={`tab ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          🎯 Challenges
        </button>
        <button 
          className={`tab ${activeTab === 'streaks' ? 'active' : ''}`}
          onClick={() => setActiveTab('streaks')}
        >
          🔥 Streaks
        </button>
        <button 
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="notification-badge">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Points and Level Progress */}
          <div className="stats-grid">
            <div className="stat-card points-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalPoints.toLocaleString()}</div>
                <div className="stat-label">Total Points</div>
              </div>
            </div>

            <div className="stat-card level-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-value">{stats.currentLevel}</div>
                <div className="stat-label">Current Level</div>
                <div className="level-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${getLevelProgressWidth(stats.levelProgress)}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {stats.totalPoints.toLocaleString()} / {stats.nextLevelPoints.toLocaleString()} points
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="activity-stats">
            <h3>📊 Your Activity</h3>
            <div className="activity-grid">
              <div className="activity-item">
                <div className="activity-icon">📍</div>
                <div className="activity-content">
                  <div className="activity-value">{stats.checkInCount}</div>
                  <div className="activity-label">Check-ins</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">⭐</div>
                <div className="activity-content">
                  <div className="activity-value">{stats.reviewCount}</div>
                  <div className="activity-label">Reviews</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">❤️</div>
                <div className="activity-content">
                  <div className="activity-value">{stats.favoritesCount}</div>
                  <div className="activity-label">Favorites</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🗺️</div>
                <div className="activity-content">
                  <div className="activity-value">{stats.routesCount}</div>
                  <div className="activity-label">Routes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Points */}
          <div className="recent-points">
            <h3>💰 Recent Points</h3>
            <div className="points-list">
              {stats.recentPoints.slice(0, 5).map((point, index) => (
                <div key={index} className="point-item">
                  <div className="point-action">{point.action}</div>
                  <div className="point-value">+{point.points}</div>
                  <div className="point-time">
                    {new Date(point.timestamp?.toDate?.() || point.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="tab-content">
          <div className="achievements-section">
            <h3>🏆 Your Achievements</h3>
            <div className="achievements-grid">
              {achievements.length > 0 ? (
                achievements.map((achievement, index) => (
                  <div key={index} className="achievement-card">
                    <div className="achievement-icon">{achievement.emoji}</div>
                    <div className="achievement-content">
                      <div className="achievement-title">{achievement.title}</div>
                      <div className="achievement-description">{achievement.description}</div>
                      <div className="achievement-points">+{achievement.points} points</div>
                      <div className="achievement-date">
                        Unlocked: {new Date(achievement.unlockedAt?.toDate?.() || achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="achievement-placeholder">
                  <div className="achievement-icon">🏆</div>
                  <div className="achievement-text">
                    <div className="achievement-title">No achievements yet!</div>
                    <div className="achievement-description">
                      Complete actions to unlock achievements and earn badges.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="tab-content">
          <div className="challenges-section">
            <h3>🎯 Your Challenges</h3>
            
            {/* Daily Challenges */}
            <div className="challenge-category">
              <h4>📅 Daily Challenges</h4>
              <div className="challenges-list">
                {challenges.filter(c => c.type === 'daily').length > 0 ? (
                  challenges.filter(c => c.type === 'daily').map((challenge, index) => (
                    <div key={index} className={`challenge-item ${challenge.completed ? 'completed' : ''}`}>
                      <div className="challenge-icon">{challenge.emoji}</div>
                      <div className="challenge-content">
                        <div className="challenge-title">{challenge.title}</div>
                        <div className="challenge-description">{challenge.description}</div>
                        <div className="challenge-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{challenge.progress}/{challenge.target}</span>
                        </div>
                      </div>
                      <div className="challenge-points">+{challenge.points} Pts</div>
                    </div>
                  ))
                ) : (
                  <div className="no-challenges">No daily challenges available right now.</div>
                )}
              </div>
            </div>

            {/* Weekly Challenges */}
            <div className="challenge-category">
              <h4>📆 Weekly Challenges</h4>
              <div className="challenges-list">
                {challenges.filter(c => c.type === 'weekly').length > 0 ? (
                  challenges.filter(c => c.type === 'weekly').map((challenge, index) => (
                    <div key={index} className={`challenge-item ${challenge.completed ? 'completed' : ''}`}>
                      <div className="challenge-icon">{challenge.emoji}</div>
                      <div className="challenge-content">
                        <div className="challenge-title">{challenge.title}</div>
                        <div className="challenge-description">{challenge.description}</div>
                        <div className="challenge-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{challenge.progress}/{challenge.target}</span>
                        </div>
                      </div>
                      <div className="challenge-points">+{challenge.points} Pts</div>
                    </div>
                  ))
                ) : (
                  <div className="no-challenges">No weekly challenges available right now.</div>
                )}
              </div>
            </div>

            {/* Monthly Challenges */}
            <div className="challenge-category">
              <h4>📅 Monthly Challenges</h4>
              <div className="challenges-list">
                {challenges.filter(c => c.type === 'monthly').length > 0 ? (
                  challenges.filter(c => c.type === 'monthly').map((challenge, index) => (
                    <div key={index} className={`challenge-item ${challenge.completed ? 'completed' : ''}`}>
                      <div className="challenge-icon">{challenge.emoji}</div>
                      <div className="challenge-content">
                        <div className="challenge-title">{challenge.title}</div>
                        <div className="challenge-description">{challenge.description}</div>
                        <div className="challenge-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{challenge.progress}/{challenge.target}</span>
                        </div>
                      </div>
                      <div className="challenge-points">+{challenge.points} Pts</div>
                    </div>
                  ))
                ) : (
                  <div className="no-challenges">No monthly challenges available right now.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streaks Tab */}
      {activeTab === 'streaks' && (
        <div className="tab-content">
          <div className="streaks-section">
            <h3>🔥 Your Streaks</h3>
            
            {streaks.length > 0 ? (
              <div className="streaks-list">
                {streaks.map((streak, index) => (
                  <div key={index} className="streak-item">
                    <div className="streak-icon">
                      {streak.streakType === 'daily' ? '📅' : 
                       streak.streakType === 'weekly' ? '📆' : '📅'}
                    </div>
                    <div className="streak-content">
                      <div className="streak-title">
                        {streak.streakType.charAt(0).toUpperCase() + streak.streakType.slice(1)} Streak
                      </div>
                      <div className="streak-stats">
                        <div className="streak-current">
                          <span className="streak-number">{streak.currentStreak}</span>
                          <span className="streak-label">Current</span>
                        </div>
                        <div className="streak-max">
                          <span className="streak-number">{streak.maxStreak}</span>
                          <span className="streak-label">Best</span>
                        </div>
                        <div className="streak-total">
                          <span className="streak-number">{streak.totalActivities}</span>
                          <span className="streak-label">Total</span>
                        </div>
                      </div>
                      <div className="streak-freezes">
                        <span className="freeze-icon">❄️</span>
                        <span className="freeze-count">{streak.streakFreezes} freezes available</span>
                      </div>
                      <div className="streak-last-activity">
                        Last activity: {new Date(streak.lastActivityDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="streak-actions">
                      <button 
                        className="freeze-button"
                        onClick={() => handleUseStreakFreeze(streak.streakType)}
                        disabled={streak.streakFreezes <= 0}
                      >
                        Use Freeze (50 pts)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-streaks">
                <div className="no-streaks-icon">🔥</div>
                <div className="no-streaks-text">No streaks yet! Start checking in to build your streaks.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="tab-content">
          <div className="notifications-section">
            <h3>🔔 Notifications</h3>
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="no-notifications-icon">🔔</div>
                <div className="no-notifications-text">No notifications yet</div>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {new Date(notification.timestamp?.toDate?.() || notification.timestamp).toLocaleString()}
                      </div>
                    </div>
                    {!notification.read && <div className="unread-indicator"></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationDashboard;
