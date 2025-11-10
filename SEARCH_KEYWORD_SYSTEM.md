# 🔍 Search Keyword & Suggestion System

**Date:** 9 November 2025  
**Purpose:** Intelligent keyword recognition and search suggestions (like Google Search)

---

## 🎯 Overview

This system provides **intelligent keyword recognition** and **smart search suggestions** similar to Google Search. It helps users understand what they can search for and provides relevant suggestions as they type.

---

## 🧠 How It Works

### **1. Keyword Recognition**

The system automatically recognizes what type of search query the user is entering:

| Type | Examples | Recognition Logic |
|------|----------|------------------|
| **📍 Location** | "Kuala Lumpur", "Penang", "Semporna" | Matches against location keywords list |
| **🍽️ Food Item** | "Nasi Lemak", "Roti Canai", "Kopi" | Matches against food items list |
| **🌍 Cuisine** | "Malay", "Chinese", "Halal" | Matches against cuisine types |
| **🏪 Restaurant** | "McDonald's", "KFC", "Starbucks" | Matches against restaurant chains |
| **🔍 Unknown** | Random text | Default fallback |

### **2. Intelligent Suggestions**

When user types, the system provides suggestions from multiple sources:

1. **Firestore Restaurant Names** - Real restaurant names from database
2. **Firestore Locations** - Real locations from `location_index` collection
3. **Keyword Database** - Predefined food items, cuisines, locations
4. **Popular Searches** - Most searched queries (from analytics)

### **3. Search Hints**

When search input is empty or focused, shows helpful hints:
- 📍 "Search by location: 'Kuala Lumpur', 'Penang'"
- 🍽️ "Search by food: 'Nasi Lemak', 'Roti Canai'"
- 🏪 "Search by restaurant: 'McDonald's', 'KFC'"
- 🌍 "Search by cuisine: 'Halal Chinese', 'Malay'"

---

## 📊 Keyword Categories

### **Locations** (50+ locations)
- Major cities: Kuala Lumpur, Penang, Johor Bahru, etc.
- States: Selangor, Johor, Pahang, etc.
- Islands: Langkawi, Tioman, Redang, etc.
- Small towns: Semporna, Tawau, Paloh, etc.

### **Food Items** (30+ items)
- Malaysian: Nasi Lemak, Roti Canai, Char Kway Teow, Laksa
- Beverages: Kopi, Teh Tarik, Milo
- Snacks: Karipap, Curry Puff, Murtabak

### **Cuisines** (10+ types)
- Malay, Chinese, Indian, Western
- Japanese, Korean, Thai, Italian
- Fast Food, Cafe

### **Restaurant Chains** (10+ chains)
- McDonald's, KFC, Pizza Hut, Subway
- Starbucks, Secret Recipe, Old Town

---

## 🔄 Search Flow with Keywords

### **Example 1: User types "kopi"**

```
1. User types: "kopi"
   ↓
2. Keyword Recognition:
   - Type: 🍽️ Food Item
   - Confidence: High
   ↓
3. Suggestions Generated:
   - "Kopi O" (keyword match)
   - "Kopi Ais" (keyword match)
   - "Kedai Kopi Stesen" (restaurant name match)
   ↓
4. Search Logic:
   - ✅ Recognized as food item
   - ❌ Skip geocoding
   - 🔍 Search broadly for restaurants serving kopi
   - 📊 Apply text filtering
```

### **Example 2: User types "kuala"**

```
1. User types: "kuala"
   ↓
2. Keyword Recognition:
   - Type: 📍 Location
   - Confidence: High
   ↓
3. Suggestions Generated:
   - "Kuala Lumpur" (location match)
   - "Kuala Lipis" (location match)
   - "Kuala Terengganu" (location match)
   ↓
4. Search Logic:
   - ✅ Recognized as location
   - ✅ Geocode "Kuala Lumpur"
   - 🔍 Search restaurants in that location
   - 📊 Don't apply text filtering (location already correct)
```

