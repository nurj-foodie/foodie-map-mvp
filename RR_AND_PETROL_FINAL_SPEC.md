# R&R Stops & Petrol Stations - Final Implementation Specification

## ✅ Confirmed Decisions

### 1. Data Structure
- **Separate Collections:**
  - `eateries` (restaurants) - existing
  - `rnr_stops` (R&R stops) - new
  - `petrol_stations` (petrol pumps) - new

### 2. Filtering Thresholds
- **Restaurants:** 5km/30min
- **R&R:** 5km/30min
- **Petrol:** 5km/15min ✅ CONFIRMED

### 3. API Call Strategy
- **ONE-TIME per route** (then cached in route_index)
- First search: 3x API calls (restaurants + R&R + petrol)
- Subsequent searches: FREE (from Firestore cache)
- **Therefore:** Can use Google Places type filters (no need for specific queries)

### 4. Brand Extraction
- Extract brand from petrol station name
- Save to `brand` field in database
- Same data structure as restaurants (our own data)

### 5. UI/UX
- Default: Show restaurants first (prioritized)
- Tabs: [All] [🍽️ Restaurants] [🛣️ R&R] [⛽ Petrol]
- Markers: Emoji icons (🍽️ 🛣️ ⛽)

---

## 🔍 Search Query Strategy

### R&R Stops Search

**Since API is ONE-TIME (cached), we can use type filters:**

**Option 1: Type Filter (Preferred)**
```javascript
// Use Google Places type filter
type: 'establishment',
// Then filter results by checking name/description for R&R keywords
```

