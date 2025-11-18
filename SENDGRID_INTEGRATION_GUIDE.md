# SendGrid Integration Guide - Node.js Web API

**Date:** 17 November 2025  
**Language:** Node.js  
**Method:** Web API (Recommended)  
**Package:** `@sendgrid/mail`

---

## 🎯 Choose Integration Method

SendGrid offers two integration methods. For Node.js/React apps, use **Web API**.

### ✅ Web API (Recommended for Node.js)
- Uses SendGrid's Node.js SDK (`@sendgrid/mail`)
- Better performance and features
- Easier to use with Node.js/React
- **Choose this one!**

### ❌ SMTP Relay (Not Recommended)
- Uses SMTP protocol
- More complex setup
- Less features
- **Skip this option**

---

## 📦 Installation

### Step 1: Install SendGrid Package

In your `foodie-simple/` directory:

```bash
npm install @sendgrid/mail
```

This will add `@sendgrid/mail` to your `package.json` dependencies.

---

## 🔐 Security Considerations

### ⚠️ IMPORTANT: API Key Security

**Problem:** SendGrid API key should NOT be exposed in client-side React code.

**Two Options:**

### Option A: Firebase Functions (Recommended - Secure)
- Create Firebase Cloud Function (server-side)
- Store API key in Firebase Functions environment
- Call function from React app
- **Keeps API key secure** ✅

### Option B: Client-Side (Quick Start - Less Secure)
- Use SendGrid SDK directly in React app
- API key exposed in client-side code
- **OK for MVP/testing** ⚠️
- **Must migrate to Option A before production**

---

## 🚀 Quick Start: Option B (Client-Side)

**For MVP/Quick Start, we'll use Option B. Migrate to Option A later.**

### Step 1: Install Package

```bash
cd foodie-simple
npm install @sendgrid/mail
```

### Step 2: Create Email Service

Create `src/services/emailService.js`:

```javascript
import sgMail from '@sendgrid/mail';

// Set API key from environment variable
sgMail.setApiKey(process.env.REACT_APP_SENDGRID_API_KEY);

export const sendEmail = async (to, subject, html, text) => {
  const msg = {
    to,
    from: {
      email: process.env.REACT_APP_SENDGRID_FROM_EMAIL,
      name: process.env.REACT_APP_SENDGRID_FROM_NAME,
    },
    subject,
    text, // Plain text version
    html, // HTML version
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};
```

### Step 3: Use in Your Code

```javascript
import { sendEmail } from './services/emailService';

// Send welcome email
await sendEmail(
  'user@example.com',
  'Welcome to Kawan Makan!',
  '<h1>Welcome!</h1><p>You're in!</p>',
  'Welcome! You're in!'
);
```

---

## 🔒 Production: Option A (Firebase Functions)

**For production, use Firebase Functions to keep API key secure.**

### Step 1: Create Firebase Function

Create `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(functions.config().sendgrid.key);

exports.sendEmail = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { to, subject, html, text } = data;

  const msg = {
    to,
    from: {
      email: functions.config().sendgrid.from_email,
      name: functions.config().sendgrid.from_name,
    },
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### Step 2: Set Firebase Functions Config

```bash
firebase functions:config:set sendgrid.key="YOUR_API_KEY"
firebase functions:config:set sendgrid.from_email="your_email@example.com"
firebase functions:config:set sendgrid.from_name="Kawan Makan Community"
```

### Step 3: Call from React App

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendEmail = httpsCallable(functions, 'sendEmail');

await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome!</h1>',
  text: 'Welcome!',
});
```

---

## 📝 SendGrid Setup in Dashboard

When SendGrid asks "Integrate using our Web API or SMTP Relay":

1. **Select: "Web API"** ✅
2. **Language: Node.js** ✅
3. **Follow the Node.js integration guide**

SendGrid will show you:
- Installation command: `npm install @sendgrid/mail`
- Code examples for Node.js
- API key usage

---

## ✅ Implementation Plan

### Phase 3.1 (Email Service) - We'll Use:

**For MVP (Quick Start):**
- ✅ Option B: Client-side with `@sendgrid/mail`
- ✅ Install package: `npm install @sendgrid/mail`
- ✅ Create `src/services/emailService.js`
- ✅ Use environment variables for API key

**For Production (Later):**
- 🔄 Option A: Migrate to Firebase Functions
- 🔄 Move API key to Firebase Functions config
- 🔄 Update email service to call Firebase Function

---

## 🧪 Testing

After setup, test email sending:

```javascript
import { sendEmail } from './services/emailService';

// Test email
const result = await sendEmail(
  'your-email@example.com',
  'Test Email',
  '<h1>Test</h1><p>This is a test email.</p>',
  'Test: This is a test email.'
);

console.log('Result:', result);
```

---

## 📚 SendGrid Documentation

- **Node.js SDK:** https://github.com/sendgrid/sendgrid-nodejs
- **Web API Docs:** https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api
- **Email Templates:** https://docs.sendgrid.com/ui/sending-email/how-to-send-email-with-dynamic-templates

---

## ⚠️ Important Notes

1. **API Key Security:**
   - Never commit API key to git
   - Use environment variables
   - Migrate to Firebase Functions for production

2. **Rate Limits:**
   - Free tier: 100 emails/day
   - Monitor usage in SendGrid dashboard

3. **Email Verification:**
   - Single sender email must be verified before sending
   - Check SendGrid dashboard for verification status

4. **Spam Compliance:**
   - Include physical address in email footer (CAN-SPAM)
   - Include unsubscribe link for promotional emails
   - Use verified sender email

---

## 🎯 Next Steps

1. ✅ Choose "Web API" in SendGrid dashboard
2. ✅ Select "Node.js" as language
3. ✅ Install `@sendgrid/mail` package
4. ✅ Create email service (Phase 3.1)
5. ✅ Test email sending
6. 🔄 Migrate to Firebase Functions (before production)

---

**Last Updated:** 17 November 2025

