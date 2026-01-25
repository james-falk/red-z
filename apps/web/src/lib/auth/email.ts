import { Resend } from 'resend';
import { generateSecureToken, hashToken } from './crypto';
import { prisma } from '../prisma';

/**
 * Email Service Configuration (Resend)
 * 
 * SECURITY CONSIDERATIONS:
 * - Supports both RESEND (production) and LOG mode (development)
 * - LOG mode prevents accidental email sends during testing
 * - Email templates use HTML with proper styling
 * - All links use APP_URL from env (prevents injection)
 * - Tokens are single-use and time-limited
 */

interface EmailConfig {
  from: string;
  mode: 'resend' | 'log';
  resendApiKey?: string;
}

function getEmailConfig(): EmailConfig {
  const mode = process.env.LOG_EMAILS === 'true' ? 'log' : 'resend';

  if (mode === 'log') {
    return {
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      mode: 'log',
    };
  }

  // Resend mode - validate API key
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is required for email sending');
  }

  return {
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    mode: 'resend',
    resendApiKey,
  };
}

class EmailService {
  private resend: Resend | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = getEmailConfig();

    if (this.config.mode === 'resend' && this.config.resendApiKey) {
      this.resend = new Resend(this.config.resendApiKey);
    }
  }

  /**
   * Send email (Resend) or log to console (development)
   * 
   * SECURITY: Never logs sensitive info (tokens/passwords) to production logs
   */
  private async send(to: string, subject: string, html: string): Promise<void> {
    console.log('[EmailService] Attempting to send email...');
    console.log('[EmailService] Mode:', this.config.mode);
    console.log('[EmailService] To:', to);
    console.log('[EmailService] Subject:', subject);

    if (this.config.mode === 'log') {
      console.log('\n📧 EMAIL (LOG MODE - NOT SENT)');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML preview:\n', html.substring(0, 200) + '...');
      console.log('---\n');
      return;
    }

    if (!this.resend) {
      console.error('[EmailService] ❌ Resend client not configured!');
      throw new Error('Resend client not configured');
    }

    try {
      console.log('[EmailService] Calling Resend API...');
      const result = await this.resend.emails.send({
        from: this.config.from,
        to,
        subject,
        html,
      });
      console.log('[EmailService] ✅ Email sent successfully!', result);
    } catch (error) {
      console.error('[EmailService] ❌ Failed to send email:', error);
      throw error;
    }
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
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Fantasy Red Zone</h1>
          </div>
          
          <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              Thanks for signing up! Please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all;">
              ${verifyUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.send(email, subject, html);
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
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Fantasy Red Zone</h1>
          </div>
          
          <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    await this.send(email, subject, html);
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
