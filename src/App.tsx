import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { firestoreSearchService } from './services/firestoreSearchService';
import { routeIndexService } from './services/routeIndexService';
import { userActivityService } from './services/userActivityService';
import { calculateRouteBounds, findMinimumDetour } from './utils/distanceUtils';
import EaterySubmissionForm from './components/EaterySubmissionForm';
import { inspectFirestoreData } from './utils/inspectFirestoreData';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from './config/firebaseConfig';

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
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]); // All restaurants for all routes
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]); // Currently visible restaurants
  const [selectedEateries, setSelectedEateries] = useState<any[]>([]);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [showSaveRouteForm, setShowSaveRouteForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  // const [directionsRenderer, setDirectionsRenderer] = useState<any>(null); // No longer needed with direct polyline approach
  const [routePolylines, setRoutePolylines] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [navigationMode, setNavigationMode] = useState<'start' | 'preview'>('preview');
  const [showNavigationChoice, setShowNavigationChoice] = useState(false);
  const [navigationChoiceData, setNavigationChoiceData] = useState<{
    distance: number;
    startName: string;
  } | null>(null);

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

  // Generate or retrieve user ID
  const getOrCreateUserId = () => {
    let userId = localStorage.getItem('foodie_user_id');
    if (!userId) {
      // Generate a unique user ID
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('foodie_user_id', userId);
    }
    return userId;
  };

  // Load saved routes from Firestore
  const loadSavedRoutes = useCallback(async (userId?: string) => {
    try {
      const targetUserId = userId || currentUserId;
      if (!targetUserId) {
        console.log('⏳ No user ID available yet');
        return;
      }

      console.log('🔍 Loading saved routes for user:', targetUserId);

      const q = query(
        collection(db, 'saved_routes'),
        where('userId', '==', targetUserId)
      );
      
      const snapshot = await getDocs(q);
      const routes: any[] = [];
      
      snapshot.forEach(doc => {
        routes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by createdAt in JavaScript instead of Firestore
      routes.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime(); // Descending order
      });
      
      setSavedRoutes(routes);
      console.log(`📚 Loaded ${routes.length} saved routes for user: ${targetUserId}`);
      
    } catch (error) {
      console.error('❌ Error loading saved routes:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      
      // If Firestore is not accessible, just continue without saved routes
      console.log('⚠️ Continuing without saved routes feature');
      setSavedRoutes([]);
    }
  }, [currentUserId]);

  // Load saved routes on component mount
  useEffect(() => {
    const initializeApp = async () => {
      const userId = getOrCreateUserId();
      setCurrentUserId(userId);
      
      // Try to load saved routes
      console.log('🔄 Attempting to load saved routes...');
      try {
        await loadSavedRoutes(userId);
        console.log('✅ Saved routes loaded successfully');
      } catch (error) {
        console.log('⚠️ Could not load saved routes:', error instanceof Error ? error.message : String(error));
        console.log('💡 App will work without saved routes feature');
        console.log('🔧 This might be due to Firebase configuration - check console for details');
      }
    };
    
    initializeApp();
  }, [loadSavedRoutes]);

  const handleFindRoute = async () => {
    console.log('🚀 handleFindRoute called!', { startLocation, endLocation, isLoading, googleMapsLoaded });
    
    if (!startLocation || !endLocation) {
      setError('Please select both start and end locations');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Check route index first
      console.log('🔍 Checking route index...');
      const indexedRoutes = await routeIndexService.getIndexedRoute(startLocation, endLocation);
      
      if (indexedRoutes && indexedRoutes.length > 0) {
        console.log('💰 Route index hit! No API call needed');
        
        // Reconstruct Google Maps route objects from indexed data
        const reconstructedResponses = indexedRoutes.map(route => 
          routeIndexService.reconstructGoogleMapsRoute(route)
        );
        
        // Extract routes from the reconstructed responses
        const reconstructedRoutes = reconstructedResponses.map(response => response.routes[0]);
        
        setAvailableRoutes(reconstructedRoutes);
        setSelectedRoute(reconstructedRoutes[0]);
        
        // Create map and display first route
        const { Map } = await window.google.maps.importLibrary("maps");
        // No longer need DirectionsRenderer with direct polyline approach
        
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
        
        console.log('🗺️ Map created for cached route');
        
        // No longer need DirectionsRenderer with direct polyline approach
        
        // Display first route from index using direct polyline rendering
        const firstRoute = reconstructedRoutes[0];
        console.log('🔍 Rendering polyline directly from indexed route:', {
          routeSummary: firstRoute?.summary,
          hasOverviewPolyline: !!firstRoute?.overview_polyline,
          polylineLength: firstRoute?.overview_polyline?.encoded_path?.length || 0,
          polylinePreview: firstRoute?.overview_polyline?.encoded_path?.substring(0, 50) + '...'
        });
        
        // Create polylines for ALL routes at once
        const { Polyline } = await window.google.maps.importLibrary("maps");
        const { encoding } = await window.google.maps.importLibrary("geometry");
        
        const polylines: any[] = [];
        
        reconstructedRoutes.forEach((route, index) => {
          if (route?.overview_polyline?.encoded_path) {
            const decodedPath = encoding.decodePath(route.overview_polyline.encoded_path);
            
            const polyline = new Polyline({
              path: decodedPath,
              strokeColor: '#4285F4',
              strokeOpacity: index === 0 ? 0.8 : 0, // Show first route, hide others
              strokeWeight: 4,
              geodesic: true,
              map: map
            });
            
            polylines.push(polyline);
          }
        });
        
        // Store all polylines
        setRoutePolylines(polylines);
        
        console.log(`✅ Created ${polylines.length} polylines for all routes`);
        
        // Fit map to show the first route using global Google Maps API
        if (polylines.length > 0 && firstRoute?.overview_polyline?.encoded_path) {
          const decodedPath = encoding.decodePath(firstRoute.overview_polyline.encoded_path);
          const bounds = new (window.google.maps as any).LatLngBounds();
          decodedPath.forEach((point: any) => bounds.extend(point));
          map.fitBounds(bounds);
          console.log('✅ Map bounds fitted to first route');
        }
        
        // Find restaurants for indexed routes
        console.log('🔍 Starting restaurant discovery for indexed routes...');
        findRestaurantsForAllRoutes(reconstructedRoutes, map);
        setIsLoading(false);
        return;
      }

      // 2. Fetch from Google Directions API (cache miss)
      console.log('🔄 Cache miss - fetching from Google Directions API');
      
      const { Map } = await window.google.maps.importLibrary("maps");
        const { DirectionsService } = await window.google.maps.importLibrary("routes");

      // Create map
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('❌ Map element not found in DOM');
        setError('Map element not found. Please refresh the page.');
        setIsLoading(false);
        return;
      }
      
      console.log('🗺️ Map element found:', mapElement);

      const map = new Map(mapElement, {
        center: {
          lat: (startLocation.lat + endLocation.lat) / 2,
          lng: (startLocation.lng + endLocation.lng) / 2
        },
        zoom: 12,
        mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'
      });
      
      console.log('🗺️ Map created for new route:', {
        center: { lat: (startLocation.lat + endLocation.lat) / 2, lng: (startLocation.lng + endLocation.lng) / 2 },
        start: startLocation.name,
        end: endLocation.name
      });

      // Calculate route
      const directionsService = new DirectionsService();
      
      console.log('🗺️ Directions service initialized');

      const request = {
        origin: `${startLocation.lat},${startLocation.lng}`,
        destination: `${endLocation.lat},${endLocation.lng}`,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        provideRouteAlternatives: true, // Get multiple routes
        avoidHighways: false, // Allow highways
        avoidTolls: false, // Allow tolls
        avoidFerries: false, // Allow ferries
        optimizeWaypoints: false, // Don't optimize waypoints
        // Additional parameters to encourage alternative routes
        region: 'MY', // Malaysia region
        language: 'en-MY'
      };

      directionsService.route(request, async (result: any, status: any) => {
        if (status === 'OK') {
          console.log('✅ Google Directions API success:', result.routes.length, 'routes');
          console.log('🔍 Full Google response:', result);
          console.log('🔍 Request parameters:', request);
          console.log('🔍 Route summaries:', result.routes.map((r: any) => r.summary));
          console.log('🔍 Route warnings:', result.routes.map((r: any) => r.warnings));
          console.log('🔍 Route distances:', result.routes.map((r: any) => r.legs?.[0]?.distance?.text || 'Unknown'));
          console.log('🔍 Route durations:', result.routes.map((r: any) => r.legs?.[0]?.duration?.text || 'Unknown'));
          
          // Check if we got alternative routes
          if (result.routes.length === 1) {
            console.log('⚠️ Only 1 route returned. This might be because:');
            console.log('   - No alternative routes exist for this city pair');
            console.log('   - Google considers this the only viable route');
            console.log('   - Distance is too short for meaningful alternatives');
            console.log('   - Route is primarily highway with no alternatives');
          } else {
            console.log('🎉 Multiple routes found! Showing route selection UI');
          }
          
          // Store all available routes
          setAvailableRoutes(result.routes);
          
          // Index the routes for future use (don't await - let it run in background)
          routeIndexService.indexRoute(result.routes, startLocation, endLocation).catch(error => {
            console.error('❌ Route indexing failed (non-critical):', error);
          });

          // Track user activity (don't await - let it run in background)
          if (currentUserId) {
            userActivityService.trackRouteSearch(
              currentUserId, 
              startLocation, 
              endLocation, 
              result.routes.length,
              result.routes
            ).catch(error => {
              console.error('❌ Activity tracking failed (non-critical):', error);
            });
          }
          
          // Select the first route by default
          const firstRoute = result.routes[0];
          setSelectedRoute(firstRoute);
          
          // Route data is now handled by our polyline system
          console.log('🗺️ Route data processed for polyline rendering:', firstRoute.summary);
          
          // Find restaurants for ALL routes at once (more efficient)
          findRestaurantsForAllRoutes(result.routes, map);
        } else {
          console.error('❌ Google Directions API failed:', status);
          setError(`Route calculation failed: ${status}`);
        }
        setIsLoading(false);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  };

  // NEW: Fetch restaurants for ALL routes at once (more efficient)
  const findRestaurantsForAllRoutes = async (routes: any[], map: any) => {
    console.log('🔍 Fetching restaurants for ALL routes at once...');
    
    try {
      // Calculate combined bounds for all routes
      const allBounds = routes.map(route => calculateRouteBounds(route)).filter(Boolean);
      
      if (allBounds.length === 0) {
        console.error('❌ Could not calculate bounds for any route');
        return;
      }
      
      // Create a combined search area that covers all routes
      const combinedBounds = {
        north: Math.max(...allBounds.map((b: any) => b.north)),
        south: Math.min(...allBounds.map((b: any) => b.south)),
        east: Math.max(...allBounds.map((b: any) => b.east)),
        west: Math.min(...allBounds.map((b: any) => b.west))
      };
      
      console.log('📍 Combined bounds for all routes:', combinedBounds);
      
      // Fetch ALL restaurants in the combined area
      const allPlaces = await firestoreSearchService.searchRestaurants(combinedBounds, {
        foodType: 'all',
        minRating: 0,
        halalOnly: false,
        openNow: false
      });
      
      console.log(`🍽️ Found ${allPlaces.length} restaurants in combined area`);
      
      // Calculate detours for ALL restaurants against ALL routes
      const restaurantsWithAllDetours = allPlaces.map((place: any) => {
        const detoursByRoute = routes.map((route, routeIndex) => {
          const detours = calculateDetours([place], route);
          return {
            routeIndex,
            detour: detours[0] || { detourDistanceKm: Infinity, detourDurationMinutes: Infinity }
          };
        });
        
        return {
          ...place,
          detoursByRoute,
          // Default to first route's detour for display
          detourDistanceKm: detoursByRoute[0]?.detour?.detourDistanceKm || Infinity,
          detourDurationMinutes: detoursByRoute[0]?.detour?.detourDurationMinutes || Infinity
        };
      });
      
      // Filter restaurants that are within range of at least one route
      const validRestaurants = restaurantsWithAllDetours.filter((restaurant: any) => 
        restaurant.detoursByRoute.some((d: any) => 
          d.detour.detourDistanceKm <= 2 || d.detour.detourDurationMinutes <= 15
        )
      );
      
      console.log(`📍 ${validRestaurants.length} restaurants within range of at least one route`);
      
      // Store all restaurants
      setAllRestaurants(validRestaurants);
      
      // Show restaurants for the first route by default
      filterRestaurantsForRoute(validRestaurants, routes[0], 0);
      
      // Add markers to map
      if (map) {
        addRestaurantMarkers(validRestaurants, map);
      }
      
    } catch (error) {
      console.error('❌ Restaurant search failed:', error);
      setAllRestaurants([]);
      setFilteredRestaurants([]);
    }
  };

  // NEW: Filter restaurants for a specific route (no API call needed)
  const filterRestaurantsForRoute = (restaurants: any[], route: any, routeIndex: number) => {
    console.log(`🔄 Filtering restaurants for Route ${routeIndex + 1}...`);
    
    const filtered = restaurants.filter(restaurant => {
      const routeDetour = restaurant.detoursByRoute[routeIndex];
      return routeDetour && (
        routeDetour.detour.detourDistanceKm <= 2 || 
        routeDetour.detour.detourDurationMinutes <= 15
      );
    }).map(restaurant => ({
      ...restaurant,
      // Update display detour info for the selected route
      detourDistanceKm: restaurant.detoursByRoute[routeIndex].detour.detourDistanceKm,
      detourDurationMinutes: restaurant.detoursByRoute[routeIndex].detour.detourDurationMinutes
    }));
    
    console.log(`📍 ${filtered.length} restaurants visible for Route ${routeIndex + 1}`);
    setFilteredRestaurants(filtered);
  };

  // Calculate detours using Haversine formula (NO Distance Matrix API!)
  const calculateDetours = (places: any[], route: any) => {
    console.log('💰 Using Haversine formula - NO Distance Matrix API cost!');
    console.log('🔍 Route structure:', route);
    
    // Extract route points from the route
    const routePoints: Array<{lat: number, lng: number}> = [];
    if (route.legs && route.legs.length > 0) {
      route.legs.forEach((leg: any) => {
        if (leg.steps) {
          leg.steps.forEach((step: any) => {
            routePoints.push({
              lat: typeof step.start_location.lat === 'function' ? step.start_location.lat() : step.start_location.lat,
              lng: typeof step.start_location.lng === 'function' ? step.start_location.lng() : step.start_location.lng
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
          <div style="padding: 10px; color: #000000;">
            <h3 style="color: #000000; margin: 0 0 8px 0;">${restaurant.name || restaurant.displayName}</h3>
            <p style="color: #000000; margin: 4px 0;">${restaurant.address || restaurant.formattedAddress || 'Address not available'}</p>
            <p style="color: #000000; margin: 4px 0;">Rating: ${restaurant.rating || 'N/A'}</p>
            ${restaurant.detourDistanceKm ? `<p style="color: #000000; margin: 4px 0;">Detour: ${restaurant.detourDistanceKm.toFixed(1)} km (${restaurant.detourDurationMinutes.toFixed(0)} min)</p>` : ''}
            <p style="color: #000000; margin: 4px 0; font-size: 12px;">Source: ${restaurant.source || 'unknown'}</p>
            <button onclick="navigateToRestaurant('${restaurant.place_id || restaurant.id}')" 
                    style="background: #CC0001; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 8px;">
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

  const handleLocationSelect = async (type: 'start' | 'end', location: Location) => {
    if (type === 'start') {
      setStartLocation(location);
      
      // Prompt for location permission after start location is set
      console.log('📍 Prompting for location permission after start location input...');
      try {
        const userLoc = await getUserLocation();
        setUserLocation(userLoc);
        console.log('✅ User location obtained after start location input:', userLoc);
      } catch (error) {
        console.log('⚠️ Location permission denied or failed:', error);
        // Don't show error to user, just continue without location
      }
    } else {
      setEndLocation(location);
    }
  };

  // Geocode location using Google Geocoding API
  const geocodeLocation = async (address: string, type: 'start' | 'end') => {
    try {
      console.log(`🔍 Geocoding ${type} location:`, address);
      
      const { Geocoder } = await window.google.maps.importLibrary("geocoding");
      const geocoder = new Geocoder();
      
      geocoder.geocode({ address: address + ', Malaysia' }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const locationData: Location = {
            name: results[0].formatted_address,
            lat: location.lat(),
            lng: location.lng()
          };
          
          handleLocationSelect(type, locationData);
          console.log(`✅ Geocoded ${type} location:`, locationData.name);
        } else {
          console.error(`❌ Geocoding failed for ${type}:`, status);
          alert(`Could not find location: ${address}`);
        }
      });
    } catch (error) {
      console.error(`❌ Geocoding error for ${type}:`, error);
      alert(`Error geocoding location: ${address}`);
    }
  };


  const handleRouteSelect = async (routeIndex: number) => {
    const route = availableRoutes[routeIndex];
    setSelectedRoute(route);
    
    try {
      console.log(`🔄 Switching to Route ${routeIndex + 1}: ${route.summary}`);
      
      // Simply show/hide polylines - much simpler!
      routePolylines.forEach((polyline, index) => {
        if (index === routeIndex) {
          polyline.setOptions({ strokeOpacity: 0.8 }); // Show selected route
        } else {
          polyline.setOptions({ strokeOpacity: 0 }); // Hide other routes
        }
      });
      
      console.log(`✅ Route ${routeIndex + 1} polyline shown, others hidden`);
      
      // Filter existing restaurants for the selected route (NO API call!)
      if (allRestaurants.length > 0) {
        filterRestaurantsForRoute(allRestaurants, route, routeIndex);
        setSelectedEateries([]); // Clear selected restaurants when switching routes
      }
      
      console.log(`🔄 Switched to Route ${routeIndex + 1} - Filtered restaurants (no API call)`);
    } catch (error) {
      console.error('❌ Error switching route:', error);
    }
  };

  const handleEaterySelect = (restaurant: any) => {
    setSelectedEateries(prev => {
      // Create a unique identifier for each restaurant
      const getUniqueId = (eatery: any) => {
        return eatery.place_id || eatery.id || `${eatery.location.lat}_${eatery.location.lng}_${eatery.name}`;
      };
      
      const restaurantUniqueId = getUniqueId(restaurant);
      const isSelected = prev.some(eatery => getUniqueId(eatery) === restaurantUniqueId);
      
      console.log('Selection check:', {
        restaurant: restaurant.name,
        uniqueId: restaurantUniqueId,
        isSelected,
        currentSelection: prev.map(e => ({ name: e.name, uniqueId: getUniqueId(e) }))
      });
      
      if (isSelected) {
        // Remove from selection
        const updated = prev.filter(eatery => getUniqueId(eatery) !== restaurantUniqueId);
        console.log('Removed eatery from selection:', restaurant.name);
        
        // Track deselection activity
        if (currentUserId) {
          userActivityService.trackRestaurantSelection(
            currentUserId,
            restaurant.id || restaurant.place_id,
            restaurant.name,
            selectedRoute?.summary || 'unknown',
            'deselection'
          ).catch(error => {
            console.error('❌ Activity tracking failed (non-critical):', error);
          });
        }
        
        return updated;
      } else {
        // Add to selection
        const updated = [...prev, restaurant];
        console.log('Added eatery to selection:', restaurant.name);
        
        // Track selection activity
        if (currentUserId) {
          userActivityService.trackRestaurantSelection(
            currentUserId,
            restaurant.id || restaurant.place_id,
            restaurant.name,
            selectedRoute?.summary || 'unknown',
            prev.length === 0 ? 'single_selection' : 'multi_selection'
          ).catch(error => {
            console.error('❌ Activity tracking failed (non-critical):', error);
          });
        }
        
        return updated;
      }
    });
  };

  // Calculate distance between two points using Haversine formula
  const calculateHaversineDistance = (point1: Location, point2: Location): number => {
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


  // Get user's current location
  const getUserLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.log('❌ Geolocation is not supported');
        reject(new Error('Geolocation is not supported'));
        return;
      }

      console.log('📍 Requesting user location permission...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            name: 'Current Location',
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
              console.log('✅ User location obtained:', location);
              
              // Track location permission activity
              if (currentUserId) {
                userActivityService.trackLocationPermission(
                  currentUserId,
                  true,
                  {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                  }
                ).catch(error => {
                  console.error('❌ Activity tracking failed (non-critical):', error);
                });
              }
              
              resolve(location);
        },
        (error) => {
          console.log('❌ Geolocation error:', error);
          
          // Track location permission denial
          if (currentUserId) {
            userActivityService.trackLocationPermission(
              currentUserId,
              false,
              null
            ).catch(trackError => {
              console.error('❌ Activity tracking failed (non-critical):', trackError);
            });
          }
          
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  // Determine navigation mode based on user proximity
  const determineNavigationMode = async (startLoc: Location) => {
    try {
      console.log('📍 Getting user location for smart navigation...');
      const userLoc = await getUserLocation();
      setUserLocation(userLoc);
      
      const distance = calculateHaversineDistance(userLoc, startLoc);
      const isNear = distance <= 0.1; // 100m threshold
      
      if (isNear) {
        // User is close - auto-start navigation
        setNavigationMode('start');
        console.log(`🎯 Auto-start navigation (${distance.toFixed(2)}km from start)`);
        return 'start';
      } else {
        // User is far - show choice dialog
        setNavigationChoiceData({
          distance,
          startName: startLoc.name
        });
        setShowNavigationChoice(true);
        console.log(`🎯 Showing choice dialog (${distance.toFixed(2)}km from start)`);
        return 'choice';
      }
    } catch (error) {
      console.log('⚠️ Location access failed, using preview mode:', error);
      setNavigationMode('preview');
      return 'preview';
    }
  };

  // Handle user's navigation choice
  const handleNavigationChoice = (choice: 'start' | 'preview') => {
    setNavigationMode(choice);
    setShowNavigationChoice(false);
    
    // Execute navigation with chosen mode
    executeNavigation(choice);
  };

  // Execute navigation with specified mode
  const executeNavigation = (mode: 'start' | 'preview') => {
    if (!startLocation || !endLocation) return;
    
    const origin = mode === 'start' ? 'My Location' : `${startLocation.lat},${startLocation.lng}`;
    const destination = `${endLocation.lat},${endLocation.lng}`;
    
    let url;
    
    if (selectedEateries.length > 0) {
      // Create waypoint navigation: Start → Eatery1 → Eatery2 → ... → End
      const waypoints = selectedEateries.map(eatery => 
        `${eatery.location.lat},${eatery.location.lng}`
      ).join('|');
      
      url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
      
      console.log('🧭 Opening navigation with waypoints:', {
        mode,
        start: startLocation.name,
        waypoints: selectedEateries.map(e => e.name),
        end: endLocation.name
      });
    } else {
      // Direct navigation: Start → End
      url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
      
      console.log('🧭 Opening direct navigation:', {
        mode,
        start: startLocation.name,
        end: endLocation.name
      });
    }
    
    // Track navigation activity
    if (currentUserId) {
      userActivityService.trackNavigation(
        currentUserId,
        selectedRoute?.summary || 'unknown',
        mode,
        selectedEateries
      ).catch(error => {
        console.error('❌ Activity tracking failed (non-critical):', error);
      });
    }
    
    window.open(url, '_blank');
  };

  const handleNavigateToEateries = async () => {
    if (startLocation && endLocation) {
      // Determine navigation mode based on user proximity
      const mode = await determineNavigationMode(startLocation);
      
      if (mode === 'choice') {
        // Choice dialog will be shown, don't execute navigation yet
        return;
      } else {
        // Execute navigation immediately (start or preview)
        executeNavigation(mode);
      }
    }
  };

  // Save current route with selected restaurants (simplified approach)
  const handleSaveRoute = async () => {
    if (!routeName.trim() || !startLocation || !endLocation) {
      alert('Please provide a route name and ensure you have both start and end locations.');
      return;
    }

    try {
      // Store only essential data - let "Find Food Along Route" do the work
      const routeData = {
        name: routeName.trim(),
        startLocation,
        endLocation,
        selectedEateries,
        createdAt: new Date(),
        userId: currentUserId,
        totalStops: selectedEateries.length,
        totalDistance: selectedRoute?.legs?.[0]?.distance?.text || 'Unknown',
        totalDuration: selectedRoute?.legs?.[0]?.duration?.text || 'Unknown'
      };

      await addDoc(collection(db, 'saved_routes'), routeData);
      
      console.log('✅ Route saved successfully (simplified):', routeName);
      alert(`Route "${routeName}" saved successfully!`);
      
      // Reset form
      setRouteName('');
      setShowSaveRouteForm(false);
      
      // Track route save activity
      if (currentUserId) {
        userActivityService.trackRouteSave(
          currentUserId,
          routeName,
          {
            startLocation,
            endLocation,
            totalDistance: selectedRoute?.legs?.[0]?.distance?.text || 'Unknown',
            totalDuration: selectedRoute?.legs?.[0]?.duration?.text || 'Unknown'
          },
          selectedEateries
        ).catch(error => {
          console.error('❌ Activity tracking failed (non-critical):', error);
        });
      }

      // Refresh saved routes
      loadSavedRoutes(currentUserId);
      
    } catch (error) {
      console.error('❌ Error saving route:', error);
      alert('Failed to save route. Please try again.');
    }
  };

  // Load a saved route (simplified approach)
  const handleLoadRoute = async (savedRoute: any) => {
    console.log('🔄 Loading saved route:', savedRoute.name);
    
    // Set only the essential data
    setStartLocation(savedRoute.startLocation);
    setEndLocation(savedRoute.endLocation);
    setSelectedEateries(savedRoute.selectedEateries || []);
    
    // Clear any existing route data
    setAvailableRoutes([]);
    setSelectedRoute(null);
    setAllRestaurants([]);
    setFilteredRestaurants([]);
    setRoutePolylines([]);
    
    // Close the saved routes modal
    setShowSavedRoutes(false);
    
    // Automatically trigger route finding - no need for user to click another button!
    console.log('🚀 Auto-triggering route finding for saved route...');
    await handleFindRoute();
    
    // Show success message
    alert(`Route "${savedRoute.name}" loaded and map is ready!`);
  };

  // Delete a saved route
  const handleDeleteRoute = async (routeId: string, routeName: string) => {
    if (window.confirm(`Are you sure you want to delete "${routeName}"?`)) {
      try {
        await deleteDoc(doc(db, 'saved_routes', routeId));
        console.log('🗑️ Route deleted:', routeName);
        loadSavedRoutes(currentUserId); // Refresh the list
        alert(`Route "${routeName}" deleted successfully.`);
      } catch (error) {
        console.error('❌ Error deleting route:', error);
        alert('Failed to delete route. Please try again.');
      }
    }
  };

  // Clear user data (for testing or privacy)
  const handleClearUserData = () => {
    if (window.confirm('Are you sure you want to clear all your saved routes? This cannot be undone.')) {
      localStorage.removeItem('foodie_user_id');
      setCurrentUserId('');
      setSavedRoutes([]);
      alert('User data cleared. A new user ID will be generated on next page load.');
    }
  };

  // Clear route cache (for debugging)
  const handleClearRouteCache = async () => {
    if (window.confirm('Are you sure you want to clear all cached routes? This will force fresh API calls.')) {
      try {
        // Clear route cache collection
        const routeCacheRef = collection(db, 'route_cache');
        const snapshot = await getDocs(routeCacheRef);
        
        for (const doc of snapshot.docs) {
          await deleteDoc(doc.ref);
        }
        
        console.log('✅ Route cache cleared successfully');
        alert('Route cache cleared successfully!');
      } catch (error) {
        console.error('Error clearing cache:', error);
        alert('Error clearing cache. Check console for details.');
      }
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
                      placeholder="Enter start city (e.g., Kajang)"
                      style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      onBlur={async (e) => {
                        if (e.target.value) {
                          await geocodeLocation(e.target.value, 'start');
                        }
                      }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label>End Location:</label>
                    <input
                      type="text"
                      placeholder="Enter end city (e.g., Seremban)"
                      style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                      onBlur={async (e) => {
                        if (e.target.value) {
                          await geocodeLocation(e.target.value, 'end');
                        }
                      }}
                    />
                  </div>
          
                <button
                  onClick={() => {
                    console.log('🔘 Button clicked!');
                    handleFindRoute();
                  }}
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
                  {!googleMapsLoaded ? 'Loading Google Maps...' : isLoading ? 'Finding Route...' : `Find Food Along Route 🍽️ (${startLocation ? '✓' : '✗'} → ${endLocation ? '✓' : '✗'})`}
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
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          ➕ Add New Restaurant
        </button>

                {/* Save Route Button */}
                {startLocation && endLocation && (
                  <button
                    onClick={() => setShowSaveRouteForm(true)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#FF9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      marginBottom: '10px'
                    }}
                  >
                    💾 Save This Route
                  </button>
                )}

        {/* View Saved Routes Button */}
        <button
          onClick={() => setShowSavedRoutes(true)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          📚 My Saved Routes ({savedRoutes.length})
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
                    <div style={{
                      backgroundColor: '#e3f2fd',
                      border: '2px solid #2196F3',
                      borderRadius: '10px',
                      padding: '15px',
                      marginBottom: '15px'
                    }}>
                      <h3 style={{ 
                        color: '#1976D2', 
                        marginBottom: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🛣️ {availableRoutes.length} Routes Found!
                      </h3>
                      <p style={{ 
                        color: '#1976D2', 
                        fontSize: '14px',
                        margin: '0 0 8px 0'
                      }}>
                        Select different routes to discover unique restaurants along each path:
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {availableRoutes.map((route, index) => (
                        <button
                          key={index}
                          onClick={() => handleRouteSelect(index)}
                          style={{
                            padding: '15px',
                            backgroundColor: selectedRoute === route ? '#e8f5e8' : 'white',
                            color: selectedRoute === route ? '#2E7D32' : '#333',
                            border: selectedRoute === route ? '3px solid #4CAF50' : '2px solid #e0e0e0',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            boxShadow: selectedRoute === route ? '0 4px 8px rgba(76, 175, 80, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          onMouseOver={(e) => {
                            if (selectedRoute !== route) {
                              const target = e.target as HTMLButtonElement;
                              target.style.backgroundColor = '#f5f5f5';
                              target.style.borderColor = '#2196F3';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (selectedRoute !== route) {
                              const target = e.target as HTMLButtonElement;
                              target.style.backgroundColor = 'white';
                              target.style.borderColor = '#e0e0e0';
                            }
                          }}
                        >
                          <div style={{ 
                            fontWeight: 'bold', 
                            marginBottom: '6px',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {selectedRoute === route ? '✅' : '🛣️'} Route {index + 1}: {route.summary || 'Unknown Route'}
                          </div>
                          <div style={{ 
                            color: '#666', 
                            fontSize: '13px',
                            display: 'flex',
                            gap: '15px',
                            flexWrap: 'wrap'
                          }}>
                            <span>📏 {route.legs?.[0]?.distance?.text || route.legs?.[0]?.distance || 'Unknown'}</span>
                            <span>⏱️ {route.legs?.[0]?.duration?.text || route.legs?.[0]?.duration || 'Unknown'}</span>
                          </div>
                          {route.warnings && route.warnings.length > 0 && (
                            <div style={{ 
                              color: '#FF9800', 
                              fontSize: '12px',
                              marginTop: '4px',
                              fontStyle: 'italic'
                            }}>
                              ⚠️ {route.warnings[0]}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    <div style={{ 
                      marginTop: '15px', 
                      padding: '12px', 
                      backgroundColor: '#fff3e0', 
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#E65100',
                      border: '1px solid #FFB74D'
                    }}>
                      💡 <strong>Pro Tip:</strong> Each route shows different restaurants along its path. Switch routes to discover new eateries and find the best food stops for your journey!
                    </div>
                  </div>
                )}
                
                {/* Single Route Info */}
                {availableRoutes.length === 1 && (
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '12px', 
                    backgroundColor: '#f0f8ff', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#1976D2',
                    border: '1px solid #BBDEFB',
                    maxWidth: '500px'
                  }}>
                    ℹ️ <strong>Single Route Found:</strong> Google Maps found only one viable route for this journey. This is common for direct highway routes or short distances.
                  </div>
                )}
        
                {/* Restaurant Selection */}
                {filteredRestaurants.length > 0 && (
                  <div style={{ marginTop: '20px', width: '100%', maxWidth: '500px' }}>
                    <h3 style={{ color: '#CC0001', marginBottom: '10px' }}>
                      Restaurants Along Route ({selectedEateries.length} selected):
                    </h3>
                    <div style={{ 
                      backgroundColor: '#e8f5e8', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      marginBottom: '10px',
                      fontSize: '12px',
                      color: '#2e7d32'
                    }}>
                      💡 Showing {filteredRestaurants.length} restaurants along the selected route
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                      {filteredRestaurants.map((restaurant, index) => {
                // Create a unique identifier for each restaurant
                const getUniqueId = (eatery: any) => {
                  return eatery.place_id || eatery.id || `${eatery.location.lat}_${eatery.location.lng}_${eatery.name}`;
                };
                
                const restaurantUniqueId = getUniqueId(restaurant);
                const isSelected = selectedEateries.some(eatery => getUniqueId(eatery) === restaurantUniqueId);
                
                return (
                  <div
                    key={index}
                    style={{
                      padding: '10px',
                      backgroundColor: isSelected ? '#4CAF50' : '#f0f0f0',
                      color: isSelected ? 'white' : 'black',
                      border: isSelected ? '2px solid #2E7D32' : '1px solid #ddd',
                      borderRadius: '4px',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <strong>{restaurant.name || restaurant.displayName}</strong>
                        <br />
                                <small>
                                  {restaurant.address || restaurant.formattedAddress}
                                  {restaurant.rating && ` | ⭐ ${restaurant.rating}`}
                                  {restaurant.distanceFromUserKm && ` | 📍 ${restaurant.distanceFromUserKm} from you`}
                                  {restaurant.detourDistanceKm && ` | 🚗 ${restaurant.detourDistanceKm.toFixed(1)}km (${restaurant.detourDurationMinutes.toFixed(0)}min)`}
                                  <br />
                                  <span style={{ color: isSelected ? '#E8F5E8' : '#666', fontSize: '10px' }}>
                                    Source: {restaurant.source || 'unknown'}
                                  </span>
                                </small>
                      </div>
                      <button
                        onClick={() => handleEaterySelect(restaurant)}
                        style={{
                          marginLeft: '10px',
                          padding: '5px 10px',
                          backgroundColor: isSelected ? '#FF5722' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {isSelected ? '❌ Remove' : '✅ Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
                {/* Navigation Section - Always show if route is found */}
                {startLocation && endLocation && (() => {
                  console.log('🎯 Navigation section rendered!', { startLocation: startLocation?.name, endLocation: endLocation?.name });
                  return (
                  <div style={{ marginTop: '20px', width: '100%', maxWidth: '500px' }}>
                    {selectedEateries.length > 0 ? (
                      <div style={{ 
                        backgroundColor: '#f0f8ff', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        marginBottom: '10px',
                        border: '2px solid #4CAF50'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#2E7D32' }}>📍 Your Food Journey Route:</h4>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          <div>🚀 <strong>Start:</strong> {startLocation?.name}</div>
                          {selectedEateries.map((eatery, index) => (
                            <div key={index}>
                              🍽️ <strong>Stop {index + 1}:</strong> {eatery.name || eatery.displayName}
                              {eatery.detourDistanceKm && (
                                <span style={{ color: '#888', fontSize: '12px' }}>
                                  {' '}(+{eatery.detourDistanceKm.toFixed(1)}km)
                                </span>
                              )}
                            </div>
                          ))}
                          <div>🏁 <strong>End:</strong> {endLocation?.name}</div>
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                          Total stops: {selectedEateries.length} restaurant{selectedEateries.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        backgroundColor: '#f0f8ff', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        marginBottom: '10px',
                        border: '2px solid #2196F3'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#1976D2' }}>🗺️ Direct Route Navigation:</h4>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          <div>🚀 <strong>Start:</strong> {startLocation?.name}</div>
                          <div>🏁 <strong>End:</strong> {endLocation?.name}</div>
                        </div>
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                          No restaurants selected - direct route navigation
                        </div>
                      </div>
                    )}
                    {/* Location Status Indicator */}
                    {userLocation && startLocation && (
                      <div style={{ 
                        marginBottom: '10px', 
                        padding: '8px', 
                        backgroundColor: navigationMode === 'start' ? '#e8f5e8' : '#e3f2fd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#333'
                      }}>
                        {navigationMode === 'start' ? (
                          <>📍 You're here! Ready to start navigation</>
                        ) : (
                          <>📍 You're {calculateHaversineDistance(userLocation, startLocation).toFixed(1)}km from {startLocation.name}</>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={handleNavigateToEateries}
                      style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: navigationMode === 'start' ? '#4CAF50' : '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {navigationMode === 'start' ? (
                        selectedEateries.length > 0 
                          ? `🚀 Start Multi-Stop Navigation (${selectedEateries.length} stops)`
                          : '🚀 Start Direct Navigation'
                      ) : (
                        selectedEateries.length > 0 
                          ? `📋 Preview Multi-Stop Route (${selectedEateries.length} stops)`
                          : '📋 Preview Direct Route'
                      )}
                    </button>
                  </div>
                  );
                })()}
        
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p>✅ Simple working version</p>
          <p>✅ Route calculation with alternatives</p>
          <p>✅ Restaurant discovery along route</p>
          <p>✅ Route selection (if multiple routes)</p>
          <p>✅ Multi-restaurant selection for food tours</p>
          <p>✅ Multi-stop navigation with waypoints</p>
          <p>✅ Save & load custom routes (user-specific)</p>
          <p>✅ Drive navigation integration</p>
          <p>✅ User restaurant submission</p>
          <p style={{ color: googleMapsLoaded ? '#4CAF50' : '#FF9800' }}>
            {googleMapsLoaded ? '✅ Google Maps loaded' : '⏳ Loading Google Maps...'}
          </p>
                  {currentUserId && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <p style={{ color: '#2196F3', fontSize: '12px', margin: 0 }}>
                        👤 User ID: {currentUserId}
                      </p>
                      <button
                        onClick={handleClearUserData}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                        title="Clear all saved routes and generate new user ID"
                      >
                        🗑️ Clear Data
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            console.log('🔍 Running Firestore data inspection...');
                            await inspectFirestoreData();
                          } catch (error) {
                            console.error('❌ Inspection failed:', error);
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                        title="Inspect all Firestore collections and data"
                      >
                        🔍 Inspect Data
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            console.log('🎮 Getting user activity and achievements...');
                            const summary = await userActivityService.getUserActivitySummary(currentUserId, '30d');
                            const achievements = await userActivityService.getUserAchievements(currentUserId);
                            const leaderboard = await userActivityService.getLeaderboard('30d', 5);
                            
                            console.log('📊 User Activity Summary:', summary);
                            console.log('🏆 User Achievements:', achievements);
                            console.log('🏅 Leaderboard:', leaderboard);
                            
                            alert(`🎮 Beta Tester Stats:\n\n📊 Total Activities: ${summary?.totalActivities || 0}\n🏆 Total Points: ${summary?.totalPoints || 0}\n🏅 Achievements: ${achievements.length}\n\nCheck console for detailed data!`);
                          } catch (error) {
                            console.error('❌ Failed to get user stats:', error);
                            alert('Failed to get user stats. Check console for details.');
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#9C27B0',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                        title="View user activity, achievements, and leaderboard"
                      >
                        🎮 My Stats
                      </button>
                      <button
                        onClick={() => {
                          // Test with a city pair that's more likely to have multiple routes
                          setStartLocation({ name: 'Kuala Lumpur, Malaysia', lat: 3.1390, lng: 101.6869 });
                          setEndLocation({ name: 'Penang, Malaysia', lat: 5.4164, lng: 100.3327 });
                          console.log('🧪 Testing with KL to Penang route (more likely to have alternatives)');
                        }}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#FF9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                        title="Test with KL to Penang (more likely to have multiple routes)"
                      >
                        🧪 Test Multi-Route
                      </button>
                      <button
                        onClick={handleClearRouteCache}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#FF9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                        title="Clear all cached routes (ONE TIME FIX for route structure)"
                      >
                        🗑️ Clear Cache (Fix Route Structure)
                      </button>
                    </div>
                  )}
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

      {/* Save Route Modal */}
      {showSaveRouteForm && (
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
            padding: '20px',
            maxWidth: '400px',
            width: '100%',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowSaveRouteForm(false)}
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
            
            <h2 style={{ color: '#FF9800', marginBottom: '20px' }}>💾 Save Your Route</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Route Name *
              </label>
              <input
                type="text"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g., Weekend Food Tour, Family Dinner Route"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

                    <div style={{ 
                      backgroundColor: '#f0f8ff', 
                      padding: '15px', 
                      borderRadius: '8px', 
                      marginBottom: '15px',
                      border: '1px solid #2196F3'
                    }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#1976D2' }}>Route Summary:</h4>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        <div>🚀 <strong>Start:</strong> {startLocation?.name}</div>
                        <div>🏁 <strong>End:</strong> {endLocation?.name}</div>
                        <div>🍽️ <strong>Stops:</strong> {selectedEateries.length} restaurant{selectedEateries.length > 1 ? 's' : ''} {selectedEateries.length === 0 ? '(Direct Route)' : ''}</div>
                        <div>📏 <strong>Distance:</strong> {selectedRoute?.legs?.[0]?.distance?.text || 'Unknown'}</div>
                        <div>⏱️ <strong>Duration:</strong> {selectedRoute?.legs?.[0]?.duration?.text || 'Unknown'}</div>
                      </div>
                    </div>

            <button
              onClick={handleSaveRoute}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              💾 Save Route
            </button>
            
            <button
              onClick={() => setShowSaveRouteForm(false)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Saved Routes Modal */}
      {showSavedRoutes && (
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
            padding: '20px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowSavedRoutes(false)}
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
            
            <h2 style={{ color: '#2196F3', marginBottom: '20px' }}>📚 My Saved Routes</h2>
            
            {savedRoutes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No saved routes yet.</p>
                <p>Create a route with selected restaurants and save it for future reference!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {savedRoutes.map((route) => (
                  <div
                    key={route.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '15px',
                      backgroundColor: '#f9f9f9'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#2196F3' }}>{route.name}</h3>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                          <div>🚀 <strong>Start:</strong> {route.startLocation?.name}</div>
                          <div>🏁 <strong>End:</strong> {route.endLocation?.name}</div>
                          <div>🍽️ <strong>Stops:</strong> {route.totalStops} restaurant{route.totalStops > 1 ? 's' : ''}</div>
                          <div>📏 <strong>Distance:</strong> {route.totalDistance}</div>
                          <div>⏱️ <strong>Duration:</strong> {route.totalDuration}</div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                            Saved: {route.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginLeft: '10px' }}>
                        <button
                          onClick={() => handleLoadRoute(route)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          🔄 Load
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(route.id, route.name)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Choice Dialog */}
      {showNavigationChoice && navigationChoiceData && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ 
              marginBottom: '20px', 
              color: '#333',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              🎯 You're {navigationChoiceData.distance.toFixed(1)}km from {navigationChoiceData.startName}
            </h3>
            
            <p style={{ 
              marginBottom: '25px', 
              color: '#666',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              What would you like to do?
            </p>
            
            <div style={{ 
              display: 'flex', 
              gap: '15px',
              flexDirection: 'column'
            }}>
              <button
                onClick={() => handleNavigationChoice('start')}
                style={{
                  padding: '15px 25px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                🚀 Start Navigation Now
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  (Turn-by-turn from your location)
                </div>
              </button>
              
              <button
                onClick={() => handleNavigationChoice('preview')}
                style={{
                  padding: '15px 25px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📋 Plan Route
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  (Preview route for later)
                </div>
              </button>
            </div>
            
            <button
              onClick={() => setShowNavigationChoice(false)}
              style={{
                marginTop: '20px',
                padding: '8px 16px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
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