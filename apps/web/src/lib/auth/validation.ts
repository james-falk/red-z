import { z } from 'zod';

/**
 * Password Validation Schema
 * 
 * SECURITY REQUIREMENTS:
 * - Minimum 10 characters (NIST recommends 8+, we exceed)
 * - Must contain at least 1 letter (prevents pure numeric)
 * - Must contain at least 1 number (enforces mixed character types)
 * - No maximum length (NIST recommends allowing long passwords)
 * 
 * NOTE: We do NOT enforce:
 * - Special characters (NIST says they don't significantly improve security)
 * - Password composition complexity rules (they frustrate users)
 * - Common password checks here (do that at signup, not schema level)
 */
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Email Validation Schema
 * 
 * SECURITY NOTES:
 * - Uses Zod's built-in email validator (RFC 5322 compliant)
 * - Will be normalized (lowercase, trimmed) before storage
 * - Max length prevents DoS via extremely long emails
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email too long');

/**
 * Sign Up Request Schema
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Sign In Request Schema
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Forgot Password Request Schema
 * 
 * SECURITY: Only email required, no username enumeration
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset Password Request Schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Verify Email Request Schema
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// Type exports for use in API routes
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
