import nodemailer from 'nodemailer';
import { generateSecureToken, hashToken } from './crypto';
import { prisma } from '../prisma';

/**
 * Email Service Configuration
 * 
 * SECURITY CONSIDERATIONS:
 * - Supports both SMTP (production) and LOG mode (development)
 * - LOG mode prevents accidental email sends during testing
 * - Email templates are plain text to avoid XSS in email clients
 * - All links use APP_URL from env (prevents injection)
 * - Tokens are single-use and time-limited
 */

interface EmailConfig {
  from: string;
  mode: 'smtp' | 'log';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

function getEmailConfig(): EmailConfig {
  const mode = process.env.LOG_EMAILS === 'true' ? 'log' : 'smtp';

  if (mode === 'log') {
    return {
      from: process.env.EMAIL_FROM || 'noreply@fantastyredzone.com',
      mode: 'log',
    };
  }

  // SMTP mode - validate all required vars
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error(
      'SMTP configuration incomplete. Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS'
    );
  }

  return {
    from: process.env.EMAIL_FROM || 'noreply@fantastyredzone.com',
    mode: 'smtp',
    smtp: {
      host,
      port: parseInt(port, 10),
      secure: parseInt(port, 10) === 465, // Use TLS on port 465
      auth: { user, pass },
    },
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = getEmailConfig();

    if (this.config.mode === 'smtp' && this.config.smtp) {
      this.transporter = nodemailer.createTransport(this.config.smtp);
    }
  }

  /**
   * Send email (SMTP) or log to console (development)
   * 
   * SECURITY: Never logs sensitive info (tokens/passwords) to production logs
   */
  private async send(to: string, subject: string, text: string): Promise<void> {
    if (this.config.mode === 'log') {
      console.log('\n📧 EMAIL (LOG MODE - NOT SENT)');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Body:\n', text);
      console.log('---\n');
      return;
    }

    if (!this.transporter) {
      throw new Error('Email transporter not configured');
    }

    await this.transporter.sendMail({
      from: this.config.from,
      to,
      subject,
      text,
    });
  }

  /**
   * Send email verification email
   * 
   * SECURITY NOTES:
   * - Token is 256-bit random (high entropy)
   * - Only hashed token stored in database
   * - Token expires in 24 hours
   * - One-time use (deleted after verification)
   * - URL uses APP_URL from env (no injection possible)
   * 
   * @param userId - User ID
   * @param email - User email address
   */
  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    // Generate secure token
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    // Store hashed token in database
    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Construct verification URL
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const verifyUrl = `${appUrl}/auth/verify-email?token=${rawToken}`;

    const subject = 'Verify Your Email - Fantasy Red Zone';
    const text = `
Hello,

Thank you for signing up for Fantasy Red Zone!

Please verify your email address by clicking the link below:

${verifyUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

---
Fantasy Red Zone Team
`.trim();

    await this.send(email, subject, text);
  }

  /**
   * Send password reset email
   * 
   * SECURITY NOTES:
   * - Token is 256-bit random (high entropy)
   * - Only hashed token stored in database
   * - Token expires in 1 hour (short window)
   * - One-time use (marked as used after reset)
   * - Generic message (doesn't confirm account existence)
   * - Rate limited at API level
   * 
   * @param userId - User ID
   * @param email - User email address
   */
  async sendPasswordResetEmail(userId: string, email: string): Promise<void> {
    // Generate secure token
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    // Store hashed token in database
    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Construct reset URL
    const appUrl = process.env.APP_URL || 'http://localhost:3001';
    const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}`;

    const subject = 'Reset Your Password - Fantasy Red Zone';
    const text = `
Hello,

We received a request to reset your password for Fantasy Red Zone.

Click the link below to reset your password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
Your password will not be changed.

---
Fantasy Red Zone Team
`.trim();

    await this.send(email, subject, text);
  }

  /**
   * Resend verification email
   * 
   * SECURITY: Deletes old tokens before creating new one (prevents token accumulation)
   * 
   * @param userId - User ID
   * @param email - User email address
   */
  async resendVerificationEmail(userId: string, email: string): Promise<void> {
    // Delete existing verification tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: { userId },
    });

    // Send new verification email
    await this.sendVerificationEmail(userId, email);
  }
}

// Singleton instance
export const emailService = new EmailService();

/**
 * Token Validation Helpers
 */

/**
 * Validate and consume email verification token
 * 
 * SECURITY:
 * - Uses constant-time comparison via database lookup (not manual compare)
 * - Deletes token after successful verification (one-time use)
 * - Checks expiration
 * - Updates emailVerifiedAt atomically
 * 
 * @param rawToken - Raw token from URL
 * @returns userId if valid, null if invalid/expired
 */
export async function validateVerificationToken(rawToken: string): Promise<string | null> {
  const tokenHash = hashToken(rawToken);

  // Find token (includes expiry check)
  const token = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!token) {
    return null; // Token doesn't exist or already used
  }

  if (token.expiresAt < new Date()) {
    // Token expired - delete it
    await prisma.emailVerificationToken.delete({
      where: { id: token.id },
    });
    return null;
  }

  // Valid token - verify user email and delete token atomically
  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.delete({
      where: { id: token.id },
    }),
  ]);

  return token.userId;
}

/**
 * Validate password reset token (without consuming)
 * 
 * SECURITY:
 * - Only validates, doesn't mark as used yet
 * - Checks expiration and usedAt status
 * 
 * @param rawToken - Raw token from URL
 * @returns tokenId and userId if valid, null if invalid
 */
export async function validateResetToken(
  rawToken: string
): Promise<{ tokenId: string; userId: string } | null> {
  const tokenHash = hashToken(rawToken);

  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!token) {
    return null; // Token doesn't exist
  }

  if (token.usedAt) {
    return null; // Token already used
  }

  if (token.expiresAt < new Date()) {
    return null; // Token expired
  }

  return {
    tokenId: token.id,
    userId: token.userId,
  };
}

/**
 * Consume password reset token
 * 
 * SECURITY: Marks token as used, updates password, clears lockout atomically
 * 
 * @param tokenId - Token ID from validateResetToken
 * @param userId - User ID
 * @param hashedPassword - New hashed password
 */
export async function consumeResetToken(
  tokenId: string,
  userId: string,
  hashedPassword: string
): Promise<void> {
  await prisma.$transaction([
    // Mark token as used
    prisma.passwordResetToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    }),
    // Update password and clear lockout
    prisma.user.update({
      where: { id: userId },
      data: {
        hashedPassword,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    }),
  ]);
}

/**
 * Clean up expired tokens (run periodically)
 * 
 * SECURITY: Prevents database bloat and ensures old tokens can't be reused
 */
export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date();

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({
      where: { expiresAt: { lt: now } },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { expiresAt: { lt: now } },
    }),
  ]);
}
