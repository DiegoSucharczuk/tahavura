/**
 * Add Admin User to Firestore (Simple version)
 * Uses Firebase client SDK with your existing configuration
 */

// Import Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// Your Firebase config from .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addAdminUser() {
  const adminUser = {
    email: 'admin@example.com',
    name: 'System Admin',
    passwordHash: '$2b$10$sOUKBP79khVeyHiDv6wguu9HgADSzzK3aJfKdyiS7Pa5M3rXuK9uq',
    role: 'admin',
    createdAt: Timestamp.now(),
    lastLogin: null
  };

  try {
    console.log('🔄 Adding admin user to Firestore...');
    const docRef = await addDoc(collection(db, 'users'), adminUser);
    console.log('✅ Admin user created successfully!');
    console.log('   Document ID:', docRef.id);
    console.log('');
    console.log('📧 Login credentials:');
    console.log('   Email:    admin@example.com');
    console.log('   Password: admin123456');
    console.log('');
    console.log('🌐 You can now log in at: http://localhost:3002/login');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.log('');
    console.log('This might fail because the new security rules block direct writes.');
    console.log('Please add the user manually via Firebase Console:');
    console.log('https://console.firebase.google.com/project/tahavura/firestore');
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

addAdminUser();
