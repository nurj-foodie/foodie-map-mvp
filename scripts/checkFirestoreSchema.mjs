// Script to check actual Firestore schema
// Run: node scripts/checkFirestoreSchema.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env file
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
  firebaseConfig = {
    projectId: 'foodie-map-23842'
  };
}

if (!firebaseConfig.apiKey && !firebaseConfig.projectId) {
  console.error('❌ Firebase config not found. Please set REACT_APP_FIREBASE_* environment variables.');
  console.log('💡 Or ensure .env file exists with Firebase config.');
  process.exit(1);
}

console.log('🔥 Initializing Firebase with project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkSchema() {
  try {
    console.log('🔍 Checking Firestore schema...\n');
    
    // Get a sample of eateries
    const eateriesRef = collection(db, 'eateries');
    const q = query(eateriesRef, limit(50)); // Increased sample size
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ No eateries found in database');
      return;
    }
    
    console.log(`📊 Analyzing ${snapshot.size} sample eateries...\n`);
    
    // Analyze schema
    const schemas = {
      placeId: 0,
      place_id: 0,
      structured: 0,
      flat: 0,
      userRatingTotal: 0,
      userRatingCount: 0,
      hasAnalytics: 0,
      hasBusiness: 0,
      hasContact: 0,
      hasMetadata: 0,
      hasCuisineCategory: 0,
      hasHalalStatus: 0,
      hasSocialMedia: 0
    };
    
    const sampleDocs = [];
    const fieldFrequency = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      sampleDocs.push({ id: doc.id, ...data });
      
      // Track all fields
      Object.keys(data).forEach(key => {
        fieldFrequency[key] = (fieldFrequency[key] || 0) + 1;
      });
      
      // Check field names
      if (data.placeId) schemas.placeId++;
      if (data.place_id) schemas.place_id++;
      if (data.userRatingTotal !== undefined) schemas.userRatingTotal++;
      if (data.userRatingCount !== undefined) schemas.userRatingCount++;
      
      // Check nested maps
      if (data.analytics && typeof data.analytics === 'object' && !Array.isArray(data.analytics)) {
        schemas.hasAnalytics++;
      }
      if (data.business && typeof data.business === 'object' && !Array.isArray(data.business)) {
        schemas.hasBusiness++;
      }
      if (data.contact && typeof data.contact === 'object' && !Array.isArray(data.contact)) {
        schemas.hasContact++;
      }
      if (data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)) {
        schemas.hasMetadata++;
      }
      if (data.socialMedia && typeof data.socialMedia === 'object' && !Array.isArray(data.socialMedia)) {
        schemas.hasSocialMedia++;
      }
      
      // Check other fields
      if (data.cuisineCategory) schemas.hasCuisineCategory++;
      if (data.halalStatus) schemas.hasHalalStatus++;
      
      // Determine structure type
      if (data.analytics || data.business || data.contact || data.metadata || data.socialMedia) {
        schemas.structured++;
      } else {
        schemas.flat++;
      }
    });
    
    // Print analysis
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 SCHEMA ANALYSIS RESULTS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('🔑 FIELD NAMES:');
    console.log(`  ✅ placeId (camelCase):     ${schemas.placeId}/${snapshot.size} (${Math.round(schemas.placeId/snapshot.size*100)}%)`);
    console.log(`  ✅ place_id (snake_case):   ${schemas.place_id}/${snapshot.size} (${Math.round(schemas.place_id/snapshot.size*100)}%)`);
    console.log(`  ✅ userRatingTotal:         ${schemas.userRatingTotal}/${snapshot.size} (${Math.round(schemas.userRatingTotal/snapshot.size*100)}%)`);
    console.log(`  ✅ userRatingCount:         ${schemas.userRatingCount}/${snapshot.size} (${Math.round(schemas.userRatingCount/snapshot.size*100)}%)`);
    
    console.log('\n📦 NESTED MAPS:');
    console.log(`  📊 analytics:    ${schemas.hasAnalytics}/${snapshot.size} (${Math.round(schemas.hasAnalytics/snapshot.size*100)}%)`);
    console.log(`  🏢 business:     ${schemas.hasBusiness}/${snapshot.size} (${Math.round(schemas.hasBusiness/snapshot.size*100)}%)`);
    console.log(`  📞 contact:      ${schemas.hasContact}/${snapshot.size} (${Math.round(schemas.hasContact/snapshot.size*100)}%)`);
    console.log(`  📝 metadata:      ${schemas.hasMetadata}/${snapshot.size} (${Math.round(schemas.hasMetadata/snapshot.size*100)}%)`);
    console.log(`  🌐 socialMedia:  ${schemas.hasSocialMedia}/${snapshot.size} (${Math.round(schemas.hasSocialMedia/snapshot.size*100)}%)`);
    
    console.log('\n🍽️ OTHER FIELDS:');
    console.log(`  🍽️ cuisineCategory: ${schemas.hasCuisineCategory}/${snapshot.size} (${Math.round(schemas.hasCuisineCategory/snapshot.size*100)}%)`);
    console.log(`  🕌 halalStatus:      ${schemas.hasHalalStatus}/${snapshot.size} (${Math.round(schemas.hasHalalStatus/snapshot.size*100)}%)`);
    
    console.log('\n📐 STRUCTURE TYPE:');
    console.log(`  📦 Structured (nested maps): ${schemas.structured}/${snapshot.size} (${Math.round(schemas.structured/snapshot.size*100)}%)`);
    console.log(`  📄 Flat (top-level only):   ${schemas.flat}/${snapshot.size} (${Math.round(schemas.flat/snapshot.size*100)}%)`);
    
    // Show most common fields
    console.log('\n📊 MOST COMMON FIELDS (Top 20):');
    const sortedFields = Object.entries(fieldFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    sortedFields.forEach(([field, count]) => {
      const percentage = Math.round(count / snapshot.size * 100);
      console.log(`  ${field}: ${count}/${snapshot.size} (${percentage}%)`);
    });
    
    // Show sample document structure
    if (sampleDocs.length > 0) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('📄 SAMPLE DOCUMENT STRUCTURES');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      // Find structured document
      const structuredDoc = sampleDocs.find(d => 
        (d.analytics || d.business || d.contact || d.metadata || d.socialMedia)
      );
      
      if (structuredDoc) {
        console.log('📦 STRUCTURED DOCUMENT (with nested maps):\n');
        console.log('Top-level fields:');
        Object.keys(structuredDoc).filter(k => k !== 'id').sort().forEach(key => {
          const value = structuredDoc[key];
          if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            const nestedKeys = Object.keys(value).length;
            console.log(`  ${key}: {object} (${nestedKeys} keys: ${Object.keys(value).join(', ')})`);
          } else if (Array.isArray(value)) {
            console.log(`  ${key}: [array] (${value.length} items)`);
          } else {
            const preview = String(value).substring(0, 50);
            console.log(`  ${key}: ${typeof value} = ${preview}${String(value).length > 50 ? '...' : ''}`);
          }
        });
      }
      
      // Find flat document
      const flatDoc = sampleDocs.find(d => 
        !d.analytics && !d.business && !d.contact && !d.metadata && !d.socialMedia
      );
      
      if (flatDoc) {
        console.log('\n📄 FLAT DOCUMENT (top-level only):\n');
        console.log('Top-level fields:');
        Object.keys(flatDoc).filter(k => k !== 'id').sort().forEach(key => {
          const value = flatDoc[key];
          if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
            console.log(`  ${key}: {object}`);
          } else if (Array.isArray(value)) {
            console.log(`  ${key}: [array] (${value.length} items)`);
          } else {
            const preview = String(value).substring(0, 50);
            console.log(`  ${key}: ${typeof value} = ${preview}${String(value).length > 50 ? '...' : ''}`);
          }
        });
      }
    }
    
    // Get total count
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔢 TOTAL COUNT');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('⏳ Getting total count (this may take a moment for large collections)...');
    try {
      const allSnapshot = await getDocs(query(eateriesRef));
      console.log(`✅ Total eateries in database: ${allSnapshot.size}`);
      
      // Calculate migration needs
      console.log('\n📋 MIGRATION ESTIMATES:');
      const needsMigration = allSnapshot.size - schemas.structured;
      const migrationPercentage = Math.round((needsMigration / allSnapshot.size) * 100);
      console.log(`  📦 Structured (no migration): ${schemas.structured} (${Math.round(schemas.structured/allSnapshot.size*100)}%)`);
      console.log(`  🔄 Needs migration:          ${needsMigration} (${migrationPercentage}%)`);
    } catch (error) {
      console.log('⚠️ Could not get total count (might be too large):', error.message);
      console.log('💡 Estimated: 1500+ based on your input');
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    console.error('Stack:', error.stack);
  }
}

checkSchema().then(() => {
  console.log('\n✅ Schema check complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
