# Firebase Storage Setup Guide

**Date:** 17 November 2025  
**Project:** Kawan Makan (Malaysian Food App)

---

## 🌏 Storage Location Options

When setting up Firebase Storage, you'll see these options:

1. **US** - United States (multi-region)
2. **ASIA1** - Asia East 1 (single region - Taiwan)
3. **ASIA** - Asia (multi-region)

---

## ✅ Recommended Choice: **ASIA** (Multi-Region)

**Choose: ASIA**

### Why ASIA?

1. **Geographic Proximity:**
   - Malaysia is in Southeast Asia
   - ASIA multi-region includes servers across Asia
   - Better latency for Malaysian users

2. **Redundancy:**
   - Multi-region provides automatic redundancy
   - Data replicated across multiple regions
   - Better reliability

3. **Future Expansion:**
   - If you expand to other Asian countries (Singapore, Thailand, Indonesia)
   - ASIA multi-region serves all of them well

4. **Performance:**
   - Good performance for Malaysian users
   - Lower latency than US region

---

## 📊 Comparison

| Option | Region Type | Best For | Latency (Malaysia) |
|--------|-------------|----------|-------------------|
| **US** | Multi-region | US-based apps | Higher (farther) |
| **ASIA1** | Single region | Taiwan-specific | Medium |
| **ASIA** ✅ | Multi-region | **Asian apps** | **Lowest** ✅ |

---

## 🎯 Step-by-Step Setup

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/foodie-map-23842/storage

2. **Click "Get Started"**

3. **Select Location:**
   - Choose: **ASIA** ✅
   - (Not US, not ASIA1)

4. **Security Rules:**
   - Choose: **"Start in test mode"** (for now)
   - We'll secure it with our storage rules after setup

5. **Click "Done"**

---

## ⚠️ Important Notes

### After Setup:

1. **Deploy Storage Rules:**
   ```bash
   firebase deploy --only storage:rules
   ```

2. **Storage Rules Already Created:**
   - We already created `storage.rules` in Phase 0
   - Rules include `beta-reports/{userId}/` folder
   - Rules will be deployed after Storage is enabled

### Cost Considerations:

- **ASIA multi-region:** Slightly higher cost than single region
- **But:** Better performance and redundancy
- **Worth it:** For Malaysian users and future expansion

---

## 🔄 Alternative: Single Region (If ASIA Not Available)

If you only see single-region options:

**Choose:** `asia-southeast1` (Southeast Asia - Singapore)
- Closest to Malaysia
- Good performance
- Lower cost than multi-region

---

## ✅ After Setup Checklist

- [ ] Firebase Storage enabled
- [ ] Location set to **ASIA** (multi-region)
- [ ] Storage bucket created
- [ ] Deploy storage rules: `firebase deploy --only storage:rules`
- [ ] Verify rules are active in Firebase Console

---

## 📝 Summary

**Your Choice:** **ASIA** (Multi-Region)

**Why:**
- ✅ Best performance for Malaysian users
- ✅ Automatic redundancy
- ✅ Future-proof for Asian expansion
- ✅ Good balance of cost and performance

---

**Last Updated:** 17 November 2025

