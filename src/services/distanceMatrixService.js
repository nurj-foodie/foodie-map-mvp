/* global google */
class DistanceMatrixService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.batchSize = 25; // Google's limit for batch requests
  }

  // Generate cache key for distance calculations
  getCacheKey(origins, destinations) {
    // Filter out undefined/null origins and destinations
    const validOrigins = origins.filter(o => o && typeof o.lat === 'number' && typeof o.lng === 'number');
    const validDestinations = destinations.filter(d => d && typeof d.lat === 'number' && typeof d.lng === 'number');
    
    const originKey = validOrigins.map(o => `${o.lat.toFixed(4)},${o.lng.toFixed(4)}`).join('|');
    const destKey = validDestinations.map(d => `${d.lat.toFixed(4)},${d.lng.toFixed(4)}`).join('|');
    return `${originKey}_${destKey}`;
  }

  // Batch distance calculations to reduce API calls
  async getBatchDistances(origins, destinations) {
    try {
      // Filter out invalid coordinates
      const validOrigins = origins.filter(o => o && typeof o.lat === 'number' && typeof o.lng === 'number');
      const validDestinations = destinations.filter(d => d && typeof d.lat === 'number' && typeof d.lng === 'number');
      
      if (validOrigins.length === 0 || validDestinations.length === 0) {
        console.log('⚠️ No valid coordinates for Distance Matrix calculation');
        return { rows: [] };
      }
      
      // Check if we exceed Google's limits (25x25 = 625 combinations max)
      const totalCombinations = validOrigins.length * validDestinations.length;
      if (totalCombinations > 625) {
        console.log(`⚠️ Too many combinations (${totalCombinations}), falling back to Haversine formula`);
        throw new Error('MAX_DIMENSIONS_EXCEEDED');
      }
      
      const cacheKey = this.getCacheKey(validOrigins, validDestinations);
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        console.log('💰 Distance Matrix cache hit - FREE!');
        return this.cache.get(cacheKey);
      }

      console.log('💰 Distance Matrix API call - COST: ~RM0.005 per batch');
      console.log(`📊 Batch size: ${validOrigins.length} origins × ${validDestinations.length} destinations`);

      const { DistanceMatrixService } = await google.maps.importLibrary("routes");
      const service = new DistanceMatrixService();

      return new Promise((resolve, reject) => {
        const request = {
          origins: validOrigins.map(origin => new google.maps.LatLng(origin.lat, origin.lng)),
          destinations: validDestinations.map(dest => new google.maps.LatLng(dest.lat, dest.lng)),
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        };

        service.getDistanceMatrix(request, (response, status) => {
          if (status === 'OK') {
            console.log('✅ Distance Matrix batch calculation successful');
            
            // Cache the results
            this.cache.set(cacheKey, response);
            setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout);
            
            resolve(response);
          } else {
            console.error('❌ Distance Matrix API error:', status);
            reject(new Error(`Distance Matrix API error: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('❌ Distance Matrix service error:', error);
      throw error;
    }
  }

  // Calculate detours for restaurants along a route (optimized)
  async calculateRouteDetours(route, restaurants) {
    try {
      console.log(`🔍 Calculating detours for ${restaurants.length} restaurants along route`);
      
      // Extract route waypoints (every 5th step to reduce API calls)
      const routePoints = this.extractRouteWaypoints(route, 5);
      console.log(`📍 Using ${routePoints.length} route waypoints for detour calculation`);

      // Convert restaurant objects to coordinate format expected by Distance Matrix API
      const restaurantCoordinates = restaurants.map(restaurant => {
        // Handle different restaurant data structures
        if (restaurant.location && typeof restaurant.location.lat === 'number' && typeof restaurant.location.lng === 'number') {
          return { lat: restaurant.location.lat, lng: restaurant.location.lng };
        } else if (typeof restaurant.lat === 'number' && typeof restaurant.lng === 'number') {
          return { lat: restaurant.lat, lng: restaurant.lng };
        } else {
          console.warn('⚠️ Invalid restaurant coordinates:', restaurant);
          return null;
        }
      }).filter(coord => coord !== null);

      if (restaurantCoordinates.length === 0) {
        console.warn('⚠️ No valid restaurant coordinates found');
        return this.calculateDetoursHaversine(route, restaurants);
      }

      // Batch calculate distances from all route points to all restaurants
      const distances = await this.getBatchDistances(routePoints, restaurantCoordinates);
      
      // Find minimum detour for each restaurant
      const restaurantsWithDetours = restaurants.map((restaurant, restaurantIndex) => {
        // Skip if restaurant coordinates are invalid
        if (!restaurant.location || typeof restaurant.location.lat !== 'number' || typeof restaurant.location.lng !== 'number') {
          return {
            ...restaurant,
            detourDistanceKm: Infinity,
            detourDurationMinutes: Infinity,
            detourDistanceMeters: Infinity,
            detourDurationSeconds: Infinity,
            waypointIndex: -1
          };
        }

        let minDetour = { distance: Infinity, duration: Infinity, waypointIndex: -1 };
        
        // Check distance from each route waypoint
        routePoints.forEach((waypoint, waypointIndex) => {
          const result = distances.rows[waypointIndex].elements[restaurantIndex];
          
          if (result && result.status === 'OK') {
            const distance = result.distance.value; // meters
            const duration = result.duration.value; // seconds
            
            if (distance < minDetour.distance) {
              minDetour = {
                distance: distance,
                duration: duration,
                waypointIndex: waypointIndex
              };
            }
          }
        });

        return {
          ...restaurant,
          detourDistanceKm: minDetour.distance / 1000,
          detourDurationMinutes: minDetour.duration / 60,
          detourDistanceMeters: minDetour.distance,
          detourDurationSeconds: minDetour.duration,
          waypointIndex: minDetour.waypointIndex
        };
      });

      console.log(`✅ Detour calculation completed for ${restaurantsWithDetours.length} restaurants`);
      return restaurantsWithDetours;
      
    } catch (error) {
      console.error('❌ Route detour calculation failed:', error);
      // Fallback to Haversine formula
      return this.calculateDetoursHaversine(route, restaurants);
    }
  }

  // Extract route waypoints (every nth step)
  extractRouteWaypoints(route, stepInterval = 5) {
    const waypoints = [];
    
    console.log('🔍 Extracting route waypoints from route:', {
      hasRoute: !!route,
      hasLegs: !!(route && route.legs),
      legsCount: route && route.legs ? route.legs.length : 0,
      firstLegSteps: route && route.legs && route.legs[0] && route.legs[0].steps ? route.legs[0].steps.length : 0
    });
    
    if (route && route.legs && route.legs.length > 0) {
      route.legs.forEach((leg, legIndex) => {
        if (leg && leg.steps && leg.steps.length > 0) {
          leg.steps.forEach((step, index) => {
            if (step && step.start_location && index % stepInterval === 0) {
              const lat = typeof step.start_location.lat === 'function' 
                ? step.start_location.lat() 
                : step.start_location.lat;
              const lng = typeof step.start_location.lng === 'function' 
                ? step.start_location.lng() 
                : step.start_location.lng;
              
              // Only add if coordinates are valid numbers
              if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                waypoints.push({ lat, lng });
              }
            }
          });
        }
      });
    }
    
    console.log(`📍 Extracted ${waypoints.length} waypoints from route`);
    if (waypoints.length > 0) {
      console.log('📍 First few waypoints:', waypoints.slice(0, 3));
    }
    
    return waypoints;
  }

  // Fallback to Haversine formula (FREE)
  calculateDetoursHaversine(route, restaurants) {
    console.log('💰 Using Haversine formula fallback - FREE!');
    
    const routePoints = this.extractRouteWaypoints(route, 1); // Use all points for accuracy
    
    if (routePoints.length === 0) {
      console.warn('⚠️ No route waypoints found for Haversine calculation!');
      // Fallback: use start and end points if available
      const fallbackPoints = [];
      if (route && route.legs && route.legs.length > 0) {
        const firstLeg = route.legs[0];
        const lastLeg = route.legs[route.legs.length - 1];
        
        if (firstLeg && firstLeg.steps && firstLeg.steps.length > 0) {
          const firstStep = firstLeg.steps[0];
          if (firstStep && firstStep.start_location) {
            fallbackPoints.push({
              lat: typeof firstStep.start_location.lat === 'function' ? firstStep.start_location.lat() : firstStep.start_location.lat,
              lng: typeof firstStep.start_location.lng === 'function' ? firstStep.start_location.lng() : firstStep.start_location.lng
            });
          }
        }
        
        if (lastLeg && lastLeg.steps && lastLeg.steps.length > 0) {
          const lastStep = lastLeg.steps[lastLeg.steps.length - 1];
          if (lastStep && lastStep.end_location) {
            fallbackPoints.push({
              lat: typeof lastStep.end_location.lat === 'function' ? lastStep.end_location.lat() : lastStep.end_location.lat,
              lng: typeof lastStep.end_location.lng === 'function' ? lastStep.end_location.lng() : lastStep.end_location.lng
            });
          }
        }
      }
      
      console.log(`📍 Using ${fallbackPoints.length} fallback waypoints (start/end points)`);
      routePoints.push(...fallbackPoints);
    }
    
    return restaurants.map((restaurant, index) => {
      let minDistance = Infinity;
      let minDuration = Infinity;
      
      if (!restaurant.location || typeof restaurant.location.lat !== 'number' || typeof restaurant.location.lng !== 'number') {
        console.warn(`⚠️ Restaurant ${index} has invalid location:`, restaurant.location);
        return {
          ...restaurant,
          detourDistanceKm: Infinity,
          detourDurationMinutes: Infinity,
          detourDistanceMeters: Infinity,
          detourDurationSeconds: Infinity
        };
      }
      
      routePoints.forEach((waypoint, waypointIndex) => {
        const distance = this.haversineDistance(
          waypoint.lat, waypoint.lng,
          restaurant.location.lat, restaurant.location.lng
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          minDuration = distance * 1.5; // Rough estimate: 1.5 minutes per km
        }
      });
      
      // Debug first few restaurants
      if (index < 3) {
        console.log(`📍 Restaurant ${index} (${restaurant.name}): ${minDistance.toFixed(2)}km detour from ${routePoints.length} waypoints`);
      }
      
      return {
        ...restaurant,
        detourDistanceKm: minDistance,
        detourDurationMinutes: minDuration,
        detourDistanceMeters: minDistance * 1000,
        detourDurationSeconds: minDuration * 60
      };
    });
  }

  // Haversine distance calculation (FREE)
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * 
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Distance Matrix cache cleared');
  }

  // Get cache stats
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      cacheTimeout: this.cacheTimeout,
      batchSize: this.batchSize
    };
  }
}

export const distanceMatrixService = new DistanceMatrixService();
export default distanceMatrixService;
