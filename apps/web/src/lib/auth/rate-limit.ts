/**
 * Rate Limiting Configuration
 * 
 * SECURITY STRATEGY:
 * - In-memory LRU cache for MVP (understand limitations)
 * - IP-based limiting to prevent distributed attacks
 * - Additional user-based limiting where applicable
 * - Strict limits on auth endpoints
 * 
 * PRODUCTION LIMITATIONS OF IN-MEMORY:
 * - Resets on server restart
 * - Not shared across instances (use Redis in production)
 * - Memory usage grows with unique IPs
 * 
 * RECOMMENDATION: Move to Redis-based limiter before production scale
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.limits.entries()) {
        if (entry.resetAt < now) {
          this.limits.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   * 
   * @param key - Unique identifier (IP address or user email)
   * @param maxAttempts - Maximum attempts allowed in window
   * @param windowMs - Time window in milliseconds
   * @returns Object with allowed status and retry info
   */
  check(
    key: string,
    maxAttempts: number,
    windowMs: number
  ): { allowed: boolean; remainingAttempts: number; resetAt: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || entry.resetAt < now) {
      // New window
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return {
        allowed: true,
        remainingAttempts: maxAttempts - 1,
        resetAt: now + windowMs,
      };
    }

    if (entry.count >= maxAttempts) {
      // Rate limited
      return {
        allowed: false,
        remainingAttempts: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    return {
      allowed: true,
      remainingAttempts: maxAttempts - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for a key (use after successful auth)
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  cleanup(): void {
    clearInterval(this.cleanupInterval);
    this.limits.clear();
  }
}

// Singleton instance
export const rateLimiter = new InMemoryRateLimiter();

/**
 * Rate Limit Policies
 * 
 * SECURITY RATIONALE:
 * - Sign up: 3 per hour per IP (prevents bulk account creation)
 * - Login: 10 per 15min per IP (allows typos, prevents brute force)
 * - Forgot password: 3 per hour per IP (prevents email spam/enumeration probing)
 * - Verify email: 5 per hour per IP (allows a few retries for expired tokens)
 * 
 * NOTE: Account lockout provides additional protection at the account level
 */
export const RATE_LIMITS = {
  SIGN_UP: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  SIGN_IN: {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  FORGOT_PASSWORD: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  VERIFY_EMAIL: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const;

/**
 * Get client IP address from request
 * 
 * SECURITY: Checks X-Forwarded-For header for proxied requests
 * In production, ensure your proxy (Vercel/Netlify/etc) sets this correctly
 * 
 * @param request - Next.js request object
 * @returns string - IP address
 */
export function getClientIp(request: Request): string {
  // Check X-Forwarded-For header (set by proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take first IP in chain (original client)
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback to x-real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to placeholder (should not happen in production)
  return 'unknown';
}

/**
 * Apply rate limiting to a request
 * 
 * @param key - Rate limit key (usually IP address)
 * @param policy - Rate limit policy to apply
 * @returns Object with allowed status
 */
export function checkRateLimit(
  key: string,
  policy: { maxAttempts: number; windowMs: number }
): { allowed: boolean; remainingAttempts: number; resetAt: number } {
  return rateLimiter.check(key, policy.maxAttempts, policy.windowMs);
}
