const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

// Read the HTML file
const htmlPath = path.join(__dirname, '../public/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace placeholder with actual API key
const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';
html = html.replace('YOUR_GOOGLE_MAPS_API_KEY_HERE', apiKey);

// Write back to file
fs.writeFileSync(htmlPath, html);

console.log('✅ Environment variables injected into HTML');
