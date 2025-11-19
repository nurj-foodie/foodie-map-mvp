import React, { useState } from 'react';
import { emailService } from '../services/emailService';
import { emailTrackingService } from '../services/emailTrackingService';
import { waitlistService } from '../services/waitlistService';
import './EmailTestPanel.css';

/**
 * Email Test Panel Component
 * 
 * Testing utility for Phase 3.1 Email Service.
 * Allows manual testing of all email types and tracking.
 */
const EmailTestPanel = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [waitlistId, setWaitlistId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  const [engagementStats, setEngagementStats] = useState(null);

  /**
   * Send test email
   */
  const sendTestEmail = async (emailType) => {
    if (!email || !name) {
      setResult({
        success: false,
        error: 'Email and name are required'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let result;

      switch (emailType) {
        case 'welcome':
          result = await emailService.sendWelcomeEmail(
            email,
            name,
            referralCode || 'KM-TEST01',
            waitlistId || null
          );
          break;
        case 'survey':
          result = await emailService.sendSurveyEmail(
            email,
            name,
            waitlistId || null
          );
          break;
        case 'community':
          result = await emailService.sendCommunityEmail(
            email,
            name,
            waitlistId || null
          );
          break;
        case 'referral_reminder':
          result = await emailService.sendReferralReminderEmail(
            email,
            name,
            referralCode || 'KM-TEST01',
            waitlistId || null
          );
          break;
        case 'invite':
          result = await emailService.sendInviteEmail(
            email,
            name,
            waitlistId || null
          );
          break;
        case 'feedback':
          result = await emailService.sendFeedbackEmail(
            email,
            name,
            waitlistId || null
          );
          break;
        default:
          result = {
            success: false,
            error: 'Invalid email type'
          };
      }

      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check email status
   */
  const checkEmailStatus = async () => {
    if (!waitlistId) {
      setEmailStatus({
        success: false,
        error: 'Waitlist ID is required'
      });
      return;
    }

    setLoading(true);
    setEmailStatus(null);

    try {
      const status = await emailService.getEmailDripStatus(waitlistId);
      setEmailStatus(status);
    } catch (error) {
      setEmailStatus({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get engagement stats
   */
  const getEngagementStats = async () => {
    if (!waitlistId) {
      setEngagementStats({
        success: false,
        error: 'Waitlist ID is required'
      });
      return;
    }

    setLoading(true);
    setEngagementStats(null);

    try {
      const stats = await emailTrackingService.getEmailEngagementStats(waitlistId);
      setEngagementStats(stats);
    } catch (error) {
      setEngagementStats({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Find waitlist ID by email
   */
  const findWaitlistId = async () => {
    if (!email) {
      setResult({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const accessResult = await waitlistService.checkBetaAccess(email);
      if (accessResult.success && accessResult.waitlistData) {
        setWaitlistId(accessResult.waitlistData.id);
        setResult({
          success: true,
          message: `Found waitlist ID: ${accessResult.waitlistData.id}`,
          waitlistId: accessResult.waitlistData.id
        });
      } else {
        setResult({
          success: false,
          error: 'Email not found in waitlist'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-test-panel">
      <h2>📧 Email Service Test Panel</h2>
      <p className="subtitle">Test Phase 3.1 Email Service functionality</p>

      {/* Input Form */}
      <div className="test-form">
        <div className="form-group">
          <label>Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="test@example.com"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Test User"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Referral Code (optional)</label>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="KM-TEST01"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Waitlist ID (optional)</label>
          <div className="input-with-button">
            <input
              type="text"
              value={waitlistId}
              onChange={(e) => setWaitlistId(e.target.value)}
              placeholder="Auto-find by email"
              disabled={loading}
            />
            <button
              onClick={findWaitlistId}
              disabled={loading || !email}
              className="btn-secondary"
            >
              Find
            </button>
          </div>
        </div>
      </div>

      {/* Email Buttons */}
      <div className="email-buttons">
        <h3>Send Test Emails</h3>
        <div className="button-grid">
          <button
            onClick={() => sendTestEmail('welcome')}
            disabled={loading}
            className="btn-email welcome"
          >
            📧 Welcome (T+0)
          </button>
          <button
            onClick={() => sendTestEmail('survey')}
            disabled={loading}
            className="btn-email survey"
          >
            📋 Survey (T+2)
          </button>
          <button
            onClick={() => sendTestEmail('community')}
            disabled={loading}
            className="btn-email community"
          >
            👥 Community (T+5)
          </button>
          <button
            onClick={() => sendTestEmail('referral_reminder')}
            disabled={loading}
            className="btn-email referral"
          >
            🔗 Referral Reminder (T+8)
          </button>
          <button
            onClick={() => sendTestEmail('invite')}
            disabled={loading}
            className="btn-email invite"
          >
            🎉 Invite (Rolling)
          </button>
          <button
            onClick={() => sendTestEmail('feedback')}
            disabled={loading}
            className="btn-email feedback"
          >
            ⭐ Feedback (T+7)
          </button>
        </div>
      </div>

      {/* Status Check Buttons */}
      <div className="status-buttons">
        <h3>Check Status</h3>
        <div className="button-row">
          <button
            onClick={checkEmailStatus}
            disabled={loading || !waitlistId}
            className="btn-status"
          >
            📊 Email Status
          </button>
          <button
            onClick={getEngagementStats}
            disabled={loading || !waitlistId}
            className="btn-status"
          >
            📈 Engagement Stats
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          <h4>{result.success ? '✅ Success' : '❌ Error'}</h4>
          {result.success ? (
            <div>
              <p><strong>Email Type:</strong> {result.emailType}</p>
              {result.messageId && (
                <p><strong>Message ID:</strong> {result.messageId}</p>
              )}
              {result.emailDripId && (
                <p><strong>Email Drip ID:</strong> {result.emailDripId}</p>
              )}
              {result.message && <p>{result.message}</p>}
              {result.waitlistId && (
                <p><strong>Waitlist ID:</strong> {result.waitlistId}</p>
              )}
            </div>
          ) : (
            <p><strong>Error:</strong> {result.error}</p>
          )}
        </div>
      )}

      {/* Email Status Display */}
      {emailStatus && (
        <div className={`result ${emailStatus.success ? 'success' : 'error'}`}>
          <h4>📊 Email Status</h4>
          {emailStatus.success ? (
            <div>
              <p><strong>Total Emails Sent:</strong> {emailStatus.emails?.length || 0}</p>
              {emailStatus.emails && emailStatus.emails.length > 0 && (
                <div className="email-list">
                  {emailStatus.emails.map((email, index) => (
                    <div key={index} className="email-item">
                      <p><strong>Type:</strong> {email.emailType}</p>
                      <p><strong>Sent:</strong> {email.sentAt?.toDate?.()?.toLocaleString() || 'N/A'}</p>
                      <p><strong>Opened:</strong> {email.opened ? '✅' : '❌'}</p>
                      <p><strong>Clicked:</strong> {email.clicked ? '✅' : '❌'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p><strong>Error:</strong> {emailStatus.error}</p>
          )}
        </div>
      )}

      {/* Engagement Stats Display */}
      {engagementStats && (
        <div className={`result ${engagementStats.success ? 'success' : 'error'}`}>
          <h4>📈 Engagement Stats</h4>
          {engagementStats.success && engagementStats.stats ? (
            <div>
              <p><strong>Total Sent:</strong> {engagementStats.stats.totalSent}</p>
              <p><strong>Total Opened:</strong> {engagementStats.stats.totalOpened}</p>
              <p><strong>Total Clicked:</strong> {engagementStats.stats.totalClicked}</p>
              <p><strong>Open Rate:</strong> {engagementStats.stats.openRate}%</p>
              <p><strong>Click Rate:</strong> {engagementStats.stats.clickRate}%</p>
            </div>
          ) : (
            <p><strong>Error:</strong> {engagementStats.error}</p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="instructions">
        <h3>📝 Instructions</h3>
        <ol>
          <li>Enter your email address and name</li>
          <li>Optionally enter referral code (for welcome/referral emails)</li>
          <li>Click "Find" to auto-find waitlist ID, or enter manually</li>
          <li>Click any email button to send a test email</li>
          <li>Check email status or engagement stats after sending</li>
        </ol>
        <p className="note">
          <strong>Note:</strong> Make sure SendGrid API key is configured in `.env` file.
          Check console for detailed logs.
        </p>
      </div>
    </div>
  );
};

export default EmailTestPanel;

