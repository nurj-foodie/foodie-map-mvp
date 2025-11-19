# Phase 3.3: Creating Test Data for Email Drip Testing

**Date:** 19 Nov 2025  
**Version:** v0.7.5

---

## 📋 Overview

This guide shows you how to create test waitlist entries with appropriate dates to test the email drip automation functions.

---

## 🎯 Test Data Requirements

To test each email function, you need waitlist entries with specific `signupDate` or `betaAccessDate` values:

| Email Type | Function | Required Date | Field |
|------------|----------|---------------|-------|
| T+2 Survey | `testSendSurveyEmailsT2` | 2 days ago | `signupDate` |
| T+5 Community | `testSendCommunityEmailsT5` | 5 days ago | `signupDate` |
| T+8 Referral Reminder | `testSendReferralReminderEmailsT8` | 8 days ago | `signupDate` |
| T+7 Feedback | `testSendFeedbackEmailsT7` | 7 days ago | `betaAccessDate` (also needs `betaAccessGranted: true`) |

---

## 📅 Date Calculation

### Current Date Reference
Today's date: **19 Nov 2025**

### Target Dates for Testing

**For T+2 (Survey Email):**
- Target Date: **17 Nov 2025** (2 days ago)
- Time Range: 17 Nov 2025 00:00:00 to 23:59:59

**For T+5 (Community Email):**
- Target Date: **14 Nov 2025** (5 days ago)
- Time Range: 14 Nov 2025 00:00:00 to 23:59:59

**For T+8 (Referral Reminder):**
- Target Date: **11 Nov 2025** (8 days ago)
- Time Range: 11 Nov 2025 00:00:00 to 23:59:59

**For T+7 (Feedback Email):**
- Target Date: **12 Nov 2025** (7 days ago)
- Time Range: 12 Nov 2025 00:00:00 to 23:59:59
- Also requires: `betaAccessGranted: true`

---

## 🔧 Method 1: Firebase Console (Manual)

### Step 1: Open Firestore Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `foodie-map-23842`
3. Navigate to **Firestore Database**
4. Click on the `waitlist` collection

### Step 2: Create New Document

1. Click **"Add document"**
2. **Document ID:** Leave empty (auto-generated) or use a test ID like `test-t2-survey-1`

### Step 3: Add Fields

**For T+2 Survey Email Test:**
```javascript
email: "test-t2@example.com"
name: "Test User T2"
signupDate: [Timestamp] 2025-11-17 12:00:00
referralCode: "KM-TESTT2"
surveyCompleted: false
createdAt: [Timestamp] 2025-11-17 12:00:00
```

**For T+5 Community Email Test:**
```javascript
email: "test-t5@example.com"
name: "Test User T5"
signupDate: [Timestamp] 2025-11-14 12:00:00
referralCode: "KM-TESTT5"
createdAt: [Timestamp] 2025-11-14 12:00:00
```

**For T+8 Referral Reminder Test:**
```javascript
email: "test-t8@example.com"
name: "Test User T8"
signupDate: [Timestamp] 2025-11-11 12:00:00
referralCode: "KM-TESTT8"
createdAt: [Timestamp] 2025-11-11 12:00:00
```

**For T+7 Feedback Email Test:**
```javascript
email: "test-t7@example.com"
name: "Test User T7"
signupDate: [Timestamp] 2025-11-01 12:00:00  // Earlier date
betaAccessGranted: true
betaAccessDate: [Timestamp] 2025-11-12 12:00:00
referralCode: "KM-TESTT7"
createdAt: [Timestamp] 2025-11-01 12:00:00
```

### Step 4: Set Timestamp Field

1. Click on the `signupDate` or `betaAccessDate` field
2. Select **"timestamp"** as the field type
3. Enter the date and time:
   - Click the calendar icon
   - Select the target date
   - Set time to 12:00:00 (noon) for consistency

---

## 💻 Method 2: Browser Console (Programmatic)

### Step 1: Open Your App

1. Open your app in browser: `http://localhost:3001` (or deployed URL)
2. Open browser console (F12 or Cmd+Option+I)

