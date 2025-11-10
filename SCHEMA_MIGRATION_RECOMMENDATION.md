# 🎯 Schema Migration Recommendation
## Final Decision & Implementation Plan

**Date:** 8 November 2025  
**Decision:** Use Structured Schema (Option A)  
**Rationale:** Future-proof, consistent, database-agnostic

---

## ✅ FINAL RECOMMENDATION: **Use Structured Schema**

### **Why This is the Best Choice:**

1. **You've Already Invested** - Manual restaurants use structured schema
2. **Future-Proof** - Better for analytics, business logic, extensions
3. **Database Migration** - Structured data migrates easier (SQL, MongoDB, etc.)
4. **Professional** - Industry best practice for NoSQL
5. **Code Already Defensive** - Many places use `place_id || placeId` fallbacks

---

## 📊 CURRENT STATE ANALYSIS

### **Good News:**
- ✅ Code already handles both field names in many places (`place_id || id`)
- ✅ No critical Firestore indexes using `place_id` (only for checkIns, etc.)
- ✅ Most queries use top-level fields that work with both schemas
- ✅ `location` and `operatingHours` already nested (matches both)

### **Issues Found:**
- ⚠️ `firestoreSearchService.saveToFirestore()` queries by `place_id` (won't find `placeId` documents)
- ⚠️ Field name inconsistency: `place_id` vs `placeId`, `userRatingCount` vs `userRatingTotal`
- ⚠️ Missing nested maps: `analytics`, `business`, `contact`, `socialMedia`, `metadata`
- ⚠️ Missing fields: `cuisineCategory`, `cuisineTags`, `halalStatus` (not extracted)

---

## 🚀 IMPLEMENTATION PLAN

### **Phase 1: Update Auto-Population (IMMEDIATE)**

**Goal:** New auto-populated restaurants use structured schema

**Changes:**
1. Update `saveToFirestore()` to create structured schema
2. Extract cuisine info from `types` array
3. Create nested maps with defaults
4. Map field names correctly
5. Query by both `place_id` AND `placeId` (backward compatibility)

**Timeline:** 2-3 hours

---

### **Phase 2: Update Query Code (IMMEDIATE)**

**Goal:** Support both field names during transition

**Changes:**
1. Update `saveToFirestore()` duplicate check to query both `place_id` and `placeId`
2. Add helper functions: `getPlaceId()`, `getUserRatingTotal()`
3. Update critical queries to use helpers

**Timeline:** 1 hour

---

### **Phase 3: Migration Script (LATER - Non-Blocking)**

**Goal:** Migrate existing auto-populated restaurants

**When:** Can be done later, doesn't block new features

**Script:**
- Find all restaurants with `place_id` (old schema)
- Restructure to match new schema
- Update field names
- Add nested maps with defaults
- Extract cuisine info

**Timeline:** 1-2 hours (when ready)

---

## 📝 DETAILED SCHEMA MAPPING

### **Field Name Mappings:**

| Current (Auto-Pop) | New (Structured) | Notes |
|-------------------|------------------|-------|
| `place_id` | `placeId` | Query both during transition |
| `userRatingCount` | `userRatingTotal` | Also in `analytics.totalViews` |
| `source` | `metadata.dataSource` | Move to nested map |
| `fetchedAt` | `metadata.discoveredAt` | Move to nested map |
| `phone` | `contact.phone` | Move to nested map |
| `website` | `socialMedia.website` | Move to nested map |
| `priceLevel` | `business.priceLevel` | Also keep top-level for queries |
| `businessStatus` | `business.businessStatus` | Move to nested map |

### **New Fields to Extract:**

| Field | Source | Logic |
|-------|--------|-------|
| `cuisineCategory` | `types` array | Map types to cuisine |
| `cuisineTags` | `types` array | Extract tags like "halal" |
| `halalStatus` | `types` or name | Extract from types/name |
| `analytics.*` | Defaults | Initialize to 0/null |
| `business.*` | Extract from types | Map types to business features |
| `contact.*` | Existing fields | Move phone, add email |
| `metadata.*` | Existing + calculate | Add qualityScore, version |

---

## 🔧 IMPLEMENTATION DETAILS

### **1. Cuisine Extraction Logic:**

```javascript
extractCuisineInfo(types, name) {
  const typesLower = types.map(t => t.toLowerCase());
  const nameLower = name.toLowerCase();
  
  // Map types to cuisine
  const cuisineMap = {
    'cafe': 'Cafe',
    'fast_food': 'Fast Food',
    'meal_takeaway': 'Fast Food',
    'restaurant': 'Western', // Default
    // Add more mappings
  };
  
  // Check types for cuisine
  for (const [type, cuisine] of Object.entries(cuisineMap)) {
    if (typesLower.includes(type)) {
      return {
        cuisineCategory: cuisine,
        cuisineType: cuisine,
        cuisineTags: typesLower.filter(t => 
          ['halal', 'vegetarian', 'vegan'].includes(t)
        )
      };
    }
  }
  
  // Check name for cuisine keywords
  // ... fallback logic
  
  return {
    cuisineCategory: 'Western',
    cuisineType: 'Western',
    cuisineTags: []
  };
}
```

### **2. Halal Status Extraction:**

```javascript
extractHalalStatus(types, name) {
  const typesLower = types.map(t => t.toLowerCase());
  const nameLower = name.toLowerCase();
  
  // Check for halal indicators
  if (typesLower.includes('halal') || nameLower.includes('halal')) {
    return 'halal';
  }
  if (nameLower.includes('pork-free') || nameLower.includes('non-halal')) {
    return 'pork-free';
  }
  if (nameLower.includes('non-halal')) {
    return 'non-halal';
  }
  
  return 'unknown';
}
```

### **3. Business Features Extraction:**

```javascript
extractBusinessFeatures(types) {
  const typesLower = types.map(t => t.toLowerCase());
  
  return {
    acceptsReservations: typesLower.includes('meal_delivery'), // Guess
    deliveryAvailable: typesLower.includes('meal_delivery'),
    dineInAvailable: typesLower.includes('restaurant'),
    takeoutAvailable: typesLower.includes('meal_takeaway'),
    wheelchairAccessible: false, // Not in types, default
  };
}
```

---

## ⚠️ BACKWARD COMPATIBILITY STRATEGY

### **During Transition:**

1. **Query Both Field Names:**
```javascript
// Check for existing restaurant
const query1 = query(collection(db, 'eateries'), where('place_id', '==', id));
const query2 = query(collection(db, 'eateries'), where('placeId', '==', id));
const [snapshot1, snapshot2] = await Promise.all([getDocs(query1), getDocs(query2)]);
const exists = !snapshot1.empty || !snapshot2.empty;
```

2. **Helper Functions:**
```javascript
function getPlaceId(restaurant) {
  return restaurant.placeId || restaurant.place_id || restaurant.id;
}

function getUserRatingTotal(restaurant) {
  return restaurant.userRatingTotal || restaurant.userRatingCount || 0;
}
```

3. **Gradual Migration:**
- New restaurants: Use structured schema
- Old restaurants: Keep working (read both)
- Migration script: Run when convenient

---

## 📈 MIGRATION TIMELINE

### **Immediate (Today):**
- ✅ Update auto-population to use structured schema
- ✅ Add backward-compatible queries
- ✅ Extract cuisine/halal info

### **Soon (This Week):**
- ✅ Update critical query code
- ✅ Add helper functions
- ✅ Test with both schemas

### **Later (When Ready):**
- ⏳ Create migration script
- ⏳ Run migration on existing data
- ⏳ Remove backward compatibility code

---

## 🎯 FINAL ANSWER

**Yes, update auto-population to match your structured schema.**

**Reasons:**
1. ✅ Consistent with your manual entries
2. ✅ Future-proof for database migrations
3. ✅ Better for analytics and business logic
4. ✅ Code already handles both field names
5. ✅ Can migrate existing data later (non-blocking)

**Next Steps:**
1. I'll update `saveToFirestore()` to create structured schema
2. Add cuisine/halal extraction
3. Add backward-compatible queries
4. You test and verify
5. Migration script can be created later

**Should I proceed with Phase 1 (Update Auto-Population)?**

