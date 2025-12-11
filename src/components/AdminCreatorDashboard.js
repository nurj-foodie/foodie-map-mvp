import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { creatorService } from '../services/creatorService';
import './AdminCreatorDashboard.css';

const AdminCreatorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState([]);
  const [filteredCreators, setFilteredCreators] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedCreators, setSelectedCreators] = useState(new Set());
  const [showReferralStats, setShowReferralStats] = useState(null);
  const [filters, setFilters] = useState({
    approvedOnly: false,
    hasBetaAccess: undefined, // undefined = all, true = has access, false = no access
    sortBy: 'signupDate' // signupDate, referrals, betaActive
  });
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    withBetaAccess: 0,
    totalReferrals: 0,
    totalBetaActiveReferrals: 0
  });

  useEffect(() => {
    loadCreators();
    
    // Set up real-time listener for waitlist changes
    const unsubscribe = onSnapshot(
      collection(db, 'waitlist'),
      async (snapshot) => {
        console.log('📊 Waitlist updated, refreshing creators...');
        await loadCreators();
      },
      (error) => {
        console.error('Error listening to waitlist changes:', error);
      }
    );
    
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
  }, [creators, filters]);

  const loadCreators = async () => {
    setLoading(true);
    try {
      const result = await creatorService.getAllCreators({ approvedOnly: false });
      
      if (result.success) {
        setCreators(result.creators || []);
        calculateStats(result.creators || []);
      } else {
        console.error('Error loading creators:', result.error);
      }
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const result = await creatorService.getCreatorLeaderboard(20);
      
      if (result.success) {
        setLeaderboard(result.creators || []);
        setShowLeaderboard(true);
      } else {
        alert(`Error loading leaderboard: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      alert('Error loading leaderboard');
    }
  };

  const calculateStats = (creatorsList) => {
    if (creatorsList.length === 0) {
      setStats({
        total: 0,
        approved: 0,
        pending: 0,
        withBetaAccess: 0,
        totalReferrals: 0,
        totalBetaActiveReferrals: 0
      });
      return;
    }

    const total = creatorsList.length;
    const approved = creatorsList.filter(c => c.creatorApproved).length;
    const pending = total - approved;
    const withBetaAccess = creatorsList.filter(c => c.betaAccessGranted).length;
    const totalReferrals = creatorsList.reduce((sum, c) => {
      return sum + (c.referralStats?.totalReferrals || 0);
    }, 0);
    const totalBetaActiveReferrals = creatorsList.reduce((sum, c) => {
      return sum + (c.referralStats?.betaActiveReferrals || 0);
    }, 0);

    setStats({
      total,
      approved,
      pending,
      withBetaAccess,
      totalReferrals,
      totalBetaActiveReferrals
    });
  };

  const applyFilters = () => {
    let filtered = [...creators];

    // Filter by approval status
    if (filters.approvedOnly) {
      filtered = filtered.filter(c => c.creatorApproved === true);
    }

    // Filter by beta access
    if (filters.hasBetaAccess !== undefined) {
      filtered = filtered.filter(c => c.betaAccessGranted === filters.hasBetaAccess);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'referrals':
          const aRefs = a.referralStats?.totalReferrals || 0;
          const bRefs = b.referralStats?.totalReferrals || 0;
          return bRefs - aRefs;
        case 'betaActive':
          const aBeta = a.referralStats?.betaActiveReferrals || 0;
          const bBeta = b.referralStats?.betaActiveReferrals || 0;
          return bBeta - aBeta;
        case 'signupDate':
        default:
          const aDate = a.signupDate?.toDate ? a.signupDate.toDate() : new Date(0);
          const bDate = b.signupDate?.toDate ? b.signupDate.toDate() : new Date(0);
          return aDate - bDate;
      }
    });

    setFilteredCreators(filtered);
  };

  const handleFlagCreator = async (waitlistId, isCreator, approved = false) => {
    try {
      const result = await creatorService.flagAsCreator(waitlistId, isCreator, approved, true);
      
      if (result.success) {
        alert(`Creator flag updated successfully!`);
        loadCreators();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error flagging creator:', error);
      alert('Error flagging creator');
    }
  };

  const handleApproveCreator = async (waitlistId) => {
    if (!window.confirm('Approve this creator and grant automatic beta access?')) {
      return;
    }

    try {
      const result = await creatorService.flagAsCreator(waitlistId, true, true, true);
      
      if (result.success) {
        alert('Creator approved and beta access granted!');
        loadCreators();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error approving creator:', error);
      alert('Error approving creator');
    }
  };

  const handleGrantAccess = async (waitlistId) => {
    if (!window.confirm('Grant beta access to this creator?')) {
      return;
    }

    try {
      const result = await creatorService.grantCreatorAccess(waitlistId);
      
      if (result.success) {
        alert('Beta access granted!');
        loadCreators();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error granting access:', error);
      alert('Error granting access');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedCreators.size === 0) {
      alert('Please select creators to approve');
      return;
    }

    if (!window.confirm(`Approve ${selectedCreators.size} creators and grant automatic beta access?`)) {
      return;
    }

    try {
      const result = await creatorService.bulkApproveCreators(Array.from(selectedCreators), true);
      
      if (result.success) {
        alert(`Bulk approve: ${result.approved} approved, ${result.failed} failed`);
        setSelectedCreators(new Set());
        loadCreators();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error bulk approving creators:', error);
      alert('Error bulk approving creators');
    }
  };

  const handleViewReferrals = async (waitlistId) => {
    try {
      const result = await creatorService.getCreatorReferrals(waitlistId);
      
      if (result.success) {
        setShowReferralStats(result.stats);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error getting referral stats:', error);
      alert('Error getting referral stats');
    }
  };

  const toggleCreatorSelection = (waitlistId) => {
    setSelectedCreators(prev => {
      const newSet = new Set(prev);
      if (newSet.has(waitlistId)) {
        newSet.delete(waitlistId);
      } else {
        newSet.add(waitlistId);
      }
      return newSet;
    });
  };

  const selectAllCreators = () => {
    const pendingCreators = filteredCreators
      .filter(c => !c.creatorApproved)
      .map(c => c.id);
    setSelectedCreators(new Set(pendingCreators));
  };

  const deselectAllCreators = () => {
    setSelectedCreators(new Set());
  };

  if (loading) {
    return (
      <div className="creator-dashboard">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Loading creators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="creator-dashboard">
      <div className="dashboard-header">
        <h2>⭐ Creator System</h2>
        <p>Manage creator partnerships and track referral performance</p>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-label">Total Creators</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved</div>
          <div className="stat-value approved">{stats.approved}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value pending">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">With Beta Access</div>
          <div className="stat-value">{stats.withBetaAccess}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Referrals</div>
          <div className="stat-value">{stats.totalReferrals}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Beta Active Referrals</div>
          <div className="stat-value">{stats.totalBetaActiveReferrals}</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filters.approvedOnly}
                onChange={(e) => setFilters({ ...filters, approvedOnly: e.target.checked })}
              />
              Approved Only
            </label>
          </div>
          <div className="filter-group">
            <label>
              Beta Access:
              <select
                value={filters.hasBetaAccess === undefined ? 'all' : filters.hasBetaAccess ? 'yes' : 'no'}
                onChange={(e) => {
                  const value = e.target.value === 'all' ? undefined : e.target.value === 'yes';
                  setFilters({ ...filters, hasBetaAccess: value });
                }}
              >
                <option value="all">All</option>
                <option value="yes">Has Access</option>
                <option value="no">No Access</option>
              </select>
            </label>
          </div>
          <div className="filter-group">
            <label>
              Sort By:
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="signupDate">Signup Date</option>
                <option value="referrals">Total Referrals</option>
                <option value="betaActive">Beta Active Referrals</option>
              </select>
            </label>
          </div>
        </div>
        <div className="actions-row">
          <button className="btn-leaderboard" onClick={loadLeaderboard}>
            🏆 View Leaderboard
          </button>
          {selectedCreators.size > 0 && (
            <button className="btn-bulk-approve" onClick={handleBulkApprove}>
              ✅ Bulk Approve ({selectedCreators.size})
            </button>
          )}
          <button className="btn-refresh" onClick={loadCreators}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Creators Table */}
      <div className="creators-table-wrapper">
        <table className="creators-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedCreators.size > 0 && filteredCreators.filter(c => !c.creatorApproved).every(c => selectedCreators.has(c.id))}
                  onChange={(e) => e.target.checked ? selectAllCreators() : deselectAllCreators()}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Referrals</th>
              <th>Beta Active</th>
              <th>Beta Access</th>
              <th>Signup Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCreators.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  No creators found
                </td>
              </tr>
            ) : (
              filteredCreators.map((creator) => (
                <tr key={creator.id}>
                  <td>
                    {!creator.creatorApproved && (
                      <input
                        type="checkbox"
                        checked={selectedCreators.has(creator.id)}
                        onChange={() => toggleCreatorSelection(creator.id)}
                      />
                    )}
                  </td>
                  <td>{creator.name || '-'}</td>
                  <td>{creator.email || '-'}</td>
                  <td>
                    {creator.creatorApproved ? (
                      <span className="badge approved-badge">✓ Approved</span>
                    ) : (
                      <span className="badge pending-badge">Pending</span>
                    )}
                  </td>
                  <td>
                    <span className="referral-count">
                      {creator.referralStats?.totalReferrals || 0}
                    </span>
                  </td>
                  <td>
                    <span className="beta-active-count">
                      {creator.referralStats?.betaActiveReferrals || 0}
                    </span>
                  </td>
                  <td>
                    {creator.betaAccessGranted ? (
                      <span className="badge access-badge">✓ Granted</span>
                    ) : (
                      <span className="badge no-access-badge">No Access</span>
                    )}
                  </td>
                  <td>
                    {creator.signupDate?.toDate ? creator.signupDate.toDate().toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {!creator.creatorApproved && (
                        <button
                          className="btn-approve"
                          onClick={() => handleApproveCreator(creator.id)}
                        >
                          Approve
                        </button>
                      )}
                      {creator.creatorApproved && !creator.betaAccessGranted && (
                        <button
                          className="btn-grant-access"
                          onClick={() => handleGrantAccess(creator.id)}
                        >
                          Grant Access
                        </button>
                      )}
                      {creator.referralStats && creator.referralStats.totalReferrals > 0 && (
                        <button
                          className="btn-view-referrals"
                          onClick={() => handleViewReferrals(creator.id)}
                        >
                          View Referrals
                        </button>
                      )}
                      {creator.creatorApproved && (
                        <button
                          className="btn-unflag"
                          onClick={() => handleFlagCreator(creator.id, false, false)}
                        >
                          Unflag
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="modal-overlay" onClick={() => setShowLeaderboard(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏆 Creator Leaderboard</h3>
              <button className="close-btn" onClick={() => setShowLeaderboard(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="leaderboard-list">
                {leaderboard.map((creator, index) => (
                  <div key={creator.id} className="leaderboard-item">
                    <div className="leaderboard-rank">#{index + 1}</div>
                    <div className="leaderboard-info">
                      <div className="leaderboard-name">{creator.name || creator.email}</div>
                      <div className="leaderboard-stats">
                        <span>{creator.referralStats?.totalReferrals || 0} referrals</span>
                        <span>{creator.referralStats?.betaActiveReferrals || 0} beta active</span>
                      </div>
                    </div>
                    <div className="leaderboard-score">
                      {creator.referralStats?.totalKCoinsEarned || 0} K-Coins
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Stats Modal */}
      {showReferralStats && (
        <div className="modal-overlay" onClick={() => setShowReferralStats(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Referral Statistics</h3>
              <button className="close-btn" onClick={() => setShowReferralStats(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="referral-stats-detail">
                <div className="detail-section">
                  <h4>{showReferralStats.creatorName || showReferralStats.creatorEmail}</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Referral Code:</span>
                      <span className="detail-value">{showReferralStats.referralCode}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Referrals:</span>
                      <span className="detail-value">{showReferralStats.totalReferrals}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Beta Active Referrals:</span>
                      <span className="detail-value">{showReferralStats.betaActiveReferrals}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total K-Coins Earned:</span>
                      <span className="detail-value">{showReferralStats.totalKCoinsEarned}</span>
                    </div>
                  </div>
                </div>
                {showReferralStats.referrals && showReferralStats.referrals.length > 0 && (
                  <div className="detail-section">
                    <h4>Recent Referrals ({showReferralStats.referrals.length})</h4>
                    <div className="referrals-list">
                      {showReferralStats.referrals.map((referral, index) => (
                        <div key={referral.id || index} className="referral-item">
                          <span className="referral-email">{referral.referredEmail}</span>
                          <span className="referral-status">
                            {referral.referredBetaActive ? (
                              <span className="badge access-badge">Beta Active</span>
                            ) : (
                              <span className="badge no-access-badge">Waitlist</span>
                            )}
                          </span>
                          {referral.kCoinsAwarded > 0 && (
                            <span className="referral-kcoins">+{referral.kCoinsAwarded} K-Coins</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCreatorDashboard;