**Option 2: Text Query (Fallback if type filter doesn't work)**
```javascript
// If type filter doesn't return good results, use:
textQuery: "rest stop" OR "R&R" OR "highway rest area"
```

**Implementation:**
1. Try type filter first
2. Filter results by name keywords: "R&R", "rest stop", "rest area", "layby"
3. If results are poor, fallback to text query

### Petrol Stations Search

**Type Filter (Primary):**
```javascript
type: 'gas_station'  // Google Places has this type
```

**This is straightforward - Google Places API has `gas_station` type, so we can use type filter directly.**

---

## 📊 Brand Extraction Logic

### Petrol Station Brand Extraction

**Common Brands in Malaysia:**
- Petronas
- Shell
- BHP
- Caltex
- Petron
- Petronas Dagangan
- etc.

**Extraction Logic:**
```javascript
function extractBrand(name) {
  const brands = ['Petronas', 'Shell', 'BHP', 'Caltex', 'Petron'];
  const nameUpper = name.toUpperCase();
  
  for (const brand of brands) {
    if (nameUpper.includes(brand.toUpperCase())) {
      return brand;
    }
  }
  
  // If no brand found, try to extract from common patterns
  // "Petronas Station" → "Petronas"
  // "Shell Select" → "Shell"
  // etc.
  
  return null; // or extract from name pattern
}
```

**Save to Database:**
- Extract during normalization
- Save to `brand` field
- Same as how we save restaurant data (our own structure)

---

## 🏗️ Architecture Overview

### Data Flow

```
User searches route
  ↓
Check route_index cache
  ↓
If cache hit:
  → Return cached places (FREE)
  ↓
If cache miss:
  → Search restaurants (API - one time)
  → Search R&R stops (API - one time)
  → Search petrol stations (API - one time)
  → Calculate detours (Haversine - FREE)
  → Filter by thresholds:
    - Restaurants: 5km/30min
    - R&R: 5km/30min
    - Petrol: 5km/15min
  → Extract brand from petrol names
  → Save to route_index (cache)
  → Save individual places to collections:
    - eateries (restaurants)
    - rnr_stops (R&R)
    - petrol_stations (petrol)
  → Return results
```

### Service Structure

```
placeSearchService.js
  ├── searchPlacesAlongRoute(route)
  │   ├── searchRestaurants(bounds) → uses existing firestoreSearchService
  │   ├── searchRNRStops(bounds) → new
  │   └── searchPetrolStations(bounds) → new
  │
  ├── normalizeRNRResult(place) → extract R&R data
  └── normalizePetrolResult(place) → extract petrol data + brand
```

---

## 📝 Implementation Checklist

### Phase 1: Data Structure ✅
- [ ] Create `rnr_stops` collection schema
- [ ] Create `petrol_stations` collection schema (with `brand` field)
- [ ] Update `route_index` schema to include `places` object
- [ ] Create Firestore indexes
- [ ] Update Firestore security rules

### Phase 2: Services
- [ ] Create `placeSearchService.js`
- [ ] Implement R&R search (use type filter, fallback to text query)
- [ ] Implement Petrol search (use `gas_station` type filter)
- [ ] Implement brand extraction logic
- [ ] Update `routeIndexService.js` to handle all place types
- [ ] Update `distanceMatrixService.js` to support different thresholds

### Phase 3: Integration
- [ ] Update `findRestaurantsForAllRoutes` → `findPlacesForAllRoutes`
- [ ] Update route caching to include all place types
- [ ] Update route reconstruction to include places
- [ ] Test search flow end-to-end

### Phase 4: UI
- [ ] Create type filter tabs component
- [ ] Update marker creation to use emoji icons (🍽️ 🛣️ ⛽)
- [ ] Update info window to show type
- [ ] Update place list to show all types (restaurants first)
- [ ] Create/update modals for R&R and Petrol

### Phase 5: Testing
- [ ] Test R&R search on highway routes
- [ ] Test Petrol search on all route types
- [ ] Test brand extraction
- [ ] Test caching mechanism
- [ ] Test filtering and tab switching
- [ ] Test marker display and clustering
- [ ] Test different thresholds (5km/15min for petrol)

---

## 🎯 Key Implementation Details

### 1. R&R Search Implementation

**Primary Method: Type Filter**
```javascript
// Use establishment type, then filter by name
const results = await Place.searchByText({
  type: 'establishment',
  locationBias: {...}
});

// Filter results by R&R keywords
const rnrStops = results.filter(place => {
  const name = place.name.toLowerCase();
  return name.includes('r&r') || 
         name.includes('rest stop') || 
         name.includes('rest area') ||
         name.includes('layby');
});
```

**Fallback: Text Query**
```javascript
// If type filter doesn't work well
const results = await Place.searchByText({
  textQuery: "rest stop OR R&R OR highway rest area",
  locationBias: {...}
});
```

### 2. Petrol Station Search Implementation

**Primary Method: Type Filter**
```javascript
// Google Places has gas_station type
const results = await Place.searchByText({
  type: 'gas_station',
  locationBias: {...}
});
```

**Brand Extraction:**
```javascript
function extractBrand(name) {
  const brands = ['Petronas', 'Shell', 'BHP', 'Caltex', 'Petron'];
  const nameUpper = name.toUpperCase();
  
  for (const brand of brands) {
    if (nameUpper.includes(brand.toUpperCase())) {
      return brand;
    }
  }
  return null;
}
```

### 3. Threshold Application

**In `distanceMatrixService.js`:**
```javascript
function getThresholdForType(type) {
  switch(type) {
    case 'restaurant':
    case 'rnr':
      return { distance: 5, duration: 30 };
    case 'petrol_station':
      return { distance: 5, duration: 15 };
    default:
      return { distance: 5, duration: 30 };
  }
}
```

---

## 💰 Cost Analysis

### First Search (Cache Miss)
- Google Directions API: ~RM0.005
- Google Places API (Restaurants): ~RM0.017
- Google Places API (R&R): ~RM0.017
- Google Places API (Petrol): ~RM0.017
- **Total:** ~RM0.056 per route

### Subsequent Searches (Cache Hit)
- All from Firestore: **FREE**
- **Total:** RM0.000

### Cost Savings
- After first search, all future searches are FREE
- Route caching makes this very cost-effective

---

## ✅ Ready for Implementation

All decisions confirmed:
1. ✅ Separate collections
2. ✅ Unified route index
3. ✅ One-time API calls (cached)
4. ✅ Type filters for search
5. ✅ Brand extraction for petrol
6. ✅ Different thresholds (5km/15min for petrol)
7. ✅ Tab filters in UI
8. ✅ Emoji markers

**Ready to proceed with implementation!**

