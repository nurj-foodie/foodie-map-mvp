import { db } from '../config/firebaseConfig';
import { collection, query, where, getDocs, addDoc, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Location Index Service
 * Handles indexing and retrieving locations for autocomplete functionality
 * Stores locations in Firestore `location_index` collection for fast autocomplete
 */
class LocationIndexService {
  constructor() {
    this.collectionName = 'location_index';
    this.cache = new Map(); // Cache for autocomplete results
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get location suggestions from Firestore based on query
   * @param {string} queryText - User input query
   * @param {number} maxResults - Maximum number of suggestions (default: 8)
   * @returns {Promise<string[]>} Array of location name strings
   */
  async getLocationSuggestions(queryText, maxResults = 8) {
    if (!queryText || queryText.length < 2) {
      return [];
    }

    try {
      // Check cache first
      const cacheKey = `${queryText.toLowerCase()}_${maxResults}`;
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`💾 Location suggestions cache hit for: "${queryText}"`);
        return cached.results;
      }

      const normalizedQuery = queryText.toLowerCase().trim();
      
      // Query Firestore for locations that start with or contain the query
      // Using >= and <= for prefix matching
      const locationsRef = collection(db, this.collectionName);
      
      // Try exact prefix match first (most relevant)
      // Note: Firestore requires composite index for multiple orderBy, but we'll prioritize prefix match
      const prefixQuery = query(
        locationsRef,
        where('searchTerms', '>=', normalizedQuery),
        where('searchTerms', '<=', normalizedQuery + '\uf8ff'),
        orderBy('searchTerms'),
        limit(maxResults * 2) // Get more to sort by usage count in memory
      );

      const snapshot = await getDocs(prefixQuery);
      const suggestionsWithUsage = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.name) {
          suggestionsWithUsage.push({
            name: data.name,
            usageCount: data.usageCount || 0
          });
        }
      });

      // Sort by usage count (most used first), then take top results
      suggestionsWithUsage.sort((a, b) => b.usageCount - a.usageCount);
      const suggestions = suggestionsWithUsage.slice(0, maxResults).map(s => s.name);

      // Cache results
      this.cache.set(cacheKey, {
        results: suggestions,
        timestamp: Date.now()
      });
      
      console.log(`✅ Found ${suggestions.length} location suggestions from Firestore for: "${queryText}"`);
      
      // If we have enough results, return them
      if (suggestions.length >= maxResults) {
        return suggestions;
      }

      // If not enough prefix matches, also search for contains (case-insensitive)
      // This is a fallback - Firestore doesn't support case-insensitive contains directly
      // So we'll use the prefix results and supplement with hardcoded list if needed
      
      // Cache results
      this.cache.set(cacheKey, {
        results: suggestions,
        timestamp: Date.now()
      });
      
      console.log(`✅ Found ${suggestions.length} location suggestions from Firestore for: "${queryText}"`);
      return suggestions;

    } catch (error) {
      console.warn('⚠️ Error querying location index:', error);
      // Return empty array on error - will fallback to hardcoded list
      return [];
    }
  }

  /**
   * Index a new location (add to Firestore if not exists)
   * Called when user successfully geocodes a location
   * @param {string} locationName - Full location name (e.g., "Dungun District, Terengganu, Malaysia")
   * @param {Object} locationData - Additional data (lat, lng, etc.)
   */
  async indexLocation(locationName, locationData = {}) {
    if (!locationName || locationName.trim().length === 0) {
      return;
    }

    try {
      const normalizedName = locationName.trim();
      
      // Create search terms (lowercase, split words for better matching)
      const searchTerms = this.createSearchTerms(normalizedName);
      
      // Check if location already exists
      const existingDoc = await this.findLocationByName(normalizedName);
      
      if (existingDoc) {
        // Update usage count
        const currentCount = existingDoc.usageCount || 0;
        await setDoc(existingDoc.ref, {
          ...existingDoc.data,
          usageCount: currentCount + 1,
          lastUsed: new Date(),
          searchTerms: searchTerms // Update search terms in case format changed
        }, { merge: true });
        console.log(`📝 Updated location index entry: "${normalizedName}" (usage count: ${currentCount + 1})`);
      } else {
        // Create new location entry
        const locationDoc = {
          name: normalizedName,
          searchTerms: searchTerms,
          usageCount: 1,
          firstIndexed: new Date(),
          lastUsed: new Date(),
          ...locationData // Include lat, lng, etc. if provided
        };

        await addDoc(collection(db, this.collectionName), locationDoc);
        console.log(`✅ Indexed new location: "${normalizedName}"`);
        
        // Clear cache to force refresh
        this.cache.clear();
      }
    } catch (error) {
      console.error('❌ Error indexing location:', error);
    }
  }

  /**
   * Create search terms from location name for better matching
   * @param {string} locationName - Location name
   * @returns {string} Normalized search terms
   */
  createSearchTerms(locationName) {
    // Convert to lowercase and remove common suffixes
    let normalized = locationName.toLowerCase().trim();
    
    // Remove common country/state suffixes for matching
    normalized = normalized
      .replace(/\s*,\s*malaysia\s*$/i, '')
      .replace(/\s*,\s*malaysia\s*$/i, '') // Remove twice to catch nested commas
      .trim();
    
    return normalized;
  }

  /**
   * Find location by name in Firestore
   * @param {string} locationName - Location name to find
   * @returns {Promise<Object|null>} Document snapshot or null
   */
  async findLocationByName(locationName) {
    try {
      const normalizedName = locationName.trim();
      const searchTerms = this.createSearchTerms(normalizedName);
      
      const locationsRef = collection(db, this.collectionName);
      const q = query(
        locationsRef,
        where('searchTerms', '==', searchTerms),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return {
          ref: doc.ref,
          data: doc.data(),
          id: doc.id
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error finding location:', error);
      return null;
    }
  }

  /**
   * Get popular locations (most used)
   * @param {number} limitCount - Number of locations to return
   * @returns {Promise<string[]>} Array of location names
   */
  async getPopularLocations(limitCount = 20) {
    try {
      const locationsRef = collection(db, this.collectionName);
      const q = query(
        locationsRef,
        orderBy('usageCount', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const locations = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.name) {
          locations.push(data.name);
        }
      });

      return locations;
    } catch (error) {
      console.error('❌ Error getting popular locations:', error);
      return [];
    }
  }
}

export const locationIndexService = new LocationIndexService();

