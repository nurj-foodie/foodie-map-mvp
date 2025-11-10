# 🧪 Auto-Population Testing Guide

**Date:** 8 November 2025  
**Purpose:** Test the new structured schema auto-population

---

## 🔍 How Auto-Population Works

### **Flow:**
1. **User searches** for restaurants (Search tab or Discover tab)
2. **Check Firestore first** - Look for existing restaurants in that area
3. **If no results** - Fallback to Google Places API
4. **Auto-save to Firestore** - Save results using structured schema
5. **Future searches** - Use Firestore data (faster, free)

### **Where Auto-Population Happens:**

#### **1. Search Tab** (`firestoreSearchService.js`)
- When searching in a new area
- Searches Firestore first
- Falls back to Google Places if no results
- Auto-saves new restaurants

#### **2. Discover Tab** (`firestoreSearchService.js`)
- When finding restaurants along routes
- Searches Firestore first
- Falls back to Google Places if no results
- Auto-saves new restaurants

#### **3. R&R Stops & Petrol Stations** (`placeSearchService.js`)
- When finding R&R stops along routes
- When finding petrol stations along routes
- Auto-saves to `rnr_stops` and `petrol_stations` collections

---

## 🧪 How to Test Auto-Population

### **Method 1: Search Tab (Easiest)**

**Steps:**
1. Open the app
2. Go to **Search** tab
3. Search for a location that **doesn't have restaurants in Firestore yet**
   - Try a remote area or new location
   - Example: "Kota Kinabalu", "Kuching", "Langkawi"
4. Watch the browser console for logs:
   ```
   🔍 Firestore-first search started...
   ⚠️ No Firestore results, falling back to Google Places API...
   💾 Auto-populating Firestore with X restaurants...
   💾 Saved new restaurant (structured schema): [Restaurant Name]
   ✅ Auto-population completed!
   ```
5. **Verify in Firestore Console:**
   - Go to Firebase Console → Firestore
   - Check `eateries` collection
   - Find the newly saved restaurant
   - Verify it has:
     - ✅ `placeId` (camelCase)
     - ✅ `analytics` map
     - ✅ `business` map
     - ✅ `contact` map
     - ✅ `socialMedia` map
     - ✅ `metadata` map
     - ✅ `cuisineCategory`, `cuisineType`, `cuisineTags`
     - ✅ `halalStatus`

---

### **Method 2: Discover Tab (Route-Based)**

**Steps:**
1. Open the app
2. Go to **Discover** tab
3. Enter a route between two locations:
   - Start: A location with few/no restaurants
   - End: Another location
   - Example: "Kota Kinabalu" → "Sandakan"
4. Click **"Find Route"**
5. Watch for restaurants along the route
6. Check browser console for:
   ```
   🔍 Firestore-first search started...
   ⚠️ No Firestore results, falling back to Google Places API...
   💾 Auto-populating Firestore with X restaurants...
   ```
7. **Verify in Firestore Console** (same as Method 1)

---

### **Method 3: Force New Area Search**

**To ensure you get new restaurants (not cached):**

1. **Clear Firestore cache** (optional):
   - The app checks Firestore first
   - If restaurants exist, it won't call Google Places
   - To test, use a location you've never searched before

2. **Use a remote location:**
   - Small towns
   - Islands
   - Rural areas
   - New developments

3. **Check console logs:**
   - Should see: `⚠️ No Firestore results, falling back to Google Places API...`
   - Should see: `💾 Auto-populating Firestore...`
   - Should see: `💾 Saved new restaurant (structured schema): ...`

---

## ✅ What to Verify

### **In Browser Console:**
- ✅ See "Auto-populating Firestore" message
- ✅ See "Saved new restaurant (structured schema)" messages
- ✅ No errors about "custom cE object"
- ✅ No errors about missing fields

### **In Firestore Console:**
1. Go to Firebase Console → Firestore → `eateries` collection
2. Find the newly saved restaurant
3. Check it has:

