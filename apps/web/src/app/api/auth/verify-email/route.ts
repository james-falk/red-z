import { NextResponse } from 'next/server';
import { validateVerificationToken } from '@/lib/auth/email';

/**
 * GET /api/auth/verify-email?token=xxx
 * 
 * SECURITY REQUIREMENTS:
 * - Single-use tokens (deleted after success)
 * - 24-hour expiry enforced
 * - Token hashed before storage (SHA-256)
 * - No enumeration (generic error messages)
 * - Atomic operation (verify email + delete token)
 * 
 * BEHAVIOR:
 * - If token valid: set emailVerifiedAt, delete token, return success
 * - If token invalid/expired: return generic error
 * - Never reveals why token failed (expired vs. not found vs. already used)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required.' },
        { status: 400 }
      );
    }

    // Validate and consume token
    // This function:
    // - Hashes the raw token
    // - Looks up in database
    // - Checks expiry
    // - Sets emailVerifiedAt
    // - Deletes token (single-use)
    // All in a transaction
    const userId = await validateVerificationToken(token);

    if (!userId) {
      // SECURITY: Generic error (don't reveal why it failed)
      return NextResponse.json(
        { 
          error: 'Invalid or expired verification link. Please request a new one.',
          code: 'INVALID_TOKEN'
        },
        { status: 400 }
      );
    }

    // Success
    return NextResponse.json({
      message: 'Email verified successfully! You can now sign in.',
      userId, // Safe to return after successful verification
    });
  } catch (error) {
    console.error('[Auth] Verify email error:', error);
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
