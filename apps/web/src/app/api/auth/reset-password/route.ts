import { NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/auth/validation';
import { hashPassword } from '@/lib/auth/crypto';
import { validateResetToken, consumeResetToken } from '@/lib/auth/email';
import { prisma } from '@/lib/prisma';
import { validateRequest } from '@/lib/auth/csrf';

/**
 * POST /api/auth/reset-password
 * 
 * SECURITY REQUIREMENTS:
 * - Single-use tokens (usedAt tracking)
 * - 1-hour expiry enforced
 * - Token hashed before storage (SHA-256)
 * - Password policy enforced (Zod validation)
 * - Clears account lockout on success
 * - Invalidates other reset tokens for user
 * - Generic error messages (no token details leaked)
 * - Content-Type validation (JSON only)
 * - Origin validation (production only)
 * 
 * BEHAVIOR:
 * - Validates token (not expired, not used)
 * - Hashes new password with Argon2id
 * - Updates password + marks token used + clears lockout
 * - Invalidates all other reset tokens for user
 * - Returns success with redirect hint
 */
export async function POST(request: Request) {
  try {
    // CSRF/Content-Type protection
    const validationError = validateRequest(request);
    if (validationError) return validationError;
    // Parse and validate request body
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Validate token (checks expiry, usedAt, existence)
    const tokenData = await validateResetToken(token);

    if (!tokenData) {
      // SECURITY: Generic error (don't reveal why it failed)
      return NextResponse.json(
        { 
          error: 'Invalid or expired reset link. Please request a new one.',
          code: 'INVALID_TOKEN'
        },
        { status: 400 }
      );
    }

    const { tokenId, userId } = tokenData;

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Consume token and update password atomically
    // This function:
    // - Marks token as used
    // - Updates hashedPassword
    // - Resets failedLoginCount to 0
    // - Clears lockedUntil
    await consumeResetToken(tokenId, userId, hashedPassword);

    // SECURITY: Invalidate all other reset tokens for this user
    // Prevents token reuse if user requested multiple resets
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId,
        id: { not: tokenId }, // Don't delete the one we just used (already marked usedAt)
        usedAt: null, // Only delete unused tokens
      },
    });

    // Success
    return NextResponse.json({
      message: 'Password reset successfully! You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('[Auth] Reset password error:', error);
    return NextResponse.json(
      { error: 'Password reset failed. Please try again.' },
      { status: 500 }
    );
  }
}
