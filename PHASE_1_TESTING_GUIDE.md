# 🧪 Phase 1 Testing Guide

**Date:** 18 November 2025  
**Phase:** Phase 1 - Core Systems  
**Status:** Ready for Testing

---

## 📋 Testing Overview

Phase 1 includes:
1. **K-Coins System** - Reward currency management
2. **Waitlist System** - User signup and beta access
3. **Referral System** - Referral tracking and rewards
4. **Beta Access** - Access control utilities

---

## ✅ What Can Be Tested with Existing Users

### 1. K-Coins System ✅
- **Can test with existing logged-in users**
- Use the **Beta Test** tab in User Dashboard
- Click "Award 25 K-Coins (Test)" to manually award K-Coins
- Check balance and transaction history
- View K-Coins display in Overview tab

### 2. Beta Access Checking ✅
- **Can test with existing users**
- Check if user has beta access (will show "Not granted" for existing users)
- Test granting beta access using test panel

---

## 🆕 What Requires New Emails

### 1. Waitlist Signup
- **Requires emails NOT already in waitlist**
- Can use existing emails if they haven't joined waitlist yet
- Test joining waitlist with/without referral code

### 2. Referral System
- **Requires multiple emails** to test full flow:
  - Email 1: Join waitlist (gets referral code)
  - Email 2: Join waitlist using Email 1's referral code
  - Verify both users get K-Coins rewards

---

## 🧪 Testing Steps

### Step 1: Access Test Panel

1. **Start the app** (frontend and backend)
2. **Log in** with an existing user account
3. **Navigate to User Tab** (bottom navigation)
4. **Click "🧪 Beta Test" tab**

### Step 2: Test K-Coins System

1. **Check Current Status:**
   - View your current K-Coins balance (should be 0 initially)
   - Check beta access status

2. **Award Test K-Coins:**
   - Click "Award 25 K-Coins (Test)" button
   - Should see success message
   - Balance should update to 25
   - Check transaction history

3. **View in Overview Tab:**
   - Go to Overview tab
   - Should see K-Coins display card
   - Click "View History" to see transactions

### Step 3: Test Waitlist System

**Option A: Test with New Email (Recommended)**
1. Use a test email (e.g., `test1@example.com`)
2. Enter email and name in test panel
3. Click "Join Waitlist"
4. Should receive referral code (e.g., `KM-XXXXXX`)
5. Note the referral code for referral testing

**Option B: Test with Existing Email**
- Only works if email is NOT already in waitlist
- If already in waitlist, will show error: "Email already registered"

### Step 4: Test Referral System

1. **Get Referral Code:**
   - Join waitlist with Email 1 (get referral code)
   - Copy the referral code

2. **Join with Referral:**
   - Use Email 2 in test panel
   - Enter Email 1's referral code
   - Join waitlist
   - Both users should get K-Coins:
     - Email 1: +100 K-Coins (referrer)
     - Email 2: +25 K-Coins (new user)

3. **Validate Referral Code:**
   - Enter referral code in "Validate Code" field
   - Should show referrer name and email

### Step 5: Test Beta Access

1. **Grant Beta Access:**
   - Enter email in test panel
   - Click "Grant Beta Access"
   - Should see success message

2. **Check Beta Access:**
   - Log in with that email
   - Check "Beta Access" status (should show "✅ Granted")
   - User should now have access to app

---

## 📊 Expected Results

### K-Coins System
- ✅ Balance displays correctly
- ✅ Transaction history shows all awards
- ✅ K-Coins display appears in Overview tab
- ✅ Transaction types show correct icons

### Waitlist System
- ✅ Can join waitlist with new email
- ✅ Referral code generated (format: `KM-XXXXXX`)
- ✅ Signup order tracked correctly
- ✅ Cannot join twice with same email

### Referral System
- ✅ Referral code validation works
- ✅ Referrer gets +100 K-Coins
- ✅ New user gets +25 K-Coins
- ✅ Referral stats display correctly

### Beta Access
- ✅ Can check access status
- ✅ Can grant access to users
- ✅ Access status updates in AuthContext

---

## 🐛 Common Issues & Solutions

### Issue: "Email already registered"
- **Solution:** Use a different email or check if email is already in waitlist

### Issue: K-Coins balance shows 0
- **Solution:** Award test K-Coins using test panel, or join waitlist to get initial 25 K-Coins

### Issue: Beta access shows "Not granted"
- **Solution:** This is expected for existing users. Grant access using test panel.

### Issue: Referral code not found
- **Solution:** Make sure referral code is in uppercase (e.g., `KM-XXXXXX`)

---

## 📝 Testing Checklist

- [ ] K-Coins balance displays in Overview tab
- [ ] Can award test K-Coins manually
- [ ] Transaction history shows correctly
- [ ] Can join waitlist with new email
- [ ] Referral code generated correctly
- [ ] Can join waitlist with referral code
- [ ] Referrer gets +100 K-Coins
- [ ] New user gets +25 K-Coins
- [ ] Can validate referral code
- [ ] Can grant beta access
- [ ] Beta access status updates correctly
- [ ] Test panel messages display correctly

---

## 🎯 Next Steps After Testing

Once Phase 1 is tested and working:
1. **Phase 2:** Landing Page (separate React app)
2. **Phase 3:** Email Drip System (SendGrid integration)
3. **Phase 4:** Survey System
4. **Phase 5:** Admin Tools (wave management)

---

## 💡 Tips

- Use **incognito/private browsing** to test with multiple emails
- Keep a **test email list** for referral testing
- Check **Firestore console** to verify data is saved correctly
- Check **browser console** for any errors or warnings

---

**Happy Testing! 🚀**

