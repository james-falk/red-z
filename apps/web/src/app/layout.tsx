import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Navigation } from '@/components/Navigation';
import AIChatWidget from '@/components/AIChatWidget';

const inter = Inter({ subsets: ['latin'] });

// Check if AI is enabled via environment variable
const AI_ENABLED = process.env.NEXT_PUBLIC_AI_ENABLED === 'true';

export const metadata = {
  title: 'Fantasy Red Zone',
  description: 'Your ultimate fantasy football content hub',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main>{children}</main>
            <AIChatWidget enabled={AI_ENABLED} />
          </div>
        </Providers>
      </body>
    </html>
  );
}
