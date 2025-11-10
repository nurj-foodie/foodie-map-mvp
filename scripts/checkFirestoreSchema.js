// Script to check actual Firestore schema
// Run: node scripts/checkFirestoreSchema.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkSchema() {
  try {
    console.log('🔍 Checking Firestore schema...\n');
    
    // Get a sample of eateries
    const eateriesRef = collection(db, 'eateries');
    const q = query(eateriesRef, limit(10));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ No eateries found in database');
      return;
    }
    
    console.log(`📊 Found ${snapshot.size} sample eateries\n`);
    
    // Analyze schema
    const schemas = {
      placeId: 0,      // placeId (camelCase)
      place_id: 0,    // place_id (snake_case)
      structured: 0,  // Has nested maps (analytics, business, etc.)
      flat: 0,        // Flat structure
      userRatingTotal: 0,
      userRatingCount: 0,
      hasAnalytics: 0,
      hasBusiness: 0,
      hasContact: 0,
      hasMetadata: 0,
      hasCuisineCategory: 0,
      hasHalalStatus: 0
    };
    
    const sampleDocs = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      sampleDocs.push({ id: doc.id, ...data });
      
      // Check field names
      if (data.placeId) schemas.placeId++;
      if (data.place_id) schemas.place_id++;
      if (data.userRatingTotal) schemas.userRatingTotal++;
      if (data.userRatingCount) schemas.userRatingCount++;
      
      // Check nested maps
      if (data.analytics) schemas.hasAnalytics++;
      if (data.business) schemas.hasBusiness++;
      if (data.contact) schemas.hasContact++;
      if (data.metadata) schemas.hasMetadata++;
      
      // Check other fields
      if (data.cuisineCategory) schemas.hasCuisineCategory++;
      if (data.halalStatus) schemas.hasHalalStatus++;
      
      // Determine structure type
      if (data.analytics || data.business || data.contact || data.metadata) {
        schemas.structured++;
      } else {
        schemas.flat++;
      }
    });
    
    // Print analysis
    console.log('📋 SCHEMA ANALYSIS:\n');
    console.log('Field Names:');
    console.log(`  placeId (camelCase): ${schemas.placeId}/${snapshot.size}`);
    console.log(`  place_id (snake_case): ${schemas.place_id}/${snapshot.size}`);
    console.log(`  userRatingTotal: ${schemas.userRatingTotal}/${snapshot.size}`);
    console.log(`  userRatingCount: ${schemas.userRatingCount}/${snapshot.size}`);
    console.log('\nNested Maps:');
    console.log(`  analytics: ${schemas.hasAnalytics}/${snapshot.size}`);
    console.log(`  business: ${schemas.hasBusiness}/${snapshot.size}`);
    console.log(`  contact: ${schemas.hasContact}/${snapshot.size}`);
    console.log(`  metadata: ${schemas.hasMetadata}/${snapshot.size}`);
    console.log('\nOther Fields:');
    console.log(`  cuisineCategory: ${schemas.hasCuisineCategory}/${snapshot.size}`);
    console.log(`  halalStatus: ${schemas.hasHalalStatus}/${snapshot.size}`);
    console.log('\nStructure Type:');
    console.log(`  Structured (nested maps): ${schemas.structured}/${snapshot.size}`);
    console.log(`  Flat (top-level only): ${schemas.flat}/${snapshot.size}`);
    
    // Show sample document structure
    if (sampleDocs.length > 0) {
      console.log('\n📄 SAMPLE DOCUMENT STRUCTURE:\n');
      const sample = sampleDocs[0];
      console.log('Top-level fields:');
      Object.keys(sample).filter(k => k !== 'id').forEach(key => {
        const value = sample[key];
        if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
          console.log(`  ${key}: {object with ${Object.keys(value).length} keys}`);
        } else {
          console.log(`  ${key}: ${typeof value}`);
        }
      });
      
      // Show nested structure if exists
      if (sample.analytics || sample.business || sample.contact || sample.metadata) {
        console.log('\nNested maps:');
        if (sample.analytics) {
          console.log('  analytics:', Object.keys(sample.analytics));
        }
        if (sample.business) {
          console.log('  business:', Object.keys(sample.business));
        }
        if (sample.contact) {
          console.log('  contact:', Object.keys(sample.contact));
        }
        if (sample.metadata) {
          console.log('  metadata:', Object.keys(sample.metadata));
        }
      }
    }
    
    // Get total count
    console.log('\n🔢 Getting total count...');
    const countQuery = query(eateriesRef);
    const countSnapshot = await getDocs(countQuery);
    console.log(`✅ Total eateries in database: ${countSnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  }
}

checkSchema().then(() => {
  console.log('\n✅ Schema check complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

