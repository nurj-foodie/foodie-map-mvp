import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { firestoreSearchService } from './services/firestoreSearchService';
import { placeSearchService } from './services/placeSearchService';
import { routeIndexService } from './services/routeIndexService';
import { userActivityService } from './services/userActivityService';
import { rateLimitService } from './services/rateLimitService';
import { distanceMatrixService } from './services/distanceMatrixService';
import { routePrePopulationService } from './services/routePrePopulationService';
import { analyticsService } from './services/analyticsService';
import { locationIndexService } from './services/locationIndexService';
import { keywordLearningService } from './services/keywordLearningService';
import { calculateRouteBounds } from './utils/distanceUtils';
// import { findMinimumDetour } from './utils/distanceUtils'; // Unused for now
import { inspectFirestoreData } from './utils/inspectFirestoreData';
import RestaurantModal from './components/RestaurantModal';
import BottomNavigation from './components/BottomNavigation';
import SearchTabNew from './components/SearchTabNew';
import FavoritesTab from './components/FavoritesTab';
import UserTab from './components/UserTab';
import AdminDashboard from './components/AdminDashboard';
import AddRestaurantTab from './components/AddRestaurantTab';
import RouteInputForm from './components/RouteInputForm';
import RouteResults from './components/RouteResults';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { isAdminUser, getAdminAccess } from './utils/adminAuth';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from './config/firebaseConfig';
const RouteResultsAny: any = RouteResults;

interface Location {
  name: string;
  lat: number;
  lng: number;
}

