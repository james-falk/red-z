import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
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
    accessToken: (session as any).accessToken,
  });
}
