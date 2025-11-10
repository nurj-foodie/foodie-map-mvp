/**
 * Search Analytics Service
 * Tracks user search behavior to improve keyword recognition and suggestions
 */

import { collection, addDoc, query, where, getDocs, orderBy, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

class SearchAnalyticsService {
  constructor() {
    this.collectionName = 'search_analytics';
    this.keywordStatsCollection = 'keyword_stats';
    this.localStorageKey = 'searchAnalytics';
    this.batchSize = 10; // Batch writes to reduce API calls
    this.pendingSearches = [];
  }

  /**
   * Track a search query
   * @param {string} searchQuery - User's search query
   * @param {object} parsedQuery - Parsed query result from searchKeywordService
   * @param {number} resultCount - Number of results returned
   * @param {object} filters - Applied filters
   */
  async trackSearch(searchQuery, parsedQuery = null, resultCount = 0, filters = {}) {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return;
    }

    const searchData = {
      query: searchQuery.trim().toLowerCase(),
      originalQuery: searchQuery.trim(),
      parsedLocation: parsedQuery?.location || null,
      parsedFood: parsedQuery?.food || null,
      parsedCuisine: parsedQuery?.cuisine || null,
      parsedMealType: parsedQuery?.mealType || null,
      resultCount: resultCount,
      filters: filters,
      timestamp: new Date(),
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      hour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      // User context (if available)
      hasLocation: !!parsedQuery?.location,
      hasFood: !!parsedQuery?.food,
      isCompound: !!(parsedQuery?.location && (parsedQuery?.food || parsedQuery?.cuisine || parsedQuery?.mealType))
    };

    // Store in local storage for offline tracking
    this.storeLocally(searchData);

    // Add to pending batch
    this.pendingSearches.push(searchData);

    // Batch write to Firestore (reduce API calls)
    if (this.pendingSearches.length >= this.batchSize) {
      await this.flushPendingSearches();
    } else {
      // Flush after 5 seconds if batch not full
      setTimeout(() => this.flushPendingSearches(), 5000);
    }

    // Update keyword statistics
    await this.updateKeywordStats(searchData);
  }

  /**
   * Store search in local storage (offline support)
   */
  storeLocally(searchData) {
    try {
      const storedRaw = localStorage.getItem(this.localStorageKey);
      let stored = [];
      
      // Safely parse stored data - ensure it's always an array
      if (storedRaw) {
        try {
          const parsed = JSON.parse(storedRaw);
          if (Array.isArray(parsed)) {
            stored = parsed;
          } else {
            // If it's not an array, start fresh
            console.warn('⚠️ Local storage data is not an array, resetting');
            stored = [];
          }
        } catch (parseError) {
          // If parsing fails, start fresh
          console.warn('⚠️ Error parsing local storage data, resetting:', parseError);
          stored = [];
        }
      }
      
      stored.push(searchData);
      // Keep only last 100 searches locally
      const recent = stored.slice(-100);
      localStorage.setItem(this.localStorageKey, JSON.stringify(recent));
    } catch (error) {
      console.warn('⚠️ Error storing search locally:', error);
    }
  }

  /**
   * Flush pending searches to Firestore
   */
  async flushPendingSearches() {
    if (this.pendingSearches.length === 0) return;

    const batch = [...this.pendingSearches];
    this.pendingSearches = [];

    try {
      for (const search of batch) {
        await addDoc(collection(db, this.collectionName), search);
      }
      console.log(`📊 Tracked ${batch.length} searches to analytics`);
    } catch (error) {
      console.error('❌ Error tracking searches:', error);
      // Re-add to pending if failed
      this.pendingSearches.unshift(...batch);
    }
  }

  /**
   * Update keyword statistics for learning
   */
  async updateKeywordStats(searchData) {
    try {
      const keywords = this.extractKeywords(searchData);
      
      for (const keyword of keywords) {
        const keywordRef = doc(db, this.keywordStatsCollection, keyword.id);
        
        // Check if keyword exists
        const keywordQuery = query(
          collection(db, this.keywordStatsCollection),
          where('keyword', '==', keyword.keyword),
          limit(1)
        );
        const snapshot = await getDocs(keywordQuery);
        
        if (snapshot.empty) {
          // Create new keyword stat
          await addDoc(collection(db, this.keywordStatsCollection), {
            keyword: keyword.keyword,
            type: keyword.type,
            searchCount: 1,
            resultCount: searchData.resultCount,
            lastSearched: new Date(),
            firstSearched: new Date(),
            contexts: [{
              query: searchData.query,
              resultCount: searchData.resultCount,
              timestamp: new Date()
            }]
          });
        } else {
          // Update existing keyword stat
          const docRef = snapshot.docs[0].ref;
          await updateDoc(docRef, {
            searchCount: increment(1),
            resultCount: increment(searchData.resultCount),
            lastSearched: new Date(),
            contexts: [...(snapshot.docs[0].data().contexts || []), {
              query: searchData.query,
              resultCount: searchData.resultCount,
              timestamp: new Date()
            }].slice(-50) // Keep last 50 contexts
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ Error updating keyword stats:', error);
    }
  }

  /**
   * Extract keywords from search data for statistics
   */
  extractKeywords(searchData) {
    const keywords = [];
    
    // Extract individual words
    const words = searchData.query.split(/\s+/).filter(w => w.length >= 2);
    
    for (const word of words) {
      keywords.push({
        id: `word_${word}`,
        keyword: word,
        type: 'word'
      });
    }
    
    // Extract parsed components
    if (searchData.parsedLocation) {
      keywords.push({
        id: `location_${searchData.parsedLocation}`,
        keyword: searchData.parsedLocation,
        type: 'location'
      });
    }
    
    if (searchData.parsedFood) {
      keywords.push({
        id: `food_${searchData.parsedFood}`,
        keyword: searchData.parsedFood,
        type: 'food'
      });
    }
    
    if (searchData.parsedCuisine) {
      keywords.push({
        id: `cuisine_${searchData.parsedFood}`,
        keyword: searchData.parsedCuisine,
        type: 'cuisine'
      });
    }
    
    return keywords;
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(limitCount = 20, days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const q = query(
        collection(db, this.collectionName),
        where('timestamp', '>=', cutoffDate),
        orderBy('timestamp', 'desc'),
        limit(1000) // Get more to aggregate
      );
      
      const snapshot = await getDocs(q);
      const searchCounts = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const query = data.query;
        searchCounts[query] = (searchCounts[query] || 0) + 1;
      });
      
      // Sort by count and return top results
      return Object.entries(searchCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limitCount)
        .map(([query, count]) => ({ query, count }));
    } catch (error) {
      console.error('❌ Error getting popular searches:', error);
      return [];
    }
  }

  /**
   * Get unrecognized keywords (potential new food items/locations)
   */
  async getUnrecognizedKeywords(limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('parsedLocation', '==', null),
        where('parsedFood', '==', null),
        where('parsedCuisine', '==', null),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );
      
      const snapshot = await getDocs(q);
      const keywordCounts = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const words = data.query.split(/\s+/).filter(w => w.length >= 3);
        words.forEach(word => {
          keywordCounts[word] = (keywordCounts[word] || 0) + 1;
        });
      });
      
      // Return keywords that appear frequently but aren't recognized
      return Object.entries(keywordCounts)
        .filter(([word, count]) => count >= 3) // Appeared at least 3 times
        .sort((a, b) => b[1] - a[1])
        .slice(0, limitCount)
        .map(([keyword, count]) => ({ keyword, count }));
    } catch (error) {
      console.error('❌ Error getting unrecognized keywords:', error);
      return [];
    }
  }

  /**
   * Get search patterns (compound queries)
   */
  async getSearchPatterns(limitCount = 20) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isCompound', '==', true),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );
      
      const snapshot = await getDocs(q);
      const patterns = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const pattern = `${data.parsedFood || data.parsedCuisine || data.parsedMealType} + ${data.parsedLocation}`;
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      });
      
      return Object.entries(patterns)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limitCount)
        .map(([pattern, count]) => ({ pattern, count }));
    } catch (error) {
      console.error('❌ Error getting search patterns:', error);
      return [];
    }
  }

  /**
   * Get zero-result searches (queries that returned no results)
   */
  async getZeroResultSearches(limitCount = 50) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('resultCount', '==', 0),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting zero-result searches:', error);
      return [];
    }
  }

  /**
   * Get search analytics summary
   */
  async getAnalyticsSummary(days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const q = query(
        collection(db, this.collectionName),
        where('timestamp', '>=', cutoffDate)
      );
      
      const snapshot = await getDocs(q);
      const stats = {
        totalSearches: snapshot.size,
        compoundQueries: 0,
        locationQueries: 0,
        foodQueries: 0,
        zeroResultSearches: 0,
        averageResults: 0,
        totalResults: 0
      };
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.isCompound) stats.compoundQueries++;
        if (data.hasLocation) stats.locationQueries++;
        if (data.hasFood) stats.foodQueries++;
        if (data.resultCount === 0) stats.zeroResultSearches++;
        stats.totalResults += data.resultCount;
      });
      
      stats.averageResults = stats.totalSearches > 0 
        ? Math.round(stats.totalResults / stats.totalSearches) 
        : 0;
      
      return stats;
    } catch (error) {
      console.error('❌ Error getting analytics summary:', error);
      return null;
    }
  }

  /**
   * Sync local searches to Firestore (for offline support)
   */
  async syncLocalSearches() {
    try {
      const stored = JSON.parse(localStorage.getItem(this.localStorageKey) || '[]');
      if (stored.length === 0) return;
      
      // Check which searches are already synced
      const syncedKey = 'syncedSearches';
      const synced = JSON.parse(localStorage.getItem(syncedKey) || '[]');
      
      const toSync = stored.filter((search, index) => {
        const key = `${search.query}_${search.timestamp}`;
        return !synced.includes(key);
      });
      
      if (toSync.length === 0) return;
      
      // Sync to Firestore
      for (const search of toSync) {
        await addDoc(collection(db, this.collectionName), {
          ...search,
          timestamp: search.timestamp ? new Date(search.timestamp) : new Date()
        });
        
        const key = `${search.query}_${search.timestamp}`;
        synced.push(key);
      }
      
      // Update synced list
      localStorage.setItem(syncedKey, JSON.stringify(synced.slice(-100)));
      console.log(`📊 Synced ${toSync.length} local searches to Firestore`);
    } catch (error) {
      console.error('❌ Error syncing local searches:', error);
    }
  }
}

export const searchAnalyticsService = new SearchAnalyticsService();
export default searchAnalyticsService;

