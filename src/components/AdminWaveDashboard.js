import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { waveService } from '../services/waveService';
import './AdminWaveDashboard.css';

const AdminWaveDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [waves, setWaves] = useState([]);
  const [showCreateWave, setShowCreateWave] = useState(false);
  const [showWaveDetails, setShowWaveDetails] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  
  // Create wave form state
  const [waveForm, setWaveForm] = useState({
    waveNumber: 1,
    size: 50,
    minScore: '',
    corridor: '',
    driveFrequency: 'all',
    includeCreators: true,
    creatorReservePercent: 20
  });

  useEffect(() => {
    loadWaveHistory();
    
    // Set up real-time listener for waves
    const unsubscribe = onSnapshot(
      collection(db, 'waves'),
      async (snapshot) => {
        console.log('📊 Waves updated, refreshing...');
        await loadWaveHistory();
      },
      (error) => {
        console.error('Error listening to waves:', error);
      }
    );
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Auto-load next wave number
    loadNextWaveNumber();
  }, []);

  const loadWaveHistory = async () => {
    setLoading(true);
    try {
      const result = await waveService.getWaveHistory();
      if (result.success) {
        setWaves(result.waves || []);
      }
    } catch (error) {
      console.error('Error loading wave history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNextWaveNumber = async () => {
    const result = await waveService.getNextWaveNumber();
    if (result.success) {
      setWaveForm(prev => ({
        ...prev,
        waveNumber: result.nextWaveNumber
      }));
    }
  };

  const handleCreateWave = async () => {
    if (!waveForm.waveNumber || !waveForm.size) {
      alert('Please fill in wave number and size');
      return;
    }

    try {
      const criteria = {
        minScore: waveForm.minScore ? Number(waveForm.minScore) : null,
        corridor: waveForm.corridor || null,
        driveFrequency: waveForm.driveFrequency === 'all' ? null : waveForm.driveFrequency,
        includeCreators: waveForm.includeCreators,
        creatorReservePercent: waveForm.creatorReservePercent
      };

      const result = await waveService.createWave(
        waveForm.waveNumber,
        waveForm.size,
        criteria
      );

      if (result.success) {
        alert(`Wave ${waveForm.waveNumber} created successfully!`);
        setShowCreateWave(false);
        loadWaveHistory();
        loadNextWaveNumber();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating wave:', error);
      alert('Error creating wave');
    }
  };

  const handlePreviewCandidates = async () => {
    if (!waveForm.waveNumber) {
      alert('Please enter a wave number');
      return;
    }

    try {
      const criteria = {
        minScore: waveForm.minScore ? Number(waveForm.minScore) : null,
        corridor: waveForm.corridor || null,
        driveFrequency: waveForm.driveFrequency === 'all' ? null : waveForm.driveFrequency,
        includeCreators: waveForm.includeCreators,
        creatorReservePercent: waveForm.creatorReservePercent
      };

      const result = await waveService.getNextWaveCandidates(
        waveForm.waveNumber,
        criteria,
        waveForm.size
      );

      if (result.success) {
        setCandidates(result.candidates || []);
        setSelectedCandidates(new Set(result.candidates.map(c => c.waitlistId)));
        alert(`Found ${result.candidates.length} candidates (${result.creators.length} creators, ${result.regular.length} regular)`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error previewing candidates:', error);
      alert('Error previewing candidates');
    }
  };

  const handleGrantAccess = async (waveNumber, userIds) => {
    if (!userIds || userIds.length === 0) {
      alert('Please select users to grant access');
      return;
    }

    if (!window.confirm(`Grant beta access to ${userIds.length} users for Wave ${waveNumber}?`)) {
      return;
    }

    try {
      const result = await waveService.grantWaveAccess(waveNumber, userIds);

      if (result.success) {
        alert(`Beta access granted: ${result.granted} successful, ${result.failed} failed`);
        setSelectedCandidates(new Set());
        setCandidates([]);
        loadWaveHistory();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error granting access:', error);
      alert('Error granting access');
    }
  };

  const toggleCandidateSelection = (waitlistId) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(waitlistId)) {
        newSet.delete(waitlistId);
      } else {
        newSet.add(waitlistId);
      }
      return newSet;
    });
  };

  const selectAllCandidates = () => {
    setSelectedCandidates(new Set(candidates.map(c => c.waitlistId)));
  };

  const deselectAllCandidates = () => {
    setSelectedCandidates(new Set());
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="badge draft-badge">Draft</span>;
      case 'candidates_selected':
        return <span className="badge candidates-badge">Candidates Selected</span>;
      case 'granted':
        return <span className="badge granted-badge">✓ Granted</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return '#6c757d';
      case 'candidates_selected':
        return '#ffc107';
      case 'granted':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="wave-dashboard">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Loading waves...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wave-dashboard">
      <div className="dashboard-header">
        <h2>🌊 Weekly Wave System</h2>
        <p>Manage beta access waves (50-100 seats per wave)</p>
      </div>

      {/* Create Wave Section */}
      <div className="create-wave-section">
        <div className="section-header">
          <h3>Create New Wave</h3>
          <button 
            className="toggle-btn"
            onClick={() => {
              setShowCreateWave(!showCreateWave);
              if (!showCreateWave) {
                loadNextWaveNumber();
              }
            }}
          >
            {showCreateWave ? '▼ Hide' : '▶ Show'}
          </button>
        </div>

        {showCreateWave && (
          <div className="create-wave-form">
            <div className="form-row">
              <div className="form-group">
                <label>Wave Number:</label>
                <input
                  type="number"
                  value={waveForm.waveNumber}
                  onChange={(e) => setWaveForm({ ...waveForm, waveNumber: Number(e.target.value) })}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label>Wave Size:</label>
                <input
                  type="number"
                  value={waveForm.size}
                  onChange={(e) => setWaveForm({ ...waveForm, size: Number(e.target.value) })}
                  min="50"
                  max="100"
                />
                <span className="form-hint">(50-100 seats)</span>
              </div>

              <div className="form-group">
                <label>Creator Reserve %:</label>
                <input
                  type="number"
                  value={waveForm.creatorReservePercent}
                  onChange={(e) => setWaveForm({ ...waveForm, creatorReservePercent: Number(e.target.value) })}
                  min="0"
                  max="50"
                />
                <span className="form-hint">({Math.floor(waveForm.size * (waveForm.creatorReservePercent / 100))} creator slots)</span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Min Score:</label>
                <input
                  type="number"
                  value={waveForm.minScore}
                  onChange={(e) => setWaveForm({ ...waveForm, minScore: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label>Corridor:</label>
                <input
                  type="text"
                  value={waveForm.corridor}
                  onChange={(e) => setWaveForm({ ...waveForm, corridor: e.target.value })}
                  placeholder="e.g., KL↔JB"
                />
              </div>

              <div className="form-group">
                <label>Drive Frequency:</label>
                <select
                  value={waveForm.driveFrequency}
                  onChange={(e) => setWaveForm({ ...waveForm, driveFrequency: e.target.value })}
                >
                  <option value="all">All</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="occasional">Occasional</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={waveForm.includeCreators}
                    onChange={(e) => setWaveForm({ ...waveForm, includeCreators: e.target.checked })}
                  />
                  Include Creators
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-preview" onClick={handlePreviewCandidates}>
                👁️ Preview Candidates
              </button>
              <button className="btn-create" onClick={handleCreateWave}>
                ➕ Create Wave
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Candidates Preview */}
      {candidates.length > 0 && (
        <div className="candidates-preview-section">
          <div className="section-header">
            <h3>Candidates Preview (Wave {waveForm.waveNumber})</h3>
            <div className="candidates-actions">
              <button className="btn-select-all" onClick={selectAllCandidates}>
                Select All ({candidates.length})
              </button>
              <button className="btn-deselect-all" onClick={deselectAllCandidates}>
                Deselect All
              </button>
              <button 
                className="btn-grant-access"
                onClick={() => handleGrantAccess(waveForm.waveNumber, Array.from(selectedCandidates))}
                disabled={selectedCandidates.size === 0}
              >
                Grant Access ({selectedCandidates.size})
              </button>
            </div>
          </div>

          <div className="candidates-stats">
            <div className="stat-item">
              <span className="stat-label">Total Candidates:</span>
              <span className="stat-value">{candidates.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Creators:</span>
              <span className="stat-value">{candidates.filter(c => c.isCreator).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Regular:</span>
              <span className="stat-value">{candidates.filter(c => !c.isCreator).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Selected:</span>
              <span className="stat-value">{selectedCandidates.size}</span>
            </div>
          </div>

          <div className="candidates-table-wrapper">
            <table className="candidates-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedCandidates.size === candidates.length && candidates.length > 0}
                      onChange={(e) => e.target.checked ? selectAllCandidates() : deselectAllCandidates()}
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Score</th>
                  <th>Corridor</th>
                  <th>Frequency</th>
                  <th>Creator</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.waitlistId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedCandidates.has(candidate.waitlistId)}
                        onChange={() => toggleCandidateSelection(candidate.waitlistId)}
                      />
                    </td>
                    <td>{candidate.name || '-'}</td>
                    <td>{candidate.email || '-'}</td>
                    <td>
                      <span className="score-badge" style={{ backgroundColor: candidate.score >= 800 ? '#28a745' : candidate.score >= 600 ? '#007bff' : candidate.score >= 400 ? '#ffc107' : '#6c757d' }}>
                        {candidate.score || 0}
                      </span>
                    </td>
                    <td>{candidate.corridor || '-'}</td>
                    <td>{candidate.driveFrequency || '-'}</td>
                    <td>
                      {candidate.isCreator ? (
                        <span className="badge creator-badge">⭐ Creator</span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wave History */}
      <div className="wave-history-section">
        <div className="section-header">
          <h3>Wave History</h3>
          <button className="refresh-btn" onClick={loadWaveHistory}>
            🔄 Refresh
          </button>
        </div>

        {waves.length === 0 ? (
          <div className="empty-state">
            No waves created yet. Create your first wave above.
          </div>
        ) : (
          <div className="waves-grid">
            {waves.map((wave) => (
              <div key={wave.id} className="wave-card">
                <div className="wave-card-header">
                  <h4>Wave {wave.waveNumber}</h4>
                  {getStatusBadge(wave.status)}
                </div>
                <div className="wave-card-body">
                  <div className="wave-stat">
                    <span className="wave-stat-label">Size:</span>
                    <span className="wave-stat-value">{wave.size} seats</span>
                  </div>
                  <div className="wave-stat">
                    <span className="wave-stat-label">Granted:</span>
                    <span className="wave-stat-value">{wave.grantedUsers?.length || 0}</span>
                  </div>
                  <div className="wave-stat">
                    <span className="wave-stat-label">Candidates:</span>
                    <span className="wave-stat-value">{wave.candidates?.length || 0}</span>
                  </div>
                  {wave.criteria && (
                    <div className="wave-criteria">
                      {wave.criteria.minScore && (
                        <span className="criteria-tag">Min Score: {wave.criteria.minScore}</span>
                      )}
                      {wave.criteria.corridor && (
                        <span className="criteria-tag">Corridor: {wave.criteria.corridor}</span>
                      )}
                      {wave.criteria.driveFrequency && (
                        <span className="criteria-tag">Frequency: {wave.criteria.driveFrequency}</span>
                      )}
                      {wave.criteria.includeCreators && (
                        <span className="criteria-tag">Creators: {wave.creatorSlots} slots</span>
                      )}
                    </div>
                  )}
                  {wave.createdAt && (
                    <div className="wave-date">
                      Created: {wave.createdAt.toDate ? wave.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </div>
                  )}
                </div>
                <div className="wave-card-actions">
                  <button 
                    className="btn-view-details"
                    onClick={() => setShowWaveDetails(wave.id)}
                  >
                    View Details
                  </button>
                  {wave.status === 'candidates_selected' && (
                    <button 
                      className="btn-grant-wave"
                      onClick={() => {
                        const userIds = wave.candidates?.map(c => c.waitlistId) || [];
                        handleGrantAccess(wave.waveNumber, userIds);
                      }}
                    >
                      Grant Access
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wave Details Modal */}
      {showWaveDetails && (
        <div className="modal-overlay" onClick={() => setShowWaveDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Wave Details</h3>
              <button className="close-btn" onClick={() => setShowWaveDetails(null)}>×</button>
            </div>
            <div className="modal-body">
              {(() => {
                const wave = waves.find(w => w.id === showWaveDetails);
                if (!wave) return <p>Loading...</p>;

                return (
                  <div className="wave-details">
                    <div className="detail-section">
                      <h4>Wave Information</h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Wave Number:</span>
                          <span className="detail-value">{wave.waveNumber}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Size:</span>
                          <span className="detail-value">{wave.size} seats</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Status:</span>
                          <span className="detail-value">{getStatusBadge(wave.status)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Granted:</span>
                          <span className="detail-value">{wave.grantedUsers?.length || 0} / {wave.size}</span>
                        </div>
                      </div>
                    </div>

                    {wave.criteria && (
                      <div className="detail-section">
                        <h4>Criteria</h4>
                        <div className="detail-grid">
                          {wave.criteria.minScore && (
                            <div className="detail-item">
                              <span className="detail-label">Min Score:</span>
                              <span className="detail-value">{wave.criteria.minScore}</span>
                            </div>
                          )}
                          {wave.criteria.corridor && (
                            <div className="detail-item">
                              <span className="detail-label">Corridor:</span>
                              <span className="detail-value">{wave.criteria.corridor}</span>
                            </div>
                          )}
                          {wave.criteria.driveFrequency && (
                            <div className="detail-item">
                              <span className="detail-label">Drive Frequency:</span>
                              <span className="detail-value">{wave.criteria.driveFrequency}</span>
                            </div>
                          )}
                          <div className="detail-item">
                            <span className="detail-label">Include Creators:</span>
                            <span className="detail-value">{wave.criteria.includeCreators ? 'Yes' : 'No'}</span>
                          </div>
                          {wave.criteria.includeCreators && (
                            <div className="detail-item">
                              <span className="detail-label">Creator Reserve:</span>
                              <span className="detail-value">{wave.criteria.creatorReservePercent}% ({wave.creatorSlots} slots)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {wave.candidates && wave.candidates.length > 0 && (
                      <div className="detail-section">
                        <h4>Candidates ({wave.candidates.length})</h4>
                        <div className="candidates-list">
                          {wave.candidates.slice(0, 20).map((candidate, index) => (
                            <div key={candidate.waitlistId || index} className="candidate-item">
                              <span className="candidate-name">{candidate.name || candidate.email}</span>
                              <span className="candidate-score">Score: {candidate.score || 0}</span>
                              {candidate.isCreator && <span className="badge creator-badge">⭐</span>}
                            </div>
                          ))}
                          {wave.candidates.length > 20 && (
                            <div className="candidate-more">
                              ... and {wave.candidates.length - 20} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {wave.grantedUsers && wave.grantedUsers.length > 0 && (
                      <div className="detail-section">
                        <h4>Granted Users ({wave.grantedUsers.length})</h4>
                        <div className="granted-users-list">
                          {wave.grantedUsers.map((user, index) => (
                            <div key={user.waitlistId || index} className="granted-user-item">
                              <span className="user-name">{user.name || user.email}</span>
                              {user.grantedAt && (
                                <span className="granted-date">
                                  {user.grantedAt.toDate ? user.grantedAt.toDate().toLocaleDateString() : 'N/A'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWaveDashboard;
