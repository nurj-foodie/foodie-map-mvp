# R&R Stops & Petrol Stations - Implementation Specification

## ✅ Final Decisions

### Data Structure
- **Separate Collections:**
  - `eateries` (restaurants) - existing
  - `rnr_stops` (R&R stops) - new
  - `petrol_stations` (petrol pumps) - new

### Route Indexing
- **Unified Route Index:**
  ```javascript
  route_index: {
    routeId: "route_...",
    startLocation: {...},
    endLocation: {...},
    completeRoute: {...},
    places: {
      restaurants: [...],    // existing
      rnr_stops: [...],      // new
      petrol_stations: [...] // new
    }
  }
  ```

### UI/UX
- **Default:** Show restaurants first (prioritized)
- **Tabs:** [All] [🍽️ Restaurants] [🛣️ R&R] [⛽ Petrol]
- **Markers:** Emoji icons (🍽️ 🛣️ ⛽) with color variation

### Filtering
- **Restaurants:** 5km/30min ✅
- **R&R:** 5km/30min ✅
- **Petrol:** 5km/15min ✅ (CONFIRMED - shorter time for urgent need)

### Info Windows
- Basic info in marker popup (name, distance, duration)
- Full details in modal (same structure as restaurant modal)

---

## 📋 Detailed Implementation Plan

### Phase 1: Data Structure & Firestore Setup

#### 1.1 Create Collection Schemas

