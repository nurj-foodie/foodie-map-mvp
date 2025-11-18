import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  collection
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

/**
 * Beta Access Utility Functions
 * 
 * Manages beta access checking, granting, and revoking.
 * Works with waitlist collection to control beta phase access.
 */

/**
 * Check if user has beta access
 * @param {string} userId - Firebase user ID or email
 * @returns {Promise<{success: boolean, hasAccess?: boolean, waitlistId?: string, error?: string}>}
 */
export const checkBetaAccess = async (userId) => {
  try {
    if (!userId) {
      return { success: false, hasAccess: false, error: 'User ID is required' };
    }

    // Try to find in waitlist by email first
    const waitlistQuery = query(
      collection(db, 'waitlist'),
      where('email', '==', userId.toLowerCase().trim())
    );
    const snapshot = await getDocs(waitlistQuery);

    let waitlistDoc = null;
    if (!snapshot.empty) {
      waitlistDoc = snapshot.docs[0];
    } else {
      // Try as document ID
      try {
        const docRef = doc(db, 'waitlist', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          waitlistDoc = docSnap;
        }
      } catch (error) {
        // Not a document ID, continue
      }
    }

    if (!waitlistDoc || !waitlistDoc.exists()) {
      return {
        success: true,
        hasAccess: false,
        waitlistId: null
      };
    }

    const waitlistData = waitlistDoc.data();
    const hasAccess = waitlistData.betaAccessGranted === true;

    return {
      success: true,
      hasAccess,
      waitlistId: waitlistDoc.id,
      waitlistData
    };
  } catch (error) {
    console.error('Error checking beta access:', error);
    return {
      success: false,
      hasAccess: false,
      error: error.message
    };
  }
};

/**
 * Grant beta access to a user
 * @param {string} userId - Firebase user ID or email (or waitlist document ID)
 * @param {number} waveNumber - Optional wave number
 * @returns {Promise<{success: boolean, waitlistId?: string, error?: string}>}
 */
export const grantBetaAccess = async (userId, waveNumber = null) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Find waitlist document
    let waitlistDocRef = null;
    
    // Try by email first
    const waitlistQuery = query(
      collection(db, 'waitlist'),
      where('email', '==', userId.toLowerCase().trim())
    );
    const snapshot = await getDocs(waitlistQuery);

    if (!snapshot.empty) {
      waitlistDocRef = doc(db, 'waitlist', snapshot.docs[0].id);
    } else {
      // Try as document ID
      waitlistDocRef = doc(db, 'waitlist', userId);
      const docSnap = await getDoc(waitlistDocRef);
      if (!docSnap.exists()) {
        throw new Error('User not found in waitlist');
      }
    }

    // Verify document exists before updating
    const docSnap = await getDoc(waitlistDocRef);
    if (!docSnap.exists()) {
      throw new Error('Waitlist document not found');
    }

    console.log(`🔐 Updating waitlist document: ${waitlistDocRef.id}`);
    console.log(`🔐 Current data:`, docSnap.data());
    console.log(`🔐 User email: ${userId}`);

    // Update waitlist document
    await updateDoc(waitlistDocRef, {
      betaAccessGranted: true,
      betaAccessDate: serverTimestamp(),
      waveNumber: waveNumber || null,
      conversionStatus: 'beta_active'
    });

    console.log(`✅ Beta access granted to: ${userId} (Wave: ${waveNumber || 'N/A'})`);

    return {
      success: true,
      waitlistId: waitlistDocRef.id
    };
  } catch (error) {
    console.error('Error granting beta access:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Revoke beta access from a user
 * @param {string} userId - Firebase user ID or email (or waitlist document ID)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const revokeBetaAccess = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Find waitlist document
    let waitlistDocRef = null;
    
    // Try by email first
    const waitlistQuery = query(
      collection(db, 'waitlist'),
      where('email', '==', userId.toLowerCase().trim())
    );
    const snapshot = await getDocs(waitlistQuery);

    if (!snapshot.empty) {
      waitlistDocRef = doc(db, 'waitlist', snapshot.docs[0].id);
    } else {
      // Try as document ID
      waitlistDocRef = doc(db, 'waitlist', userId);
      const docSnap = await getDoc(waitlistDocRef);
      if (!docSnap.exists()) {
        throw new Error('User not found in waitlist');
      }
    }

    // Update waitlist document
    await updateDoc(waitlistDocRef, {
      betaAccessGranted: false,
      betaAccessDate: null,
      waveNumber: null,
      conversionStatus: 'waitlist'
    });

    console.log(`✅ Beta access revoked from: ${userId}`);

    return {
      success: true
    };
  } catch (error) {
    console.error('Error revoking beta access:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Grant beta access to multiple users (for wave management)
 * @param {Array<string>} userIds - Array of user IDs/emails
 * @param {number} waveNumber - Wave number
 * @returns {Promise<{success: boolean, granted?: number, failed?: number, errors?: Array, error?: string}>}
 */
export const grantBetaAccessBatch = async (userIds, waveNumber) => {
  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('User IDs array is required');
    }

    let granted = 0;
    let failed = 0;
    const errors = [];

    for (const userId of userIds) {
      const result = await grantBetaAccess(userId, waveNumber);
      if (result.success) {
        granted++;
      } else {
        failed++;
        errors.push({ userId, error: result.error });
      }
    }

    console.log(`✅ Batch beta access: ${granted} granted, ${failed} failed`);

    return {
      success: true,
      granted,
      failed,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('Error granting batch beta access:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

