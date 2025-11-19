# Browser Console: Create Test Waitlist Entries

**Quick Guide:** Copy and paste this script into your browser console to create test data for email drip testing.

---

## 🚀 Quick Start

1. **Open your app** in browser: `http://localhost:3001` (or your deployed URL)
2. **Open browser console**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
3. **Paste the script below** and press Enter
4. **Wait for confirmation** messages

---

## 📋 Script to Copy

```javascript
// ============================================
// CREATE TEST WAITLIST ENTRIES FOR EMAIL DRIP TESTING
// ============================================
// Paste this entire script into your browser console

(async function() {
  try {
    // Import Firebase functions (using dynamic import)
    const { collection, addDoc, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Get Firebase instance from window (if available) or use your app's config
    // Option 1: If Firebase is available globally
    let db;
    if (window.firebase && window.firebase.firestore) {
      db = window.firebase.firestore();
    } else {
      // Option 2: Access from React app's Firebase instance
      // This assumes your app exposes Firebase or we need to use the config
      console.log('⚠️  Trying to access Firebase from app context...');
      
      // Try to get db from React DevTools or app context
      // If this doesn't work, we'll use a different approach
      throw new Error('Please use the alternative script below that uses your app\'s Firebase instance');
    }
    
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
        surveyCompleted: false,
        kCoins: 25,
        cohortScore: 1000,
        betaAccessGranted: false,
        betaAccessDate: null,
        ...extraFields
      };
      
      const docRef = await addDoc(collection(db, 'waitlist'), data);
      console.log(`✅ Created: ${email} (${daysAgo} days ago, ID: ${docRef.id})`);
      return docRef.id;
    }
    
    console.log('🧪 Creating test waitlist entries...\n');
    
    // T+2 Survey Email (2 days ago)
    await createTestEntry('test-t2@example.com', 'Test User T2', 2, 'KM-TESTT2');
    
    // T+5 Community Email (5 days ago)
    await createTestEntry('test-t5@example.com', 'Test User T5', 5, 'KM-TESTT5');
    
    // T+8 Referral Reminder (8 days ago)
    await createTestEntry('test-t8@example.com', 'Test User T8', 8, 'KM-TESTT8');
    
    // T+7 Feedback Email (needs beta access 7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(12, 0, 0, 0);
    
    const signupDate = new Date();
    signupDate.setDate(signupDate.getDate() - 30);
    signupDate.setHours(12, 0, 0, 0);
    
    await createTestEntry(
      'test-t7@example.com',
      'Test User T7',
      30, // Signup date
      'KM-TESTT7',
      {
        betaAccessGranted: true,
        betaAccessDate: Timestamp.fromDate(sevenDaysAgo),
        signupDate: Timestamp.fromDate(signupDate) // Override signupDate
      }
    );
    
    console.log('\n✅ All test entries created successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Test functions using the URLs:');
    console.log('   - T+2: https://us-central1-foodie-map-23842.cloudfunctions.net/testSendSurveyEmailsT2');
    console.log('   - T+5: https://us-central1-foodie-map-23842.cloudfunctions.net/testSendCommunityEmailsT5');
    console.log('   - T+8: https://us-central1-foodie-map-23842.cloudfunctions.net/testSendReferralReminderEmailsT8');
    console.log('   - T+7: https://us-central1-foodie-map-23842.cloudfunctions.net/testSendFeedbackEmailsT7');
    console.log('2. Check SendGrid dashboard for email delivery');
    console.log('3. Check your email inbox (including spam folder)');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 If you see an error, try the alternative script below that uses your app\'s Firebase instance directly.');
  }
})();
```

---

## 🔧 Alternative Script (If Above Doesn't Work)

If the script above doesn't work, use this version that accesses Firebase from your React app:

