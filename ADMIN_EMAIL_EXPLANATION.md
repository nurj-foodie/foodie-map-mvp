# 🔐 Admin Email & Firestore Rules Explanation

## The Problem

**Client-side (React App):**
- Checks admin status using environment variables: `REACT_APP_ADMIN_EMAIL_1`, etc.
- This works for showing/hiding admin UI ✅

**Server-side (Firestore Rules):**
- Cannot access environment variables ❌
- Can only check:
  - `request.auth.token.email` (user's email from Firebase Auth)
  - `request.auth.token.admin` (custom claim - not set)

## Why There's a Conflict

1. Your app knows you're admin (via env vars) ✅
2. But Firestore rules don't know you're admin (can't access env vars) ❌
3. So permission errors occur when trying to read/write admin collections

## Solutions

### Option 1: Check Email in Firestore Rules (Recommended)
Update Firestore rules to check your actual email address:

```javascript
function isAdmin() {
  return request.auth != null && (
    request.auth.token.email == 'your-actual-email@example.com'
  );
}
```

### Option 2: Set Custom Claims (Better, but requires backend)
Use Firebase Admin SDK to set `admin: true` custom claim on your user's auth token.

### Option 3: Allow All Authenticated Users (Current - Works for development)
Allow any authenticated user to access admin collections. Less secure but works.

## What We Need

**Please provide your Firebase account email address** so we can update the Firestore rules to check for it specifically.

This way:
- ✅ You'll have admin access in Firestore rules
- ✅ No permission errors
- ✅ More secure than allowing all authenticated users

---

**Current Status:** Using Option 3 (all authenticated users can access) - works but less secure.

