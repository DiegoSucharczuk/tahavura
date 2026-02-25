/**
 * Test Login - Debug Script
 * This helps us see what's happening with the login
 */

const bcrypt = require('bcryptjs');

// The password we're trying
const plainPassword = 'admin123456';

// The hash we stored in Firestore
const storedHash = '$2b$10$sOUKBP79khVeyHiDv6wguu9HgADSzzK3aJfKdyiS7Pa5M3rXuK9uq';

async function testLogin() {
  console.log('🔍 Testing login credentials...\n');

  console.log('Plain password:', plainPassword);
  console.log('Stored hash:', storedHash);
  console.log('');

  // Test if password matches hash
  const isMatch = await bcrypt.compare(plainPassword, storedHash);

  console.log('Password match result:', isMatch);
  console.log('');

  if (isMatch) {
    console.log('✅ Password verification WORKS!');
    console.log('   The issue might be:');
    console.log('   - User not found in Firestore');
    console.log('   - Email typed incorrectly in Firestore');
    console.log('   - API route not fetching user correctly');
  } else {
    console.log('❌ Password verification FAILED!');
    console.log('   The issue might be:');
    console.log('   - Wrong password hash in Firestore');
    console.log('   - Hash got corrupted during copy-paste');
  }

  console.log('');
  console.log('📋 To check Firestore:');
  console.log('   1. Go to: https://console.firebase.google.com/project/tahavura/firestore');
  console.log('   2. Open "users" collection');
  console.log('   3. Check if admin@example.com exists');
  console.log('   4. Verify the passwordHash field exactly matches:');
  console.log('      $2b$10$sOUKBP79khVeyHiDv6wguu9HgADSzzK3aJfKdyiS7Pa5M3rXuK9uq');
}

testLogin().catch(console.error);
