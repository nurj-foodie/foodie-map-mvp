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
  updateDoc,
  increment,
  getDoc,
  setDoc,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * K-Coins Service
 * 
 * Manages K-Coins (reward currency) for beta phase.
 * During beta, K-Coins accumulate only (no spending).
 * 
 * Transaction Types:
 * - 'waitlist_signup': +25 K-Coins (automatic on waitlist signup)
 * - 'referral': +100 K-Coins (when referred user joins waitlist)
 * - 'survey': +50 K-Coins (on survey completion)
 * - 'draw_prize': Variable (monthly travel package draw winner)
 * - 'conversion': Variable (post-beta conversion rewards)
 */
class KCoinsService {
  constructor() {
    this.transactionsCollection = 'kcoins_transactions';
  }

  /**
   * Award K-Coins to a user
   * @param {string} userId - Firebase user ID
   * @param {number} amount - Amount of K-Coins to award (positive number)
   * @param {string} type - Transaction type ('waitlist_signup', 'referral', 'survey', 'draw_prize', 'conversion')
   * @param {string} description - Human-readable description
   * @param {string} relatedId - Optional related ID (referralId, surveyId, etc.)
   * @returns {Promise<{success: boolean, transactionId?: string, newBalance?: number, error?: string}>}
   */
  async awardKCoins(userId, amount, type, description, relatedId = null) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (amount <= 0) {
        throw new Error('Amount must be positive');
      }

      const validTypes = ['waitlist_signup', 'referral', 'survey', 'draw_prize', 'conversion'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid transaction type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Get user email (for transaction record)
      let userEmail = '';
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          userEmail = userSnap.data().email || '';
        }
      } catch (error) {
        console.warn('Could not fetch user email:', error);
      }

      // Create transaction record
      const transactionData = {
        userId,
        email: userEmail,
        type,
        amount: Math.abs(amount), // Ensure positive
        description,
        relatedId: relatedId || null,
        createdAt: serverTimestamp()
      };

      const transactionRef = await addDoc(
        collection(db, this.transactionsCollection),
        transactionData
      );

      console.log(`✅ Awarded ${amount} K-Coins to user ${userId} (${type}): ${description}`);

      // Get updated balance
      const balance = await this.getKCoinsBalance(userId);

      return {
        success: true,
        transactionId: transactionRef.id,
        newBalance: balance.balance,
        amount
      };
    } catch (error) {
      console.error('Error awarding K-Coins:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current K-Coins balance for a user
   * @param {string} userId - Firebase user ID
   * @returns {Promise<{success: boolean, balance?: number, error?: string}>}
   */
  async getKCoinsBalance(userId) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required', balance: 0 };
      }

      // Query all transactions for this user
      const transactionsQuery = query(
        collection(db, this.transactionsCollection),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(transactionsQuery);
      
      // Calculate balance from all transactions
      let balance = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        balance += data.amount || 0;
      });

      return {
        success: true,
        balance
      };
    } catch (error) {
      console.error('Error getting K-Coins balance:', error);
      return {
        success: false,
        error: error.message,
        balance: 0
      };
    }
  }

  /**
   * Get K-Coins transaction history for a user
   * @param {string} userId - Firebase user ID
   * @param {number} limitCount - Maximum number of transactions to return (default: 50)
   * @returns {Promise<{success: boolean, transactions?: Array, error?: string}>}
   */
  async getKCoinsHistory(userId, limitCount = 50) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required', transactions: [] };
      }

      // Query transactions (without orderBy to avoid index requirement)
      // We'll sort client-side instead
      const transactionsQuery = query(
        collection(db, this.transactionsCollection),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(transactionsQuery);
      
      const transactions = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || 0);
        transactions.push({
          id: doc.id,
          type: data.type,
          amount: data.amount,
          description: data.description,
          relatedId: data.relatedId || null,
          createdAt
        });
      });

      // Sort by createdAt descending (newest first) client-side
      transactions.sort((a, b) => b.createdAt - a.createdAt);

      // Limit to requested count
      const limitedTransactions = transactions.slice(0, limitCount);

      return {
        success: true,
        transactions: limitedTransactions
      };
    } catch (error) {
      console.error('Error getting K-Coins history:', error);
      return {
        success: false,
        error: error.message,
        transactions: []
      };
    }
  }

  /**
   * Spend K-Coins (post-beta feature)
   * Note: Not implemented during beta phase - K-Coins accumulate only
   * @param {string} userId - Firebase user ID
   * @param {number} amount - Amount to spend (positive number)
   * @param {string} description - Description of what was purchased
   * @returns {Promise<{success: boolean, newBalance?: number, error?: string}>}
   */
  async spendKCoins(userId, amount, description) {
    // During beta phase, spending is disabled
    return {
      success: false,
      error: 'K-Coins spending is not available during beta phase. K-Coins accumulate only.'
    };
  }

  /**
   * Convert K-Coins to tokens (post-beta feature)
   * Note: Not implemented during beta phase
   * @param {string} userId - Firebase user ID
   * @param {number} amount - Amount of K-Coins to convert
   * @returns {Promise<{success: boolean, tokens?: number, error?: string}>}
   */
  async convertToTokens(userId, amount) {
    // During beta phase, conversion is disabled
    return {
      success: false,
      error: 'K-Coins to token conversion is not available during beta phase.'
    };
  }
}

// Export singleton instance
export const kCoinsService = new KCoinsService();
export default kCoinsService;

