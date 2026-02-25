/**
 * Add Admin User to Firestore
 * This script adds the admin user directly to Firestore database
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addAdminUser() {
  const adminUser = {
    email: 'admin@example.com',
    name: 'System Admin',
    passwordHash: '$2b$10$sOUKBP79khVeyHiDv6wguu9HgADSzzK3aJfKdyiS7Pa5M3rXuK9uq',
    role: 'admin',
    createdAt: admin.firestore.Timestamp.now(),
    lastLogin: null
  };

  try {
    const docRef = await db.collection('users').add(adminUser);
    console.log('✅ Admin user created successfully!');
    console.log('   Document ID:', docRef.id);
    console.log('');
    console.log('📧 Login credentials:');
    console.log('   Email:    admin@example.com');
    console.log('   Password: admin123456');
    console.log('');
    console.log('🌐 You can now log in at: http://localhost:3002/login');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

addAdminUser();
