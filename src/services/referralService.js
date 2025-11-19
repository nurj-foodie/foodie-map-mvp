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
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { kCoinsService } from './kCoinsService';
import { checkBetaAccess } from '../utils/betaAccess';

/**
 * Referral Service
 * 
 * Manages referral tracking, validation, and rewards.
 * Integrates with K-Coins service and waitlist for referral bonuses.
 */
class ReferralService {
  constructor() {
    this.referralsCollection = 'referrals';
    this.waitlistCollection = 'waitlist';
  }

  /**
   * Create a referral record
   * @param {string} referrerId - Waitlist document ID or email of referrer
   * @param {string} referredEmail - Email of referred user
   * @param {string} referralCode - Referral code used
   * @returns {Promise<{success: boolean, referralId?: string, error?: string}>}
   */
  async createReferral(referrerId, referredEmail, referralCode) {
    try {
      if (!referrerId || !referredEmail || !referralCode) {
        throw new Error('Referrer ID, referred email, and referral code are required');
      }

      // Get referrer email if referrerId is a document ID
      let referrerEmail = referrerId;
      let referrerWaitlistId = referrerId;

      // Check if referrerId is an email or document ID
      if (!referrerId.includes('@')) {
        // Likely a document ID, get email from waitlist
        const referrerDoc = await getDoc(doc(db, this.waitlistCollection, referrerId));
        if (referrerDoc.exists()) {
          referrerEmail = referrerDoc.data().email;
          referrerWaitlistId = referrerDoc.id;
        } else {
          throw new Error('Referrer not found in waitlist');
        }
      } else {
        // Email provided, find waitlist document
        const referrerQuery = query(
          collection(db, this.waitlistCollection),
          where('email', '==', referrerId.toLowerCase().trim())
        );
        const referrerSnapshot = await getDocs(referrerQuery);
        if (!referrerSnapshot.empty) {
          referrerWaitlistId = referrerSnapshot.docs[0].id;
          referrerEmail = referrerId.toLowerCase().trim();
        } else {
          throw new Error('Referrer not found in waitlist');
        }
      }

      // Check if referral already exists
      const existingQuery = query(
        collection(db, this.referralsCollection),
        where('referrerEmail', '==', referrerEmail),
        where('referredEmail', '==', referredEmail.toLowerCase().trim())
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        return {
          success: false,
          error: 'Referral already exists',
          referralId: existingSnapshot.docs[0].id
        };
      }

      // Get referrer data to check if creator
      const referrerDoc = await getDoc(doc(db, this.waitlistCollection, referrerWaitlistId));
      const isCreatorReferral = referrerDoc.exists() && referrerDoc.data().isCreator === true;

      // Create referral record
      const referralData = {
        referrerId: referrerWaitlistId,
        referrerEmail,
        referredEmail: referredEmail.toLowerCase().trim(),
        referralCode: referralCode.toUpperCase().trim(),
        isCreatorReferral,
        status: 'signed_up_waitlist',
        kCoinsAwarded: false,
        pointsAwarded: false,
        createdAt: serverTimestamp(),
        betaAccessDate: null,
        convertedAt: null
      };

      const referralRef = await addDoc(
        collection(db, this.referralsCollection),
        referralData
      );

      console.log(`✅ Referral created: ${referrerEmail} → ${referredEmail}`);

      return {
        success: true,
        referralId: referralRef.id
      };
    } catch (error) {
      console.error('Error creating referral:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all referrals for a user
   * @param {string} userId - Waitlist document ID or email
   * @returns {Promise<{success: boolean, referrals?: Array, error?: string}>}
   */
  async getUserReferrals(userId) {
    try {
      // Find referrer email
      let referrerEmail = userId;

      if (!userId.includes('@')) {
        // Likely a document ID
        const referrerDoc = await getDoc(doc(db, this.waitlistCollection, userId));
        if (referrerDoc.exists()) {
          referrerEmail = referrerDoc.data().email;
        } else {
          return { success: false, error: 'User not found', referrals: [] };
        }
      }

      // Query referrals by referrer email
      // Note: Removed orderBy to avoid index requirement, will sort client-side
      const referralsQuery = query(
        collection(db, this.referralsCollection),
        where('referrerEmail', '==', referrerEmail.toLowerCase().trim())
      );

      const snapshot = await getDocs(referralsQuery);
      const referrals = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        referrals.push({
          id: doc.id,
          referredEmail: data.referredEmail,
          status: data.status,
          kCoinsAwarded: data.kCoinsAwarded || false,
          pointsAwarded: data.pointsAwarded || false,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          betaAccessDate: data.betaAccessDate?.toDate ? data.betaAccessDate.toDate() : null
        });
      });

      // Sort by createdAt descending (newest first) - client-side sorting
      referrals.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB - dateA; // Descending order
      });

      return {
        success: true,
        referrals
      };
    } catch (error) {
      console.error('Error getting user referrals:', error);
      return {
        success: false,
        error: error.message,
        referrals: []
      };
    }
  }

  /**
   * Validate a referral code
   * @param {string} code - Referral code to validate
   * @returns {Promise<{success: boolean, valid?: boolean, referrerEmail?: string, error?: string}>}
   */
  async validateReferralCode(code) {
    try {
      if (!code) {
        return { success: false, valid: false, error: 'Referral code is required' };
      }

      const waitlistQuery = query(
        collection(db, this.waitlistCollection),
        where('referralCode', '==', code.toUpperCase().trim())
      );
      const snapshot = await getDocs(waitlistQuery);

      if (snapshot.empty) {
        return {
          success: true,
          valid: false
        };
      }

      const waitlistData = snapshot.docs[0].data();

      return {
        success: true,
        valid: true,
        referrerEmail: waitlistData.email,
        referrerName: waitlistData.name,
        waitlistId: snapshot.docs[0].id
      };
    } catch (error) {
      console.error('Error validating referral code:', error);
      return {
        success: false,
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Award +100 K-Coins to referrer (when referred user joins waitlist)
   * Note: This is typically called from waitlistService, but kept here for manual use
   * @param {string} referrerId - Waitlist document ID or email
   * @param {string} referralId - Referral document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async awardReferralKCoins(referrerId, referralId) {
    try {
      // Get referrer email
      let referrerEmail = referrerId;

      if (!referrerId.includes('@')) {
        const referrerDoc = await getDoc(doc(db, this.waitlistCollection, referrerId));
        if (referrerDoc.exists()) {
          referrerEmail = referrerDoc.data().email;
        } else {
          throw new Error('Referrer not found');
        }
      }

      // Check if already awarded
      if (referralId) {
        const referralDoc = await getDoc(doc(db, this.referralsCollection, referralId));
        if (referralDoc.exists() && referralDoc.data().kCoinsAwarded) {
          return { success: true, message: 'K-Coins already awarded' };
        }
      }

      // Award K-Coins (using email as temporary userId)
      // Note: When referrer gets beta access and creates account, we'll migrate transactions
      const result = await kCoinsService.awardKCoins(
        `waitlist:${referrerEmail}`,
        100,
        'referral',
        'Referred a friend to waitlist',
        referralId
      );

      if (result.success && referralId) {
        // Update referral record
        await updateDoc(doc(db, this.referralsCollection, referralId), {
          kCoinsAwarded: true
        });
      }

      return result;
    } catch (error) {
      console.error('Error awarding referral K-Coins:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Award +50 cohort points to referrer (when referred user joins beta)
   * @param {string} referrerId - Waitlist document ID or email
   * @param {string} referralId - Referral document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async awardReferralPoints(referrerId, referralId) {
    try {
      // Check if referrer has beta access (points only awarded if referrer is in beta)
      const referrerAccess = await checkBetaAccess(referrerId);
      
      if (!referrerAccess.hasAccess) {
        return {
          success: false,
          error: 'Referrer does not have beta access. Points only awarded if referrer is in beta.'
        };
      }

      // Check if already awarded
      if (referralId) {
        const referralDoc = await getDoc(doc(db, this.referralsCollection, referralId));
        if (referralDoc.exists() && referralDoc.data().pointsAwarded) {
          return { success: true, message: 'Points already awarded' };
        }
      }

      // Get referrer waitlist document
      let referrerWaitlistId = referrerId;
      if (referrerId.includes('@')) {
        const referrerQuery = query(
          collection(db, this.waitlistCollection),
          where('email', '==', referrerId.toLowerCase().trim())
        );
        const referrerSnapshot = await getDocs(referrerQuery);
        if (!referrerSnapshot.empty) {
          referrerWaitlistId = referrerSnapshot.docs[0].id;
        } else {
          throw new Error('Referrer not found');
        }
      }

      // Update cohort score (+50 points)
      const waitlistRef = doc(db, this.waitlistCollection, referrerWaitlistId);
      const waitlistDoc = await getDoc(waitlistRef);
      
      if (waitlistDoc.exists()) {
        const currentScore = waitlistDoc.data().cohortScore || 0;
        await updateDoc(waitlistRef, {
          cohortScore: currentScore + 50
        });

        // Update referral record
        if (referralId) {
          await updateDoc(doc(db, this.referralsCollection, referralId), {
            pointsAwarded: true
          });
        }

        console.log(`✅ Awarded +50 cohort points to referrer: ${referrerId}`);

        return {
          success: true,
          newScore: currentScore + 50
        };
      } else {
        throw new Error('Referrer waitlist document not found');
      }
    } catch (error) {
      console.error('Error awarding referral points:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get referral statistics for a user
   * @param {string} userId - Waitlist document ID or email
   * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
   */
  async getReferralStats(userId) {
    try {
      const referralsResult = await this.getUserReferrals(userId);
      
      if (!referralsResult.success) {
        return referralsResult;
      }

      const referrals = referralsResult.referrals || [];
      
      const stats = {
        totalReferrals: referrals.length,
        waitlistReferrals: referrals.filter(r => r.status === 'signed_up_waitlist').length,
        betaReferrals: referrals.filter(r => r.status === 'beta_active').length,
        convertedReferrals: referrals.filter(r => r.status === 'converted').length,
        kCoinsEarned: referrals.filter(r => r.kCoinsAwarded).length * 100, // 100 K-Coins per referral
        pointsEarned: referrals.filter(r => r.pointsAwarded).length * 50 // 50 points per beta referral
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check and award points when referred user gets beta access
   * This should be called when a referred user is granted beta access
   * @param {string} referredUserId - Waitlist document ID or email of referred user
   * @returns {Promise<{success: boolean, awarded?: boolean, error?: string}>}
   */
  async checkAndAwardPoints(referredUserId) {
    try {
      // Find referral record
      let referredEmail = referredUserId;

      if (!referredUserId.includes('@')) {
        const referredDoc = await getDoc(doc(db, this.waitlistCollection, referredUserId));
        if (referredDoc.exists()) {
          referredEmail = referredDoc.data().email;
        } else {
          return { success: false, error: 'Referred user not found' };
        }
      }

      // Find referral record
      const referralQuery = query(
        collection(db, this.referralsCollection),
        where('referredEmail', '==', referredEmail.toLowerCase().trim()),
        where('status', '==', 'signed_up_waitlist')
      );
      const snapshot = await getDocs(referralQuery);

      if (snapshot.empty) {
        return {
          success: true,
          awarded: false,
          message: 'No referral found for this user'
        };
      }

      const referralDoc = snapshot.docs[0];
      const referralData = referralDoc.data();

      // Update referral status to beta_active
      await updateDoc(doc(db, this.referralsCollection, referralDoc.id), {
        status: 'beta_active',
        betaAccessDate: serverTimestamp()
      });

      // Award points to referrer (if referrer is in beta)
      const pointsResult = await this.awardReferralPoints(
        referralData.referrerId,
        referralDoc.id
      );

      return {
        success: true,
        awarded: pointsResult.success,
        message: pointsResult.success 
          ? 'Points awarded to referrer' 
          : pointsResult.error || 'Points not awarded'
      };
    } catch (error) {
      console.error('Error checking and awarding points:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const referralService = new ReferralService();
export default referralService;

