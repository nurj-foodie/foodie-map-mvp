# Route Caching & Heat Map Strategy

## Overview

Implement route caching system to reduce Google Directions API costs by 70-80% and enable future heat map analytics and popular route recommendations.

## Phase 1: Immediate (Development) - IMPLEMENT NOW

### 1.1 Basic Route Caching System

**Goal**: Cache routes for 30 days to reduce API calls for repeated searches

**Firestore Structure**: `route_cache` collection

```javascript
// Document structure
{
  routeId: "kl_pj_route_1", // Generated from start/end coordinates
  startLocation: { 
    lat: 3.1390, 
    lng: 101.6869, 
    name: "Kuala Lumpur" 
  },
  endLocation: { 
    lat: 3.0738, 
    lng: 101.6050, 
    name: "Petaling Jaya" 
  },
  routes: [
    {
      routeIndex: 0,
      summary: "Via Federal Highway",
      distance: { text: "25.4 km", value: 25400 },
      duration: { text: "35 mins", value: 2100 },
      polyline: "encoded_polyline_string",
      popularity: 0 // Will be incremented
    }
  ],
  searchCount: 0, // Total searches for this route
  lastSearched: timestamp,
  createdAt: timestamp,
  expiresAt: timestamp // 30 days
}
```

### 1.2 Route Cache Service

**File**: `src/services/routeCacheService.js` (NEW)

```javascript
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

class RouteCacheService {
  // Generate unique route ID from coordinates
  generateRouteId(start, end) {
    const sLat = start.lat.toFixed(4);
    const sLng = start.lng.toFixed(4);
    const eLat = end.lat.toFixed(4);
    const eLng = end.lng.toFixed(4);
    return `route_${sLat}_${sLng}_${eLat}_${eLng}`;
  }

  // Check if route is cached and not expired
  async getCachedRoute(start, end) {
    const routeId = this.generateRouteId(start, end);
    
    const q = query(
      collection(db, 'route_cache'),
      where('routeId', '==', routeId),
      where('expiresAt', '>', new Date())
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      console.log('✅ Using cached route:', routeId);
      
      // Increment search count
      await this.incrementSearchCount(routeId);
      
      return data.routes;
    }
    
    return null;
  }

  // Cache new route from Google Directions API
  async cacheRoute(start, end, routes) {
    const routeId = this.generateRouteId(start, end);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    const routeData = {
      routeId,
      startLocation: start,
      endLocation: end,
      routes: routes.map((route, index) => ({
        routeIndex: index,
        summary: route.summary,
        distance: route.legs[0].distance,
        duration: route.legs[0].duration,
        polyline: route.overview_polyline.encoded_string,
        popularity: 0
      })),
      searchCount: 1,
      lastSearched: new Date(),
      createdAt: new Date(),
      expiresAt
    };
    
    await addDoc(collection(db, 'route_cache'), routeData);
    console.log('✅ Cached new route:', routeId);
  }

  // Increment search count for popular routes
  async incrementSearchCount(routeId) {
    const q = query(
      collection(db, 'route_cache'),
      where('routeId', '==', routeId)
    );
    
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docRef = doc(db, 'route_cache', snapshot.docs[0].id);
      await updateDoc(docRef, {
        searchCount: snapshot.docs[0].data().searchCount + 1,
        lastSearched: new Date()
      });
    }
  }
}

export const routeCacheService = new RouteCacheService();
export default routeCacheService;
```

### 1.3 Update App.tsx to Use Route Caching

**Modify `handleFindRoute` function**:

```javascript
const handleFindRoute = async () => {
  if (!startLocation || !endLocation) {
    setError('Please select both start and end locations');
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    // 1. Check cache first
    const cachedRoutes = await routeCacheService.getCachedRoute(startLocation, endLocation);
    
    if (cachedRoutes) {
      // Use cached routes
      setAvailableRoutes(cachedRoutes);
      setSelectedRoute(cachedRoutes[0]);
      
      // Display first route
      const { DirectionsRenderer } = await window.google.maps.importLibrary("routes");
      const newDirectionsRenderer = new DirectionsRenderer();
      newDirectionsRenderer.setMap(map);
      newDirectionsRenderer.setDirections({
        routes: [cachedRoutes[0]],
        request: { origin: startLocation, destination: endLocation }
      });
      
      // Find restaurants for cached routes
      findRestaurantsForAllRoutes(cachedRoutes, map);
      setIsLoading(false);
      return;
    }

    // 2. Fetch from Google Directions API (only if not cached)
    const { Map } = await window.google.maps.importLibrary("maps");
    const { DirectionsService, DirectionsRenderer } = await window.google.maps.importLibrary("routes");

    // ... existing Google API code ...
    
    directionsService.route(request, async (result: any, status: any) => {
      if (status === 'OK') {
        // Store all available routes
        setAvailableRoutes(result.routes);
        
        // Cache the routes for future use
        await routeCacheService.cacheRoute(startLocation, endLocation, result.routes);
        
        // ... rest of existing code ...
      }
      setIsLoading(false);
    });

  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
    setIsLoading(false);
  }
};
```

