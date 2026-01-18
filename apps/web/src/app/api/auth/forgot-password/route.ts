import { NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/lib/auth/validation';
import { normalizeEmail } from '@/lib/auth/crypto';
import { emailService } from '@/lib/auth/email';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { validateRequest } from '@/lib/auth/csrf';

/**
 * POST /api/auth/forgot-password
 * 
 * SECURITY REQUIREMENTS:
 * - Rate limited (3 per hour per IP)
 * - Non-enumerating (ALWAYS returns success)
 * - Only sends email if user exists AND is verified
 * - 1-hour token expiry
 * - Tokens are single-use (usedAt tracking)
 * - Content-Type validation (JSON only)
 * - Origin validation (production only)
 * 
 * CRITICAL: This endpoint MUST NOT reveal whether an email exists
 * 
 * BEHAVIOR:
 * - If user exists and verified: send reset email
 * - If user doesn't exist: do nothing
 * - If user exists but not verified: do nothing
 * - Always returns: "If that email is registered, we sent a password reset link"
 */
export async function POST(request: Request) {
  try {
    // CSRF/Content-Type protection
    const validationError = validateRequest(request);
    if (validationError) return validationError;
    // Rate limiting by IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, RATE_LIMITS.FORGOT_PASSWORD);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const normalizedEmail = normalizeEmail(email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        emailVerifiedAt: true,
      },
    });

    // SECURITY: Only send email if user exists AND is verified
    // But ALWAYS return success to prevent enumeration
    if (user && user.emailVerifiedAt) {
      // User exists and is verified - send reset email
      await emailService.sendPasswordResetEmail(user.id, normalizedEmail);
    }
    // If user doesn't exist or not verified: do nothing (but still return success)

    // SECURITY: Generic success message regardless of outcome
    return NextResponse.json({
      message: 'If that email is registered, we sent a password reset link. Please check your email.',
    });
  } catch (error) {
    console.error('[Auth] Forgot password error:', error);
    // SECURITY: Even on error, return generic success to prevent enumeration
    return NextResponse.json({
      message: 'If that email is registered, we sent a password reset link. Please check your email.',
    });
  }
}
