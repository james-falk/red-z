import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { verifyPassword } from './auth/crypto';
import { normalizeEmail } from './auth/crypto';

/**
 * Auth.js Configuration
 * 
 * SECURITY NOTES:
 * - JWT session strategy (not database sessions for scalability)
 * - Google OAuth + Credentials providers
 * - Credentials provider enforces:
 *   - Email verification required
 *   - Account lockout after 8 failed attempts (15 min)
 *   - Generic error messages (no account enumeration)
 * - JWT includes user id + role for authorization
 * - NEXTAUTH_SECRET required for JWT signing
 * - SAME JWT used for frontend session AND backend API authorization
 */

// Lockout configuration
const LOCKOUT_THRESHOLD = 8;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Generic error message to prevent account enumeration
const GENERIC_AUTH_ERROR = 'Invalid email or password';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    /**
     * Google OAuth Provider
     * 
     * SECURITY: Requires valid Google OAuth credentials
     * Users created via Google will have emailVerified set automatically
     * 
     * TEMPORARILY DISABLED: Uncomment when Google OAuth credentials are configured
     */
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),

    /**
     * Credentials Provider (Email + Password)
     * 
     * SECURITY ENFORCEMENT:
     * 1. Email normalization (lowercase, trim)
     * 2. User must exist with hashedPassword
     * 3. Email must be verified (emailVerifiedAt not null)
     * 4. Account must not be locked (lockedUntil check)
     * 5. Password verification using Argon2
     * 6. Failed login tracking + lockout
     * 7. Generic error messages (no enumeration)
     * 8. Atomic updates for failedLoginCount
     */
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Normalize email
        const email = normalizeEmail(credentials.email);

        try {
          // Find user
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              hashedPassword: true,
              emailVerifiedAt: true,
              failedLoginCount: true,
              lockedUntil: true,
            },
          });

          // SECURITY: Return null for all failure cases with same generic error
          // This prevents account enumeration attacks

          // Case 1: User doesn't exist
          if (!user) {
            return null;
          }

          // Case 2: User exists but no password set (OAuth-only account)
          if (!user.hashedPassword) {
            return null;
          }

          // Case 3: Email not verified
          // SECURITY: Return null without revealing verification status
          if (!user.emailVerifiedAt) {
            return null;
          }

          // Case 4: Account is locked
          // SECURITY: Return null without revealing lockout status
          const now = new Date();
          if (user.lockedUntil && user.lockedUntil > now) {
            return null;
          }

          // Verify password using Argon2
          const isValidPassword = await verifyPassword(
            user.hashedPassword,
            credentials.password
          );

          if (!isValidPassword) {
            // SECURITY: Increment failed login count ATOMICALLY
            // Use atomic increment to prevent race conditions
            const updated = await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginCount: { increment: 1 },
              },
              select: { failedLoginCount: true },
            });

            // Check if we need to lock the account
            if (updated.failedLoginCount >= LOCKOUT_THRESHOLD) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
                  // Keep failedLoginCount for audit purposes
                },
              });
            }

            // SECURITY: Return null (same as all other failure cases)
            // Never reveal lockout status to prevent account enumeration
            return null;
          }

          // SUCCESS: Reset failed login count and lockout, update lastLoginAt
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: 0,
              lockedUntil: null,
              lastLoginAt: now,
            },
          });

          // Return user for session
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          // SECURITY: Log error but don't expose details to user
          console.error('[Auth] Credentials authorization error:', error);
          return null;
        }
      },
    }),

    /**
     * FUTURE: Microsoft Provider (commented out)
     * 
     * To enable Microsoft OAuth:
     * 1. Uncomment below
     * 2. Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to .env
     * 3. Configure redirect URI in Azure AD
     */
    // MicrosoftProvider({
    //   clientId: process.env.MICROSOFT_CLIENT_ID!,
    //   clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    // }),
  ],

  /**
   * Session Strategy: JWT
   * 
   * SECURITY:
   * - JWTs are signed with NEXTAUTH_SECRET
   * - Include user id (sub) and role for authorization
   * - Tokens expire (default: 30 days, can be configured)
   * - SAME TOKEN used for frontend session AND backend API calls
   */
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /**
   * JWT Callback
   * 
   * SECURITY: Include user id (as 'sub') and role in JWT token
   * This token will be used for BOTH frontend session AND backend API authorization
   * Called whenever a JWT is created or updated
   */
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.sub = user.id; // Standard JWT claim for user ID
        token.role = (user as any).role || 'USER';
        token.email = user.email;
      }

      // For OAuth providers, mark email as verified
      if (account?.provider === 'google' || account?.provider === 'microsoft') {
        // Ensure emailVerifiedAt is set for OAuth users
        if (user?.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              emailVerifiedAt: new Date(),
            },
          }).catch(() => {
            // Ignore if already set
          });
        }
      }

      return token;
    },

    /**
     * Session Callback
     * 
     * SECURITY: Expose user id and role to client
     * This data is sent to the browser in the session
     */
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub; // Get from standard 'sub' claim
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  /**
   * Pages Configuration
   * 
   * Custom sign-in page for branded experience
   */
  pages: {
    signIn: '/auth/sign-in',
    error: '/auth/error',
  },

  /**
   * Events
   * 
   * SECURITY: Log authentication events for audit trail
   * Note: Do NOT log passwords or tokens
   */
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('[Auth] Sign in:', {
        userId: user.id,
        provider: account?.provider,
        isNewUser,
      });
    },
    async signOut({ session, token }) {
      console.log('[Auth] Sign out:', {
        userId: (token as any)?.sub || 'unknown',
      });
    },
  },
};