**Top-Level Fields:**
- ✅ `placeId` (camelCase, not `place_id`)
- ✅ `name`, `address`, `location`
- ✅ `rating`, `userRatingTotal` (not `userRatingCount`)
- ✅ `cuisineCategory`, `cuisineType`, `cuisineTags`
- ✅ `halalStatus`

**Nested Maps:**
- ✅ `analytics` → `{totalViews, totalClicks, totalCheckIns, ...}`
- ✅ `business` → `{priceLevel, deliveryAvailable, ...}`
- ✅ `contact` → `{phone, email, ...}`
- ✅ `socialMedia` → `{website}`
- ✅ `metadata` → `{dataSource, qualityScore, version: 2, ...}`

---

## 🎯 Test Scenarios

### **Scenario 1: New Location Search**
1. Search for "Kota Kinabalu restaurants"
2. Should trigger auto-population
3. Verify structured schema in Firestore

### **Scenario 2: Route Discovery**
1. Find route: "Kuala Lumpur" → "Melaka"
2. Look for restaurants along route
3. Should auto-populate new restaurants
4. Verify structured schema

### **Scenario 3: Filtered Search**
1. Search for "Halal restaurants in Kuching"
2. Apply filters (halal, cuisine type)
3. Should auto-populate matching restaurants
4. Verify `halalStatus` and `cuisineCategory` are extracted

---

## 🔍 Debugging Tips

### **If Auto-Population Doesn't Trigger:**

1. **Check if restaurants already exist:**
   - Firestore might already have restaurants for that area
   - Try a different, more remote location

2. **Check console logs:**
   - Look for "Found X restaurants in Firestore"
   - If you see this, Firestore already has data (no auto-population needed)

3. **Check API key:**
   - Make sure Google Places API key is valid
   - Check for API errors in console

4. **Check network:**
   - Make sure you can reach Google Places API
   - Check for network errors

### **If You See Errors:**

1. **"custom cE object" error:**
   - Should NOT happen anymore (we fixed this!)
   - If you see it, the `deepCleanForFirestore` function might need adjustment

2. **Missing fields error:**
   - Check that all required fields are present
   - Check that nested maps are created

3. **Permission errors:**
   - Check Firestore security rules
   - Make sure `eateries` collection allows writes

---

## 📊 Expected Console Output

### **Successful Auto-Population:**
```
🔍 Firestore-first search started...
🔍 Querying Firestore (simplified query)...
⚠️ No Firestore results, falling back to Google Places API...
💰 API Call: {type: "Google Places API", cost: "~RM0.017 per request", ...}
💾 Auto-populating Firestore with 10 restaurants...
💾 Saved new restaurant (structured schema): Restaurant Name 1
💾 Saved new restaurant (structured schema): Restaurant Name 2
...
✅ Auto-population completed! Future searches will use Firestore data.
```

### **If Already in Firestore:**
```
🔍 Firestore-first search started...
🔍 Querying Firestore (simplified query)...
📊 Found 5 restaurants in bounds
✅ Found 5 restaurants in Firestore
```
(No auto-population needed - data already exists)

---

## 🎯 Quick Test Checklist

- [ ] Open app → Search tab
- [ ] Search for new location
- [ ] Check console for "Auto-populating Firestore"
- [ ] Check console for "Saved new restaurant (structured schema)"
- [ ] Open Firestore Console
- [ ] Find newly saved restaurant
- [ ] Verify `placeId` (camelCase)
- [ ] Verify nested maps exist (`analytics`, `business`, `contact`, `metadata`, `socialMedia`)
- [ ] Verify `cuisineCategory`, `cuisineType`, `cuisineTags` exist
- [ ] Verify `halalStatus` exists
- [ ] Verify no errors in console

---

## 💡 Tips

1. **Use Browser DevTools:**
   - Open Console tab
   - Filter by "Auto-populating" or "Saved new restaurant"
   - Watch for errors

2. **Use Firestore Console:**
   - Real-time view of saved data
   - Can see structure immediately
   - Can verify nested maps

3. **Test Multiple Locations:**
   - Different areas = different restaurants
   - More test coverage
   - Verify consistency

---

**Ready to test?** Start with Method 1 (Search Tab) - it's the easiest! 🚀

