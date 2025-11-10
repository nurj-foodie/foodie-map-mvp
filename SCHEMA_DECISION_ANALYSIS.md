# 🗄️ Firestore Schema Decision Analysis
## Auto-Population vs Manual Schema Compatibility

**Date:** 8 November 2025  
**Context:** Schema inconsistency between auto-populated and manually-added restaurants  
**Priority:** High - Affects data consistency and future migrations

---

## 📊 CURRENT SITUATION

### **What We Have:**

1. **Manually-Added Restaurants** (Your Schema):
   - Structured with nested maps: `analytics`, `business`, `contact`, `socialMedia`, `metadata`
   - Field names: `placeId`, `userRatingTotal`, `cuisineCategory`, `cuisineTags`
   - Well-organized, extensible structure

2. **Auto-Populated Restaurants** (Current Code):
   - Flat structure (all fields at top level)
   - Field names: `place_id`, `userRatingCount`, no `cuisineCategory`
   - Simple, but inconsistent

### **The Problem:**
- **Two different schemas** in the same collection
- **Queries might fail** if they expect nested maps but data is flat
- **Future migrations** will be harder with inconsistent data
- **Indexing issues** - Firestore indexes expect consistent field paths

---

## 🔍 CODE ANALYSIS

### **Current Code Access Patterns:**

**Fields Currently Used:**
```javascript
// Top-level fields (work with both schemas):
- restaurant.halalStatus ✅
- restaurant.location ✅ (nested map - matches both)
- restaurant.operatingHours ✅ (nested map - matches both)
- restaurant.rating ✅
- restaurant.priceLevel ✅
- restaurant.name ✅
- restaurant.address ✅

// Field name mismatches:
- Code uses: restaurant.place_id
- Schema has: restaurant.placeId ❌

// Not yet used (but in schema):
- restaurant.analytics.* (not accessed)
- restaurant.business.* (not accessed)
- restaurant.contact.* (not accessed)
- restaurant.metadata.* (not accessed)
- restaurant.cuisineCategory (not accessed)
- restaurant.cuisineTags (not accessed)
```

**Firestore Queries:**
```javascript
// Current queries use:
where('place_id', '==', ...)  // ❌ Won't find placeId documents
where('halalStatus', '==', ...)  // ✅ Works (top-level in both)
where('location.lat', '>=', ...)  // ✅ Works (nested in both)
```

---

## ⚠️ RISKS OF CURRENT APPROACH

### **1. Query Failures:**
- Querying `place_id` won't find documents with `placeId`
- Querying `userRatingCount` won't find documents with `userRatingTotal`
- Mixed schemas = unreliable queries

### **2. Index Conflicts:**
- Firestore indexes are path-based
- `place_id` and `placeId` need separate indexes
- Wastes index quota

### **3. Frontend Code Issues:**
- Code expects `restaurant.halalStatus` (works)
- Code expects `restaurant.place_id` (fails for manual entries)
- Inconsistent data = bugs

### **4. Future Migration Problems:**
- If switching databases, inconsistent schemas = complex migration
- Need to handle both formats = more code
- Data quality issues

---

## ✅ RECOMMENDATION: Use Structured Schema

### **Why Structured Schema is Better:**

1. **Future-Proof:**
   - Nested maps allow adding fields without breaking queries
   - Better for analytics tracking (`analytics.totalViews`, etc.)
   - Easier to extend (`business.deliveryAvailable`, etc.)

2. **Database Agnostic:**
   - Structured data translates better to SQL/NoSQL
   - Nested maps = nested objects in any database
   - Easier to migrate to PostgreSQL, MongoDB, etc.

3. **Code Organization:**
   - Logical grouping (contact info together, business info together)
   - Easier to understand and maintain
   - Matches domain model better

4. **Performance:**
   - Can query nested fields: `where('business.priceLevel', '==', 1)`
   - Can index nested paths
   - Better for complex queries

5. **Consistency:**
   - Matches your manually-added restaurants
   - One schema = one source of truth
   - No confusion about field locations

---

## 🎯 PROPOSED SOLUTION

### **Option A: Update Auto-Population to Match Structured Schema (RECOMMENDED)**

**Pros:**
- ✅ Consistent schema across all restaurants
- ✅ Future-proof and extensible
- ✅ Better for analytics and business logic
- ✅ Easier database migrations
- ✅ Matches existing manual entries

**Cons:**
- ⚠️ Need to update auto-population code
- ⚠️ Need to migrate existing auto-populated restaurants (one-time)
- ⚠️ Slightly more complex serialization

**Implementation:**
1. Update `saveToFirestore()` to create structured schema
2. Extract cuisine info from `types` array
3. Create nested maps: `analytics`, `business`, `contact`, `socialMedia`, `metadata`
4. Map field names: `place_id` → `placeId`, `userRatingCount` → `userRatingTotal`
5. Initialize default values for analytics
6. Create migration script for existing auto-populated restaurants

**Effort:** Medium (2-3 hours)

---

### **Option B: Keep Flat Schema, Update Manual Entries**

**Pros:**
- ✅ Simpler auto-population code
- ✅ No migration needed

