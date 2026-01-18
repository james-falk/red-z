import { NextResponse } from 'next/server';

/**
 * CSRF Protection for Custom POST Endpoints
 * 
 * IMPORTANT: This is NOT provided by Auth.js for custom routes.
 * Auth.js CSRF protection only applies to its own endpoints (e.g., /api/auth/callback, /api/auth/signin).
 * 
 * For our custom POST routes (/api/auth/register, /api/auth/forgot-password, etc.),
 * we implement minimal CSRF protections:
 * 
 * 1. Content-Type enforcement: Only accept application/json
 *    - Prevents simple form-based CSRF attacks
 *    - Browser will preflight non-simple requests
 * 
 * 2. Origin validation (production only):
 *    - Check Origin header matches APP_URL host
 *    - Allows local development (localhost, 127.0.0.1)
 *    - Prevents cross-origin requests in production
 * 
 * LIMITATIONS:
 * - This is NOT a full CSRF token system
 * - Relies on browser Same-Origin Policy
 * - For high-security operations, consider adding CSRF tokens
 * 
 * RATE LIMITING:
 * - Primary defense against abuse is rate limiting (already implemented)
 * - These protections are defense-in-depth
 */

/**
 * Validates Content-Type header for POST requests
 * Rejects non-JSON requests
 */
export function validateContentType(request: Request): NextResponse | null {
  const contentType = request.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    return NextResponse.json(
      { error: 'Content-Type must be application/json' },
      { status: 415 } // 415 Unsupported Media Type
    );
  }
  
  return null; // Valid
}

/**
 * Validates Origin header for POST requests (production only)
 * Allows all origins in development (localhost, etc.)
 * Checks Origin matches APP_URL in production
 */
export function validateOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin');
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL;
  
  // Development mode: allow all (including localhost, 127.0.0.1, etc.)
  if (process.env.NODE_ENV !== 'production') {
    return null; // Allow all origins in dev
  }
  
  // Production mode: validate origin
  if (!origin) {
    // No origin header (possible for same-origin requests in some browsers)
    // Allow it (conservative approach)
    return null;
  }
  
  if (!appUrl) {
    console.warn('[CSRF] APP_URL not set, skipping origin validation');
    return null;
  }
  
  try {
    const originUrl = new URL(origin);
    const appUrlObj = new URL(appUrl);
    
    // Check if origin matches APP_URL host
    if (originUrl.host !== appUrlObj.host) {
      console.warn(`[CSRF] Origin mismatch: ${origin} vs ${appUrl}`);
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 }
      );
    }
  } catch (err) {
    console.error('[CSRF] Origin validation error:', err);
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 }
    );
  }
  
  return null; // Valid
}

/**
 * Combined validation for custom POST endpoints
 * Call this at the start of all custom POST routes
 */
export function validateRequest(request: Request): NextResponse | null {
  // Check Content-Type
  const contentTypeError = validateContentType(request);
  if (contentTypeError) return contentTypeError;
  
  // Check Origin (production only)
  const originError = validateOrigin(request);
  if (originError) return originError;
  
  return null; // Valid
}
