import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { kCoinsService } from './kCoinsService';
import { referralService } from './referralService';
import { emailService } from './emailService';

/**
 * Waitlist Service
 * 
 * Manages waitlist signups, beta access checking, and referral code generation.
 * Integrates with K-Coins service for rewards.
 */
class WaitlistService {
  constructor() {
    this.waitlistCollection = 'waitlist';
  }

  /**
   * Generate a unique referral code for a user
   * Format: KM-XXXXXX (6 uppercase alphanumeric characters)
   * @param {string} userId - Firebase user ID or email
   * @returns {string} Unique referral code
   */
  generateReferralCode(userId) {
    // Use userId hash + random component for uniqueness
    const hash = userId.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `KM-${random}`;
    
    return code;
  }

  /**
   * Join the waitlist
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} referralCode - Optional referral code from referrer
   * @returns {Promise<{success: boolean, waitlistId?: string, referralCode?: string, error?: string}>}
   */
  async joinWaitlist(email, name, referralCode = null) {
    try {
      if (!email || !name) {
        throw new Error('Email and name are required');
      }

      // Check if user already exists in waitlist
      const existingQuery = query(
        collection(db, this.waitlistCollection),
        where('email', '==', email.toLowerCase().trim())
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        const existingDoc = existingSnapshot.docs[0];
        return {
          success: false,
          error: 'Email already registered on waitlist',
          waitlistId: existingDoc.id,
          referralCode: existingDoc.data().referralCode
        };
      }

      // Get total waitlist count for signup order
      // Use getDocs instead of getCountFromServer to avoid index requirement
      let signupOrder = 1;
      try {
        const allWaitlistSnapshot = await getDocs(collection(db, this.waitlistCollection));
        signupOrder = allWaitlistSnapshot.size + 1;
      } catch (error) {
        console.warn('Could not get waitlist count, using default order:', error);
        // Fallback: use timestamp-based order
        signupOrder = Date.now();
      }

      // Generate unique referral code
      const userReferralCode = this.generateReferralCode(email);

      // Calculate initial cohort score (base score)
      const baseScore = 1000 - (signupOrder * 10);

      // Create waitlist entry
      const waitlistData = {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        referredBy: referralCode || null,
        referralCode: userReferralCode,
        signupDate: serverTimestamp(),
        signupOrder,
        cohortScore: baseScore,
        kCoins: 25, // Initial K-Coins balance
        isCreator: false,
        creatorApproved: false,
        surveyCompleted: false,
        surveyData: null,
        emailEngagement: {
          opens: 0,
          clicks: 0,
          lastOpened: null
        },
        betaAccessGranted: false,
        betaAccessDate: null,
        waveNumber: null,
        conversionStatus: 'waitlist',
        createdAt: serverTimestamp()
      };

      const waitlistRef = await addDoc(
        collection(db, this.waitlistCollection),
        waitlistData
      );

      console.log(`✅ User joined waitlist: ${email} (Order: ${signupOrder})`);

      // Award +25 K-Coins for waitlist signup
      // Note: We'll need userId for K-Coins, but waitlist uses email
      // For now, we'll create a transaction record with email
      // Later, when user gets beta access and creates account, we'll link it
      await this._awardWaitlistKCoins(email, 25, 'waitlist_signup', 'Joined waitlist');

      // Handle referral if referral code provided
      if (referralCode) {
        await this._handleReferral(referralCode, email, waitlistRef.id, userReferralCode);
      }

      // Send welcome email (T+0)
      try {
        await emailService.sendWelcomeEmail(email, name, userReferralCode, waitlistRef.id);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the waitlist signup if email fails
      }

      return {
        success: true,
        waitlistId: waitlistRef.id,
        referralCode: userReferralCode,
        signupOrder
      };
    } catch (error) {
      console.error('Error joining waitlist:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Award K-Coins for waitlist signup (using email as identifier)
   * @private
   */
  async _awardWaitlistKCoins(email, amount, type, description) {
    try {
      // For waitlist users without Firebase account yet, we'll store transactions
      // with email as userId. When they get beta access and create account,
      // we can migrate these transactions to their userId.
      
      // Create transaction with email as userId (temporary)
      const transactionData = {
        userId: `waitlist:${email}`, // Temporary identifier
        email: email,
        type,
        amount,
        description,
        relatedId: null,
        createdAt: serverTimestamp()
      };

      await addDoc(
        collection(db, 'kcoins_transactions'),
        transactionData
      );

      console.log(`✅ Awarded ${amount} K-Coins to waitlist user: ${email}`);
    } catch (error) {
      console.error('Error awarding waitlist K-Coins:', error);
    }
  }

  /**
   * Handle referral when user joins with referral code
   * @private
   */
  async _handleReferral(referralCode, referredEmail, waitlistId, newUserReferralCode) {
    try {
      // Validate referral code using referralService
      const validationResult = await referralService.validateReferralCode(referralCode);

      if (!validationResult.valid) {
        console.warn(`⚠️ Invalid referral code: ${referralCode}`);
        return;
      }

      // Create referral record using referralService
      const referralResult = await referralService.createReferral(
        validationResult.waitlistId,
        referredEmail,
        referralCode
      );

      if (!referralResult.success) {
        console.warn(`⚠️ Failed to create referral: ${referralResult.error}`);
        return;
      }

      // Award +100 K-Coins to referrer using referralService
      await referralService.awardReferralKCoins(
        validationResult.waitlistId,
        referralResult.referralId
      );

      // Award +25 K-Coins to new user (already done in joinWaitlist)
      console.log(`✅ Referral processed: ${validationResult.referrerEmail} → ${referredEmail}`);
    } catch (error) {
      console.error('Error handling referral:', error);
    }
  }

  /**
   * Check if user has beta access
   * @param {string} userId - Firebase user ID or email
   * @returns {Promise<{success: boolean, hasAccess?: boolean, waitlistData?: object, error?: string}>}
   */
  async checkBetaAccess(userId) {
    try {
      // Try to find by email first (for waitlist users)
      let waitlistQuery = query(
        collection(db, this.waitlistCollection),
        where('email', '==', userId.toLowerCase().trim())
      );
      let snapshot = await getDocs(waitlistQuery);

      // If not found by email, try by document ID (if userId is waitlist ID)
      if (snapshot.empty) {
        try {
          const waitlistDoc = await getDoc(doc(db, this.waitlistCollection, userId));
          if (waitlistDoc.exists()) {
            snapshot = { docs: [waitlistDoc] };
          }
        } catch (error) {
          // Not a document ID, continue
        }
      }

      if (snapshot.empty || !snapshot.docs || snapshot.docs.length === 0) {
        return {
          success: true,
          hasAccess: false,
          waitlistData: null
        };
      }

      const waitlistData = snapshot.docs[0].data();
      const hasAccess = waitlistData.betaAccessGranted === true;

      return {
        success: true,
        hasAccess,
        waitlistData: {
          id: snapshot.docs[0].id,
          ...waitlistData
        }
      };
    } catch (error) {
      console.error('Error checking beta access:', error);
      return {
        success: false,
        error: error.message,
        hasAccess: false
      };
    }
  }

  /**
   * Get waitlist position for a user
   * @param {string} email - User email
   * @returns {Promise<{success: boolean, position?: number, total?: number, error?: string}>}
   */
  async getWaitlistPosition(email) {
    try {
      const waitlistQuery = query(
        collection(db, this.waitlistCollection),
        where('email', '==', email.toLowerCase().trim())
      );
      const snapshot = await getDocs(waitlistQuery);

      if (snapshot.empty) {
        return {
          success: false,
          error: 'Email not found in waitlist'
        };
      }

      const waitlistData = snapshot.docs[0].data();
      const signupOrder = waitlistData.signupOrder || 0;

      // Get total waitlist count (using getDocs to avoid index requirement)
      const allWaitlistSnapshot = await getDocs(collection(db, this.waitlistCollection));
      const total = allWaitlistSnapshot.size;

      return {
        success: true,
        position: signupOrder,
        total
      };
    } catch (error) {
      console.error('Error getting waitlist position:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get total waitlist count
   * @returns {Promise<{success: boolean, count?: number, error?: string}>}
   */
  async getWaitlistCount() {
    try {
      // Use getDocs instead of getCountFromServer to avoid index requirement
      const snapshot = await getDocs(collection(db, this.waitlistCollection));
      const count = snapshot.size;

      return {
        success: true,
        count
      };
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      return {
        success: false,
        error: error.message,
        count: 0
      };
    }
  }

  /**
   * Get user's referral code from waitlist
   * @param {string} email - User email
   * @returns {Promise<{success: boolean, referralCode?: string, error?: string}>}
   */
  async getUserReferralCode(email) {
    try {
      const waitlistQuery = query(
        collection(db, this.waitlistCollection),
        where('email', '==', email.toLowerCase().trim())
      );
      const snapshot = await getDocs(waitlistQuery);

      if (snapshot.empty) {
        return {
          success: false,
          error: 'Email not found in waitlist'
        };
      }

      const referralCode = snapshot.docs[0].data().referralCode;

      return {
        success: true,
        referralCode
      };
    } catch (error) {
      console.error('Error getting referral code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const waitlistService = new WaitlistService();
export default waitlistService;

