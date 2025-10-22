/* global google */
import { routeIndexService } from './routeIndexService';

class RoutePrePopulationService {
  constructor() {
    this.popularRoutes = [
      // Major Malaysian city pairs
      { start: 'Kuala Lumpur, Malaysia', end: 'Penang, Malaysia' },
      { start: 'Kuala Lumpur, Malaysia', end: 'Ipoh, Malaysia' },
      { start: 'Kuala Lumpur, Malaysia', end: 'Johor Bahru, Malaysia' },
      { start: 'Kuala Lumpur, Malaysia', end: 'Malacca, Malaysia' },
      { start: 'Kuala Lumpur, Malaysia', end: 'Kuantan, Malaysia' },
      // Removed island routes that require ferries
      
      // Inter-city routes
      { start: 'Penang, Malaysia', end: 'Ipoh, Malaysia' },
      { start: 'Johor Bahru, Malaysia', end: 'Malacca, Malaysia' },
      { start: 'Kuala Lumpur, Malaysia', end: 'Shah Alam, Malaysia' },
      { start: 'Kuala Lumpur, Malaysia', end: 'Petaling Jaya, Malaysia' },
      { start: 'Kuala Lumpur, Malaysia', end: 'Subang Jaya, Malaysia' },
      
      // Popular tourist routes
      { start: 'Kuala Lumpur, Malaysia', end: 'Cameron Highlands, Malaysia' },
      { start: 'Kuala Lumpur, Malaysia', end: 'Genting Highlands, Malaysia' },
      { start: 'Kuala Lumpur, Malaysia', end: 'Port Dickson, Malaysia' },
      // Removed Langkawi (island route)
    ];
    
    this.isPrePopulating = false;
    this.lastPrePopulation = null;
    this.prePopulationInterval = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Check if pre-population is needed
  shouldPrePopulate() {
    if (this.isPrePopulating) {
      return false;
    }
    
    if (!this.lastPrePopulation) {
      return true;
    }
    
    const timeSinceLastPop = Date.now() - this.lastPrePopulation;
    return timeSinceLastPop > this.prePopulationInterval;
  }

  // Pre-populate popular routes during off-peak hours
  async prePopulateRoutes() {
    if (!this.shouldPrePopulate()) {
      console.log('⏭️ Pre-population not needed yet');
      return;
    }

    console.log('🚀 Starting route pre-population...');
    this.isPrePopulating = true;
    
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const route of this.popularRoutes) {
        try {
          console.log(`📍 Pre-populating: ${route.start} → ${route.end}`);
          
          // Check if route already exists
          const existingRoute = await routeIndexService.getIndexedRoute(
            { name: route.start, lat: 0, lng: 0 }, // Dummy coordinates
            { name: route.end, lat: 0, lng: 0 }
          );
          
          if (existingRoute && existingRoute.length > 0) {
            console.log(`✅ Route already cached: ${route.start} → ${route.end}`);
            successCount++;
            continue;
          }
          
          // Geocode and fetch route
          const startLocation = await this.geocodeLocation(route.start);
          const endLocation = await this.geocodeLocation(route.end);
          
          if (startLocation && endLocation) {
            // Fetch route from Google Directions API
            const routes = await this.fetchRouteFromGoogle(startLocation, endLocation);
            
            if (routes && routes.length > 0) {
              // Index the route
              await routeIndexService.indexRoute(routes, startLocation, endLocation);
              console.log(`✅ Pre-populated: ${route.start} → ${route.end}`);
              successCount++;
            } else {
              console.log(`⚠️ No routes found: ${route.start} → ${route.end}`);
              errorCount++;
            }
          } else {
            console.log(`⚠️ Geocoding failed: ${route.start} → ${route.end}`);
            errorCount++;
          }
          
          // Add delay to avoid rate limiting
          await this.delay(1000);
          
        } catch (error) {
          if (error.message.includes('ZERO_RESULTS')) {
            console.log(`ℹ️ Skipping ${route.start} → ${route.end}: No driving route available (likely requires ferry)`);
          } else {
            console.error(`❌ Error pre-populating ${route.start} → ${route.end}:`, error);
          }
          errorCount++;
        }
      }
      
      this.lastPrePopulation = Date.now();
      console.log(`🎉 Pre-population completed: ${successCount} success, ${errorCount} errors`);
      
    } catch (error) {
      console.error('❌ Pre-population failed:', error);
    } finally {
      this.isPrePopulating = false;
    }
  }

  // Geocode location
  async geocodeLocation(address) {
    try {
      const { Geocoder } = await google.maps.importLibrary("geocoding");
      const geocoder = new Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              name: results[0].formatted_address,
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      return null;
    }
  }

  // Fetch route from Google Directions API
  async fetchRouteFromGoogle(startLocation, endLocation) {
    try {
      const { DirectionsService } = await google.maps.importLibrary("routes");
      const service = new DirectionsService();
      
      return new Promise((resolve, reject) => {
        const request = {
          origin: `${startLocation.lat},${startLocation.lng}`,
          destination: `${endLocation.lat},${endLocation.lng}`,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          provideRouteAlternatives: true,
          region: 'MY',
          language: 'en-MY'
        };

        service.route(request, (result, status) => {
          if (status === 'OK') {
            resolve(result.routes);
          } else {
            reject(new Error(`Directions API error: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('❌ Directions API error:', error);
      return null;
    }
  }

  // Delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get pre-population stats
  getStats() {
    return {
      totalRoutes: this.popularRoutes.length,
      isPrePopulating: this.isPrePopulating,
      lastPrePopulation: this.lastPrePopulation,
      nextPrePopulation: this.lastPrePopulation ? 
        new Date(this.lastPrePopulation + this.prePopulationInterval) : null
    };
  }

  // Manual trigger for pre-population
  async triggerPrePopulation() {
    console.log('🔄 Manual pre-population triggered');
    await this.prePopulateRoutes();
  }
}

export const routePrePopulationService = new RoutePrePopulationService();
export default routePrePopulationService;
