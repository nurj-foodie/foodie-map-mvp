/**
 * Quick API Key Test Script
 * Tests Google Maps API keys for both frontend and backend
 */

const axios = require('axios');
require('dotenv').config();

// Frontend API Key (from public/index.html)
const FRONTEND_API_KEY = 'AIzaSyAPa5fnA9SvBe4rTy17WVOptcn0dsLiEWE';

// Backend API Key (from environment)
const BACKEND_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

console.log('🔍 Testing Google Maps API Keys...\n');

// Test 1: Frontend API Key - Geocoding Test
async function testFrontendKey() {
  console.log('📱 Testing FRONTEND API Key...');
  console.log(`   Key: ${FRONTEND_API_KEY.substring(0, 20)}...`);
  
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: 'Kuala Lumpur, Malaysia',
        key: FRONTEND_API_KEY
      }
    });
    
    if (response.data.status === 'OK') {
      console.log('   ✅ FRONTEND API Key is WORKING');
      console.log(`   📍 Found: ${response.data.results[0].formatted_address}`);
      return true;
    } else {
      console.log(`   ❌ FRONTEND API Key ERROR: ${response.data.status}`);
      if (response.data.error_message) {
        console.log(`   💬 Error: ${response.data.error_message}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`   ❌ FRONTEND API Key FAILED: ${error.message}`);
    return false;
  }
}

// Test 2: Backend API Key - Places API Test
async function testBackendKey() {
  console.log('\n🔧 Testing BACKEND API Key...');
  
  if (!BACKEND_API_KEY) {
    console.log('   ⚠️  BACKEND API Key not found in environment variables');
    console.log('   💡 Set GOOGLE_MAPS_API_KEY in .env file');
    return false;
  }
  
  console.log(`   Key: ${BACKEND_API_KEY.substring(0, 20)}...`);
  
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: 'restaurant in Kuala Lumpur',
        key: BACKEND_API_KEY
      }
    });
    
    if (response.data.status === 'OK') {
      console.log('   ✅ BACKEND API Key is WORKING');
      console.log(`   🍽️  Found ${response.data.results.length} restaurants`);
      return true;
    } else {
      console.log(`   ❌ BACKEND API Key ERROR: ${response.data.status}`);
      if (response.data.error_message) {
        console.log(`   💬 Error: ${response.data.error_message}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`   ❌ BACKEND API Key FAILED: ${error.message}`);
    return false;
  }
}

// Test 3: Compare Keys
function compareKeys() {
  console.log('\n🔐 Comparing API Keys...');
  
  if (!BACKEND_API_KEY) {
    console.log('   ⚠️  Cannot compare - Backend key not set');
    return;
  }
  
  if (FRONTEND_API_KEY === BACKEND_API_KEY) {
    console.log('   ✅ Both keys are the SAME');
    console.log('   💡 This is fine if you want to use one key for both');
  } else {
    console.log('   ℹ️  Keys are DIFFERENT');
    console.log('   💡 This is fine if you use separate keys for frontend/backend');
  }
}

// Run all tests
async function runTests() {
  const frontendResult = await testFrontendKey();
  const backendResult = await testBackendKey();
  compareKeys();
  
  console.log('\n📊 Summary:');
  console.log(`   Frontend: ${frontendResult ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Backend:  ${backendResult ? '✅ WORKING' : '❌ FAILED'}`);
  
  if (frontendResult && backendResult) {
    console.log('\n🎉 All API keys are working!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some API keys need attention');
    process.exit(1);
  }
}

runTests();

