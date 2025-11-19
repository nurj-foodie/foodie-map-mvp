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
import { db } from '../config/firebaseConfig';
import { emailService } from './emailService';
import { kCoinsService } from './kCoinsService';
import { waitlistService } from './waitlistService';

/**
 * Survey Service
 * 
 * Manages survey functionality for beta phase.
 * Survey is sent T+2 days after waitlist signup.
 * Awards +50 K-Coins on completion.
 * Updates cohort score based on drive frequency.
 */

class SurveyService {
  constructor() {
    this.surveyResponsesCollection = 'survey_responses';
    this.waitlistCollection = 'waitlist';
  }

  /**
   * Send survey email (T+2)
   * This should be called 2 days after waitlist signup
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendSurveyEmail(email, name, waitlistId) {
    try {
      // Check if survey already sent
      const wasSent = await this.wasSurveySent(waitlistId);
      if (wasSent) {
        console.log(`ℹ️ Survey email already sent to: ${email}`);
        return {
          success: true,
          message: 'Survey email already sent'
        };
      }

      // Send survey email via email service
      const result = await emailService.sendSurveyEmail(email, name, waitlistId);

      if (result.success) {
        console.log(`✅ Survey email sent to: ${email}`);
      }

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
   * Submit survey response
   * @param {string} waitlistId - Waitlist document ID
   * @param {Object} surveyData - Survey response data
   * @param {string} surveyData.device - Device type ('iOS' or 'Android')
   * @param {string} surveyData.driveFrequency - Drive frequency ('weekly', 'monthly', 'occasional')
   * @param {string} surveyData.corridor - Usual corridor (free text, e.g., 'KL ↔ Penang')
   * @returns {Promise<{success: boolean, surveyId?: string, error?: string}>}
   */
  async submitSurvey(waitlistId, surveyData) {
    try {
      if (!waitlistId || !surveyData) {
        throw new Error('Waitlist ID and survey data are required');
      }

      // Validate survey data
      const { device, driveFrequency, corridor } = surveyData;
      if (!device || !driveFrequency || !corridor) {
        throw new Error('Device, drive frequency, and corridor are required');
      }

      // Check if survey already completed
      const waitlistDoc = await getDoc(doc(db, this.waitlistCollection, waitlistId));
      if (!waitlistDoc.exists()) {
        throw new Error('Waitlist entry not found');
      }

      const waitlistData = waitlistDoc.data();
      if (waitlistData.surveyCompleted) {
        return {
          success: false,
          error: 'Survey already completed'
        };
      }

      // Get user email for K-Coins
      const userEmail = waitlistData.email;
      const userId = `waitlist:${userEmail}`; // Use email as userId for waitlist users

      // Create survey response
      const surveyResponse = {
        waitlistId,
        email: userEmail,
        device,
        driveFrequency,
        corridor: corridor.trim(),
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      const surveyRef = await addDoc(
        collection(db, this.surveyResponsesCollection),
        surveyResponse
      );

      // Update waitlist entry
      await updateDoc(doc(db, this.waitlistCollection, waitlistId), {
        surveyCompleted: true,
        surveyData: {
          device,
          driveFrequency,
          corridor: corridor.trim(),
          submittedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      // Award +50 K-Coins for survey completion
      await kCoinsService.awardKCoins(
        userId,
        50,
        'survey',
        'Completed beta survey',
        surveyRef.id
      );

      // Update cohort score based on drive frequency
      await this._updateCohortScoreFromDriveFrequency(waitlistId, driveFrequency);

      console.log(`✅ Survey submitted: ${userEmail} (Survey ID: ${surveyRef.id})`);

      return {
        success: true,
        surveyId: surveyRef.id
      };
    } catch (error) {
      console.error('Error submitting survey:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update cohort score based on drive frequency
   * Drive frequency contributes 25% weight to cohort score
   * Weekly: +50 points, Monthly: +25 points, Occasional: +10 points
   * @private
   */
  async _updateCohortScoreFromDriveFrequency(waitlistId, driveFrequency) {
    try {
      const waitlistRef = doc(db, this.waitlistCollection, waitlistId);
      const waitlistDoc = await getDoc(waitlistRef);

      if (!waitlistDoc.exists()) {
        console.warn(`⚠️ Waitlist document not found: ${waitlistId}`);
        return;
      }

      // Calculate points based on drive frequency
      let points = 0;
      switch (driveFrequency.toLowerCase()) {
        case 'weekly':
          points = 50; // Highest priority
          break;
        case 'monthly':
          points = 25; // Medium priority
          break;
        case 'occasional':
          points = 10; // Lower priority
          break;
        default:
          points = 10; // Default to occasional
      }

      const currentScore = waitlistDoc.data().cohortScore || 0;
      const newScore = currentScore + points;

      await updateDoc(waitlistRef, {
        cohortScore: newScore,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Cohort score updated: ${waitlistId} (+${points} for drive frequency: ${driveFrequency})`);
    } catch (error) {
      console.error('Error updating cohort score from drive frequency:', error);
      // Don't throw - survey submission should still succeed
    }
  }

  /**
   * Get survey status for a waitlist user
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, completed?: boolean, surveyData?: Object, error?: string}>}
   */
  async getSurveyStatus(waitlistId) {
    try {
      const waitlistDoc = await getDoc(doc(db, this.waitlistCollection, waitlistId));

      if (!waitlistDoc.exists()) {
        return {
          success: false,
          error: 'Waitlist entry not found'
        };
      }

      const waitlistData = waitlistDoc.data();
      const completed = waitlistData.surveyCompleted || false;
      const surveyData = waitlistData.surveyData || null;

      return {
        success: true,
        completed,
        surveyData
      };
    } catch (error) {
      console.error('Error getting survey status:', error);
      return {
        success: false,
        error: error.message,
        completed: false
      };
    }
  }

  /**
   * Check if survey email was already sent
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<boolean>}
   */
  async wasSurveySent(waitlistId) {
    try {
      return await emailService.wasEmailSent(waitlistId, 'survey');
    } catch (error) {
      console.error('Error checking if survey was sent:', error);
      return false;
    }
  }

  /**
   * Get survey response by waitlist ID
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, surveyData?: Object, error?: string}>}
   */
  async getSurveyResponse(waitlistId) {
    try {
      const surveyQuery = query(
        collection(db, this.surveyResponsesCollection),
        where('waitlistId', '==', waitlistId)
      );

      const snapshot = await getDocs(surveyQuery);

      if (snapshot.empty) {
        return {
          success: false,
          error: 'Survey response not found'
        };
      }

      const surveyDoc = snapshot.docs[0];
      return {
        success: true,
        surveyData: {
          id: surveyDoc.id,
          ...surveyDoc.data()
        }
      };
    } catch (error) {
      console.error('Error getting survey response:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Schedule survey email (T+2)
   * This should be called when user joins waitlist
   * Note: For now, this is a placeholder. In production, use:
   * - Firebase Functions scheduled triggers (recommended)
   * - Cron job on backend
   * - Manual sending via admin dashboard
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async scheduleSurveyEmail(email, name, waitlistId) {
    try {
      // Note: T+2 email should be scheduled via Firebase Functions scheduled trigger
      // For now, we'll just log that it should be scheduled
      console.log(`📅 Survey email should be sent T+2 to: ${email} (Waitlist ID: ${waitlistId})`);
      
      return {
        success: true,
        message: 'Survey email will be sent T+2 days after signup (schedule via Firebase Functions)'
      };
    } catch (error) {
      console.error('Error scheduling survey email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const surveyService = new SurveyService();
export default surveyService;

