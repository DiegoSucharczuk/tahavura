/**
 * Create Admin User with Bcrypt Hash
 *
 * This script creates an admin user in Firestore with a bcrypt-hashed password.
 * Run this ONCE after applying security fixes to bootstrap your first admin.
 *
 * Usage:
 *   node create-admin-bcrypt.js
 */

const bcrypt = require('bcryptjs');

// Admin user details - CHANGE THESE!
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123456'; // CHANGE THIS
const ADMIN_NAME = 'System Admin';

async function main() {
  console.log('🔐 Creating admin user with bcrypt hash...\n');

  // Hash password with bcrypt
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  console.log('📋 Admin User Details:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Email:        ${ADMIN_EMAIL}`);
  console.log(`Name:         ${ADMIN_NAME}`);
  console.log(`Role:         admin`);
  console.log(`Password:     ${ADMIN_PASSWORD}`);
  console.log(`Password Hash: ${passwordHash}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📝 Next Steps:');
  console.log('');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com');
  console.log('2. Select your project');
  console.log('3. Go to Firestore Database');
  console.log('4. Click "Start collection"');
  console.log('5. Collection ID: users');
  console.log('6. Click "Auto-ID" for Document ID');
  console.log('7. Add the following fields:\n');

  console.log('   Field Name       | Type      | Value');
  console.log('   ──────────────────────────────────────────────────────────');
  console.log(`   email            | string    | ${ADMIN_EMAIL}`);
  console.log(`   name             | string    | ${ADMIN_NAME}`);
  console.log(`   passwordHash     | string    | ${passwordHash}`);
  console.log('   role             | string    | admin');
  console.log('   createdAt        | timestamp | (click "set timestamp")');
  console.log('   lastLogin        | null      | (leave empty)');
  console.log('');
  console.log('8. Click "Save"');
  console.log('9. Try logging in at http://localhost:3002/login\n');

  console.log('✅ Done! You can now log in with:');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('');
  console.log('⚠️  IMPORTANT: Change this password after first login!\n');
}

main().catch(console.error);
