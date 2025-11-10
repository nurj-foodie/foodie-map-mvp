/**
 * Keyword Learning Service (The "Brain")
 * Automatically learns new keywords from user search behavior
 * Grows keyword database without manual intervention
 * Privacy-focused: Only learns from aggregate patterns, no personal data
 */

import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc, setDoc, limit } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { searchAnalyticsService } from './searchAnalyticsService';
import { searchKeywordService } from './searchKeywordService';

class KeywordLearningService {
  constructor() {
    this.keywordsCollection = 'learned_keywords';
    this.learningThreshold = {
      minSearches: 10,        // Keyword must appear 10+ times
      minDays: 3,             // Over at least 3 days
      confidence: 0.7,        // 70% confidence for auto-categorization
      resultRate: 0.3         // At least 30% of searches return results
    };
    
    this.autoLearnEnabled = true;
    this.lastLearningRun = null;
    this.learningInterval = 24 * 60 * 60 * 1000; // Run once per day
  }

  /**
   * Main learning function - analyzes analytics and learns new keywords
   * Runs automatically or can be triggered manually
   */
  async learnFromUserBehavior(days = 7) {
    if (!this.autoLearnEnabled) {
      console.log('🧠 Auto-learning is disabled');
      return { learned: 0, skipped: 0 };
    }

    console.log('🧠 Starting automatic keyword learning...');
    
    try {
      // Get unrecognized keywords from analytics
      const unrecognized = await this.getUnrecognizedKeywords(days);
      console.log(`📊 Found ${unrecognized.length} potential new keywords`);

      const learned = [];
      const skipped = [];

      for (const keywordData of unrecognized) {
        // Analyze keyword to determine category
        const category = await this.categorizeKeyword(keywordData);
        
        if (category && this.meetsLearningThreshold(keywordData, category)) {
          // Learn this keyword
          const learnedKeyword = await this.learnKeyword(keywordData.keyword, category, keywordData);
          if (learnedKeyword) {
            learned.push(learnedKeyword);
            console.log(`✅ Learned new ${category}: "${keywordData.keyword}" (${keywordData.count} searches)`);
          } else {
            skipped.push({ keyword: keywordData.keyword, reason: 'Already exists' });
          }
        } else {
          skipped.push({ 
            keyword: keywordData.keyword, 
            reason: category ? 'Below threshold' : 'Cannot categorize' 
          });
        }
      }

      // Update in-memory keyword database
      await this.syncToMemory();

      console.log(`🧠 Learning complete: ${learned.length} learned, ${skipped.length} skipped`);
      
      return {
        learned: learned.length,
        skipped: skipped.length,
        details: {
          learned,
          skipped
        }
      };
    } catch (error) {
      console.error('❌ Error in keyword learning:', error);
      return { learned: 0, skipped: 0, error: error.message };
    }
  }

