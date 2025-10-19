// Quick Firestore Data Inspector
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY_HERE",
  authDomain: "foodie-map-23842.firebaseapp.com",
  projectId: "foodie-map-23842",
  storageBucket: "foodie-map-23842.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectFirestoreData() {
  try {
    console.log('🔍 Inspecting Firestore Data...\n');
    
    const collections = [
      'users',
      'eateries', 
      'saved_routes',
      'route_cache',
      'route_index',
      'reviews',
      'photos',
      'checkIns',
      'favorites',
      'analytics',
      'socialPosts',
      'postLikes',
      'postComments',
      'userFollows',
      'test'
    ];
    
    const results = {};
    
    for (const collectionName of collections) {
      try {
        console.log(`📋 Checking collection: ${collectionName}`);
        
        const q = query(collection(db, collectionName), limit(5));
        const snapshot = await getDocs(q);
        
        results[collectionName] = {
          count: snapshot.size,
          documents: []
        };
        
        if (snapshot.size > 0) {
          console.log(`✅ Found ${snapshot.size} documents`);
          
          snapshot.forEach((doc, index) => {
            const data = doc.data();
            const docInfo = {
              id: doc.id,
              fields: Object.keys(data),
              sampleData: {}
            };
            
            // Get sample data for key fields
            Object.keys(data).forEach(key => {
              const value = data[key];
              if (typeof value === 'string' && value.length > 50) {
                docInfo.sampleData[key] = value.substring(0, 50) + '...';
              } else if (Array.isArray(value)) {
                docInfo.sampleData[key] = `[Array with ${value.length} items]`;
              } else if (typeof value === 'object' && value !== null) {
                docInfo.sampleData[key] = `{Object with keys: ${Object.keys(value).join(', ')} }`;
              } else {
                docInfo.sampleData[key] = value;
              }
            });
            
            results[collectionName].documents.push(docInfo);
            
            if (index === 0) {
              console.log(`   📄 Sample document: ${doc.id}`);
              console.log(`   📊 Fields: ${Object.keys(data).join(', ')}`);
            }
          });
        } else {
          console.log(`❌ No documents found`);
        }
        
        console.log(''); // Empty line
        
      } catch (error) {
        console.log(`❌ Error accessing ${collectionName}:`, error.message);
        results[collectionName] = {
          count: 0,
          error: error.message
        };
        console.log('');
      }
    }
    
    // Summary
    console.log('📊 FIRESTORE DATA SUMMARY');
    console.log('========================');
    
    Object.entries(results).forEach(([collectionName, data]) => {
      if (data.count > 0) {
        console.log(`✅ ${collectionName}: ${data.count} documents`);
        
        // Show key fields from first document
        if (data.documents.length > 0) {
          const firstDoc = data.documents[0];
          console.log(`   📋 Key fields: ${firstDoc.fields.slice(0, 5).join(', ')}${firstDoc.fields.length > 5 ? '...' : ''}`);
        }
      } else if (data.error) {
        console.log(`❌ ${collectionName}: Error - ${data.error}`);
      } else {
        console.log(`⚪ ${collectionName}: Empty`);
      }
    });
    
    // Check for user data specifically
    console.log('\n👤 USER DATA ANALYSIS');
    console.log('====================');
    
    if (results.users && results.users.count > 0) {
      console.log(`✅ Found ${results.users.count} user documents`);
      
      results.users.documents.forEach((doc, index) => {
        console.log(`   User ${index + 1}: ${doc.id}`);
        console.log(`   Fields: ${doc.fields.join(', ')}`);
        
        // Check for specific user data
        if (doc.sampleData.displayName) {
          console.log(`   Name: ${doc.sampleData.displayName}`);
        }
        if (doc.sampleData.email) {
          console.log(`   Email: ${doc.sampleData.email}`);
        }
        if (doc.sampleData.xp) {
          console.log(`   XP: ${doc.sampleData.xp}`);
        }
        if (doc.sampleData.level) {
          console.log(`   Level: ${doc.sampleData.level}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No user documents found');
    }
    
    // Check for reviews and photos
    console.log('\n📸 CONTENT DATA ANALYSIS');
    console.log('========================');
    
    if (results.reviews && results.reviews.count > 0) {
      console.log(`✅ Found ${results.reviews.count} review documents`);
    } else {
      console.log('❌ No review documents found');
    }
    
    if (results.photos && results.photos.count > 0) {
      console.log(`✅ Found ${results.photos.count} photo documents`);
    } else {
      console.log('❌ No photo documents found');
    }
    
    if (results.checkIns && results.checkIns.count > 0) {
      console.log(`✅ Found ${results.checkIns.count} check-in documents`);
    } else {
      console.log('❌ No check-in documents found');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Error inspecting Firestore data:', error);
    throw error;
  }
}

// Run the inspection
inspectFirestoreData().then(() => {
  console.log('\n🎉 Data inspection completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Inspection failed:', error);
  process.exit(1);
});
