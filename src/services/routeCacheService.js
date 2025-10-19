import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
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
    try {
      const routeId = this.generateRouteId(start, end);
      
      // Use simpler query that doesn't require composite index
      const q = query(
        collection(db, 'route_cache'),
        where('routeId', '==', routeId)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        
        // Check expiry in JavaScript instead of Firestore query
        const now = new Date();
        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        
        if (expiresAt > now) {
          // Validate route structure before using
          if (this.validateRouteStructure(data.routes)) {
            console.log('✅ Using cached route:', routeId);
            
            // Reconstruct Google Maps route objects from cached data
            const reconstructedRoutes = this.reconstructGoogleMapsRoutes(data.routes);
            
            // Increment search count
            await this.incrementSearchCount(routeId);
            
            return reconstructedRoutes;
          } else {
            console.warn('⚠️ Cached route has invalid structure, ignoring:', routeId);
            // Delete the invalid cached route
            await snapshot.docs[0].ref.delete();
          }
        } else {
          console.log('⏰ Cached route expired:', routeId);
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error checking route cache:', error);
      // If cache fails, just return null to fetch from Google API
      return null;
    }
  }

  // Cache new route from Google Directions API
  async cacheRoute(start, end, routes) {
    try {
      const routeId = this.generateRouteId(start, end);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
      
      console.log('💾 Caching route:', routeId, 'with', routes.length, 'routes');
      
      // Clean routes to remove non-serializable Google Maps objects
      const cleanRoutes = routes.map(route => ({
        summary: route.summary,
        legs: route.legs?.map(leg => ({
          distance: leg.distance,
          duration: leg.duration,
          start_address: leg.start_address,
          end_address: leg.end_address,
          steps: leg.steps?.map(step => ({
            distance: step.distance,
            duration: step.duration,
            start_location: {
              lat: typeof step.start_location.lat === 'function' ? step.start_location.lat() : step.start_location.lat,
              lng: typeof step.start_location.lng === 'function' ? step.start_location.lng() : step.start_location.lng
            },
            end_location: {
              lat: typeof step.end_location.lat === 'function' ? step.end_location.lat() : step.end_location.lat,
              lng: typeof step.end_location.lng === 'function' ? step.end_location.lng() : step.end_location.lng
            },
            instructions: step.instructions
          }))
        })),
        overview_polyline: route.overview_polyline,
        warnings: route.warnings,
        waypoint_order: route.waypoint_order
      }));

      const routeData = {
        routeId,
        startLocation: start,
        endLocation: end,
        routes: cleanRoutes,
        searchCount: 1,
        lastSearched: new Date(),
        createdAt: new Date(),
        expiresAt
      };
      
      await addDoc(collection(db, 'route_cache'), routeData);
      console.log('✅ Cached new route:', routeId);
    } catch (error) {
      console.error('❌ Error caching route:', error);
      // Don't throw error - caching failure shouldn't break the app
    }
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

  // Reconstruct Google Maps route objects from cached data
  reconstructGoogleMapsRoutes(cachedRoutes) {
    return cachedRoutes.map(route => ({
      ...route,
      legs: route.legs?.map(leg => ({
        ...leg,
        steps: leg.steps?.map(step => ({
          ...step,
          start_location: {
            lat: () => step.start_location.lat,
            lng: () => step.start_location.lng
          },
          end_location: {
            lat: () => step.end_location.lat,
            lng: () => step.end_location.lng
          }
        }))
      }))
    }));
  }

  // Clear all cached routes (for debugging/fixing issues)
  async clearAllCache() {
    try {
      console.log('🗑️ Clearing all route cache...');
      const q = query(collection(db, 'route_cache'));
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => {
        console.log('🗑️ Deleting cached route:', doc.data().routeId);
        return deleteDoc(doc.ref);
      });
      
      await Promise.all(deletePromises);
      console.log('✅ Cleared all route cache');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  // Validate cached route structure
  validateRouteStructure(routes) {
    if (!Array.isArray(routes) || routes.length === 0) {
      console.warn('⚠️ Invalid route structure: not an array or empty');
      return false;
    }

    for (const route of routes) {
      if (!route.legs || !Array.isArray(route.legs) || route.legs.length === 0) {
        console.warn('⚠️ Invalid route structure: missing or invalid legs');
        return false;
      }

      if (!route.legs[0].steps || !Array.isArray(route.legs[0].steps)) {
        console.warn('⚠️ Invalid route structure: missing or invalid steps');
        return false;
      }
    }

    return true;
  }
}

export const routeCacheService = new RouteCacheService();
export default routeCacheService;
