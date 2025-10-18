import React, { useState, useEffect } from 'react';
import './App.css';
import { firestoreSearchService } from './services/firestoreSearchService';
import { calculateRouteBounds, findMinimumDetour, filterByDetourLimits } from './utils/distanceUtils';
import EaterySubmissionForm from './components/EaterySubmissionForm';

interface Location {
  name: string;
  lat: number;
  lng: number;
}

function App() {
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedEatery, setSelectedEatery] = useState<any>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  useEffect(() => {
    const checkGoogleMaps = async () => {
      try {
        if (window.google?.maps?.importLibrary) {
          // Test if we can import a library
          await window.google.maps.importLibrary("maps");
          setGoogleMapsLoaded(true);
          console.log('✅ Google Maps loaded successfully');
        } else {
          console.log('⏳ Waiting for Google Maps...');
          setTimeout(checkGoogleMaps, 500);
        }
      } catch (error) {
        console.log('⏳ Google Maps not ready yet...');
        setTimeout(checkGoogleMaps, 500);
      }
    };

    // Listen for the custom event
    const handleGoogleMapsLoaded = () => {
      setGoogleMapsLoaded(true);
    };

    window.addEventListener('googleMapsLoaded', handleGoogleMapsLoaded);
    checkGoogleMaps();

    return () => {
      window.removeEventListener('googleMapsLoaded', handleGoogleMapsLoaded);
    };
  }, []);

  const handleFindRoute = async () => {
    if (!startLocation || !endLocation) {
      setError('Please select both start and end locations');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Import Google Maps libraries dynamically
      const { Map } = await window.google.maps.importLibrary("maps");
      const { DirectionsService, DirectionsRenderer } = await window.google.maps.importLibrary("routes");

      // Create map
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        throw new Error('Map element not found');
      }

      const map = new Map(mapElement, {
        center: {
          lat: (startLocation.lat + endLocation.lat) / 2,
          lng: (startLocation.lng + endLocation.lng) / 2
        },
        zoom: 12,
        mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'
      });

      // Calculate route
      const directionsService = new DirectionsService();
      const directionsRenderer = new DirectionsRenderer();

      directionsRenderer.setMap(map);

      const request = {
        origin: `${startLocation.lat},${startLocation.lng}`,
        destination: `${endLocation.lat},${endLocation.lng}`,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        provideRouteAlternatives: true, // Get multiple routes
      };

      directionsService.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          // Store all available routes
          setAvailableRoutes(result.routes);
          
          // Select the first route by default
          const firstRoute = result.routes[0];
          setSelectedRoute(firstRoute);
          
          // Display the first route
          directionsRenderer.setDirections({
            routes: [firstRoute],
            request: result.request
          });
          
          // Find restaurants along the first route
          findRestaurantsAlongRoute(firstRoute, map);
        } else {
          setError(`Route calculation failed: ${status}`);
        }
        setIsLoading(false);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  };

  const findRestaurantsAlongRoute = async (route: any, map: any) => {
    console.log('🔍 Starting Firestore-first restaurant search...');
    
    try {
      // Calculate route bounds for search area
      const bounds = calculateRouteBounds(route);
      if (!bounds) {
        console.error('❌ Could not calculate route bounds');
        return;
      }
      
      console.log('📍 Route bounds:', bounds);
      
      // Use Firestore-first search with filters
      const places = await firestoreSearchService.searchRestaurants(bounds, {
        foodType: 'all', // Could be made configurable
        minRating: 0,
        halalOnly: false,
        openNow: false
      });
      
      console.log(`🍽️ Found ${places.length} restaurants`);
      
      // Calculate detours using Haversine (NO Distance Matrix API!)
      const restaurantsWithDetours = calculateDetours(places, route);
      
      // Filter by detour limits (2km or 15 minutes)
      const filteredRestaurants = filterByDetourLimits(restaurantsWithDetours, 2, 15);
      
      console.log(`📍 Filtered: ${filteredRestaurants.length} restaurants within range`);
      
      // Store restaurants in state for selection
      setRestaurants(filteredRestaurants);
      
      // Add markers to map
      if (map) {
        addRestaurantMarkers(filteredRestaurants, map);
      }
      
    } catch (error) {
      console.error('❌ Restaurant search failed:', error);
      setRestaurants([]);
    }
  };

  // Calculate detours using Haversine formula (NO Distance Matrix API!)
  const calculateDetours = (places: any[], route: any) => {
    console.log('💰 Using Haversine formula - NO Distance Matrix API cost!');
    
    // Extract route points from the route
    const routePoints: Array<{lat: number, lng: number}> = [];
    if (route.legs && route.legs.length > 0) {
      route.legs.forEach((leg: any) => {
        if (leg.steps) {
          leg.steps.forEach((step: any) => {
            routePoints.push({
              lat: step.start_location.lat(),
              lng: step.start_location.lng()
            });
          });
        }
      });
    }
    
    if (routePoints.length === 0) {
      console.warn('⚠️ No route points found for detour calculation');
      return places;
    }
    
    const restaurantsWithDetours = places.map(place => {
      // Find minimum detour from all route points
      const minDetour = findMinimumDetour(routePoints, place.location);
      
      return {
        ...place,
        detourDistanceKm: minDetour.distanceKm,
        detourDurationMinutes: minDetour.durationMinutes,
        detourDistanceMeters: minDetour.distanceMeters,
        detourDurationSeconds: minDetour.durationSeconds
      };
    });
    
    return restaurantsWithDetours;
  };

  // Add restaurant markers to map
  const addRestaurantMarkers = (restaurants: any[], map: any) => {
    restaurants.forEach((restaurant: any) => {
      const marker = new google.maps.Marker({
        position: restaurant.location,
        map: map,
        title: restaurant.name || restaurant.displayName,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(30, 30)
        }
      });
      
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h3>${restaurant.name || restaurant.displayName}</h3>
            <p>${restaurant.address || restaurant.formattedAddress || 'Address not available'}</p>
            <p>Rating: ${restaurant.rating || 'N/A'}</p>
            ${restaurant.detourDistanceKm ? `<p>Detour: ${restaurant.detourDistanceKm.toFixed(1)} km (${restaurant.detourDurationMinutes.toFixed(0)} min)</p>` : ''}
            <p>Source: ${restaurant.source || 'unknown'}</p>
            <button onclick="navigateToRestaurant('${restaurant.place_id || restaurant.id}')" 
                    style="background: #CC0001; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
              Navigate Here
            </button>
          </div>
        `
      });
      
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });
  };

  const handleLocationSelect = (type: 'start' | 'end', location: Location) => {
    if (type === 'start') {
      setStartLocation(location);
    } else {
      setEndLocation(location);
    }
  };

  const handleRouteSelect = (routeIndex: number) => {
    const route = availableRoutes[routeIndex];
    setSelectedRoute(route);
    
    // Re-render the map with selected route
    const mapElement = document.getElementById('map');
    if (mapElement && window.google?.maps) {
      // Clear existing markers and polylines
      // This is a simplified approach - in a real app you'd manage markers properly
      
      // Find restaurants along the new route
      findRestaurantsAlongRoute(route, null);
    }
  };

  const handleEaterySelect = (restaurant: any) => {
    setSelectedEatery(restaurant);
    console.log('Selected eatery:', restaurant);
  };

  const handleNavigateToEatery = () => {
    if (selectedEatery && startLocation && endLocation) {
      // Create waypoint navigation: Start → Eatery → End
      const waypoint = `${selectedEatery.location.lat},${selectedEatery.location.lng}`;
      const origin = `${startLocation.lat},${startLocation.lng}`;
      const destination = `${endLocation.lat},${endLocation.lng}`;
      
      // Google Maps URL with waypoint
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoint}&travelmode=driving`;
      
      console.log('🧭 Opening navigation with waypoint:', {
        start: startLocation.name,
        waypoint: selectedEatery.name,
        end: endLocation.name
      });
      
      window.open(url, '_blank');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🍽️ Foodie Map - Simple</h1>
        
        <div style={{ margin: '20px 0', width: '100%', maxWidth: '500px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Start Location:</label>
            <input
              type="text"
              placeholder="Enter start city (e.g., Kuala Lumpur)"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              onBlur={(e) => {
                if (e.target.value) {
                  // Simple geocoding - in real app, use Google Places Autocomplete
                  handleLocationSelect('start', {
                    name: e.target.value,
                    lat: 3.1390, // KL coordinates
                    lng: 101.6869
                  });
                }
              }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>End Location:</label>
            <input
              type="text"
              placeholder="Enter end city (e.g., Petaling Jaya)"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              onBlur={(e) => {
                if (e.target.value) {
                  // Simple geocoding - in real app, use Google Places Autocomplete
                  handleLocationSelect('end', {
                    name: e.target.value,
                    lat: 3.0738, // PJ coordinates
                    lng: 101.6050
                  });
                }
              }}
            />
          </div>
          
        <button
          onClick={handleFindRoute}
          disabled={!startLocation || !endLocation || isLoading || !googleMapsLoaded}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#CC0001',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: (isLoading || !googleMapsLoaded) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || !googleMapsLoaded) ? 0.6 : 1,
            marginBottom: '10px'
          }}
        >
          {!googleMapsLoaded ? 'Loading Google Maps...' : isLoading ? 'Finding Route...' : 'Find Food Along Route 🍽️'}
        </button>
        
        {/* Add New Restaurant Button */}
        <button
          onClick={() => setShowSubmissionForm(true)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          ➕ Add New Restaurant
        </button>
          
          {error && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              {error}
            </div>
          )}
        </div>
        
        <div
          id="map"
          style={{
            width: '100%',
            height: '400px',
            border: '2px solid #ccc',
            borderRadius: '8px',
            marginTop: '20px'
          }}
        />
        
        {/* Route Selection */}
        {availableRoutes.length > 1 && (
          <div style={{ marginTop: '20px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ color: '#CC0001', marginBottom: '10px' }}>Select Route:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {availableRoutes.map((route, index) => (
                <button
                  key={index}
                  onClick={() => handleRouteSelect(index)}
                  style={{
                    padding: '10px',
                    backgroundColor: selectedRoute === route ? '#CC0001' : '#f0f0f0',
                    color: selectedRoute === route ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <strong>Route {index + 1}</strong>
                  <br />
                  <small>
                    Distance: {route.legs[0].distance.text} | 
                    Duration: {route.legs[0].duration.text}
                  </small>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Restaurant Selection */}
        {restaurants.length > 0 && (
          <div style={{ marginTop: '20px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ color: '#CC0001', marginBottom: '10px' }}>Restaurants Along Route:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {restaurants.map((restaurant, index) => (
                <button
                  key={index}
                  onClick={() => handleEaterySelect(restaurant)}
                  style={{
                    padding: '10px',
                    backgroundColor: selectedEatery === restaurant ? '#CC0001' : '#f0f0f0',
                    color: selectedEatery === restaurant ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <strong>{restaurant.name || restaurant.displayName}</strong>
                  <br />
                  <small>
                    {restaurant.address || restaurant.formattedAddress}
                    {restaurant.rating && ` | ⭐ ${restaurant.rating}`}
                    {restaurant.detourDistanceKm && ` | 🚗 ${restaurant.detourDistanceKm.toFixed(1)}km (${restaurant.detourDurationMinutes.toFixed(0)}min)`}
                    <br />
                    <span style={{ color: '#666', fontSize: '10px' }}>
                      Source: {restaurant.source || 'unknown'}
                    </span>
                  </small>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Navigation Button */}
        {selectedEatery && (
          <div style={{ marginTop: '20px', width: '100%', maxWidth: '500px' }}>
            <div style={{ 
              backgroundColor: '#f0f8ff', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '10px',
              border: '2px solid #4CAF50'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#2E7D32' }}>📍 Navigation Route:</h4>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <div>🚀 <strong>Start:</strong> {startLocation?.name}</div>
                <div>🍽️ <strong>Stop:</strong> {selectedEatery.name || selectedEatery.displayName}</div>
                <div>🏁 <strong>End:</strong> {endLocation?.name}</div>
              </div>
            </div>
            <button
              onClick={handleNavigateToEatery}
              style={{
                width: '100%',
                padding: '15px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🧭 Start Navigation with Waypoint
            </button>
          </div>
        )}
        
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p>✅ Simple working version</p>
          <p>✅ Route calculation with alternatives</p>
          <p>✅ Restaurant discovery along route</p>
          <p>✅ Route selection (if multiple routes)</p>
          <p>✅ Eatery selection with details</p>
          <p>✅ Drive navigation integration</p>
          <p>✅ User restaurant submission</p>
          <p style={{ color: googleMapsLoaded ? '#4CAF50' : '#FF9800' }}>
            {googleMapsLoaded ? '✅ Google Maps loaded' : '⏳ Loading Google Maps...'}
          </p>
        </div>
      </header>
      
      {/* Submission Form Modal */}
      {showSubmissionForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowSubmissionForm(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
            <EaterySubmissionForm onClose={() => setShowSubmissionForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Global navigation function
(window as any).navigateToRestaurant = function(placeId: string) {
  console.log('Navigating to restaurant:', placeId);
  const url = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  window.open(url, '_blank');
};

export default App;