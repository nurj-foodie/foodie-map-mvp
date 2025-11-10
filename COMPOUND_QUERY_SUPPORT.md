# 🔍 Compound Query Support

**Date:** 9 November 2025  
**Purpose:** Support for complex search queries combining multiple keywords (food + location, cuisine + location, meal type + location)

---

## 🎯 Overview

The system now supports **compound queries** that combine multiple search terms, similar to Google Search. Users can search for:
- **Food + Location**: "roti canai petaling jaya"
- **Cuisine + Location**: "western johor bahru"
- **Meal Type + Location**: "breakfast kluang"
- **Food Only**: "roti canai"
- **Location Only**: "petaling jaya"

---

## 🧠 How It Works

### **1. Query Parsing**

The `searchKeywordService.parseCompoundQuery()` method intelligently extracts multiple keywords from a single query:

```javascript
// Example: "roti canai petaling jaya"
{
  original: "roti canai petaling jaya",
  location: "petaling jaya",
  food: "roti canai",
  cuisine: null,
  restaurant: null,
  mealType: null,
  remaining: ""
}
```

### **2. Search Flow**

#### **Example: "roti canai petaling jaya"**

```
1. Parse Query:
   ✅ Location: "petaling jaya"
   ✅ Food: "roti canai"
   
2. Determine Search Location:
   📍 Geocode "petaling jaya" → Get coordinates
   📍 Create search bounds (25km radius)
   
3. Search Google Places:
   🔍 Query: "roti canai restaurant petaling jaya"
   📍 Location bias: Petaling Jaya coordinates
   
4. Filter Results:
   🔍 Filter by "roti canai" (location already correct)
   ✅ Return restaurants serving roti canai in Petaling Jaya
```

#### **Example: "breakfast kluang"**

```
1. Parse Query:
   ✅ Location: "kluang"
   ✅ Meal Type: "breakfast"
   
2. Determine Search Location:
   📍 Geocode "kluang" → Get coordinates
   📍 Create search bounds (25km radius)
   
3. Search Google Places:
   🔍 Query: "breakfast restaurant kluang"
   📍 Location bias: Kluang coordinates
   
4. Filter Results:
   🔍 Filter by "breakfast" (location already correct)
   ✅ Return breakfast restaurants in Kluang
```

#### **Example: "western johor bahru"**

```
1. Parse Query:
   ✅ Location: "johor bahru"
   ✅ Cuisine: "western"
   
2. Determine Search Location:
   📍 Geocode "johor bahru" → Get coordinates
   📍 Create search bounds (25km radius)
   
3. Auto-Update Filters:
   🍽️ Set cuisineType filter to "Western"
   
4. Search Google Places:
   🔍 Query: "western restaurant johor bahru"
   📍 Location bias: Johor Bahru coordinates
   
5. Filter Results:
   🔍 Filter by "western" (location already correct)
   ✅ Return Western restaurants in Johor Bahru
```

---

## 📊 Supported Keyword Types

### **Locations** (50+ locations)
- Major cities: Kuala Lumpur, Penang, Johor Bahru, etc.
- States: Selangor, Johor, Pahang, etc.
- Islands: Langkawi, Tioman, Redang, etc.
- Small towns: Semporna, Tawau, Paloh, Kluang, etc.

### **Food Items** (30+ items)
- Malaysian: Nasi Lemak, Roti Canai, Char Kway Teow, Laksa
- Beverages: Kopi, Teh Tarik, Milo
- Snacks: Karipap, Curry Puff, Murtabak

### **Cuisines** (10+ types)
- Malay, Chinese, Indian, Western
- Japanese, Korean, Thai, Italian
- Fast Food, Cafe

### **Meal Types** (6 types)
- Breakfast, Lunch, Dinner
- Brunch, Supper
- Sarapan, Makan Tengah Hari, Makan Malam

---

## 🔄 Search Logic

### **Priority Order**

