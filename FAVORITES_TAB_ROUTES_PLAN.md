# FavoritesTab - Saved Routes Integration Plan

## Current FavoritesTab Structure

```
⭐ Your Favorites
[Number] saved restaurants

[Favorite Restaurant Cards]
- Restaurant Name
- Address
- Rating
- [Details Button] [⭐ Favorite Button]
```

## Proposed UI Design: Option A - Tabbed Interface

### Visual Layout:

```
┌─────────────────────────────────────────┐
│  ⭐ Your Favorites                      │
│  [Number] saved restaurants             │
├─────────────────────────────────────────┤
│  [Favorites Tab] [Saved Routes Tab]    │ ← New tabs
├─────────────────────────────────────────┤
│                                         │
│  [Content based on selected tab]       │
│                                         │
└─────────────────────────────────────────┘
```

### Tab 1: "Favorites" (Current Content)
- Shows favorite restaurants (existing functionality)
- No changes needed

### Tab 2: "Saved Routes" (New Section)
- Shows saved routes as cards similar to favorite restaurants
- Each route card displays:
  ```
  ┌─────────────────────────────────────┐
  │ Route Name                          │
  │ 🚀 Start: Kuala Lumpur             │
  │ 🏁 End: Port Dickson               │
  │ 🍽️ Stops: 3 restaurants            │
  │ 📏 Distance: 95 km                 │
  │ ⏱️ Duration: 1h 20min              │
  │ 📅 Saved: Nov 7, 2025              │
  │                                     │
  │ [🔄 Load Route] [🗑️ Delete]       │
  └─────────────────────────────────────┘
  ```

## Alternative: Option B - Quick Access Button

### Visual Layout:

```
┌─────────────────────────────────────────┐
│  ⭐ Your Favorites                      │
│  [Number] saved restaurants             │
│                                         │
│  [📚 My Saved Routes] ← New button    │ ← Quick access
│                                         │
│  [Favorite Restaurant Cards]            │
│  ...                                    │
└─────────────────────────────────────────┘
```

**When clicked:** Opens the same modal that appears in RouteResults

## Alternative: Option C - Collapsible Section

### Visual Layout:

```
┌─────────────────────────────────────────┐
│  ⭐ Your Favorites                      │
│  [Number] saved restaurants             │
│                                         │
│  ▼ 📚 Saved Routes (3) ← Collapsible   │ ← New section
│  ┌─────────────────────────────────┐  │
│  │ Route 1: KL → PD                 │  │
│  │ Route 2: JB → KL                 │  │
│  │ Route 3: Penang → KL             │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Favorite Restaurant Cards]            │
│  ...                                    │
└─────────────────────────────────────────┘
```

## Recommendation: Option A (Tabbed Interface)

### Why Option A?
1. ✅ **Consistent UX** - Matches the tab pattern used in RouteResults
2. ✅ **Clear Separation** - Favorites and Routes are distinct concepts
3. ✅ **Easy Navigation** - Users can quickly switch between views
4. ✅ **Scalable** - Easy to add more tabs in the future (e.g., "Recent Routes")
5. ✅ **Mobile Friendly** - Tabs work well on mobile devices

### Implementation Details:

1. **Add Tab State:**
   ```javascript
   const [activeTab, setActiveTab] = useState('favorites');
   ```

2. **Tab Buttons:**
   ```jsx
   <div className="favorites-tabs">
     <button 
       className={activeTab === 'favorites' ? 'active' : ''}
       onClick={() => setActiveTab('favorites')}
     >
       ⭐ Favorites ({favoriteRestaurants.length})
     </button>
     <button 
       className={activeTab === 'routes' ? 'active' : ''}
       onClick={() => setActiveTab('routes')}
     >
       📚 Saved Routes ({savedRoutes.length})
     </button>
   </div>
   ```

3. **Conditional Content:**
   ```jsx
   {activeTab === 'favorites' && (
     // Current favorites list
   )}
   
   {activeTab === 'routes' && (
     // New saved routes list
   )}
   ```

4. **Props Needed from App.tsx:**
   - `savedRoutes` - Array of saved routes
   - `onLoadRoute` - Function to load a route
   - `onDeleteRoute` - Function to delete a route
   - `onShowSavedRoutes` - Function to show modal (if keeping modal as backup)

## Visual Comparison:

### Current FavoritesTab:
```
Header
Favorites List
Recently Removed (if any)
```

### Proposed FavoritesTab (Option A):
```
Header
[Tabs: Favorites | Saved Routes]
├─ Favorites Tab → Current favorites list
└─ Saved Routes Tab → Route cards with Load/Delete
Recently Removed (if any) - Only shown in Favorites tab
```

## Questions to Consider:

1. Should "Recently Removed" section appear in both tabs or only Favorites?
   - **Recommendation:** Only in Favorites tab (it's restaurant-specific)

2. Should empty states be different for each tab?
   - **Recommendation:** Yes, show appropriate empty state for each tab

3. Should route cards have the same styling as favorite cards?
   - **Recommendation:** Similar but with route-specific icons/colors

