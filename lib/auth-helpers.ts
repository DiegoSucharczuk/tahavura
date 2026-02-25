// Server-side authentication helpers
// Only use these in API routes or server components

import { adminDb } from './firebase-admin-simple';
import { User } from './types';

/**
 * Get user by ID from Firestore (server-side)
 * Used for session validation in API routes
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const docRef = adminDb.collection('users').doc(userId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data()!;
    return {
      id: docSnap.id,
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role || 'worker',
      createdAt: data.createdAt?.toDate?.() || new Date(),
      lastLogin: data.lastLogin?.toDate?.() || null,
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Get user by email from Firestore (server-side)
 * Used for login authentication
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const querySnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role || 'worker',
      createdAt: data.createdAt?.toDate?.() || new Date(),
      lastLogin: data.lastLogin?.toDate?.() || null,
    };
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}
