// JWT token utilities for secure session management
// Server-side only - DO NOT use in client components

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tahavura-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'worker';
}

/**
 * Sign a JWT token with user information
 * Use this after successful login
 */
export function signToken(userId: string, email: string, role: 'admin' | 'worker'): string {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode a JWT token
 * Returns the payload if valid, null if invalid/expired
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    // Token invalid or expired
    return null;
  }
}
