import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

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

  // Sign in with Google
  const loginWithGoogle = async () => {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      await createUserDocument(user);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Google login error:', error);
      return { success: false, error: error.message };
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

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('👤 User signed in:', user.uid);
        setUser(user);
      } else {
        console.log('👤 User signed out');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
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



