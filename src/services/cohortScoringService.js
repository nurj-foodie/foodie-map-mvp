import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * Cohort Scoring Service
 * 
 * Manages cohort scoring for beta phase waitlist users.
 * Calculates scores based on signup order, corridor fit, drive frequency,
 * referrals, creator status, and email engagement.
 */
class CohortScoringService {
  constructor() {
    this.waitlistCollection = 'waitlist';
    this.referralsCollection = 'referrals';
    
    // Priority corridors for scoring (40% weight)
    this.priorityCorridors = [
      'Kluang↔Penang',
      'KL↔JB',
      'KL↔Penang',
      'JB↔Penang',
      'Kluang ↔ Penang',
      'KL ↔ JB',
      'KL ↔ Penang',
      'JB ↔ Penang'
    ];
  }

  /**
   * Calculate full cohort score for a waitlist user
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, score?: number, breakdown?: object, error?: string}>}
   */
  async calculateCohortScore(waitlistId) {
    try {
      if (!waitlistId) {
        throw new Error('Waitlist ID is required');
      }

      const waitlistDoc = await getDoc(doc(db, this.waitlistCollection, waitlistId));
      
      if (!waitlistDoc.exists()) {
        throw new Error('Waitlist entry not found');
      }

      const waitlistData = waitlistDoc.data();
      
      // Base Score: 1000 - (signupOrder * 10)
      const baseScore = 1000 - ((waitlistData.signupOrder || 0) * 10);
      
      // Corridor Fit (40% weight = 400 points max)
      const corridorScore = this._calculateCorridorScore(waitlistData.surveyData?.corridor);
      
      // Drive Frequency (25% weight = 250 points max)
      const driveFrequencyScore = this._calculateDriveFrequencyScore(
        waitlistData.surveyData?.driveFrequency
      );
      
      // Referrals (25% weight = 50 points per beta-active referral)
      const referralScore = await this._getReferralScore(waitlistId);
      
      // Creator Flag (10% weight = 100 points)
      const creatorScore = this._calculateCreatorScore(
        waitlistData.isCreator,
        waitlistData.creatorApproved
      );
      
      // Email Engagement (+5 per open, +10 per click)
      const emailEngagementScore = this._getEmailEngagementScore(
        waitlistData.emailEngagement
      );
      
      // Total Score
      const totalScore = baseScore + corridorScore + driveFrequencyScore + 
                        referralScore + creatorScore + emailEngagementScore;
      
      const breakdown = {
        baseScore,
        corridorFit: {
          score: corridorScore,
          matched: corridorScore > 0,
          corridor: waitlistData.surveyData?.corridor || null
        },
        driveFrequency: {
          score: driveFrequencyScore,
          frequency: waitlistData.surveyData?.driveFrequency || null
        },
        referrals: {
          score: referralScore,
          count: Math.floor(referralScore / 50), // Each referral = 50 points
          details: [] // Will be populated if needed
        },
        creator: {
          score: creatorScore,
          isCreator: waitlistData.isCreator === true && waitlistData.creatorApproved === true
        },
        emailEngagement: {
          score: emailEngagementScore,
          opens: waitlistData.emailEngagement?.opens || 0,
          clicks: waitlistData.emailEngagement?.clicks || 0
        },
        totalScore
      };
      
      return {
        success: true,
        score: totalScore,
        breakdown
      };
    } catch (error) {
      console.error('Error calculating cohort score:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate corridor fit score (40% weight = 400 points max)
   * @private
   */
  _calculateCorridorScore(corridor) {
    if (!corridor) return 0;
    
    const normalizedCorridor = corridor.trim();
    
    // Check for exact match with priority corridors
    for (const priority of this.priorityCorridors) {
      if (normalizedCorridor.toLowerCase() === priority.toLowerCase()) {
        return 400; // Full score for exact match
      }
    }
    
    // Check for partial match (contains key cities)
    const lowerCorridor = normalizedCorridor.toLowerCase();
    const hasKluang = lowerCorridor.includes('kluang');
    const hasPenang = lowerCorridor.includes('penang');
    const hasKL = lowerCorridor.includes('kl') || lowerCorridor.includes('kuala lumpur');
    const hasJB = lowerCorridor.includes('jb') || lowerCorridor.includes('johor bahru');
    
    // Priority combinations
    if ((hasKluang && hasPenang) || (hasKL && hasJB) || (hasKL && hasPenang) || (hasJB && hasPenang)) {
      return 200; // Partial score for key combinations
    }
    
    return 0; // No match
  }

  /**
   * Calculate drive frequency score (25% weight = 250 points max)
   * @private
   */
  _calculateDriveFrequencyScore(frequency) {
    if (!frequency) return 0;
    
    switch (frequency.toLowerCase()) {
      case 'weekly':
        return 250; // Highest priority
      case 'monthly':
        return 125; // Medium priority
      case 'occasional':
        return 50; // Lower priority
      default:
        return 0;
    }
  }

  /**
   * Get referral score (25% weight = 50 points per beta-active referral)
   * @private
   */
  async _getReferralScore(waitlistId) {
    try {
      // Get referrals where this user is the referrer and referred user has beta access
      const referralsQuery = query(
        collection(db, this.referralsCollection),
        where('referrerId', '==', waitlistId),
        where('status', '==', 'beta_active')
      );
      
      const snapshot = await getDocs(referralsQuery);
      const betaActiveCount = snapshot.size;
      
      // Each beta-active referral = 50 points
      return betaActiveCount * 50;
    } catch (error) {
      console.error('Error getting referral score:', error);
      return 0;
    }
  }

  /**
   * Calculate creator score (10% weight = 100 points)
   * @private
   */
  _calculateCreatorScore(isCreator, creatorApproved) {
    if (isCreator === true && creatorApproved === true) {
      return 100;
    }
    return 0;
  }

  /**
   * Get email engagement score (+5 per open, +10 per click)
   * @private
   */
  _getEmailEngagementScore(emailEngagement) {
    if (!emailEngagement) return 0;
    
    const opens = emailEngagement.opens || 0;
    const clicks = emailEngagement.clicks || 0;
    
    return (opens * 5) + (clicks * 10);
  }

  /**
   * Get top cohort users with filtering
   * @param {number} limit - Maximum number of results
   * @param {object} filters - Filter options
   * @returns {Promise<{success: boolean, users?: Array, total?: number, error?: string}>}
   */
  async getTopCohort(limit = 100, filters = {}) {
    try {
      // Fetch all waitlist entries
      const snapshot = await getDocs(collection(db, this.waitlistCollection));
      const allUsers = [];
      
      // Calculate scores for each user
      for (const docSnap of snapshot.docs) {
        const waitlistData = docSnap.data();
        const scoreResult = await this.calculateCohortScore(docSnap.id);
        
        if (scoreResult.success) {
          allUsers.push({
            id: docSnap.id,
            ...waitlistData,
            calculatedScore: scoreResult.score,
            scoreBreakdown: scoreResult.breakdown
          });
        }
      }
      
      // Apply filters
      let filteredUsers = allUsers;
      
      if (filters.minScore !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.calculatedScore >= filters.minScore);
      }
      
      if (filters.maxScore !== undefined) {
        filteredUsers = filteredUsers.filter(u => u.calculatedScore <= filters.maxScore);
      }
      
      if (filters.hasSurvey === true) {
        filteredUsers = filteredUsers.filter(u => u.surveyCompleted === true);
      }
      
      if (filters.corridor) {
        filteredUsers = filteredUsers.filter(u => {
          const corridor = u.surveyData?.corridor || '';
          return corridor.toLowerCase().includes(filters.corridor.toLowerCase());
        });
      }
      
      if (filters.driveFrequency) {
        filteredUsers = filteredUsers.filter(u => 
          u.surveyData?.driveFrequency === filters.driveFrequency
        );
      }
      
      if (filters.isCreator === true) {
        filteredUsers = filteredUsers.filter(u => u.isCreator === true && u.creatorApproved === true);
      }
      
      if (filters.hasBetaAccess === true) {
        filteredUsers = filteredUsers.filter(u => u.betaAccessGranted === true);
      } else if (filters.hasBetaAccess === false) {
        filteredUsers = filteredUsers.filter(u => u.betaAccessGranted !== true);
      }
      
      // Sort by selected criteria
      const sortBy = filters.sortBy || 'score';
      filteredUsers.sort((a, b) => {
        switch (sortBy) {
          case 'score':
            return b.calculatedScore - a.calculatedScore; // Descending
          case 'signupOrder':
            return (a.signupOrder || 0) - (b.signupOrder || 0); // Ascending
          case 'referrals':
            const aRefs = a.scoreBreakdown?.referrals?.count || 0;
            const bRefs = b.scoreBreakdown?.referrals?.count || 0;
            return bRefs - aRefs; // Descending
          case 'engagement':
            const aEng = a.scoreBreakdown?.emailEngagement?.score || 0;
            const bEng = b.scoreBreakdown?.emailEngagement?.score || 0;
            return bEng - aEng; // Descending
          default:
            return b.calculatedScore - a.calculatedScore;
        }
      });
      
      // Apply limit
      const limitedUsers = filteredUsers.slice(0, limit);
      
      return {
        success: true,
        users: limitedUsers,
        total: filteredUsers.length
      };
    } catch (error) {
      console.error('Error getting top cohort:', error);
      return {
        success: false,
        error: error.message,
        users: [],
        total: 0
      };
    }
  }

  /**
   * Manually adjust score (admin override)
   * @param {string} waitlistId - Waitlist document ID
   * @param {number} points - Points to add/subtract (can be negative)
   * @param {string} reason - Reason for adjustment (optional)
   * @returns {Promise<{success: boolean, newScore?: number, error?: string}>}
   */
  async updateScore(waitlistId, points, reason = '') {
    try {
      if (!waitlistId) {
        throw new Error('Waitlist ID is required');
      }

      const waitlistRef = doc(db, this.waitlistCollection, waitlistId);
      const waitlistDoc = await getDoc(waitlistRef);
      
      if (!waitlistDoc.exists()) {
        throw new Error('Waitlist entry not found');
      }

      const currentScore = waitlistDoc.data().cohortScore || 0;
      const newScore = Math.max(0, currentScore + points); // Ensure score doesn't go negative
      
      await updateDoc(waitlistRef, {
        cohortScore: newScore,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Score updated: ${waitlistId} (${currentScore} → ${newScore}, ${points > 0 ? '+' : ''}${points})`);
      
      return {
        success: true,
        newScore
      };
    } catch (error) {
      console.error('Error updating score:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Recalculate all scores (admin utility)
   * @returns {Promise<{success: boolean, updated?: number, errors?: Array}>}
   */
  async recalculateAllScores() {
    try {
      const snapshot = await getDocs(collection(db, this.waitlistCollection));
      const updates = [];
      const errors = [];
      
      for (const docSnap of snapshot.docs) {
        try {
          const scoreResult = await this.calculateCohortScore(docSnap.id);
          
          if (scoreResult.success) {
            await updateDoc(doc(db, this.waitlistCollection, docSnap.id), {
              cohortScore: scoreResult.score,
              updatedAt: serverTimestamp()
            });
            updates.push(docSnap.id);
          }
        } catch (error) {
          errors.push({ id: docSnap.id, error: error.message });
        }
      }
      
      return {
        success: true,
        updated: updates.length,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Error recalculating all scores:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get detailed score breakdown for display
   * @param {string} waitlistId - Waitlist document ID
   * @returns {Promise<{success: boolean, breakdown?: object, error?: string}>}
   */
  async getScoreBreakdown(waitlistId) {
    try {
      const scoreResult = await this.calculateCohortScore(waitlistId);
      
      if (scoreResult.success) {
        return {
          success: true,
          breakdown: scoreResult.breakdown
        };
      } else {
        return scoreResult;
      }
    } catch (error) {
      console.error('Error getting score breakdown:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const cohortScoringService = new CohortScoringService();
export default cohortScoringService;