## Phase 2: Beta Testing - IMPLEMENT LATER

### 2.1 Popular Routes Analytics

**Firestore Structure**: `route_analytics` collection

```javascript
// Daily aggregation
{
  date: "2024-01-15",
  popularRoutes: [
    {
      routeId: "kl_pj_route_1",
      searchCount: 45,
      uniqueUsers: 32,
      avgRating: 4.2
    }
  ],
  totalSearches: 150,
  uniqueUsers: 89
}
```

### 2.2 Route Usage Tracking

**Firestore Structure**: `route_usage` collection

```javascript
// Individual route usage tracking
{
  routeId: "kl_pj_route_1",
  routeIndex: 0,
  userId: "user_123",
  timestamp: new Date(),
  location: { lat: 3.1390, lng: 101.6869 } // For heat map
}
```

### 2.3 Heat Map Visualization

**Implementation**:
- Use Google Maps HeatmapLayer
- Data points from popular routes
- Weight based on search frequency
- Real-time updates from route_analytics

## Phase 3: Production - ADVANCED FEATURES

### 3.1 ML-Based Route Recommendations

- Analyze user behavior patterns
- Suggest popular routes based on location
- Personalized route preferences
- Traffic-aware recommendations

### 3.2 Advanced Analytics Dashboard

- Route popularity trends
- User engagement metrics
- Geographic heat maps
- Performance analytics

## Cost-Benefit Analysis

### Current Costs (No Caching):
- **Directions API**: $0.005 per request
- **100 searches/day**: $0.50/day
- **Monthly**: ~$15/month

### With Route Caching (Phase 1):
- **Cache hit rate**: 70-80%
- **API calls reduced**: 70-80%
- **New cost**: $0.10-0.15/day
- **Monthly savings**: $10-12/month

### Expected Results:
- **70-80% cost reduction** for route calculations
- **Faster route loading** for cached routes
- **Foundation for heat maps** and analytics
- **Better user experience** with instant results

## Implementation Timeline

### Immediate (Development):
- [ ] Create `routeCacheService.js`
- [ ] Update `App.tsx` to use route caching
- [ ] Test caching functionality
- [ ] Monitor cache hit rates

### Beta Testing Phase:
- [ ] Add route usage tracking
- [ ] Implement popular routes analytics
- [ ] Create basic heat map visualization
- [ ] Add route recommendations

### Production Phase:
- [ ] Advanced analytics dashboard
- [ ] ML-based recommendations
- [ ] Real-time traffic integration
- [ ] Performance optimization

## Testing Strategy

### Phase 1 Testing:
1. **Cache Miss**: Search new route → Should call Google API and cache result
2. **Cache Hit**: Search same route → Should use cached data (no API call)
3. **Cache Expiry**: Search route after 30 days → Should refresh cache
4. **Performance**: Measure route loading speed improvement

### Expected Console Messages:
```
✅ Using cached route: route_3.1390_101.6869_3.0738_101.6050
✅ Cached new route: route_3.1390_101.6869_3.0738_101.6050
💰 Route cache hit! No API call needed
🔄 Fetching from Google Directions API (cache miss)
```

## Notes

- **30-day cache expiry** balances freshness with cost savings
- **Route ID generation** uses 4-decimal precision for accuracy
- **Search count tracking** enables future popularity analytics
- **Backward compatible** - works with existing route discovery
- **Foundation ready** for heat map and analytics features

---

**Status**: Phase 1 ready for implementation
**Next Review**: When entering beta testing phase
**Priority**: High (immediate cost savings)
