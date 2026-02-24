/**
 * Seed Users Script
 * 
 * This script creates an initial admin user in Firestore.
 * Run this once to bootstrap the system:
 * 
 * npx ts-node lib/seedUsers.ts
 * 
 * Or manually create a user in the Firestore console with:
 * Collection: users
 * Document ID: (auto)
 * Fields:
 *   - email: "admin@example.com"
 *   - name: "Admin"
 *   - passwordHash: (run hashPassword('admin123') in browser console)
 *   - role: "admin"
 *   - createdAt: (current timestamp)
 *   - lastLogin: null
 */

// To create the initial admin user:
// 1. Go to https://tahavura.vercel.app/login
// 2. Open browser console (F12 or right-click → Inspect)
// 3. Run this code:

const createAdminUser = async () => {
  // Import password utility
  const hashPassword = async (password: string): Promise<string> => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password + saltHex);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return `${saltHex}$${hashHex}`;
  };

  const password = prompt('Enter admin password (min 6 chars):', 'admin123');
  if (!password || password.length < 6) {
    console.error('Password too short');
    return;
  }

  const passwordHash = await hashPassword(password);
  
  console.log('Admin User Data:');
  console.log({
    email: 'admin@example.com',
    name: 'Admin',
    passwordHash: passwordHash,
    role: 'admin',
    createdAt: new Date().toISOString(),
    lastLogin: null,
  });

  console.log('\nTo create this user in Firestore:');
  console.log('1. Go to Firebase Console');
  console.log('2. Select your project');
  console.log('3. Go to Firestore Database');
  console.log('4. Create collection "users"');
  console.log('5. Add document with the data above');
};

// Uncomment to run in browser console:
// createAdminUser();

export {};
