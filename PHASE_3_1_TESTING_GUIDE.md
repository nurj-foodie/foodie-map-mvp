# Phase 3.1: Email Service Testing Guide

**Date:** 19 November 2025  
**Component:** Email Service & Test Panel

---

## 🧪 Testing Overview

This guide covers how to test the Phase 3.1 Email Service implementation using the `EmailTestPanel` component.

---

## 📋 Prerequisites

### 1. SendGrid Configuration

Before testing, ensure SendGrid is configured:

1. **SendGrid Account:** Create account at https://sendgrid.com
2. **Verify Sender Email:**
   - Go to Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Fill form and verify email
3. **Create API Key:**
   - Go to Settings → API Keys
   - Create new key with "Mail Send" permissions
   - Copy API key (starts with `SG.`)

### 2. Environment Variables

Add to `.env` file in `foodie-simple/` directory:

```bash
REACT_APP_SENDGRID_API_KEY=SG.your_actual_api_key_here
REACT_APP_SENDGRID_FROM_EMAIL=your_verified_email@example.com
REACT_APP_SENDGRID_FROM_NAME=Kawan Makan Community
REACT_APP_LANDING_PAGE_URL=https://waitlist-foodie-map-23842.web.app
REACT_APP_APP_URL=https://foodie-map-23842.web.app
```

### 3. Restart Development Server

After adding environment variables:

```bash
npm start
```

---

## 🎯 Accessing Email Test Panel

1. **Start the app:** `npm start`
2. **Login** to your account
3. **Go to User Dashboard** (User Tab)
4. **Click "🧪 Beta Test" tab**
5. **Scroll down** to see "📧 Email Service Test Panel"

---

## 📧 Testing Individual Emails

### Test Welcome Email (T+0)

1. Enter your email address
2. Enter your name
3. Optionally enter a referral code (e.g., `KM-TEST01`)
4. Click **"📧 Welcome (T+0)"** button
5. Check your email inbox

**Expected Result:**
- ✅ Success message with message ID
- ✅ Email received in inbox
- ✅ Email contains referral code and K-Coins info

### Test Survey Email (T+2)

1. Enter email and name
2. Click **"📋 Survey (T+2)"** button
3. Check your email inbox

**Expected Result:**
- ✅ Success message
- ✅ Email received with survey link
- ✅ Email mentions +50 K-Coins reward

### Test Community Email (T+5)

1. Enter email and name
2. Click **"👥 Community (T+5)"** button
3. Check your email inbox

**Expected Result:**
- ✅ Success message
- ✅ Email received with community information
- ✅ Bilingual community name displayed

### Test Referral Reminder Email (T+8)

1. Enter email and name
2. Enter referral code (optional)
3. Enter waitlist ID (or click "Find" to auto-find)
4. Click **"🔗 Referral Reminder (T+8)"** button
5. Check your email inbox

**Expected Result:**
- ✅ Success message
- ✅ Email received with referral stats
- ✅ Position and total waitlist count displayed

### Test Invite Email (Rolling)

1. Enter email and name
2. Click **"🎉 Invite (Rolling)"** button
3. Check your email inbox

**Expected Result:**
- ✅ Success message
- ✅ Email received with beta access welcome
- ✅ Getting started guide included

### Test Feedback Email (T+7)

1. Enter email and name
2. Click **"⭐ Feedback (T+7)"** button
3. Check your email inbox

**Expected Result:**
- ✅ Success message
- ✅ Email received with feedback request
- ✅ Rating questions included

---

## 📊 Testing Email Status & Tracking

### Check Email Status

1. Enter waitlist ID (or find it using "Find" button)
2. Click **"📊 Email Status"** button
3. View results

**Expected Result:**
- ✅ List of all emails sent to this waitlist ID
- ✅ Email types, sent dates, open/click status

### Check Engagement Stats

1. Enter waitlist ID
2. Click **"📈 Engagement Stats"** button
3. View results

