# 🔍 Search Logic Explanation

**Date:** 9 November 2025  
**Issue:** Searching "kluang" returned Kuala Lumpur restaurants

---

## 🐛 Problem Identified

### **What Happened:**
1. User searches "kluang"
2. Query parsed correctly: `location: "kluang"`
3. **BUG:** `getPredefinedLocation("kluang")` matched "kl" instead of "kluang"
4. Used Kuala Lumpur coordinates (3.139, 101.6869) instead of Kluang
5. Searched Firestore with wrong bounds → got KL restaurants

### **Root Cause:**
- "kluang" was **not** in predefined locations list
- Matching logic used `includes()` which matched "kl" first (since "kluang" contains "kl")
- No sorting by length, so shorter matches happened first

---

## ✅ Fix Applied

### **1. Added Kluang to Predefined Locations**
```javascript
'kluang': { lat: 2.0333, lng: 103.3167 }, // Added Kluang
'yong peng': { lat: 2.0167, lng: 103.0667 },
'simpang renggam': { lat: 1.8333, lng: 103.3167 },
```

### **2. Fixed Matching Logic**
**Before:**
```javascript
for (const [key, coords] of Object.entries(predefinedLocations)) {
  if (lowerQuery.includes(key)) {
    return coords; // "kluang" matches "kl" first!
  }
}
```

**After:**
```javascript
// Sort by length (longest first) so "kluang" matches before "kl"
const sortedLocations = Object.entries(predefinedLocations).sort((a, b) => b[0].length - a[0].length);

for (const [key, coords] of sortedLocations) {
  if (lowerQuery === key || lowerQuery.includes(key)) {
    // Additional check: if key is short (like "kl"), make sure it's not part of a longer word
    if (key.length <= 2) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (!regex.test(lowerQuery)) {
        continue; // Skip if it's part of a longer word
      }
    }
    return coords;
  }
}
```

---

## 🔍 How Search Logic Works

### **Step 1: Parse Query**
```javascript
parseCompoundQuery("kluang")
// Returns: { location: "kluang", food: null, cuisine: null }
```

### **Step 2: Determine Search Location**
```javascript
// Priority order:
1. Parsed location from query → getPredefinedLocation("kluang")
2. Geocode if not found
3. User location
4. Default Malaysia center
```

### **Step 3: Search Firestore**
```javascript
// Create search bounds from location
const bounds = createSearchBounds(searchCenter, radius);

// Query Firestore with bounds
const results = await firestoreSearchService.searchRestaurants(bounds, filters);
```

### **Step 4: Text Filtering**
```javascript
// Filter results by search query text
const filtered = results.filter(restaurant => {
  // Check if "kluang" appears in restaurant name/address
});
```

### **Step 5: Fallback to Google Places**
```javascript
// If no results or incomplete data
if (results.length === 0 || shouldFallback) {
  // Use Google Places API
  // Auto-populate Firestore
}
```

---

## 📊 Location Matching Priority

### **Now Fixed:**
1. ✅ **Longest match first** - "kluang" matches before "kl"
2. ✅ **Word boundary check** - Short keys (≤2 chars) must be whole words
3. ✅ **Exact match preferred** - Exact matches take priority

### **Example:**
- Query: "kluang"
  - ✅ Matches "kluang" (6 chars) → Kluang coordinates
  - ❌ Skips "kl" (2 chars) - not a whole word in "kluang"

- Query: "kl restaurants"
  - ✅ Matches "kl" (whole word) → KL coordinates

---

## 🎯 Testing

### **Test Cases:**
- [x] "kluang" → Kluang coordinates (2.0333, 103.3167)
- [x] "kl" → KL coordinates (3.1390, 101.6869)
- [x] "klang" → Klang coordinates (3.0333, 101.4500)
- [x] "kuala lumpur" → KL coordinates
- [x] "jb" → Johor Bahru coordinates

---

## 📝 Files Modified

- ✅ `foodie-simple/src/services/enhancedSearchService.js`
  - Added Kluang, Yong Peng, Simpang Renggam to predefined locations
  - Fixed matching logic to check longest matches first
  - Added word boundary check for short keys
  - Improved console logging

---

**Status:** ✅ **FIXED**  
**Result:** Searching "kluang" now correctly uses Kluang coordinates and returns Kluang restaurants! 🎉

