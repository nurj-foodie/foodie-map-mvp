import { collection, query, where, getDocs, addDoc, orderBy, limit, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

class RouteIndexService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Generate unique route ID from coordinates
  generateRouteId(start, end) {
    const sLat = start.lat.toFixed(4);
    const sLng = start.lng.toFixed(4);
    const eLat = end.lat.toFixed(4);
    const eLng = end.lng.toFixed(4);
    return `route_${sLat}_${sLng}_${eLat}_${eLng}`;
  }

  // Extract complete route data for Firestore indexing (stores full Google Directions API response)
  extractRouteData(googleMapsRoute, startLocation, endLocation) {
    const route = googleMapsRoute;
    
    // Store the complete route object structure that DirectionsRenderer expects
    const completeRoute = {
      summary: route.summary || 'Unknown Route',
      legs: route.legs ? route.legs.map(leg => ({
        distance: leg.distance ? {
          text: leg.distance.text,
          value: leg.distance.value
        } : null,
        duration: leg.duration ? {
          text: leg.duration.text,
          value: leg.duration.value
        } : null,
        start_address: leg.start_address,
        end_address: leg.end_address,
        steps: leg.steps ? leg.steps.map(step => ({
          distance: step.distance ? {
            text: step.distance.text,
            value: step.distance.value
          } : null,
          duration: step.duration ? {
            text: step.duration.text,
            value: step.duration.value
          } : null,
          start_location: {
            lat: typeof step.start_location.lat === 'function' 
              ? step.start_location.lat() 
              : step.start_location.lat,
            lng: typeof step.start_location.lng === 'function' 
              ? step.start_location.lng() 
              : step.start_location.lng
          },
          end_location: {
            lat: typeof step.end_location.lat === 'function' 
              ? step.end_location.lat() 
              : step.end_location.lat,
            lng: typeof step.end_location.lng === 'function' 
              ? step.end_location.lng() 
              : step.end_location.lng
          },
          instructions: step.instructions || '',
          maneuver: step.maneuver || ''
        })) : []
      })) : [],
      overview_polyline: route.overview_polyline ? {
        encoded_path: typeof route.overview_polyline === 'string' 
          ? route.overview_polyline 
          : route.overview_polyline.encoded_path
      } : null,
      bounds: route.bounds ? this.extractBounds(route.bounds) : null,
      warnings: route.warnings || [],
      waypoint_order: route.waypoint_order || [],
      copyrights: route.copyrights || '',
      fare: route.fare || null
    };

    return {
      routeId: this.generateRouteId(startLocation, endLocation),
      startLocation: {
        name: startLocation.name,
        lat: startLocation.lat,
        lng: startLocation.lng
      },
      endLocation: {
        name: endLocation.name,
        lat: endLocation.lat,
        lng: endLocation.lng
      },
      // Store the complete route object for perfect reconstruction
      completeRoute: completeRoute,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      searchCount: 0,
      lastSearched: new Date()
    };
  }

  // Helper method to extract bounds safely
  extractBounds(bounds) {
    try {
      if (typeof bounds.getNorth === 'function') {
        return {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        };
      } else if (bounds.north !== undefined) {
        return {
          north: bounds.north,
          south: bounds.south,
          east: bounds.east,
          west: bounds.west
        };
      } else {
        console.log('🔍 Skipping bounds extraction for internal format');
        return null;
      }
    } catch (error) {
      console.warn('⚠️ Error extracting bounds:', error);
      return null;
    }
  }

  // Index route data to Firestore
  async indexRoute(googleMapsRoutes, startLocation, endLocation) {
    try {
      const routeId = this.generateRouteId(startLocation, endLocation);
      
      // Check if route already exists
      const existingQuery = query(
        collection(db, 'route_index'),
        where('routeId', '==', routeId),
        limit(1)
      );
      
      const existing = await getDocs(existingQuery);
      
      if (!existing.empty) {
        console.log('✅ Route already indexed:', routeId);
        return routeId;
      }

      // Index each route
      const indexedRoutes = googleMapsRoutes.map(route => 
        this.extractRouteData(route, startLocation, endLocation)
      );

      // Save to Firestore
      for (const routeData of indexedRoutes) {
        await addDoc(collection(db, 'route_index'), routeData);
        console.log('✅ Indexed route:', routeData.summary);
      }

      return routeId;
    } catch (error) {
      console.error('❌ Error indexing route:', error);
      throw error;
    }
  }

  // Retrieve indexed route from Firestore
  async getIndexedRoute(startLocation, endLocation) {
    try {
      const routeId = this.generateRouteId(startLocation, endLocation);
      
      const q = query(
        collection(db, 'route_index'),
        where('routeId', '==', routeId),
        where('expiresAt', '>', new Date())
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const routes = [];
        snapshot.forEach(doc => {
          const routeData = doc.data();
          // Validate route data before adding (check for completeRoute structure)
          if (routeData.completeRoute && routeData.completeRoute.legs && routeData.completeRoute.legs.length > 0) {
            routes.push(routeData);
          } else {
            console.warn('⚠️ Invalid route data found, skipping:', routeData.completeRoute?.summary || 'Unknown');
          }
        });
        
        if (routes.length > 0) {
          console.log('✅ Retrieved indexed route:', routeId);
          
          // Update search count
          await this.incrementSearchCount(routeId);
          
          return routes;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error retrieving indexed route:', error);
      return null;
    }
  }

  // Reconstruct Google Maps route objects from indexed data (perfect reconstruction)
  reconstructGoogleMapsRoute(indexedRoute) {
    // Ensure coordinates are numbers, not strings
    const ensureNumber = (value) => {
      if (typeof value === 'string') {
        return parseFloat(value);
      }
      return typeof value === 'number' ? value : 0;
    };

    // Reconstruct the complete route object that DirectionsRenderer expects
    const reconstructedRoute = {
      summary: indexedRoute.completeRoute.summary,
      legs: indexedRoute.completeRoute.legs.map(leg => ({
        distance: leg.distance,
        duration: leg.duration,
        start_address: leg.start_address,
        end_address: leg.end_address,
        steps: leg.steps.map(step => ({
          distance: step.distance,
          duration: step.duration,
          start_location: {
            lat: ensureNumber(step.start_location.lat),
            lng: ensureNumber(step.start_location.lng)
          },
          end_location: {
            lat: ensureNumber(step.end_location.lat),
            lng: ensureNumber(step.end_location.lng)
          },
          instructions: step.instructions,
          maneuver: step.maneuver
        }))
      })),
      overview_polyline: indexedRoute.completeRoute.overview_polyline,
      bounds: indexedRoute.completeRoute.bounds ? {
        getNorth: () => ensureNumber(indexedRoute.completeRoute.bounds.north),
        getSouth: () => ensureNumber(indexedRoute.completeRoute.bounds.south),
        getEast: () => ensureNumber(indexedRoute.completeRoute.bounds.east),
        getWest: () => ensureNumber(indexedRoute.completeRoute.bounds.west)
      } : null,
      warnings: indexedRoute.completeRoute.warnings,
      waypoint_order: indexedRoute.completeRoute.waypoint_order,
      copyrights: indexedRoute.completeRoute.copyrights,
      fare: indexedRoute.completeRoute.fare
    };

    // CRITICAL: DirectionsRenderer expects the complete Google Directions API response format
    // Wrap the route in the proper response structure
    const response = {
      routes: [reconstructedRoute],
      request: {
        origin: indexedRoute.startLocation,
        destination: indexedRoute.endLocation,
        travelMode: 'DRIVING',
        provideRouteAlternatives: true
      },
      status: 'OK',
      geocoded_waypoints: [
        {
          geocoder_status: 'OK',
          place_id: 'indexed_route_start',
          types: ['locality', 'political']
        },
        {
          geocoder_status: 'OK', 
          place_id: 'indexed_route_end',
          types: ['locality', 'political']
        }
      ]
    };
    
    console.log('🔍 Reconstructed response structure:', {
      hasRoutes: response.routes.length > 0,
      routeSummary: response.routes[0]?.summary,
      hasOverviewPolyline: !!response.routes[0]?.overview_polyline,
      polylineLength: response.routes[0]?.overview_polyline?.encoded_path?.length || 0,
      polylinePreview: response.routes[0]?.overview_polyline?.encoded_path?.substring(0, 50) + '...',
      hasLegs: response.routes[0]?.legs?.length > 0,
      legsCount: response.routes[0]?.legs?.length || 0,
      firstLegSteps: response.routes[0]?.legs?.[0]?.steps?.length || 0
    });
    
    // Debug the original indexed route data
    console.log('🔍 Original indexed route data:', {
      hasCompleteRoute: !!indexedRoute.completeRoute,
      originalPolyline: indexedRoute.completeRoute?.overview_polyline,
      originalPolylineType: typeof indexedRoute.completeRoute?.overview_polyline,
      originalPolylineLength: indexedRoute.completeRoute?.overview_polyline?.encoded_path?.length || 0
    });
    
    return response;
  }

  // Increment search count for analytics
  async incrementSearchCount(routeId) {
    try {
      const q = query(
        collection(db, 'route_index'),
        where('routeId', '==', routeId)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        const docData = snapshot.docs[0].data();
        await updateDoc(docRef, {
          searchCount: (docData.searchCount || 0) + 1,
          lastSearched: new Date()
        });
      }
    } catch (error) {
      console.error('❌ Error updating search count:', error);
    }
  }

  // Search for routes by location bounds (for route discovery)
  async searchRoutesByBounds(bounds, limitCount = 10) {
    try {
      const q = query(
        collection(db, 'route_index'),
        where('bounds.north', '>=', bounds.south),
        where('bounds.south', '<=', bounds.north),
        orderBy('searchCount', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const routes = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Filter by longitude (can't use compound query)
        if (data.bounds && 
            data.bounds.east >= bounds.west && 
            data.bounds.west <= bounds.east) {
          routes.push(data);
        }
      });
      
      return routes;
    } catch (error) {
      console.error('❌ Error searching routes by bounds:', error);
      return [];
    }
  }

  // Get popular routes for analytics
  async getPopularRoutes(limitCount = 20) {
    try {
      const q = query(
        collection(db, 'route_index'),
        orderBy('searchCount', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      const routes = [];
      
      snapshot.forEach(doc => {
        routes.push(doc.data());
      });
      
      return routes;
    } catch (error) {
      console.error('❌ Error getting popular routes:', error);
      return [];
    }
  }
}

export const routeIndexService = new RouteIndexService();
export default routeIndexService;
