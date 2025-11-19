# Phase 3.3: Email Drip Automation - Testing Guide

**Date:** 19 Nov 2025  
**Version:** v0.7.5  
**Status:** Ready for Testing

---

## 📋 Overview

This guide covers testing the Phase 3.3 Email Drip Automation scheduled functions. These functions automatically send emails based on user signup dates and beta access dates.

---

## 🔧 Prerequisites

### 1. Environment Setup

Before testing, ensure:
- ✅ SendGrid API key configured
- ✅ Firebase Functions initialized
- ✅ Dependencies installed in `functions/` directory
- ✅ Firestore indexes deployed (if needed)

### 2. Set Environment Variables

```bash
cd functions

# Set SendGrid API key (using secrets - recommended)
firebase functions:secrets:set SENDGRID_API_KEY
# Enter your SendGrid API key when prompted

# Set sender email
firebase functions:secrets:set SENDGRID_FROM_EMAIL
# Enter: nurj.media@gmail.com (or your verified sender)

# Set sender name
firebase functions:secrets:set SENDGRID_FROM_NAME
# Enter: Kawan Makan Community

# Set URLs (using config)
firebase functions:config:set landing_page.url="https://waitlist-foodie-map-23842.web.app"
firebase functions:config:set main_app.url="https://foodie-map-23842.web.app"
```

### 3. Install Dependencies

```bash
cd functions
npm install
```

---

## 🧪 Testing Methods

### Method 1: Manual Function Trigger (Recommended for Testing)

This allows you to test functions immediately without waiting for scheduled time.

#### Step 1: Deploy Functions

```bash
cd functions
firebase deploy --only functions
```

#### Step 2: Trigger Function Manually

**Option A: Using Firebase Console**
1. Go to Firebase Console → Functions
2. Select the function (e.g., `sendSurveyEmailsT2`)
3. Click "Test" tab
4. Click "Test Function" button
5. Check logs for results

**Option B: Using Firebase CLI**
```bash
# Start Firebase Functions shell
firebase functions:shell

# Then call the function
sendSurveyEmailsT2()
sendCommunityEmailsT5()
sendReferralReminderEmailsT8()
sendFeedbackEmailsT7()
```

**Option C: Using HTTP Request (for testing)**
You can create a test HTTP function wrapper (see below).

### Method 2: Create Test HTTP Functions

For easier testing, we can create HTTP-triggered versions of the functions.

---

## 📝 Test Cases

### Test 1: T+2 Survey Email Function

**Objective:** Verify survey emails are sent to users who signed up 2 days ago.

**Setup:**
1. Create a test waitlist entry with `signupDate` = 2 days ago
2. Ensure user hasn't completed survey
3. Ensure user hasn't received survey email

**Steps:**
1. Trigger `sendSurveyEmailsT2()` function
2. Check function logs
3. Verify email sent in Firestore (`email_drips` collection)
4. Check SendGrid dashboard
5. Verify email received in inbox

**Expected Results:**
- ✅ Function runs without errors
- ✅ Email sent to test user
- ✅ Email tracked in `email_drips` collection
- ✅ Email received in inbox
- ✅ Survey link points to main app (`?survey=true`)

**Logs to Check:**
```
📧 Running T+2 Survey Email Job...
📊 Found 1 users who signed up 2 days ago
✅ Email sent (survey): test@example.com (Message ID: ...)
✅ T+2 Survey Email Job Complete: 1 sent, 0 skipped, 0 errors
```

---

### Test 2: T+5 Community Email Function

**Objective:** Verify community emails are sent to users who signed up 5 days ago.

**Setup:**
1. Create a test waitlist entry with `signupDate` = 5 days ago
2. Ensure user hasn't received community email

**Steps:**
1. Trigger `sendCommunityEmailsT5()` function
2. Check function logs
3. Verify email sent in Firestore
4. Verify email received

**Expected Results:**
- ✅ Function runs successfully
- ✅ Email sent and tracked
- ✅ Email received

---

### Test 3: T+8 Referral Reminder Function

**Objective:** Verify referral reminder emails are sent to users who signed up 8 days ago.

**Setup:**
1. Create a test waitlist entry with `signupDate` = 8 days ago
2. Ensure user has a referral code
3. Ensure user hasn't received referral reminder email

**Steps:**
1. Trigger `sendReferralReminderEmailsT8()` function
2. Check function logs
3. Verify email sent
4. Verify referral link in email works

**Expected Results:**
- ✅ Function runs successfully
- ✅ Email includes referral code
- ✅ Referral link works correctly

---

### Test 4: T+7 Feedback Email Function

**Objective:** Verify feedback emails are sent to users who got beta access 7 days ago.

**Setup:**
1. Create a test waitlist entry with:
   - `betaAccessGranted` = true
   - `betaAccessDate` = 7 days ago
2. Ensure user hasn't received feedback email

**Steps:**
1. Trigger `sendFeedbackEmailsT7()` function
2. Check function logs
3. Verify email sent
4. Verify email received

**Expected Results:**
- ✅ Function runs successfully
- ✅ Only sends to users with beta access
- ✅ Email sent and tracked

---

### Test 5: Duplicate Prevention

**Objective:** Verify functions don't send duplicate emails.

**Setup:**
1. Create a test waitlist entry
2. Manually send an email (via EmailTestPanel)
3. Create `email_drips` record for that email type

**Steps:**
1. Trigger the function again
2. Check logs

