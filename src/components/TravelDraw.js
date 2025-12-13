import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { drawService } from '../services/drawService';
import './TravelDraw.css';

const TravelDraw = () => {
  const [loading, setLoading] = useState(true);
  const [currentDraw, setCurrentDraw] = useState(null);
  const [drawHistory, setDrawHistory] = useState([]);
  const [topReferrers, setTopReferrers] = useState([]);
  const [showCreateDraw, setShowCreateDraw] = useState(false);
  const [showDrawDetails, setShowDrawDetails] = useState(null);
  const [createDrawForm, setCreateDrawForm] = useState({
    month: '',
    topN: 50,
    prizeDescription: 'Malaysia Travel Package'
  });
  const [kCoinsAmount, setKCoinsAmount] = useState(500);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadDrawData();
    
    // Set up real-time listener for draws
    const unsubscribe = onSnapshot(
      collection(db, 'travel_draws'),
      async () => {
        console.log('📊 Draws updated, refreshing...');
        await loadDrawData();
      },
      (error) => {
        console.error('Error listening to draws:', error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  const loadDrawData = async () => {
    setLoading(true);
    try {
      // Get current month's draw
      const currentDrawResult = await drawService.getCurrentMonthDraw();
      if (currentDrawResult.success) {
        setCurrentDraw(currentDrawResult.draw);
      }

      // Get draw history
      const historyResult = await drawService.getDrawHistory(20);
      if (historyResult.success) {
        setDrawHistory(historyResult.draws || []);
      }

      // Get top referrers for current month
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const topReferrersResult = await drawService.getTopReferrers(50, currentMonth);
      if (topReferrersResult.success) {
        setTopReferrers(topReferrersResult.referrers || []);
      }
    } catch (error) {
      console.error('Error loading draw data:', error);
      setMessage({ type: 'error', text: 'Failed to load draw data' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraw = async () => {
    if (!createDrawForm.month || !/^\d{4}-\d{2}$/.test(createDrawForm.month)) {
      setMessage({ type: 'error', text: 'Please enter a valid month (YYYY-MM)' });
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await drawService.createDraw(
        createDrawForm.month,
        createDrawForm.topN,
        createDrawForm.prizeDescription
      );

      if (result.success) {
        setMessage({ type: 'success', text: `Draw created successfully with ${result.qualifierCount} qualifiers` });
        setShowCreateDraw(false);
        setCreateDrawForm({
          month: '',
          topN: 50,
          prizeDescription: 'Malaysia Travel Package'
        });
        await loadDrawData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create draw' });
      }
    } catch (error) {
      console.error('Error creating draw:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create draw' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConductDraw = async (drawId) => {
    if (!window.confirm('Are you sure you want to conduct this draw? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await drawService.conductDraw(drawId);

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Draw conducted! Winner: ${result.winner.name} (${result.winner.email})` 
        });
        await loadDrawData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to conduct draw' });
      }
    } catch (error) {
      console.error('Error conducting draw:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to conduct draw' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnnounceDraw = async (drawId) => {
    if (!window.confirm(`Are you sure you want to announce this draw? This will award ${kCoinsAmount} K-Coins to the winner.`)) {
      return;
    }

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await drawService.announceDraw(drawId, kCoinsAmount);

      if (result.success) {
        setMessage({ type: 'success', text: 'Draw announced successfully!' });
        await loadDrawData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to announce draw' });
      }
    } catch (error) {
      console.error('Error announcing draw:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to announce draw' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (drawId) => {
    try {
      const result = await drawService.getDrawDetails(drawId);
      if (result.success) {
        setShowDrawDetails(result.draw);
      }
    } catch (error) {
      console.error('Error getting draw details:', error);
      setMessage({ type: 'error', text: 'Failed to load draw details' });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pending', className: 'status-pending' },
      drawn: { text: 'Drawn', className: 'status-drawn' },
      announced: { text: 'Announced', className: 'status-announced' }
    };
    const badge = badges[status] || badges.pending;
    return <span className={`status-badge ${badge.className}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="travel-draw-container">
        <div className="loading">Loading draw data...</div>
      </div>
    );
  }

  return (
    <div className="travel-draw-container">
      <div className="travel-draw-header">
        <h2>🎁 Travel Package Draw</h2>
        <button 
          className="btn-primary"
          onClick={() => {
            const now = new Date();
            const nextMonth = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}`;
            setCreateDrawForm(prev => ({ ...prev, month: nextMonth }));
            setShowCreateDraw(true);
          }}
        >
          Create New Draw
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Current Month Draw */}
      <div className="current-draw-section">
        <h3>Current Month Draw</h3>
        {currentDraw ? (
          <div className="draw-card">
            <div className="draw-card-header">
              <div>
                <h4>{currentDraw.month}</h4>
                {getStatusBadge(currentDraw.status)}
              </div>
              <div className="draw-card-actions">
                {currentDraw.status === 'pending' && (
                  <button
                    className="btn-secondary"
                    onClick={() => handleConductDraw(currentDraw.id)}
                    disabled={actionLoading}
                  >
                    Conduct Draw
                  </button>
                )}
                {currentDraw.status === 'drawn' && (
                  <>
                    <input
                      type="number"
                      className="kcoins-input"
                      placeholder="K-Coins amount"
                      value={kCoinsAmount}
                      onChange={(e) => setKCoinsAmount(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                    <button
                      className="btn-primary"
                      onClick={() => handleAnnounceDraw(currentDraw.id)}
                      disabled={actionLoading}
                    >
                      Announce Draw
                    </button>
                  </>
                )}
                <button
                  className="btn-secondary"
                  onClick={() => handleViewDetails(currentDraw.id)}
                >
                  View Details
                </button>
              </div>
            </div>
            <div className="draw-card-body">
              <div className="draw-stats">
                <div className="stat">
                  <span className="stat-label">Qualifiers:</span>
                  <span className="stat-value">{currentDraw.qualifierCount || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Prize:</span>
                  <span className="stat-value">{currentDraw.prizeDescription}</span>
                </div>
                {currentDraw.winnerName && (
                  <div className="stat winner-stat">
                    <span className="stat-label">Winner:</span>
                    <span className="stat-value">{currentDraw.winnerName} ({currentDraw.winnerEmail})</span>
                  </div>
                )}
                {currentDraw.drawnAt && (
                  <div className="stat">
                    <span className="stat-label">Drawn At:</span>
                    <span className="stat-value">{formatDate(currentDraw.drawnAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-draw">
            <p>No draw created for current month</p>
            <button 
              className="btn-primary"
              onClick={() => {
                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                setCreateDrawForm(prev => ({ ...prev, month: currentMonth }));
                setShowCreateDraw(true);
              }}
            >
              Create Current Month Draw
            </button>
          </div>
        )}
      </div>

      {/* Top Referrers Preview */}
      {topReferrers.length > 0 && (
        <div className="top-referrers-section">
          <h3>Top Referrers (Current Month Preview)</h3>
          <div className="referrers-table-wrapper">
            <table className="referrers-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Referrals</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topReferrers.slice(0, 10).map((referrer, index) => (
                  <tr key={referrer.waitlistId || referrer.referrerId}>
                    <td>{index + 1}</td>
                    <td>{referrer.name}</td>
                    <td>{referrer.email}</td>
                    <td>{referrer.count}</td>
                    <td>
                      {referrer.betaAccessGranted ? (
                        <span className="badge-success">Beta Active</span>
                      ) : (
                        <span className="badge-pending">Waitlist</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Draw Modal */}
      {showCreateDraw && (
        <div className="modal-overlay" onClick={() => setShowCreateDraw(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Draw</h3>
              <button className="modal-close" onClick={() => setShowCreateDraw(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Month (YYYY-MM)</label>
                <input
                  type="text"
                  value={createDrawForm.month}
                  onChange={(e) => setCreateDrawForm(prev => ({ ...prev, month: e.target.value }))}
                  placeholder="2025-12"
                />
              </div>
              <div className="form-group">
                <label>Top N Qualifiers</label>
                <input
                  type="number"
                  value={createDrawForm.topN}
                  onChange={(e) => setCreateDrawForm(prev => ({ ...prev, topN: parseInt(e.target.value) || 50 }))}
                  min="1"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>Prize Description</label>
                <input
                  type="text"
                  value={createDrawForm.prizeDescription}
                  onChange={(e) => setCreateDrawForm(prev => ({ ...prev, prizeDescription: e.target.value }))}
                  placeholder="Malaysia Travel Package"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateDraw(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleCreateDraw}
                disabled={actionLoading}
              >
                {actionLoading ? 'Creating...' : 'Create Draw'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draw Details Modal */}
      {showDrawDetails && (
        <div className="modal-overlay" onClick={() => setShowDrawDetails(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Draw Details - {showDrawDetails.month}</h3>
              <button className="modal-close" onClick={() => setShowDrawDetails(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="draw-details">
                <div className="detail-section">
                  <h4>Draw Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span>{getStatusBadge(showDrawDetails.status)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Qualifiers:</span>
                      <span>{showDrawDetails.qualifierCount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Prize:</span>
                      <span>{showDrawDetails.prizeDescription}</span>
                    </div>
                    {showDrawDetails.winnerName && (
                      <>
                        <div className="detail-item">
                          <span className="detail-label">Winner:</span>
                          <span>{showDrawDetails.winnerName}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Winner Email:</span>
                          <span>{showDrawDetails.winnerEmail}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Winner Referrals:</span>
                          <span>{showDrawDetails.qualifiers?.find(q => q.email === showDrawDetails.winnerEmail)?.referralCount || 0}</span>
                        </div>
                      </>
                    )}
                    {showDrawDetails.drawnAt && (
                      <div className="detail-item">
                        <span className="detail-label">Drawn At:</span>
                        <span>{formatDate(showDrawDetails.drawnAt)}</span>
                      </div>
                    )}
                    {showDrawDetails.announcedAt && (
                      <div className="detail-item">
                        <span className="detail-label">Announced At:</span>
                        <span>{formatDate(showDrawDetails.announcedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {showDrawDetails.qualifiers && showDrawDetails.qualifiers.length > 0 && (
                  <div className="detail-section">
                    <h4>Qualifiers ({showDrawDetails.qualifiers.length})</h4>
                    <div className="qualifiers-table-wrapper">
                      <table className="qualifiers-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Referrals</th>
                            <th>Referral Code</th>
                          </tr>
                        </thead>
                        <tbody>
                          {showDrawDetails.qualifiers.map((qualifier, index) => (
                            <tr 
                              key={qualifier.waitlistId} 
                              className={qualifier.email === showDrawDetails.winnerEmail ? 'winner-row' : ''}
                            >
                              <td>{qualifier.name}</td>
                              <td>{qualifier.email}</td>
                              <td>{qualifier.referralCount}</td>
                              <td>{qualifier.referralCode}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDrawDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draw History */}
      <div className="draw-history-section">
        <h3>Draw History</h3>
        {drawHistory.length > 0 ? (
          <div className="draw-history-list">
            {drawHistory.map((draw) => (
              <div key={draw.id} className="draw-history-card">
                <div className="draw-history-header">
                  <div>
                    <h4>{draw.month}</h4>
                    {getStatusBadge(draw.status)}
                  </div>
                  <button
                    className="btn-secondary small"
                    onClick={() => handleViewDetails(draw.id)}
                  >
                    View Details
                  </button>
                </div>
                <div className="draw-history-body">
                  <div className="draw-history-stats">
                    <span>Qualifiers: {draw.qualifierCount || 0}</span>
                    {draw.winnerName && (
                      <span className="winner-info">Winner: {draw.winnerName}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">No draw history</div>
        )}
      </div>
    </div>
  );
};

export default TravelDraw;
