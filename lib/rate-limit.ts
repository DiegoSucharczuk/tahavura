// Simple rate limiting for API routes
// Stores attempts in memory (will reset on server restart)

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store attempts in memory
const attempts = new Map<string, RateLimitEntry>();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts.entries()) {
    if (now > entry.resetTime) {
      attempts.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Rate limit checker
 * @param identifier - Usually IP address or user email
 * @param maxAttempts - Maximum attempts allowed (default: 5)
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = attempts.get(identifier);

  // No previous attempts or window expired
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    attempts.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxAttempts - 1, resetTime };
  }

  // Within window, check count
  if (entry.count < maxAttempts) {
    entry.count++;
    return { allowed: true, remaining: maxAttempts - entry.count, resetTime: entry.resetTime };
  }

  // Rate limited!
  return { allowed: false, remaining: 0, resetTime: entry.resetTime };
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
export function resetRateLimit(identifier: string): void {
  attempts.delete(identifier);
}

/**
 * Get time until rate limit resets (in seconds)
 */
export function getResetTimeRemaining(identifier: string): number {
  const entry = attempts.get(identifier);
  if (!entry) return 0;

  const now = Date.now();
  const remaining = Math.max(0, entry.resetTime - now);
  return Math.ceil(remaining / 1000); // Convert to seconds
}
