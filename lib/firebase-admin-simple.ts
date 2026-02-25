import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with inline credentials
// This avoids environment variable parsing issues
if (!getApps().length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tahavura';

  // Try to use service account credentials if available
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      // Clean up the private key - handle both formats
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      // If it has literal \n, replace them with actual newlines
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      initializeApp({
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });

      console.log('✅ Firebase Admin SDK initialized with service account');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin with service account:', error);
      // Fallback to default
      initializeApp({ projectId });
    }
  } else {
    console.warn('⚠️ Firebase Admin: No service account credentials, using default');
    initializeApp({ projectId });
  }
}

export const adminDb = getFirestore();
