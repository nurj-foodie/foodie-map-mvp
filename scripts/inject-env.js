const fs = require('fs');
const path = require('path');

// Read environment variables
const envPath = path.join(__dirname, '..', '.env');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!key.startsWith('#')) {
        envVars[key.trim()] = value;
      }
    }
  });
}

// Inject environment variables into index.html
const indexPath = path.join(__dirname, '..', 'public', 'index.html');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Replace environment variable placeholders
  Object.keys(envVars).forEach(key => {
    const placeholder = `%${key}%`;
    indexContent = indexContent.replace(new RegExp(placeholder, 'g'), envVars[key]);
  });
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ Environment variables injected into index.html');
} else {
  console.error('❌ index.html not found');
}