**Cons:**
- ❌ Lose structured organization
- ❌ Harder to extend in future
- ❌ Need to restructure all manual entries
- ❌ Less future-proof

**Not Recommended** - Loses benefits of structured schema

---

### **Option C: Hybrid (Support Both Schemas)**

**Pros:**
- ✅ No migration needed
- ✅ Backward compatible

**Cons:**
- ❌ Complex code (need to check both locations)
- ❌ Inconsistent data forever
- ❌ More bugs and edge cases
- ❌ Harder to maintain

**Not Recommended** - Technical debt

---

## 📋 DETAILED IMPLEMENTATION PLAN (Option A)

### **Step 1: Update Auto-Population Schema**

**New Structure:**
```javascript
{
  // Basic Info
  name: string,
  address: string,
  placeId: string,  // Changed from place_id
  location: {lat, lng},
  
  // Nested Maps
  analytics: {
    lastViewed: null,
    popularityScore: 0,
    totalCheckIns: 0,
    totalClicks: 0,
    totalFavorites: 0,
    totalViews: 0
  },
  
  business: {
    acceptsReservations: false,
    deliveryAvailable: false,
    dineInAvailable: true,
    priceLevel: number,
    priceRange: string,  // "$", "$$", etc.
    takeoutAvailable: true,
    wheelchairAccessible: false,
    businessStatus: string
  },
  
  contact: {
    email: "",
    internationalPhone: "",
    phone: string
  },
  
  socialMedia: {
    website: string
  },
  
  metadata: {
    dataSource: "google_places",
    discoveredAt: timestamp,
    lastUpdated: timestamp,
    qualityScore: 85,  // Calculate from rating, reviews, etc.
    version: 2
  },
  
  // Cuisine Info (extracted from types)
  cuisineCategory: string,  // "Western", "Malay", etc.
  cuisineTags: array,  // ["halal", "western"]
  cuisineType: string,  // Same as cuisineCategory
  
  // Other fields
  halalStatus: string,  // Extracted from types or tags
  isActive: true,
  operatingHours: {...},
  rating: number,
  userRatingTotal: number,  // Changed from userRatingCount
  photos: array,
  types: array,
  // ... other fields
}
```

### **Step 2: Extract Cuisine Info**

**Logic:**
```javascript
// Extract from types array:
types = ["restaurant", "food", "establishment", "cafe", "meal_takeaway"]

// Map to cuisineCategory:
- If types includes "cafe" → cuisineCategory = "Cafe"
- If types includes "fast_food" → cuisineCategory = "Fast Food"
- Check restaurant name for cuisine keywords
- Default: "Western" or "Unknown"

// Extract halalStatus:
- Check types for "halal" keyword
- Check name for halal indicators
- Default: "unknown"
```

### **Step 3: Migration Script**

**One-time migration for existing auto-populated restaurants:**
```javascript
// Find all restaurants with place_id (old schema)
// Restructure to match new schema
// Update field names
// Add nested maps with defaults
```

### **Step 4: Update Query Code**

**Update all queries to use new field names:**
- `place_id` → `placeId`
- `userRatingCount` → `userRatingTotal`
- Access nested maps: `restaurant.business.priceLevel`

---

## 🚨 CRITICAL CONSIDERATIONS

### **1. Existing Indexes:**
- Check `firestore.indexes.json` for existing indexes
- Update indexes to use `placeId` instead of `place_id`
- Add indexes for nested fields if needed

### **2. Backward Compatibility:**
- During migration, support both field names temporarily
- Use helper functions: `getPlaceId(restaurant)` → returns `placeId` or `place_id`

### **3. Data Quality:**
- Validate extracted cuisine info
- Handle missing data gracefully
- Set sensible defaults

### **4. Testing:**
- Test with both old and new schema during transition
- Verify all queries work
- Test migration script on sample data first

---

## 💡 MY RECOMMENDATION

**Go with Option A (Structured Schema)** because:

1. **You've already invested** in the structured schema (manually added restaurants)
2. **Future-proof** - Better for analytics, business logic, extensions
3. **Database migration** - Easier to migrate structured data
4. **Consistency** - One schema = less confusion
5. **Professional** - Industry best practice for NoSQL databases

**Migration Strategy:**
- Phase 1: Update auto-population to use structured schema (new restaurants)
- Phase 2: Create migration script (one-time, can run later)
- Phase 3: Update query code to use new field names
- Phase 4: Run migration script when ready (non-blocking)

**Timeline:**
- Update auto-population: 2-3 hours
- Migration script: 1-2 hours (can do later)
- Update queries: 1 hour
- Testing: 1 hour

**Total: ~5-7 hours** (can be done incrementally)

---

## ❓ QUESTIONS FOR YOU

1. **How many auto-populated restaurants** do we have? (affects migration time)
2. **Are there any Firestore indexes** using `place_id`? (need to update)
3. **Do you have analytics queries** that need `analytics.*` fields? (affects priority)
4. **Timeline preference:** Update now or can we do migration later?

---

**My Vote: Option A (Structured Schema)** - Better long-term, worth the effort.

What do you think? Should we proceed with updating auto-population to match your structured schema?

