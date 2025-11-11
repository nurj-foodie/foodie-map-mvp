import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import './UserManagementDashboard.css';

const UserManagementDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, suspended, banned
  const [isProcessing, setIsProcessing] = useState(false);

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading users...');
      
      const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      let usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by status
      if (filterStatus !== 'all') {
        usersList = usersList.filter(user => {
          const accountStatus = user.accountStatus || 'active';
          return accountStatus === filterStatus;
        });
      }

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        usersList = usersList.filter(user => 
          (user.email && user.email.toLowerCase().includes(term)) ||
          (user.displayName && user.displayName.toLowerCase().includes(term)) ||
          (user.uid && user.uid.toLowerCase().includes(term))
        );
      }
      
      setUsers(usersList);
      console.log(`✅ Loaded ${usersList.length} users`);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filterStatus, searchTerm]);

  // Load user stats
  const loadUserStats = async (userId) => {
    try {
      // Load user total points (document ID = userId)
      let totalPoints = 0;
      try {
        const pointsDocRef = doc(db, 'userPoints', userId);
        const pointsDocSnap = await getDoc(pointsDocRef);
        if (pointsDocSnap.exists()) {
          totalPoints = pointsDocSnap.data()?.totalPoints || 0;
        }
      } catch (pointsError) {
        console.warn('⚠️ Error loading total points:', pointsError);
      }
      
      // Load saved routes count
      let routesCount = 0;
      try {
        const routesSnapshot = await getDocs(query(
          collection(db, 'saved_routes'),
          where('userId', '==', userId)
        ));
        routesCount = routesSnapshot.size;
      } catch (routesError) {
        console.warn('⚠️ Error loading routes:', routesError);
      }
      
      // Load favorites count
      let favoritesCount = 0;
      try {
        const favoritesSnapshot = await getDocs(query(
          collection(db, 'favorites'),
          where('userId', '==', userId)
        ));
        favoritesCount = favoritesSnapshot.size;
      } catch (favoritesError) {
        console.warn('⚠️ Error loading favorites:', favoritesError);
      }
      
      // Load reviews count
      let reviewsCount = 0;
      try {
        const reviewsSnapshot = await getDocs(query(
          collection(db, 'reviews'),
          where('userId', '==', userId)
        ));
        reviewsCount = reviewsSnapshot.size;
      } catch (reviewsError) {
        console.warn('⚠️ Error loading reviews:', reviewsError);
      }

      return {
        totalPoints,
        routesCount,
        favoritesCount,
        reviewsCount
      };
    } catch (error) {
      console.error('❌ Error loading user stats:', error);
      return {
        totalPoints: 0,
        routesCount: 0,
        favoritesCount: 0,
        reviewsCount: 0
      };
    }
  };

  // Update user status
  const updateUserStatus = async (userId, status, reason = '') => {
    try {
      setIsProcessing(true);
      console.log(`🔄 Updating user ${userId} status to ${status}`);
      
      await updateDoc(doc(db, 'users', userId), {
        accountStatus: status,
        statusUpdatedAt: new Date(),
        statusReason: reason || '',
        ...(status === 'suspended' && { suspendedAt: new Date() }),
        ...(status === 'banned' && { bannedAt: new Date() })
      });

      // Reload users
      await loadUsers();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, accountStatus: status });
      }
      
      console.log(`✅ User status updated to ${status}`);
      window.alert(`✅ User status updated to ${status}`);
    } catch (error) {
      console.error('❌ Error updating user status:', error);
      window.alert('Error updating user status. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'suspended': return '#ffc107';
      case 'banned': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Load stats when user is selected
  useEffect(() => {
    if (selectedUser) {
      const loadStats = async () => {
        setLoadingStats(true);
        const stats = await loadUserStats(selectedUser.id);
        setUserStats(stats);
        setLoadingStats(false);
      };
      loadStats();
    } else {
      setUserStats(null);
    }
  }, [selectedUser]);

  // Render user details modal
  const renderUserModal = () => {
    if (!selectedUser) return null;

    return (
      <div className="user-modal-overlay" onClick={() => setSelectedUser(null)}>
        <div className="user-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>User Details</h3>
            <button 
              className="close-btn"
              onClick={() => setSelectedUser(null)}
            >
              ×
            </button>
          </div>
          
          <div className="modal-content">
            <div className="user-profile">
              <div className="user-avatar">
                {selectedUser.photoURL ? (
                  <img 
                    src={selectedUser.photoURL} 
                    alt={selectedUser.displayName || 'User'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="avatar-placeholder"
                  style={{ display: selectedUser.photoURL ? 'none' : 'flex' }}
                >
                  {selectedUser.displayName?.[0]?.toUpperCase() || selectedUser.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
              <div className="user-info">
                <h4>{selectedUser.displayName || 'No Name'}</h4>
                <p>{selectedUser.email || 'No Email'}</p>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusBadgeColor(selectedUser.accountStatus || 'active') }}
                >
                  {(selectedUser.accountStatus || 'active').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="user-details-grid">
              <div className="detail-item">
                <strong>User ID:</strong>
                <span>{selectedUser.id}</span>
              </div>
              <div className="detail-item">
                <strong>UID:</strong>
                <span>{selectedUser.uid || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <strong>Created:</strong>
                <span>{formatDate(selectedUser.createdAt)}</span>
              </div>
              <div className="detail-item">
                <strong>Last Login:</strong>
                <span>{formatDate(selectedUser.lastLoginAt) || 'N/A'}</span>
              </div>
            </div>

            {loadingStats ? (
              <div className="loading-stats">Loading user statistics...</div>
            ) : userStats && (
              <div className="user-stats">
                <h4>User Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{userStats.totalPoints}</div>
                    <div className="stat-label">Total Points</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{userStats.routesCount}</div>
                    <div className="stat-label">Saved Routes</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{userStats.favoritesCount}</div>
                    <div className="stat-label">Favorites</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{userStats.reviewsCount}</div>
                    <div className="stat-label">Reviews</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-actions">
            {selectedUser.accountStatus !== 'suspended' && (
              <button 
                className="btn-suspend"
                onClick={() => {
                  const reason = window.prompt('Please provide a reason for suspension (optional):');
                  updateUserStatus(selectedUser.id, 'suspended', reason);
                }}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : '⏸️ Suspend User'}
              </button>
            )}
            {selectedUser.accountStatus === 'suspended' && (
              <button 
                className="btn-activate"
                onClick={() => updateUserStatus(selectedUser.id, 'active', 'Reinstated by admin')}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : '✅ Activate User'}
              </button>
            )}
            {selectedUser.accountStatus !== 'banned' && (
              <button 
                className="btn-ban"
                onClick={() => {
                  const reason = window.prompt('Please provide a reason for ban (optional):');
                  if (window.confirm('Are you sure you want to ban this user? This action cannot be undone.')) {
                    updateUserStatus(selectedUser.id, 'banned', reason);
                  }
                }}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : '🚫 Ban User'}
              </button>
            )}
            {selectedUser.accountStatus === 'banned' && (
              <button 
                className="btn-activate"
                onClick={() => {
                  if (window.confirm('Are you sure you want to unban this user?')) {
                    updateUserStatus(selectedUser.id, 'active', 'Unbanned by admin');
                  }
                }}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : '✅ Unban User'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="user-management-dashboard">
      <div className="dashboard-header">
        <h2>👥 User Management</h2>
        <p>Manage users, view activity, and handle account issues</p>
      </div>

      <div className="dashboard-controls">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search by email, name, or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="status-filter">
          <label>Filter by status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
        
        <button 
          className="refresh-btn"
          onClick={loadUsers}
          disabled={loading}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner">🔄</div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="users-list">
          {users.length === 0 ? (
            <div className="empty-state">
              <p>No users found matching your criteria.</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.displayName || 'User'} 
                            className="user-avatar-small"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="avatar-placeholder-small"
                          style={{ display: user.photoURL ? 'none' : 'flex' }}
                        >
                          {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span>{user.displayName || 'No Name'}</span>
                      </div>
                    </td>
                    <td>{user.email || 'N/A'}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusBadgeColor(user.accountStatus || 'active') }}
                      >
                        {(user.accountStatus || 'active').toUpperCase()}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>{formatDate(user.lastLoginAt) || 'Never'}</td>
                    <td>
                      <button 
                        className="view-details-btn"
                        onClick={() => setSelectedUser(user)}
                      >
                        👁️ View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {renderUserModal()}
    </div>
  );
};

export default UserManagementDashboard;