**`rnr_stops` Collection:**
```javascript
{
  place_id: string,           // Google Places ID
  name: string,
  address: string,
  location: {
    lat: number,
    lng: number
  },
  type: 'rnr',                 // Always 'rnr'
  rating: number,              // Optional
  userRatingCount: number,      // Optional
  operatingHours: {
    isOpen: boolean,
    periods: [...],
    weekdayDescriptions: [...]
  },
  source: 'google_places_legacy_api' | 'google_places_new_api',
  fetchedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**`petrol_stations` Collection:**
```javascript
{
  place_id: string,            // Google Places ID
  name: string,
  address: string,
  location: {
    lat: number,
    lng: number
  },
  type: 'petrol_station',      // Always 'petrol_station'
  brand: string,               // Extracted from name: 'Petronas', 'Shell', 'BHP', etc.
  rating: number,              // Optional
  userRatingCount: number,     // Optional
  operatingHours: {
    isOpen: boolean,
    periods: [...],
    weekdayDescriptions: [...]
  },
  source: 'google_places_legacy_api' | 'google_places_new_api',
  fetchedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```
**Note:** Brand is extracted from name during normalization and saved to database (same as restaurant data structure)

#### 1.2 Update Route Index Schema

**Current:**
```javascript
route_index: {
  routeId: string,
  startLocation: {...},
  endLocation: {...},
  completeRoute: {...},
  // No places field currently
}
```

**Updated:**
```javascript
route_index: {
  routeId: string,
  startLocation: {...},
  endLocation: {...},
  completeRoute: {...},
  places: {
    restaurants: [...],      // Array of restaurant place_ids or full data
    rnr_stops: [...],        // Array of R&R place_ids or full data
    petrol_stations: [...]   // Array of petrol place_ids or full data
  },
  createdAt: timestamp,
  expiresAt: timestamp,
  searchCount: number,
  lastSearched: timestamp
}
```

#### 1.3 Create Firestore Indexes

**For `rnr_stops`:**
- Index on `location` (geohash) for bounds queries
- Index on `type` (always 'rnr', but for consistency)

**For `petrol_stations`:**
- Index on `location` (geohash) for bounds queries
- Index on `type` (always 'petrol_station')
- Index on `brand` (optional, for filtering)

---

### Phase 2: Service Layer

#### 2.1 Create Unified Place Search Service

**File:** `src/services/placeSearchService.js`

**Structure:**
```javascript
class PlaceSearchService {
  // Search all place types along a route
  async searchPlacesAlongRoute(route, options = {}) {
    // Returns: { restaurants: [...], rnr_stops: [...], petrol_stations: [...] }
  }
  
  // Search specific type
  async searchByType(type, bounds, filters) {
    // type: 'restaurant' | 'rnr' | 'petrol_station'
  }
  
  // Search R&R stops
  async searchRNRStops(bounds, filters) {
    // Query: "rest stop" OR "R&R" OR "highway rest area"
  }
  
  // Search Petrol Stations
  async searchPetrolStations(bounds, filters) {
    // Query: "petrol station" OR "gas station" OR "fuel"
    // Type: gas_station
  }
}
```

**Integration:**
- Reuses `firestoreSearchService` logic
- Extends `distanceMatrixService` for detour calculation
- Uses same caching mechanism

#### 2.2 Update Route Index Service

**File:** `src/services/routeIndexService.js`

**Changes:**
- Update `extractRouteData()` to include places
- Update `indexRoute()` to save all place types
- Update `reconstructGoogleMapsRoute()` to include places data

---

### Phase 3: Search Logic Integration

#### 3.1 Update `findRestaurantsForAllRoutes`

**File:** `src/App.tsx`

**Current:**
```javascript
findRestaurantsForAllRoutes(routes, map) {
  // Only searches restaurants
}
```

**Updated:**
```javascript
findPlacesForAllRoutes(routes, map) {
  // Searches restaurants + R&R + Petrol
  // Returns: { restaurants: [...], rnr_stops: [...], petrol_stations: [...] }
}
```

**Flow:**
1. Check route_index for cached places
2. If cache hit, use cached data
3. If cache miss:
   - Search restaurants (existing logic)
   - Search R&R stops (new)
   - Search petrol stations (new)
   - Calculate detours for all types
   - Filter by thresholds
   - Cache all results in route_index

#### 3.2 Detour Calculation

**Reuse existing `distanceMatrixService`:**
- Same Haversine-first approach
- Same filtering logic
- Different thresholds per type:
  - Restaurants: 5km/30min
  - R&R: 5km/30min
  - Petrol: 5km/15min

---

### Phase 4: UI Components

#### 4.1 Type Filter Tabs

**Location:** Route Results component

**Design:**
```
┌─────────────────────────────────────────┐
│ [All] [🍽️ Restaurants] [🛣️ R&R] [⛽ Petrol] │
└─────────────────────────────────────────┘
```

**Functionality:**
- Default: "All" selected, shows restaurants first
- Click tab: Filter to show only that type
- State management: Track selected filter type

#### 4.2 Marker Icons

**Implementation:**
- Use emoji in marker label or custom icon
- Google Maps AdvancedMarkerElement supports emoji

**Colors:**
- Restaurant: Blue (#4285F4)
- R&R: Green (#34A853)
- Petrol: Orange (#FBBC04)

#### 4.3 Info Windows

**Structure:**
```javascript
{
  name: string,
  type: 'restaurant' | 'rnr' | 'petrol_station',
  distance: number,      // km
  duration: number,      // minutes
  address: string
}
```

**Modal:**
- Same structure as restaurant modal
- Type-specific fields:
  - R&R: No special fields (same as restaurant)
  - Petrol: Brand name (if available)

#### 4.4 Place List Component

**Display Logic:**
- Default: Show restaurants first, then R&R, then Petrol
- When tab selected: Show only that type
- Sort by distance (closest first)

---

### Phase 5: Google Places API Queries

#### 5.1 R&R Search Query

**API Call Frequency:** ✅ ONE-TIME (cached in route_index)
- First search: Google Places API call
- Subsequent searches: FREE (from Firestore cache)
- Same caching strategy as restaurants

**Query Strategy:** Use Google Places Type Filters (since it's one-time)
- **Type Filter:** `gas_station` is NOT used (that's for petrol)
- **Type Filter:** `establishment` + `point_of_interest`
- **Query Text:** Can use generic "restaurant" or "food" query, then filter by name/type
- **Alternative:** Use specific queries if type filter doesn't work well:
  - "rest stop"
  - "R&R"
  - "highway rest area"
  - "layby" (Malaysian term)

**Location Bias:**
- Route bounds
- Center: Route midpoint
- Radius: Route bounds + buffer

**Note:** Since API is called only once (then cached), we can use type filters. If type filters don't return good results, we'll use specific text queries.

#### 5.2 Petrol Station Search Query

**API Call Frequency:** ✅ ONE-TIME (cached in route_index)
- First search: Google Places API call
- Subsequent searches: FREE (from Firestore cache)
- Same caching strategy as restaurants

**Query Strategy:** Use Google Places Type Filters (since it's one-time)
- **Type Filter:** `gas_station` (primary - Google Places has this type)
- **Type Filter:** `establishment` (fallback)

**Location Bias:**
- Route bounds
- Center: Route midpoint
- Radius: Route bounds + buffer

**Brand Extraction:**
- Extract brand from name during normalization
- Common brands: Petronas, Shell, BHP, Caltex, Petron, etc.
- Save to `brand` field in database
- Example: "Petronas Station" → brand: "Petronas"

---

### Phase 6: State Management

#### 6.1 New State Variables

**In `App.tsx`:**
```javascript
const [availablePlaces, setAvailablePlaces] = useState({
  restaurants: [],
  rnr_stops: [],
  petrol_stations: []
});

const [selectedPlaceType, setSelectedPlaceType] = useState('all'); // 'all' | 'restaurant' | 'rnr' | 'petrol'
```

#### 6.2 Filtered Places

**Computed:**
```javascript
const getFilteredPlaces = () => {
  if (selectedPlaceType === 'all') {
    // Return all, sorted: restaurants first, then R&R, then Petrol
    return [
      ...availablePlaces.restaurants.map(r => ({...r, type: 'restaurant'})),
      ...availablePlaces.rnr_stops.map(r => ({...r, type: 'rnr'})),
      ...availablePlaces.petrol_stations.map(r => ({...r, type: 'petrol_station'}))
    ].sort((a, b) => a.detourDistanceKm - b.detourDistanceKm);
  } else {
    return availablePlaces[selectedPlaceType] || [];
  }
};
```

---

## 🔧 Technical Implementation Details

### API Calls Per Route

**First Search (Cache Miss):**
- 1x Google Directions API (route)
- 1x Google Places API (restaurants)
- 1x Google Places API (R&R stops)
- 1x Google Places API (petrol stations)
- **Total:** 4 API calls

**Subsequent Searches (Cache Hit):**
- 0x API calls (all from Firestore)
- **Total:** FREE

### Cost Optimization

1. **Route Caching:** Already implemented
2. **Place Caching:** Cache all types in route_index
3. **Bounds-based Search:** Use route bounds to limit search area
4. **Haversine Filtering:** Filter before Distance Matrix API

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
  → Search restaurants (API)
  → Search R&R stops (API)
  → Search petrol stations (API)
  → Calculate detours (Haversine)
  → Filter by thresholds
  → Save to route_index (cache)
  → Save individual places to collections
  → Return results
```

---

## 📝 Implementation Checklist

### Phase 1: Data Structure
- [ ] Create `rnr_stops` collection schema
- [ ] Create `petrol_stations` collection schema
- [ ] Update `route_index` schema to include `places` object
- [ ] Create Firestore indexes for new collections
- [ ] Update Firestore security rules

### Phase 2: Services
- [ ] Create `placeSearchService.js`
- [ ] Implement R&R search logic
- [ ] Implement Petrol search logic
- [ ] Update `routeIndexService.js` to handle all place types
- [ ] Update `distanceMatrixService.js` to support different thresholds

### Phase 3: Integration
- [ ] Update `findRestaurantsForAllRoutes` → `findPlacesForAllRoutes`
- [ ] Update route caching to include all place types
- [ ] Update route reconstruction to include places
- [ ] Test search flow end-to-end

### Phase 4: UI
- [ ] Create type filter tabs component
- [ ] Update marker creation to use emoji icons
- [ ] Update info window to show type
- [ ] Update place list to show all types
- [ ] Create/update modals for R&R and Petrol

### Phase 5: Testing
- [ ] Test R&R search on highway routes
- [ ] Test Petrol search on all route types
- [ ] Test caching mechanism
- [ ] Test filtering and tab switching
- [ ] Test marker display and clustering

---

## 🎯 Success Criteria

1. ✅ R&R stops discovered along routes
2. ✅ Petrol stations discovered along routes
3. ✅ All types cached in route_index
4. ✅ Tabs allow filtering by type
5. ✅ Different markers for each type
6. ✅ Proper filtering thresholds applied
7. ✅ No duplicate API calls (caching works)
8. ✅ Info windows show correct type
9. ✅ Modals work for all types

---

## 📊 Expected Results

**For a typical route (Penang → Malacca):**
- Restaurants: ~36 (current)
- R&R stops: ~3-5 (highway routes)
- Petrol stations: ~8-12 (all routes)

**API Cost:**
- First search: ~RM0.022 (Directions + 3x Places)
- Subsequent searches: FREE (cached)

**User Experience:**
- See all place types on map
- Filter by type using tabs
- Quick access to fuel and rest stops
- Prioritized restaurant display