// Main App component that uses auth context
const AppWithAuth: React.FC = () => {
  const { user } = useAuth();
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [allRestaurants, setAllRestaurants] = useState<any[]>([]); // All restaurants for all routes
  const [allRNRStops, setAllRNRStops] = useState<any[]>([]); // All R&R stops for all routes
  const [allPetrolStations, setAllPetrolStations] = useState<any[]>([]); // All petrol stations for all routes
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]); // Currently visible restaurants
  const [filteredRNRStops, setFilteredRNRStops] = useState<any[]>([]); // Currently visible R&R stops
  const [filteredPetrolStations, setFilteredPetrolStations] = useState<any[]>([]); // Currently visible petrol stations
  const [selectedPlaceType, setSelectedPlaceType] = useState<'all' | 'restaurant' | 'rnr' | 'petrol_station'>('all'); // Filter by place type
  const [restaurantMarkers, setRestaurantMarkers] = useState<any[]>([]); // Track all markers for removal
  const [currentMapInstance, setCurrentMapInstance] = useState<any>(null); // Store map instance for route switching
  const [selectedEateries, setSelectedEateries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'search' | 'add' | 'favorites' | 'user' | 'admin'>('discover');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRouteResults, setShowRouteResults] = useState(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [hasRequestedGeolocation, setHasRequestedGeolocation] = useState(false);
  const [startQuery, setStartQuery] = useState<string | null>(null);
  const [endQuery, setEndQuery] = useState<string | null>(null);
  const [lastGeocodedStart, setLastGeocodedStart] = useState('');
  const [lastGeocodedEnd, setLastGeocodedEnd] = useState('');
  const startDebounceRef = useRef<any>(null);
  const endDebounceRef = useRef<any>(null);

  const waitForNextFrame = () => new Promise<void>(resolve => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(() => resolve(), 0);
    }
  });
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [showSaveRouteForm, setShowSaveRouteForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  // const [directionsRenderer, setDirectionsRenderer] = useState<any>(null); // No longer needed with direct polyline approach
  const [routePolylines, setRoutePolylines] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [navigationMode, setNavigationMode] = useState<'start' | 'preview'>('preview');
  const [showNavigationChoice, setShowNavigationChoice] = useState(false);
  const [navigationChoiceData, setNavigationChoiceData] = useState<{
    distance: number;
    startName: string;
  } | null>(null);
  // const [rateLimitStats, setRateLimitStats] = useState<any>(null); // Unused for now

  // Autocomplete state for route search inputs
  const [startSuggestions, setStartSuggestions] = useState<string[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<string[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

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

  // Update rate limit stats
  // const updateRateLimitStats = useCallback(() => {
  //   if (currentUserId) {
  //     const stats = rateLimitService.getUserStats(currentUserId);
  //     setRateLimitStats(stats);
  //   }
  // }, [currentUserId]); // Unused for now

  // Check admin status when user changes
  useEffect(() => {
    if (user && isAdminUser(user) && getAdminAccess(user)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Load saved routes on component mount
  useEffect(() => {
    const initializeApp = async () => {
      const userId = getOrCreateUserId();
      setCurrentUserId(userId);

      // Update rate limit stats
      // updateRateLimitStats(); // Unused for now

      // Initialize keyword learning system (the "brain")
      // Run in background to avoid blocking app startup
      // The brain will start learning 2 seconds after app loads
      setTimeout(async () => {
        try {
          console.log('🧠 Starting keyword learning system (brain)...');
          await keywordLearningService.initialize();
          console.log('✅ Keyword learning system (brain) is now active!');
        } catch (error) {
          console.warn('⚠️ Could not initialize keyword learning system:', error);
          console.log('💡 App will work without automatic keyword learning');
        }
      }, 2000);

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
  }, [loadSavedRoutes]); // updateRateLimitStats removed

  // Trigger pre-population ONLY after Google Maps is loaded
  useEffect(() => {
    if (googleMapsLoaded) {
      console.log('🚀 Google Maps loaded - starting route pre-population in background...');
      routePrePopulationService.prePopulateRoutes().catch(error => {
        console.log('⚠️ Pre-population failed (non-critical):', error);
      });
    } else {
      console.log('⏳ Waiting for Google Maps before pre-population...');
    }
  }, [googleMapsLoaded]); // Only run when googleMapsLoaded changes to true

  // Wait for element to appear in DOM with retry mechanism
  const waitForElement = async (elementId: string, maxRetries = 10, delay = 100): Promise<HTMLElement | null> => {
    for (let i = 0; i < maxRetries; i++) {
      const el = document.getElementById(elementId);
      if (el) {
        return el as HTMLElement;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return null;
  };

  // Safe getter for the map element with user-facing error and retry
  const getMapElementOrAbort = async (): Promise<HTMLElement | null> => {
    // Try immediate lookup first
    let el = document.getElementById('map');
    if (el) {
      return el as HTMLElement;
    }

    // If not found, wait for it to appear (React might still be rendering)
    console.log('⏳ Map element not found immediately, waiting for DOM to render...');
    el = await waitForElement('map', 20, 50); // Try 20 times with 50ms delay = 1 second max

    if (!el) {
      console.error('❌ Map element not found in DOM after waiting');
      setError('Map element not found. Please refresh the page.');
      setIsLoading(false);
      return null;
    }

    console.log('✅ Map element found after waiting');
    return el as HTMLElement;
  };

  const handleFindRoute = async () => {
    console.log('🚀 handleFindRoute called!', { startLocation, endLocation, isLoading, googleMapsLoaded });

    // Check rate limits
    if (currentUserId) {
      const routeLimit = rateLimitService.checkRateLimit(currentUserId, 'route');
      if (!routeLimit.allowed) {
        setError(`Rate limit exceeded: ${routeLimit.reason}. Try again after ${routeLimit.resetTime?.toLocaleTimeString() || 'later'}`);
        return;
      }

      const apiLimit = rateLimitService.checkRateLimit(currentUserId, 'apiCall');
      if (!apiLimit.allowed) {
        setError(`API rate limit exceeded: ${apiLimit.reason}. Try again after ${apiLimit.resetTime?.toLocaleTimeString() || 'later'}`);
        return;
      }
    }

    // Trigger geolocation immediately on user action (best chance to show prompt)
    if (!hasRequestedGeolocation) {
      setHasRequestedGeolocation(true);
      try {
        const userLoc = await getUserLocation();
        setUserLocation(userLoc);
      } catch (e) {
        // Ignore if denied; flow continues
      }
    }

    // If user hasn't geocoded yet, try to geocode current text queries before proceeding
    if (!startLocation && startQuery) {
      await geocodeLocation(startQuery, 'start');
    }
    if (!endLocation && endQuery) {
      await geocodeLocation(endQuery, 'end');
    }

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
        console.log('💰 Route index hit! No API call needed - SAVING MONEY!');

        // Track cache hit
        await analyticsService.trackApiUsage({
          apiType: 'google_directions',
          cacheHit: true,
          userId: currentUserId,
          startLocation: startLocation.name,
          endLocation: endLocation.name,
          responseTime: Date.now() - Date.now()
        });

        await analyticsService.trackCachePerformance({
          cacheType: 'route_index',
          hit: true,
          userId: currentUserId,
          responseTime: Date.now() - Date.now()
        });

        // Reconstruct Google Maps route objects from indexed data
        const reconstructedResponses = indexedRoutes.map(route =>
          routeIndexService.reconstructGoogleMapsRoute(route)
        );

        // Extract routes from the reconstructed responses
        const reconstructedRoutes = reconstructedResponses.map(response => response.routes[0]);

        setAvailableRoutes(reconstructedRoutes);
        setSelectedRoute(reconstructedRoutes[0]);

        // Ensure results view (with #map) is rendered before accessing the map element
        setShowRouteResults(true);
        await waitForNextFrame();

        // Create map and display first route
        const { Map } = await window.google.maps.importLibrary("maps");
        // No longer need DirectionsRenderer with direct polyline approach

        const mapElement = await getMapElementOrAbort();
        if (!mapElement) return;

        const map = new Map(mapElement, {
          center: {
            lat: (startLocation.lat + endLocation.lat) / 2,
            lng: (startLocation.lng + endLocation.lng) / 2
          },
          zoom: 12,
          mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'
        });

        // Store map instance for route switching
        setCurrentMapInstance(map);
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
          // Handle polyline - check for corrupted format (string converted to object with numeric keys)
          let encodedPath = null;

          if (route?.overview_polyline?.encoded_path) {
            // Normal format: { encoded_path: "..." }
            encodedPath = route.overview_polyline.encoded_path;
          } else if (route?.overview_polyline) {
            // Check if it's corrupted (string converted to object with numeric keys)
            const keys = Object.keys(route.overview_polyline);
            if (keys.length > 0 && keys.every(key => /^\d+$/.test(key))) {
              const firstValue = route.overview_polyline[keys[0]];
              // If values are single characters, it's a corrupted encoded string
              if (typeof firstValue === 'string' && firstValue.length === 1) {
                // Reconstruct the encoded string from numeric keys
                encodedPath = Object.values(route.overview_polyline).join('');
                console.log('✅ Reconstructed encoded polyline from corrupted numeric keys (cached route)');
              }
            }
          }

          if (encodedPath && typeof encodedPath === 'string') {
            try {
              const decodedPath = encoding.decodePath(encodedPath);

              const polyline = new Polyline({
                path: decodedPath,
                strokeColor: '#4285F4',
                strokeOpacity: index === 0 ? 0.8 : 0, // Show first route, hide others
                strokeWeight: 4,
                geodesic: true,
                map: map
              });

              polylines.push(polyline);
            } catch (error) {
              console.error(`❌ Error decoding polyline for cached route ${index + 1}:`, error);
            }
          }
        });

        // Store all polylines
        setRoutePolylines(polylines);

        console.log(`✅ Created ${polylines.length} polylines for all routes`);

        // Fit map to show the first route using global Google Maps API
        if (polylines.length > 0 && firstRoute?.overview_polyline) {
          try {
            let encodedPath = null;
            if (firstRoute.overview_polyline.encoded_path) {
              encodedPath = firstRoute.overview_polyline.encoded_path;
            } else {
              // Handle corrupted format
              const keys = Object.keys(firstRoute.overview_polyline);
              if (keys.length > 0 && keys.every(key => /^\d+$/.test(key))) {
                const firstValue = firstRoute.overview_polyline[keys[0]];
                if (typeof firstValue === 'string' && firstValue.length === 1) {
                  encodedPath = Object.values(firstRoute.overview_polyline).join('');
                }
              }
            }

            if (encodedPath && typeof encodedPath === 'string') {
              const decodedPath = encoding.decodePath(encodedPath);
              const bounds = new (window.google.maps as any).LatLngBounds();
              decodedPath.forEach((point: any) => bounds.extend(point));
              map.fitBounds(bounds);
              console.log('✅ Map bounds fitted to first route');
            }
          } catch (error) {
            console.error('❌ Error fitting bounds for cached route:', error);
          }
        }

        // Find restaurants for indexed routes
        console.log('🔍 Starting restaurant discovery for indexed routes...');
        findRestaurantsForAllRoutes(reconstructedRoutes, map);
        // One-time location permission prompt after route is ready
        if (!hasRequestedGeolocation) {
          try {
            const userLoc = await getUserLocation();
            setUserLocation(userLoc);
          } catch (e) {
            // Ignore if denied; user can still navigate
          } finally {
            setHasRequestedGeolocation(true);
          }
        }

        // Update rate limit stats
        // updateRateLimitStats(); // Unused for now

        setIsLoading(false);
        return;
      }

      // 2. Fetch from Google Directions API (cache miss)
      console.log('🔄 Cache miss - fetching from Google Directions API');
      console.log('⚠️ WARNING: This will cost money! Consider caching routes to reduce API costs.');
      console.log('💰 API Call:', {
        type: 'Google Directions API',
        cost: '~RM0.005 per request',
        cacheHit: false,
        reason: 'New route not in cache',
        startLocation: startLocation.name,
        endLocation: endLocation.name
      });

      const { Map } = await window.google.maps.importLibrary("maps");
      const { DirectionsService } = await window.google.maps.importLibrary("routes");

      // Ensure results view (with #map) is rendered before accessing the map element
      setShowRouteResults(true);
      // Wait for React to render the component and DOM to update
      await waitForNextFrame();
      await new Promise(resolve => setTimeout(resolve, 150)); // Additional delay for DOM rendering

      // Create map - wait for element to appear in DOM
      const mapElement = await getMapElementOrAbort();
      if (!mapElement) {
        console.error('❌ Cannot proceed without map element');
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

      // Store map instance for route switching
      setCurrentMapInstance(map);

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

          // Track API usage
          await analyticsService.trackApiUsage({
            apiType: 'google_directions',
            cacheHit: false,
            userId: currentUserId,
            startLocation: startLocation.name,
            endLocation: endLocation.name,
            responseTime: Date.now() - Date.now(),
            routesFound: result.routes.length
          });

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
          routeIndexService.indexRoute(result.routes, startLocation, endLocation).then(async () => {
            console.log('✅ Route cached successfully - future searches will be FREE!');

            // Track successful indexing
            await analyticsService.trackCachePerformance({
              cacheType: 'route_index',
              hit: false,
              indexed: true,
              userId: currentUserId,
              responseTime: Date.now() - Date.now()
            });
          }).catch(error => {
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

          // Render polylines for all routes (using Google Maps geometry library)
          const { encoding } = await window.google.maps.importLibrary("geometry");

          // Helper function to validate LatLng coordinates
          const isValidLatLng = (point: any): boolean => {
            if (!point || typeof point !== 'object') return false;
            const lat = typeof point.lat === 'function' ? point.lat() : point.lat;
            const lng = typeof point.lng === 'function' ? point.lng() : point.lng;
            return typeof lat === 'number' && typeof lng === 'number' &&
              !isNaN(lat) && !isNaN(lng) &&
              isFinite(lat) && isFinite(lng) &&
              lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
          };

          // Helper function to normalize LatLng to {lat, lng}
          const normalizeLatLng = (point: any): { lat: number, lng: number } | null => {
            if (!isValidLatLng(point)) return null;
            const lat = typeof point.lat === 'function' ? point.lat() : point.lat;
            const lng = typeof point.lng === 'function' ? point.lng() : point.lng;
            return { lat, lng };
          };

          const polylines: any[] = [];
          result.routes.forEach((route: any, index: number) => {
            console.log(`🔍 Route ${index + 1} structure:`, {
              hasOverviewPolyline: !!route.overview_polyline,
              hasEncodedPath: !!(route.overview_polyline?.encoded_path),
              hasOverviewPath: !!(route.overview_polyline?.overview_path),
              overviewPolylineKeys: route.overview_polyline ? Object.keys(route.overview_polyline) : []
            });

            // Try different possible polyline data structures
            let encodedPath = null;
            if (route.overview_polyline?.encoded_path) {
              encodedPath = route.overview_polyline.encoded_path;
            } else if (route.overview_polyline?.overview_path) {
              // If it's already decoded, use it directly
              encodedPath = route.overview_polyline.overview_path;
            } else if (route.overview_polyline) {
              // Check for other possible keys
              const keys = Object.keys(route.overview_polyline);
              console.log(`🔍 Available keys in overview_polyline:`, keys);

              // Handle array-like structure with numeric string keys
              if (keys.length > 0 && keys.every(key => /^\d+$/.test(key))) {
                const firstValue = route.overview_polyline[keys[0]];

                // Check if values are single characters (corrupted encoded string)
                if (typeof firstValue === 'string' && firstValue.length === 1) {
                  // Reconstruct the encoded string from numeric keys
                  encodedPath = Object.values(route.overview_polyline).join('');
                  console.log('✅ Reconstructed encoded polyline from corrupted numeric keys (fresh route)');
                } else {
                  // Original logic: numeric keys with LatLng objects
                  const maxIndex = Math.max(...keys.map(k => parseInt(k)));
                  const pathArray = [];
                  for (let i = 0; i <= maxIndex; i++) {
                    const point = route.overview_polyline[i.toString()];
                    if (point) {
                      // Validate the point before adding
                      const normalized = normalizeLatLng(point);
                      if (normalized) {
                        pathArray.push(normalized);
                      } else {
                        console.warn(`⚠️ Invalid coordinate at index ${i}:`, point);
                      }
                    }
                  }
                  if (pathArray.length > 0) {
                    encodedPath = pathArray;
                    console.log(`🔍 Converted numeric keys to array with ${pathArray.length} valid points`);
                  } else {
                    console.warn('⚠️ No valid coordinates found in numeric keys structure');
                  }
                }
              } else if (keys.length > 0) {
                encodedPath = route.overview_polyline[keys[0]];
              }
            }

            if (encodedPath) {
              try {
                let path;
                if (typeof encodedPath === 'string') {
                  // It's an encoded string, decode it
                  path = encoding.decodePath(encodedPath);
                  // Validate all decoded points
                  path = path.filter((point: any) => isValidLatLng(point)).map((point: any) => normalizeLatLng(point)).filter((p: any) => p !== null);
                } else if (Array.isArray(encodedPath)) {
                  // It's already decoded - validate all points
                  path = encodedPath.map((point: any) => normalizeLatLng(point)).filter((p: any) => p !== null);
                } else {
                  console.warn(`⚠️ Unknown polyline format for route ${index + 1}:`, typeof encodedPath);
                  return;
                }

                // Only create polyline if we have valid points
                if (path.length > 0) {
                  const polyline = new (window.google.maps as any).Polyline({
                    path: path,
                    geodesic: true,
                    strokeColor: index === 0 ? '#FF6B6B' : '#4ECDC4',
                    strokeOpacity: 0.8,
                    strokeWeight: index === 0 ? 4 : 3,
                    map: map
                  });

                  polylines.push(polyline);
                  console.log(`✅ Created polyline for route ${index + 1} with ${path.length} valid points`);
                } else {
                  console.warn(`⚠️ No valid coordinates found for route ${index + 1} polyline`);
                }
              } catch (error) {
                console.error(`❌ Error creating polyline for route ${index + 1}:`, error);
              }
            } else {
              console.warn(`⚠️ No polyline data found for route ${index + 1}`);
            }
          });

          // Store all polylines
          setRoutePolylines(polylines);

          console.log(`✅ Created ${polylines.length} polylines for all routes`);

          // Fit map to show the first route
          if (polylines.length > 0 && firstRoute?.overview_polyline) {
            try {
              let decodedPath;
              if (firstRoute.overview_polyline.encoded_path) {
                decodedPath = encoding.decodePath(firstRoute.overview_polyline.encoded_path);
              } else if (firstRoute.overview_polyline.overview_path) {
                decodedPath = firstRoute.overview_polyline.overview_path;
              } else {
                // Try to get the first available key
                const keys = Object.keys(firstRoute.overview_polyline);
                if (keys.length > 0) {
                  // Handle array-like structure with numeric string keys
                  if (keys.every(key => /^\d+$/.test(key))) {
                    // Convert numeric string keys to array, but validate each point
                    const maxIndex = Math.max(...keys.map(k => parseInt(k)));
                    const pathArray = [];
                    for (let i = 0; i <= maxIndex; i++) {
                      const point = firstRoute.overview_polyline[i.toString()];
                      if (point) {
                        const normalized = normalizeLatLng(point);
                        if (normalized) {
                          pathArray.push(normalized);
                        }
                      }
                    }
                    if (pathArray.length > 0) {
                      decodedPath = pathArray;
                    }
                  } else {
                    const pathData = firstRoute.overview_polyline[keys[0]];
                    if (typeof pathData === 'string') {
                      decodedPath = encoding.decodePath(pathData);
                      // Validate decoded path
                      if (Array.isArray(decodedPath)) {
                        decodedPath = decodedPath.map((point: any) => normalizeLatLng(point)).filter((p: any) => p !== null);
                      }
                    } else if (Array.isArray(pathData)) {
                      // Validate array path
                      decodedPath = pathData.map((point: any) => normalizeLatLng(point)).filter((p: any) => p !== null);
                    }
                  }
                }
              }

              if (decodedPath && Array.isArray(decodedPath)) {
                // Validate all points before extending bounds
                const validPoints = decodedPath.map((point: any) => normalizeLatLng(point)).filter((p: any) => p !== null);

                if (validPoints.length > 0) {
                  const bounds = new (window.google.maps as any).LatLngBounds();
                  validPoints.forEach((point: any) => {
                    if (point && isValidLatLng(point)) {
                      bounds.extend(point);
                    }
                  });
                  map.fitBounds(bounds);
                  console.log('✅ Map bounds fitted to first route');
                  console.log('📍 Route bounds:', {
                    north: bounds.getNorthEast().lat(),
                    south: bounds.getSouthWest().lat(),
                    east: bounds.getNorthEast().lng(),
                    west: bounds.getSouthWest().lng()
                  });
                } else {
                  console.warn('⚠️ No valid coordinates for map bounds fitting');
                  // Fallback: center on start and end locations
                  if (startLocation && endLocation) {
                    const bounds = new (window.google.maps as any).LatLngBounds();
                    bounds.extend(new (window.google.maps as any).LatLng(startLocation.lat, startLocation.lng));
                    bounds.extend(new (window.google.maps as any).LatLng(endLocation.lat, endLocation.lng));
                    map.fitBounds(bounds);
                    console.log('✅ Map bounds fitted to start/end locations as fallback');
                  }
                }
              } else {
                console.warn('⚠️ Could not decode path for map bounds fitting');
                // Fallback: center on start and end locations
                if (startLocation && endLocation) {
                  const bounds = new (window.google.maps as any).LatLngBounds();
                  bounds.extend(new (window.google.maps as any).LatLng(startLocation.lat, startLocation.lng));
                  bounds.extend(new (window.google.maps as any).LatLng(endLocation.lat, endLocation.lng));
                  map.fitBounds(bounds);
                  console.log('✅ Map bounds fitted to start/end locations as fallback');
                }
              }
            } catch (error) {
              console.error('❌ Error fitting map bounds:', error);
            }
          }

          // Find restaurants for ALL routes at once (more efficient)
          findRestaurantsForAllRoutes(result.routes, map);
          // One-time location permission prompt after route is ready
          if (!hasRequestedGeolocation) {
            try {
              const userLoc = await getUserLocation();
              setUserLocation(userLoc);
            } catch (e) {
              // Ignore if denied; user can still navigate
            } finally {
              setHasRequestedGeolocation(true);
            }
          }
        } else {
          console.error('❌ Google Directions API failed:', status);
          setError(`Route calculation failed: ${status}`);

          // Track API error
          await analyticsService.trackSystemPerformance({
            endpoint: 'google_directions_api',
            success: false,
            errorType: status,
            userId: currentUserId,
            responseTime: Date.now() - Date.now()
          });
        }
        setIsLoading(false);
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');

      // Track system error
      await analyticsService.trackSystemPerformance({
        endpoint: 'route_finding',
        success: false,
        errorType: err instanceof Error ? err.name : 'Unknown',
        userId: currentUserId,
        responseTime: Date.now() - Date.now()
      });

      setIsLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
  };

  const renderDiscover = () => {
    if (!showRouteResults) {
      return (
        <div className="App">
          <header className="App-header">
            <h1>Kawan Makan</h1>


            <RouteInputForm
              startLocation={startLocation}
              endLocation={endLocation}
              startValue={startQuery !== null ? startQuery : (startLocation?.name || '')}
              endValue={endQuery !== null ? endQuery : (endLocation?.name || '')}
              isLoading={isLoading}
              onStartLocationChange={handleStartLocationChange}
              onEndLocationChange={handleEndLocationChange}
              onFindRoute={handleFindRoute}
              // Autocomplete props
              // @ts-ignore - TypeScript inference issue with RouteInputForm props
              startSuggestions={startSuggestions}
              // @ts-ignore - TypeScript inference issue with RouteInputForm props
              endSuggestions={endSuggestions}
              showStartSuggestions={showStartSuggestions}
              showEndSuggestions={showEndSuggestions}
              onStartSuggestionClick={(suggestion: string) => handleSuggestionClick(suggestion, 'start')}
              onEndSuggestionClick={(suggestion: string) => handleSuggestionClick(suggestion, 'end')}
            />
          </header>
        </div>
      );
    }

    return (
      <div className="app-split-layout">
        {/* Top Map Section (Fixed/Sticky) */}
        <div className="top-map-section">
          <div id="map"></div>

          <button
            className="back-button"
            onClick={() => {
              setShowRouteResults(false);
              setAvailableRoutes([]);
              setRoutePolylines([]);
            }}
          >
            ←
          </button>

          {/* Route Selection Circles - FOB style on middle left */}
          {availableRoutes && availableRoutes.length > 1 && (
            <div className="route-selection-circles">
              <div className="route-label">Route</div>
              {availableRoutes.map((route, index) => {
                const isSelected = route === selectedRoute;
                return (
                  <button
                    key={index}
                    className={`route-circle ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleRouteSelect(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Sheet Section (Scrollable) */}
        <div className="bottom-sheet-section">
          <RouteResultsAny
            startLocation={startLocation}
            endLocation={endLocation}
            availableRoutes={availableRoutes}
            selectedRouteIndex={availableRoutes.findIndex(r => r === selectedRoute)}
            onRouteSelect={handleRouteSelect}
            filteredRestaurants={filteredRestaurants}
            filteredRNRStops={filteredRNRStops}
            filteredPetrolStations={filteredPetrolStations}
            selectedEateries={selectedEateries}
            onEaterySelect={handleEaterySelect}
            onViewDetails={(restaurant: any) => { setSelectedRestaurant(restaurant); setShowRestaurantModal(true); }}
            onBack={() => setShowRouteResults(false)}
            onStartNavigation={handleNavigateToEateries}
            onSaveRoute={() => setShowSaveRouteForm(true)}
            onLoadSavedRoutes={() => setShowSavedRoutes(true)}
            savedRoutes={savedRoutes}
            onLoadRoute={handleLoadRoute}
            onDeleteRoute={handleDeleteRoute}
            showSaveRouteForm={showSaveRouteForm}
            showSavedRoutes={showSavedRoutes}
            routeName={routeName}
            onRouteNameChange={setRouteName}
            onShowSaveForm={() => setShowSaveRouteForm(true)}
            onShowSavedRoutes={() => setShowSavedRoutes(true)}
            onCloseModals={() => { setShowSaveRouteForm(false); setShowSavedRoutes(false); }}
            onSaveRouteSubmit={handleSaveRoute}
            currentUserId={currentUserId}
            onClearUserData={handleClearUserData}
            onInspectData={async () => { try { await inspectFirestoreData(); } catch { } }}
            onGetUserStats={async () => { try { await userActivityService.getUserActivitySummary(currentUserId, '30d'); } catch { } }}
            onTestMultiRoute={() => {
              setStartLocation({ name: 'Kuala Lumpur, Malaysia', lat: 3.1390, lng: 101.6869 });
              setEndLocation({ name: 'Penang, Malaysia', lat: 5.4164, lng: 100.3327 });
            }}
            onClearRouteCache={handleClearRouteCache}
            googleMapsLoaded={googleMapsLoaded}
          />
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'discover':
        return renderDiscover();
      case 'search':
        return <SearchTabNew />;
      case 'add':
        return <AddRestaurantTab />;
      case 'favorites':
        return (
          <FavoritesTab
            savedRoutes={savedRoutes}
            onLoadRoute={handleLoadRoute}
            onDeleteRoute={handleDeleteRoute}
          />
        );
      case 'user':
        return <UserTab />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return renderDiscover();
    }
  };

  // NEW: Fetch ALL places (restaurants, R&R, petrol) for ALL routes at once (more efficient)
  const findPlacesForAllRoutes = async (routes: any[], map: any) => {
    console.log('🔍 Fetching ALL places (restaurants, R&R, petrol) for ALL routes at once...');

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

      // Fetch ALL place types in parallel
      const [allRestaurantsData, allRNRStopsData, allPetrolStationsData] = await Promise.all([
        firestoreSearchService.searchRestaurants(combinedBounds, {
          foodType: 'all',
          minRating: 0,
          halalOnly: false,
          openNow: false
        }),
        placeSearchService.searchRNRStops(combinedBounds, {}),
        placeSearchService.searchPetrolStations(combinedBounds, {})
      ]);

      console.log(`🍽️ Found ${allRestaurantsData.length} restaurants in combined area`);
      console.log(`🛣️ Found ${allRNRStopsData.length} R&R stops in combined area`);
      console.log(`⛽ Found ${allPetrolStationsData.length} petrol stations in combined area`);

      // CRITICAL FIX: Calculate detours for ALL places against ALL routes in parallel
      console.log('💰 Using Haversine formula first (FREE), Distance Matrix as fallback if needed');

      const [restaurantsWithAllDetours, rnrStopsWithAllDetours, petrolStationsWithAllDetours] = await Promise.all([
        // Calculate detours for restaurants (5km/30min threshold)
        Promise.all(
          routes.map(async (route, routeIndex) => {
            console.log(`🔍 Calculating detours for ${allRestaurantsData.length} restaurants along route ${routeIndex + 1}`);
            try {
              const restaurantsWithDetours = await distanceMatrixService.calculateRouteDetours(route, allRestaurantsData, 'restaurant');
              console.log(`✅ Detour calculation completed for ${restaurantsWithDetours.length} restaurants`);
              return { routeIndex, places: restaurantsWithDetours };
            } catch (error) {
              console.error(`❌ Detour calculation failed for restaurants route ${routeIndex + 1}:`, error);
              return {
                routeIndex,
                places: allRestaurantsData.map((place: any) => ({
                  ...place,
                  detourDistanceKm: Infinity,
                  detourDurationMinutes: Infinity
                }))
              };
            }
          })
        ),
        // Calculate detours for R&R stops (5km/30min threshold)
        Promise.all(
          routes.map(async (route, routeIndex) => {
            console.log(`🔍 Calculating detours for ${allRNRStopsData.length} R&R stops along route ${routeIndex + 1}`);
            try {
              const rnrStopsWithDetours = await distanceMatrixService.calculateRouteDetours(route, allRNRStopsData, 'rnr');
              console.log(`✅ Detour calculation completed for ${rnrStopsWithDetours.length} R&R stops`);
              return { routeIndex, places: rnrStopsWithDetours };
            } catch (error) {
              console.error(`❌ Detour calculation failed for R&R stops route ${routeIndex + 1}:`, error);
              return {
                routeIndex,
                places: allRNRStopsData.map((place: any) => ({
                  ...place,
                  detourDistanceKm: Infinity,
                  detourDurationMinutes: Infinity
                }))
              };
            }
          })
        ),
        // Calculate detours for petrol stations (5km/15min threshold)
        Promise.all(
          routes.map(async (route, routeIndex) => {
            console.log(`🔍 Calculating detours for ${allPetrolStationsData.length} petrol stations along route ${routeIndex + 1}`);
            try {
              const petrolStationsWithDetours = await distanceMatrixService.calculateRouteDetours(route, allPetrolStationsData, 'petrol_station');
              console.log(`✅ Detour calculation completed for ${petrolStationsWithDetours.length} petrol stations`);
              return { routeIndex, places: petrolStationsWithDetours };
            } catch (error) {
              console.error(`❌ Detour calculation failed for petrol stations route ${routeIndex + 1}:`, error);
              return {
                routeIndex,
                places: allPetrolStationsData.map((place: any) => ({
                  ...place,
                  detourDistanceKm: Infinity,
                  detourDurationMinutes: Infinity
                }))
              };
            }
          })
        )
      ]);

      // Helper function to combine places with detours by route
      const combinePlacesWithDetours = (places: any[], detoursByRoute: any[], placeType: string) => {
        return places.map((place: any, placeIndex: number) => {
          const detours = detoursByRoute.map((routeResult: any) => {
            const placeWithDetour = routeResult.places[placeIndex];
            return {
              routeIndex: routeResult.routeIndex,
              detour: placeWithDetour ? {
                detourDistanceKm: placeWithDetour.detourDistanceKm || Infinity,
                detourDurationMinutes: placeWithDetour.detourDurationMinutes || Infinity
              } : { detourDistanceKm: Infinity, detourDurationMinutes: Infinity }
            };
          });

          return {
            ...place,
            placeType, // Add type identifier
            detoursByRoute: detours,
            detourDistanceKm: detours[0]?.detour?.detourDistanceKm || Infinity,
            detourDurationMinutes: detours[0]?.detour?.detourDurationMinutes || Infinity
          };
        });
      };

      // Combine all place types with their detours
      const combinedRestaurants = combinePlacesWithDetours(allRestaurantsData, restaurantsWithAllDetours, 'restaurant');
      const combinedRNRStops = combinePlacesWithDetours(allRNRStopsData, rnrStopsWithAllDetours, 'rnr');
      const combinedPetrolStations = combinePlacesWithDetours(allPetrolStationsData, petrolStationsWithAllDetours, 'petrol_station');

      // Filter places that are within QUICK DETOUR range
      // Restaurants & R&R: 5km/30min, Petrol: 5km/15min
      const filterPlacesByThreshold = (places: any[], threshold: { distance: number, duration: number }) => {
        return places.filter((place: any) => {
          // Safety check: filter out places with clearly invalid distances (>100km)
          const hasValidDistance = place.detoursByRoute.some((d: any) =>
            d.detour.detourDistanceKm <= 100 &&
            d.detour.detourDistanceKm !== Infinity &&
            !isNaN(d.detour.detourDistanceKm)
          );

          if (!hasValidDistance) return false;

          // Main filter: within threshold
          return place.detoursByRoute.some((d: any) =>
            (d.detour.detourDistanceKm <= threshold.distance && d.detour.detourDistanceKm <= 100) ||
            (d.detour.detourDurationMinutes <= threshold.duration && d.detour.detourDurationMinutes <= 180)
          );
        });
      };

      const validRestaurants = filterPlacesByThreshold(combinedRestaurants, { distance: 5, duration: 30 });
      const validRNRStops = filterPlacesByThreshold(combinedRNRStops, { distance: 5, duration: 30 });
      const validPetrolStations = filterPlacesByThreshold(combinedPetrolStations, { distance: 5, duration: 15 });

      console.log(`📍 ${validRestaurants.length} restaurants within range`);
      console.log(`📍 ${validRNRStops.length} R&R stops within range`);
      console.log(`📍 ${validPetrolStations.length} petrol stations within range`);

      // Store all places (from ALL routes)
      setAllRestaurants(validRestaurants);
      setAllRNRStops(validRNRStops);
      setAllPetrolStations(validPetrolStations);

      // INITIAL DISPLAY: Show ALL places from ALL routes (prioritize restaurants)
      console.log('📊 Initial display: Showing ALL places from ALL routes (restaurants prioritized)');
      setFilteredRestaurants(validRestaurants);
      setFilteredRNRStops(validRNRStops);
      setFilteredPetrolStations(validPetrolStations);

      // Add ALL markers to map initially (from all routes)
      if (map) {
        const allPlacesToShow = [...validRestaurants, ...validRNRStops, ...validPetrolStations];
        if (allPlacesToShow.length > 0) {
          console.log(`🗺️ Adding ${allPlacesToShow.length} place markers from ALL routes (${validRestaurants.length} restaurants, ${validRNRStops.length} R&R, ${validPetrolStations.length} petrol)`);
          addPlaceMarkers(allPlacesToShow, map);
        }
      }

      // Cache places in route_index for future use (if start/end locations are available)
      if (startLocation && endLocation) {
        try {
          await (routeIndexService.indexRoute as any)(routes,
            { name: startLocation.name, lat: startLocation.lat, lng: startLocation.lng },
            { name: endLocation.name, lat: endLocation.lat, lng: endLocation.lng },
            {
              restaurants: validRestaurants,
              rnr_stops: validRNRStops,
              petrol_stations: validPetrolStations
            }
          );
          console.log('✅ Cached all places in route_index');
        } catch (cacheError) {
          console.warn('⚠️ Failed to cache places:', cacheError);
        }
      }

    } catch (error) {
      console.error('❌ Place search failed:', error);
      setAllRestaurants([]);
      setAllRNRStops([]);
      setAllPetrolStations([]);
      setFilteredRestaurants([]);
      setFilteredRNRStops([]);
      setFilteredPetrolStations([]);
    }
  };

  // Legacy function name for backward compatibility
  const findRestaurantsForAllRoutes = findPlacesForAllRoutes;

  // Clear all place markers from map (restaurants, R&R, petrol)
  const clearPlaceMarkers = () => {
    console.log(`🗑️ Clearing ${restaurantMarkers.length} existing markers from map`);
    restaurantMarkers.forEach(marker => {
      if (marker.map) {
        marker.map = null; // Remove marker from map
      }
    });
    setRestaurantMarkers([]); // Clear marker array
  };

  // Legacy function name for backward compatibility
  const clearRestaurantMarkers = clearPlaceMarkers;

  // Filter places for a specific route (applies to all routes including alternatives)
  // Concept: Quick detour from route only - not map exploration
  // When user selects a route: Show only places within threshold of THAT route (hide others)
  const filterPlacesForRoute = (route: any, routeIndex: number, mapInstance?: any) => {
    console.log(`🔄 Filtering places for Route ${routeIndex + 1} (quick detour only)...`);

    // Filter each place type with appropriate thresholds
    const filterPlaces = (places: any[], threshold: { distance: number, duration: number }) => {
      return places.filter(place => {
        const routeDetour = place.detoursByRoute[routeIndex];
        if (!routeDetour) return false;
        return routeDetour.detour.detourDistanceKm <= threshold.distance ||
          routeDetour.detour.detourDurationMinutes <= threshold.duration;
      }).map(place => ({
        ...place,
        detourDistanceKm: place.detoursByRoute[routeIndex].detour.detourDistanceKm,
        detourDurationMinutes: place.detoursByRoute[routeIndex].detour.detourDurationMinutes
      }));
    };

    const filteredRestaurants = filterPlaces(allRestaurants, { distance: 5, duration: 30 });
    const filteredRNR = filterPlaces(allRNRStops, { distance: 5, duration: 30 });
    const filteredPetrol = filterPlaces(allPetrolStations, { distance: 5, duration: 15 });

    console.log(`📍 ${filteredRestaurants.length} restaurants, ${filteredRNR.length} R&R, ${filteredPetrol.length} petrol visible for Route ${routeIndex + 1}`);

    setFilteredRestaurants(filteredRestaurants);
    setFilteredRNRStops(filteredRNR);
    setFilteredPetrolStations(filteredPetrol);

    // CRITICAL: Clear existing markers, then add only markers for selected route
    if (mapInstance) {
      clearPlaceMarkers();

      const allFilteredPlaces = [...filteredRestaurants, ...filteredRNR, ...filteredPetrol];
      if (allFilteredPlaces.length > 0) {
        console.log(`🗺️ Adding ${allFilteredPlaces.length} place markers for Route ${routeIndex + 1}`);
        addPlaceMarkers(allFilteredPlaces, mapInstance);
      } else {
        console.log(`🗺️ No places within range for Route ${routeIndex + 1}`);
      }
    }
  };

  // Legacy function for backward compatibility
  const filterRestaurantsForRoute = (restaurants: any[], route: any, routeIndex: number, mapInstance?: any) => {
    // Just call the new unified function
    filterPlacesForRoute(route, routeIndex, mapInstance);
  };


  // Add place markers to map (supports restaurants, R&R, petrol with emoji icons)
  const addPlaceMarkers = async (places: any[], map: any) => {
    console.log(`🗺️ addPlaceMarkers called with ${places.length} places`);
    console.log('🗺️ Map instance:', map);

    // Ensure marker library is loaded
    if (!(window.google.maps as any).marker?.AdvancedMarkerElement) {
      console.log('🗺️ Loading marker library...');
      await window.google.maps.importLibrary('marker');
      console.log('🗺️ Marker library loaded');
    }

    // Keep track of the currently open InfoWindow
    let currentInfoWindow: any = null;

    // Add map click listener to close any open InfoWindow (only add once)
    if (!map.hasPlaceClickListener) {
      map.addListener('click', () => {
        if (currentInfoWindow) {
          currentInfoWindow.close();
          currentInfoWindow = null;
        }
      });
      map.hasPlaceClickListener = true;
    }

    const newMarkers: any[] = [];

    places.forEach((place: any, index: number) => {
      const placeType = place.placeType || place.type || 'restaurant';
      const placeName = place.name || place.displayName || place.eateryName || 'Unknown';
      const emoji = placeType === 'restaurant' ? '🍽️' : placeType === 'rnr' ? '🛣️' : '⛽';

      console.log(`🗺️ Creating marker ${index + 1} for: ${emoji} ${placeName}`);
      console.log(`🗺️ Place location:`, place.location);

      const AdvancedMarkerElement = (window.google.maps as any).marker.AdvancedMarkerElement;

      // Create emoji pin element with colored background for visibility
      const pinElement = document.createElement('div');
      pinElement.style.fontSize = '24px';
      pinElement.style.textAlign = 'center';
      pinElement.style.width = '32px';
      pinElement.style.height = '32px';
      pinElement.style.display = 'flex';
      pinElement.style.alignItems = 'center';
      pinElement.style.justifyContent = 'center';
      pinElement.style.borderRadius = '50%';

      // Add colored background based on type for better visibility
      if (placeType === 'restaurant') {
        pinElement.style.background = '#FF6B6B'; // Red background for restaurants
        pinElement.style.border = '2px solid #fff';
        pinElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      } else if (placeType === 'rnr') {
        pinElement.style.background = '#4ECDC4'; // Teal background for R&R
        pinElement.style.border = '2px solid #fff';
        pinElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      } else {
        pinElement.style.background = '#FFD93D'; // Yellow background for petrol
        pinElement.style.border = '2px solid #fff';
        pinElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      }

      pinElement.textContent = emoji;

      const marker = new AdvancedMarkerElement({
        position: place.location,
        map: map,
        title: placeName,
        content: pinElement
      });

      console.log(`🗺️ Marker created for ${placeName}`);

      const placeId = place.place_id || place.id;
      const brand = place.brand ? ` (${place.brand})` : '';
      const typeLabel = placeType === 'restaurant' ? 'Restaurant' : placeType === 'rnr' ? 'R&R Stop' : 'Petrol Station';

      // Extract coordinates for Google Maps navigation
      let lat, lng;
      if (place.location && typeof place.location.lat === 'function') {
        // Google Maps LatLng object
        lat = place.location.lat();
        lng = place.location.lng();
      } else if (place.location && typeof place.location.lat === 'number') {
        // Plain object with lat/lng properties
        lat = place.location.lat;
        lng = place.location.lng;
      } else if (place.lat && place.lng) {
        // Place object has lat/lng directly
        lat = place.lat;
        lng = place.lng;
      } else {
        lat = null;
        lng = null;
      }

      // Create Google Maps navigation URL
      const navUrl = lat && lng
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
        : '#';

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; color: #000000;">
            <h3 style="color: #000000; margin: 0 0 8px 0;">${emoji} ${placeName}${brand}</h3>
            <p style="color: #666; margin: 4px 0; font-size: 12px;">${typeLabel}</p>
            <p style="color: #000000; margin: 4px 0;">${place.address || place.formattedAddress || 'Address not available'}</p>
            ${place.rating ? `<p style="color: #000000; margin: 4px 0;">Rating: ${place.rating}${place.userRatingCount ? ` (${place.userRatingCount} reviews)` : ''}</p>` : ''}
            ${place.detourDistanceKm ? `<p style="color: #000000; margin: 4px 0;">Detour: ${place.detourDistanceKm.toFixed(1)} km (${(place.detourDurationMinutes || 0).toFixed(0)} min)</p>` : ''}
            <p style="color: #000000; margin: 4px 0; font-size: 12px;">Source: ${place.source || 'unknown'}</p>
            <a href="${navUrl}" target="_blank" 
               style="display: inline-block; background: #CC0001; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
              Navigate Here
            </a>
          </div>
        `
      });

      // Advanced markers use 'gmp-click'
      marker.addListener('gmp-click', () => {
        if (currentInfoWindow) {
          currentInfoWindow.close();
        }
        infoWindow.open({ map, anchor: marker });
        currentInfoWindow = infoWindow;
      });

      newMarkers.push(marker);
    });

    setRestaurantMarkers(newMarkers);
    console.log(`✅ Tracked ${newMarkers.length} place markers for removal`);
  };

  // Legacy function for backward compatibility
  const addRestaurantMarkers = async (restaurants: any[], map: any) => {
    // Add placeType to restaurants if not present
    const restaurantsWithType = restaurants.map((r: any) => ({
      ...r,
      placeType: r.placeType || 'restaurant'
    }));
    return addPlaceMarkers(restaurantsWithType, map);
  };

  const handleLocationSelect = async (type: 'start' | 'end', location: Location) => {
    if (type === 'start') {
      setStartLocation(location);

      // Do not prompt geolocation on every keystroke; only when route is found or explicitly needed
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

      // Allow free typing: only append ", Malaysia" if user didn't type a country hint
      const query = /malaysia/i.test(address) ? address : `${address}, Malaysia`;
      geocoder.geocode({ address: query }, async (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const locationData: Location = {
            name: results[0].formatted_address,
            lat: location.lat(),
            lng: location.lng()
          };

          // Index the location in Firestore for future autocomplete
          await locationIndexService.indexLocation(locationData.name, {
            lat: locationData.lat,
            lng: locationData.lng
          });

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

  // Generate location suggestions: Firestore first, then hardcoded fallback
  const getLocationSuggestions = async (query: string): Promise<string[]> => {
    if (!query || query.length < 2) return [];

    try {
      // First, try Firestore location index
      const firestoreSuggestions = await locationIndexService.getLocationSuggestions(query, 8);

      if (firestoreSuggestions.length >= 8) {
        // We have enough results from Firestore
        return firestoreSuggestions;
      }

      // Fallback to hardcoded list for common locations
      const malaysianLocations = [
        // Major cities
        'Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Subang Jaya', 'Klang',
        'Johor Bahru', 'Ipoh', 'Penang', 'Malacca', 'Kuantan', 'Kota Kinabalu',
        'Kuching', 'Alor Setar', 'Kangar', 'Kuala Terengganu', 'Kota Bharu',
        'Seremban', 'Melaka', 'Miri', 'Sibu', 'Sandakan', 'Tawau',

        // States (with major cities)
        'Selangor', 'Johor', 'Perak', 'Pulau Pinang', 'Melaka', 'Pahang',
        'Terengganu', 'Kelantan', 'Perlis', 'Kedah', 'Negeri Sembilan',
        'Sabah', 'Sarawak', 'Labuan',

        // Popular areas in KL
        'KLCC', 'Bukit Bintang', 'Chinatown', 'Little India', 'Bangsar',
        'Mont Kiara', 'Damansara', 'Ampang', 'Cheras', 'Kepong', 'Gombak',

        // Popular areas in other cities
        'Georgetown', 'Gurney Drive', 'Batu Ferringhi', 'Jonker Street',
        'Legoland', 'Desaru', 'Cameron Highlands', 'Genting Highlands',
        'Langkawi', 'Tioman', 'Redang', 'Perhentian',

        // Common abbreviations
        'KL', 'JB', 'PJ', 'KK', 'PG',

        // Additional locations (from user feedback)
        'Dungun', 'Pasir Puteh', 'Dungun District', 'Pasir Puteh District'
      ];

      const lowerQuery = query.toLowerCase();
      const hardcodedMatches = malaysianLocations
        .filter(location =>
          location.toLowerCase().includes(lowerQuery) ||
          location.toLowerCase().startsWith(lowerQuery)
        )
        .slice(0, 8 - firestoreSuggestions.length); // Fill remaining slots

      // Combine Firestore and hardcoded results, removing duplicates
      const combined = [...firestoreSuggestions];
      hardcodedMatches.forEach(loc => {
        if (!combined.includes(loc)) {
          combined.push(loc);
        }
      });

      return combined.slice(0, 8); // Limit to 8 total
    } catch (error) {
      console.warn('⚠️ Error getting location suggestions:', error);
      // Fallback to hardcoded list only
      const malaysianLocations = [
        'Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Subang Jaya', 'Klang',
        'Johor Bahru', 'Ipoh', 'Penang', 'Malacca', 'Kuantan', 'Kota Kinabalu',
        'Kuching', 'Alor Setar', 'Kangar', 'Kuala Terengganu', 'Kota Bharu',
        'Dungun', 'Pasir Puteh'
      ];
      const lowerQuery = query.toLowerCase();
      return malaysianLocations
        .filter(location =>
          location.toLowerCase().includes(lowerQuery) ||
          location.toLowerCase().startsWith(lowerQuery)
        )
        .slice(0, 8);
    }
  };

  // Handle start location input change with autocomplete
  const handleStartLocationChange = (value: string) => {
    setStartQuery(value);

    // If user clears the input, also clear the geocoded location
    if (!value || value.trim() === '') {
      setStartLocation(null);
      setLastGeocodedStart('');
      setShowStartSuggestions(false);
      setStartSuggestions([]);
      return;
    }

    // Generate suggestions (async)
    getLocationSuggestions(value).then(suggestions => {
      setStartSuggestions(suggestions);
      setShowStartSuggestions(suggestions.length > 0 && value.length >= 2);
    });

    // Clear existing debounce
    if (startDebounceRef.current) clearTimeout(startDebounceRef.current);

    // Debounced geocoding
    startDebounceRef.current = setTimeout(() => {
      if (value && value.length >= 3 && value !== lastGeocodedStart) {
        geocodeLocation(value, 'start');
        setLastGeocodedStart(value);
      }
    }, 700);
  };

  // Handle end location input change with autocomplete
  const handleEndLocationChange = (value: string) => {
    setEndQuery(value);

    // If user clears the input, also clear the geocoded location
    if (!value || value.trim() === '') {
      setEndLocation(null);
      setLastGeocodedEnd('');
      setShowEndSuggestions(false);
      setEndSuggestions([]);
      return;
    }

    // Generate suggestions (async)
    getLocationSuggestions(value).then(suggestions => {
      setEndSuggestions(suggestions);
      setShowEndSuggestions(suggestions.length > 0 && value.length >= 2);
    });

    // Clear existing debounce
    if (endDebounceRef.current) clearTimeout(endDebounceRef.current);

    // Debounced geocoding
    endDebounceRef.current = setTimeout(() => {
      if (value && value.length >= 3 && value !== lastGeocodedEnd) {
        geocodeLocation(value, 'end');
        setLastGeocodedEnd(value);
      }
    }, 700);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartQuery(suggestion);
      setShowStartSuggestions(false);
      // Auto-geocode the suggestion
      geocodeLocation(suggestion, 'start');
      setLastGeocodedStart(suggestion);
    } else {
      setEndQuery(suggestion);
      setShowEndSuggestions(false);
      // Auto-geocode the suggestion
      geocodeLocation(suggestion, 'end');
      setLastGeocodedEnd(suggestion);
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
      // Clear markers from non-selected routes, show only markers for selected route
      if (allRestaurants.length > 0 && currentMapInstance) {
        filterRestaurantsForRoute(allRestaurants, route, routeIndex, currentMapInstance);
        setSelectedEateries([]); // Clear selected restaurants when switching routes
      } else if (allRestaurants.length > 0) {
        console.warn('⚠️ Map instance not available for route switching');
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

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * Math.PI / 180) *
      Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

    // Switch to Discover tab to show the loaded route
    setActiveTab('discover');

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
    <FavoritesProvider>
      <div className="App">
        {renderTabContent()}


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

        {/* Restaurant Details Modal */}
        {showRestaurantModal && selectedRestaurant && (
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
              position: 'relative',
              width: '100%',
              maxWidth: '520px'
            }}>
              <button
                onClick={() => setShowRestaurantModal(false)}
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
              <RestaurantModal isOpen={true} restaurant={selectedRestaurant} onClose={() => setShowRestaurantModal(false)} />
            </div>
          </div>
        )}

        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} isAdmin={isAdmin} />
      </div>
    </FavoritesProvider>
  );
};

// Main App component that provides auth context
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
};

export default App;

// Global navigation function
(window as any).navigateToRestaurant = function (placeId: string) {
  console.log('🗺️ Navigate button clicked!');
  console.log('📍 Restaurant Place ID:', placeId);

  if (!placeId) {
    console.error('❌ No place ID provided for navigation');
    alert('Sorry, navigation information is not available for this restaurant.');
    return;
  }

  const url = `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  console.log('🌐 Opening Google Maps URL:', url);

  try {
    window.open(url, '_blank');
    console.log('✅ Navigation opened successfully');
  } catch (error) {
    console.error('❌ Failed to open navigation:', error);
    alert('Failed to open navigation. Please try again.');
  }
};