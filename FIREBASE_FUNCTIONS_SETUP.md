# Firebase Functions Setup for Email Service

**Date:** 19 November 2025  
**Purpose:** Set up Firebase Functions to send emails server-side (avoiding CORS issues)

---

## 🎯 Why Firebase Functions?

SendGrid API doesn't allow direct browser calls due to CORS restrictions. Firebase Functions allows us to:
- ✅ Keep API keys secure (server-side only)
- ✅ Avoid CORS issues
- ✅ Send emails reliably

---

## 📋 Setup Steps

### Step 1: Install Firebase CLI (if not installed)

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Functions

```bash
cd "/Users/izura/Documents/foodie mvp/foodie-simple"
firebase init functions
```

**When prompted:**
- ✅ Use existing project: `foodie-map-23842`
- ✅ Language: JavaScript
- ✅ ESLint: Yes
- ✅ Install dependencies: Yes

### Step 4: Install SendGrid Package

```bash
cd functions
npm install @sendgrid/mail
cd ..
```

### Step 5: Create Email Function

Create `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// Set SendGrid API key from environment config
sgMail.setApiKey(functions.config().sendgrid.key);

exports.sendEmail = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated (optional - remove if you want anonymous access)
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  // }

  const { to, subject, html, text, fromEmail, fromName } = data;

  if (!to || !subject || !html || !text) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  const msg = {
    to,
    from: {
      email: fromEmail || functions.config().sendgrid.from_email,
      name: fromName || functions.config().sendgrid.from_name,
    },
    subject,
    text,
    html,
    tracking_settings: {
      click_tracking: { enable: true },
      open_tracking: { enable: true },
    },
  };

  try {
    const result = await sgMail.send(msg);
    const messageId = result[0]?.headers?.['x-message-id'] || null;

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error('SendGrid error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### Step 6: Set Firebase Functions Config

```bash
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
firebase functions:config:set sendgrid.from_email="your_verified_email@example.com"
firebase functions:config:set sendgrid.from_name="Kawan Makan Community"
```

**Replace:**
- `YOUR_SENDGRID_API_KEY` - Your actual SendGrid API key (starts with `SG.`)
- `your_verified_email@example.com` - Your verified sender email

### Step 7: Deploy Function

```bash
firebase deploy --only functions:sendEmail
```

---

## ✅ Verification

After deployment, test the function:

1. Go to Firebase Console → Functions
2. Find `sendEmail` function
3. Check it's deployed and active

---

## 🧪 Testing

The `EmailTestPanel` component will now call the Firebase Function instead of SendGrid directly. Test as usual:

1. Go to User Dashboard → Beta Test tab
2. Scroll to Email Service Test Panel
3. Enter email and name
4. Click any email button
5. Check for success message

---

## 📝 Notes

- **API Key Security:** API key is now stored in Firebase Functions config (secure)
- **CORS:** No CORS issues since function runs server-side
- **Cost:** Firebase Functions free tier: 2 million invocations/month
- **Performance:** Slightly slower (network call to Firebase), but more secure

---

## 🔧 Troubleshooting

### Function Not Found Error

**Problem:** "Firebase Function not deployed"

**Solution:**
1. Check function is deployed: `firebase functions:list`
2. Redeploy: `firebase deploy --only functions:sendEmail`
3. Check function name matches in code

### Config Not Set

**Problem:** "SendGrid API key not configured"

**Solution:**
1. Set config: `firebase functions:config:set sendgrid.key="YOUR_KEY"`
2. Redeploy function after setting config

### Permission Denied

**Problem:** Function call fails with permission error

**Solution:**
1. Check Firestore rules allow function calls
2. Remove authentication check in function (if needed for anonymous access)

---

## 📚 Related Files

- `src/services/emailService.js` - Updated to use Firebase Functions
- `PHASE_3_1_COMPLETION_SUMMARY.md` - Implementation details

---

**Last Updated:** 19 November 2025

