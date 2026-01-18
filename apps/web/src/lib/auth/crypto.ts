import { hash, verify, Algorithm } from '@node-rs/argon2';
import crypto from 'crypto';

/**
 * Password Hashing with Argon2id
 * 
 * SECURITY NOTES:
 * - Uses Argon2id (hybrid mode - resistant to both side-channel and GPU attacks)
 * - Memory cost: 65536 KB (64 MB) - high enough to prevent massive parallel attacks
 * - Time cost: 3 iterations - balanced for UX while preventing brute force
 * - Parallelism: 4 - uses multiple threads
 * - Salt length: 16 bytes (auto-generated, cryptographically random)
 * 
 * These parameters align with OWASP recommendations for 2024+
 */

const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

/**
 * Hash a password using Argon2id
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password (includes algorithm params + salt)
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against a hash using CONSTANT-TIME comparison
 * 
 * SECURITY: argon2.verify internally uses constant-time comparison
 * to prevent timing attacks that could leak information about the hash
 * 
 * @param hash - Stored Argon2 hash
 * @param password - Plain text password to verify
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  try {
    return await verify(storedHash, password);
  } catch (error) {
    // Invalid hash format or verification error
    return false;
  }
}

/**
 * Hash a token using SHA-256
 * 
 * SECURITY NOTES:
 * - NEVER store raw verification/reset tokens in database
 * - SHA-256 is sufficient for this use case (not passwords!)
 * - Tokens are high-entropy (32 bytes random) so rainbow tables are infeasible
 * - One-way function prevents token recovery if database is compromised
 * 
 * @param token - Raw token (should be high-entropy random string)
 * @returns string - Hex-encoded SHA-256 hash
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure random token
 * 
 * SECURITY NOTES:
 * - Uses crypto.randomBytes (CSPRNG) not Math.random()
 * - 32 bytes = 256 bits of entropy (exceeds 128-bit security target)
 * - URL-safe base64 encoding for use in query parameters
 * 
 * @returns string - URL-safe random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Constant-time string comparison
 * 
 * SECURITY: Prevents timing attacks that could leak token validity
 * Use this when comparing tokens, not === operator
 * 
 * @param a - First string
 * @param b - Second string  
 * @returns boolean - True if strings match
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Normalize email address for consistent storage
 * 
 * SECURITY: Prevents case-sensitivity bypass attacks
 * Example: user@EXAMPLE.com and user@example.com should be same account
 * 
 * @param email - Email address
 * @returns string - Normalized email (lowercase, trimmed)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