1. **Parsed Location** (from compound query)
2. **Geocoded Location** (if parsing didn't find location)
3. **Predefined Location** (if geocoding failed)
4. **User Location** (if available)
5. **Default** (Malaysia center)

### **Text Filtering Strategy**

| Query Type | Filter Strategy |
|------------|----------------|
| **Location Only** | ❌ No text filtering (location already correct) |
| **Food + Location** | ✅ Filter by food item only |
| **Cuisine + Location** | ✅ Filter by cuisine only |
| **Meal Type + Location** | ✅ Filter by meal type only |
| **Food Only** | ✅ Filter by food item |
| **Cuisine Only** | ✅ Filter by cuisine |

### **Google Places Query Building**

The system builds intelligent queries for Google Places API:

| Compound Query | Google Places Query |
|----------------|---------------------|
| "roti canai petaling jaya" | "roti canai restaurant petaling jaya" |
| "breakfast kluang" | "breakfast restaurant kluang" |
| "western johor bahru" | "western restaurant johor bahru" |
| "nasi lemak" | "nasi lemak restaurant" |

---

## 💡 Features

### **1. Smart Parsing**
- Extracts multiple keywords from single query
- Handles longest matches first (e.g., "johor bahru" vs "johor")
- Removes extracted keywords from remaining text

### **2. Location Detection**
- Prioritizes parsed location from compound query
- Falls back to geocoding if parsing fails
- Uses predefined locations for known cities

### **3. Auto-Filter Updates**
- Automatically sets cuisine filter if cuisine detected in query
- Example: "western johor bahru" → Sets `cuisineType: "Western"`

### **4. Intelligent Filtering**
- Only filters by relevant keywords (not location)
- Prevents double-filtering
- Optimizes search results

---

## 🎨 Example Queries

### **✅ Supported Queries**

1. **"roti canai petaling jaya"**
   - Finds: Restaurants serving roti canai in Petaling Jaya
   - Location: Petaling Jaya (geocoded)
   - Filter: "roti canai"

2. **"breakfast kluang"**
   - Finds: Breakfast restaurants in Kluang
   - Location: Kluang (geocoded)
   - Filter: "breakfast"

3. **"western johor bahru"**
   - Finds: Western restaurants in Johor Bahru
   - Location: Johor Bahru (geocoded)
   - Filter: "western"
   - Auto-filter: Sets `cuisineType: "Western"`

4. **"nasi lemak"**
   - Finds: Restaurants serving nasi lemak (anywhere)
   - Location: User location or broad search
   - Filter: "nasi lemak"

5. **"petaling jaya"**
   - Finds: All restaurants in Petaling Jaya
   - Location: Petaling Jaya (geocoded)
   - Filter: None (location only)

---

## 🔧 Technical Implementation

### **Key Methods**

1. **`searchKeywordService.parseCompoundQuery(query)`**
   - Parses compound query into components
   - Returns: `{ location, food, cuisine, restaurant, mealType, remaining }`

2. **`enhancedSearchService.searchRestaurants(query, filters, userLocation)`**
   - Uses parsed query to determine search strategy
   - Builds custom Google Places query for compound searches
   - Applies intelligent filtering

3. **`firestoreSearchService.searchRestaurants(bounds, filters, forceGooglePlaces, customTextQuery)`**
   - Accepts custom text query for compound searches
   - Passes to Google Places API

### **Files Modified**

1. **`searchKeywordService.js`**
   - Added `parseCompoundQuery()` method
   - Added `mealTypes` keyword category
   - Added "kluang" to locations

2. **`enhancedSearchService.js`**
   - Integrated compound query parsing
   - Enhanced location detection (prioritizes parsed location)
   - Auto-updates filters for cuisine detection
   - Builds custom Google Places queries
   - Smart filtering for compound queries

3. **`firestoreSearchService.js`**
   - Added `customTextQuery` parameter
   - Passes custom query to Google Places API
   - Supports compound query searches

---

## 📈 Benefits

1. **Natural Language Search** - Users can search like they talk
2. **Better Results** - Combines location and food/cuisine for precise results
3. **Flexible Queries** - Supports multiple query formats
4. **Smart Filtering** - Only filters by relevant keywords
5. **Auto-Detection** - Automatically detects and applies filters

---

## 🎯 Usage Examples

```javascript
// User searches: "roti canai petaling jaya"
// System:
// 1. Parses: { food: "roti canai", location: "petaling jaya" }
// 2. Geocodes: Petaling Jaya → coordinates
// 3. Searches: "roti canai restaurant petaling jaya" in Petaling Jaya area
// 4. Filters: By "roti canai" only (location already correct)
// 5. Returns: Restaurants serving roti canai in Petaling Jaya

// User searches: "breakfast kluang"
// System:
// 1. Parses: { mealType: "breakfast", location: "kluang" }
// 2. Geocodes: Kluang → coordinates
// 3. Searches: "breakfast restaurant kluang" in Kluang area
// 4. Filters: By "breakfast" only (location already correct)
// 5. Returns: Breakfast restaurants in Kluang

// User searches: "western johor bahru"
// System:
// 1. Parses: { cuisine: "western", location: "johor bahru" }
// 2. Geocodes: Johor Bahru → coordinates
// 3. Auto-sets: cuisineType filter = "Western"
// 4. Searches: "western restaurant johor bahru" in Johor Bahru area
// 5. Filters: By "western" only (location already correct)
// 6. Returns: Western restaurants in Johor Bahru
```

---

**Status:** ✅ **Implemented**  
**Last Updated:** 9 November 2025

