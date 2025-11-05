# 🔒 SECURITY PREVENTION GUIDE - Never Commit Secrets Again!

**Date:** 5 November 2025  
**Purpose:** Prevent committing API keys, passwords, emails, and other secrets to Git

---

## 🚨 CRITICAL RULES

### ❌ NEVER COMMIT:
1. **API Keys** - Google Maps, Firebase, etc.
2. **Passwords** - Admin passwords, founder passwords
3. **Emails** - Admin emails, founder emails
4. **Private Keys** - Firebase private keys, SSL certificates
5. **Tokens** - Access tokens, refresh tokens
6. **`.env` files** - Any `.env` file (except `.env.example`)

### ✅ ALWAYS USE:
1. **Environment Variables** - `process.env.REACT_APP_*`
2. **Placeholders** - `YOUR_API_KEY_HERE`, `YOUR_EMAIL_HERE`
3. **`.env` files** - Store secrets in `.env` (not committed)
4. **`.env.example`** - Template file with placeholders (can be committed)

---

## 🛡️ AUTOMATED PREVENTION SYSTEM

### 1. Pre-Commit Hook (Automatic)

**Location:** `.git/hooks/pre-commit`

This hook runs **automatically** before every `git commit` and blocks commits if secrets are detected.

**Status:** ✅ Installed and Active

**How it works:**
- Checks all staged files for hardcoded secrets
- Blocks commit if secrets are found
- Shows clear error messages

**To bypass (NOT RECOMMENDED):**
```bash
git commit --no-verify
```
⚠️ **Only use in emergencies!** Always fix the issues first.

---

### 2. Manual Security Check Scripts

**Location:** `scripts/pre-commit-security-check.sh` (Bash)  
**Location:** `scripts/pre-commit-security-check.js` (Node.js)

**Run manually before committing:**
```bash
# Bash version
./scripts/pre-commit-security-check.sh

# Node.js version
node scripts/pre-commit-security-check.js
```

**What it checks:**
- ✅ Hardcoded API keys (Google Maps, Firebase, etc.)
- ✅ Hardcoded passwords
- ✅ Hardcoded admin/founder emails
- ✅ `.env` files in staging

---

## 📋 PRE-COMMIT CHECKLIST

Before every commit, run this checklist:

### 1. Check for Hardcoded Secrets
```bash
# Run security check
./scripts/pre-commit-security-check.sh

# Or manually check
git diff --cached | grep -i "AIza\|password\|@gmail\|@outlook"
```

### 2. Check for .env Files
```bash
# Should show nothing
git status --short | grep ".env"

# Should show .env (meaning it's ignored)
git check-ignore .env
```

### 3. Review Staged Files
```bash
# List all staged files
git diff --cached --name-only

# Review each file for secrets
git diff --cached
```

---

## 🔧 HOW TO FIX COMMON ISSUES

### Issue 1: Hardcoded API Key

**❌ BAD:**
```javascript
const API_KEY = 'AIzaSyAPa5fnA9SvBe4rTy17WVOptcn0dsLiEWE';
```

**✅ GOOD:**
```javascript
const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';
```

**Steps:**
1. Remove hardcoded key from code
2. Add to `.env` file: `REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_key`
3. Use `process.env.REACT_APP_GOOGLE_MAPS_API_KEY` in code

---

### Issue 2: Hardcoded Password

**❌ BAD:**
```javascript
const password = 'Pis@ngPanas23';
```

**✅ GOOD:**
```javascript
const password = process.env.REACT_APP_ADMIN_PASSWORD_1;
```

**Steps:**
1. Remove hardcoded password from code
2. Add to `.env` file: `REACT_APP_ADMIN_PASSWORD_1=your_actual_password`
3. Use `process.env.REACT_APP_ADMIN_PASSWORD_1` in code

---

### Issue 3: Hardcoded Email

**❌ BAD:**
```javascript
const email = 'nurj.get@gmail.com';
```

**✅ GOOD:**
```javascript
const email = process.env.REACT_APP_ADMIN_EMAIL_1;
```

**Steps:**
1. Remove hardcoded email from code
2. Add to `.env` file: `REACT_APP_ADMIN_EMAIL_1=your_actual_email`
3. Use `process.env.REACT_APP_ADMIN_EMAIL_1` in code

---

### Issue 4: .env File in Staging

**❌ BAD:**
```bash
git add .env  # DON'T DO THIS!
```

**✅ GOOD:**
```bash
# .env should be in .gitignore
git check-ignore .env  # Should show: .env

# Only commit .env.example
git add .env.example
```

**Steps:**
1. Remove `.env` from staging: `git reset HEAD .env`
2. Verify `.env` is in `.gitignore`
3. Create `.env.example` with placeholders (can be committed)

---

## 📝 ENVIRONMENT VARIABLES TEMPLATE

### Create `.env.example` (Template - Safe to Commit)

