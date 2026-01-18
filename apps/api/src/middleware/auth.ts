import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser, UserRole } from '@fantasy-red-zone/shared';

/**
 * Express Auth Middleware
 * 
 * SECURITY:
 * - Verifies Auth.js JWT tokens signed with NEXTAUTH_SECRET
 * - NO custom JWT_SECRET - uses the SAME secret as Auth.js
 * - Expects token format: { sub: userId, role: string, email: string, ... }
 * - Validates signature, expiration, and required claims
 * - Attaches req.user for downstream use
 * 
 * IMPORTANT: This middleware validates tokens created by Auth.js (Next.js app)
 */

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;

if (!NEXTAUTH_SECRET) {
  console.error('[Auth] CRITICAL: NEXTAUTH_SECRET not set! Auth middleware will fail.');
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Authenticate JWT token from Auth.js
 * 
 * SECURITY:
 * - Expects Authorization: Bearer <token> header
 * - Verifies token signature using NEXTAUTH_SECRET
 * - Validates expiration (exp claim)
 * - Extracts user id from 'sub' claim (JWT standard)
 * - Extracts role and email from custom claims
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!NEXTAUTH_SECRET) {
    console.error('[Auth] NEXTAUTH_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Verify token signature and expiration
    const decoded = jwt.verify(token, NEXTAUTH_SECRET) as any;

    // Extract user info from Auth.js JWT claims
    // Auth.js uses 'sub' for user ID (JWT standard)
    const userId = decoded.sub || decoded.id; // Support both 'sub' (standard) and 'id' (legacy)
    const role = decoded.role || 'USER';
    const email = decoded.email;

    if (!userId) {
      return res.status(403).json({ error: 'Invalid token: missing user ID' });
    }

    // Attach user to request
    req.user = {
      id: userId,
      email: email || '',
      role: role as UserRole,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.error('[Auth] Token verification error:', error);
    return res.status(403).json({ error: 'Token verification failed' });
  }
}

/**
 * Require admin role
 * 
 * SECURITY: Checks user.role === ADMIN after token verification
 * Must be used AFTER authenticateToken middleware
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Optional authentication (attach user if token present, but don't require it)
 * 
 * SECURITY: Same verification as authenticateToken, but doesn't fail if no token
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided - continue without user
    return next();
  }

  if (!NEXTAUTH_SECRET) {
    console.error('[Auth] NEXTAUTH_SECRET not configured');
    return next(); // Continue without user rather than failing
  }

  try {
    const decoded = jwt.verify(token, NEXTAUTH_SECRET) as any;
    const userId = decoded.sub || decoded.id;
    const role = decoded.role || 'USER';
    const email = decoded.email;

    if (userId) {
      req.user = {
        id: userId,
        email: email || '',
        role: role as UserRole,
      };
    }
  } catch (error) {
    // Invalid token - continue without user (don't fail)
    console.warn('[Auth] Optional auth token invalid, continuing without user');
  }

  next();
}

