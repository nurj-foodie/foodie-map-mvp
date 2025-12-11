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
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { cohortScoringService } from './cohortScoringService';
import { grantBetaAccess } from '../utils/betaAccess';
import { waitlistService } from './waitlistService';

/**
 * Wave Service
 * 
 * Manages weekly wave system for beta phase access.
 * Allows admins to create waves, select candidates, and grant access in batches.
 */
class WaveService {
  constructor() {
    this.wavesCollection = 'waves';
    this.waitlistCollection = 'waitlist';
  }

  /**
   * Create a new wave configuration
   * @param {number} waveNumber - Wave number (e.g., 1, 2, 3)
   * @param {number} size - Wave size (50-100 seats)
   * @param {object} criteria - Wave criteria
   * @param {number} criteria.minScore - Minimum cohort score (optional)
   * @param {string} criteria.corridor - Priority corridor (optional)
   * @param {string} criteria.driveFrequency - Drive frequency filter (optional)
   * @param {boolean} criteria.includeCreators - Include creators (default: true)
   * @param {number} criteria.creatorReservePercent - Creator reserve percentage (default: 20)
   * @returns {Promise<{success: boolean, waveId?: string, error?: string}>}
   */
  async createWave(waveNumber, size, criteria = {}) {
    try {
      if (!waveNumber || !size) {
        throw new Error('Wave number and size are required');
      }

      if (size < 50 || size > 100) {
        throw new Error('Wave size must be between 50 and 100');
      }

      // Check if wave number already exists
      const existingWaveQuery = query(
        collection(db, this.wavesCollection),
        where('waveNumber', '==', waveNumber)
      );
      const existingSnapshot = await getDocs(existingWaveQuery);

      if (!existingSnapshot.empty) {
        throw new Error(`Wave ${waveNumber} already exists`);
      }

      const {
        minScore = null,
        corridor = null,
        driveFrequency = null,
        includeCreators = true,
        creatorReservePercent = 20
      } = criteria;

      // Calculate creator and regular slots
      const creatorSlots = includeCreators ? Math.floor(size * (creatorReservePercent / 100)) : 0;
      const regularSlots = size - creatorSlots;

      const waveData = {
        waveNumber,
        size,
        criteria: {
          minScore,
          corridor,
          driveFrequency,
          includeCreators,
          creatorReservePercent
        },
        status: 'draft',
        candidates: [],
        grantedUsers: [],
        creatorSlots,
        regularSlots,
        createdAt: serverTimestamp(),
        candidatesSelectedAt: null,
        grantedAt: null,
        createdBy: 'admin' // Could be enhanced to track admin email
      };

      const waveRef = await addDoc(
        collection(db, this.wavesCollection),
        waveData
      );

      console.log(`✅ Wave ${waveNumber} created: ${size} seats (${creatorSlots} creator, ${regularSlots} regular)`);

      return {
        success: true,
        waveId: waveRef.id
      };
    } catch (error) {
      console.error('Error creating wave:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get next wave candidates based on criteria
   * @param {number} waveNumber - Wave number (optional, for preview mode)
   * @param {object} criteria - Wave criteria (required for preview mode)
   * @param {number} waveSize - Wave size (required for preview mode, optional if wave exists)
   * @returns {Promise<{success: boolean, candidates?: Array, creators?: Array, regular?: Array, error?: string}>}
   */
  async getNextWaveCandidates(waveNumber, criteria = null, waveSize = null) {
    try {
      let waveData = null;
      let waveDoc = null;
      let waveCriteria = criteria;
      let waveSizeToUse = waveSize;

      // Try to get wave configuration if waveNumber is provided
      if (waveNumber) {
        const waveQuery = query(
          collection(db, this.wavesCollection),
          where('waveNumber', '==', waveNumber)
        );
        const waveSnapshot = await getDocs(waveQuery);

        if (!waveSnapshot.empty) {
          waveDoc = waveSnapshot.docs[0];
          waveData = waveDoc.data();
          waveCriteria = criteria || waveData.criteria;
          waveSizeToUse = waveSize || waveData.size;
        } else {
          // Wave doesn't exist - preview mode
          if (!criteria || !waveSize) {
            throw new Error('Wave not found. Please provide criteria and wave size for preview mode.');
          }
          waveSizeToUse = waveSize;
        }
      } else {
        // Preview mode - criteria and size must be provided
        if (!criteria || !waveSize) {
          throw new Error('Criteria and wave size are required for preview mode.');
        }
        waveSizeToUse = waveSize;
      }

      // Get all waitlist users who don't have beta access yet
      const waitlistSnapshot = await getDocs(collection(db, this.waitlistCollection));
      const allWaitlistUsers = waitlistSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => !user.betaAccessGranted); // Exclude users who already have access

      // Calculate scores for all eligible users
      const usersWithScores = [];
      for (const user of allWaitlistUsers) {
        const scoreResult = await cohortScoringService.calculateCohortScore(user.id);
        if (scoreResult.success) {
          usersWithScores.push({
            ...user,
            calculatedScore: scoreResult.score,
            scoreBreakdown: scoreResult.breakdown
          });
        }
      }

      // Apply filters
      let filtered = usersWithScores;

      if (waveCriteria.minScore !== null && waveCriteria.minScore !== undefined) {
        filtered = filtered.filter(u => (u.calculatedScore || 0) >= waveCriteria.minScore);
      }

      if (waveCriteria.corridor) {
        filtered = filtered.filter(u => {
          const corridor = u.surveyData?.corridor || '';
          return corridor.toLowerCase().includes(waveCriteria.corridor.toLowerCase());
        });
      }

      if (waveCriteria.driveFrequency && waveCriteria.driveFrequency !== 'all') {
        filtered = filtered.filter(u => u.surveyData?.driveFrequency === waveCriteria.driveFrequency);
      }

      // Sort by score (descending)
      filtered.sort((a, b) => (b.calculatedScore || 0) - (a.calculatedScore || 0));

      // Separate creators and regular users
      const creators = filtered.filter(u => u.isCreator && u.creatorApproved);
      const regular = filtered.filter(u => !u.isCreator || !u.creatorApproved);

      // Select candidates based on wave size and creator reserve
      const creatorSlots = waveCriteria.includeCreators 
        ? Math.floor(waveSizeToUse * (waveCriteria.creatorReservePercent / 100))
        : 0;
      const regularSlots = waveSizeToUse - creatorSlots;

      const selectedCreators = creators.slice(0, creatorSlots);
      const selectedRegular = regular.slice(0, regularSlots);
      const allCandidates = [...selectedCreators, ...selectedRegular];

      // Update wave with candidates only if wave exists
      if (waveDoc && waveData) {
        await updateDoc(doc(db, this.wavesCollection, waveDoc.id), {
          candidates: allCandidates.map(u => ({
            waitlistId: u.id,
            email: u.email,
            name: u.name,
            score: u.calculatedScore,
            corridor: u.surveyData?.corridor || null,
            driveFrequency: u.surveyData?.driveFrequency || null,
            isCreator: u.isCreator && u.creatorApproved
          })),
          status: 'candidates_selected',
          candidatesSelectedAt: serverTimestamp()
        });

        console.log(`✅ Wave ${waveNumber} candidates selected: ${allCandidates.length} (${selectedCreators.length} creators, ${selectedRegular.length} regular)`);
      } else {
        console.log(`✅ Preview candidates: ${allCandidates.length} (${selectedCreators.length} creators, ${selectedRegular.length} regular)`);
      }

      return {
        success: true,
        candidates: allCandidates,
        creators: selectedCreators,
        regular: selectedRegular
      };
    } catch (error) {
      console.error('Error getting wave candidates:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Grant beta access to selected users for a wave
   * @param {number} waveNumber - Wave number
   * @param {Array<string>} userIds - Array of waitlist user IDs
   * @returns {Promise<{success: boolean, granted?: number, failed?: number, errors?: Array}>}
   */
  async grantWaveAccess(waveNumber, userIds) {
    try {
      if (!userIds || userIds.length === 0) {
        throw new Error('User IDs are required');
      }

      // Get wave document
      const waveQuery = query(
        collection(db, this.wavesCollection),
        where('waveNumber', '==', waveNumber)
      );
      const waveSnapshot = await getDocs(waveQuery);

      if (waveSnapshot.empty) {
        throw new Error(`Wave ${waveNumber} not found`);
      }

      const waveDoc = waveSnapshot.docs[0];
      const waveData = waveDoc.data();

      let granted = 0;
      let failed = 0;
      const errors = [];
      const grantedUsers = [];

      // Grant access to each user
      for (const userId of userIds) {
        try {
          // Get user email from waitlist
          const waitlistDoc = await waitlistService.checkBetaAccess(userId);
          
          if (waitlistDoc.success && waitlistDoc.waitlistData) {
            const result = await grantBetaAccess(
              waitlistDoc.waitlistData.email,
              waveNumber
            );

            if (result.success) {
              granted++;
              grantedUsers.push({
                waitlistId: userId,
                email: waitlistDoc.waitlistData.email,
                name: waitlistDoc.waitlistData.name,
                grantedAt: serverTimestamp()
              });
            } else {
              failed++;
              errors.push({ userId, error: result.error });
            }
          } else {
            failed++;
            errors.push({ userId, error: 'User not found in waitlist' });
          }
        } catch (error) {
          failed++;
          errors.push({ userId, error: error.message });
        }
      }

      // Update wave document
      const updatedGrantedUsers = [...(waveData.grantedUsers || []), ...grantedUsers];
      await updateDoc(doc(db, this.wavesCollection, waveDoc.id), {
        grantedUsers: updatedGrantedUsers,
        status: 'granted',
        grantedAt: serverTimestamp()
      });

      console.log(`✅ Wave ${waveNumber} access granted: ${granted} successful, ${failed} failed`);

      return {
        success: true,
        granted,
        failed,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Error granting wave access:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get wave statistics
   * @param {number} waveNumber - Wave number
   * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
   */
  async getWaveStats(waveNumber) {
    try {
      const waveQuery = query(
        collection(db, this.wavesCollection),
        where('waveNumber', '==', waveNumber)
      );
      const waveSnapshot = await getDocs(waveQuery);

      if (waveSnapshot.empty) {
        throw new Error(`Wave ${waveNumber} not found`);
      }

      const waveData = waveSnapshot.docs[0].data();
      const grantedCount = waveData.grantedUsers?.length || 0;
      const candidatesCount = waveData.candidates?.length || 0;
      const pendingCount = candidatesCount - grantedCount;

      // Calculate statistics from candidates
      const candidates = waveData.candidates || [];
      const scores = candidates.map(c => c.score || 0);
      const averageScore = scores.length > 0 
        ? scores.reduce((a, b) => a + b, 0) / scores.length 
        : 0;
      const topScore = scores.length > 0 ? Math.max(...scores) : 0;

      // Corridor distribution
      const corridors = {};
      candidates.forEach(c => {
        const corridor = c.corridor || 'Unknown';
        corridors[corridor] = (corridors[corridor] || 0) + 1;
      });

      // Drive frequency distribution
      const frequencies = {};
      candidates.forEach(c => {
        const freq = c.driveFrequency || 'Unknown';
        frequencies[freq] = (frequencies[freq] || 0) + 1;
      });

      // Creator count
      const creatorCount = candidates.filter(c => c.isCreator).length;

      const stats = {
        waveNumber,
        totalSeats: waveData.size,
        grantedSeats: grantedCount,
        pendingSeats: pendingCount,
        candidatesCount,
        creatorCount,
        regularCount: candidatesCount - creatorCount,
        averageScore: Math.round(averageScore),
        topScore,
        corridorDistribution: corridors,
        driveFrequencyDistribution: frequencies,
        creatorSlots: waveData.creatorSlots || 0,
        regularSlots: waveData.regularSlots || 0
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Error getting wave stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all waves (wave history)
   * @returns {Promise<{success: boolean, waves?: Array, error?: string}>}
   */
  async getWaveHistory() {
    try {
      const wavesQuery = query(
        collection(db, this.wavesCollection),
        orderBy('waveNumber', 'desc')
      );
      const snapshot = await getDocs(wavesQuery);

      const waves = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        waves
      };
    } catch (error) {
      console.error('Error getting wave history:', error);
      return {
        success: false,
        error: error.message,
        waves: []
      };
    }
  }

  /**
   * Get wave details by wave ID
   * @param {string} waveId - Wave document ID
   * @returns {Promise<{success: boolean, wave?: object, error?: string}>}
   */
  async getWaveDetails(waveId) {
    try {
      const waveDoc = await getDoc(doc(db, this.wavesCollection, waveId));

      if (!waveDoc.exists()) {
        throw new Error('Wave not found');
      }

      return {
        success: true,
        wave: {
          id: waveDoc.id,
          ...waveDoc.data()
        }
      };
    } catch (error) {
      console.error('Error getting wave details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get next wave number (auto-increment)
   * @returns {Promise<{success: boolean, nextWaveNumber?: number, error?: string}>}
   */
  async getNextWaveNumber() {
    try {
      const wavesQuery = query(
        collection(db, this.wavesCollection),
        orderBy('waveNumber', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(wavesQuery);

      if (snapshot.empty) {
        return {
          success: true,
          nextWaveNumber: 1
        };
      }

      const lastWave = snapshot.docs[0].data();
      const nextWaveNumber = (lastWave.waveNumber || 0) + 1;

      return {
        success: true,
        nextWaveNumber
      };
    } catch (error) {
      console.error('Error getting next wave number:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a wave (only if not granted)
   * @param {string} waveId - Wave document ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteWave(waveId) {
    try {
      const waveDoc = await getDoc(doc(db, this.wavesCollection, waveId));

      if (!waveDoc.exists()) {
        throw new Error('Wave not found');
      }

      const waveData = waveDoc.data();
      
      if (waveData.status === 'granted') {
        throw new Error('Cannot delete a wave that has already granted access');
      }

      // Delete the wave document
      await deleteDoc(doc(db, this.wavesCollection, waveId));

      console.log(`✅ Wave deleted: ${waveId}`);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting wave:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const waveService = new WaveService();
export default waveService;
