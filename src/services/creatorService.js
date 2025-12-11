import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  query, 
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { grantBetaAccess } from '../utils/betaAccess';
import { waitlistService } from './waitlistService';
import { referralService } from './referralService';

/**
 * Creator Service
 * 
 * Manages creator partnership system for beta phase.
 * Creators get automatic beta access, scoring bonuses, and reserved wave slots.
 */
class CreatorService {
  constructor() {
    this.waitlistCollection = 'waitlist';
    this.referralsCollection = 'referrals';
  }

  /**
   * Flag a user as a creator (with optional approval)
   * @param {string} waitlistId - Waitlist document ID
   * @param {boolean} isCreator - Whether to flag as creator
   * @param {boolean} approved - Whether creator is approved (default: false)
   * @param {boolean} autoGrantAccess - Whether to automatically grant beta access (default: true)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async flagAsCreator(waitlistId, isCreator, approved = false, autoGrantAccess = true) {
    try {
      if (!waitlistId) {
        throw new Error('Waitlist ID is required');
      }

      const waitlistDoc = await getDoc(doc(db, this.waitlistCollection, waitlistId));
      
      if (!waitlistDoc.exists()) {
        throw new Error('Waitlist entry not found');
      }

      const waitlistData = waitlistDoc.data();
      const updates = {
        isCreator: isCreator === true,
        creatorApproved: isCreator === true ? approved : false,
        updatedAt: serverTimestamp()
      };

      // If approving a creator and auto-grant is enabled, grant beta access
      if (isCreator === true && approved === true && autoGrantAccess) {
        if (!waitlistData.betaAccessGranted) {
          const grantResult = await grantBetaAccess(
            waitlistData.email,
            null // No specific wave number for creators
          );
          
          if (grantResult.success) {
            updates.betaAccessGranted = true;
            updates.betaAccessDate = serverTimestamp();
            updates.conversionStatus = 'beta_active';
            console.log(`✅ Creator ${waitlistData.email} granted automatic beta access`);
          }
        }
      }

      await updateDoc(doc(db, this.waitlistCollection, waitlistId), updates);

      console.log(`✅ Creator flag updated: ${waitlistData.email} (isCreator: ${isCreator}, approved: ${approved})`);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error flagging creator:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Grant beta access to a creator (if not already granted)
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async grantCreatorAccess(waitlistId) {
    try {
      if (!waitlistId) {
        throw new Error('Waitlist ID is required');
      }

      const waitlistDoc = await getDoc(doc(db, this.waitlistCollection, waitlistId));
      
      if (!waitlistDoc.exists()) {
        throw new Error('Waitlist entry not found');
      }

      const waitlistData = waitlistDoc.data();

      if (!waitlistData.isCreator || !waitlistData.creatorApproved) {
        throw new Error('User must be flagged and approved as creator first');
      }

      if (waitlistData.betaAccessGranted) {
        return {
          success: true,
          message: 'Beta access already granted'
        };
      }

      const grantResult = await grantBetaAccess(
        waitlistData.email,
        null // No specific wave number for creators
      );

      if (grantResult.success) {
        await updateDoc(doc(db, this.waitlistCollection, waitlistId), {
          betaAccessGranted: true,
          betaAccessDate: serverTimestamp(),
          conversionStatus: 'beta_active',
          updatedAt: serverTimestamp()
        });

        console.log(`✅ Creator access granted: ${waitlistData.email}`);
      }

      return grantResult;
    } catch (error) {
      console.error('Error granting creator access:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get creator's referral statistics
   * @param {string} waitlistId - Waitlist document ID (creator)
   * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
   */
  async getCreatorReferrals(waitlistId) {
    try {
      if (!waitlistId) {
        throw new Error('Waitlist ID is required');
      }

      const waitlistDoc = await getDoc(doc(db, this.waitlistCollection, waitlistId));
      
      if (!waitlistDoc.exists()) {
        throw new Error('Waitlist entry not found');
      }

      const waitlistData = waitlistDoc.data();

      if (!waitlistData.isCreator) {
        throw new Error('User is not flagged as creator');
      }

      // Get referrals by referral code
      const referralsQuery = query(
        collection(db, this.referralsCollection),
        where('referrerId', '==', waitlistId)
      );
      const referralsSnapshot = await getDocs(referralsQuery);

      const referrals = referralsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Also check by referral code (in case referrerId is not set)
      const referralsByCodeQuery = query(
        collection(db, this.referralsCollection),
        where('referralCode', '==', waitlistData.referralCode)
      );
      const referralsByCodeSnapshot = await getDocs(referralsByCodeQuery);

      const referralsByCode = referralsByCodeSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(ref => ref.id !== referrals.find(r => r.id === ref.id)?.id); // Avoid duplicates

      const allReferrals = [...referrals, ...referralsByCode];

      // Calculate statistics
      const totalReferrals = allReferrals.length;
      const betaActiveReferrals = allReferrals.filter(r => r.referredBetaActive === true).length;
      const totalKCoinsEarned = allReferrals.reduce((sum, r) => sum + (r.kCoinsAwarded || 0), 0);

      // Get referred users who joined beta
      const referredWaitlistIds = allReferrals
        .map(r => r.referredWaitlistId)
        .filter(id => id);

      const betaActiveCount = await Promise.all(
        referredWaitlistIds.map(async (id) => {
          try {
            const refWaitlistDoc = await getDoc(doc(db, this.waitlistCollection, id));
            return refWaitlistDoc.exists() && refWaitlistDoc.data().betaAccessGranted === true;
          } catch {
            return false;
          }
        })
      );

      const actualBetaActive = betaActiveCount.filter(Boolean).length;

      const stats = {
        creatorId: waitlistId,
        creatorEmail: waitlistData.email,
        creatorName: waitlistData.name,
        referralCode: waitlistData.referralCode,
        totalReferrals,
        betaActiveReferrals: Math.max(betaActiveReferrals, actualBetaActive),
        totalKCoinsEarned,
        referrals: allReferrals.slice(0, 50) // Limit to first 50 for display
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Error getting creator referrals:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get creator leaderboard (top creators by referrals)
   * @param {number} limitCount - Number of creators to return (default: 20)
   * @returns {Promise<{success: boolean, creators?: Array, error?: string}>}
   */
  async getCreatorLeaderboard(limitCount = 20) {
    try {
      // Get all creators (query without orderBy to avoid index requirement)
      let creatorsQuery = query(
        collection(db, this.waitlistCollection),
        where('isCreator', '==', true),
        where('creatorApproved', '==', true)
      );
      
      const creatorsSnapshot = await getDocs(creatorsQuery);
      let creators = creatorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by signupDate in memory
      creators.sort((a, b) => {
        const aDate = a.signupDate?.toDate ? a.signupDate.toDate() : new Date(0);
        const bDate = b.signupDate?.toDate ? b.signupDate.toDate() : new Date(0);
        return aDate - bDate;
      });

      // Get referral stats for each creator
      const creatorsWithStats = await Promise.all(
        creators.map(async (creator) => {
          const statsResult = await this.getCreatorReferrals(creator.id);
          
          if (statsResult.success) {
            return {
              ...creator,
              referralStats: statsResult.stats
            };
          }
          
          return {
            ...creator,
            referralStats: {
              totalReferrals: 0,
              betaActiveReferrals: 0,
              totalKCoinsEarned: 0
            }
          };
        })
      );

      // Sort by total referrals (descending), then by beta active referrals
      creatorsWithStats.sort((a, b) => {
        const aTotal = a.referralStats?.totalReferrals || 0;
        const bTotal = b.referralStats?.totalReferrals || 0;
        
        if (bTotal !== aTotal) {
          return bTotal - aTotal;
        }
        
        const aBeta = a.referralStats?.betaActiveReferrals || 0;
        const bBeta = b.referralStats?.betaActiveReferrals || 0;
        return bBeta - aBeta;
      });

      // Limit results
      const topCreators = creatorsWithStats.slice(0, limitCount);

      return {
        success: true,
        creators: topCreators
      };
    } catch (error) {
      console.error('Error getting creator leaderboard:', error);
      return {
        success: false,
        error: error.message,
        creators: []
      };
    }
  }

  /**
   * Get all creators (approved and pending)
   * @param {object} filters - Filter options
   * @param {boolean} filters.approvedOnly - Only return approved creators (default: false)
   * @returns {Promise<{success: boolean, creators?: Array, error?: string}>}
   */
  async getAllCreators(filters = {}) {
    try {
      const { approvedOnly = false } = filters;

      let creatorsQuery;
      
      // Query without orderBy to avoid index requirement - we'll sort in memory
      if (approvedOnly) {
        creatorsQuery = query(
          collection(db, this.waitlistCollection),
          where('isCreator', '==', true),
          where('creatorApproved', '==', true)
        );
      } else {
        creatorsQuery = query(
          collection(db, this.waitlistCollection),
          where('isCreator', '==', true)
        );
      }

      const creatorsSnapshot = await getDocs(creatorsQuery);
      let creators = creatorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by signupDate in memory
      creators.sort((a, b) => {
        const aDate = a.signupDate?.toDate ? a.signupDate.toDate() : new Date(0);
        const bDate = b.signupDate?.toDate ? b.signupDate.toDate() : new Date(0);
        return aDate - bDate;
      });

      // Get referral stats for each creator
      const creatorsWithStats = await Promise.all(
        creators.map(async (creator) => {
          if (!creator.creatorApproved) {
            return {
              ...creator,
              referralStats: {
                totalReferrals: 0,
                betaActiveReferrals: 0,
                totalKCoinsEarned: 0
              }
            };
          }

          const statsResult = await this.getCreatorReferrals(creator.id);
          
          if (statsResult.success) {
            return {
              ...creator,
              referralStats: statsResult.stats
            };
          }
          
          return {
            ...creator,
            referralStats: {
              totalReferrals: 0,
              betaActiveReferrals: 0,
              totalKCoinsEarned: 0
            }
          };
        })
      );

      return {
        success: true,
        creators: creatorsWithStats
      };
    } catch (error) {
      console.error('Error getting all creators:', error);
      return {
        success: false,
        error: error.message,
        creators: []
      };
    }
  }

  /**
   * Bulk approve creators
   * @param {Array<string>} waitlistIds - Array of waitlist IDs
   * @param {boolean} autoGrantAccess - Whether to automatically grant beta access (default: true)
   * @returns {Promise<{success: boolean, approved?: number, failed?: number, errors?: Array}>}
   */
  async bulkApproveCreators(waitlistIds, autoGrantAccess = true) {
    try {
      if (!waitlistIds || waitlistIds.length === 0) {
        throw new Error('Waitlist IDs are required');
      }

      let approved = 0;
      let failed = 0;
      const errors = [];

      for (const waitlistId of waitlistIds) {
        try {
          const result = await this.flagAsCreator(waitlistId, true, true, autoGrantAccess);
          
          if (result.success) {
            approved++;
          } else {
            failed++;
            errors.push({ waitlistId, error: result.error });
          }
        } catch (error) {
          failed++;
          errors.push({ waitlistId, error: error.message });
        }
      }

      console.log(`✅ Bulk approve creators: ${approved} approved, ${failed} failed`);

      return {
        success: true,
        approved,
        failed,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Error bulk approving creators:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const creatorService = new CreatorService();
export default creatorService;