**Expected Result:**
- ✅ Total sent, opened, clicked counts
- ✅ Open rate and click rate percentages

---

## 🔍 Finding Waitlist ID

### Method 1: Auto-Find by Email

1. Enter email address
2. Click **"Find"** button next to Waitlist ID field
3. Waitlist ID will be auto-filled

### Method 2: Manual Entry

1. Get waitlist ID from Firestore console
2. Or from previous test results
3. Enter manually in Waitlist ID field

---

## ✅ Test Checklist

### Basic Functionality
- [ ] Welcome email sends successfully
- [ ] Survey email sends successfully
- [ ] Community email sends successfully
- [ ] Referral reminder email sends successfully
- [ ] Invite email sends successfully
- [ ] Feedback email sends successfully

### Email Content
- [ ] All emails render correctly in inbox
- [ ] HTML version displays properly
- [ ] Plain text version is readable
- [ ] Links work correctly
- [ ] Referral codes display correctly
- [ ] Bilingual community name appears

### Tracking
- [ ] Email sends tracked in Firestore (`email_drips` collection)
- [ ] Message IDs stored correctly
- [ ] Email status check works
- [ ] Engagement stats calculate correctly

### Error Handling
- [ ] Error message shows if API key missing
- [ ] Error message shows if email invalid
- [ ] Error message shows if required fields missing
- [ ] Non-blocking (doesn't crash app)

### Integration
- [ ] Welcome email sent automatically on waitlist signup
- [ ] Email service integrated with waitlist service
- [ ] No console errors

---

## 🐛 Troubleshooting

### Email Not Sending

**Problem:** Click send button but no email received

**Solutions:**
1. Check SendGrid API key in `.env` file
2. Verify sender email is verified in SendGrid
3. Check SendGrid dashboard for errors
4. Check browser console for error messages
5. Verify email address is correct
6. Check spam folder

### API Key Error

**Problem:** "SendGrid API key not configured" warning

**Solutions:**
1. Add `REACT_APP_SENDGRID_API_KEY` to `.env` file
2. Restart development server
3. Verify API key starts with `SG.`
4. Check API key permissions in SendGrid dashboard

### Email Not Tracked

**Problem:** Email sent but not in `email_drips` collection

**Solutions:**
1. Check waitlist ID is provided
2. Check Firestore rules allow write access
3. Check browser console for errors
4. Verify `email_drips` collection exists

### Waitlist ID Not Found

**Problem:** "Email not found in waitlist" error

**Solutions:**
1. Verify email is in waitlist (check Firestore)
2. Try joining waitlist first
3. Check email spelling/case
4. Use exact email from waitlist entry

---

## 📝 Console Logging

The email service logs detailed information to the browser console:

- ✅ **Success:** `✅ Email sent (emailType): email@example.com`
- ❌ **Error:** `❌ Error sending email (emailType): error message`
- 📊 **Tracking:** `✅ Email opened: emailDripId`
- 📊 **Tracking:** `✅ Email clicked: emailDripId`

Check browser console (F12) for detailed logs.

---

## 🔒 Security Notes

### Current Implementation
- ⚠️ API key is exposed in client-side code
- ✅ OK for testing/MVP
- ⚠️ Must migrate to Firebase Functions for production

### Production Migration
Before production:
1. Create Firebase Function for email sending
2. Move API key to Firebase Functions config
3. Call function from client-side code
4. Keep API key secure on server

---

## 📚 Related Documentation

- `PHASE_3_1_COMPLETION_SUMMARY.md` - Implementation details
- `SENDGRID_INTEGRATION_GUIDE.md` - SendGrid setup guide
- `BETA_PHASE_ENV_SETUP.md` - Environment variables guide

---

## ✅ Testing Complete

Once all tests pass:
- ✅ All 6 email types send successfully
- ✅ Email tracking works correctly
- ✅ Status and stats display correctly
- ✅ Ready for Phase 3.2 (Survey System)

---

**Last Updated:** 19 November 2025

