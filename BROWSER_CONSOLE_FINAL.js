/**
 * FINAL WORKING Browser Console Script
 * 
 * This accesses Firebase via your app's React component tree
 * 
 * INSTRUCTIONS:
 * 1. Open your app in browser (http://localhost:3001)
 * 2. Open browser console (F12 or Cmd+Option+I)  
 * 3. Make sure you're on a page that uses Firebase (like the app)
 * 4. Copy and paste this ENTIRE script
 * 5. Press Enter
 */

// Access Firebase from your app's React component
// Your app imports Firebase in src/config/firebaseConfig.js
// We can access it via the React component tree or module cache

(function() {
  console.log('🧪 Creating test waitlist entries...\n');
  
  try {
    // Method: Access db from your app's Firebase config
    // Since your app exports db, we can try to access it via React
    
    // Get React root element
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('React root not found. Make sure app is loaded.');
    }
    
    // Try to access Firebase from React fiber/instance
    // React DevTools approach
    let db = null;
    
    // Method 1: Try window.__REACT_DEVTOOLS_GLOBAL_HOOK__
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('✅ React DevTools detected');
      // Can access React component tree via DevTools
    }
    
    // Method 2: Access via module cache (webpack)
    // Your app uses webpack, so modules are cached
    if (window.__webpack_require__) {
      console.log('✅ Webpack detected, trying to access Firebase module...');
      try {
        // Try to get Firebase from webpack cache
        // This is tricky and depends on webpack version
      } catch (e) {
        console.log('⚠️  Could not access via webpack');
      }
    }
    
    // Method 3: Use your app's waitlistService if available globally
    if (window.waitlistService) {
      console.log('✅ Found waitlistService on window');
      // But waitlistService uses serverTimestamp() which we can't override
      // So we still need direct Firestore access
    }
    
    // Method 4: Inject a script that runs in your app's context
    // This is the most reliable method
    const script = document.createElement('script');
    script.textContent = `
      (async function() {
        // This runs in your app's context, so it can import Firebase
        const { collection, addDoc, Timestamp, query, where, getDocs } = await import('firebase/firestore');
        const { getFirestore, getApps } = await import('firebase/app');
        
        // Get db from your app
        const apps = getApps();
        if (apps.length === 0) {
          throw new Error('Firebase not initialized');
        }
        
        const db = getFirestore(apps[0]);
        
        async function createEntry(email, name, daysAgo, referralCode, extra = {}) {
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          date.setHours(12, 0, 0, 0);
          
          const q = query(collection(db, 'waitlist'), where('email', '==', email));
          const existing = await getDocs(q);
          if (!existing.empty) {
            console.log(\`⏭️  \${email} already exists\`);
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
          console.log(\`✅ \${email} (\${daysAgo} days ago)\`);
          return ref.id;
        }
        
        // Create entries
        await createEntry('test-t2@example.com', 'Test T2', 2, 'KM-TESTT2');
        await createEntry('test-t5@example.com', 'Test T5', 5, 'KM-TESTT5');
        await createEntry('test-t8@example.com', 'Test T8', 8, 'KM-TESTT8');
        
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
        
        console.log('\\n✅ All entries created!');
      })();
    `;
    
    document.head.appendChild(script);
    console.log('✅ Script injected. Check console for results...');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Use Firebase Console method instead (see PHASE_3_3_TEST_DATA_GUIDE.md)');
  }
})();

