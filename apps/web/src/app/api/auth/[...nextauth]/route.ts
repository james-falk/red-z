import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Auth.js API Route Handler
 * 
 * SECURITY:
 * - Handles all /api/auth/* routes
 * - Uses authOptions with security configurations
 * - Supports both GET and POST for Auth.js protocol
 * - CSRF protection enabled by default
 * - Secure cookies in production (httpOnly, secure, sameSite)
 */

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
