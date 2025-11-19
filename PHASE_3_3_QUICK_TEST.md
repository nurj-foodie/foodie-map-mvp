# Phase 3.3: Quick Testing Guide

**Date:** 19 Nov 2025  
**Version:** v0.7.5

---

## 🚀 Quick Start Testing

### Step 1: Set Environment Variables (if not already set)

```bash
cd functions

# Set SendGrid API key
firebase functions:secrets:set SENDGRID_API_KEY
# Enter your SendGrid API key when prompted

# Set sender email
firebase functions:secrets:set SENDGRID_FROM_EMAIL
# Enter: nurj.media@gmail.com

# Set sender name
firebase functions:secrets:set SENDGRID_FROM_NAME
# Enter: Kawan Makan Community

# Set URLs
firebase functions:config:set landing_page.url="https://waitlist-foodie-map-23842.web.app"
firebase functions:config:set main_app.url="https://foodie-map-23842.web.app"
```

### Step 2: Deploy Functions

```bash
cd functions
firebase deploy --only functions
```

### Step 3: Test Functions

**Option A: Using HTTP Test Functions (Easiest)**

After deployment, you'll get URLs like:
- `https://us-central1-foodie-map-23842.cloudfunctions.net/testSendSurveyEmailsT2`
- `https://us-central1-foodie-map-23842.cloudfunctions.net/testSendCommunityEmailsT5`
- `https://us-central1-foodie-map-23842.cloudfunctions.net/testSendReferralReminderEmailsT8`
- `https://us-central1-foodie-map-23842.cloudfunctions.net/testSendFeedbackEmailsT7`

Just visit these URLs in your browser or use curl:

```bash
curl https://us-central1-foodie-map-23842.cloudfunctions.net/testSendSurveyEmailsT2
```

**Option B: Using Firebase Console**

1. Go to Firebase Console → Functions
2. Select function (e.g., `testSendSurveyEmailsT2`)
3. Click "Test" tab
4. Click "Test Function"

**Option C: Using Firebase CLI**

```bash
firebase functions:shell
> testSendSurveyEmailsT2()
```

---

## 📊 What to Check

### 1. Function Logs

Check Firebase Console → Functions → Logs for:
- ✅ Function execution started
- ✅ Number of users found
- ✅ Emails sent/skipped/errors
- ✅ Any error messages

### 2. Firestore

Check `email_drips` collection:
- ✅ New documents created for sent emails
- ✅ Correct `emailType` field
- ✅ `messageId` present
- ✅ `status` = "sent"

### 3. SendGrid Dashboard

Check SendGrid → Activity:
- ✅ Emails show as "Delivered"
- ✅ No bounces or blocks

### 4. Email Inbox

- ✅ Email received
- ✅ Content renders correctly
- ✅ Links work

---

## 🧪 Test Scenarios

### Scenario 1: Test with Existing Users

If you have waitlist entries, the functions will automatically find users who:
- Signed up 2 days ago (for T+2)
- Signed up 5 days ago (for T+5)
- Signed up 8 days ago (for T+8)
- Got beta access 7 days ago (for T+7)

### Scenario 2: Create Test Data

If you need to create test data, you can manually add waitlist entries in Firestore with:
- `signupDate`: Set to 2/5/8 days ago
- `betaAccessDate`: Set to 7 days ago (for feedback email)
- `email`: Your test email
- `name`: Test name

---

## ✅ Expected Results

**If users found:**
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

**If no users found:**
```json
{
  "success": true,
  "message": "T+2 Survey Email test completed",
  "sentCount": 0,
  "skippedCount": 0,
  "errorCount": 0,
  "totalFound": 0
}
```

---

## 🐛 Common Issues

**Issue:** "No users found"
- **Solution:** Create test waitlist entries with correct dates

**Issue:** "Index required"
- **Solution:** Deploy indexes: `firebase deploy --only firestore:indexes`

**Issue:** "SendGrid API key not configured"
- **Solution:** Set secret: `firebase functions:secrets:set SENDGRID_API_KEY`

---

**Ready to test!** Start with the HTTP test functions for easiest testing.

