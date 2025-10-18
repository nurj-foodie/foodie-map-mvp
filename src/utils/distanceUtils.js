// Haversine formula for accurate distance between two coordinates
export const calculateHaversineDistance = (point1, point2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(point1.lat * Math.PI / 180) * 
            Math.cos(point2.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Estimate travel duration based on distance
export const estimateDuration = (distanceKm) => {
  // Simple logic: city speed < 5km, highway speed >= 5km
  const avgSpeed = distanceKm < 5 ? 35 : 90; // km/h
  return (distanceKm / avgSpeed) * 60; // minutes
};

// Calculate detour from a route point to a destination
export const calculateDetour = (routePoint, destination) => {
  const distance = calculateHaversineDistance(routePoint, destination);
  const duration = estimateDuration(distance);
  
  return {
    distanceKm: distance,
    durationMinutes: duration,
    distanceMeters: distance * 1000,
    durationSeconds: duration * 60
  };
};

// Find minimum detour from multiple route points
export const findMinimumDetour = (routePoints, destination) => {
  let minDetour = { 
    distanceKm: Infinity, 
    durationMinutes: Infinity,
    distanceMeters: Infinity,
    durationSeconds: Infinity
  };
  
  routePoints.forEach(routePoint => {
    const detour = calculateDetour(routePoint, destination);
    
    if (detour.distanceKm < minDetour.distanceKm) {
      minDetour = detour;
    }
  });
  
  return minDetour;
};

// Filter restaurants by detour limits
export const filterByDetourLimits = (restaurants, maxDistanceKm = 2, maxDurationMinutes = 15) => {
  return restaurants.filter(restaurant => 
    restaurant.detourDistanceKm <= maxDistanceKm || 
    restaurant.detourDurationMinutes <= maxDurationMinutes
  );
};

// Calculate route bounds for search area
export const calculateRouteBounds = (route) => {
  if (!route || !route.legs || route.legs.length === 0) {
    return null;
  }
  
  const bounds = {
    north: -90,
    south: 90,
    east: -180,
    west: 180
  };
  
  // Sample points along the route
  route.legs.forEach(leg => {
    if (leg.steps) {
      leg.steps.forEach(step => {
        const lat = step.start_location.lat();
        const lng = step.start_location.lng();
        
        bounds.north = Math.max(bounds.north, lat);
        bounds.south = Math.min(bounds.south, lat);
        bounds.east = Math.max(bounds.east, lng);
        bounds.west = Math.min(bounds.west, lng);
      });
    }
  });
  
  return bounds;
};