```bash
# Google Maps API
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY_HERE
REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN_HERE
REACT_APP_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID_HERE
REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET_HERE
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID_HERE
REACT_APP_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID_HERE

# Admin Configuration
REACT_APP_ADMIN_EMAIL_1=YOUR_ADMIN_EMAIL_1_HERE
REACT_APP_ADMIN_PASSWORD_1=YOUR_ADMIN_PASSWORD_1_HERE
REACT_APP_ADMIN_ROLE_1=YOUR_ADMIN_ROLE_1_HERE
REACT_APP_ADMIN_NAME_1=YOUR_ADMIN_NAME_1_HERE

REACT_APP_ADMIN_EMAIL_2=YOUR_ADMIN_EMAIL_2_HERE
REACT_APP_ADMIN_PASSWORD_2=YOUR_ADMIN_PASSWORD_2_HERE
REACT_APP_ADMIN_ROLE_2=YOUR_ADMIN_ROLE_2_HERE
REACT_APP_ADMIN_NAME_2=YOUR_ADMIN_NAME_2_HERE

REACT_APP_ADMIN_EMAIL_3=YOUR_ADMIN_EMAIL_3_HERE
REACT_APP_ADMIN_PASSWORD_3=YOUR_ADMIN_PASSWORD_3_HERE
REACT_APP_ADMIN_ROLE_3=YOUR_ADMIN_ROLE_3_HERE
REACT_APP_ADMIN_NAME_3=YOUR_ADMIN_NAME_3_HERE
```

### Create `.env` (Actual Values - NOT Committed)

```bash
# Copy .env.example and replace placeholders with actual values
cp .env.example .env
# Edit .env with your actual secrets
```

---

## 🚨 IF YOU ALREADY COMMITTED SECRETS

### Step 1: Revoke and Regenerate

1. **Google Maps API Key:**
   - Go to Google Cloud Console
   - Revoke the exposed key
   - Generate a new API key
   - Update `.env` file

2. **Firebase Credentials:**
   - Go to Firebase Console
   - Revoke old credentials
   - Generate new credentials
   - Update `.env` file

3. **Admin Passwords:**
   - Change all admin passwords
   - Update `.env` file

### Step 2: Remove from Git History

**⚠️ WARNING:** This rewrites Git history. Only do this if you're the only one working on the repo!

```bash
# Remove .env file from Git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (if you must)
git push origin --force --all
```

**⚠️ Better approach:** If secrets are already pushed to GitHub:
1. Revoke and regenerate all secrets
2. Don't try to remove from history (it's already exposed)
3. Focus on preventing future leaks

---

## 📋 QUICK REFERENCE

### Before Every Commit:
```bash
# 1. Run security check
./scripts/pre-commit-security-check.sh

# 2. Verify .env is ignored
git check-ignore .env

# 3. Review staged files
git diff --cached --name-only

# 4. Commit if all checks pass
git commit -m "Your commit message"
```

### If Security Check Fails:
```bash
# 1. Fix the issues (remove hardcoded secrets)
# 2. Replace with environment variables
# 3. Run security check again
./scripts/pre-commit-security-check.sh

# 4. Commit when check passes
git commit -m "Your commit message"
```

---

## 🎯 BEST PRACTICES

### ✅ DO:
- ✅ Always use `process.env.REACT_APP_*` for secrets
- ✅ Store secrets in `.env` file (not committed)
- ✅ Use placeholders in test files (`YOUR_API_KEY_HERE`)
- ✅ Create `.env.example` with placeholders (can be committed)
- ✅ Run security check before committing
- ✅ Review staged files before committing

### ❌ DON'T:
- ❌ Hardcode API keys, passwords, or emails
- ❌ Commit `.env` files
- ❌ Put secrets in documentation files
- ❌ Put secrets in HTML files
- ❌ Use `--no-verify` to bypass security checks
- ❌ Share `.env` files in chat or email

---

## 🔍 MANUAL CHECK COMMANDS

### Check for API Keys:
```bash
git diff --cached | grep -E "AIza[0-9A-Za-z_-]{35}|ya29\.[0-9A-Za-z_-]+|sk-[0-9A-Za-z_-]+"
```

### Check for Passwords:
```bash
git diff --cached | grep -iE "password.*=.*['\"][^'\"]{6,}['\"]"
```

### Check for Emails:
```bash
git diff --cached | grep -iE "@gmail\.com|@outlook\.com|@yahoo\.com"
```

### Check for .env Files:
```bash
git status --short | grep ".env"
```

---

## 📚 ADDITIONAL RESOURCES

### Files Created:
- ✅ `scripts/pre-commit-security-check.sh` - Bash security check script
- ✅ `scripts/pre-commit-security-check.js` - Node.js security check script
- ✅ `.git/hooks/pre-commit` - Automatic pre-commit hook
- ✅ `SECURITY_CHECKLIST.md` - Security checklist
- ✅ `SECURITY_VERIFICATION.md` - Security verification results
- ✅ `SECURITY_PREVENTION_GUIDE.md` - This guide

### Related Documentation:
- `.gitignore` - Ensures `.env` files are ignored
- `README.md` - Setup instructions
- `CHANGELOG.md` - Version history

---

## ✅ CURRENT STATUS

**All hardcoded secrets have been removed and replaced with:**
- ✅ Environment variables (`process.env.REACT_APP_*`)
- ✅ Placeholders (`YOUR_API_KEY_HERE`, `YOUR_EMAIL_HERE`)
- ✅ Mock data (`user1@example.com`, `admin1@example.com`)

**Prevention system is active:**
- ✅ Pre-commit hook installed
- ✅ Security check scripts created
- ✅ `.gitignore` properly configured
- ✅ All files fixed

**You're now protected from accidentally committing secrets!** 🎉

---

## 🆘 NEED HELP?

If you're unsure about something:
1. **Run the security check:** `./scripts/pre-commit-security-check.sh`
2. **Check this guide** for how to fix common issues
3. **Review staged files:** `git diff --cached`
4. **When in doubt, don't commit!** Ask for help first.

---

**Remember: It's better to be safe than sorry!** 🔒