**Expected Results:**
- ✅ Function skips user (email already sent)
- ✅ Log shows: "⏭️ Skipping {email} - {emailType} email already sent"
- ✅ No duplicate email sent

---

### Test 6: Survey Completion Skip

**Objective:** Verify T+2 function skips users who already completed survey.

**Setup:**
1. Create a test waitlist entry with:
   - `signupDate` = 2 days ago
   - `surveyCompleted` = true

**Steps:**
1. Trigger `sendSurveyEmailsT2()` function
2. Check logs

**Expected Results:**
- ✅ Function skips user
- ✅ Log shows: "⏭️ Skipping {email} - survey already completed"
- ✅ No email sent

---

## 🔍 Verification Checklist

### Function Execution
- [ ] Function runs without errors
- [ ] Function logs show correct user count
- [ ] Function logs show sent/skipped/error counts
- [ ] No unexpected errors in logs

### Email Delivery
- [ ] Email sent successfully (check SendGrid dashboard)
- [ ] Email received in inbox
- [ ] Email not in spam folder
- [ ] Email content renders correctly
- [ ] Links in email work correctly

### Firestore Tracking
- [ ] `email_drips` collection has new document
- [ ] Document has correct fields:
  - [ ] `waitlistId`
  - [ ] `email`
  - [ ] `emailType`
  - [ ] `sentAt` (timestamp)
  - [ ] `messageId`
  - [ ] `status` = "sent"

### Duplicate Prevention
- [ ] Function skips users who already received email
- [ ] Function skips users who completed survey (T+2 only)
- [ ] No duplicate emails sent

### Date Queries
- [ ] Function finds users with correct signup dates
- [ ] Function finds users with correct beta access dates
- [ ] Date range calculations are correct

---

## 🐛 Troubleshooting

### Issue: Function Not Found

**Error:** `Function sendSurveyEmailsT2 is not defined`

**Solution:**
- Deploy functions: `firebase deploy --only functions`
- Wait for deployment to complete
- Try again

### Issue: Index Required

**Error:** `The query requires an index`

**Solution:**
1. Copy the index URL from error message
2. Visit URL to create index
3. Wait for index to build (1-2 minutes)
4. Or deploy indexes: `firebase deploy --only firestore:indexes`

### Issue: SendGrid API Key Not Set

**Error:** `SendGrid API key not configured`

**Solution:**
```bash
firebase functions:secrets:set SENDGRID_API_KEY
# Enter your API key
```

### Issue: No Users Found

**Log:** `📊 Found 0 users who signed up X days ago`

**Possible Causes:**
- No users in waitlist with that date
- Date calculation is wrong
- `signupDate` field doesn't exist in waitlist documents

**Solution:**
- Check waitlist documents in Firestore
- Verify `signupDate` field exists
- Verify date format is correct (Firestore Timestamp)

### Issue: Emails Not Sending

**Error:** `Failed to send email`

**Possible Causes:**
- SendGrid API key invalid
- Sender email not verified
- Rate limit exceeded

**Solution:**
- Check SendGrid dashboard for errors
- Verify sender email is verified
- Check SendGrid account limits

---

## 📊 Test Data Setup

### Create Test Waitlist Entries

You can create test entries manually in Firestore or use the waitlist service:

**For T+2 Test:**
```javascript
// In browser console or test script
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

// Create waitlist entry with signupDate = twoDaysAgo
```

**For T+5 Test:**
```javascript
const fiveDaysAgo = new Date();
fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
```

**For T+8 Test:**
```javascript
const eightDaysAgo = new Date();
eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
```

**For T+7 Feedback Test:**
```javascript
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

// Create waitlist entry with:
// - betaAccessGranted: true
// - betaAccessDate: sevenDaysAgo
```

---

## ✅ Testing Checklist

### Pre-Testing
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Functions deployed
- [ ] Firestore indexes deployed (if needed)
- [ ] Test waitlist entries created

### Function Testing
- [ ] T+2 Survey Email function works
- [ ] T+5 Community Email function works
- [ ] T+8 Referral Reminder function works
- [ ] T+7 Feedback Email function works
- [ ] Duplicate prevention works
- [ ] Survey completion skip works

### Email Verification
- [ ] Emails sent successfully
- [ ] Emails received in inbox
- [ ] Email content correct
- [ ] Links work correctly
- [ ] Email tracking works

### Post-Testing
- [ ] All functions tested
- [ ] All issues resolved
- [ ] Documentation updated
- [ ] Ready for production

---

## 🚀 Quick Test Commands

```bash
# Navigate to functions directory
cd functions

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:sendSurveyEmailsT2

# View function logs
firebase functions:log

# View specific function logs
firebase functions:log --only sendSurveyEmailsT2

# Test function locally (requires emulator)
firebase emulators:start --only functions
```

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Version: v0.7.5

Test Results:
- Test 1: T+2 Survey Email: [ ] PASS [ ] FAIL
- Test 2: T+5 Community Email: [ ] PASS [ ] FAIL
- Test 3: T+8 Referral Reminder: [ ] PASS [ ] FAIL
- Test 4: T+7 Feedback Email: [ ] PASS [ ] FAIL
- Test 5: Duplicate Prevention: [ ] PASS [ ] FAIL
- Test 6: Survey Completion Skip: [ ] PASS [ ] FAIL

Issues Found:
1. ___________
2. ___________

Notes:
___________
```

---

**Last Updated:** 19 Nov 2025  
**Version:** v0.7.5

