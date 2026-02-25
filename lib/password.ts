// Password hashing utilities using bcrypt
// Server-side only - DO NOT use in client components

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * Use this when creating new users or changing passwords
 * Server-side only (API routes)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash
 * Use this during login authentication
 * Server-side only (API routes)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}
