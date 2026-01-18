import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeEmail } from '@/lib/auth/crypto';
import { emailService } from '@/lib/auth/email';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/auth/rate-limit';

/**
 * POST /api/auth/resend-verification
 * 
 * SECURITY REQUIREMENTS:
 * - Rate limited (5 per hour per IP)
 * - Non-enumerating (ALWAYS returns success)
 * - Only sends if user exists AND not yet verified
 * - Deletes old tokens before creating new one
 * 
 * CRITICAL: This endpoint MUST NOT reveal whether an email exists
 * 
 * BEHAVIOR:
 * - If user exists and not verified: delete old tokens, send new verification
 * - If user doesn't exist: do nothing
 * - If user already verified: do nothing
 * - Always returns: "If your email needs verification, check your inbox"
 */

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    // Rate limiting by IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, RATE_LIMITS.VERIFY_EMAIL);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = resendSchema.safeParse(body);

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

    // SECURITY: Only send if user exists AND not yet verified
    // But ALWAYS return success to prevent enumeration
    if (user && !user.emailVerifiedAt) {
      // User exists and not verified - resend verification
      await emailService.resendVerificationEmail(user.id, normalizedEmail);
    }
    // If user doesn't exist or already verified: do nothing (but still return success)

    // SECURITY: Generic success message regardless of outcome
    return NextResponse.json({
      message: 'If your email needs verification, we sent a new verification link. Please check your email.',
    });
  } catch (error) {
    console.error('[Auth] Resend verification error:', error);
    // SECURITY: Even on error, return generic success to prevent enumeration
    return NextResponse.json({
      message: 'If your email needs verification, we sent a new verification link. Please check your email.',
    });
  }
}