```javascript
// ============================================
// ALTERNATIVE: Access Firebase from React App
// ============================================

// This script accesses Firebase from your React app's context
// Make sure your app is running and you're logged in to the app

(async function() {
  try {
    // Access React DevTools to get Firebase instance
    // Or use the window object if Firebase is exposed
    
    // Method 1: If your app exposes Firebase on window
    if (!window.__FIREBASE_DB__) {
      console.log('⚠️  Firebase not found on window object.');
      console.log('💡 Trying to access from React component...');
      
      // Method 2: Access from React component (if available)
      const reactFiber = document.querySelector('#root')._reactInternalInstance || 
                        document.querySelector('#root')._reactInternalFiber ||
                        document.querySelector('#root').__reactInternalInstance;
      
      if (reactFiber) {
        console.log('✅ Found React instance');
        // Try to find Firebase in component tree
      }
    }
    
    // For now, let's use a simpler approach - access via your app's Firebase config
    // You'll need to manually get the db instance
    
    console.log('📝 Please use the "Direct Firebase Access" method below instead.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

---

## 🎯 Direct Firebase Access (Recommended)

**Best Method:** Access Firebase directly from your app's code. Open your app's source and use this:

```javascript
// ============================================
// DIRECT FIREBASE ACCESS (RECOMMENDED)
// ============================================
// This works if you can access your app's Firebase instance

// Step 1: In your browser console, first get the Firebase instance
// If your app uses Firebase, it's likely available in the React DevTools

// Step 2: Use this script (modify the db reference as needed)

const { collection, addDoc, Timestamp } = await import('firebase/firestore');

// Get db from your app - you may need to inspect your app's code
// Or use React DevTools to find the Firebase instance
// For now, let's assume you can access it via window or React

// If your app exposes db on window:
const db = window.__FIREBASE_DB__ || window.db;

// Or if you need to import from your app's config:
// This requires your app to be running and Firebase initialized

async function createTestEntry(email, name, daysAgo, referralCode, extraFields = {}) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);
  targetDate.setHours(12, 0, 0, 0);
  
  const data = {
    email: email.toLowerCase().trim(),
    name: name.trim(),
    signupDate: Timestamp.fromDate(targetDate),
    referralCode: referralCode || `KM-TEST${daysAgo}`,
    createdAt: Timestamp.fromDate(targetDate),
    surveyCompleted: false,
    kCoins: 25,
    cohortScore: 1000,
    betaAccessGranted: false,
    betaAccessDate: null,
    ...extraFields
  };
  
  const docRef = await addDoc(collection(db, 'waitlist'), data);
  console.log(`✅ Created: ${email} (${daysAgo} days ago)`);
  return docRef.id;
}

// Create all entries
console.log('🧪 Creating test entries...');

await createTestEntry('test-t2@example.com', 'Test User T2', 2, 'KM-TESTT2');
await createTestEntry('test-t5@example.com', 'Test User T5', 5, 'KM-TESTT5');
await createTestEntry('test-t8@example.com', 'Test User T8', 8, 'KM-TESTT8');

// T+7 needs beta access
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
sevenDaysAgo.setHours(12, 0, 0, 0);

const signupDate = new Date();
signupDate.setDate(signupDate.getDate() - 30);
signupDate.setHours(12, 0, 0, 0);

await createTestEntry('test-t7@example.com', 'Test User T7', 30, 'KM-TESTT7', {
  betaAccessGranted: true,
  betaAccessDate: Timestamp.fromDate(sevenDaysAgo),
  signupDate: Timestamp.fromDate(signupDate)
});

console.log('✅ All entries created!');
```

---

## 🎯 Simplest Method: Use Your App's Waitlist Service

**Easiest approach:** If your app has a waitlist signup form, you can use it directly, then manually update the dates in Firestore Console.

1. **Sign up 4 test users** via your app's waitlist form
2. **Go to Firebase Console** → Firestore → `waitlist` collection
3. **Update the `signupDate`** field for each entry:
   - Entry 1: Set to 2 days ago
   - Entry 2: Set to 5 days ago
   - Entry 3: Set to 8 days ago
   - Entry 4: Set `betaAccessGranted: true` and `betaAccessDate` to 7 days ago

---

## ✅ Verification

After creating entries, verify in Firebase Console:

1. Go to **Firestore** → `waitlist` collection
2. Check that entries exist with correct dates
3. Verify `signupDate` is a **Timestamp** (not string)
4. For T+7 entry, verify `betaAccessGranted: true` and `betaAccessDate` is set

---

## 🧪 Test the Functions

Once entries are created, test the functions:

```bash
# In terminal or browser
curl "https://us-central1-foodie-map-23842.cloudfunctions.net/testSendSurveyEmailsT2"
```

Or visit the URLs directly in your browser.

---

**Need help?** If the scripts don't work, use the Firebase Console method (Method 2) from the main guide - it's the most reliable!

