# Beta Phase Environment Variables Setup

**Date:** 17 November 2025  
**Status:** Configuration Guide  
**Phase:** 0.3 - Foundation Setup

---

## Overview

This document outlines the environment variables needed for the beta phase implementation. These variables should be added to your `.env` file in the `foodie-simple/` directory.

---

## Required Environment Variables

### SendGrid Email Service

**Purpose:** Send transactional emails (welcome, survey, community updates, etc.)

```bash
# SendGrid API Configuration
REACT_APP_SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
REACT_APP_SENDGRID_FROM_EMAIL=your_verified_email@example.com
REACT_APP_SENDGRID_FROM_NAME=Kawan Makan Community
```

**Setup Instructions:**

**Step 1: Skip Domain Verification (For Now)**
1. When SendGrid asks for domain verification, click **"Skip"** or **"Skip to Dashboard"**
2. You can verify your domain later when you have a custom domain
3. For now, SendGrid will use their default sender email

**Step 2: Create API Key**
1. Go to **Settings → API Keys** (in SendGrid dashboard)
2. Click **"Create API Key"**
3. Name it: `Kawan Makan Beta Phase`
4. Select permissions: **"Full Access"** (or just **"Mail Send"** for security)
5. Click **"Create & View"**
6. **IMPORTANT:** Copy the API key immediately (you won't see it again!)
7. Add to `.env` file

**Step 3: Verify Single Sender Email (Required)**
1. Go to **Settings → Sender Authentication**
2. Click **"Verify a Single Sender"** (instead of domain)
3. Fill in the form:
   - **From Email:** Use your personal email (e.g., `nurj.media@gmail.com`) or create a new one
   - **From Name:** `Kawan Makan Community`
   - **Reply To:** Same as From Email
   - **Company Address:** Your address
4. Click **"Create"**
5. **Check your email** and click the verification link
6. Once verified, use this email as `REACT_APP_SENDGRID_FROM_EMAIL`

**Alternative: Use SendGrid Default Sender (Quick Start)**
- SendGrid provides a default sender: `noreply@sendgrid.net` (or similar)
- You can use this temporarily, but emails may go to spam
- **Better:** Verify a single sender email (Step 3 above)

**Step 4: Add to .env**
```bash
REACT_APP_SENDGRID_API_KEY=SG.your_actual_api_key_here
REACT_APP_SENDGRID_FROM_EMAIL=your_verified_email@example.com
REACT_APP_SENDGRID_FROM_NAME=Kawan Makan Community
```

**Free Tier:** 100 emails/day (sufficient for initial beta)

**Note:** For production, you may want to use Firebase Functions to send emails server-side instead of client-side. This keeps the API key secure.

---

### Landing Page URL

**Purpose:** Redirect users to landing page if they don't have beta access

```bash
# Landing Page Configuration
REACT_APP_LANDING_PAGE_URL=https://foodie-map-23842.web.app
# Or custom domain (when configured):
# REACT_APP_LANDING_PAGE_URL=https://kawanmakan.com
```

**Setup Instructions:**
1. Initially use Firebase hosting URL: `https://foodie-map-23842.web.app`
2. Can update to custom domain later when configured

---

### Beta Phase Configuration

**Purpose:** Control beta phase behavior

```bash
# Beta Phase Settings
REACT_APP_BETA_ENABLED=true
REACT_APP_BETA_MIN_WAITLIST_SIZE=500
REACT_APP_BETA_TARGET_USERS=300
REACT_APP_BETA_WAVE_SIZE_MIN=50
REACT_APP_BETA_WAVE_SIZE_MAX=100
```

**Default Values:**
- `REACT_APP_BETA_ENABLED`: `true` (enable beta phase features)
- `REACT_APP_BETA_MIN_WAITLIST_SIZE`: `500` (minimum waitlist size before beta launch)
- `REACT_APP_BETA_TARGET_USERS`: `300` (target number of beta users)
- `REACT_APP_BETA_WAVE_SIZE_MIN`: `50` (minimum users per wave)
- `REACT_APP_BETA_WAVE_SIZE_MAX`: `100` (maximum users per wave)

---

## Complete .env Template (Beta Phase Additions)

Add these to your existing `.env` file:

```bash
# ============================================
# BETA PHASE CONFIGURATION
# ============================================

# SendGrid Email Service
# Get API key from: Settings → API Keys in SendGrid dashboard
REACT_APP_SENDGRID_API_KEY=SG.your_actual_api_key_here
# Use verified single sender email (Settings → Sender Authentication)
# Or use SendGrid default: noreply@sendgrid.net (temporary, may go to spam)
REACT_APP_SENDGRID_FROM_EMAIL=your_verified_email@example.com
REACT_APP_SENDGRID_FROM_NAME=Kawan Makan Community

# Landing Page URL
REACT_APP_LANDING_PAGE_URL=https://foodie-map-23842.web.app

# Beta Phase Settings
REACT_APP_BETA_ENABLED=true
REACT_APP_BETA_MIN_WAITLIST_SIZE=500
REACT_APP_BETA_TARGET_USERS=300
REACT_APP_BETA_WAVE_SIZE_MIN=50
REACT_APP_BETA_WAVE_SIZE_MAX=100
```

---

## Security Notes

### SendGrid API Key Security

**⚠️ IMPORTANT:** The SendGrid API key should NOT be exposed in client-side code.

**Recommended Approach:**
1. **Option A (Recommended):** Use Firebase Functions (server-side)
   - Create Firebase Cloud Function for sending emails
   - Store SendGrid API key in Firebase Functions environment
   - Call function from client-side code
   - Keeps API key secure

2. **Option B (Quick Start):** Client-side with restrictions
   - Use SendGrid client-side library
   - Restrict API key to specific domains/IPs in SendGrid dashboard
   - **Note:** This is less secure but faster to implement

**For MVP/Quick Start:** Option B is acceptable, but migrate to Option A before production.

---

## Setup Checklist

- [x] Create SendGrid account ✅
- [ ] Skip domain verification (click "Skip to Dashboard")
- [ ] Verify single sender email (Settings → Sender Authentication)
- [ ] Generate SendGrid API key (Settings → API Keys)
- [ ] Copy API key and add to `.env`
- [ ] Add verified sender email to `.env`
- [ ] Add landing page URL to `.env`
- [ ] Add beta phase settings to `.env`
- [ ] Verify `.env` is in `.gitignore`
- [ ] Test SendGrid connection (will be done in Phase 3.1)

---

## Testing

After adding these variables:

1. **Restart development server** (if running)
2. **Verify variables are loaded:**
   ```javascript
   console.log('SendGrid Key:', process.env.REACT_APP_SENDGRID_API_KEY ? 'Set' : 'Missing');
   console.log('Landing Page:', process.env.REACT_APP_LANDING_PAGE_URL);
   ```

3. **Test SendGrid (Phase 3.1):**
   - Will be tested when implementing email service

---

## Next Steps

After completing Phase 0.3:
- ✅ Firestore rules added (Phase 0.1)
- ✅ Storage rules added (Phase 0.2)
- ✅ Environment variables documented (Phase 0.3)

**Ready for Phase 1:** Core Systems (K-Coins, Waitlist, Referrals)

---

**Last Updated:** 17 November 2025

