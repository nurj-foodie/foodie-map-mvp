# R&R Stops & Petrol Stations - Planning Document

## 🎯 Objectives

Add two new place types to route discovery:
1. **R&R (Rest & Relaxation) Stops** - Highway rest stops with food courts, facilities
2. **Petrol Pump Stations** - Fuel stations along the route

Both should be:
- Discovered along the route (similar to restaurants)
- Indexed in Firestore for caching
- Displayed with distinct markers
- Filtered by distance/duration (5km/30min rule)

---

## 📊 Current Architecture Analysis

### Current Flow:
1. User enters start/end location
2. Route is calculated (cached in `route_index`)
3. Restaurants are discovered along route:
   - Firestore-first search (bounds-based)
   - Google Places API fallback
   - Haversine filtering (5km/30min)
   - Distance Matrix validation (if needed)
4. Results displayed with restaurant markers

### Current Data Structure:
- **Collection:** `eateries` (restaurants)
- **Index:** `route_index` (cached routes)
- **Service:** `firestoreSearchService.js` (restaurant search)
- **Service:** `distanceMatrixService.js` (detour calculation)

---

## 🤔 Discussion Points

### 1. Data Structure & Storage

**Option A: Separate Collections**
```
- eateries (restaurants) - existing
- rnr_stops (R&R stops) - new
- petrol_stations (petrol pumps) - new
```
**Pros:**
- Clear separation
- Easy to query by type
- Independent indexing

**Cons:**
- More collections to manage
- Duplicate route indexing logic

**Option B: Unified Collection with Type Field**
```
- places (unified)
  - type: 'restaurant' | 'rnr' | 'petrol_station'
```
**Pros:**
- Single collection
- Unified search logic
- Easier to query "all places along route"

**Cons:**
- Mixed data types
- Filtering complexity

**Option C: Hybrid (Revised - NOT Recommended)**
```
- eateries (restaurants) - keep existing
- highway_facilities (R&R + Petrol) - new unified collection
  - type: 'rnr' | 'petrol_station'
```
**Pros:**
- Restaurants stay separate (existing logic untouched)
- R&R and Petrol grouped (similar use case: highway facilities)
- Can query all highway facilities together

**Cons:**
- Two collections to manage
- **Petrol stations are NOT highway-only** - they're everywhere (urban, suburban, highway)
- Grouping petrol with R&R (highway-only) doesn't make logical sense

**Option D: Separate Collections (FINAL DECISION)**
```
- eateries (restaurants) - existing
- rnr_stops (R&R stops) - new
- petrol_stations (petrol pumps) - new
```
**Pros:**
- Clear separation by actual use case
- Petrol stations are everywhere (not just highways)
- R&R stops are highway-only
- Independent indexing and querying
- Matches real-world categorization

**Cons:**
- Three collections to manage
- Some duplicate logic (but can be abstracted)

**FINAL DECISION:** Option D (Separate Collections)

---

### 2. Marker Differentiation

**Visual Differentiation Options:**

**A. Different Icons:**
- 🍽️ Restaurant (fork & knife)
- 🛣️ R&R (road/highway icon)
- ⛽ Petrol Station (pump icon)

**B. Different Colors:**
- Restaurants: Blue (current)
- R&R: Green
- Petrol: Orange/Yellow

**C. Combined (Recommended):**
- Different icons + subtle color variation
- Same marker style (AdvancedMarkerElement)
- Info window shows type badge

**Marker Clustering:**
- Should we cluster by type?
- Or cluster all together?
- Recommendation: Cluster all together, but show type in info window

---

### 3. Search Logic & Filtering

**Search Strategy:**

**Option A: Parallel Searches**
```
1. Search restaurants (existing)
2. Search R&R stops (new)
3. Search petrol stations (new)
4. Combine results
5. Filter by distance/duration
```
**Pros:**
- Independent queries
- Can optimize each separately
- Clear separation

**Cons:**
- Multiple API calls
- More complex coordination

**Option B: Unified Search with Type Filter**
```
1. Search all places (restaurants + R&R + petrol)
2. Filter by type
3. Filter by distance/duration
```
**Pros:**
- Single search query
- Simpler logic

**Cons:**
- Google Places API might not return all types in one query
- Need separate queries anyway

**Recommendation:** Option A (Parallel Searches)

**Filtering Rules:**
- Same 5km/30min rule for all types?
- Or different thresholds?
  - Restaurants: 5km/30min (current)
  - R&R: 10km/20min? (highway facilities, more acceptable detour)
  - Petrol: 3km/10min? (urgent need, shorter detour)

