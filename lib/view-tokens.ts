import { adminDb } from './firebase-admin-simple';

export interface ViewToken {
  token: string;
  quoteId: string;
  createdAt: Date;
  expiresAt: Date;
  createdFor: string; // Employee email
}

/**
 * Generate a secure random token
 */
function generateSecureToken(): string {
  // Generate 32 random bytes and convert to hex string
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a view token for a quote (valid for 1 day)
 */
export async function createViewToken(quoteId: string, employeeEmail: string): Promise<string> {
  const token = generateSecureToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day from now

  const tokenData: ViewToken = {
    token,
    quoteId,
    createdAt: now,
    expiresAt,
    createdFor: employeeEmail,
  };

  // Store token in Firestore
  await adminDb.collection('viewTokens').doc(token).set(tokenData);

  console.log('✅ View token created:', {
    token: `${token.substring(0, 8)}...`,
    quoteId,
    expiresAt,
  });

  return token;
}

/**
 * Validate a view token
 * Returns the quote ID if valid, null if invalid/expired
 */
export async function validateViewToken(token: string): Promise<string | null> {
  try {
    const tokenDoc = await adminDb.collection('viewTokens').doc(token).get();

    if (!tokenDoc.exists) {
      console.log('❌ Token not found');
      return null;
    }

    const tokenData = tokenDoc.data() as ViewToken;

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);

    if (now > expiresAt) {
      console.log('❌ Token expired:', {
        expiresAt,
        now,
      });
      // Delete expired token
      await adminDb.collection('viewTokens').doc(token).delete();
      return null;
    }

    console.log('✅ Token valid:', {
      quoteId: tokenData.quoteId,
      expiresAt,
    });

    return tokenData.quoteId;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
}

/**
 * Clean up expired tokens (can be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const now = new Date();
  const expiredTokensSnapshot = await adminDb
    .collection('viewTokens')
    .where('expiresAt', '<', now)
    .get();

  const batch = adminDb.batch();
  expiredTokensSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  console.log(`🧹 Cleaned up ${expiredTokensSnapshot.size} expired tokens`);
  return expiredTokensSnapshot.size;
}
