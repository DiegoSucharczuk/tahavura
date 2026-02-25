/**
 * Check if admin user exists in Firestore
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUser() {
  console.log('🔍 Checking Firestore for admin user...\n');

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'admin@example.com'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ User NOT found in Firestore!');
      console.log('');
      console.log('Please check:');
      console.log('1. Did you add the user to Firebase Console?');
      console.log('2. Go to: https://console.firebase.google.com/project/tahavura/firestore');
      console.log('3. Look for "users" collection');
      console.log('4. Check if a document with email "admin@example.com" exists');
    } else {
      console.log('✅ User FOUND in Firestore!');
      console.log('');
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Document ID:', doc.id);
        console.log('Email:', data.email);
        console.log('Name:', data.name);
        console.log('Role:', data.role);
        console.log('Password Hash:', data.passwordHash);
        console.log('');

        // Check if hash matches
        const expectedHash = '$2b$10$sOUKBP79khVeyHiDv6wguu9HgADSzzK3aJfKdyiS7Pa5M3rXuK9uq';
        if (data.passwordHash === expectedHash) {
          console.log('✅ Password hash matches!');
        } else {
          console.log('❌ Password hash does NOT match!');
          console.log('   Expected:', expectedHash);
          console.log('   Got:', data.passwordHash);
        }
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking Firestore:', error.message);
    console.log('');
    console.log('This might be due to Firestore security rules blocking reads.');
    console.log('However, we set rules to allow reads for quotes collection.');
    console.log('');
    console.log('Please manually check Firebase Console:');
    console.log('https://console.firebase.google.com/project/tahavura/firestore');
    process.exit(1);
  }
}

checkUser();
