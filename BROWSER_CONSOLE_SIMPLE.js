/**
 * SIMPLIFIED Browser Console Script
 * 
 * This version accesses Firebase from your React app's context
 * 
 * INSTRUCTIONS:
 * 1. Open your app in browser (http://localhost:3001)
 * 2. Open browser console (F12 or Cmd+Option+I)
 * 3. Copy and paste this ENTIRE script
 * 4. Press Enter
 */

// First, let's access Firebase from your app
// Your app exports db from src/config/firebaseConfig.js

(async function() {
  console.log('🧪 Creating test waitlist entries...\n');
  
  try {
    // Import Firebase functions
    const firebase = await import('firebase/firestore');
    const { collection, addDoc, Timestamp, query, where, getDocs } = firebase;
    
    // Get db from your app's Firebase instance
    // Method 1: Try to access from React DevTools
    // Method 2: Use dynamic import to get your app's config
    
    // Since your app uses environment variables, we'll need to access the initialized db
    // The easiest way is to use your app's waitlistService or access db directly
    
    // Let's try accessing from window if your app exposes it
    let db;
    
    // Check if db is available on window (some apps expose it)
    if (window.__FIREBASE_DB__) {
      db = window.__FIREBASE_DB__;
      console.log('✅ Found db on window');
    } else {
      // Try to get from your app's Firebase config
      // Import your config file dynamically
      try {
        const configModule = await import('./src/config/firebaseConfig.js');
        db = configModule.db;
        console.log('✅ Found db from config');
      } catch (e) {
        // If that doesn't work, we'll need to initialize Firebase ourselves
        console.log('⚠️  Could not access db from app. Initializing Firebase...');
        
        // Get config from your .env (we'll use the project ID we know)
        const { initializeApp } = await import('firebase/app');
        const { getFirestore } = await import('firebase/firestore');
        
        // You'll need to replace these with your actual config values
        // Or we can try to get them from the browser
        const firebaseConfig = {
          apiKey: "AIzaSyCqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq", // Replace with actual
          authDomain: "foodie-map-23842.firebaseapp.com",
          projectId: "foodie-map-23842",
          storageBucket: "foodie-map-23842.firebasestorage.app",
          messagingSenderId: "", // Get from your .env
          appId: "" // Get from your .env
        };
        
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log('✅ Initialized new Firebase app');
      }
    }
    
    // Helper function
    async function createEntry(email, name, daysAgo, referralCode, extra = {}) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(12, 0, 0, 0);
      
      // Check if exists
      const q = query(collection(db, 'waitlist'), where('email', '==', email));
      const existing = await getDocs(q);
      if (!existing.empty) {
        console.log(`⏭️  ${email} already exists`);
        return;
      }
      
      const data = {
        email: email.toLowerCase(),
        name,
        signupDate: Timestamp.fromDate(date),
        referralCode,
        createdAt: Timestamp.fromDate(date),
        signupOrder: Math.floor(Math.random() * 1000),
        cohortScore: 1000,
        kCoins: 25,
        surveyCompleted: false,
        betaAccessGranted: false,
        ...extra
      };
      
      const ref = await addDoc(collection(db, 'waitlist'), data);
      console.log(`✅ ${email} (${daysAgo} days ago)`);
      return ref.id;
    }
    
    // Create entries
    await createEntry('test-t2@example.com', 'Test T2', 2, 'KM-TESTT2');
    await createEntry('test-t5@example.com', 'Test T5', 5, 'KM-TESTT5');
    await createEntry('test-t8@example.com', 'Test T8', 8, 'KM-TESTT8');
    
    // T+7 needs beta access
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(12, 0, 0, 0);
    
    const signupDate = new Date();
    signupDate.setDate(signupDate.getDate() - 30);
    signupDate.setHours(12, 0, 0, 0);
    
    await createEntry('test-t7@example.com', 'Test T7', 30, 'KM-TESTT7', {
      betaAccessGranted: true,
      betaAccessDate: Timestamp.fromDate(sevenDaysAgo),
      signupDate: Timestamp.fromDate(signupDate)
    });
    
    console.log('\n✅ Done! Test the functions now.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Use Firebase Console method instead (see PHASE_3_3_TEST_DATA_GUIDE.md)');
  }
})();

