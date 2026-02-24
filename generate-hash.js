#!/usr/bin/env node

/**
 * Generate Password Hash for Admin User
 * 
 * Run this script to generate a password hash for your admin user:
 * node generate-hash.js
 */

const crypto = require('crypto');

async function hashPassword(password) {
  // Generate random salt (16 bytes = 128 bits)
  const salt = crypto.randomBytes(16);
  const saltHex = salt.toString('hex');
  
  // Hash password with salt
  const data = password + saltHex;
  const hash = crypto.createHash('sha256').update(data).digest();
  const hashHex = hash.toString('hex');
  
  // Return combined format
  return `${saltHex}$${hashHex}`;
}

async function main() {
  const password = process.argv[2] || 'admin123';
  
  const hash = await hashPassword(password);
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ PASSWORD HASH GENERATED');
  console.log('='.repeat(60));
  console.log('\nPassword: ' + password);
  console.log('\nPassword Hash (copy this):');
  console.log(hash);
  console.log('\n' + '='.repeat(60));
  console.log('\nNext steps:');
  console.log('1. Go to Firebase Console → Your Project → Firestore Database');
  console.log('2. Create collection "users" (if not exists)');
  console.log('3. Add document with these fields:');
  console.log('   - email: "admin@example.com" (String)');
  console.log('   - name: "Admin" (String)');
  console.log('   - passwordHash: "' + hash + '" (String)');
  console.log('   - role: "admin" (String)');
  console.log('   - createdAt: (current timestamp)');
  console.log('   - lastLogin: (null)');
  console.log('\n' + '='.repeat(60) + '\n');
}

main().catch(console.error);
