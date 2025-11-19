# Quick Guide: Deploy Email Function

**Issue:** Function returns 404 because it's not deployed yet.

---

## 🚀 Quick Deploy (Choose One Method)

### Method 1: Using Secrets (Recommended - Modern)

```bash
cd "/Users/izura/Documents/foodie mvp/foodie-simple"

# Set SendGrid API key as secret
firebase functions:secrets:set SENDGRID_API_KEY
# (Enter your API key when prompted - get it from .env file)

# Set other configs (optional, can use defaults)
firebase functions:secrets:set SENDGRID_FROM_EMAIL
firebase functions:secrets:set SENDGRID_FROM_NAME

# Deploy function
firebase deploy --only functions:sendEmail
```

### Method 2: Using Config (Works until March 2026)

```bash
cd "/Users/izura/Documents/foodie mvp/foodie-simple"

# Get your SendGrid API key from .env file first!
# Then set config:
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY_HERE"
firebase functions:config:set sendgrid.from_email="your_verified_email@example.com"
firebase functions:config:set sendgrid.from_name="Kawan Makan Community"

# Deploy function
firebase deploy --only functions:sendEmail
```

---

## 📝 How to Get Your SendGrid API Key

1. Open `.env` file in `foodie-simple/` directory
2. Find line: `REACT_APP_SENDGRID_API_KEY=SG.xxxxx`
3. Copy the value after `=` (the `SG.xxxxx` part)
4. Use it in the commands above

---

## ✅ After Deployment

1. Wait for deployment to complete (usually 1-2 minutes)
2. Refresh your browser
3. Test email sending again
4. Function should work now!

---

## 🔍 Verify Deployment

```bash
firebase functions:list
```

You should see `sendEmail` in the list.

---

**Last Updated:** 19 November 2025

