# 🔧 Fix for kawanmakan.app Domain Issues

**Date:** 11 December 2025  
**Issue:** App broken on https://kawanmakan.app  
**Root Cause:** Google Maps API key HTTP referrer restrictions missing new domain

---

## ✅ What I Checked

### 1. Firebase Security Rules ✅
- **Firestore Rules:** No domain restrictions (auth-based only)
- **Storage Rules:** No domain restrictions (auth-based only)
- **Status:** ✅ No changes needed

### 2. Firebase Hosting ✅
- **firebase.json:** No domain restrictions
- **Status:** ✅ No changes needed

### 3. Google Maps API Key ⚠️ **NEEDS UPDATE**
- **Issue:** API key likely has HTTP referrer restrictions
- **Status:** ⚠️ **MUST ADD kawanmakan.app to allowed referrers**

---

## 🔧 Required Fixes

### **CRITICAL: Update Google Maps API Key Restrictions**

Your Google Maps API key needs to allow requests from the new domain.

#### Steps to Fix:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select project: `foodie-map-23842`
   - Navigate to: **APIs & Services** → **Credentials**

2. **Find Your Google Maps API Key**
   - Look for the key used in your app (check `.env` file or `public/index.html`)
   - Click on the API key to edit

3. **Update HTTP Referrer Restrictions**
   - Under **"Application restrictions"**, select **"HTTP referrers (web sites)"**
   - Add these referrers:
     ```
     http://localhost:3000/*
     https://localhost:3000/*
     http://127.0.0.1:3000/*
     https://127.0.0.1:3000/*
     https://kawanmakan.app/*
     https://*.kawanmakan.app/*
     https://foodie-map-23842.web.app/*
     https://waitlist-foodie-map-23842.web.app/*
     ```
   - **Important:** Include both `kawanmakan.app` and `*.kawanmakan.app` (for subdomains)

4. **Save Changes**
   - Click **Save**
   - Wait 1-2 minutes for changes to propagate

5. **Test**
   - Visit: https://kawanmakan.app
   - Open browser console (F12)
   - Check for: "✅ Google Maps fully loaded"
   - If you see errors, wait another minute and refresh

---

## 📋 Complete Checklist

### ✅ Firebase Configuration
- [x] Firestore rules checked (no domain restrictions)
- [x] Storage rules checked (no domain restrictions)
- [x] Firebase hosting config checked (no domain restrictions)

### ⚠️ Google Maps API Key (REQUIRED ACTION)
- [ ] Go to Google Cloud Console
- [ ] Find Google Maps API key
- [ ] Add `https://kawanmakan.app/*` to HTTP referrer restrictions
- [ ] Add `https://*.kawanmakan.app/*` to HTTP referrer restrictions
- [ ] Save changes
- [ ] Wait 1-2 minutes
- [ ] Test at https://kawanmakan.app

### 🔍 Additional Checks (If Still Not Working)

#### Check Firebase Hosting Custom Domain Setup
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: `foodie-map-23842`
3. Go to **Hosting**
4. Verify custom domain `kawanmakan.app` is added and verified
5. Check SSL certificate status (should be "Active")

#### Check Environment Variables
If you have any hardcoded URLs in environment variables, update them:

```bash
# In foodie-simple/.env (if exists)
REACT_APP_MAIN_APP_URL=https://kawanmakan.app
REACT_APP_LANDING_PAGE_URL=https://waitlist.kawanmakan.app  # or your waitlist domain
```

#### Check Browser Console Errors
1. Visit https://kawanmakan.app
2. Open Developer Console (F12)
3. Look for specific errors:
   - `RefererNotAllowedMapError` → API key restriction issue
   - `InvalidKeyError` → API key not found/incorrect
   - `Maps API error` → Check API key restrictions
   - CORS errors → Check Firebase config

---

## 🚨 Common Error Messages & Solutions

### Error: "RefererNotAllowedMapError"
**Cause:** API key doesn't allow requests from kawanmakan.app  
**Fix:** Add `https://kawanmakan.app/*` to API key HTTP referrer restrictions

### Error: "InvalidKeyError"
**Cause:** API key not found or incorrect  
**Fix:** 
1. Check `.env` file has correct `REACT_APP_GOOGLE_MAPS_API_KEY`
2. Verify API key in Google Cloud Console
3. Rebuild app: `npm run build`

### Error: "Maps API error"
**Cause:** API not enabled or quota exceeded  
**Fix:**
1. Check Google Cloud Console → APIs & Services → Enabled APIs
2. Verify these are enabled:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API
3. Check quota limits

### Error: CORS or Firebase Auth errors
**Cause:** Firebase auth domain not configured for custom domain  
**Fix:**
1. Go to Firebase Console → Authentication → Settings
2. Add `kawanmakan.app` to authorized domains
3. Wait a few minutes for changes to propagate

---

## 📝 Quick Reference: API Key Restrictions Format

When adding HTTP referrer restrictions, use this exact format:

```
http://localhost:3000/*
https://localhost:3000/*
http://127.0.0.1:3000/*
https://127.0.0.1:3000/*
https://kawanmakan.app/*
https://*.kawanmakan.app/*
https://foodie-map-23842.web.app/*
https://waitlist-foodie-map-23842.web.app/*
```

**Notes:**
- Use `/*` at the end to allow all paths
- Use `*.kawanmakan.app` to allow subdomains
- No trailing slashes before `/*`
- Each referrer on a new line

---

## ✅ After Fixing

1. **Test the app:**
   - Visit: https://kawanmakan.app
   - Check browser console for errors
   - Test map loading
   - Test route finding
   - Test restaurant search

2. **Verify Firebase:**
   - Test authentication (login/logout)
   - Test Firestore reads/writes
   - Test Storage uploads (if applicable)

3. **Monitor:**
   - Check Google Cloud Console → APIs & Services → Dashboard
   - Monitor API usage
   - Check for any quota warnings

---

## 🆘 Still Not Working?

If the app still doesn't work after updating API key restrictions:

1. **Clear browser cache** and hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. **Check Firebase Hosting logs** in Firebase Console
3. **Verify custom domain DNS** settings:
   - A record pointing to Firebase hosting IPs
   - CNAME record (if using subdomain)
4. **Check SSL certificate** status in Firebase Hosting
5. **Test in incognito/private window** to rule out cache issues

---

**Last Updated:** 11 December 2025  
**Status:** Ready for implementation
