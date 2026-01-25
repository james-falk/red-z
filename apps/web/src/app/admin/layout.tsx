'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/sign-in?callbackUrl=/admin');
      return;
    }

    if (!session.user || session.user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return null;
  }

  const navigation = [
    { name: 'Featured Content', href: '/admin/featured', icon: '⭐' },
    { name: 'Sources', href: '/admin/sources', icon: '📡' },
    { name: 'Ingestion', href: '/admin/ingestion', icon: '🔄' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Analytics', href: '/admin/analytics', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link href="/" className="flex items-center">
                <span className="text-xl sm:text-2xl font-bold text-primary-600">🏈</span>
                <span className="ml-2 text-base sm:text-xl font-semibold text-gray-900">
                  <span className="hidden sm:inline">Red Zone </span>Admin
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[120px] sm:max-w-none">
                {session.user.email}
              </span>
              <Link
                href="/"
                className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
              >
                <span className="hidden sm:inline">← Back to Site</span>
                <span className="sm:hidden">← Site</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar - Mobile overlay */}
          <aside
            className={`fixed inset-0 z-30 lg:static lg:inset-auto lg:z-auto transition-all duration-300 ${
              sidebarOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Overlay backdrop (mobile only) */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar content */}
            <nav
              className={`fixed top-16 left-0 bottom-0 w-64 bg-white shadow-xl lg:shadow-sm lg:static lg:rounded-lg lg:border lg:border-gray-200 p-4 overflow-y-auto transition-transform duration-300 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
              }`}
            >
              <ul className="space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                          isActive
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
