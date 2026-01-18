import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';

/**
 * Session API Endpoint
 * 
 * SECURITY:
 * - Returns current user session from Auth.js
 * - Extracts the Auth.js JWT token directly (signed with NEXTAUTH_SECRET)
 * - NO separate token generation - uses SAME token for frontend + backend
 * - Token contains: sub (user id), role, email
 * - Frontend uses this token as Authorization: Bearer <token>
 * 
 * IMPORTANT: This is the Auth.js JWT, not a custom token
 */

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Extract the Auth.js JWT token from the request
  // This is the SAME token Auth.js uses for session management
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET!,
  });

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Get the raw JWT string from the cookie
  // Auth.js stores it in next-auth.session-token (production) or __Secure-next-auth.session-token (HTTPS)
  const cookieStore = cookies();
  const sessionToken = 
    cookieStore.get('next-auth.session-token')?.value ||
    cookieStore.get('__Secure-next-auth.session-token')?.value;

  if (!sessionToken) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: (session.user as any).id,
      email: session.user?.email,
      name: session.user?.name,
      image: session.user?.image,
      role: (session.user as any).role,
    },
    // Return the Auth.js JWT directly - NO custom token generation
    accessToken: sessionToken,
  });
}
