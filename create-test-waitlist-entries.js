/**
 * Script to create test waitlist entries for Phase 3.3 Email Drip Testing
 * 
 * Usage:
 * 1. Make sure you have Firebase Admin SDK installed: npm install firebase-admin
 * 2. Get your service account key from Firebase Console → Project Settings → Service Accounts
 * 3. Save it as 'service-account-key.json' in project root (or update path below)
 * 4. Run: node create-test-waitlist-entries.js
 * 
 * Note: This script requires Firebase Admin SDK and service account credentials
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Option 1: Use service account key file
// Uncomment and update path if using service account file:
// const serviceAccount = require('./service-account-key.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Option 2: Use Application Default Credentials (recommended for local testing)
// Run: gcloud auth application-default login
// Then uncomment:
// admin.initializeApp();

// Option 3: Use environment variable (for CI/CD)
// Set GOOGLE_APPLICATION_CREDENTIALS environment variable
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    console.log('\n📝 Setup Instructions:');
    console.log('1. Install: npm install firebase-admin');
    console.log('2. Get service account key from Firebase Console');
    console.log('3. Set GOOGLE_APPLICATION_CREDENTIALS or use service account file');
    process.exit(1);
  }
}

const db = admin.firestore();

/**
 * Create a test waitlist entry
 */
async function createTestWaitlistEntry(email, name, daysAgo, referralCode, options = {}) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);
  targetDate.setHours(12, 0, 0, 0); // Set to noon for consistency
  
  const waitlistData = {
    email,
    name,
    signupDate: admin.firestore.Timestamp.fromDate(targetDate),
    referralCode: referralCode || `KM-TEST${daysAgo}`,
    createdAt: admin.firestore.Timestamp.fromDate(targetDate),
    ...options
  };
  
  try {
    // Check if entry already exists
    const existingQuery = await db.collection('waitlist')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!existingQuery.empty) {
      console.log(`⏭️  Entry already exists: ${email}`);
      return existingQuery.docs[0].id;
    }
    
    const docRef = await db.collection('waitlist').add(waitlistData);
    console.log(`✅ Created: ${email} (ID: ${docRef.id})`);
    console.log(`   Date: ${targetDate.toLocaleDateString()} ${targetDate.toLocaleTimeString()}`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Error creating entry for ${email}:`, error.message);
    throw error;
  }
}

/**
 * Create all test entries
 */
async function createAllTestEntries() {
  console.log('🧪 Creating test waitlist entries for Email Drip Testing...\n');
  
  try {
    // T+2 Survey Email (2 days ago)
    console.log('📧 Creating T+2 Survey Email test entry...');
    await createTestWaitlistEntry(
      'test-t2@example.com',
      'Test User T2',
      2,
      'KM-TESTT2',
      { surveyCompleted: false }
    );
    
    // T+5 Community Email (5 days ago)
    console.log('\n📧 Creating T+5 Community Email test entry...');
    await createTestWaitlistEntry(
      'test-t5@example.com',
      'Test User T5',
      5,
      'KM-TESTT5'
    );
    
    // T+8 Referral Reminder (8 days ago)
    console.log('\n📧 Creating T+8 Referral Reminder test entry...');
    await createTestWaitlistEntry(
      'test-t8@example.com',
      'Test User T8',
      8,
      'KM-TESTT8'
    );
    
    // T+7 Feedback Email (7 days ago, needs beta access)
    console.log('\n📧 Creating T+7 Feedback Email test entry...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(12, 0, 0, 0);
    
    // Signup date should be earlier (e.g., 30 days ago)
    const signupDate = new Date();
    signupDate.setDate(signupDate.getDate() - 30);
    signupDate.setHours(12, 0, 0, 0);
    
    await createTestWaitlistEntry(
      'test-t7@example.com',
      'Test User T7',
      30, // Signup date (earlier)
      'KM-TESTT7',
      {
        betaAccessGranted: true,
        betaAccessDate: admin.firestore.Timestamp.fromDate(sevenDaysAgo),
        signupDate: admin.firestore.Timestamp.fromDate(signupDate) // Override signupDate
      }
    );
    
    console.log('\n✅ All test entries created successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Test functions:');
    console.log('   curl "https://us-central1-foodie-map-23842.cloudfunctions.net/testSendSurveyEmailsT2"');
    console.log('   curl "https://us-central1-foodie-map-23842.cloudfunctions.net/testSendCommunityEmailsT5"');
    console.log('   curl "https://us-central1-foodie-map-23842.cloudfunctions.net/testSendReferralReminderEmailsT8"');
    console.log('   curl "https://us-central1-foodie-map-23842.cloudfunctions.net/testSendFeedbackEmailsT7"');
    console.log('2. Check SendGrid dashboard for email delivery');
    console.log('3. Check email inbox (including spam folder)');
    console.log('4. Check Firestore → email_drips collection');
    
  } catch (error) {
    console.error('\n❌ Error creating test entries:', error);
    process.exit(1);
  }
}

// Run the script
createAllTestEntries()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

