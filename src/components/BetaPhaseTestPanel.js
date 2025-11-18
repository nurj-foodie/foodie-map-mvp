import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { kCoinsService } from '../services/kCoinsService';
import { waitlistService } from '../services/waitlistService';
import { referralService } from '../services/referralService';
import { checkBetaAccess, grantBetaAccess } from '../utils/betaAccess';
import './BetaPhaseTestPanel.css';

/**
 * Beta Phase Test Panel
 * 
 * Testing utility for Phase 1 features:
 * - K-Coins System
 * - Waitlist System
 * - Referral System
 * - Beta Access
 */
const BetaPhaseTestPanel = () => {
  const { user, betaAccess, betaAccessLoading } = useAuth();
  const [kCoinsBalance, setKCoinsBalance] = useState(0);
  const [kCoinsHistory, setKCoinsHistory] = useState([]);
  const [waitlistStatus, setWaitlistStatus] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [testName, setTestName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const addMessage = (type, text) => {
    const message = { type, text, timestamp: new Date() };
    setMessages(prev => [message, ...prev].slice(0, 10)); // Keep last 10 messages
  };

  const loadUserData = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      // Load K-Coins balance
      const balanceResult = await kCoinsService.getKCoinsBalance(user.uid);
      if (balanceResult.success) {
        setKCoinsBalance(balanceResult.balance || 0);
      }

      // Load K-Coins history
      const historyResult = await kCoinsService.getKCoinsHistory(user.uid, 10);
      if (historyResult.success) {
        setKCoinsHistory(historyResult.transactions || []);
      }

      // Check waitlist status
      const waitlistResult = await waitlistService.checkBetaAccess(user.email);
      if (waitlistResult.success) {
        setWaitlistStatus(waitlistResult);
      }

      // Load referral stats (if in waitlist)
      if (waitlistResult.success && waitlistResult.waitlistData?.id) {
        const statsResult = await referralService.getReferralStats(waitlistResult.waitlistData.id);
        if (statsResult.success) {
          setReferralStats(statsResult.stats);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      addMessage('error', `Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAwardKCoins = async () => {
    if (!user?.uid) {
      addMessage('error', 'Please log in first');
      return;
    }

    setLoading(true);
    try {
      const result = await kCoinsService.awardKCoins(
        user.uid,
        25,
        'waitlist_signup',
        'Test: Manual K-Coins award'
      );

      if (result.success) {
        addMessage('success', `✅ Awarded 25 K-Coins! New balance: ${result.newBalance}`);
        await loadUserData();
      } else {
        addMessage('error', `❌ Failed: ${result.error}`);
      }
    } catch (error) {
      addMessage('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!testEmail || !testName) {
      addMessage('error', 'Please enter email and name');
      return;
    }

    setLoading(true);
    try {
      const result = await waitlistService.joinWaitlist(
        testEmail,
        testName,
        referralCode || null
      );

      if (result.success) {
        addMessage('success', `✅ Joined waitlist! Referral code: ${result.referralCode}`);
        setTestEmail('');
        setTestName('');
        setReferralCode('');
      } else {
        addMessage('error', `❌ Failed: ${result.error}`);
      }
    } catch (error) {
      addMessage('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantBetaAccess = async () => {
    if (!testEmail) {
      addMessage('error', 'Please enter email');
      return;
    }

    // Normalize email (remove spaces, lowercase)
    const normalizedEmail = testEmail.trim().toLowerCase();
    
    setLoading(true);
    try {
      console.log('🔐 Attempting to grant beta access to:', normalizedEmail);
      const result = await grantBetaAccess(normalizedEmail, 1);
      console.log('🔐 Grant beta access result:', result);

      if (result.success) {
        addMessage('success', `✅ Beta access granted to ${normalizedEmail}`);
        setTestEmail('');
        // Reload user data to refresh beta access status
        await loadUserData();
      } else {
        addMessage('error', `❌ Failed: ${result.error || 'Unknown error'}`);
        console.error('❌ Grant beta access failed:', result);
      }
    } catch (error) {
      console.error('❌ Error granting beta access:', error);
      addMessage('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateReferralCode = async () => {
    if (!referralCode) {
      addMessage('error', 'Please enter referral code');
      return;
    }

    setLoading(true);
    try {
      const result = await referralService.validateReferralCode(referralCode);

      if (result.success && result.valid) {
        addMessage('success', `✅ Valid! Referrer: ${result.referrerName} (${result.referrerEmail})`);
      } else {
        addMessage('warning', '❌ Invalid referral code');
      }
    } catch (error) {
      addMessage('error', `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="beta-test-panel">
        <div className="test-panel-header">
          <h2>🧪 Beta Phase Test Panel</h2>
        </div>
        <div className="test-panel-content">
          <p>Please log in to test Phase 1 features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="beta-test-panel">
      <div className="test-panel-header">
        <h2>🧪 Beta Phase Test Panel</h2>
        <p className="test-panel-subtitle">Testing Phase 1: Core Systems</p>
      </div>

      <div className="test-panel-content">
        {/* Current User Status */}
        <div className="test-section">
          <h3>👤 Current User Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Email:</span>
              <span className="status-value">{user.email}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Beta Access:</span>
              <span className={`status-value ${betaAccess ? 'success' : 'warning'}`}>
                {betaAccessLoading ? 'Checking...' : betaAccess ? '✅ Granted' : '❌ Not granted'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">K-Coins Balance:</span>
              <span className="status-value">{kCoinsBalance}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Waitlist Status:</span>
              <span className="status-value">
                {waitlistStatus?.hasAccess ? '✅ Has access' : waitlistStatus?.waitlistData ? '⏳ In waitlist' : '❌ Not in waitlist'}
              </span>
            </div>
          </div>
        </div>

        {/* K-Coins Testing */}
        <div className="test-section">
          <h3>🪙 K-Coins System</h3>
          <div className="test-actions">
            <button 
              onClick={handleAwardKCoins}
              disabled={loading}
              className="test-btn primary"
            >
              Award 25 K-Coins (Test)
            </button>
            <button 
              onClick={loadUserData}
              disabled={loading}
              className="test-btn"
            >
              Refresh Balance
            </button>
          </div>
          {kCoinsHistory.length > 0 && (
            <div className="history-preview">
              <strong>Recent Transactions:</strong>
              <ul>
                {kCoinsHistory.slice(0, 5).map((tx, idx) => (
                  <li key={idx}>
                    {tx.type}: +{tx.amount} - {tx.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Waitlist Testing */}
        <div className="test-section">
          <h3>📋 Waitlist System</h3>
          <div className="test-form">
            <input
              type="email"
              placeholder="Test email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="test-input"
            />
            <input
              type="text"
              placeholder="Test name"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="test-input"
            />
            <input
              type="text"
              placeholder="Referral code (optional)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="test-input"
            />
            <div className="test-actions">
              <button 
                onClick={handleJoinWaitlist}
                disabled={loading}
                className="test-btn primary"
              >
                Join Waitlist
              </button>
              <button 
                onClick={handleGrantBetaAccess}
                disabled={loading}
                className="test-btn warning"
              >
                Grant Beta Access
              </button>
            </div>
          </div>
        </div>

        {/* Referral Testing */}
        <div className="test-section">
          <h3>👥 Referral System</h3>
          <div className="test-form">
            <input
              type="text"
              placeholder="Referral code to validate"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="test-input"
            />
            <button 
              onClick={handleValidateReferralCode}
              disabled={loading}
              className="test-btn"
            >
              Validate Code
            </button>
          </div>
          {referralStats && (
            <div className="stats-preview">
              <strong>Referral Stats:</strong>
              <ul>
                <li>Total Referrals: {referralStats.totalReferrals}</li>
                <li>K-Coins Earned: {referralStats.kCoinsEarned}</li>
                <li>Points Earned: {referralStats.pointsEarned}</li>
              </ul>
            </div>
          )}
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div className="test-section">
            <h3>📝 Test Messages</h3>
            <div className="messages-list">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message message-${msg.type}`}>
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="message-text">{msg.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetaPhaseTestPanel;

