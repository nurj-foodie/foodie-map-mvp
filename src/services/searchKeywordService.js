/**
 * Search Keyword & Suggestion Service
 * Provides intelligent keyword recognition and search suggestions
 * Similar to Google Search's autocomplete and keyword system
 */

import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

class SearchKeywordService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Keyword categories for intelligent recognition
    this.keywordCategories = {
      locations: [
        'kuala lumpur', 'kl', 'petaling jaya', 'pj', 'shah alam', 'subang',
        'cheras', 'ampang', 'kepong', 'selayang', 'gombak', 'klang',
        'malacca', 'melaka', 'penang', 'georgetown', 'johor bahru', 'jb',
        'ipoh', 'kuching', 'kota kinabalu', 'kk', 'alor setar', 'kangar',
        'langkawi', 'pulau langkawi', 'tioman', 'redang', 'pangkor', 'perhentian',
        'semporna', 'tawau', 'paloh', 'yong peng', 'simpang renggam', 'kluang',
        'kedah', 'perak', 'selangor', 'johor', 'pahang', 'terengganu',
        'kelantan', 'perlis', 'sabah', 'sarawak', 'labuan'
      ],
      cuisines: [
        'malay', 'chinese', 'indian', 'western', 'japanese', 'korean',
        'thai', 'italian', 'fast food', 'cafe', 'kopi', 'restaurant'
      ],
      foodItems: [
        'nasi lemak', 'nasi goreng', 'nasi kerabu', 'nasi dagang',
        'karipap', 'curry puff', 'roti canai', 'roti', 'murtabak',
        'char kway teow', 'laksa', 'mee goreng', 'mee rebus',
        'satay', 'rendang', 'ayam goreng', 'ikan bakar',
        'teh tarik', 'kopi o', 'kopi ais', 'milo', 'horlicks',
        'biryani', 'tandoori', 'dim sum', 'sushi', 'ramen',
        'tom yam', 'pad thai', 'pho', 'banh mi',
        'sup tulang', 'sup tulang merah', 'sup kambing', 'sup ayam',
        'sup daging', 'sup ikan', 'sup sayur', 'sup buntut',
        'bubur', 'bubur ayam', 'bubur lambuk', 'bubur cha cha',
        'mee soup', 'wonton mee', 'hokkien mee', 'curry mee',
        'bak kut teh', 'chicken rice', 'nasi ayam', 'ayam penyet',
        'ikan bakar', 'udang galah', 'ketam', 'sotong'
      ],
      restaurantChains: [
        'mcdonald', 'kfc', 'pizza hut', 'subway', 'starbucks',
        'domino', 'burger king', 'marrybrown', 'old town',
        'secret recipe', 'sushi king', 'sakae sushi'
      ],
      mealTypes: [
        'breakfast', 'lunch', 'dinner', 'brunch', 'supper',
        'sarapan', 'makan tengah hari', 'makan malam'
      ]
    };
    
    // Popular searches (can be updated from analytics)
    this.popularSearches = [
      'Nasi Lemak',
      'Kuala Lumpur',
      'Halal Chinese',
      'Near Me',
      'Cafe',
      'Roti Canai',
      'Char Kway Teow',
      'Laksa'
    ];
    
    // Search hints/examples
    this.searchHints = [
      { icon: '📍', text: 'Search by location: "Kuala Lumpur", "Penang"' },
      { icon: '🍽️', text: 'Search by food: "Nasi Lemak", "Roti Canai"' },
      { icon: '🏪', text: 'Search by restaurant: "McDonald\'s", "KFC"' },
      { icon: '🌍', text: 'Search by cuisine: "Halal Chinese", "Malay"' }
    ];
  }

  /**
   * Parse compound query to extract multiple keywords
   * Example: "roti canai petaling jaya" → { food: "roti canai", location: "petaling jaya" }
   * Example: "breakfast kluang" → { mealType: "breakfast", location: "kluang" }
   * Example: "western johor bahru" → { cuisine: "western", location: "johor bahru" }
   * @param {string} query - User's search query
   * @returns {object} - Parsed query with extracted keywords
   */
  parseCompoundQuery(query) {
    if (!query || query.length < 2) {
      return {
        original: query,
        location: null,
        food: null,
        cuisine: null,
        restaurant: null,
        mealType: null,
        remaining: query
      };
    }

    const lowerQuery = query.toLowerCase().trim();
    const parsed = {
      original: query,
      location: null,
      food: null,
      cuisine: null,
      restaurant: null,
      mealType: null,
      remaining: lowerQuery
    };

    // Extract meal types first (they're usually at the start)
    for (const mealType of this.keywordCategories.mealTypes) {
      if (lowerQuery.includes(mealType)) {
        parsed.mealType = mealType;
        parsed.remaining = parsed.remaining.replace(mealType, '').trim();
        break;
      }
    }

    // Extract food items BEFORE locations (food items are more specific)
    // This prevents "nasi" from being matched as location when user searches "nasi lemak"
    // Normalize remaining text for better matching (remove extra spaces)
    const normalizedRemaining = parsed.remaining.replace(/\s+/g, ' ').trim();
    const sortedFoodItems = [...this.keywordCategories.foodItems].sort((a, b) => b.length - a.length);
    for (const food of sortedFoodItems) {
      // Check if food item appears in remaining text (case-insensitive)
      if (normalizedRemaining.toLowerCase().includes(food.toLowerCase())) {
        parsed.food = food;
        // Remove the food item from remaining (case-insensitive)
        const regex = new RegExp(food.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        parsed.remaining = parsed.remaining.replace(regex, '').trim();
        break;
      }
    }

    // Extract locations AFTER food items (check longest matches first)
    // Only extract if no food item was found (to avoid conflicts)
    if (!parsed.food) {
      const sortedLocations = [...this.keywordCategories.locations].sort((a, b) => b.length - a.length);
      for (const location of sortedLocations) {
        if (parsed.remaining.includes(location)) {
          parsed.location = location;
          parsed.remaining = parsed.remaining.replace(location, '').trim();
          break; // Take first match (longest due to sorting)
        }
      }
    } else {
      // If food item was found, still check for locations in remaining text
      // This handles compound queries like "nasi lemak petaling jaya"
      const sortedLocations = [...this.keywordCategories.locations].sort((a, b) => b.length - a.length);
      for (const location of sortedLocations) {
        if (parsed.remaining.toLowerCase().includes(location.toLowerCase())) {
          parsed.location = location;
          parsed.remaining = parsed.remaining.replace(new RegExp(location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
          break;
        }
      }
    }

    // Extract cuisines
    for (const cuisine of this.keywordCategories.cuisines) {
      if (parsed.remaining.includes(cuisine)) {
        parsed.cuisine = cuisine;
        parsed.remaining = parsed.remaining.replace(cuisine, '').trim();
        break;
      }
    }

    // Extract restaurant chains
    for (const chain of this.keywordCategories.restaurantChains) {
      if (parsed.remaining.includes(chain)) {
        parsed.restaurant = chain;
        parsed.remaining = parsed.remaining.replace(chain, '').trim();
        break;
      }
    }

    // Clean up remaining (remove extra spaces)
    parsed.remaining = parsed.remaining.replace(/\s+/g, ' ').trim();

    return parsed;
  }

  /**
   * Recognize what type of search query this is
   * @param {string} query - User's search query
   * @returns {object} - { type: 'location'|'food'|'cuisine'|'restaurant'|'unknown', confidence: number }
   */
  recognizeKeywordType(query) {
    if (!query || query.length < 2) {
      return { type: 'unknown', confidence: 0 };
    }

    const lowerQuery = query.toLowerCase().trim();
    let maxConfidence = 0;
    let detectedType = 'unknown';

    // Check locations (exact match or contains)
    for (const location of this.keywordCategories.locations) {
      if (lowerQuery === location || lowerQuery.includes(location)) {
        const confidence = location.length / lowerQuery.length;
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          detectedType = 'location';
        }
      }
    }

    // Check food items
    for (const food of this.keywordCategories.foodItems) {
      if (lowerQuery.includes(food)) {
        const confidence = food.length / lowerQuery.length;
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          detectedType = 'food';
        }
      }
    }

    // Check cuisines
    for (const cuisine of this.keywordCategories.cuisines) {
      if (lowerQuery === cuisine || lowerQuery.includes(cuisine)) {
        const confidence = cuisine.length / lowerQuery.length;
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          detectedType = 'cuisine';
        }
      }
    }

    // Check restaurant chains
    for (const chain of this.keywordCategories.restaurantChains) {
      if (lowerQuery.includes(chain)) {
        const confidence = chain.length / lowerQuery.length;
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          detectedType = 'restaurant';
        }
      }
    }

    return {
      type: detectedType,
      confidence: Math.min(maxConfidence, 1.0),
      query: query
    };
  }

  /**
   * Get intelligent search suggestions based on query
   * Combines multiple sources: Firestore, keywords, popular searches
   * @param {string} query - User's search query
   * @param {number} maxResults - Maximum number of suggestions
   * @returns {Promise<Array>} - Array of suggestion objects
   */
  async getIntelligentSuggestions(query, maxResults = 8) {
    if (!query || query.length < 2) {
      return this.getDefaultSuggestions(maxResults);
    }

    const cacheKey = `suggestions_${query.toLowerCase()}_${maxResults}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.results;
    }

    const lowerQuery = query.toLowerCase().trim();
    const suggestions = [];

    // 1. Get restaurant name suggestions from Firestore
    try {
      const restaurantSuggestions = await this.getRestaurantNameSuggestions(query, 3);
      suggestions.push(...restaurantSuggestions.map(name => ({
        text: name,
        type: 'restaurant',
        icon: '🏪',
        source: 'firestore'
      })));
    } catch (error) {
      console.warn('⚠️ Error getting restaurant suggestions:', error);
    }

    // 2. Get location suggestions from Firestore
    try {
      const locationSuggestions = await this.getLocationSuggestions(query, 3);
      suggestions.push(...locationSuggestions.map(name => ({
        text: name,
        type: 'location',
        icon: '📍',
        source: 'firestore'
      })));
    } catch (error) {
      console.warn('⚠️ Error getting location suggestions:', error);
    }

    // 3. Get keyword-based suggestions (food items, cuisines)
    const keywordSuggestions = this.getKeywordSuggestions(query, 3);
    suggestions.push(...keywordSuggestions);

    // 4. Get popular searches that match
    const popularMatches = this.popularSearches
      .filter(popular => popular.toLowerCase().includes(lowerQuery))
      .slice(0, 2)
      .map(text => ({
        text,
        type: 'popular',
        icon: '🔥',
        source: 'popular'
      }));
    suggestions.push(...popularMatches);

    // Remove duplicates and limit results
    const uniqueSuggestions = [];
    const seen = new Set();
    for (const suggestion of suggestions) {
      const key = suggestion.text.toLowerCase();
      if (!seen.has(key) && uniqueSuggestions.length < maxResults) {
        seen.add(key);
        uniqueSuggestions.push(suggestion);
      }
    }

    // Cache results
    this.cache.set(cacheKey, {
      results: uniqueSuggestions,
      timestamp: Date.now()
    });

    return uniqueSuggestions;
  }

  /**
   * Get restaurant name suggestions from Firestore
   */
  async getRestaurantNameSuggestions(queryText, limitCount = 5) {
    try {
      const q = query(
        collection(db, 'eateries'),
        where('name', '>=', queryText),
        where('name', '<=', queryText + '\uf8ff'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const suggestions = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.name) {
          suggestions.push(data.name);
        }
      });

      return suggestions;
    } catch (error) {
      console.warn('⚠️ Error querying restaurant names:', error);
      return [];
    }
  }

  /**
   * Get location suggestions from Firestore location_index
   */
  async getLocationSuggestions(queryText, limitCount = 5) {
    try {
      const normalizedQuery = queryText.toLowerCase().trim();
      const locationsRef = collection(db, 'location_index');
      
      const prefixQuery = query(
        locationsRef,
        where('searchTerms', '>=', normalizedQuery),
        where('searchTerms', '<=', normalizedQuery + '\uf8ff'),
        orderBy('searchTerms'),
        limit(limitCount)
      );

      const snapshot = await getDocs(prefixQuery);
      const suggestions = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.name) {
          suggestions.push(data.name);
        }
      });

      return suggestions;
    } catch (error) {
      console.warn('⚠️ Error querying locations:', error);
      return [];
    }
  }

  /**
   * Get keyword-based suggestions (food items, cuisines)
   */
  getKeywordSuggestions(query, limitCount = 5) {
    const lowerQuery = query.toLowerCase().trim();
    const suggestions = [];

    // Check food items
    for (const food of this.keywordCategories.foodItems) {
      if (food.includes(lowerQuery) || lowerQuery.includes(food)) {
        suggestions.push({
          text: food.charAt(0).toUpperCase() + food.slice(1),
          type: 'food',
          icon: '🍽️',
          source: 'keywords'
        });
        if (suggestions.length >= limitCount) break;
      }
    }

    // Check cuisines
    for (const cuisine of this.keywordCategories.cuisines) {
      if (cuisine.includes(lowerQuery) || lowerQuery.includes(cuisine)) {
        suggestions.push({
          text: cuisine.charAt(0).toUpperCase() + cuisine.slice(1),
          type: 'cuisine',
          icon: '🌍',
          source: 'keywords'
        });
        if (suggestions.length >= limitCount * 2) break;
      }
    }

    return suggestions.slice(0, limitCount);
  }

  /**
   * Get default suggestions (when query is empty or too short)
   */
  getDefaultSuggestions(maxResults = 8) {
    return [
      ...this.popularSearches.slice(0, 4).map(text => ({
        text,
        type: 'popular',
        icon: '🔥',
        source: 'popular'
      })),
      ...this.searchHints.slice(0, 4).map(hint => ({
        text: hint.text,
        type: 'hint',
        icon: hint.icon,
        source: 'hints'
      }))
    ].slice(0, maxResults);
  }

  /**
   * Get search hints/examples (shown when input is empty or focused)
   */
  getSearchHints() {
    return this.searchHints;
  }

  /**
   * Get popular searches
   */
  getPopularSearches(limitCount = 8) {
    return this.popularSearches.slice(0, limitCount).map(text => ({
      text,
      type: 'popular',
      icon: '🔥',
      source: 'popular'
    }));
  }

  /**
   * Check for typos and suggest corrections (simple implementation)
   * @param {string} query - User's search query
   * @returns {string|null} - Suggested correction or null
   */
  suggestCorrection(query) {
    if (!query || query.length < 3) return null;

    const lowerQuery = query.toLowerCase().trim();
    
    // Simple Levenshtein distance check for common typos
    const commonCorrections = {
      'nasilemak': 'nasi lemak',
      'nasigoreng': 'nasi goreng',
      'rotikanai': 'roti canai',
      'charkwayteow': 'char kway teow',
      'kualalumpur': 'kuala lumpur',
      'petalingjaya': 'petaling jaya'
    };

    const normalized = lowerQuery.replace(/\s+/g, '');
    if (commonCorrections[normalized]) {
      return commonCorrections[normalized];
    }

    return null;
  }

  /**
   * Get search category badge (for UI display)
   */
  getSearchCategoryBadge(query) {
    const recognition = this.recognizeKeywordType(query);
    
    const badges = {
      location: { text: '📍 Location', color: '#4CAF50' },
      food: { text: '🍽️ Food Item', color: '#FF9800' },
      cuisine: { text: '🌍 Cuisine', color: '#2196F3' },
      restaurant: { text: '🏪 Restaurant', color: '#9C27B0' },
      unknown: { text: '🔍 Search', color: '#757575' }
    };

    return badges[recognition.type] || badges.unknown;
  }
}

export const searchKeywordService = new SearchKeywordService();
export default searchKeywordService;

