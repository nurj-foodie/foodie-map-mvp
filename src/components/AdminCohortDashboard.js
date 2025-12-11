import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { cohortScoringService } from '../services/cohortScoringService';
import { waitlistService } from '../services/waitlistService';
import { grantBetaAccess } from '../utils/betaAccess';
import './AdminCohortDashboard.css';

const AdminCohortDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [waitlistUsers, setWaitlistUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filters, setFilters] = useState({
    minScore: undefined,
    maxScore: undefined,
    hasSurvey: false,
    corridor: '',
    driveFrequency: '',
    isCreator: false,
    hasBetaAccess: undefined, // undefined = all, true = has access, false = no access
    sortBy: 'score'
  });
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(null);
  const [showAdjustScore, setShowAdjustScore] = useState(null);
  const [adjustScoreValue, setAdjustScoreValue] = useState('');
  const [adjustScoreReason, setAdjustScoreReason] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    averageScore: 0,
    topScore: 0,
    withSurvey: 0,
    withBetaAccess: 0,
    creators: 0
  });

  useEffect(() => {
    loadCohortData();
    
    // Set up real-time listener for waitlist changes
    const unsubscribe = onSnapshot(
      collection(db, 'waitlist'),
      async (snapshot) => {
        // When waitlist changes, reload cohort data
        console.log('📊 Waitlist updated, refreshing cohort data...');
        await loadCohortData();
      },
      (error) => {
        console.error('Error listening to waitlist changes:', error);
      }
    );
    
    // Cleanup listener on unmount
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
  }, [waitlistUsers, filters]);

  const loadCohortData = async () => {
    setLoading(true);
    try {
      const result = await cohortScoringService.getTopCohort(1000, { sortBy: 'score' });
      
      if (result.success) {
        setWaitlistUsers(result.users || []);
        calculateStats(result.users || []);
      } else {
        console.error('Error loading cohort data:', result.error);
      }
    } catch (error) {
      console.error('Error loading cohort data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (users) => {
    if (users.length === 0) {
      setStats({
        total: 0,
        averageScore: 0,
        topScore: 0,
        withSurvey: 0,
        withBetaAccess: 0,
        creators: 0
      });
      return;
    }

    const total = users.length;
    const scores = users.map(u => u.calculatedScore || 0);
    const averageScore = scores.reduce((a, b) => a + b, 0) / total;
    const topScore = Math.max(...scores);
    const withSurvey = users.filter(u => u.surveyCompleted).length;
    const withBetaAccess = users.filter(u => u.betaAccessGranted).length;
    const creators = users.filter(u => u.isCreator && u.creatorApproved).length;

    setStats({
      total,
      averageScore: Math.round(averageScore),
      topScore,
      withSurvey,
      withBetaAccess,
      creators
    });
  };

  const applyFilters = () => {
    let filtered = [...waitlistUsers];

    if (filters.minScore !== undefined && filters.minScore !== '') {
      filtered = filtered.filter(u => (u.calculatedScore || 0) >= Number(filters.minScore));
    }

    if (filters.maxScore !== undefined && filters.maxScore !== '') {
      filtered = filtered.filter(u => (u.calculatedScore || 0) <= Number(filters.maxScore));
    }

    if (filters.hasSurvey) {
      filtered = filtered.filter(u => u.surveyCompleted === true);
    }

    if (filters.corridor) {
      filtered = filtered.filter(u => {
        const corridor = u.surveyData?.corridor || '';
        return corridor.toLowerCase().includes(filters.corridor.toLowerCase());
      });
    }

    if (filters.driveFrequency) {
      filtered = filtered.filter(u => u.surveyData?.driveFrequency === filters.driveFrequency);
    }

    if (filters.isCreator) {
      filtered = filtered.filter(u => u.isCreator === true && u.creatorApproved === true);
    }

    if (filters.hasBetaAccess === true) {
      filtered = filtered.filter(u => u.betaAccessGranted === true);
    } else if (filters.hasBetaAccess === false) {
      filtered = filtered.filter(u => u.betaAccessGranted !== true);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'score':
          return (b.calculatedScore || 0) - (a.calculatedScore || 0);
        case 'signupOrder':
          return (a.signupOrder || 0) - (b.signupOrder || 0);
        case 'referrals':
          const aRefs = a.scoreBreakdown?.referrals?.count || 0;
          const bRefs = b.scoreBreakdown?.referrals?.count || 0;
          return bRefs - aRefs;
        case 'engagement':
          const aEng = a.scoreBreakdown?.emailEngagement?.score || 0;
          const bEng = b.scoreBreakdown?.emailEngagement?.score || 0;
          return bEng - aEng;
        default:
          return (b.calculatedScore || 0) - (a.calculatedScore || 0);
      }
    });

    setFilteredUsers(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
  };

  const deselectAll = () => {
    setSelectedUsers(new Set());
  };

  const handleGrantBetaAccess = async (userId) => {
    try {
      const waitlistDoc = await waitlistService.checkBetaAccess(userId);
      if (waitlistDoc.success && waitlistDoc.waitlistData) {
        const result = await grantBetaAccess(waitlistDoc.waitlistData.email);
        if (result.success) {
          alert('Beta access granted successfully!');
          loadCohortData(); // Reload to refresh data
        } else {
          alert(`Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error granting beta access:', error);
      alert('Error granting beta access');
    }
  };

  const handleBulkGrantAccess = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select users first');
      return;
    }

    if (!window.confirm(`Grant beta access to ${selectedUsers.size} selected users?`)) {
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const userId of selectedUsers) {
      try {
        const waitlistDoc = await waitlistService.checkBetaAccess(userId);
        if (waitlistDoc.success && waitlistDoc.waitlistData) {
          const result = await grantBetaAccess(waitlistDoc.waitlistData.email);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        }
      } catch (error) {
        errorCount++;
      }
    }

    alert(`Beta access granted: ${successCount} successful, ${errorCount} errors`);
    setSelectedUsers(new Set());
    loadCohortData();
  };

  const handleAdjustScore = async () => {
    if (!showAdjustScore || !adjustScoreValue) {
      alert('Please enter a score adjustment value');
      return;
    }

    const points = Number(adjustScoreValue);
    if (isNaN(points)) {
      alert('Please enter a valid number');
      return;
    }

    try {
      const result = await cohortScoringService.updateScore(
        showAdjustScore,
        points,
        adjustScoreReason
      );

      if (result.success) {
        alert(`Score adjusted successfully! New score: ${result.newScore}`);
        setShowAdjustScore(null);
        setAdjustScoreValue('');
        setAdjustScoreReason('');
        loadCohortData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adjusting score:', error);
      alert('Error adjusting score');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Score', 'Signup Order', 'Corridor', 'Drive Frequency', 'Referrals', 'Creator', 'Beta Access'];
    const rows = filteredUsers.map(user => [
      user.name || '',
      user.email || '',
      user.calculatedScore || 0,
      user.signupOrder || 0,
      user.surveyData?.corridor || '',
      user.surveyData?.driveFrequency || '',
      user.scoreBreakdown?.referrals?.count || 0,
      (user.isCreator && user.creatorApproved) ? 'Yes' : 'No',
      user.betaAccessGranted ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cohort-scoring-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getScoreColor = (score) => {
    if (score >= 800) return '#28a745'; // Green
    if (score >= 600) return '#007bff'; // Blue
    if (score >= 400) return '#ffc107'; // Yellow
    return '#6c757d'; // Gray
  };

  if (loading) {
    return (
      <div className="cohort-dashboard">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Loading cohort data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cohort-dashboard">
      <div className="dashboard-header">
        <h2>🎯 Cohort Scoring Dashboard</h2>
        <p>Manage waitlist user scores and beta access</p>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.averageScore}</div>
          <div className="stat-label">Avg Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.topScore}</div>
          <div className="stat-label">Top Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.withSurvey}</div>
          <div className="stat-label">With Survey</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.withBetaAccess}</div>
          <div className="stat-label">Beta Access</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.creators}</div>
          <div className="stat-label">Creators</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-panel">
        <div className="filter-group">
          <label>Score Range:</label>
          <input
            type="number"
            placeholder="Min"
            value={filters.minScore || ''}
            onChange={(e) => handleFilterChange('minScore', e.target.value || undefined)}
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxScore || ''}
            onChange={(e) => handleFilterChange('maxScore', e.target.value || undefined)}
          />
        </div>

        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={filters.hasSurvey}
              onChange={(e) => handleFilterChange('hasSurvey', e.target.checked)}
            />
            Has Survey
          </label>
        </div>

        <div className="filter-group">
          <label>Corridor:</label>
          <input
            type="text"
            placeholder="Filter by corridor"
            value={filters.corridor}
            onChange={(e) => handleFilterChange('corridor', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Drive Frequency:</label>
          <select
            value={filters.driveFrequency}
            onChange={(e) => handleFilterChange('driveFrequency', e.target.value)}
          >
            <option value="">All</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="occasional">Occasional</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={filters.isCreator}
              onChange={(e) => handleFilterChange('isCreator', e.target.checked)}
            />
            Creators Only
          </label>
        </div>

        <div className="filter-group">
          <label>Beta Access:</label>
          <select
            value={filters.hasBetaAccess === undefined ? 'all' : filters.hasBetaAccess ? 'yes' : 'no'}
            onChange={(e) => {
              const value = e.target.value === 'all' ? undefined : e.target.value === 'yes';
              handleFilterChange('hasBetaAccess', value);
            }}
          >
            <option value="all">All</option>
            <option value="yes">Has Access</option>
            <option value="no">No Access</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="score">Score</option>
            <option value="signupOrder">Signup Order</option>
            <option value="referrals">Referrals</option>
            <option value="engagement">Engagement</option>
          </select>
        </div>

        <button className="clear-filters-btn" onClick={() => setFilters({
          minScore: undefined,
          maxScore: undefined,
          hasSurvey: false,
          corridor: '',
          driveFrequency: '',
          isCreator: false,
          hasBetaAccess: undefined,
          sortBy: 'score'
        })}>
          Clear Filters
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="bulk-actions-bar">
          <span>{selectedUsers.size} user(s) selected</span>
          <button className="bulk-action-btn" onClick={handleBulkGrantAccess}>
            Grant Beta Access ({selectedUsers.size})
          </button>
          <button className="bulk-action-btn secondary" onClick={deselectAll}>
            Deselect All
          </button>
        </div>
      )}

      {/* Actions Bar */}
      <div className="actions-bar">
        <button className="refresh-btn" onClick={loadCohortData}>
          🔄 Refresh
        </button>
        <button className="export-btn" onClick={exportToCSV}>
          📥 Export CSV
        </button>
        {selectedUsers.size === 0 && (
          <button className="select-all-btn" onClick={selectAll}>
            Select All ({filteredUsers.length})
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="users-table-wrapper">
        <table className="cohort-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Score</th>
              <th>Order</th>
              <th>Corridor</th>
              <th>Frequency</th>
              <th>Referrals</th>
              <th>Creator</th>
              <th>Beta Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="11" className="empty-state">
                  No users found matching filters
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                  </td>
                  <td>{user.name || '-'}</td>
                  <td>{user.email || '-'}</td>
                  <td>
                    <span 
                      className="score-badge"
                      style={{ backgroundColor: getScoreColor(user.calculatedScore || 0) }}
                    >
                      {user.calculatedScore || 0}
                    </span>
                  </td>
                  <td>{user.signupOrder || '-'}</td>
                  <td>{user.surveyData?.corridor || '-'}</td>
                  <td>{user.surveyData?.driveFrequency || '-'}</td>
                  <td>{user.scoreBreakdown?.referrals?.count || 0}</td>
                  <td>
                    {(user.isCreator && user.creatorApproved) ? (
                      <span className="badge creator-badge">⭐ Creator</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {user.betaAccessGranted ? (
                      <span className="badge success-badge">✓ Granted</span>
                    ) : (
                      <span className="badge pending-badge">Pending</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view-btn"
                        onClick={() => setShowScoreBreakdown(user.id)}
                      >
                        View
                      </button>
                      {!user.betaAccessGranted && (
                        <button
                          className="action-btn grant-btn"
                          onClick={() => handleGrantBetaAccess(user.id)}
                        >
                          Grant
                        </button>
                      )}
                      <button
                        className="action-btn adjust-btn"
                        onClick={() => setShowAdjustScore(user.id)}
                      >
                        Adjust
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Score Breakdown Modal */}
      {showScoreBreakdown && (
        <div className="modal-overlay" onClick={() => setShowScoreBreakdown(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Score Breakdown</h3>
              <button className="close-btn" onClick={() => setShowScoreBreakdown(null)}>×</button>
            </div>
            <div className="modal-body">
              {(() => {
                const user = filteredUsers.find(u => u.id === showScoreBreakdown);
                if (!user || !user.scoreBreakdown) return <p>Loading...</p>;
                
                const breakdown = user.scoreBreakdown;
                return (
                  <div className="score-breakdown">
                    <div className="breakdown-item">
                      <span className="breakdown-label">Base Score:</span>
                      <span className="breakdown-value">{breakdown.baseScore}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Corridor Fit:</span>
                      <span className="breakdown-value">{breakdown.corridorFit.score} 
                        {breakdown.corridorFit.corridor && ` (${breakdown.corridorFit.corridor})`}
                      </span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Drive Frequency:</span>
                      <span className="breakdown-value">{breakdown.driveFrequency.score}
                        {breakdown.driveFrequency.frequency && ` (${breakdown.driveFrequency.frequency})`}
                      </span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Referrals:</span>
                      <span className="breakdown-value">{breakdown.referrals.score} ({breakdown.referrals.count} referrals)</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Creator:</span>
                      <span className="breakdown-value">{breakdown.creator.score} {breakdown.creator.isCreator ? '(Yes)' : '(No)'}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Email Engagement:</span>
                      <span className="breakdown-value">{breakdown.emailEngagement.score} ({breakdown.emailEngagement.opens} opens, {breakdown.emailEngagement.clicks} clicks)</span>
                    </div>
                    <div className="breakdown-total">
                      <span className="breakdown-label">Total Score:</span>
                      <span className="breakdown-value total">{breakdown.totalScore}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Adjust Score Modal */}
      {showAdjustScore && (
        <div className="modal-overlay" onClick={() => setShowAdjustScore(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adjust Score</h3>
              <button className="close-btn" onClick={() => setShowAdjustScore(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Points to Add/Subtract:</label>
                <input
                  type="number"
                  value={adjustScoreValue}
                  onChange={(e) => setAdjustScoreValue(e.target.value)}
                  placeholder="e.g., +50 or -25"
                />
              </div>
              <div className="form-group">
                <label>Reason (optional):</label>
                <textarea
                  value={adjustScoreReason}
                  onChange={(e) => setAdjustScoreReason(e.target.value)}
                  placeholder="Reason for adjustment"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowAdjustScore(null)}>
                  Cancel
                </button>
                <button className="btn-submit" onClick={handleAdjustScore}>
                  Adjust Score
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCohortDashboard;
