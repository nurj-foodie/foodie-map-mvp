/**
 * Browser Console Script: Create Test Waitlist Entries
 * 
 * INSTRUCTIONS:
 * 1. Open your app in browser (http://localhost:3001)
 * 2. Open browser console (F12 or Cmd+Option+I)
 * 3. Copy and paste this ENTIRE script
 * 4. Press Enter
 * 5. Wait for confirmation messages
 */

(async function createTestWaitlistEntries() {
  console.log('🧪 Starting test data creation...\n');
  
  try {
    // Import Firebase functions
    const { collection, addDoc, Timestamp, getFirestore, query, where, getDocs } = await import('firebase/firestore');
    const { initializeApp, getApps } = await import('firebase/app');
    
    // Get Firebase config from environment (your app already has this)
    // We'll use the same config your app uses
    const firebaseConfig = {
      apiKey: "AIzaSyCqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq", // This will be replaced by your actual config
      authDomain: "foodie-map-23842.firebaseapp.com",
      projectId: "foodie-map-23842",
      storageBucket: "foodie-map-23842.firebasestorage.app",
      messagingSenderId: process?.env?.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process?.env?.REACT_APP_FIREBASE_APP_ID || ""
    };
    
    // Try to get existing Firebase app, or initialize new one
    let app;
    const apps = getApps();
    if (apps.length > 0) {
      app = apps[0];
      console.log('✅ Using existing Firebase app');
    } else {
      // If no app exists, we need to get config from your app
      // For now, let's try to access it from window or use a simpler method
      console.log('⚠️  Firebase app not found. Trying alternative method...');
      
      // Alternative: Access db directly if exposed on window
      if (window.__FIREBASE_DB__) {
        const db = window.__FIREBASE_DB__;
        console.log('✅ Found Firebase db on window object');
        await createEntries(db);
        return;
      }
      
      throw new Error('Firebase not initialized. Please make sure your app is running and Firebase is loaded.');
    }
    
    const db = getFirestore(app);
    await createEntries(db);
    
    async function createEntries(db) {
      // Helper function to create test entry
      async function createTestEntry(email, name, daysAgo, referralCode, extraFields = {}) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - daysAgo);
        targetDate.setHours(12, 0, 0, 0); // Set to noon
        
        const data = {
          email: email.toLowerCase().trim(),
          name: name.trim(),
          signupDate: Timestamp.fromDate(targetDate),
          referralCode: referralCode || `KM-TEST${daysAgo}`,
          createdAt: Timestamp.fromDate(targetDate),
          signupOrder: Math.floor(Math.random() * 1000),
          cohortScore: 1000,
          kCoins: 25,
          surveyCompleted: false,
          surveyData: null,
          emailEngagement: {
            opens: 0,
            clicks: 0,
            lastOpened: null
          },
          betaAccessGranted: false,
          betaAccessDate: null,
          waveNumber: null,
          conversionStatus: 'waitlist',
          isCreator: false,
          creatorApproved: false,
          referredBy: null,
          ...extraFields
        };
        
        // Check if entry already exists
        const existingQuery = query(collection(db, 'waitlist'), where('email', '==', email));
        const existing = await getDocs(existingQuery);
        
        if (!existing.empty) {
          console.log(`⏭️  Entry already exists: ${email} (skipping)`);
          return existing.docs[0].id;
        }
        
        const docRef = await addDoc(collection(db, 'waitlist'), data);
        console.log(`✅ Created: ${email}`);
        console.log(`   Name: ${name}`);
        console.log(`   Date: ${targetDate.toLocaleDateString()} ${targetDate.toLocaleTimeString()}`);
        console.log(`   ID: ${docRef.id}\n`);
        return docRef.id;
      }
      
      // Create T+2 Survey Email entry (2 days ago)
      console.log('📧 Creating T+2 Survey Email test entry...');
      await createTestEntry('test-t2@example.com', 'Test User T2', 2, 'KM-TESTT2', {
        surveyCompleted: false
      });
      
      // Create T+5 Community Email entry (5 days ago)
      console.log('📧 Creating T+5 Community Email test entry...');
      await createTestEntry('test-t5@example.com', 'Test User T5', 5, 'KM-TESTT5');
      
      // Create T+8 Referral Reminder entry (8 days ago)
      console.log('📧 Creating T+8 Referral Reminder test entry...');
      await createTestEntry('test-t8@example.com', 'Test User T8', 8, 'KM-TESTT8');
      
      // Create T+7 Feedback Email entry (needs beta access 7 days ago)
      console.log('📧 Creating T+7 Feedback Email test entry...');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(12, 0, 0, 0);
      
      const signupDate = new Date();
      signupDate.setDate(signupDate.getDate() - 30);
      signupDate.setHours(12, 0, 0, 0);
      
      await createTestEntry(
        'test-t7@example.com',
        'Test User T7',
        30, // Signup date (earlier)
        'KM-TESTT7',
        {
          betaAccessGranted: true,
          betaAccessDate: Timestamp.fromDate(sevenDaysAgo),
          signupDate: Timestamp.fromDate(signupDate) // Override signupDate
        }
      );
      
      console.log('✅ All test entries created successfully!\n');
      console.log('📝 Next Steps:');
      console.log('1. Test the functions:');
      console.log('   - T+2: https://us-central1-foodie-map-23842.cloudfunctions.net/testSendSurveyEmailsT2');
      console.log('   - T+5: https://us-central1-foodie-map-23842.cloudfunctions.net/testSendCommunityEmailsT5');
      console.log('   - T+8: https://us-central1-foodie-map-23842.cloudfunctions.net/testSendReferralReminderEmailsT8');
      console.log('   - T+7: https://us-central1-foodie-map-23842.cloudfunctions.net/testSendFeedbackEmailsT7');
      console.log('\n2. Check SendGrid dashboard for email delivery');
      console.log('3. Check email inbox (including spam folder)');
      console.log('4. Verify in Firestore → email_drips collection');
    }
    
  } catch (error) {
    console.error('❌ Error creating test entries:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure your app is running');
    console.log('2. Check that Firebase is initialized in your app');
    console.log('3. Try the SIMPLIFIED script below that uses your app\'s Firebase instance');
    console.log('\nError details:', error.message);
    console.log('\n📝 Alternative: Use Firebase Console method (see PHASE_3_3_TEST_DATA_GUIDE.md)');
  }
})();
