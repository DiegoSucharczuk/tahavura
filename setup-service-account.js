/**
 * Setup Service Account Credentials
 * Extracts credentials from serviceAccountKey.json and adds to .env.local
 */

const fs = require('fs');
const path = require('path');

try {
  // Read the service account key
  console.log('📖 Reading serviceAccountKey.json...\n');

  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccountKey.json not found!');
    console.log('   Please make sure the file is in the project root folder.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  // Extract credentials
  const projectId = serviceAccount.project_id;
  const clientEmail = serviceAccount.client_email;
  const privateKey = serviceAccount.private_key;

  console.log('✅ Service account loaded successfully!\n');
  console.log('Project ID:', projectId);
  console.log('Client Email:', clientEmail);
  console.log('');

  // Read existing .env.local
  const envPath = path.join(__dirname, '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Check if credentials already exist
  const hasProjectId = envContent.includes('FIREBASE_PROJECT_ID=');
  const hasClientEmail = envContent.includes('FIREBASE_CLIENT_EMAIL=');
  const hasPrivateKey = envContent.includes('FIREBASE_PRIVATE_KEY=');

  // Remove old credentials if they exist
  if (hasProjectId || hasClientEmail || hasPrivateKey) {
    console.log('🔄 Updating existing Firebase Admin credentials...\n');
    envContent = envContent
      .split('\n')
      .filter(line =>
        !line.startsWith('FIREBASE_PROJECT_ID=') &&
        !line.startsWith('FIREBASE_CLIENT_EMAIL=') &&
        !line.startsWith('FIREBASE_PRIVATE_KEY=')
      )
      .join('\n');
  } else {
    console.log('➕ Adding Firebase Admin credentials...\n');
  }

  // Add new credentials
  const newCredentials = `
# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=${projectId}
FIREBASE_CLIENT_EMAIL=${clientEmail}
FIREBASE_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"
`;

  envContent = envContent.trim() + '\n' + newCredentials;

  // Write back to .env.local
  fs.writeFileSync(envPath, envContent);

  console.log('✅ Credentials added to .env.local successfully!\n');
  console.log('🔐 Your .env.local now contains:');
  console.log('   - JWT_SECRET');
  console.log('   - Firebase Client SDK credentials');
  console.log('   - Firebase Admin SDK credentials');
  console.log('');
  console.log('🎉 Setup complete! You can now:');
  console.log('   1. Restart your dev server: npm run dev');
  console.log('   2. Try logging in at http://localhost:3001/login');
  console.log('');
  console.log('⚠️  IMPORTANT: The serviceAccountKey.json file contains sensitive credentials!');
  console.log('   It is already in .gitignore, but make sure you never commit it to git.');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