### Step 2: Run Script

Copy and paste this script into the console:

```javascript
// Import Firebase functions
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config/firebaseConfig';

// Helper function to create test waitlist entry
async function createTestWaitlistEntry(email, name, daysAgo, referralCode, options = {}) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);
  targetDate.setHours(12, 0, 0, 0); // Set to noon
  
  const waitlistData = {
    email,
    name,
    signupDate: targetDate,
    referralCode: referralCode || `KM-TEST${daysAgo}`,
    createdAt: targetDate,
    ...options
  };
  
  try {
    const docRef = await addDoc(collection(db, 'waitlist'), waitlistData);
    console.log(`✅ Created test entry: ${email} (ID: ${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Error creating entry:`, error);
    throw error;
  }
}

// Create test entries
console.log('Creating test waitlist entries...');

// T+2 Survey Email
await createTestWaitlistEntry(
  'test-t2@example.com',
  'Test User T2',
  2,
  'KM-TESTT2',
  { surveyCompleted: false }
);

// T+5 Community Email
await createTestWaitlistEntry(
  'test-t5@example.com',
  'Test User T5',
  5,
  'KM-TESTT5'
);

// T+8 Referral Reminder
await createTestWaitlistEntry(
  'test-t8@example.com',
  'Test User T8',
  8,
  'KM-TESTT8'
);

// T+7 Feedback Email (needs beta access)
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
sevenDaysAgo.setHours(12, 0, 0, 0);

await createTestWaitlistEntry(
  'test-t7@example.com',
  'Test User T7',
  30, // Signup date (earlier)
  'KM-TESTT7',
  {
    betaAccessGranted: true,
    betaAccessDate: sevenDaysAgo
  }
);

console.log('✅ All test entries created!');
```

**Note:** This script uses ES6 modules. If your app doesn't support modules in console, use the Firebase Admin method below.

---

## 🔧 Method 3: Firebase Admin Script (Node.js)

Create a file `create-test-data.js` in your project root:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestWaitlistEntry(email, name, daysAgo, referralCode, options = {}) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);
  targetDate.setHours(12, 0, 0, 0);
  
  const waitlistData = {
    email,
    name,
    signupDate: admin.firestore.Timestamp.fromDate(targetDate),
    referralCode: referralCode || `KM-TEST${daysAgo}`,
    createdAt: admin.firestore.Timestamp.fromDate(targetDate),
    ...options
  };
  
  try {
    const docRef = await db.collection('waitlist').add(waitlistData);
    console.log(`✅ Created: ${email} (ID: ${docRef.id})`);
    return docRef.id;
  } catch (error) {
    console.error(`❌ Error:`, error);
    throw error;
  }
}

async function createAllTestEntries() {
  console.log('Creating test waitlist entries...\n');
  
  // T+2 Survey Email
  await createTestWaitlistEntry(
    'test-t2@example.com',
    'Test User T2',
    2,
    'KM-TESTT2',
    { surveyCompleted: false }
  );
  
  // T+5 Community Email
  await createTestWaitlistEntry(
    'test-t5@example.com',
    'Test User T5',
    5,
    'KM-TESTT5'
  );
  
  // T+8 Referral Reminder
  await createTestWaitlistEntry(
    'test-t8@example.com',
    'Test User T8',
    8,
    'KM-TESTT8'
  );
  
  // T+7 Feedback Email
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(12, 0, 0, 0);
  
  await createTestWaitlistEntry(
    'test-t7@example.com',
    'Test User T7',
    30, // Signup date (earlier)
    'KM-TESTT7',
    {
      betaAccessGranted: true,
      betaAccessDate: admin.firestore.Timestamp.fromDate(sevenDaysAgo)
    }
  );
  
  console.log('\n✅ All test entries created!');
  process.exit(0);
}

createAllTestEntries().catch(console.error);
```

Run it:
```bash
node create-test-data.js
```

---

## 🧪 Method 4: Using Waitlist Service (Recommended)

If you have access to your app's waitlist service, you can use it directly:

```javascript
// In browser console or test script
import { waitlistService } from './services/waitlistService';

