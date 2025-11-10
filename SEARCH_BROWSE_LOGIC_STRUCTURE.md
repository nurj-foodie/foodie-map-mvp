# 🔍 Search & Browse Logic Structure
## Current Implementation Overview

**Date:** 8 November 2025  
**Component:** `SearchTab.js`  
**Status:** Active Implementation

---

## 📊 HIGH-LEVEL ARCHITECTURE

```
SearchTab Component
├── 🔍 Search Tab (Active Tab: 'search')
│   ├── Search Input (text query)
│   ├── Filters (cuisine, rating, halal, distance, price, open now, near me)
│   └── Results Display
│
└── 🍽️ Browse Tab (Active Tab: 'browse')
    ├── Location Options (Near Me / All Areas)
    ├── Category Grid (10 cuisines)
    ├── Popular Restaurants Section
    ├── Trending Restaurants Section
    └── Saved Searches Section
```

---

## 🔍 SEARCH TAB LOGIC

### **Flow Overview:**

```
User Input → handleSearch() → enhancedSearchService.searchRestaurants()
    ↓
Firestore Search (firestoreSearchService)
    ↓
Text Filtering (if query provided)
    ↓
Additional Filters (rating, halal, price, etc.)
    ↓
Distance Calculation (if location available)
    ↓
Sorting
    ↓
Display Results
```

### **1. Search Input Handler** (`handleSearchInputChange`)

**Purpose:** Handle user typing in search input

**Logic:**
- User types in search input
- If query length >= 2 characters:
  - Get suggestions from `enhancedSearchService.getSearchSuggestions()`
  - Show suggestions dropdown
- If query length < 2:
  - Hide suggestions

**State Updates:**
- `searchQuery` - Current input text
- `suggestions` - Array of suggestion strings
- `showSuggestions` - Boolean to show/hide dropdown

---

### **2. Main Search Handler** (`handleSearch`)

**Purpose:** Execute search when user clicks search button or presses Enter

**Trigger Conditions:**
- User clicks search button (🔍)
- User presses Enter in search input
- User toggles "Near Me" filter (auto-searches)
- User changes filters (if query exists)

**Validation:**
```javascript
if (!searchQuery.trim() && 
    filters.cuisineType === 'all' && 
    filters.minRating === 0 && 
    !filters.nearMe) {
  return; // Don't search if nothing to search for
}
```

**Search Flow:**
1. **Save to History** - If query exists, save to search history
2. **Track Analytics** - Log search for analytics
3. **Determine Location:**
   - If `filters.nearMe === true` → Use `userLocation`
   - Otherwise → Use `null` (no location-based search)
4. **Call Search Service:**
   ```javascript
   enhancedSearchService.searchRestaurants(
     searchQuery,      // Text query (e.g., "Nasi Lemak", "Kuala Lumpur")
     searchFilters,    // Filter object (cuisine, rating, halal, etc.)
     locationToUse    // User location or null
   )
   ```
5. **Display Results** - Update `searchResults` state
6. **Hide UI Elements** - Hide suggestions and search history

---

### **3. Enhanced Search Service** (`enhancedSearchService.searchRestaurants`)

**Location:** `foodie-simple/src/services/enhancedSearchService.js`

**Purpose:** Orchestrate search with multiple strategies

**Search Strategy:**

#### **Step 1: Determine Search Location**
```javascript
// If Near Me filter enabled:
searchCenter = userLocation

// If query looks like location (e.g., "Kuala Lumpur"):
searchCenter = geocode(query)

// If no location:
searchCenter = null (search all areas)
```

#### **Step 2: Calculate Search Bounds**
```javascript
// If location exists:
bounds = {
  north: searchCenter.lat + radius,
  south: searchCenter.lat - radius,
  east: searchCenter.lng + radius,
  west: searchCenter.lng - radius
}

// If no location:
bounds = null (search all Firestore)
```

#### **Step 3: Firestore Search** (`firestoreSearchService.searchRestaurants`)
```javascript
// Query Firestore with bounds and filters:
- foodType: filters.cuisineType
- minRating: filters.minRating
- halalOnly: filters.halalStatus === 'halal'
- openNow: filters.openNow
```

**Firestore Search Flow:**
1. Query Firestore `eateries` collection
2. If results found → Return results
3. If no results → Fallback to Google Places API
4. Auto-populate Firestore with Google results

#### **Step 4: Text-Based Filtering**
```javascript
// If searchQuery provided and NOT a location query:
filteredResults = filterByTextQuery(results, searchQuery)

// Text matching:
- Restaurant name contains query
- Cuisine type contains query
- Address contains query
```

