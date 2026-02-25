/**
 * Check Environment Variables for Vercel Deployment
 * Shows you exactly what you need to add to Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment variables for Vercel deployment...\n');

// Read .env.local
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

// Parse environment variables
const envVars = {};
envLines.forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  }
});

console.log('📋 VERCEL DEPLOYMENT CHECKLIST\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// All required variables for Vercel
const requiredVars = {
  // Client SDK (probably already in Vercel)
  'NEXT_PUBLIC_FIREBASE_API_KEY': 'existing',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': 'existing',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'existing',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': 'existing',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': 'existing',
  'NEXT_PUBLIC_FIREBASE_APP_ID': 'existing',

  // NEW - Security fixes (probably NOT in Vercel yet)
  'JWT_SECRET': 'new',
  'FIREBASE_PROJECT_ID': 'new',
  'FIREBASE_CLIENT_EMAIL': 'new',
  'FIREBASE_PRIVATE_KEY': 'new',
};

console.log('✅ VARIABLES YOU PROBABLY ALREADY HAVE IN VERCEL:\n');
console.log('   (These were needed before the security fixes)\n');

const existingVars = Object.keys(requiredVars).filter(k => requiredVars[k] === 'existing');
existingVars.forEach(key => {
  const value = envVars[key] || '(NOT FOUND IN .env.local!)';
  const display = value.length > 50 ? value.substring(0, 50) + '...' : value;
  console.log(`   ${key}`);
  console.log(`   Value: ${display}`);
  console.log('');
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('⭐ NEW VARIABLES YOU NEED TO ADD TO VERCEL:\n');
console.log('   (These are required for the security fixes)\n');

const newVars = Object.keys(requiredVars).filter(k => requiredVars[k] === 'new');
newVars.forEach(key => {
  const value = envVars[key];
  if (value) {
    console.log(`   ✅ ${key}`);
    if (key === 'FIREBASE_PRIVATE_KEY') {
      console.log(`   Value: [PRIVATE KEY - ${value.length} characters]`);
      console.log('   ⚠️  Copy the ENTIRE key including BEGIN/END lines');
    } else if (key === 'JWT_SECRET') {
      console.log(`   Value: ${value}`);
      console.log('   ⚠️  Generate a NEW secret for production: openssl rand -base64 32');
    } else {
      console.log(`   Value: ${value}`);
    }
    console.log('');
  } else {
    console.log(`   ❌ ${key} - NOT FOUND IN .env.local!`);
    console.log('');
  }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📝 COPY-PASTE VALUES FOR VERCEL:\n');
console.log('   (Add these to Vercel → Settings → Environment Variables)\n');

newVars.forEach(key => {
  const value = envVars[key];
  if (value) {
    console.log(`${key}:`);
    if (key === 'FIREBASE_PRIVATE_KEY') {
      console.log('⚠️  [Copy from serviceAccountKey.json - see below]');
    } else if (key === 'JWT_SECRET') {
      console.log('⚠️  Generate NEW for production:');
      console.log('   Run: openssl rand -base64 32');
      console.log(`   (Your dev secret: ${value})`);
    } else {
      console.log(value);
    }
    console.log('');
  }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('🔐 SPECIAL: FIREBASE_PRIVATE_KEY\n');

if (fs.existsSync(path.join(__dirname, 'serviceAccountKey.json'))) {
  const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf8'));
  console.log('   Copy this EXACT value to Vercel:\n');
  console.log(serviceAccount.private_key);
  console.log('');
  console.log('   ⚠️  Make sure to copy the ENTIRE key including:');
  console.log('      -----BEGIN PRIVATE KEY-----');
  console.log('      -----END PRIVATE KEY-----');
} else {
  console.log('   ❌ serviceAccountKey.json not found!');
  console.log('   Run: node setup-service-account.js');
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 DEPLOYMENT STEPS:\n');
console.log('1. Go to: https://vercel.com/[your-username]/tahavura/settings/environment-variables');
console.log('2. Add the 4 NEW variables shown above');
console.log('3. Generate a NEW JWT_SECRET for production (openssl rand -base64 32)');
console.log('4. Go to Deployments → Redeploy');
console.log('5. Test login at your production URL');
console.log('');
console.log('✅ Done!\n');
