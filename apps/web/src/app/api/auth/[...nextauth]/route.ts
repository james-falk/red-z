import NextAuth from 'next-auth';
import { authOptions, generateApiToken } from '@/lib/auth';

const handler = NextAuth({
  ...authOptions,
  callbacks: {
    ...authOptions.callbacks,
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'USER';
        
        // Generate API token
        const apiToken = generateApiToken(user.id, user.email!, (user as any).role || 'USER');
        token.accessToken = apiToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
