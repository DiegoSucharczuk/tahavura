/**
 * Format FIREBASE_PRIVATE_KEY for Vercel
 * This outputs the key in the correct format for Vercel environment variables
 */

const fs = require('fs');
const path = require('path');

try {
  // Read the service account key
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccountKey.json not found!');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  const privateKey = serviceAccount.private_key;

  console.log('🔐 FIREBASE_PRIVATE_KEY for Vercel\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 OPTION 1: Copy this EXACT value to Vercel (Recommended)\n');
  console.log('   Copy everything between the lines below:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(privateKey);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 OPTION 2: One-line format (with \\n escaped)\n');
  console.log('   If Option 1 doesn\'t work, use this:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(privateKey.replace(/\n/g, '\\n'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('✅ Instructions:\n');
  console.log('1. Go to: Vercel → Settings → Environment Variables');
  console.log('2. Find FIREBASE_PRIVATE_KEY and click "Edit"');
  console.log('3. DELETE the old value completely');
  console.log('4. Copy OPTION 1 (the multi-line version with actual line breaks)');
  console.log('5. Paste it into Vercel - it should look like multiple lines');
  console.log('6. Click "Save"');
  console.log('7. Redeploy\n');

  console.log('⚠️  IMPORTANT:');
  console.log('   - Make sure to include -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----');
  console.log('   - The key should span multiple lines in Vercel (not one long line)');
  console.log('   - Don\'t add extra quotes or spaces\n');

  // Save to file for easy copy
  const outputFile = path.join(__dirname, 'PRIVATE_KEY_FOR_VERCEL.txt');
  fs.writeFileSync(outputFile, privateKey);
  console.log(`💾 Also saved to: ${outputFile}`);
  console.log('   You can open this file and copy-paste from there.\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