// Create entries with modified dates
// Note: This requires modifying waitlistService to accept custom dates
// Or create entries manually and update dates in Firestore
```

---

## ✅ Verification Steps

After creating test entries:

### 1. Verify in Firestore Console

1. Go to Firestore → `waitlist` collection
2. Check that entries exist with correct dates
3. Verify field types are **Timestamp** (not string)

### 2. Test Functions

Run the test functions:

```bash
# T+2 Survey Email
curl "https://us-central1-foodie-map-23842.cloudfunctions.net/testSendSurveyEmailsT2"

# T+5 Community Email
curl "https://us-central1-foodie-map-23842.cloudfunctions.net/testSendCommunityEmailsT5"

# T+8 Referral Reminder
curl "https://us-central1-foodie-map-23842.cloudfunctions.net/testSendReferralReminderEmailsT8"

# T+7 Feedback Email
curl "https://us-central1-foodie-map-23842.cloudfunctions.net/testSendFeedbackEmailsT7"
```

### 3. Check Results

Expected response:
```json
{
  "success": true,
  "message": "T+2 Survey Email test completed",
  "sentCount": 1,
  "skippedCount": 0,
  "errorCount": 0,
  "totalFound": 1
}
```

### 4. Verify Email Delivery

1. Check SendGrid Dashboard → Activity
2. Check email inbox (including spam folder)
3. Check Firestore → `email_drips` collection

---

## 🧹 Cleanup

After testing, you may want to delete test entries:

### Delete via Firebase Console

1. Go to Firestore → `waitlist` collection
2. Find test entries (search for `test-t2@example.com`, etc.)
3. Click on document → Delete

### Delete via Script

```javascript
// In browser console
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './config/firebaseConfig';

async function deleteTestEntries() {
  const testEmails = [
    'test-t2@example.com',
    'test-t5@example.com',
    'test-t8@example.com',
    'test-t7@example.com'
  ];
  
  for (const email of testEmails) {
    const q = query(collection(db, 'waitlist'), where('email', '==', email));
    const snapshot = await getDocs(q);
    
    snapshot.forEach(async (docSnap) => {
      await deleteDoc(doc(db, 'waitlist', docSnap.id));
      console.log(`✅ Deleted: ${email}`);
    });
  }
}

await deleteTestEntries();
```

---

## 📝 Quick Reference

### Required Fields for Waitlist Entry

```javascript
{
  email: string,              // Required
  name: string,               // Required
  signupDate: Timestamp,      // Required (for T+2, T+5, T+8)
  referralCode: string,       // Optional but recommended
  createdAt: Timestamp,        // Optional (usually same as signupDate)
  surveyCompleted: boolean,    // Optional (false for T+2 test)
  betaAccessGranted: boolean,  // Required (true for T+7 test)
  betaAccessDate: Timestamp   // Required (for T+7 test)
}
```

### Date Calculation Formula

```javascript
// For X days ago
const targetDate = new Date();
targetDate.setDate(targetDate.getDate() - X); // X = 2, 5, 8, or 7
targetDate.setHours(12, 0, 0, 0); // Set to noon
```

---

## 🎯 Example: Complete Test Scenario

1. **Create 4 test entries** (one for each email type)
2. **Run all 4 test functions**
3. **Verify emails sent** (check SendGrid dashboard)
4. **Check email inbox** (verify content)
5. **Check `email_drips` collection** (verify tracking)
6. **Test duplicate prevention** (run functions again - should skip)
7. **Clean up test entries** (optional)

---

## ⚠️ Important Notes

1. **Use Real Email Addresses:** Use your own email addresses for testing so you can verify delivery
2. **Check Spam Folder:** Emails may land in spam initially
3. **Timestamp Format:** Must be Firestore Timestamp, not string
4. **Time Zone:** Functions use Asia/Kuala_Lumpur timezone
5. **Date Range:** Functions look for entries within a 24-hour window (00:00:00 to 23:59:59)

---

**Last Updated:** 19 Nov 2025  
**Version:** v0.7.5