---

## 💡 Features

### **1. Smart Suggestions**
- Combines multiple data sources
- Prioritizes most relevant matches
- Removes duplicates
- Caches results for performance

### **2. Typo Correction**
- Detects common typos
- Suggests corrections (e.g., "nasilemak" → "nasi lemak")
- Simple Levenshtein distance check

### **3. Category Badges**
- Shows what type of search it is
- Visual indicators: 📍 Location, 🍽️ Food, 🌍 Cuisine, 🏪 Restaurant

### **4. Popular Searches**
- Shows trending searches
- Updates from analytics
- Helps users discover popular options

---

## 🎨 UI Integration

### **Search Input with Suggestions**

```
┌─────────────────────────────────────┐
│ [Search: "kopi"              ] [🔍] │
├─────────────────────────────────────┤
│ 💡 Suggestions:                      │
│   🍽️ Kopi O                          │
│   🍽️ Kopi Ais                        │
│   🏪 Kedai Kopi Stesen               │
│   🔥 Kopi (Popular)                  │
└─────────────────────────────────────┘
```

### **Search Hints (when empty)**

```
┌─────────────────────────────────────┐
│ [Search: ""                   ] [🔍] │
├─────────────────────────────────────┤
│ 💡 What can you search?              │
│   📍 Search by location               │
│   🍽️ Search by food                  │
│   🏪 Search by restaurant            │
│   🌍 Search by cuisine               │
└─────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### **Service: `searchKeywordService.js`**

**Key Methods:**
- `recognizeKeywordType(query)` - Detects search type
- `getIntelligentSuggestions(query, maxResults)` - Gets smart suggestions
- `getSearchHints()` - Returns search hints
- `suggestCorrection(query)` - Suggests typo corrections
- `getSearchCategoryBadge(query)` - Returns category badge

**Data Sources:**
1. Firestore `eateries` collection (restaurant names)
2. Firestore `location_index` collection (locations)
3. Keyword database (food items, cuisines, chains)
4. Popular searches (from analytics)

**Caching:**
- 5-minute cache for suggestions
- Reduces Firestore queries
- Improves performance

---

## 📈 Future Enhancements

### **1. Machine Learning**
- Learn from user searches
- Improve keyword recognition
- Personalize suggestions

### **2. Analytics Integration**
- Track popular searches
- Update keyword database automatically
- A/B test suggestion algorithms

### **3. Advanced Typo Correction**
- Use fuzzy matching algorithms
- Learn common typos
- Suggest corrections in real-time

### **4. Voice Search**
- Voice-to-text integration
- Keyword recognition from voice
- Natural language processing

---

## 🎯 Benefits

1. **Better UX** - Users understand what they can search
2. **Faster Searches** - Suggestions help users find what they want quickly
3. **Fewer Errors** - Typo correction prevents failed searches
4. **Discovery** - Popular searches help users discover new options
5. **Intelligence** - System understands user intent (location vs food vs restaurant)

---

## 📝 Usage Example

```javascript
import { searchKeywordService } from '../services/searchKeywordService';

// Recognize keyword type
const recognition = searchKeywordService.recognizeKeywordType("nasi lemak");
// Returns: { type: 'food', confidence: 0.9 }

// Get intelligent suggestions
const suggestions = await searchKeywordService.getIntelligentSuggestions("nas", 5);
// Returns: [
//   { text: "Nasi Lemak", type: "food", icon: "🍽️", source: "keywords" },
//   { text: "Nasi Goreng", type: "food", icon: "🍽️", source: "keywords" },
//   ...
// ]

// Get search hints
const hints = searchKeywordService.getSearchHints();
// Returns helpful search examples

// Suggest correction
const correction = searchKeywordService.suggestCorrection("nasilemak");
// Returns: "nasi lemak"
```

---

**Status:** ✅ **Implemented**  
**Last Updated:** 9 November 2025

