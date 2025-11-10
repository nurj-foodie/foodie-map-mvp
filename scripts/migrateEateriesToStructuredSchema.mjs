// Migration script to convert existing eateries to structured schema
// Run: node scripts/migrateEateriesToStructuredSchema.mjs
// 
// This script will:
// 1. Find all eateries with flat schema (missing nested maps)
// 2. Restructure them to match the structured schema
// 3. Update field names (place_id -> placeId, userRatingCount -> userRatingTotal)
// 4. Extract cuisine info, halal status, business features
// 5. Create nested maps (analytics, business, contact, socialMedia, metadata)

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, updateDoc, doc, writeBatch, limit } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Firebase config
let firebaseConfig = {};
try {
  const envPath = join(__dirname, '../.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
  
  firebaseConfig = {
    apiKey: envVars.REACT_APP_FIREBASE_API_KEY || '',
    authDomain: envVars.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
    projectId: envVars.REACT_APP_FIREBASE_PROJECT_ID || 'foodie-map-23842',
    storageBucket: envVars.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: envVars.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: envVars.REACT_APP_FIREBASE_APP_ID || ''
  };
} catch (error) {
  console.log('⚠️ Could not read .env file, using defaults');
  firebaseConfig = { projectId: 'foodie-map-23842' };
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper functions (same as in firestoreSearchService.js)
function extractCuisineInfo(types, name) {
  if (!Array.isArray(types)) types = [];
  const typesLower = types.map(t => String(t).toLowerCase());
  const nameLower = (name || '').toLowerCase();
  
  const cuisineMap = {
    'cafe': 'Cafe',
    'coffee_shop': 'Cafe',
    'bakery': 'Bakery',
    'fast_food': 'Fast Food',
    'meal_takeaway': 'Fast Food',
    'restaurant': 'Western',
    'food': 'Western'
  };
  
  const malaysianKeywords = ['nasi lemak', 'char kway teow', 'roti canai', 'satay', 'rendang', 'laksa', 'mee goreng'];
  const isMalaysian = malaysianKeywords.some(keyword => nameLower.includes(keyword));
  
  let cuisineCategory = 'Western';
  let cuisineType = 'Western';
  
  for (const [type, cuisine] of Object.entries(cuisineMap)) {
    if (typesLower.includes(type)) {
      cuisineCategory = cuisine;
      cuisineType = cuisine;
      break;
    }
  }
  
  if (isMalaysian) {
    cuisineCategory = 'Malay';
    cuisineType = 'Malay';
  }
  
  const cuisineTags = [];
  if (typesLower.includes('halal') || nameLower.includes('halal')) {
    cuisineTags.push('halal');
  }
  if (typesLower.includes('vegetarian') || nameLower.includes('vegetarian')) {
    cuisineTags.push('vegetarian');
  }
  if (typesLower.includes('vegan') || nameLower.includes('vegan')) {
    cuisineTags.push('vegan');
  }
  
  if (cuisineType && !cuisineTags.includes(cuisineType.toLowerCase())) {
    cuisineTags.push(cuisineType.toLowerCase());
  }
  
  return { cuisineCategory, cuisineType, cuisineTags };
}

function extractHalalStatus(types, name) {
  if (!Array.isArray(types)) types = [];
  const typesLower = types.map(t => String(t).toLowerCase());
  const nameLower = (name || '').toLowerCase();
  
  if (typesLower.includes('halal') || nameLower.includes('halal')) return 'halal';
  if (nameLower.includes('pork-free') || nameLower.includes('pork free')) return 'pork-free';
  if (nameLower.includes('non-halal') || nameLower.includes('non halal')) return 'non-halal';
  
  return 'unknown';
}

function extractBusinessFeatures(types) {
  if (!Array.isArray(types)) types = [];
  const typesLower = types.map(t => String(t).toLowerCase());
  
  return {
    acceptsReservations: typesLower.includes('restaurant'),
    deliveryAvailable: typesLower.includes('meal_delivery'),
    dineInAvailable: typesLower.includes('restaurant'),
    takeoutAvailable: typesLower.includes('meal_takeaway'),
    wheelchairAccessible: false
  };
}

function calculateQualityScore(data) {
  let score = 0;
  if (data.name) score += 10;
  if (data.address) score += 10;
  if (data.location?.lat && data.location?.lng) score += 10;
  if (data.rating) score += 10;
  if (data.phone) score += 10;
  if (data.website) score += 10;
  if (data.operatingHours?.periods?.length > 0) score += 10;
  if (data.operatingHours?.weekdayText?.length > 0) score += 10;
  if (data.photos?.length > 0) score += 10;
  if (data.userRatingTotal > 0 || data.userRatingCount > 0) score += 10;
  return Math.min(score, 100);
}

function needsMigration(data) {
  // Check if already has structured schema
  if (data.analytics && data.business && data.contact && data.metadata) {
    return false; // Already structured
  }
  return true; // Needs migration
}

async function migrateEateries(testMode = false, testLimit = 10) {
  try {
    if (testMode) {
      console.log('🧪 TEST MODE: Migrating only', testLimit, 'documents for testing\n');
    }
    console.log('🚀 Starting migration to structured schema...\n');
    
    const eateriesRef = collection(db, 'eateries');
    const queryRef = testMode 
      ? query(eateriesRef, limit(testLimit))
      : query(eateriesRef);
    const allSnapshot = await getDocs(queryRef);
    
    console.log(`📊 Total eateries: ${allSnapshot.size}`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    const batchSize = 500; // Firestore batch limit
    let batch = writeBatch(db);
    let batchCount = 0;
    
    console.log('\n🔄 Processing eateries...\n');
    
    for (const docSnapshot of allSnapshot.docs) {
      const data = docSnapshot.data();
      
      // Skip if already structured
      if (!needsMigration(data)) {
        skipped++;
        continue;
      }
      
      try {
        // Get placeId (support both place_id and placeId)
        const placeId = data.placeId || data.place_id;
        if (!placeId) {
          console.warn(`⚠️ Skipping ${docSnapshot.id}: No placeId`);
          skipped++;
          continue;
        }
        
        // Extract info
        const cuisineInfo = extractCuisineInfo(data.types || [], data.name);
        const halalStatus = data.halalStatus || extractHalalStatus(data.types || [], data.name);
        const businessFeatures = extractBusinessFeatures(data.types || []);
        const qualityScore = calculateQualityScore(data);
        
        // Get existing values or defaults
        const userRatingTotal = data.userRatingTotal || data.userRatingCount || 0;
        const phone = data.phone || '';
        const website = data.website || '';
        const priceLevel = data.priceLevel || null;
        const businessStatus = data.businessStatus || 'OPERATIONAL';
        
        // Build update object (only add what's missing)
        const updates = {};
        
        // Field name updates
        if (data.place_id && !data.placeId) {
          updates.placeId = placeId;
        }
        if (data.userRatingCount && !data.userRatingTotal) {
          updates.userRatingTotal = userRatingTotal;
        }
        
        // Add nested maps if missing
        if (!data.analytics) {
          updates.analytics = {
            lastViewed: data.analytics?.lastViewed || null,
            popularityScore: data.analytics?.popularityScore || 0,
            totalCheckIns: data.analytics?.totalCheckIns || data.totalCheckIns || 0,
            totalClicks: data.analytics?.totalClicks || data.totalClicks || 0,
            totalFavorites: data.analytics?.totalFavorites || 0,
            totalViews: data.analytics?.totalViews || data.totalViews || 0
          };
        }
        
        if (!data.business) {
          updates.business = {
            acceptsReservations: businessFeatures.acceptsReservations,
            deliveryAvailable: businessFeatures.deliveryAvailable,
            dineInAvailable: businessFeatures.dineInAvailable,
            priceLevel: priceLevel,
            priceRange: priceLevel ? '$'.repeat(priceLevel) : '$',
            takeoutAvailable: businessFeatures.takeoutAvailable,
            wheelchairAccessible: businessFeatures.wheelchairAccessible,
            businessStatus: businessStatus
          };
        }
        
        if (!data.contact) {
          updates.contact = {
            email: data.contact?.email || '',
            internationalPhone: data.contact?.internationalPhone || '',
            phone: phone,
            socialMedia: data.contact?.socialMedia || {}
          };
        }
        
        if (!data.socialMedia) {
          updates.socialMedia = {
            website: website
          };
        }
        
        if (!data.metadata) {
          updates.metadata = {
            dataSource: data.metadata?.dataSource || data.source || 'google_places',
            discoveredAt: data.metadata?.discoveredAt || data.discoveredAt || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            lastUpdated: new Date(),
            qualityScore: qualityScore,
            version: 2
          };
        }
        
        // Add cuisine fields if missing
        if (!data.cuisineCategory) {
          updates.cuisineCategory = cuisineInfo.cuisineCategory;
        }
        if (!data.cuisineType) {
          updates.cuisineType = cuisineInfo.cuisineType;
        }
        if (!data.cuisineTags || data.cuisineTags.length === 0) {
          updates.cuisineTags = cuisineInfo.cuisineTags;
        }
        
        // Add halalStatus if missing
        if (!data.halalStatus || data.halalStatus === 'unknown') {
          updates.halalStatus = halalStatus;
        }
        
        // Ensure isActive exists
        if (data.isActive === undefined) {
          updates.isActive = true;
        }
        
        // Update lastUpdated
        updates.lastUpdated = new Date();
        
        // Add to batch
        const docRef = doc(db, 'eateries', docSnapshot.id);
        batch.update(docRef, updates);
        batchCount++;
        migrated++;
        
        // Commit batch if full
        if (batchCount >= batchSize) {
          await batch.commit();
          console.log(`✅ Migrated batch: ${migrated} total migrated`);
          batch = writeBatch(db);
          batchCount = 0;
        }
        
      } catch (error) {
        console.error(`❌ Error migrating ${docSnapshot.id}:`, error.message);
        errors++;
      }
    }
    
    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Migrated final batch: ${migrated} total migrated`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 MIGRATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⏭️  Skipped (already structured): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${migrated + skipped + errors}`);
    
  } catch (error) {
    console.error('❌ Fatal error during migration:', error);
    throw error;
  }
}

// Check for test mode flag
const testMode = process.argv.includes('--test') || process.argv.includes('-t');
const testLimit = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '10');

// Run migration
migrateEateries(testMode, testLimit)
  .then(() => {
    console.log('\n✅ Migration script complete');
    if (testMode) {
      console.log('\n💡 To run full migration, remove --test flag');
      console.log('   Example: node scripts/migrateEateriesToStructuredSchema.mjs');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

