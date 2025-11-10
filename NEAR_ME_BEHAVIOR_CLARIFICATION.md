# 📍 Near Me Behavior Clarification

## Current Behavior

### **Search Tab:**
- Near Me is a **filter checkbox**
- When enabled: Sets `filters.nearMe = true` and `filters.distance = 5`
- Auto-searches if query exists
- Results shown in Search tab

### **Browse Tab:**
- Near Me is a **location option button**
- When clicked: Searches restaurants within 5km
- Sets `searchResults` (shared state)
- Sets `searchQuery = 'Near Me'`
- Results shown in Browse tab (but uses same `searchResults` state)

---

## Question: What Should Happen?

### **Option A: Independent Behavior (Current)**
- Browse tab "Near Me" button → Shows results in Browse tab only
- Search tab "Near Me" filter → Shows results in Search tab only
- They don't affect each other

### **Option B: Synced Behavior**
- Browse tab "Near Me" button → Also sets Search tab filter to enabled
- Search tab "Near Me" filter → Also updates Browse tab location option
- They share the same state

### **Option C: Switch to Search Tab**
- Browse tab "Near Me" button → Switches to Search tab and shows results there
- Browse tab is just for discovery, Search tab is for results

---

## Recommendation

**Option A (Independent)** seems best because:
- Browse tab is for discovery/browsing
- Search tab is for active searching
- They serve different purposes
- No confusion about where results appear

**BUT** - We need to separate the results state to avoid conflicts!

---

## Implementation Plan

1. **Separate Results State:**
   - `searchResults` - For Search tab
   - `browseResults` - For Browse tab sections
   - `browseLocationResults` - For Browse tab "Near Me" results

2. **Near Me in Browse Tab:**
   - Click "Near Me" → Search restaurants within 5km
   - Store results in `browseLocationResults`
   - Display in Browse tab (maybe in a new section or replace location options)
   - Does NOT set Search tab filter
   - Does NOT switch to Search tab

3. **Near Me in Search Tab:**
   - Toggle filter → Search with location
   - Store results in `searchResults`
   - Display in Search tab
   - Does NOT affect Browse tab

---

**Your Question:** "does this mean when tap the near me it fallback to search result?"

**Answer:** Currently yes - it uses the same `searchResults` state, which causes conflicts. After separating states, Browse tab "Near Me" will show results in Browse tab only, not in Search tab.

