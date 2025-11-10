# 🔍 Auto-Population Schema Comparison

## Current Auto-Population Schema (What We're Saving Now)

**Location:** `firestoreSearchService.js` → `saveToFirestore()`

**Current Fields Saved:**
```javascript
{
  place_id: string,
  name: string,
  address: string,
  location: { lat: number, lng: number },
  rating: number,
  userRatingCount: number,
  priceLevel: number,
  types: array,
  photos: array,
  phone: string,
  website: string,
  businessStatus: string,
  operatingHours: {
    isOpen: boolean,
    isOpenNow: boolean,
    isOpen24Hours: boolean,
    periods: [{day, openTime, closeTime}],
    weekdayText: array,
    timezone: string,
    specialHours: array
  },
  utcOffsetMinutes: number,
  viewport: {northeast: {lat, lng}, southwest: {lat, lng}},
  source: string,
  fetchedAt: string,
  searchBounds: object,
  searchFilters: object,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## Expected Firestore Schema (What You Showed)

**Structured Schema with Nested Maps:**

```javascript
{
  // Top-level fields
  address: string,
  name: string,
  phone: string,
  photoUrl: string,
  photos: array,
  placeId: string,  // Note: "placeId" not "place_id"
  priceLevel: number,
  rating: number,
  totalCheckIns: number,
  totalClicks: number,
  totalViews: number,
  types: array,
  userCheckIns: number,
  userPhotos: array,
  userRatingTotal: number,
  userReviews: array,
  website: string,
  
  // Nested Maps
  analytics: {
    lastViewed: null,
    popularityScore: number,
    totalCheckIns: number,
    totalClicks: number,
    totalFavorites: number,
    totalViews: number
  },
  
  business: {
    acceptsReservations: boolean,
    deliveryAvailable: boolean,
    dineInAvailable: boolean,
    priceLevel: number,
    priceRange: string,  // "$", "$$", etc.
    takeoutAvailable: boolean,
    wheelchairAccessible: boolean,
    businessStatus: string
  },
  
  contact: {
    email: string,
    internationalPhone: string,
    phone: string
  },
  
  socialMedia: {
    website: string
  },
  
  location: {
    lat: number,
    lng: number
  },
  
  metadata: {
    dataSource: string,  // "google_places"
    discoveredAt: string,
    lastUpdated: timestamp,
    qualityScore: number,
    version: number
  },
  
  operatingHours: {
    isOpen: boolean,
    isOpen24Hours: boolean,
    isOpenNow: boolean,
    periods: [{day: number, openTime: string, closeTime: string}],
    specialHours: array,
    timezone: string,
    weekdayText: array
  },
  
  // Cuisine fields
  cuisineCategory: string,
  cuisineTags: array,
  cuisineType: string,
  
  // Other fields
  halalStatus: string,
  isActive: boolean,
  discoveredAt: string,
  distanceToRoute: number,
  routeId: string,
  createdAt: timestamp,
  lastUpdated: timestamp
}
```

---

## ❌ MISMATCHES FOUND

### **1. Missing Nested Maps:**
- ❌ `analytics` map - NOT created
- ❌ `business` map - NOT created (fields are top-level)
- ❌ `contact` map - NOT created (phone is top-level)
- ❌ `socialMedia` map - NOT created (website is top-level)
- ❌ `metadata` map - NOT created (source, fetchedAt are top-level)

### **2. Field Name Differences:**
- ❌ We save `place_id` but schema expects `placeId`
- ❌ We save `userRatingCount` but schema expects `userRatingTotal`
- ❌ We save `source` but schema expects `metadata.dataSource`

### **3. Missing Fields:**
- ❌ `cuisineCategory` - NOT extracted
- ❌ `cuisineTags` - NOT extracted
- ❌ `halalStatus` - NOT extracted (might be in types but not as separate field)
- ❌ `isActive` - NOT set (defaults to true)
- ❌ `distanceToRoute` - NOT set (only for route-based searches)
- ❌ `routeId` - NOT set (only for route-based searches)
- ❌ `analytics.*` fields - NOT initialized
- ❌ `business.*` fields - NOT structured
- ❌ `contact.*` fields - NOT structured
- ❌ `photoUrl` - NOT extracted (only photos array)

### **4. Field Structure:**
- ✅ `operatingHours` - Structure matches (good!)
- ✅ `location` - Structure matches (good!)
- ⚠️ `types` - We save as array, schema shows as array of strings (might need serialization)

---

## 🔧 RECOMMENDATION

**Option A: Update Auto-Population to Match Schema (Recommended)**
- Map all fields to match the expected schema
- Create nested maps: `analytics`, `business`, `contact`, `socialMedia`, `metadata`
- Extract `cuisineCategory`, `cuisineTags`, `halalStatus` from `types`
- Initialize default values for analytics fields
- Rename `place_id` → `placeId`, `userRatingCount` → `userRatingTotal`

**Option B: Keep Current Schema (Simpler)**
- Keep flat structure
- Update frontend to read from current schema
- Less work but inconsistent with existing data

**Option C: Hybrid Approach**
- Save in current simple format
- Add migration script to restructure existing data
- Update auto-population for new restaurants

---

## ❓ QUESTION FOR YOU

**Which approach do you prefer?**

1. **Update auto-population** to match the full schema (more work, but consistent)
2. **Keep current simple schema** (less work, but inconsistent)
3. **Hybrid** - Keep current for now, migrate later

Also, **where does the structured schema come from?**
- Is this from existing manually-added restaurants?
- Is this the "official" schema we should use?
- Should we migrate existing data to this schema?