#### **Step 5: Apply Additional Filters**
```javascript
// Filter by:
- Price range (filters.priceRange)
- Distance (if location available)
- Other filters not handled by Firestore
```

#### **Step 6: Calculate Distances**
```javascript
// If searchCenter exists:
restaurant.distanceFromUser = calculateDistance(
  searchCenter, 
  restaurant.location
)
```

#### **Step 7: Sort Results**
```javascript
// Sort by:
- rating (default)
- distance
- newest
- mostReviews
- price_low / price_high
```

---

### **4. Filter System**

**Filter State:**
```javascript
filters = {
  cuisineType: 'all',      // 'all' or specific cuisine
  minRating: 0,            // 0, 3, 3.5, 4, 4.5
  halalStatus: 'all',      // 'all', 'halal', 'pork-free', 'non-halal'
  distance: 10,            // km (1, 5, 10, 25, 50)
  priceRange: 'all',       // 'all', '$', '$$', '$$$', '$$$$'
  openNow: false,          // boolean
  nearMe: false,           // boolean (NEW)
  sortBy: 'rating'         // 'rating', 'distance', 'newest', etc.
}
```

**Filter Handlers:**

1. **`handleFilterChange(filterName, value)`**
   - Updates specific filter
   - Does NOT auto-search (user must click search)

2. **`handleNearMeToggle(enabled)`**
   - Special handler for Near Me filter
   - Requests location permission if needed
   - Auto-sets distance to 5km
   - **Auto-searches** if query exists or filter enabled

3. **`clearFilters()`**
   - Resets all filters to defaults
   - Clears search query
   - Clears results

**Active Filter Chips:**
- Shows active filters as removable chips
- Near Me chip appears when `filters.nearMe === true`
- Distance chip hidden when Near Me is active (redundant)

---

## 🍽️ BROWSE TAB LOGIC

### **Flow Overview:**

```
Browse Tab → User Clicks Section → Load Data → Display Results
```

### **1. Location Options**

**Purpose:** Choose search scope (Near Me vs All Areas)

**Options:**
- **📍 Near Me** - Search within 5km of user location
- **🌍 All Areas** - Search all restaurants (no location filter)

**Logic:**
```javascript
// Near Me Button Click:
1. Request location permission (if not available)
2. Call enhancedSearchService.searchRestaurants('', filters, userLocation)
3. Set searchQuery = 'Near Me'
4. Display results in Browse tab

// All Areas Button Click:
1. Clear searchResults
2. Clear searchQuery
3. Reset browseLocation = 'all'
```

**State:**
- `browseLocation` - 'nearMe' or 'all'

---

### **2. Category Grid**

**Purpose:** Browse restaurants by cuisine type

**Categories:** 10 cuisine types (Malay, Chinese, Indian, Western, etc.)

**Logic:**
```javascript
// Category Click (handleCategorySearch):
1. Set searchQuery = category.name (e.g., "Malay")
2. Set filters.cuisineType = category.name
3. Save to search history
4. Call enhancedSearchService.searchRestaurants(category.name, filters, userLocation)
5. Switch to Search tab (setActiveTab('search'))
6. Display results
```

**Note:** Category search switches to Search tab to show results with full filter options

---

### **3. Popular Restaurants Section**

**Purpose:** Display curated popular restaurants

**Logic:**
```javascript
// Load Popular (loadPopularRestaurants):
1. Call enhancedSearchService.getPopularRestaurants(userLocation)
2. Set searchQuery = 'Popular Restaurants'
3. Display results in Browse tab

// Display Logic:
- If loading: Show "Loading popular restaurants..."
- If results exist: Show restaurant cards (max 6)
- If no results: Show "Load Popular Restaurants" button
```

**Service Method:** `enhancedSearchService.getPopularRestaurants()`
- Returns restaurants sorted by rating and review count
- Filters by location if userLocation provided

---

### **4. Trending Restaurants Section**

**Purpose:** Display restaurants gaining popularity

**Logic:**
```javascript
// Load Trending (loadTrendingRestaurants):
1. Call enhancedSearchService.getTrendingRestaurants(userLocation)
2. Set searchQuery = 'Trending Restaurants'
3. Display results in Browse tab

// Display Logic:
- If loading: Show "Loading trending restaurants..."
- If results exist: Show restaurant cards (max 6)
- If no results: Show "Load Trending Restaurants" button
```

**Service Method:** `enhancedSearchService.getTrendingRestaurants()`
- Returns restaurants sorted by recent activity
- Filters by location if userLocation provided

---

### **5. Saved Searches Section**

**Purpose:** Display and manage saved search queries

