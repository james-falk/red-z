import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export class EmailService {
  /**
   * Send email verification link
   */
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${APP_URL}/auth/verify-email?token=${token}`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: 'Verify your Fantasy Red Zone account',
        html: `
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
        `,
      });

      console.log(`✅ Verification email sent to: ${to}`);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset link
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: 'Reset your Fantasy Red Zone password',
        html: `
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
        `,
      });

      console.log(`✅ Password reset email sent to: ${to}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}

export const emailService = new EmailService();
