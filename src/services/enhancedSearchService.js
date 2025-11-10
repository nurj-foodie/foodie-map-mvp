import { firestoreSearchService } from './firestoreSearchService';
import { calculateHaversineDistance } from '../utils/distanceUtils';

class EnhancedSearchService {
  constructor() {
    this.searchHistory = this.loadSearchHistory();
    this.userLocation = null;
  }

  // Load search history from localStorage
  loadSearchHistory() {
    try {
      const history = localStorage.getItem('foodie_search_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  // Save search to history
  saveSearchToHistory(query, filters) {
    const searchEntry = {
      query,
      filters,
      timestamp: new Date().toISOString()
    };

    // Remove duplicates and keep only last 10 searches
    this.searchHistory = this.searchHistory.filter(
      entry => entry.query !== query
    );
    this.searchHistory.unshift(searchEntry);
    this.searchHistory = this.searchHistory.slice(0, 10);

    try {
      localStorage.setItem('foodie_search_history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  // Get user's current location
  async getUserLocation() {
    if (this.userLocation) {
      return this.userLocation;
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          resolve(this.userLocation);
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Create search bounds from location and radius
  createSearchBounds(center, radiusKm) {
    const lat = center.lat;
    const lng = center.lng;
    
    // Approximate conversion: 1 degree ≈ 111 km
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    return {
      north: lat + latDelta,
      south: lat - latDelta,
      east: lng + lngDelta,
      west: lng - lngDelta
    };
  }

  // Enhanced search with multiple strategies
  async searchRestaurants(searchQuery, filters, userLocation = null) {
    console.log('🔍 Enhanced search started:', { searchQuery, filters, userLocation });

    try {
      // Parse compound query to extract multiple keywords
      let parsedQuery = null;
      let locationFromQuery = null;
      let foodFromQuery = null;
      let cuisineFromQuery = null;
      let mealTypeFromQuery = null;
      
      if (searchQuery) {
        try {
          const { searchKeywordService } = await import('./searchKeywordService');
          parsedQuery = searchKeywordService.parseCompoundQuery(searchQuery);
          locationFromQuery = parsedQuery.location;
          foodFromQuery = parsedQuery.food;
          cuisineFromQuery = parsedQuery.cuisine;
          mealTypeFromQuery = parsedQuery.mealType;
          
          if (parsedQuery.location || parsedQuery.food || parsedQuery.cuisine || parsedQuery.mealType) {
            console.log('🔍 Parsed compound query:', {
              original: parsedQuery.original,
              location: parsedQuery.location,
              food: parsedQuery.food,
              cuisine: parsedQuery.cuisine,
              mealType: parsedQuery.mealType,
              remaining: parsedQuery.remaining
            });
          }
        } catch (error) {
          console.warn('⚠️ Error parsing compound query:', error);
        }
      }

      let searchBounds;
      let searchCenter;
      let isLocationQuery = false;

      // Determine search center
      // NEW STRATEGY: Try geocoding FIRST (like Discover tab), then parse for food/cuisine
      // Priority: Geocoded location > Parsed location > Predefined location > User location > Default
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase().trim();
        const isVeryShort = queryLower.length < 3;
        const isCuisineType = this.isCuisineType(queryLower);
        const isFoodPrefix = this.isFoodPrefix(queryLower);
        
        // STEP 1: Try geocoding FIRST (like Discover tab)
        // Skip geocoding for known cuisine types, food prefixes, and very short queries (optimization)
        if (!isVeryShort && !isCuisineType && !isFoodPrefix) {
          console.log(`🔍 Attempting to geocode query FIRST: "${searchQuery}"`);
          try {
            const geocoded = await this.geocodeLocation(searchQuery);
            if (geocoded && geocoded.address.toLowerCase() !== 'malaysia') {
              // Validate that geocoded location is in Malaysia (not Singapore or other countries)
              const addressLower = geocoded.address.toLowerCase();
              const isInMalaysia = addressLower.includes('malaysia') && 
                                   !addressLower.includes('singapore') &&
                                   !addressLower.includes('indonesia') &&
                                   !addressLower.includes('thailand');
              
              if (isInMalaysia) {
                // ✅ Success! It's a location query in Malaysia
                console.log('✅ Geocoding SUCCESS - treating as location query:', geocoded);
                searchCenter = geocoded;
                searchBounds = this.createSearchBounds(searchCenter, filters.distance || 25);
                isLocationQuery = true;
                
                // Learn coordinates for future use (non-blocking)
                try {
                  const { keywordLearningService } = await import('./keywordLearningService');
                  await keywordLearningService.learnLocationCoordinates(
                    queryLower,
                    geocoded.lat,
                    geocoded.lng
                  ).catch(err => {
                    console.log('⚠️ Could not learn location coordinates (non-critical):', err.message);
                  });
                } catch (importError) {
                  // Silently fail - learning is optional
                }
              } else {
                console.log(`⚠️ Geocoding returned location outside Malaysia: "${geocoded.address}" - ignoring, will try parsing`);
              }
            } else if (geocoded && geocoded.address.toLowerCase() === 'malaysia') {
              console.log('⚠️ Geocoding returned "Malaysia" (too broad) - ignoring, will try parsing');
            } else {
              console.log('⚠️ Geocoding returned null/undefined - not a location, will try parsing');
            }
          } catch (error) {
            // ✅ Not a location - continue with parsing for food/cuisine
            console.log('⚠️ Geocoding failed - not a location, will try parsing:', error.message);
          }
        } else {
          const skipReason = isVeryShort ? 'too short' : isCuisineType ? 'cuisine type' : 'food prefix';
          console.log(`⏭️ Skipping geocoding for "${searchQuery}" (${skipReason})`);
        }
        
        // STEP 2: Parse query for food/cuisine/meal type (if geocoding didn't succeed)
        // This happens regardless, but we use it differently based on geocoding result
        if (!isLocationQuery && parsedQuery) {
          // If we parsed a location from compound query, use it
          if (locationFromQuery) {
            console.log(`📍 Found location in parsed query: "${locationFromQuery}"`);
            // Try predefined location first (faster)
            const predefined = await this.getPredefinedLocation(locationFromQuery);
            if (predefined) {
              searchCenter = predefined;
              searchBounds = this.createSearchBounds(searchCenter, filters.distance || 25);
              isLocationQuery = true;
              console.log(`✅ Using predefined location from parsed query: "${locationFromQuery}" →`, predefined);
            } else {
              console.log(`⚠️ No predefined location found for: "${locationFromQuery}", will geocode`);
              // Try geocoding the extracted location
              try {
                const geocoded = await this.geocodeLocation(locationFromQuery);
                if (geocoded && geocoded.address.toLowerCase() !== 'malaysia') {
                  searchCenter = geocoded;
                  searchBounds = this.createSearchBounds(searchCenter, filters.distance || 25);
                  isLocationQuery = true;
                  console.log('✅ Using geocoded location from parsed query:', geocoded);
                  
                  // Learn coordinates
                  try {
                    const { keywordLearningService } = await import('./keywordLearningService');
                    await keywordLearningService.learnLocationCoordinates(
                      locationFromQuery.toLowerCase().trim(),
                      geocoded.lat,
                      geocoded.lng
                    ).catch(() => {});
                  } catch (importError) {
                    // Silently fail
                  }
                }
              } catch (error) {
                console.warn('⚠️ Could not geocode parsed location:', error);
              }
            }
          } else {
            // No location in parsed query, try predefined locations as fallback
            const isKnownLocation = this.isLocationQuery(searchQuery);
            if (isKnownLocation && !searchCenter) {
              console.log('🔍 Detected known location query:', searchQuery);
              searchCenter = await this.getPredefinedLocation(searchQuery);
              if (searchCenter) {
                searchBounds = this.createSearchBounds(searchCenter, filters.distance || 25);
                isLocationQuery = true;
                console.log('✅ Using predefined location');
              }
            }
          }
        }
        
        // If still no location, use default (will be handled below)
        if (!searchBounds) {
          console.log('⚠️ Could not determine location, using default Malaysia center');
        }
      }
      
      // Update filters if cuisine or meal type found in query
      if (cuisineFromQuery && filters.cuisineType === 'all') {
        // Capitalize first letter
        const capitalizedCuisine = cuisineFromQuery.charAt(0).toUpperCase() + cuisineFromQuery.slice(1);
        filters = { ...filters, cuisineType: capitalizedCuisine };
        console.log(`🍽️ Auto-detected cuisine from query: ${capitalizedCuisine}`);
      }
      
      // Use determined location or fallback to user location or default
      if (searchBounds && searchCenter) {
        // Already set above
      } else if (userLocation) {
        searchCenter = userLocation;
        searchBounds = this.createSearchBounds(userLocation, filters.distance || 10);
      } else {
        // Default to Malaysia center if no location specified
        searchCenter = { lat: 4.2105, lng: 101.9758 }; // Malaysia center
        searchBounds = this.createSearchBounds(searchCenter, filters.distance || 50);
      }

      if (!searchBounds) {
        throw new Error('Could not determine search location');
      }

      // Perform search using existing firestoreSearchService
      const results = await firestoreSearchService.searchRestaurants(searchBounds, {
        foodType: filters.cuisineType !== 'all' ? filters.cuisineType : 'all',
        minRating: filters.minRating || 0,
        halalOnly: filters.halalStatus === 'halal',
        openNow: filters.openNow || false
      });

      // Check if this is a location query (geocoded successfully AND not a cuisine/food item)
      // Don't treat cuisine queries or empty queries with userLocation as location queries
      // Update isLocationQuery flag if we have a search center and it's not a food/cuisine query
      if (searchCenter && !cuisineFromQuery && !foodFromQuery && !mealTypeFromQuery && 
          (searchQuery && searchQuery.trim().length > 0 || locationFromQuery)) {
        isLocationQuery = true;
      }
      
      // If it's a location query and Firestore has very few results (< 5), 
      // it's likely incomplete - fallback to Google Places for better coverage
      if (isLocationQuery && results.length > 0 && results.length < 5) {
        console.log(`⚠️ Location query "${searchQuery}" has only ${results.length} result(s) in Firestore`);
        console.log('💡 This seems incomplete for a location - falling back to Google Places for better coverage');
      }

      // Apply text-based filtering if search query is provided
      let filteredResults = results;
      let shouldFallbackToGoogle = false;
      
      // Determine what to filter by:
      // - If compound query has food item, filter by food item
      // - If compound query has location, don't filter (location already correct)
      // - Otherwise, use full query for text filtering
      const textFilterQuery = foodFromQuery || (parsedQuery && parsedQuery.remaining) || searchQuery;
      const isFoodItem = foodFromQuery || (searchQuery && this.isCuisineType(searchQuery));
      const isLocationOnly = locationFromQuery && !foodFromQuery && !cuisineFromQuery;
      
      if (textFilterQuery && !isLocationOnly) {
        console.log('🔍 Applying text-based filtering for query:', textFilterQuery);
        const beforeFilter = results.length;
        filteredResults = this.filterByTextQuery(results, textFilterQuery);
        console.log(`📊 Text filtering: ${beforeFilter} → ${filteredResults.length} results`);
        
        // If text filtering removed all results, check if it's a food item or location
        if (filteredResults.length === 0 && beforeFilter > 0) {
          // Don't geocode if it's a known food item/cuisine type
          if (isFoodItem) {
            console.log(`🍽️ Query "${searchQuery}" is a food item - will search for restaurants serving this`);
            shouldFallbackToGoogle = true;
            
            // Priority: Parsed location > User location > Broad search
            if (locationFromQuery) {
              // Use the parsed location from compound query
              const predefined = await this.getPredefinedLocation(locationFromQuery);
              if (predefined) {
                searchCenter = predefined;
                searchBounds = this.createSearchBounds(predefined, filters.distance || 25);
                console.log(`📍 Using parsed location "${locationFromQuery}" for food item search`);
              } else {
                // Try geocoding the parsed location
                try {
                  const geocoded = await this.geocodeLocation(locationFromQuery);
                  if (geocoded && geocoded.address.toLowerCase() !== 'malaysia') {
                    searchCenter = geocoded;
                    searchBounds = this.createSearchBounds(geocoded, filters.distance || 25);
                    console.log(`📍 Using geocoded location "${locationFromQuery}" for food item search`);
                  } else {
                    // Fallback to user location or broad search
                    if (userLocation) {
                      searchCenter = userLocation;
                      searchBounds = this.createSearchBounds(userLocation, filters.distance || 25);
                      console.log('📍 Using user location for food item search');
                    } else {
                      searchCenter = { lat: 4.2105, lng: 101.9758 };
                      searchBounds = this.createSearchBounds(searchCenter, 100);
                      console.log('🌍 Searching broadly for food item (no location)');
                    }
                  }
                } catch (error) {
                  console.warn('⚠️ Could not geocode parsed location, using fallback:', error);
                  if (userLocation) {
                    searchCenter = userLocation;
                    searchBounds = this.createSearchBounds(userLocation, filters.distance || 25);
                  } else {
                    searchCenter = { lat: 4.2105, lng: 101.9758 };
                    searchBounds = this.createSearchBounds(searchCenter, 100);
                  }
                }
              }
            } else if (userLocation) {
              // No parsed location, use user location if available
              searchCenter = userLocation;
              searchBounds = this.createSearchBounds(userLocation, filters.distance || 25);
              console.log('📍 Using user location for food item search');
            } else {
              // No location at all - search broadly
              searchCenter = { lat: 4.2105, lng: 101.9758 };
              searchBounds = this.createSearchBounds(searchCenter, 100); // 100km radius
              console.log('🌍 Searching broadly for food item (no location)');
            }
          } else {
            // Not a food item - might be a location, try geocoding
            console.log('⚠️ Text filtering removed all results, checking if query is a location...');
            try {
              const geocoded = await this.geocodeLocation(searchQuery);
              if (geocoded && geocoded.address.toLowerCase() !== 'malaysia') {
                console.log('📍 Query geocoded successfully - treating as location query');
                console.log('🔄 Forcing Google Places fallback for location:', searchQuery);
                shouldFallbackToGoogle = true;
                // Update search bounds to use geocoded location
                searchBounds = this.createSearchBounds(geocoded, filters.distance || 25);
                searchCenter = geocoded;
              } else {
                console.log('⚠️ Geocoding returned "Malaysia" or failed - treating as food item search');
                shouldFallbackToGoogle = true;
                // Use user location or broad search
                if (userLocation) {
                  searchCenter = userLocation;
                  searchBounds = this.createSearchBounds(userLocation, filters.distance || 25);
                } else {
                  searchCenter = { lat: 4.2105, lng: 101.9758 };
                  searchBounds = this.createSearchBounds(searchCenter, 100);
                }
              }
            } catch (error) {
              console.log('⚠️ Query does not geocode - treating as food item search');
              shouldFallbackToGoogle = true;
              // Use user location or broad search
              if (userLocation) {
                searchCenter = userLocation;
                searchBounds = this.createSearchBounds(userLocation, filters.distance || 25);
              } else {
                searchCenter = { lat: 4.2105, lng: 101.9758 };
                searchBounds = this.createSearchBounds(searchCenter, 100);
              }
            }
          }
        }
      }
      
      // If we should fallback to Google Places (location query with no matching results)
      // This happens when:
      // 1. Firestore has results but text filtering removes them all AND query geocodes successfully (or is food item)
      // 2. It's a recognized location query with no results
      // 3. It's a location query (geocoded) with very few results (< 5) - likely incomplete data
      // Note: Don't treat food items or cuisines as location queries
      const shouldFallbackForIncompleteData = isLocationQuery && !isFoodItem && !cuisineFromQuery && results.length > 0 && results.length < 5;
      const isLocationQueryCheck = this.isLocationQuery(searchQuery) && !isFoodItem && !cuisineFromQuery;
      
      if (shouldFallbackToGoogle || (isLocationQueryCheck && filteredResults.length === 0) || shouldFallbackForIncompleteData) {
        if (isFoodItem) {
          console.log(`🍽️ Food item search "${searchQuery}" - searching Google Places for restaurants serving this...`);
          console.log('💡 This will find restaurants that serve or mention this food item');
        } else if (shouldFallbackForIncompleteData) {
          console.log(`🔄 Location query "${searchQuery}" has incomplete data (${results.length} result(s)), forcing Google Places fallback...`);
          console.log('💡 This ensures we get complete restaurant coverage for this location');
        } else {
          console.log('🔄 Location query with no matching results, forcing Google Places fallback...');
          console.log('💡 This ensures we get restaurants from the correct location');
        }
        
        // Use the best available bounds (geocoded > predefined > original)
        let locationBounds = searchBounds;
        if (searchCenter) {
          // Already have geocoded center, use it
          locationBounds = this.createSearchBounds(searchCenter, filters.distance || 25);
          console.log('📍 Using geocoded location bounds:', searchCenter);
        } else if (this.isLocationQuery(searchQuery)) {
          // Try to geocode if not already done
          try {
            const geocoded = await this.geocodeLocation(searchQuery);
            if (geocoded) {
              locationBounds = this.createSearchBounds(geocoded, filters.distance || 25);
              searchCenter = geocoded;
              console.log('📍 Geocoded location for better bounds:', geocoded);
            }
          } catch (error) {
            console.log('⚠️ Geocoding failed, using original bounds');
          }
        }
        
        // Build custom text query for Google Places if we have compound query
        // Example: "roti canai petaling jaya" → "roti canai restaurant petaling jaya"
        let customTextQuery = null;
        if (foodFromQuery && locationFromQuery) {
          customTextQuery = `${foodFromQuery} restaurant ${locationFromQuery}`;
          console.log(`🍽️ Using compound query for Google Places: "${customTextQuery}"`);
        } else if (foodFromQuery) {
          customTextQuery = `${foodFromQuery} restaurant`;
          console.log(`🍽️ Using food query for Google Places: "${customTextQuery}"`);
        } else if (mealTypeFromQuery && locationFromQuery) {
          customTextQuery = `${mealTypeFromQuery} restaurant ${locationFromQuery}`;
          console.log(`🍽️ Using meal type + location query: "${customTextQuery}"`);
        } else if (cuisineFromQuery && locationFromQuery) {
          customTextQuery = `${cuisineFromQuery} restaurant ${locationFromQuery}`;
          console.log(`🌍 Using cuisine + location query: "${customTextQuery}"`);
        }
        
        // Force Google Places search (bypass Firestore to get fresh data for the correct location)
        const googleResults = await firestoreSearchService.searchRestaurants(
          locationBounds, 
          {
            foodType: filters.cuisineType !== 'all' ? filters.cuisineType : 'all',
            minRating: filters.minRating || 0,
            halalOnly: filters.halalStatus === 'halal',
            openNow: filters.openNow || false
          }, 
          true, // forceGooglePlaces = true to bypass Firestore
          customTextQuery // Pass custom text query for compound searches
        );
        
        // For compound queries, apply smart filtering:
        // - If we have food item + location: filter by food item only (location already correct)
        // - If we have cuisine + location: filter by cuisine only (location already correct)
        // - If we have meal type + location: filter by meal type only (location already correct)
        // - If location only: don't filter (location already correct)
        // - If food only: filter by food item
        const isLocationOnly = locationFromQuery && !foodFromQuery && !cuisineFromQuery && !mealTypeFromQuery;
        const isCompoundQuery = (foodFromQuery && locationFromQuery) || (cuisineFromQuery && locationFromQuery) || (mealTypeFromQuery && locationFromQuery);
        
        if (isLocationOnly) {
          // Location only - don't filter, results are already from correct location
          filteredResults = googleResults;
          console.log(`✅ Returning all ${googleResults.length} results for location: ${locationFromQuery}`);
        } else if (isCompoundQuery && googleResults.length > 0) {
          // Compound query - filter by food/cuisine/meal type (location already correct)
          const filterBy = foodFromQuery || cuisineFromQuery || mealTypeFromQuery || searchQuery;
          const beforeTextFilter = googleResults.length;
          filteredResults = this.filterByTextQuery(googleResults, filterBy);
          console.log(`🔍 Filtering compound query results by "${filterBy}": ${beforeTextFilter} → ${filteredResults.length}`);
        } else if (foodFromQuery && googleResults.length > 0) {
          // Food item only - filter by food item
          const beforeTextFilter = googleResults.length;
          filteredResults = this.filterByTextQuery(googleResults, foodFromQuery);
          console.log(`🍽️ Text filtering food item results: ${beforeTextFilter} → ${filteredResults.length}`);
        } else if (searchQuery && googleResults.length > 0) {
          // Fallback: filter by full query
          const beforeTextFilter = googleResults.length;
          filteredResults = this.filterByTextQuery(googleResults, searchQuery);
          console.log(`📊 Text filtering Google results: ${beforeTextFilter} → ${filteredResults.length}`);
        } else {
          filteredResults = googleResults;
        }
        
        if (isFoodItem) {
          console.log(`✅ Google Places search returned ${filteredResults.length} results for food item: ${searchQuery}`);
        } else if (isCompoundQuery) {
          console.log(`✅ Google Places search returned ${filteredResults.length} results for compound query: ${searchQuery}`);
        } else {
          console.log(`✅ Google Places fallback returned ${filteredResults.length} results for location: ${searchQuery}`);
        }
      }

      // Apply additional filters (but don't apply cuisine filter if query is a cuisine name)
      // This prevents double-filtering when user searches for "Cafe" or "Malay"
      const filtersToApply = { ...filters };
      if (searchQuery && !this.isLocationQuery(searchQuery)) {
        // If search query matches a cuisine type, don't filter by cuisine again
        const cuisineTypes = ['malay', 'chinese', 'indian', 'western', 'japanese', 'korean', 'thai', 'italian', 'fast food', 'cafe'];
        const queryLower = searchQuery.toLowerCase().trim();
        if (cuisineTypes.some(cuisine => queryLower.includes(cuisine))) {
          filtersToApply.cuisineType = 'all'; // Don't filter by cuisine, text filtering already did it
        }
      }
      
      filteredResults = this.applyFilters(filteredResults, filtersToApply);
      console.log(`📊 After applyFilters: ${filteredResults.length} results`);

      // Calculate distances if user location is available
      if (searchCenter) {
        filteredResults = filteredResults.map(restaurant => ({
          ...restaurant,
          distanceFromUser: this.calculateDistance(searchCenter, restaurant.location)
        }));
      }

      // Sort results
      filteredResults = this.sortResults(filteredResults, filters.sortBy || 'rating');

      // Save to search history
      this.saveSearchToHistory(searchQuery, filters);

      console.log(`✅ Enhanced search completed: ${filteredResults.length} results`);
      return filteredResults;

    } catch (error) {
      console.error('❌ Enhanced search error:', error);
      throw error;
    }
  }

  // Check if query looks like a location
  isLocationQuery(query) {
    const locationKeywords = [
      'kuala lumpur', 'kl', 'petaling jaya', 'pj', 'shah alam', 'subang',
      'cheras', 'ampang', 'kepong', 'selayang', 'gombak', 'klang',
      'malacca', 'melaka', 'penang', 'georgetown', 'johor bahru', 'jb',
      'ipoh', 'kuching', 'kota kinabalu', 'kk', 'alor setar', 'kangar',
      'langkawi', 'pulau langkawi', 'tioman', 'redang', 'pangkor', 'perhentian',
      'kedah', 'perak', 'selangor', 'johor', 'pahang', 'terengganu',
      'kelantan', 'perlis', 'sabah', 'sarawak', 'labuan',
      'near', 'around', 'close to', 'nearby'
    ];

    const lowerQuery = query.toLowerCase();
    return locationKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  // Check if query starts with a food prefix (nasi, mee, roti, etc.)
  // This prevents geocoding food-related partial queries like "nasi " or "mee "
  isFoodPrefix(query) {
    const foodPrefixes = [
      'nasi', 'mee', 'roti', 'sup', 'ayam', 'ikan', 'bubur', 'laksa',
      'char', 'curry', 'teh', 'kopi', 'milo', 'horlicks', 'biryani',
      'tandoori', 'dim', 'sushi', 'ramen', 'tom', 'pad', 'pho', 'banh',
      'wonton', 'hokkien', 'bak', 'chicken', 'udang', 'ketam', 'sotong'
    ];
    
    const lowerQuery = query.toLowerCase().trim();
    // Check if query starts with a food prefix (but allow full words like "nasi lemak")
    // Only skip if it's just the prefix alone or with trailing space (≤ 6 chars)
    if (lowerQuery.length <= 6) { // Short queries like "nasi ", "mee ", "roti"
      return foodPrefixes.some(prefix => lowerQuery.startsWith(prefix));
    }
    
    return false;
  }

  // Check if query is a cuisine type or food item (not a location)
  isCuisineType(query) {
    const cuisineTypes = [
      'malay', 'chinese', 'indian', 'western', 'japanese', 'korean',
      'thai', 'italian', 'fast food', 'cafe', 'kopi', 'restaurant',
      'food', 'cuisine', 'halal', 'non-halal', 'pork-free'
    ];
    
    // Common Malaysian food items
    const foodItems = [
      'nasi lemak', 'nasi goreng', 'nasi kerabu', 'nasi dagang',
      'karipap', 'curry puff', 'roti canai', 'roti', 'murtabak',
      'char kway teow', 'laksa', 'mee goreng', 'mee rebus',
      'satay', 'rendang', 'ayam goreng', 'ikan bakar',
      'teh tarik', 'kopi o', 'kopi ais', 'milo', 'horlicks'
    ];

    const lowerQuery = query.toLowerCase().trim();
    
    // Check if it's a cuisine type
    if (cuisineTypes.some(cuisine => lowerQuery === cuisine || lowerQuery.includes(cuisine))) {
      return true;
    }
    
    // Check if it's a food item
    if (foodItems.some(food => lowerQuery.includes(food))) {
      return true;
    }
    
    return false;
  }

  // Get predefined location coordinates for major Malaysian cities
  async getPredefinedLocation(query) {
    const lowerQuery = query.toLowerCase();
    
    // First check learned locations with coordinates (from brain)
    try {
      const { keywordLearningService } = await import('./keywordLearningService');
      const learnedCoords = await keywordLearningService.getLearnedLocationCoordinates(lowerQuery);
      if (learnedCoords) {
        console.log(`📍 Using learned location coordinates: "${lowerQuery}" →`, learnedCoords);
        return learnedCoords;
      }
    } catch (error) {
      // Silently fail - fallback to hardcoded locations
    }
    
    const predefinedLocations = {
      'kuala lumpur': { lat: 3.1390, lng: 101.6869 },
      'kl': { lat: 3.1390, lng: 101.6869 },
      'petaling jaya': { lat: 3.1073, lng: 101.6085 },
      'pj': { lat: 3.1073, lng: 101.6085 },
      'shah alam': { lat: 3.0733, lng: 101.5185 },
      'subang': { lat: 3.1502, lng: 101.5327 },
      'cheras': { lat: 3.0833, lng: 101.7500 },
      'ampang': { lat: 3.1500, lng: 101.7667 },
      'kepong': { lat: 3.2167, lng: 101.6333 },
      'selayang': { lat: 3.2333, lng: 101.6500 },
      'gombak': { lat: 3.2167, lng: 101.6500 },
      'klang': { lat: 3.0333, lng: 101.4500 },
      'kluang': { lat: 2.0333, lng: 103.3167 }, // Added Kluang
      'yong peng': { lat: 2.0167, lng: 103.0667 },
      'simpang renggam': { lat: 1.8333, lng: 103.3167 },
      'malacca': { lat: 2.1896, lng: 102.2501 },
      'melaka': { lat: 2.1896, lng: 102.2501 },
      'penang': { lat: 5.4164, lng: 100.3327 },
      'georgetown': { lat: 5.4164, lng: 100.3327 },
      'johor bahru': { lat: 1.4927, lng: 103.7414 },
      'jb': { lat: 1.4927, lng: 103.7414 },
      'ipoh': { lat: 4.5841, lng: 101.0829 },
      'kuching': { lat: 1.5533, lng: 110.3591 },
      'kota kinabalu': { lat: 5.9804, lng: 116.0735 },
      'kk': { lat: 5.9804, lng: 116.0735 },
      'alor setar': { lat: 6.1214, lng: 100.3681 },
      'kangar': { lat: 6.4414, lng: 100.1986 },
      'langkawi': { lat: 6.3500, lng: 99.8000 },
      'pulau langkawi': { lat: 6.3500, lng: 99.8000 },
      'kedah': { lat: 6.1214, lng: 100.3681 }, // Alor Setar as Kedah center
      'perak': { lat: 4.5841, lng: 101.0829 }, // Ipoh as Perak center
      'selangor': { lat: 3.1073, lng: 101.6085 }, // PJ as Selangor center
      'johor': { lat: 1.4927, lng: 103.7414 }, // JB as Johor center
      'pahang': { lat: 3.8077, lng: 103.3260 }, // Kuantan as Pahang center
      'terengganu': { lat: 5.3117, lng: 103.1192 }, // Kuala Terengganu
      'kelantan': { lat: 6.1256, lng: 102.2431 }, // Kota Bharu
      'perlis': { lat: 6.4414, lng: 100.1986 }, // Kangar
      'sabah': { lat: 5.9804, lng: 116.0735 }, // Kota Kinabalu as Sabah center
      'sarawak': { lat: 1.5533, lng: 110.3591 }, // Kuching as Sarawak center
      'labuan': { lat: 5.2831, lng: 115.2308 }
    };

    // Find matching location - check longest matches first to avoid partial matches
    // Sort by length (longest first) so "kluang" matches before "kl"
    const sortedLocations = Object.entries(predefinedLocations).sort((a, b) => b[0].length - a[0].length);
    
    for (const [key, coords] of sortedLocations) {
      // Use word boundary or exact match to avoid partial matches
      // Check if query equals key OR query contains key as whole word
      if (lowerQuery === key || lowerQuery.includes(key)) {
        // Additional check: if key is short (like "kl"), make sure it's not part of a longer word
        if (key.length <= 2) {
          // For short keys, check if it's a whole word match
          const regex = new RegExp(`\\b${key}\\b`, 'i');
          if (!regex.test(lowerQuery)) {
            continue; // Skip if it's part of a longer word
          }
        }
        console.log('📍 Using predefined location:', key, coords);
        return coords;
      }
    }

    return null;
  }

  // Filter results by text query (case-insensitive, partial matching)
  filterByTextQuery(results, searchQuery) {
    const query = searchQuery.toLowerCase().trim();
    
    // If query is empty, return all results
    if (!query) {
      return results;
    }
    
    // Split query into words, but also keep the full query for partial matching
    const queryWords = query.split(/\s+/).filter(word => word.length > 0);
    
    return results.filter(restaurant => {
      // Build searchable text from all restaurant fields
      const searchableText = [
        restaurant.name || '',
        restaurant.displayName || '',
        restaurant.address || '',
        restaurant.formattedAddress || '',
        restaurant.cuisineType || '',
        restaurant.types ? restaurant.types.join(' ') : '',
        restaurant.vicinity || ''
      ].join(' ').toLowerCase();
      
      // Strategy 1: Check if full query matches anywhere (for partial matches like "mc" → "mcdonald's")
      if (searchableText.includes(query)) {
        return true;
      }
      
      // Strategy 2: Check if all query words are found (for multi-word queries like "nasi lemak")
      if (queryWords.length > 0) {
        return queryWords.every(word => {
          // Each word must be at least 2 characters to avoid matching single letters
          if (word.length < 2) {
            return true; // Skip single character words
          }
          return searchableText.includes(word);
        });
      }
      
      return false;
    });
  }

  // Geocode location using Google Geocoding API
  async geocodeLocation(address) {
    try {
      console.log(`🗺️ Geocoding request for: "${address}"`);
      
      if (!window.google?.maps?.importLibrary) {
        console.error('❌ Google Maps API not loaded yet');
        throw new Error('Google Maps not loaded');
      }

      const { Geocoder } = await window.google.maps.importLibrary("geocoding");
      const geocoder = new Geocoder();

      return new Promise((resolve, reject) => {
        const query = /malaysia/i.test(address) ? address : `${address}, Malaysia`;
        console.log(`🗺️ Geocoding query: "${query}"`);
        
        geocoder.geocode({ address: query }, async (results, status) => {
          console.log(`🗺️ Geocoding response status: ${status}`);
          
          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            const result = {
              lat: location.lat(),
              lng: location.lng(),
              address: results[0].formatted_address
            };
            console.log(`✅ Geocoding SUCCESS:`, result);
            
            // Learn coordinates for future use (non-blocking)
            try {
              const { keywordLearningService } = await import('./keywordLearningService');
              await keywordLearningService.learnLocationCoordinates(
                address.toLowerCase().trim(),
                result.lat,
                result.lng
              ).catch(err => {
                console.log('⚠️ Could not learn location coordinates (non-critical):', err.message);
              });
            } catch (importError) {
              // Silently fail - learning is optional
            }
            
            resolve(result);
          } else {
            const errorMsg = `Geocoding failed: ${status}`;
            console.error(`❌ ${errorMsg}`);
            console.error(`❌ Results:`, results);
            reject(new Error(errorMsg));
          }
        });
      });
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  // Apply filters to search results
  applyFilters(results, filters) {
    return results.filter(restaurant => {
      // Rating filter
      if (filters.minRating > 0 && restaurant.rating < filters.minRating) {
        return false;
      }

      // Halal status filter
      if (filters.halalStatus !== 'all') {
        if (filters.halalStatus === 'halal' && restaurant.halalStatus !== 'halal') {
          return false;
        }
        if (filters.halalStatus === 'pork-free' && restaurant.halalStatus !== 'pork-free') {
          return false;
        }
        if (filters.halalStatus === 'non-halal' && restaurant.halalStatus !== 'non-halal') {
          return false;
        }
      }

      // Price range filter
      if (filters.priceRange !== 'all') {
        const priceLevel = restaurant.priceLevel;
        if (filters.priceRange === '$' && priceLevel !== 1) return false;
        if (filters.priceRange === '$$' && priceLevel !== 2) return false;
        if (filters.priceRange === '$$$' && priceLevel !== 3) return false;
        if (filters.priceRange === '$$$$' && priceLevel !== 4) return false;
      }

      // Cuisine type filter
      if (filters.cuisineType !== 'all') {
        const types = restaurant.types || [];
        const cuisineType = restaurant.cuisineType || '';
        
        if (!types.some(type => 
          type.toLowerCase().includes(filters.cuisineType.toLowerCase())
        ) && !cuisineType.toLowerCase().includes(filters.cuisineType.toLowerCase())) {
          return false;
        }
      }

      // Open now filter
      if (filters.openNow && restaurant.currentOpeningHours) {
        if (!restaurant.currentOpeningHours.openNow) {
          return false;
        }
      }

      // Verified only filter
      if (filters.verifiedOnly && !restaurant.verified) {
        return false;
      }

      // Has photos filter
      if (filters.hasPhotos && (!restaurant.photos || restaurant.photos.length === 0)) {
        return false;
      }

      return true;
    });
  }

  // Sort search results
  sortResults(results, sortBy) {
    switch (sortBy) {
      case 'rating':
        return results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      case 'distance':
        return results.sort((a, b) => (a.distanceFromUser || 0) - (b.distanceFromUser || 0));
      
      case 'newest':
        return results.sort((a, b) => {
          const dateA = a.lastUpdated || a.createdAt || a.dateAdded || 0;
          const dateB = b.lastUpdated || b.createdAt || b.dateAdded || 0;
          return new Date(dateB) - new Date(dateA);
        });
      
      case 'mostReviews':
        return results.sort((a, b) => (b.userRatingCount || 0) - (a.userRatingCount || 0));
      
      case 'price_low':
        return results.sort((a, b) => (a.priceLevel || 0) - (b.priceLevel || 0));
      
      case 'price_high':
        return results.sort((a, b) => (b.priceLevel || 0) - (a.priceLevel || 0));
      
      default:
        return results;
    }
  }

  // Calculate distance between two points
  calculateDistance(point1, point2) {
    if (!point1 || !point2) return null;
    return calculateHaversineDistance(point1, point2);
  }

  // Get popular restaurants (mock implementation)
  async getPopularRestaurants(userLocation = null) {
    // This would typically query a popularity/trending collection
    // For now, we'll do a broad search and sort by rating
    const bounds = userLocation 
      ? this.createSearchBounds(userLocation, 25)
      : this.createSearchBounds({ lat: 4.2105, lng: 101.9758 }, 100);

    const results = await firestoreSearchService.searchRestaurants(bounds, {
      foodType: 'all',
      minRating: 4.0,
      halalOnly: false,
      openNow: false
    });

    return this.sortResults(results, 'rating').slice(0, 10);
  }

  // Get trending restaurants (mock implementation)
  async getTrendingRestaurants(userLocation = null) {
    // This would typically query recent user activity
    // For now, we'll return recently added restaurants
    const bounds = userLocation 
      ? this.createSearchBounds(userLocation, 25)
      : this.createSearchBounds({ lat: 4.2105, lng: 101.9758 }, 100);

    const results = await firestoreSearchService.searchRestaurants(bounds, {
      foodType: 'all',
      minRating: 0,
      halalOnly: false,
      openNow: false
    });

    return this.sortResults(results, 'newest').slice(0, 10);
  }

  // Get search suggestions
  getSearchSuggestions(query) {
    if (!query || query.length < 2) return [];

    const suggestions = [
      // Popular restaurants
      'McDonald\'s', 'KFC', 'Pizza Hut', 'Subway', 'Starbucks',
      // Popular cuisines
      'Chinese food', 'Indian food', 'Malay food', 'Western food',
      // Popular locations
      'Kuala Lumpur', 'Petaling Jaya', 'Shah Alam', 'Subang Jaya',
      // Popular landmarks
      'Near KLCC', 'Near Sunway Pyramid', 'Near Mid Valley', 'Near Pavilion'
    ];

    return suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);
  }

  // Get recent searches
  getRecentSearches() {
    return this.searchHistory.slice(0, 5);
  }
}

export const enhancedSearchService = new EnhancedSearchService();
export default enhancedSearchService;