**Logic:**
```javascript
// Load Saved Search:
1. Load from localStorage
2. Display as cards with:
   - Search name
   - Query text
   - Date saved
   - Result count

// Load Button Click:
1. Restore searchQuery and filters from saved search
2. Switch to Search tab
3. Auto-execute search
```

**Storage:** `localStorage.getItem('savedSearches')`

---

## 🔄 KEY DIFFERENCES: SEARCH vs BROWSE

### **Search Tab:**
- ✅ **User-driven** - User types query or applies filters
- ✅ **Explicit search** - User clicks search button
- ✅ **Full filter control** - All filters available
- ✅ **Results in Search tab** - Results displayed below filters
- ✅ **Text-based search** - Searches restaurant names, cuisines, locations

### **Browse Tab:**
- ✅ **Discovery-driven** - User browses without typing
- ✅ **Implicit search** - Clicking category/button triggers search
- ✅ **Limited filters** - Filters applied but not prominently displayed
- ✅ **Results in Browse tab** - Results shown in sections
- ✅ **Category-based** - Searches by cuisine type or curated lists

---

## 📝 SEARCH QUERY TYPES

### **1. Text Query**
- **Example:** "Nasi Lemak", "McDonald's", "Halal Chinese"
- **Logic:** Text-based filtering on restaurant names, cuisines, addresses
- **Service:** `enhancedSearchService.filterByTextQuery()`

### **2. Location Query**
- **Example:** "Kuala Lumpur", "Subang Jaya"
- **Logic:** Geocodes location, searches restaurants in that area
- **Service:** Geocoding API → Search in bounds

### **3. Category Query**
- **Example:** "Malay", "Chinese"
- **Logic:** Sets `filters.cuisineType` and searches
- **Service:** `enhancedSearchService.searchRestaurants(categoryName, filters)`

### **4. Special Queries**
- **"Near Me"** - Location-based search (5km radius)
- **"Popular Restaurants"** - Curated popular list
- **"Trending Restaurants"** - Curated trending list

---

## 🗂️ DATA FLOW

### **Search Flow:**
```
User Input
  ↓
handleSearch()
  ↓
enhancedSearchService.searchRestaurants(query, filters, location)
  ↓
firestoreSearchService.searchRestaurants(bounds, filters)
  ↓
[Firestore Query OR Google Places API]
  ↓
Text Filtering (if query provided)
  ↓
Additional Filters
  ↓
Distance Calculation
  ↓
Sorting
  ↓
searchResults State
  ↓
Display in UI
```

### **Browse Flow:**
```
User Clicks Category/Button
  ↓
handleCategorySearch() OR loadPopularRestaurants() OR loadTrendingRestaurants()
  ↓
enhancedSearchService.searchRestaurants() OR getPopularRestaurants() OR getTrendingRestaurants()
  ↓
[Same search flow as above]
  ↓
searchResults State
  ↓
Display in Browse Tab Sections
```

---

## 🎯 CURRENT ISSUES / OBSERVATIONS

### **1. Text Filtering Too Strict**
- **Issue:** Searching "mc" returns 0 results even though restaurants with "Mc" in name exist
- **Cause:** Text filtering might be case-sensitive or too strict
- **Location:** `enhancedSearchService.filterByTextQuery()`

### **2. Browse Tab Results Logic**
- **Issue:** Popular/Trending sections check `searchQuery === 'Popular Restaurants'` to display results
- **Problem:** If user searches something else, results disappear from Browse tab
- **Solution Needed:** Separate state for Browse tab results vs Search tab results

### **3. Category Search Switches Tabs**
- **Current:** Clicking category switches to Search tab
- **Question:** Should it stay in Browse tab or switch?

### **4. Near Me in Browse vs Search**
- **Search Tab:** Near Me is a filter (checkbox)
- **Browse Tab:** Near Me is a location option (button)
- **Question:** Should they work the same way?

---

## 💡 RECOMMENDATIONS FOR DISCUSSION

1. **Separate Results State:**
   - `searchResults` - For Search tab
   - `browseResults` - For Browse tab sections
   - Prevents conflicts when switching tabs

2. **Improve Text Filtering:**
   - Make case-insensitive
   - Partial word matching (e.g., "mc" matches "McDonald's")
   - Fuzzy matching for typos

3. **Category Search Behavior:**
   - Option A: Stay in Browse tab, show results in section
   - Option B: Switch to Search tab (current)
   - Option C: Show results in both tabs

4. **Near Me Consistency:**
   - Should Browse tab "Near Me" button also set the filter in Search tab?
   - Should they share the same state?

---

**Created:** 8 November 2025  
**Last Updated:** 8 November 2025  
**Status:** Active - Ready for Discussion

