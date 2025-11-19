import { 
  collection, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * Email Tracking Service
 * 
 * Handles SendGrid webhook events to track email opens, clicks, and engagement.
 * Updates cohort scores based on email engagement (+5 per open, +10 per click).
 */

class EmailTrackingService {
  constructor() {
    this.emailDripsCollection = 'email_drips';
    this.waitlistCollection = 'waitlist';
  }

  /**
   * Process SendGrid webhook event
   * This should be called from a Firebase Function or backend endpoint
   * @param {Object} event - SendGrid webhook event
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async processWebhookEvent(event) {
    try {
      const { event: eventType, email, timestamp, sg_message_id } = event;

      // Find email drip record by message ID or email
      const emailDrip = await this._findEmailDripByMessageId(sg_message_id) || 
                       await this._findEmailDripByEmail(email);

      if (!emailDrip) {
        console.warn(`⚠️ Email drip not found for event: ${eventType}, email: ${email}`);
        return {
          success: false,
          error: 'Email drip not found'
        };
      }

      // Process event based on type
      switch (eventType) {
        case 'open':
          await this._handleEmailOpen(emailDrip.id, emailDrip.waitlistId, timestamp);
          break;
        case 'click':
          await this._handleEmailClick(emailDrip.id, emailDrip.waitlistId, timestamp);
          break;
        case 'bounce':
        case 'dropped':
        case 'spamreport':
        case 'unsubscribe':
          await this._handleEmailFailure(emailDrip.id, eventType, timestamp);
          break;
        default:
          console.log(`ℹ️ Unhandled event type: ${eventType}`);
      }

      return {
        success: true,
        eventType,
        emailDripId: emailDrip.id
      };
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle email open event
   * Updates email drip record and adds +5 to cohort score
   * @private
   */
  async _handleEmailOpen(emailDripId, waitlistId, timestamp) {
    try {
      const emailDripRef = doc(db, this.emailDripsCollection, emailDripId);
      
      // Update email drip record
      await updateDoc(emailDripRef, {
        opened: true,
        openedAt: timestamp || serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update cohort score (+5 points for email open)
      await this._updateCohortScore(waitlistId, 5, 'email_open');

      console.log(`✅ Email opened: ${emailDripId}`);
    } catch (error) {
      console.error('Error handling email open:', error);
      throw error;
    }
  }

  /**
   * Handle email click event
   * Updates email drip record and adds +10 to cohort score
   * @private
   */
  async _handleEmailClick(emailDripId, waitlistId, timestamp) {
    try {
      const emailDripRef = doc(db, this.emailDripsCollection, emailDripId);
      
      // Update email drip record
      await updateDoc(emailDripRef, {
        clicked: true,
        clickedAt: timestamp || serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update cohort score (+10 points for email click)
      await this._updateCohortScore(waitlistId, 10, 'email_click');

      console.log(`✅ Email clicked: ${emailDripId}`);
    } catch (error) {
      console.error('Error handling email click:', error);
      throw error;
    }
  }

  /**
   * Handle email failure events (bounce, dropped, spam, unsubscribe)
   * @private
   */
  async _handleEmailFailure(emailDripId, failureType, timestamp) {
    try {
      const emailDripRef = doc(db, this.emailDripsCollection, emailDripId);
      
      await updateDoc(emailDripRef, {
        failed: true,
        failureType,
        failedAt: timestamp || serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`⚠️ Email failed (${failureType}): ${emailDripId}`);
    } catch (error) {
      console.error('Error handling email failure:', error);
      throw error;
    }
  }

  /**
   * Update cohort score for waitlist user
   * @private
   */
  async _updateCohortScore(waitlistId, points, reason) {
    try {
      const waitlistRef = doc(db, this.waitlistCollection, waitlistId);
      const waitlistDoc = await waitlistRef.get();

      if (!waitlistDoc.exists()) {
        console.warn(`⚠️ Waitlist document not found: ${waitlistId}`);
        return;
      }

      const currentScore = waitlistDoc.data().cohortScore || 0;
      const newScore = currentScore + points;

      await updateDoc(waitlistRef, {
        cohortScore: newScore,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Cohort score updated: ${waitlistId} (+${points} for ${reason})`);
    } catch (error) {
      console.error('Error updating cohort score:', error);
      throw error;
    }
  }

  /**
   * Find email drip record by SendGrid message ID
   * @private
   */
  async _findEmailDripByMessageId(messageId) {
    try {
      // Note: We need to store messageId when sending email
      // For now, we'll search by email and timestamp
      // This should be improved to store messageId in email_drips collection
      
      const emailQuery = query(
        collection(db, this.emailDripsCollection),
        where('messageId', '==', messageId)
      );
      
      const snapshot = await getDocs(emailQuery);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding email drip by message ID:', error);
      return null;
    }
  }

  /**
   * Find email drip record by email address
   * @private
   */
  async _findEmailDripByEmail(email) {
    try {
      const emailQuery = query(
        collection(db, this.emailDripsCollection),
        where('email', '==', email.toLowerCase().trim())
      );
      
      const snapshot = await getDocs(emailQuery);
      
      if (!snapshot.empty) {
        // Return the most recent one
        const docs = snapshot.docs.sort((a, b) => {
          const aTime = a.data().sentAt?.toMillis() || 0;
          const bTime = b.data().sentAt?.toMillis() || 0;
          return bTime - aTime;
        });
        
        const doc = docs[0];
        return {
          id: doc.id,
          ...doc.data()
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding email drip by email:', error);
      return null;
    }
  }

  /**
   * Get email engagement stats for a waitlist user
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, stats?: Object, error?: string}>}
   */
  async getEmailEngagementStats(waitlistId) {
    try {
      const emailQuery = query(
        collection(db, this.emailDripsCollection),
        where('waitlistId', '==', waitlistId)
      );
      
      const snapshot = await getDocs(emailQuery);
      const emails = snapshot.docs.map(doc => doc.data());

      const stats = {
        totalSent: emails.length,
        totalOpened: emails.filter(e => e.opened).length,
        totalClicked: emails.filter(e => e.clicked).length,
        openRate: emails.length > 0 ? (emails.filter(e => e.opened).length / emails.length * 100).toFixed(1) : 0,
        clickRate: emails.length > 0 ? (emails.filter(e => e.clicked).length / emails.length * 100).toFixed(1) : 0,
        emails: emails.map(e => ({
          type: e.emailType,
          sentAt: e.sentAt,
          opened: e.opened,
          clicked: e.clicked
        }))
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Error getting email engagement stats:', error);
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  }

  /**
   * Update email drip record with SendGrid message ID
   * This should be called after sending email to store the message ID
   * @param {string} emailDripId - Email drip document ID
   * @param {string} messageId - SendGrid message ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateMessageId(emailDripId, messageId) {
    try {
      const emailDripRef = doc(db, this.emailDripsCollection, emailDripId);
      
      await updateDoc(emailDripRef, {
        messageId,
        updatedAt: serverTimestamp()
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('Error updating message ID:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const emailTrackingService = new EmailTrackingService();
export default emailTrackingService;

