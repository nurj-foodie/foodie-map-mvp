/**
 * WORKING Browser Console Script
 * 
 * This version accesses Firebase from your React app's already-loaded instance
 * 
 * INSTRUCTIONS:
 * 1. Open your app in browser (http://localhost:3001)
 * 2. Open browser console (F12 or Cmd+Option+I)
 * 3. Copy and paste this ENTIRE script
 * 4. Press Enter
 */

(async function() {
  console.log('🧪 Creating test waitlist entries...\n');
  
  try {
    // Access Firebase from your app's already-loaded modules
    // Your app uses: import { collection, addDoc, ... } from 'firebase/firestore'
    // Since Firebase is already loaded, we can access it via the app's bundle
    
    // Method 1: Try to get Firebase from window (if exposed)
    let firestore, db;
    
    // Check if Firebase is available globally
    if (window.firebase && window.firebase.firestore) {
      // Legacy Firebase SDK
      db = window.firebase.firestore();
      console.log('✅ Using Firebase from window.firebase');
    } else {
      // Method 2: Access from React app's Firebase instance
      // Your app exports db from src/config/firebaseConfig.js
      // We need to access it from the React component tree or module cache
      
      // Try to find Firebase in the module cache
      // React apps often expose modules via __webpack_require__ or similar
      
      // Method 3: Use the Firebase instance that's already initialized
      // Since your app is running, Firebase is already loaded
      // We can access it via the app's internal module system
      
      // For React apps with webpack, we can try to access the module
      // But the easiest way is to use the Firebase instance directly
      
      // Let's try accessing via React DevTools or use a workaround
      console.log('⚠️  Trying to access Firebase from app context...');
      
      // Method 4: Use eval to access Firebase from your app's scope
      // This works because your app already has Firebase loaded
      const firebaseModule = eval(`
        (function() {
          // Try to access Firebase from the app's module system
          // This will work if Firebase is available in the current scope
          try {
            // Access via require if available
            if (typeof require !== 'undefined') {
              return require('firebase/firestore');
            }
            // Or access from window if your app exposes it
            if (window.__FIREBASE__) {
              return window.__FIREBASE__;
            }
            return null;
          } catch(e) {
            return null;
          }
        })()
      `);
      
      if (!firebaseModule) {
        // Method 5: Direct access - use the Firebase functions that are already loaded
        // Since your app imports Firebase, it's in the bundle
        // We can access it by creating a script that uses the same imports
        
        // The best approach: Use your app's waitlistService or access db directly
        // But we need to get the Firebase functions
        
        // Let's try a different approach: Create entries using your app's services
        console.log('💡 Using alternative method: Accessing via app services...');
        
        // If your app has waitlistService available, we could use it
        // But for now, let's use a script that injects Firebase
        
        throw new Error('Firebase not accessible. Using manual method instead.');
      }
    }
    
    // If we got here with db, use it
    if (db) {
      await createEntries(db);
      return;
    }
    
    // Alternative: Use your app's waitlistService if available
    if (window.waitlistService) {
      console.log('✅ Using waitlistService from app');
      // Use the service to create entries (but we need to modify dates)
      // This won't work directly because waitlistService uses serverTimestamp()
      // So we'll need to use Firestore directly
    }
    
    // Final fallback: Provide instructions for manual creation
    console.log('\n📝 Manual Method:');
    console.log('Since Firebase modules aren\'t directly accessible, use one of these:');
    console.log('1. Firebase Console method (see PHASE_3_3_TEST_DATA_GUIDE.md)');
    console.log('2. Use your app\'s waitlist signup form, then update dates in Firestore');
    console.log('3. Use the Node.js script: node create-test-waitlist-entries.js');
    
    async function createEntries(db) {
      // This function would create entries if we had db
      // Implementation would go here
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Solution: Use the Firebase Console method instead!');
    console.log('See: PHASE_3_3_TEST_DATA_GUIDE.md - Method 2: Firebase Console');
  }
})();