**Recommendation:** 
- Restaurants: 5km/30min (keep current)
- R&R: 5km/30min (same, they're food stops too)
- Petrol: 5km/15min (shorter time, urgent need)

---

### 4. Indexing Strategy

**Route-Based Indexing (Similar to Restaurants):**

**Option A: Separate Route Indexes**
```
- route_index (restaurants) - existing
- route_index_rnr (R&R stops) - new
- route_index_petrol (petrol stations) - new
```
**Pros:**
- Clear separation
- Independent cache management

**Cons:**
- Duplicate route data
- More storage

**Option B: Unified Route Index with Place Types**
```
- route_index (unified)
  - restaurants: [...]
  - rnr_stops: [...]
  - petrol_stations: [...]
```
**Pros:**
- Single route cache
- All place types cached together
- Less storage

**Cons:**
- More complex structure
- Need to update existing route_index structure

**Recommendation:** Option B (Unified Route Index)

**Index Structure:**
```javascript
{
  routeId: "route_5.263_100.485_2.19_102.25",
  startLocation: {...},
  endLocation: {...},
  completeRoute: {...},
  places: {
    restaurants: [...], // existing
    rnr_stops: [...],   // new
    petrol_stations: [...] // new
  },
  createdAt: Date,
  expiresAt: Date
}
```

---

### 5. Google Places API Query Strategy

**For R&R Stops:**
- Query: "rest stop" OR "R&R" OR "highway rest area"
- Type filter: `establishment` + `point_of_interest`
- Location bias: route bounds

**For Petrol Stations:**
- Query: "petrol station" OR "gas station" OR "fuel"
- Type filter: `gas_station`
- Location bias: route bounds

**API Cost Consideration:**
- 3 separate searches per route (restaurants + R&R + petrol)
- But we can cache all results in route_index
- First search costs, subsequent searches are FREE

---

### 6. UI/UX Design

**Display Options:**

**Option A: Separate Sections**
```
Route Results:
├── Restaurants (36)
├── R&R Stops (5)
└── Petrol Stations (8)
```
**Pros:**
- Clear organization
- Easy to scan

**Cons:**
- More scrolling
- Separate sections

**Option B: Unified List with Type Badges**
```
Route Results (49 places):
├── 🍽️ Restaurant A (2.3km, 5min)
├── ⛽ Petrol Station B (1.5km, 3min)
├── 🛣️ R&R Stop C (4.2km, 8min)
└── ...
```
**Pros:**
- Single list
- Easy to see all options
- Type badges for quick identification

**Cons:**
- Mixed types might be confusing

**Option C: Tabs/Filter Toggles (Recommended)**
```
[All] [Restaurants] [R&R] [Petrol]
```
**Pros:**
- User can filter by type
- Default shows all
- Flexible viewing

**Cons:**
- More UI complexity

**Recommendation:** Option C (Tabs/Filter Toggles)

**Map Display:**
- Show all markers by default
- Filter markers when tab is selected
- Different colors/icons for each type
- Clustering enabled

---

### 7. Service Architecture

**New Services Needed:**

**Option A: Extend Existing Services**
- Extend `firestoreSearchService.js` to handle R&R and Petrol
- Add type parameter to search methods

**Option B: Create New Services**
- `rnrSearchService.js` (R&R search)
- `petrolSearchService.js` (Petrol search)
- Both use similar logic to restaurant search

**Option C: Unified Service (Recommended)**
- Create `placeSearchService.js` (unified)
- Handles all place types
- Reuses existing `firestoreSearchService` logic
- Extends `distanceMatrixService` for detour calculation

**Recommendation:** Option C (Unified Service)

**Service Structure:**
```javascript
placeSearchService.searchPlacesAlongRoute(route, types = ['restaurant', 'rnr', 'petrol'])
  ├── For each type:
  │   ├── Check Firestore cache
  │   ├── If miss, query Google Places API
  │   ├── Calculate detours (Haversine + Distance Matrix)
  │   └── Filter by distance/duration
  └── Return combined results
```

---

### 8. Data Fields for R&R and Petrol

**R&R Stops:**
- name
- address
- location (lat/lng)
- type: 'rnr'
- facilities: ['food_court', 'toilet', 'prayer_room', 'parking']
- operatingHours
- rating (if available)

**Petrol Stations:**
- name
- address
- location (lat/lng)
- type: 'petrol_station'
- brand: 'Petronas' | 'Shell' | 'BHP' | etc.
- facilities: ['shop', 'atm', 'toilet', 'car_wash']
- operatingHours (24/7 or specific hours)
- fuelTypes: ['petrol', 'diesel', 'lpg']

---

## 📋 Implementation Plan (Draft)

### Phase 1: Data Structure
1. Create `rnr_stops` collection structure
2. Create `petrol_stations` collection structure
3. Update `route_index` to include `places.rnr_stops` and `places.petrol_stations`
4. Create Firestore indexes for new collections

### Phase 2: Search Services
1. Create unified `placeSearchService.js`
2. Implement R&R search logic
3. Implement Petrol search logic
4. Integrate with existing restaurant search

### Phase 3: Indexing
1. Update `routeIndexService.js` to index all place types
2. Implement caching for R&R and Petrol
3. Update route reconstruction to include all place types

### Phase 4: UI Components
1. Create type filter tabs/buttons
2. Create different marker icons for each type
3. Update info windows to show type-specific info
4. Update restaurant list to show all place types

### Phase 5: Integration
1. Update `findRestaurantsForAllRoutes` to search all types
2. Update marker display logic
3. Update route switching to show all types
4. Test end-to-end flow

---

## ✅ Decisions Made

1. **Marker Icons:** ✅ Emoji icons (🍽️ Restaurant, 🛣️ R&R, ⛽ Petrol)

2. **Filtering Thresholds:** ✅ Different thresholds:
   - Restaurants: 5km/30min (current)
   - R&R: 5km/30min (same as restaurants - they're food stops)
   - Petrol: 5km/15min (shorter time - urgent need)

3. **Display Priority:** ✅ Prioritize restaurants, but use tab filters:
   - Default: Show restaurants first
   - Tabs: [All] [🍽️ Restaurants] [🛣️ R&R] [⛽ Petrol]
   - User can filter to see only R&R or Petrol

4. **Info Window Content:** ✅ Same structure as restaurants:
   - Basic info in marker info window (name, distance, duration)
   - Full details in modal (like restaurant modal)
   - No need for facilities list in info window

5. **Clustering:** ✅ Cluster all together (by default)

6. **Search Frequency:** ✅ Always search all 3 types on every route:
   - Petrol stations are NOT highway-only (they're everywhere)
   - R&R stops ARE highway-only (by definition)
   - But we search both on all routes for consistency

7. **Storage:** ✅ Separate collections (revised decision):
   - `eateries` (restaurants) - existing
   - `rnr_stops` (R&R stops) - new
   - `petrol_stations` (petrol pumps) - new
   - **Reason:** Petrol stations are everywhere (not just highways), so separate collections make more sense

8. **API Cost:** ✅ Same as restaurants:
   - First search: API call (costs money)
   - Subsequent searches: Firestore cache (FREE)
   - All types cached in route_index for future searches

---

## 🎨 UI Mockup Concept

```
┌─────────────────────────────────────┐
│  Route: Penang → Malacca            │
│  [All] [🍽️ Restaurants] [🛣️ R&R] [⛽ Petrol] │
├─────────────────────────────────────┤
│  🍽️ Subway @ Petronas               │
│     9.5km, 14min                    │
│  ⛽ Petronas Station                 │
│     2.1km, 4min                     │
│  🛣️ R&R Sungai Perak                │
│     15.3km, 22min                   │
│  🍽️ Brader John Burger               │
│     6.0km, 9min                     │
└─────────────────────────────────────┘
```

---

## 📝 Next Steps

1. **Discuss and finalize:**
   - Data structure (Hybrid recommended)
   - Marker design (Icons + colors)
   - Filtering thresholds
   - UI layout (Tabs recommended)

2. **Create detailed technical spec** based on decisions

3. **Implement in phases** (start with Phase 1)

---

## 💡 Final Recommendations Summary

1. **Data Structure:** ✅ Separate Collections:
   - `eateries` (restaurants) - existing
   - `rnr_stops` (R&R stops) - new
   - `petrol_stations` (petrol pumps) - new
   - **Reason:** Petrol stations are everywhere, not just highways

2. **Route Index:** ✅ Unified - Add `places.rnr_stops` and `places.petrol_stations` to existing `route_index`
   - All place types cached together per route
   - API calls only on first search, then FREE from Firestore

3. **Service:** ✅ Unified `placeSearchService.js` that handles all types
   - Abstracted search logic
   - Reusable for all place types

4. **UI:** ✅ Tabs/Filter toggles - [All] [🍽️ Restaurants] [🛣️ R&R] [⛽ Petrol]
   - Default: Show restaurants first (prioritized)
   - User can filter by type using tabs

5. **Markers:** ✅ Emoji icons (🍽️ 🛣️ ⛽) + subtle color variation
   - Restaurant: 🍽️ (Blue)
   - R&R: 🛣️ (Green)
   - Petrol: ⛽ (Orange/Yellow)

6. **Filtering:** ✅ Different thresholds:
   - Restaurants: 5km/30min
   - R&R: 5km/30min
   - Petrol: 5km/15min (shorter time - urgent need)

7. **Search:** ✅ Parallel searches for each type, then combine
   - Search all 3 types on every route
   - Cache results in route_index

8. **Indexing:** ✅ Cache all types in route_index for cost savings
   - First search: 3x API calls (restaurants + R&R + petrol)
   - Subsequent searches: FREE (from Firestore cache)

9. **Info Windows:** ✅ Same structure as restaurants
   - Basic info in marker popup (name, distance, duration)
   - Full details in modal (click to open)

10. **Clustering:** ✅ Cluster all markers together
    - Show type in info window
    - User can filter by tab to see specific types

