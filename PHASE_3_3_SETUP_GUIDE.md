# Phase 3.3: Email Drip Automation - Setup Guide

**Date:** 19 Nov 2025  
**Version:** v0.7.5  
**Status:** Ready for Deployment

---

## 📋 Overview

Phase 3.3 implements automated email drip sequence using Firebase Functions scheduled triggers. This eliminates the need for manual email sending and ensures timely delivery of emails based on user signup dates.

---

## ✅ What's Implemented

### Scheduled Functions Created

1. **`sendSurveyEmailsT2`** - T+2 Survey Email
   - Runs: Daily at 9:00 AM (Asia/Kuala_Lumpur)
   - Sends to: Users who signed up 2 days ago
   - Skips: Users who already completed survey or received email

2. **`sendCommunityEmailsT5`** - T+5 Community Email
   - Runs: Daily at 9:00 AM (Asia/Kuala_Lumpur)
   - Sends to: Users who signed up 5 days ago
   - Skips: Users who already received email

3. **`sendReferralReminderEmailsT8`** - T+8 Referral Reminder
   - Runs: Daily at 9:00 AM (Asia/Kuala_Lumpur)
   - Sends to: Users who signed up 8 days ago
   - Skips: Users who already received email

4. **`sendFeedbackEmailsT7`** - T+7 Feedback Email (post-invite)
   - Runs: Daily at 9:00 AM (Asia/Kuala_Lumpur)
   - Sends to: Users who got beta access 7 days ago
   - Skips: Users who already received email

### Files Created

- `functions/emailDrip.js` - Email templates and helper functions for scheduled triggers
- Updated `functions/index.js` - Added 4 scheduled functions

---

## 🔧 Setup Instructions

### Step 1: Set Environment Variables

Set the following environment variables for Firebase Functions:

```bash
# Navigate to functions directory
cd functions

# Set SendGrid API key (using secrets - recommended)
firebase functions:secrets:set SENDGRID_API_KEY

# Set sender email
firebase functions:secrets:set SENDGRID_FROM_EMAIL

# Set sender name
firebase functions:secrets:set SENDGRID_FROM_NAME

# Set landing page URL
firebase functions:config:set landing_page.url="https://waitlist-foodie-map-23842.web.app"

# Set main app URL
firebase functions:config:set main_app.url="https://foodie-map-23842.web.app"
```

**Or use environment variables in `.env` file (for local development):**

Create `functions/.env`:
```env
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=nurj.media@gmail.com
SENDGRID_FROM_NAME=Kawan Makan Community
LANDING_PAGE_URL=https://waitlist-foodie-map-23842.web.app
MAIN_APP_URL=https://foodie-map-23842.web.app
```

### Step 2: Install Dependencies

```bash
cd functions
npm install
```

### Step 3: Create Firestore Indexes (if needed)

The scheduled functions query by `signupDate` and `betaAccessDate`. Firebase may prompt you to create indexes when you first run the functions. If you see index errors:

1. Copy the index URL from the error message
2. Visit the URL to create the index
3. Wait for index to build (usually 1-2 minutes)

**Or manually add to `firestore.indexes.json`:**

```json
{
  "indexes": [
    {
      "collectionGroup": "waitlist",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "signupDate",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "signupDate",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "waitlist",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "betaAccessGranted",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "betaAccessDate",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
```

Then deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

### Step 4: Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:sendSurveyEmailsT2
firebase deploy --only functions:sendCommunityEmailsT5
firebase deploy --only functions:sendReferralReminderEmailsT8
firebase deploy --only functions:sendFeedbackEmailsT7
```

### Step 5: Verify Deployment

1. Go to Firebase Console → Functions
2. Verify all 4 scheduled functions are deployed
3. Check function logs for any errors

---

## 🧪 Testing

### Manual Testing (Trigger Functions Immediately)

You can manually trigger scheduled functions for testing:

```bash
# Trigger T+2 Survey Email function
firebase functions:shell
> sendSurveyEmailsT2()
```

Or use Firebase Console:
1. Go to Functions → Select function
2. Click "Test" tab
3. Click "Test Function"

### Testing with Real Data

1. **Create test waitlist entries** with dates:
   - 2 days ago → Should receive survey email
   - 5 days ago → Should receive community email
   - 8 days ago → Should receive referral reminder

2. **Wait for scheduled time** (9:00 AM) or **trigger manually**

3. **Check results:**
   - Firebase Console → Functions → Logs
   - Firestore → `email_drips` collection
   - User email inbox

### Expected Log Output

```
📧 Running T+2 Survey Email Job...
📊 Found 3 users who signed up 2 days ago
⏭️ Skipping user1@example.com - survey already completed
✅ Email sent (survey): user2@example.com (Message ID: ...)
✅ Email sent (survey): user3@example.com (Message ID: ...)
✅ T+2 Survey Email Job Complete: 2 sent, 1 skipped, 0 errors
```

---

## 📊 Email Drip Sequence

| Email | Timing | Function | Schedule |
|-------|--------|----------|----------|
| Welcome | T+0 | Manual (on signup) | Immediate |
| Survey | T+2 | `sendSurveyEmailsT2` | Daily 9:00 AM |
| Community | T+5 | `sendCommunityEmailsT5` | Daily 9:00 AM |
| Referral Reminder | T+8 | `sendReferralReminderEmailsT8` | Daily 9:00 AM |
| Invite | Rolling | Manual (on beta access) | Immediate |
| Feedback | T+7 post-invite | `sendFeedbackEmailsT7` | Daily 9:00 AM |

---

## 🔍 Monitoring

### Check Function Logs

```bash
# View all function logs
firebase functions:log

# View specific function logs
firebase functions:log --only sendSurveyEmailsT2
```

### Check Email Delivery

1. **Firestore:** Check `email_drips` collection for sent emails
2. **SendGrid Dashboard:** Check Activity → Email Activity
3. **User Inbox:** Verify emails received

### Common Issues

**Issue:** Functions not running
- **Solution:** Check Firebase Console → Functions → Check if functions are enabled
- **Solution:** Verify Pub/Sub API is enabled in Google Cloud Console

**Issue:** Index errors
- **Solution:** Create required Firestore indexes (see Step 3)

**Issue:** Emails not sending
- **Solution:** Check SendGrid API key is set correctly
- **Solution:** Verify sender email is verified in SendGrid
- **Solution:** Check function logs for errors

**Issue:** Duplicate emails
- **Solution:** Function checks `email_drips` collection to prevent duplicates
- **Solution:** If duplicates occur, check `wasEmailSent()` function

---

## 📝 Notes

- **Time Zone:** All functions run at 9:00 AM Asia/Kuala_Lumpur time
- **Date Calculation:** Functions calculate dates based on `signupDate` and `betaAccessDate` fields
- **Duplicate Prevention:** Functions check `email_drips` collection before sending
- **Error Handling:** Functions continue processing even if individual emails fail
- **Logging:** All actions are logged for monitoring and debugging

---

## 🚀 Next Steps

After deployment:
1. Monitor function logs for first few days
2. Verify emails are being sent correctly
3. Check user engagement (opens, clicks)
4. Adjust timing if needed (currently 9:00 AM)

---

**Last Updated:** 19 Nov 2025  
**Version:** v0.7.5

