# 📊 Search Analytics & Keyword Learning System

**Date:** 9 November 2025  
**Purpose:** How user search behavior during beta testing improves keyword recognition

---

## 🎯 Overview

During beta testing, every user search is tracked and analyzed to:
1. **Discover new keywords** (food items, locations, cuisines)
2. **Identify search patterns** (common compound queries)
3. **Find unrecognized queries** (potential new keywords to add)
4. **Improve suggestions** (popular searches, trending queries)
5. **Optimize search logic** (zero-result searches, filtering issues)

---

## 📈 What We Track

### **1. Search Query Data**
```javascript
{
  query: "sup tulang merah johor bahru",
  parsedLocation: "johor bahru",
  parsedFood: "sup tulang merah",
  parsedCuisine: null,
  parsedMealType: null,
  resultCount: 14,
  filters: { cuisineType: "all", minRating: 0 },
  timestamp: "2025-11-09T10:30:00Z",
  isCompound: true,
  hasLocation: true,
  hasFood: true
}
```

### **2. Keyword Statistics**
- **Search frequency** - How often each keyword is searched
- **Result counts** - Average results per keyword
- **Contexts** - How keywords are used in different queries
- **Recognition rate** - Percentage of times keyword is correctly parsed

### **3. Search Patterns**
- **Compound queries** - "food + location" patterns
- **Popular combinations** - Most common query types
- **Time-based trends** - Peak search times, days

### **4. Problem Queries**
- **Zero-result searches** - Queries that return no results
- **Unrecognized keywords** - Words that appear frequently but aren't in our database
- **Failed parsing** - Queries where parsing didn't work correctly

---

## 🔍 How It Helps Improve Keywords

### **1. Discover New Food Items**

**Example:**
```
User searches: "cendol penang"
System: Doesn't recognize "cendol" as food item
Analytics: Tracks "cendol" appearing 50+ times
Action: Add "cendol" to foodItems list
Result: Future searches for "cendol" are recognized ✅
```

**Analytics Query:**
```javascript
// Get unrecognized keywords that appear frequently
const unrecognized = await searchAnalyticsService.getUnrecognizedKeywords();
// Returns: [{ keyword: "cendol", count: 52 }, ...]
```

### **2. Identify New Locations**

**Example:**
```
User searches: "nasi lemak bangi"
System: Recognizes "nasi lemak" but not "bangi"
Analytics: Tracks "bangi" appearing 30+ times with location context
Action: Add "bangi" to locations list
Result: Future searches for "bangi" are geocoded correctly ✅
```

### **3. Learn Search Patterns**

**Example:**
```
Analytics shows:
- "laksa penang" - 200 searches
- "roti canai kl" - 150 searches
- "nasi lemak johor bahru" - 100 searches

Pattern: Users prefer "food + location" format
Action: Optimize suggestions to show this pattern
Result: Better autocomplete suggestions ✅
```

**Analytics Query:**
```javascript
// Get popular search patterns
const patterns = await searchAnalyticsService.getSearchPatterns();
// Returns: [
//   { pattern: "laksa + penang", count: 200 },
//   { pattern: "roti canai + kl", count: 150 },
//   ...
// ]
```

### **4. Fix Zero-Result Searches**

**Example:**
```
User searches: "ayam percik kelantan"
System: Returns 0 results
Analytics: Tracks this query
Analysis: "ayam percik" not in food items, "kelantan" not geocoded
Action: 
  1. Add "ayam percik" to foodItems
  2. Add "kelantan" to locations
  3. Improve geocoding for states
Result: Future searches return results ✅
```

**Analytics Query:**
```javascript
// Get zero-result searches
const zeroResults = await searchAnalyticsService.getZeroResultSearches();
// Returns: [
//   { query: "ayam percik kelantan", resultCount: 0, ... },
//   ...
// ]
```

### **5. Improve Suggestions**

**Example:**
```
Analytics shows popular searches:
1. "nasi lemak" - 500 searches
2. "kuala lumpur" - 400 searches
3. "halal chinese" - 300 searches

Action: Update popularSearches list
Result: Better default suggestions when input is empty ✅
```

**Analytics Query:**
```javascript
// Get popular searches (last 7 days)
const popular = await searchAnalyticsService.getPopularSearches(20, 7);
// Returns: [
//   { query: "nasi lemak", count: 500 },
//   { query: "kuala lumpur", count: 400 },
//   ...
// ]
```

---

## 📊 Analytics Dashboard (Future)

### **Key Metrics**

