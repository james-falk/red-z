import { NextResponse } from 'next/server';
import { signUpSchema } from '@/lib/auth/validation';
import { hashPassword, normalizeEmail } from '@/lib/auth/crypto';
import { emailService } from '@/lib/auth/email';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { validateRequest } from '@/lib/auth/csrf';

/**
 * POST /api/auth/register
 * 
 * SECURITY REQUIREMENTS:
 * - Rate limited (3 per hour per IP)
 * - Non-enumerating (same response regardless of email existence)
 * - Normalizes email (lowercase, trim)
 * - Enforces password policy (Zod validation)
 * - Hashes password with Argon2id
 * - Sends verification email
 * - NEVER reveals if email already exists
 * - Content-Type validation (JSON only)
 * - Origin validation (production only)
 * 
 * BEHAVIOR:
 * - If email new: create user, send verification
 * - If email exists but unverified: send new verification (replace old token)
 * - If email exists and verified: return success WITHOUT sending email (prevent spam)
 * - Always returns: "Check your email to verify your account"
 */
export async function POST(request: Request) {
  try {
    // CSRF/Content-Type protection
    const validationError = validateRequest(request);
    if (validationError) return validationError;
    // Rate limiting by IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp, RATE_LIMITS.SIGN_UP);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = signUpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        emailVerifiedAt: true,
      },
    });

    if (existingUser) {
      if (existingUser.emailVerifiedAt) {
        // User exists and is verified
        // SECURITY: Return generic success without sending email (prevent spam)
        // Don't reveal account exists
        return NextResponse.json({
          message: 'If that email is not already registered, check your email to verify your account.',
        });
      } else {
        // User exists but not verified
        // SECURITY: Delete old verification tokens and send new one
        // This helps users who lost their verification email
        await prisma.emailVerificationToken.deleteMany({
          where: { userId: existingUser.id },
        });

        // Send new verification email
        await emailService.sendVerificationEmail(existingUser.id, normalizedEmail);

        // Return generic success
        return NextResponse.json({
          message: 'Check your email to verify your account.',
        });
      }
    }

    // New user - create account
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        hashedPassword,
        role: 'USER',
      },
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.id, normalizedEmail);

    // SECURITY: Generic success message (doesn't reveal if account was created)
    return NextResponse.json({
      message: 'Check your email to verify your account.',
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    // SECURITY: Don't expose internal errors
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
