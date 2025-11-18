import React, { useState, useEffect } from 'react';
import { kCoinsService } from '../services/kCoinsService';
import './KCoinsDisplay.css';

/**
 * K-Coins Display Component
 * 
 * Displays K-Coins balance and transaction history.
 * Beta Phase: Shows balance only (no spending, no "coming soon" messaging - keep it mysterious)
 */
const KCoinsDisplay = ({ userId, compact = false, showHistory = false }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadBalance();
      if (showHistory) {
        loadHistory();
      }
    }
  }, [userId, showHistory]);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const result = await kCoinsService.getKCoinsBalance(userId);
      if (result.success) {
        setBalance(result.balance || 0);
      }
    } catch (error) {
      console.error('Error loading K-Coins balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const result = await kCoinsService.getKCoinsHistory(userId, 50);
      if (result.success) {
        setTransactions(result.transactions || []);
      }
    } catch (error) {
      console.error('Error loading K-Coins history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistoryModal(true);
    if (transactions.length === 0) {
      loadHistory();
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    try {
      return new Date(date).toLocaleDateString('en-MY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTransactionIcon = (type) => {
    const icons = {
      waitlist_signup: '🎉',
      referral: '👥',
      survey: '📝',
      draw_prize: '🎁',
      conversion: '✨'
    };
    return icons[type] || '💰';
  };

  const getTransactionLabel = (type) => {
    const labels = {
      waitlist_signup: 'Waitlist Signup',
      referral: 'Referral Bonus',
      survey: 'Survey Completion',
      draw_prize: 'Travel Draw Prize',
      conversion: 'Conversion Reward'
    };
    return labels[type] || type;
  };

  // Compact view (for header/navigation)
  if (compact) {
    return (
      <div className="kcoins-display-compact">
        {loading ? (
          <span className="kcoins-loading">...</span>
        ) : (
          <>
            <span className="kcoins-icon">🪙</span>
            <span className="kcoins-balance">{balance}</span>
            <span className="kcoins-label">K-Coins</span>
          </>
        )}
      </div>
    );
  }

  // Full view (for User Dashboard)
  return (
    <div className="kcoins-display">
      <div className="kcoins-header">
        <div className="kcoins-balance-section">
          <div className="kcoins-icon-large">🪙</div>
          <div className="kcoins-info">
            <h3 className="kcoins-title">K-Coins</h3>
            {loading ? (
              <div className="kcoins-loading">Loading...</div>
            ) : (
              <div className="kcoins-balance-large">{balance.toLocaleString()}</div>
            )}
          </div>
        </div>
        <button 
          className="kcoins-history-btn"
          onClick={handleShowHistory}
          disabled={loading}
        >
          View History
        </button>
      </div>

      {/* Transaction History Modal */}
      {showHistoryModal && (
        <div className="kcoins-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="kcoins-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kcoins-modal-header">
              <h3>K-Coins Transaction History</h3>
              <button 
                className="kcoins-modal-close"
                onClick={() => setShowHistoryModal(false)}
              >
                ×
              </button>
            </div>
            <div className="kcoins-modal-content">
              {historyLoading ? (
                <div className="kcoins-loading">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="kcoins-empty">
                  <p>No transactions yet.</p>
                  <p className="kcoins-empty-hint">Earn K-Coins by joining the waitlist, referring friends, and completing surveys!</p>
                </div>
              ) : (
                <div className="kcoins-transactions-list">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="kcoins-transaction-item">
                      <div className="kcoins-transaction-icon">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div className="kcoins-transaction-details">
                        <div className="kcoins-transaction-type">
                          {getTransactionLabel(transaction.type)}
                        </div>
                        <div className="kcoins-transaction-description">
                          {transaction.description}
                        </div>
                        <div className="kcoins-transaction-date">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>
                      <div className="kcoins-transaction-amount">
                        +{transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KCoinsDisplay;

