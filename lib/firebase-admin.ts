import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (server-side only)
// This runs with elevated permissions for secure server operations
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    // Production: Use service account credentials
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    // Development: Use application default credentials or regular init
    // For local dev, you can still use the client SDK for now
    console.warn('⚠️ Firebase Admin SDK: Missing service account credentials. Using default initialization.');
    initializeApp({
      projectId,
    });
  }
}

export const adminDb = getFirestore();