  /**
   * Get unrecognized keywords from analytics
   * Keywords that appear frequently but aren't in our database
   */
  async getUnrecognizedKeywords(days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const q = query(
        collection(db, 'search_analytics'),
        where('timestamp', '>=', cutoffDate)
      );

      const snapshot = await getDocs(q);
      const keywordStats = {};
      const keywordContexts = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Only analyze queries where nothing was parsed (unrecognized)
        if (!data.parsedLocation && !data.parsedFood && !data.parsedCuisine) {
          const words = data.query.toLowerCase().trim().split(/\s+/)
            .filter(w => w.length >= 3 && !this.isCommonWord(w));
          
          words.forEach(word => {
            if (!keywordStats[word]) {
              keywordStats[word] = {
                keyword: word,
                count: 0,
                resultCount: 0,
                searches: [],
                firstSeen: data.timestamp,
                lastSeen: data.timestamp
              };
              keywordContexts[word] = [];
            }
            
            keywordStats[word].count++;
            keywordStats[word].resultCount += data.resultCount || 0;
            keywordStats[word].lastSeen = data.timestamp > keywordStats[word].lastSeen 
              ? data.timestamp 
              : keywordStats[word].lastSeen;
            keywordStats[word].searches.push({
              query: data.query,
              resultCount: data.resultCount || 0,
              timestamp: data.timestamp
            });
            keywordContexts[word].push(data.query);
          });
        }
      });

      // Filter by threshold and return
      return Object.values(keywordStats)
        .filter(k => k.count >= this.learningThreshold.minSearches)
        .map(k => ({
          ...k,
          avgResults: k.resultCount / k.count,
          resultRate: k.searches.filter(s => s.resultCount > 0).length / k.searches.length,
          contexts: keywordContexts[k.keyword]
        }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('❌ Error getting unrecognized keywords:', error);
      return [];
    }
  }

  /**
   * Categorize a keyword (food, location, cuisine, meal type)
   * Uses heuristics and context analysis
   */
  async categorizeKeyword(keywordData) {
    const keyword = keywordData.keyword.toLowerCase();
    const contexts = keywordData.contexts || [];

    // Check if already learned
    const existing = await this.getLearnedKeyword(keyword);
    if (existing) {
      return existing.category;
    }

    // Heuristic 1: Check if it's in existing categories (might be a variant)
    if (this.isLocationVariant(keyword)) return 'location';
    if (this.isFoodVariant(keyword)) return 'food';
    if (this.isCuisineVariant(keyword)) return 'cuisine';

    // Heuristic 2: Analyze context patterns
    const contextCategory = this.analyzeContext(contexts, keyword);
    if (contextCategory) return contextCategory;

    // Heuristic 3: Check result patterns
    // Locations usually return many results, food items return fewer
    if (keywordData.avgResults > 15 && keywordData.resultRate > 0.5) {
      return 'location';
    }

    // Heuristic 4: Word patterns
    if (this.looksLikeLocation(keyword)) return 'location';
    if (this.looksLikeFood(keyword)) return 'food';
    if (this.looksLikeCuisine(keyword)) return 'cuisine';

    // Default: unknown (won't be learned)
    return null;
  }

  /**
   * Check if keyword meets learning threshold
   */
  meetsLearningThreshold(keywordData, category) {
    // Minimum searches
    if (keywordData.count < this.learningThreshold.minSearches) {
      return false;
    }

    // Minimum days (check date range)
    const daysDiff = (new Date(keywordData.lastSeen) - new Date(keywordData.firstSeen)) / (1000 * 60 * 60 * 24);
    if (daysDiff < this.learningThreshold.minDays) {
      return false;
    }

    // Result rate (should return results sometimes)
    if (keywordData.resultRate < this.learningThreshold.resultRate) {
      return false;
    }

    return true;
  }

  /**
   * Learn a new keyword and save to Firestore
   */
  async learnKeyword(keyword, category, keywordData) {
    try {
      // Check if already exists
      const existing = await this.getLearnedKeyword(keyword);
      if (existing) {
        // Update stats
        await updateDoc(doc(db, this.keywordsCollection, existing.id), {
          searchCount: existing.searchCount + keywordData.count,
          lastSeen: new Date(),
          contexts: [...(existing.contexts || []), ...keywordData.contexts].slice(-100)
        });
        return null; // Already learned
      }

      // Create new learned keyword
      const learnedKeyword = {
        keyword: keyword.toLowerCase(),
        category: category,
        searchCount: keywordData.count,
        avgResults: keywordData.avgResults,
        resultRate: keywordData.resultRate,
        firstSeen: keywordData.firstSeen,
        lastSeen: keywordData.lastSeen,
        contexts: keywordData.contexts.slice(0, 50), // Keep top 50 contexts
        learnedAt: new Date(),
        confidence: this.calculateConfidence(keywordData, category),
        active: true
      };

      const docRef = await addDoc(collection(db, this.keywordsCollection), learnedKeyword);
      
      return {
        id: docRef.id,
        ...learnedKeyword
      };
    } catch (error) {
      console.error(`❌ Error learning keyword "${keyword}":`, error);
      return null;
    }
  }

  /**
   * Calculate confidence score for learned keyword
   */
  calculateConfidence(keywordData, category) {
    let confidence = 0.5; // Base confidence

    // More searches = higher confidence
    if (keywordData.count >= 20) confidence += 0.2;
    else if (keywordData.count >= 10) confidence += 0.1;

    // Better result rate = higher confidence
    if (keywordData.resultRate >= 0.5) confidence += 0.15;
    else if (keywordData.resultRate >= 0.3) confidence += 0.1;

    // Category-specific confidence
    if (category === 'location' && keywordData.avgResults > 15) confidence += 0.1;
    if (category === 'food' && keywordData.avgResults > 0 && keywordData.avgResults < 20) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Learn location coordinates from geocoding results
   * Called when a location is successfully geocoded
   * @param {string} locationName - Location name (e.g., "kluang")
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  async learnLocationCoordinates(locationName, lat, lng) {
    if (!locationName || !lat || !lng) {
      return null;
    }

    try {
      const keyword = locationName.toLowerCase().trim();
      
      // Prevent learning food prefixes as locations (e.g., "nasi", "mee", "roti")
      const foodPrefixes = [
        'nasi', 'mee', 'roti', 'sup', 'ayam', 'ikan', 'bubur', 'laksa',
        'char', 'curry', 'teh', 'kopi', 'milo', 'horlicks', 'biryani',
        'tandoori', 'dim', 'sushi', 'ramen', 'tom', 'pad', 'pho', 'banh',
        'wonton', 'hokkien', 'bak', 'chicken', 'udang', 'ketam', 'sotong'
      ];
      
      // Skip if it's a food prefix (unless it's a full location name like "Nasi Lemak Street")
      if (keyword.length <= 6 && foodPrefixes.some(prefix => keyword.startsWith(prefix))) {
        console.log(`⚠️ Skipping learning "${keyword}" as location (food prefix detected)`);
        return null;
      }
      
      // Check if already exists
      const existing = await this.getLearnedKeyword(keyword);
      
      if (existing) {
        // Update coordinates if not set or different
        if (!existing.coordinates || 
            existing.coordinates.lat !== lat || 
            existing.coordinates.lng !== lng) {
          await updateDoc(doc(db, this.keywordsCollection, existing.id), {
            coordinates: { lat, lng },
            lastSeen: new Date()
          });
          console.log(`📍 Updated coordinates for learned location: "${keyword}" → (${lat}, ${lng})`);
        }
        return existing;
      }

      // Create new learned location with coordinates
      const learnedLocation = {
        keyword: keyword,
        category: 'location',
        coordinates: { lat, lng },
        searchCount: 1,
        avgResults: 0,
        resultRate: 0,
        firstSeen: new Date(),
        lastSeen: new Date(),
        contexts: [],
        learnedAt: new Date(),
        confidence: 0.8, // High confidence for geocoded locations
        active: true,
        source: 'geocoding' // Track that this came from geocoding
      };

      const docRef = await addDoc(collection(db, this.keywordsCollection), learnedLocation);
      console.log(`📍 Learned new location with coordinates: "${keyword}" → (${lat}, ${lng})`);
      
      // Sync to memory immediately
      await this.syncToMemory();
      
      return {
        id: docRef.id,
        ...learnedLocation
      };
    } catch (error) {
      console.error(`❌ Error learning location coordinates for "${locationName}":`, error);
      return null;
    }
  }

  /**
   * Get learned location coordinates
   * @param {string} locationName - Location name
   * @returns {Promise<Object|null>} - Coordinates {lat, lng} or null
   */
  async getLearnedLocationCoordinates(locationName) {
    try {
      const keyword = locationName.toLowerCase().trim();
      const learned = await this.getLearnedKeyword(keyword);
      
      if (learned && learned.category === 'location' && learned.coordinates) {
        return {
          lat: learned.coordinates.lat,
          lng: learned.coordinates.lng
        };
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error getting learned coordinates for "${locationName}":`, error);
      return null;
    }
  }

  /**
   * Sync learned keywords from Firestore to in-memory database
   */
  async syncToMemory() {
    try {
      const snapshot = await getDocs(collection(db, this.keywordsCollection));
      const learned = {
        locations: [],
        foodItems: [],
        cuisines: [],
        mealTypes: []
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.active) return; // Skip inactive keywords

        const keyword = data.keyword;
        
        switch (data.category) {
          case 'location':
            if (!searchKeywordService.keywordCategories.locations.includes(keyword)) {
              searchKeywordService.keywordCategories.locations.push(keyword);
              learned.locations.push(keyword);
            }
            break;
          case 'food':
            if (!searchKeywordService.keywordCategories.foodItems.includes(keyword)) {
              searchKeywordService.keywordCategories.foodItems.push(keyword);
              learned.foodItems.push(keyword);
            }
            break;
          case 'cuisine':
            if (!searchKeywordService.keywordCategories.cuisines.includes(keyword)) {
              searchKeywordService.keywordCategories.cuisines.push(keyword);
              learned.cuisines.push(keyword);
            }
            break;
          case 'mealType':
            if (!searchKeywordService.keywordCategories.mealTypes.includes(keyword)) {
              searchKeywordService.keywordCategories.mealTypes.push(keyword);
              learned.mealTypes.push(keyword);
            }
            break;
        }
      });

      console.log(`🔄 Synced learned keywords: ${learned.locations.length} locations, ${learned.foodItems.length} food items, ${learned.cuisines.length} cuisines`);
      
      return learned;
    } catch (error) {
      // Permission errors are expected if collection doesn't exist or user doesn't have access
      // This is non-critical - the system will work without syncing learned keywords
      if (error.code === 'permission-denied') {
        console.log('ℹ️ Learned keywords collection not accessible (permission-denied) - this is OK, system will work without auto-learned keywords');
        return { locations: [], foodItems: [], cuisines: [], mealTypes: [] };
      }
      console.warn('⚠️ Error syncing learned keywords (non-critical):', error.message);
      return { locations: [], foodItems: [], cuisines: [], mealTypes: [] };
    }
  }

  /**
   * Get learned keyword from Firestore
   */
  async getLearnedKeyword(keyword) {
    try {
      const q = query(
        collection(db, this.keywordsCollection),
        where('keyword', '==', keyword.toLowerCase()),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
    } catch (error) {
      console.error('❌ Error getting learned keyword:', error);
      return null;
    }
  }

  /**
   * Heuristic: Check if keyword is a location variant
   */
  isLocationVariant(keyword) {
    const locationKeywords = ['jaya', 'bahru', 'baru', 'baru', 'setar', 'kinabalu'];
    return locationKeywords.some(k => keyword.includes(k) || keyword.endsWith(k));
  }

  /**
   * Heuristic: Check if keyword is a food variant
   */
  isFoodVariant(keyword) {
    const foodKeywords = ['nasi', 'mee', 'sup', 'roti', 'ayam', 'ikan', 'bubur', 'laksa'];
    return foodKeywords.some(k => keyword.includes(k));
  }

  /**
   * Heuristic: Check if keyword is a cuisine variant
   */
  isCuisineVariant(keyword) {
    const cuisineKeywords = ['halal', 'chinese', 'malay', 'indian', 'western'];
    return cuisineKeywords.some(k => keyword.includes(k));
  }

  /**
   * Analyze context to determine category
   */
  analyzeContext(contexts, keyword) {
    // Check if keyword appears with known locations
    const locationContexts = contexts.filter(ctx => {
      return searchKeywordService.keywordCategories.locations.some(loc => 
        ctx.toLowerCase().includes(loc) && !ctx.toLowerCase().includes(keyword + ' ' + loc)
      );
    });
    if (locationContexts.length > contexts.length * 0.3) {
      return 'food'; // If appears with locations, likely food
    }

    // Check if keyword appears with known food items
    const foodContexts = contexts.filter(ctx => {
      return searchKeywordService.keywordCategories.foodItems.some(food => 
        ctx.toLowerCase().includes(food)
      );
    });
    if (foodContexts.length > contexts.length * 0.3) {
      return 'location'; // If appears with food, likely location
    }

    return null;
  }

  /**
   * Heuristic: Check if keyword looks like a location
   */
  looksLikeLocation(keyword) {
    // Common location patterns
    const locationPatterns = [
      /^(kuala|petaling|shah|subang|cheras|ampang|kepong)/i,
      /(jaya|bahru|baru|setar|kinabalu)$/i,
      /^(penang|johor|selangor|kedah|perak|pahang)/i
    ];
    return locationPatterns.some(pattern => pattern.test(keyword));
  }

  /**
   * Heuristic: Check if keyword looks like food
   */
  looksLikeFood(keyword) {
    // Common food patterns
    const foodPatterns = [
      /^(nasi|mee|sup|roti|ayam|ikan|bubur|laksa|char|curry)/i,
      /(lemak|goreng|canai|bakar|tulang|kambing)$/i
    ];
    return foodPatterns.some(pattern => pattern.test(keyword));
  }

  /**
   * Heuristic: Check if keyword looks like cuisine
   */
  looksLikeCuisine(keyword) {
    const cuisinePatterns = [/halal/i, /chinese/i, /malay/i, /indian/i, /western/i];
    return cuisinePatterns.some(pattern => pattern.test(keyword));
  }

  /**
   * Check if word is a common word (should be ignored)
   */
  isCommonWord(word) {
    const commonWords = ['the', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'near', 'me', 'my', 'restaurant', 'food', 'place'];
    return commonWords.includes(word.toLowerCase());
  }

  /**
   * Initialize learning system
   * Call this on app startup
   */
  async initialize() {
    console.log('🧠 Initializing keyword learning system...');
    
    // Sync learned keywords to memory
    await this.syncToMemory();
    
    // Schedule automatic learning (once per day)
    this.scheduleAutoLearning();
    
    console.log('✅ Keyword learning system initialized');
  }

  /**
   * Schedule automatic learning
   */
  scheduleAutoLearning() {
    // Run learning once per day
    setInterval(async () => {
      console.log('🧠 Running scheduled keyword learning...');
      await this.learnFromUserBehavior(7); // Learn from last 7 days
      await this.syncToMemory(); // Sync to memory after learning
    }, this.learningInterval);
  }

  /**
   * Get learning statistics
   */
  async getLearningStats() {
    try {
      const snapshot = await getDocs(collection(db, this.keywordsCollection));
      const stats = {
        total: snapshot.size,
        byCategory: {
          location: 0,
          food: 0,
          cuisine: 0,
          mealType: 0
        },
        recentlyLearned: []
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.active) {
          stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;
          
          // Get recently learned (last 7 days)
          const learnedDate = data.learnedAt?.toDate();
          if (learnedDate && (Date.now() - learnedDate.getTime()) < 7 * 24 * 60 * 60 * 1000) {
            stats.recentlyLearned.push({
              keyword: data.keyword,
              category: data.category,
              confidence: data.confidence,
              searchCount: data.searchCount
            });
          }
        }
      });

      return stats;
    } catch (error) {
      console.error('❌ Error getting learning stats:', error);
      return null;
    }
  }
}

export const keywordLearningService = new KeywordLearningService();
export default keywordLearningService;

