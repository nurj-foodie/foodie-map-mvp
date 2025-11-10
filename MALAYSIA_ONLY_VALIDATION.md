# 🇲🇾 Malaysia-Only Location Validation

**Date:** 9 November 2025  
**Purpose:** Protect API budget by only geocoding and learning Malaysia locations

---

## 🎯 Policy

**Only Malaysia locations are geocoded and learned** to:
- ✅ Protect API budget
- ✅ Ensure relevant results for Malaysian users
- ✅ Prevent unnecessary API calls

---

## 🛡️ Safeguards in Place

### **1. Geocoding Validation** ✅

**Location:** `enhancedSearchService.js` (lines 150-179)

```javascript
// Validate that geocoded location is in Malaysia
const addressLower = geocoded.address.toLowerCase();
const isInMalaysia = addressLower.includes('malaysia') && 
                     !addressLower.includes('singapore') &&
                     !addressLower.includes('indonesia') &&
                     !addressLower.includes('thailand');

if (isInMalaysia) {
  // ✅ Only learn Malaysia locations
  // ✅ Only use Malaysia coordinates
} else {
  // ❌ Reject non-Malaysia locations
  console.log(`⚠️ Geocoding returned location outside Malaysia: "${geocoded.address}" - ignoring`);
}
```

**What It Does:**
- ✅ Checks if address contains "malaysia"
- ✅ Rejects if contains "singapore"
- ✅ Rejects if contains "indonesia"
- ✅ Rejects if contains "thailand"
- ✅ Only proceeds if Malaysia location confirmed

---

### **2. Learning Protection** ✅

**Location:** `keywordLearningService.js` (lines 299-311)

```javascript
// Prevent learning food prefixes as locations
const foodPrefixes = ['nasi', 'mee', 'roti', ...];

// Skip if it's a food prefix
if (keyword.length <= 6 && foodPrefixes.some(prefix => keyword.startsWith(prefix))) {
  console.log(`⚠️ Skipping learning "${keyword}" as location (food prefix detected)`);
  return null; // ❌ Don't learn
}
```

**What It Does:**
- ✅ Prevents learning food prefixes as locations
- ✅ Saves API calls (no geocoding needed)
- ✅ Prevents incorrect learning

---

### **3. Food Prefix Detection** ✅

**Location:** `enhancedSearchService.js` (lines 585-603)

```javascript
isFoodPrefix(query) {
  const foodPrefixes = ['nasi', 'mee', 'roti', ...];
  
  // Only skip if it's just the prefix alone (≤ 6 chars)
  if (lowerQuery.length <= 6) {
    return foodPrefixes.some(prefix => lowerQuery.startsWith(prefix));
  }
  
  return false;
}
```

**What It Does:**
- ✅ Skips geocoding for food prefixes ("nasi ", "mee ", "roti ")
- ✅ Saves API calls
- ✅ Prevents incorrect geocoding

---

## 📊 API Call Protection

### **Before Validation:**
```
User searches "nasi "
→ Geocodes to Singapore ❌
→ Learns Singapore coordinates ❌
→ Wastes API call ❌
```

### **After Validation:**
```
User searches "nasi "
→ Detects food prefix ✅
→ Skips geocoding ✅
→ No API call ✅
→ Saves budget ✅
```

### **Location Searches:**
```
User searches "kluang"
→ Geocodes ✅
→ Validates Malaysia ✅
→ Learns coordinates ✅
→ Uses for search ✅
```

```
User searches "singapore" (if someone tries)
→ Geocodes ✅
→ Validates Malaysia ❌
→ Rejects (not Malaysia) ✅
→ Doesn't learn ✅
→ Doesn't waste future API calls ✅
```

---

## 💰 Budget Protection

### **API Calls Prevented:**
1. ✅ **Food prefix queries** - No geocoding needed
2. ✅ **Non-Malaysia locations** - Rejected after geocoding
3. ✅ **Food prefixes as locations** - Prevented from learning

### **Cost Savings:**
- **Geocoding API:** ~RM0.005 per request
- **Prevented calls:** Food prefixes, non-Malaysia locations
- **Estimated savings:** Significant reduction in unnecessary calls

---

## ✅ Current Status

### **Malaysia-Only Validation:**
- ✅ Geocoding validates Malaysia addresses
- ✅ Learning only happens for Malaysia locations
- ✅ Food prefixes skip geocoding entirely
- ✅ Non-Malaysia results are rejected

### **Budget Protection:**
- ✅ No geocoding for food prefixes
- ✅ No learning for non-Malaysia locations
- ✅ No learning for food prefixes
- ✅ Only Malaysia locations are processed

---

## 🔧 How It Works

### **Step 1: Query Check**
```
Query → Is food prefix? → Skip geocoding ✅
Query → Is cuisine type? → Skip geocoding ✅
Query → Is very short? → Skip geocoding ✅
```

### **Step 2: Geocoding (if passed Step 1)**
```
Geocode query → Get result
→ Check if Malaysia ✅
→ If Malaysia → Use coordinates ✅
→ If not Malaysia → Reject ❌
```

### **Step 3: Learning (if Malaysia)**
```
Malaysia location → Learn coordinates ✅
→ Add to learned_keywords ✅
→ Sync to memory ✅
```

---

## 📝 Summary

**All safeguards are in place to:**
- ✅ Only geocode Malaysia locations
- ✅ Only learn Malaysia locations
- ✅ Skip geocoding for food prefixes
- ✅ Protect API budget
- ✅ Ensure relevant results

**The system is configured for Malaysia-only operation!** 🇲🇾