1. **Total Searches** - Total number of searches
2. **Compound Queries** - Percentage of compound queries
3. **Recognition Rate** - Percentage of queries correctly parsed
4. **Average Results** - Average results per search
5. **Zero-Result Rate** - Percentage of searches with no results

### **Reports**

1. **Top Unrecognized Keywords** - New keywords to add
2. **Popular Search Patterns** - Common query combinations
3. **Location Coverage** - Which locations are searched most
4. **Food Item Trends** - Most searched food items
5. **Time-Based Analysis** - Peak search times

---

## 🔄 Continuous Improvement Process

### **Weekly Review Process**

1. **Extract Analytics** (Monday)
   ```javascript
   // Get unrecognized keywords
   const unrecognized = await searchAnalyticsService.getUnrecognizedKeywords(50);
   
   // Get zero-result searches
   const zeroResults = await searchAnalyticsService.getZeroResultSearches(50);
   
   // Get popular patterns
   const patterns = await searchAnalyticsService.getSearchPatterns(20);
   ```

2. **Analyze Data** (Tuesday)
   - Review unrecognized keywords (appeared 5+ times)
   - Check zero-result searches for patterns
   - Identify new locations/food items

3. **Update Keywords** (Wednesday)
   ```javascript
   // Add new food items
   searchKeywordService.keywordCategories.foodItems.push('cendol', 'ayam percik');
   
   // Add new locations
   searchKeywordService.keywordCategories.locations.push('bangi', 'putrajaya');
   ```

4. **Test Updates** (Thursday)
   - Test new keywords with sample queries
   - Verify parsing works correctly
   - Check result quality

5. **Deploy** (Friday)
   - Deploy updated keyword database
   - Monitor analytics for improvements

---

## 💡 Example: Real Beta Testing Scenario

### **Week 1: Initial State**
- Food items: 30 items
- Locations: 50 locations
- Recognition rate: 60%

### **Week 2: Analytics Review**
**Unrecognized Keywords:**
- "cendol" - 52 searches
- "ayam percik" - 45 searches
- "bubur lambuk" - 38 searches
- "bangi" - 30 searches (location)

**Zero-Result Searches:**
- "cendol penang" - 25 searches, 0 results
- "ayam percik kelantan" - 20 searches, 0 results

**Action:** Add 4 new food items, 1 new location

### **Week 3: After Update**
- Food items: 34 items (+4)
- Locations: 51 locations (+1)
- Recognition rate: 75% (+15%)

### **Week 4: Continued Learning**
**New Unrecognized Keywords:**
- "roti jala" - 40 searches
- "nasi kerabu" - 35 searches
- "putrajaya" - 28 searches (location)

**Action:** Add 2 new food items, 1 new location

### **Result After 1 Month:**
- Food items: 50+ items (started with 30)
- Locations: 60+ locations (started with 50)
- Recognition rate: 85% (started at 60%)
- Zero-result rate: 5% (down from 15%)

---

## 🛠️ Implementation

### **1. Automatic Tracking**
Every search is automatically tracked:
```javascript
// In SearchTab.js handleSearch()
searchAnalyticsService.trackSearch(
  searchQuery,
  parsedQuery,
  results.length,
  filters
);
```

### **2. Batch Processing**
Searches are batched to reduce API calls:
- Batches of 10 searches
- Auto-flush after 5 seconds
- Offline support (localStorage)

### **3. Privacy**
- No personal data tracked
- Only search queries and results
- Aggregated statistics only
- User can opt-out (future feature)

---

## 📈 Success Metrics

### **Before Beta Testing:**
- Recognition rate: 60%
- Zero-result rate: 15%
- Food items: 30
- Locations: 50

### **After 3 Months Beta Testing:**
- Recognition rate: 90%+ (target)
- Zero-result rate: <5% (target)
- Food items: 100+ (target)
- Locations: 100+ (target)

---

## 🎯 Key Benefits

1. **Self-Improving System** - Gets better with more usage
2. **User-Driven** - Keywords come from real user needs
3. **Data-Driven Decisions** - Based on actual search patterns
4. **Continuous Learning** - Never stops improving
5. **Scalable** - Works for any number of users

---

## 🔮 Future Enhancements

1. **Machine Learning** - Auto-categorize unrecognized keywords
2. **Regional Variations** - Learn location-specific food names
3. **Trending Keywords** - Real-time trending food items
4. **Personalization** - Learn user preferences
5. **A/B Testing** - Test different parsing strategies

---

**Status:** ✅ **Implemented**  
**Last Updated:** 9 November 2025

