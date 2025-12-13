import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { referralService } from './referralService';
import { kCoinsService } from './kCoinsService';

/**
 * Draw Service
 * 
 * Manages monthly travel package draws for top referrers.
 * Draws are conducted monthly, selecting a random winner from top referrers.
 */
class DrawService {
  constructor() {
    this.drawsCollection = 'travel_draws';
    this.referralsCollection = 'referrals';
    this.waitlistCollection = 'waitlist';
  }

  /**
   * Get top referrers by total referrals
   * @param {number} limitCount - Number of top referrers to return (default: 50)
   * @param {string} month - Month filter in format "YYYY-MM" (optional)
   * @returns {Promise<{success: boolean, referrers?: Array, error?: string}>}
   */
  async getTopReferrers(limitCount = 50, month = null) {
    try {
      // Get all referrals
      let referralsQuery = query(collection(db, this.referralsCollection));
      
      // If month filter provided, filter by month
      if (month) {
        const [year, monthNum] = month.split('-');
        const startDate = new Date(year, parseInt(monthNum) - 1, 1);
        const endDate = new Date(year, parseInt(monthNum), 0, 23, 59, 59);
        
        referralsQuery = query(
          collection(db, this.referralsCollection),
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', endDate)
        );
      }

      const referralsSnapshot = await getDocs(referralsQuery);
      
      // Group referrals by referrer
      const referrerCounts = {};
      
      referralsSnapshot.docs.forEach(doc => {
        const referralData = doc.data();
        const referrerId = referralData.referrerId || referralData.referrerEmail;
        
        if (!referrerId) return;
        
        if (!referrerCounts[referrerId]) {
          referrerCounts[referrerId] = {
            referrerId,
            referrerEmail: referralData.referrerEmail,
            referralCode: referralData.referralCode,
            count: 0,
            referrals: []
          };
        }
        
        referrerCounts[referrerId].count++;
        referrerCounts[referrerId].referrals.push({
          id: doc.id,
          ...referralData
        });
      });

      // Convert to array and sort by count
      const referrers = Object.values(referrerCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, limitCount);

      // Enrich with waitlist data
      const enrichedReferrers = await Promise.all(
        referrers.map(async (referrer) => {
          try {
            // Try to get waitlist data by ID first
            let waitlistDoc = null;
            if (!referrer.referrerId.includes('@')) {
              waitlistDoc = await getDoc(doc(db, this.waitlistCollection, referrer.referrerId));
            }
            
            // If not found, try by email
            if (!waitlistDoc?.exists()) {
              const emailQuery = query(
                collection(db, this.waitlistCollection),
                where('email', '==', referrer.referrerEmail?.toLowerCase() || '')
              );
              const emailSnapshot = await getDocs(emailQuery);
              if (!emailSnapshot.empty) {
                waitlistDoc = emailSnapshot.docs[0];
              }
            }

            const waitlistData = waitlistDoc?.exists() ? waitlistDoc.data() : null;

            return {
              ...referrer,
              name: waitlistData?.name || referrer.referrerEmail?.split('@')[0] || 'Unknown',
              email: referrer.referrerEmail,
              waitlistId: waitlistDoc?.id || referrer.referrerId,
              betaAccessGranted: waitlistData?.betaAccessGranted || false,
              isCreator: waitlistData?.isCreator || false
            };
          } catch (error) {
            console.error(`Error enriching referrer ${referrer.referrerId}:`, error);
            return {
              ...referrer,
              name: referrer.referrerEmail?.split('@')[0] || 'Unknown',
              email: referrer.referrerEmail,
              waitlistId: referrer.referrerId,
              betaAccessGranted: false,
              isCreator: false
            };
          }
        })
      );

      return {
        success: true,
        referrers: enrichedReferrers
      };
    } catch (error) {
      console.error('Error getting top referrers:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new draw entry
   * @param {string} month - Month in format "YYYY-MM" (e.g., "2025-12")
   * @param {number} topN - Number of top referrers to qualify (default: 50)
   * @param {string} prizeDescription - Description of the prize (optional)
   * @returns {Promise<{success: boolean, drawId?: string, error?: string}>}
   */
  async createDraw(month, topN = 50, prizeDescription = null) {
    try {
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        throw new Error('Invalid month format. Use YYYY-MM (e.g., "2025-12")');
      }

      // Check if draw already exists for this month
      const existingQuery = query(
        collection(db, this.drawsCollection),
        where('month', '==', month)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        return {
          success: false,
          error: `Draw for ${month} already exists`,
          drawId: existingSnapshot.docs[0].id
        };
      }

      // Get top referrers for this month
      const topReferrersResult = await this.getTopReferrers(topN, month);

      if (!topReferrersResult.success) {
        throw new Error(topReferrersResult.error || 'Failed to get top referrers');
      }

      const qualifiers = topReferrersResult.referrers || [];

      // Create draw document
      const drawData = {
        month,
        topN,
        qualifiers: qualifiers.map(r => ({
          waitlistId: r.waitlistId,
          email: r.email,
          name: r.name,
          referralCount: r.count,
          referralCode: r.referralCode
        })),
        qualifierCount: qualifiers.length,
        status: 'pending', // pending, drawn, announced
        winnerId: null,
        winnerEmail: null,
        winnerName: null,
        drawnAt: null,
        announcedAt: null,
        prizeDescription: prizeDescription || 'Malaysia Travel Package',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const drawRef = await addDoc(collection(db, this.drawsCollection), drawData);

      console.log(`✅ Created draw for ${month} with ${qualifiers.length} qualifiers`);

      return {
        success: true,
        drawId: drawRef.id,
        qualifierCount: qualifiers.length
      };
    } catch (error) {
      console.error('Error creating draw:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Conduct the draw (randomly select winner from qualifiers)
   * @param {string} drawId - Draw document ID
   * @returns {Promise<{success: boolean, winner?: object, error?: string}>}
   */
  async conductDraw(drawId) {
    try {
      if (!drawId) {
        throw new Error('Draw ID is required');
      }

      const drawDoc = await getDoc(doc(db, this.drawsCollection, drawId));

      if (!drawDoc.exists()) {
        throw new Error('Draw not found');
      }

      const drawData = drawDoc.data();

      if (drawData.status === 'drawn' || drawData.status === 'announced') {
        return {
          success: false,
          error: 'Draw has already been conducted',
          winner: drawData.winnerId ? {
            waitlistId: drawData.winnerId,
            email: drawData.winnerEmail,
            name: drawData.winnerName
          } : null
        };
      }

      if (!drawData.qualifiers || drawData.qualifiers.length === 0) {
        throw new Error('No qualifiers found for this draw');
      }

      // Randomly select winner from qualifiers
      const randomIndex = Math.floor(Math.random() * drawData.qualifiers.length);
      const winner = drawData.qualifiers[randomIndex];

      // Update draw document
      await updateDoc(doc(db, this.drawsCollection, drawId), {
        status: 'drawn',
        winnerId: winner.waitlistId,
        winnerEmail: winner.email,
        winnerName: winner.name,
        drawnAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Draw conducted. Winner: ${winner.name} (${winner.email})`);

      return {
        success: true,
        winner: {
          waitlistId: winner.waitlistId,
          email: winner.email,
          name: winner.name,
          referralCount: winner.referralCount,
          referralCode: winner.referralCode
        }
      };
    } catch (error) {
      console.error('Error conducting draw:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Announce the draw (mark as announced and optionally award K-Coins)
   * @param {string} drawId - Draw document ID
   * @param {number} kCoinsAmount - K-Coins amount to award to winner (optional, default: 0)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async announceDraw(drawId, kCoinsAmount = 0) {
    try {
      if (!drawId) {
        throw new Error('Draw ID is required');
      }

      const drawDoc = await getDoc(doc(db, this.drawsCollection, drawId));

      if (!drawDoc.exists()) {
        throw new Error('Draw not found');
      }

      const drawData = drawDoc.data();

      if (drawData.status !== 'drawn') {
        return {
          success: false,
          error: 'Draw must be conducted before it can be announced'
        };
      }

      if (drawData.status === 'announced') {
        return {
          success: false,
          error: 'Draw has already been announced'
        };
      }

      // Award K-Coins to winner if amount specified
      if (kCoinsAmount > 0 && drawData.winnerId) {
        try {
          // Get winner email for K-Coins award
          let winnerEmail = drawData.winnerEmail;
          
          // If winnerId is not an email, get email from waitlist
          if (!winnerEmail || !winnerEmail.includes('@')) {
            const winnerDoc = await getDoc(doc(db, this.waitlistCollection, drawData.winnerId));
            if (winnerDoc.exists()) {
              winnerEmail = winnerDoc.data().email;
            }
          }

          if (winnerEmail) {
            await kCoinsService.awardKCoins(
              `waitlist:${winnerEmail}`,
              kCoinsAmount,
              'draw_prize',
              `Travel Package Draw Winner - ${drawData.month}`,
              drawId
            );
            console.log(`✅ Awarded ${kCoinsAmount} K-Coins to draw winner: ${winnerEmail}`);
          }
        } catch (kCoinsError) {
          console.error('Error awarding K-Coins to winner:', kCoinsError);
          // Continue with announcement even if K-Coins award fails
        }
      }

      // Update draw document
      await updateDoc(doc(db, this.drawsCollection, drawId), {
        status: 'announced',
        announcedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Draw announced for ${drawData.month}`);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error announcing draw:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get draw details
   * @param {string} drawId - Draw document ID
   * @returns {Promise<{success: boolean, draw?: object, error?: string}>}
   */
  async getDrawDetails(drawId) {
    try {
      if (!drawId) {
        throw new Error('Draw ID is required');
      }

      const drawDoc = await getDoc(doc(db, this.drawsCollection, drawId));

      if (!drawDoc.exists()) {
        throw new Error('Draw not found');
      }

      return {
        success: true,
        draw: {
          id: drawDoc.id,
          ...drawDoc.data()
        }
      };
    } catch (error) {
      console.error('Error getting draw details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all draws
   * @param {number} limitCount - Maximum number of draws to return (default: 20)
   * @returns {Promise<{success: boolean, draws?: Array, error?: string}>}
   */
  async getDrawHistory(limitCount = 20) {
    try {
      const drawsQuery = query(
        collection(db, this.drawsCollection),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const drawsSnapshot = await getDocs(drawsQuery);

      const draws = drawsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        draws
      };
    } catch (error) {
      console.error('Error getting draw history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current month's draw (if exists)
   * @returns {Promise<{success: boolean, draw?: object, error?: string}>}
   */
  async getCurrentMonthDraw() {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const drawQuery = query(
        collection(db, this.drawsCollection),
        where('month', '==', currentMonth)
      );

      const drawSnapshot = await getDocs(drawQuery);

      if (drawSnapshot.empty) {
        return {
          success: true,
          draw: null
        };
      }

      const drawDoc = drawSnapshot.docs[0];

      return {
        success: true,
        draw: {
          id: drawDoc.id,
          ...drawDoc.data()
        }
      };
    } catch (error) {
      console.error('Error getting current month draw:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const drawService = new DrawService();
export default drawService;
