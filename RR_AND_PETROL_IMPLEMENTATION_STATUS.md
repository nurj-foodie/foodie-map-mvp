# R&R & Petrol Stations Implementation Status

## ✅ Completed

### 1. Core Services Created
- ✅ **`placeSearchService.js`** - Unified service for R&R and Petrol searches
  - `searchRNRStops()` - Searches R&R stops with type filters + name keywords
  - `searchPetrolStations()` - Searches petrol stations with `gas_station` type
  - `extractBrand()` - Extracts brand from petrol station names
  - Supports both NEW and LEGACY Google Places API
  - Auto-populates Firestore for future searches

### 2. Service Updates
- ✅ **`distanceMatrixService.js`** - Updated to support different thresholds
  - `getThresholdForType()` - Returns threshold based on place type
  - `calculateRouteDetours()` - Now accepts `placeType` parameter
  - Thresholds:
    - Restaurants: 5km/30min
    - R&R: 5km/30min
    - Petrol: 5km/15min

- ✅ **`routeIndexService.js`** - Updated to cache all place types
  - `indexRoute()` - Now accepts `places` parameter
  - Stores places in `route_index.places` object:
    ```javascript
    places: {
      restaurants: [...],
      rnr_stops: [...],
      petrol_stations: [...]
    }
    ```

### 3. App.tsx State Updates
- ✅ Added state variables for all place types:
  - `allRNRStops`, `allPetrolStations`
  - `filteredRNRStops`, `filteredPetrolStations`
  - `selectedPlaceType` - Filter by type ('all' | 'restaurant' | 'rnr' | 'petrol_station')

---

## 🚧 In Progress

### 4. App.tsx Function Updates
- ⏳ **`findRestaurantsForAllRoutes()`** → **`findPlacesForAllRoutes()`**
  - Need to search all 3 types in parallel
  - Calculate detours for each type with appropriate thresholds
  - Combine results and store in state
  - Update route caching to include all place types

---

## 📋 Remaining Tasks

### 5. UI Components
- [ ] Create type filter tabs component
  - [All] [🍽️ Restaurants] [🛣️ R&R] [⛽ Petrol]
- [ ] Update marker creation to use emoji icons
  - 🍽️ for restaurants
  - 🛣️ for R&R stops
  - ⛽ for petrol stations
- [ ] Update info windows to show type-specific info
- [ ] Update place list to show all types (restaurants first by default)

### 6. Route Caching
- [ ] Update route caching to save all place types
- [ ] Update route reconstruction to load all place types from cache

### 7. Firestore Setup
- [ ] Update Firestore security rules for new collections
- [ ] Create Firestore indexes if needed
- [ ] Test data structure

---

## 📝 Implementation Notes

### Brand Extraction
- Extracts from name: "Petronas Station" → "Petronas"
- Common brands: Petronas, Shell, BHP, Caltex, Petron
- Saved to `brand` field in database

### Search Strategy
- **R&R:** Type filter (`establishment`) + name keyword filtering
- **Petrol:** Type filter (`gas_station`) - straightforward
- Both: ONE-TIME API calls, then cached in Firestore

### Cost Analysis
- First search: ~RM0.056 (3x Places API calls)
- Subsequent searches: FREE (from Firestore cache)

---

## 🎯 Next Steps

1. Complete `findPlacesForAllRoutes()` function in App.tsx
2. Add UI tabs for filtering by type
3. Update markers to show different icons
4. Test end-to-end flow
5. Update Firestore rules and indexes

