import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { checkBetaAccess } from '../utils/betaAccess';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [betaAccess, setBetaAccess] = useState(null); // null = not checked, true/false = has/doesn't have access
  const [betaAccessLoading, setBetaAccessLoading] = useState(false);

  // Google Auth Provider
  const googleProvider = new GoogleAuthProvider();

  // Create or update user document in Firestore
  const createUserDocument = async (user, additionalData = {}) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = new Date();

      try {
        await setDoc(userRef, {
          displayName,
          email,
          photoURL,
          createdAt,
          ...additionalData
        });
        console.log('✅ User document created:', user.uid);
      } catch (error) {
        console.error('❌ Error creating user document:', error);
      }
    } else {
      console.log('✅ User document already exists:', user.uid);
    }
  };

  // Sign up with email and password
  const registerWithEmail = async (email, password, displayName) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await createUserDocument(user, { displayName });
      return { success: true, user };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign in with email and password
  const loginWithEmail = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Detect if we're on mobile (mobile browsers work better with redirect)
  const shouldUseRedirect = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check if mobile device
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Check if previous redirect attempt failed
    const redirectFailed = sessionStorage.getItem('redirectFailed') === 'true';
    
    // For mobile, use redirect directly
    // For all desktop browsers (Chrome, Safari, Brave, Cursor, etc.), try popup first
    if (isMobile || redirectFailed) {
      return true; // Use redirect directly for mobile or if redirect previously failed
    }
    
    return false; // Try popup first for all desktop browsers (including Brave & Cursor)
  };

  // Sign in with Google - tries popup first, falls back to redirect if popup fails
  const loginWithGoogle = async () => {
    try {
      // Check if we should use redirect directly (Cursor browser, mobile, etc.)
      if (shouldUseRedirect()) {
        console.log('📍 Using redirect method directly (Cursor browser or mobile detected)');
        // Firebase will automatically redirect back to current URL after auth
        // No need to store URL manually - Firebase handles it
        console.log('📍 Current URL:', window.location.href);
        
        // Set a flag to indicate we are expecting a redirect result
        // This prevents the loading state from clearing too early on the return trip
        sessionStorage.setItem('authRedirectPending', 'true');

        // Use redirect method directly
        await signInWithRedirect(auth, googleProvider);
        return { success: true, redirect: true };
      }
      
      // Try popup first (works in most desktop browsers)
      try {
        console.log('🔄 Attempting popup method...');
        const { user } = await signInWithPopup(auth, googleProvider);
        await createUserDocument(user);
        // Clear any redirect failure flag if popup succeeds
        sessionStorage.removeItem('redirectFailed');
        return { success: true, user };
      } catch (popupError) {
        console.log('⚠️ Popup failed:', popupError.code, popupError.message);
        
        // If popup is blocked or fails, use redirect
        // Common error codes: 'auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'
        const isPopupError = 
          popupError.code === 'auth/popup-blocked' ||
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request' ||
          popupError.code === 'auth/operation-not-allowed' ||
          popupError.message?.includes('popup') ||
          popupError.message?.includes('blocked') ||
          popupError.message?.includes('not allowed');
        
        if (isPopupError) {
          console.log('⚠️ Popup blocked or failed, using redirect method...', popupError.code);
          // Firebase will automatically redirect back to current URL after auth
          console.log('📍 Current URL:', window.location.href);
          
          // Set pending flag
          sessionStorage.setItem('authRedirectPending', 'true');

          // Use redirect method instead
          await signInWithRedirect(auth, googleProvider);
          return { success: true, redirect: true };
        }
        // If it's a different error, throw it
        throw popupError;
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      return { success: false, error: error.message || 'Google sign-in failed. Please try again.' };
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Update user profile (display name and/or photo URL)
  const updateUserProfile = async (updates) => {
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'No user logged in' };
      }

      const authUpdateData = {};
      const firestoreUpdateData = {};
      
      if (updates.displayName !== undefined) {
        authUpdateData.displayName = updates.displayName;
        firestoreUpdateData.displayName = updates.displayName;
      }
      
      // Store photo in Firestore only (Firebase Auth photoURL has length limit)
      // For base64 images, we store in Firestore and read from there
      if (updates.photoURL !== undefined) {
        // Only update Firebase Auth photoURL if it's a URL (not base64)
        if (updates.photoURL.startsWith('http://') || updates.photoURL.startsWith('https://')) {
          authUpdateData.photoURL = updates.photoURL;
        }
        // Always store in Firestore (supports base64)
        firestoreUpdateData.photoURL = updates.photoURL;
      }

      // Update Firebase Auth profile (only for displayName and URLs)
      if (Object.keys(authUpdateData).length > 0) {
        await updateProfile(auth.currentUser, authUpdateData);
      }

      // Update Firestore user document (supports base64 photos)
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, firestoreUpdateData);

      console.log('✅ User profile updated:', firestoreUpdateData);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Check beta access for a user
  const checkUserBetaAccess = async (user) => {
    if (!user || !user.email) {
      setBetaAccess(false);
      setBetaAccessLoading(false);
      return;
    }

    try {
      setBetaAccessLoading(true);
      const result = await checkBetaAccess(user.email);
      
      if (result.success) {
        setBetaAccess(result.hasAccess || false);
        console.log(`🔐 Beta access check: ${user.email} - ${result.hasAccess ? 'Granted' : 'Not granted'}`);
      } else {
        // On error, default to no access (safer)
        setBetaAccess(false);
        console.warn('⚠️ Beta access check failed, defaulting to no access:', result.error);
      }
    } catch (error) {
      console.error('❌ Error checking beta access:', error);
      setBetaAccess(false);
    } finally {
      setBetaAccessLoading(false);
    }
  };

  // Handle redirect result from Google sign-in
  useEffect(() => {
    const handleRedirectResult = async () => {
      const currentUrl = window.location.href;
      const isRedirectPending = sessionStorage.getItem('authRedirectPending');
      
      console.log('🔍 Checking for redirect result...', { currentUrl, isRedirectPending });
      
      try {
        // ALWAYS check for redirect result - Firebase stores it automatically
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          console.log('✅ Google redirect sign-in successful:', result.user.uid, result.user.email);
          
          // Create user document if needed
          // Note: onAuthStateChanged will also trigger, but we do this here too to be safe
          await createUserDocument(result.user);
          
          // Clean up URL parameters (Firebase adds auth params)
          if (window.location.search || window.location.hash) {
            const cleanUrl = window.location.origin + window.location.pathname;
            console.log('🧹 Cleaning up auth URL parameters');
            window.history.replaceState({}, document.title, cleanUrl);
          }
          
          console.log('✅ Authentication complete');
        } else {
          // No redirect result - this is normal for regular page loads
          // unless we were expecting one
          if (isRedirectPending) {
             console.log('ℹ️ No redirect result found even though pending flag was set');
          } else {
             console.log('ℹ️ No redirect result (normal page load)');
          }
        }
      } catch (error) {
        console.error('❌ Error handling redirect result:', error);
        console.error('Error details:', error.code, error.message);
      } finally {
        // Clean up pending flag
        sessionStorage.removeItem('authRedirectPending');
        sessionStorage.removeItem('authRedirectUrl');
        sessionStorage.removeItem('redirectFailed');

        // If we were waiting for a redirect and didn't get a user (or if it failed),
        // we need to ensure loading is turned off if onAuthStateChanged isn't going to do it.
        // If a user WAS found, onAuthStateChanged will fire and handle loading.
        // If no user found, onAuthStateChanged might have already fired with null.
        if (!auth.currentUser) {
           setLoading(false);
        }
      }
    };

    // Execute immediately, no timeout
    handleRedirectResult();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('👤 User signed in:', user.uid, user.email);
        setUser(user);
        
        // Clean up any stored auth flags
        sessionStorage.removeItem('authRedirectPending');
        sessionStorage.removeItem('authRedirectUrl');
        sessionStorage.removeItem('redirectFailed');
        
        // Check beta access when user signs in
        await checkUserBetaAccess(user);

        // User is confirmed, so stop loading
        setLoading(false);
      } else {
        console.log('👤 User signed out');
        setUser(null);
        setBetaAccess(null);
        setBetaAccessLoading(false);

        // ONLY stop loading if we are NOT waiting for a redirect
        // This prevents the "flash of login screen" before redirect result is processed
        const isRedirectPending = sessionStorage.getItem('authRedirectPending');
        if (!isRedirectPending) {
          setLoading(false);
        } else {
          console.log('⏳ Redirect pending, keeping loading state true...');
        }
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    betaAccess, // null = not checked, true = has access, false = no access
    betaAccessLoading,
    checkUserBetaAccess, // Manual refresh function
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



