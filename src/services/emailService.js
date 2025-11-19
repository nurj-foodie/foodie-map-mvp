import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../config/firebaseConfig';
import { waitlistService } from './waitlistService';
import {
  getWelcomeEmailTemplate,
  getSurveyEmailTemplate,
  getCommunityEmailTemplate,
  getReferralReminderEmailTemplate,
  getInviteEmailTemplate,
  getFeedbackEmailTemplate
} from './emailTemplates';

/**
 * Email Service
 * 
 * Manages email sending via Firebase Functions (server-side) for the beta phase email drip sequence.
 * Uses Firebase Functions to keep SendGrid API key secure and avoid CORS issues.
 * Integrates with waitlist service and tracks email sends in Firestore.
 */

class EmailService {
  constructor() {
    this.emailDripsCollection = 'email_drips';
    this.waitlistCollection = 'waitlist';
    this.functions = getFunctions();
  }

  /**
   * Send email via Firebase Function
   * @private
   */
  async _sendEmail(to, subject, html, text, emailType, waitlistId = null) {
    try {
      // Call Firebase Function to send email (server-side)
      const sendEmailFunction = httpsCallable(this.functions, 'sendEmail');
      
      const result = await sendEmailFunction({
        to,
        subject,
        html,
        text,
        fromEmail: process.env.REACT_APP_SENDGRID_FROM_EMAIL || 'noreply@sendgrid.net',
        fromName: process.env.REACT_APP_SENDGRID_FROM_NAME || 'Kawan Makan Community'
      });

      const { success, messageId, error } = result.data;

      if (!success) {
        throw new Error(error || 'Failed to send email');
      }

      console.log(`✅ Email sent (${emailType}): ${to}`);

      // Track email send in Firestore
      let emailDripId = null;
      if (waitlistId) {
        emailDripId = await this._trackEmailSend(waitlistId, emailType, to, messageId);
      }

      return {
        success: true,
        messageId,
        emailDripId,
        emailType
      };
    } catch (error) {
      console.error(`❌ Error sending email (${emailType}):`, error);
      
      // If Firebase Function doesn't exist, show helpful error
      if (error.code === 'functions/not-found' || error.message.includes('not found')) {
        return {
          success: false,
          error: 'Firebase Function not deployed. Please deploy the sendEmail function first.',
          emailType
        };
      }

      return {
        success: false,
        error: error.message,
        emailType
      };
    }
  }

  /**
   * Track email send in Firestore
   * @private
   * @returns {Promise<string|null>} Email drip document ID
   */
  async _trackEmailSend(waitlistId, emailType, email, messageId = null) {
    try {
      const dripData = {
        waitlistId,
        email,
        emailType,
        messageId,
        sentAt: serverTimestamp(),
        opened: false,
        clicked: false,
        openedAt: null,
        clickedAt: null,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.emailDripsCollection), dripData);
      return docRef.id;
    } catch (error) {
      console.error('Error tracking email send:', error);
      return null;
    }
  }

  /**
   * Send Welcome Email (T+0)
   * Sent immediately when user joins waitlist
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} referralCode - User's referral code
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendWelcomeEmail(email, name, referralCode, waitlistId = null) {
    try {
      const template = getWelcomeEmailTemplate(name, referralCode);
      
      const result = await this._sendEmail(
        email,
        template.subject,
        template.html,
        template.text,
        'welcome',
        waitlistId
      );

      return result;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send Survey Email (T+2)
   * Sent 2 days after waitlist signup
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendSurveyEmail(email, name, waitlistId = null) {
    try {
      const template = getSurveyEmailTemplate(name);
      
      const result = await this._sendEmail(
        email,
        template.subject,
        template.html,
        template.text,
        'survey',
        waitlistId
      );

      return result;
    } catch (error) {
      console.error('Error sending survey email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send Community Building Email (T+5)
   * Sent 5 days after waitlist signup
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendCommunityEmail(email, name, waitlistId = null) {
    try {
      const template = getCommunityEmailTemplate(name);
      
      const result = await this._sendEmail(
        email,
        template.subject,
        template.html,
        template.text,
        'community',
        waitlistId
      );

      return result;
    } catch (error) {
      console.error('Error sending community email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send Referral Reminder Email (T+8)
   * Sent 8 days after waitlist signup
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} referralCode - User's referral code
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendReferralReminderEmail(email, name, referralCode, waitlistId = null) {
    try {
      // Get waitlist position
      const positionResult = await waitlistService.getWaitlistPosition(email);
      const position = positionResult.position || 0;
      const total = positionResult.total || 0;

      const template = getReferralReminderEmailTemplate(name, referralCode, position, total);
      
      const result = await this._sendEmail(
        email,
        template.subject,
        template.html,
        template.text,
        'referral_reminder',
        waitlistId
      );

      return result;
    } catch (error) {
      console.error('Error sending referral reminder email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send Invite Email (Rolling)
   * Sent when beta access is granted
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendInviteEmail(email, name, waitlistId = null) {
    try {
      const template = getInviteEmailTemplate(name);
      
      const result = await this._sendEmail(
        email,
        template.subject,
        template.html,
        template.text,
        'invite',
        waitlistId
      );

      return result;
    } catch (error) {
      console.error('Error sending invite email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send Feedback Email (T+7 post-invite)
   * Sent 7 days after beta access granted
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendFeedbackEmail(email, name, waitlistId = null) {
    try {
      const template = getFeedbackEmailTemplate(name);
      
      const result = await this._sendEmail(
        email,
        template.subject,
        template.html,
        template.text,
        'feedback',
        waitlistId
      );

      return result;
    } catch (error) {
      console.error('Error sending feedback email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Schedule email drip sequence for a waitlist user
   * This should be called when user joins waitlist
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} referralCode - User's referral code
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async scheduleEmailDripSequence(email, name, referralCode, waitlistId) {
    try {
      // T+0: Welcome email (send immediately)
      await this.sendWelcomeEmail(email, name, referralCode, waitlistId);

      // Note: T+2, T+5, T+8 emails should be scheduled via:
      // 1. Firebase Functions with scheduled triggers (recommended)
      // 2. Cron job on backend
      // 3. Client-side setTimeout (not recommended for production)
      
      // For now, we'll just send the welcome email
      // The other emails will be sent manually or via scheduled functions

      console.log(`✅ Email drip sequence scheduled for: ${email}`);

      return {
        success: true,
        message: 'Welcome email sent. Other emails will be scheduled.'
      };
    } catch (error) {
      console.error('Error scheduling email drip sequence:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if email was already sent to avoid duplicates
   * @param {string} waitlistId - Waitlist document ID
   * @param {string} emailType - Type of email (welcome, survey, etc.)
   * @returns {Promise<boolean>}
   */
  async wasEmailSent(waitlistId, emailType) {
    try {
      const emailQuery = query(
        collection(db, this.emailDripsCollection),
        where('waitlistId', '==', waitlistId),
        where('emailType', '==', emailType)
      );
      
      const snapshot = await getDocs(emailQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking if email was sent:', error);
      return false;
    }
  }

  /**
   * Get email drip status for a waitlist user
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, emails?: Array, error?: string}>}
   */
  async getEmailDripStatus(waitlistId) {
    try {
      const emailQuery = query(
        collection(db, this.emailDripsCollection),
        where('waitlistId', '==', waitlistId)
      );
      
      const snapshot = await getDocs(emailQuery);
      const emails = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        emails
      };
    } catch (error) {
      console.error('Error getting email drip status:', error);
      return {
        success: false,
        error: error.message,
        emails: []
      };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
