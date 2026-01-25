'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Nav */}
          <div className="flex">
            <Link href="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
              <span className="text-xl sm:text-2xl font-bold text-primary-600">
                Fantasy Red Zone
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-6 lg:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/')
                    ? 'border-primary-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Home
              </Link>

              {session && (
                <>
                  <Link
                    href="/my"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/my')
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    My Feed
                  </Link>

                  <Link
                    href="/sources"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/sources')
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Sources
                  </Link>

                  <Link
                    href="/feeds"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/feeds')
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Feeds
                  </Link>

                  <Link
                    href="/saved"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/saved')
                        ? 'border-primary-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Saved
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Desktop Auth & Mobile Menu Button */}
          <div className="flex items-center">
            {/* Desktop Auth */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {session ? (
                <>
                  {session.user?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="text-gray-700 hover:text-gray-900 text-sm font-medium"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/sign-in"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 min-w-[44px] min-h-[44px]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              {!mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium min-h-[44px] ${
                isActive('/')
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
            >
              Home
            </Link>

            {session && (
              <>
                <Link
                  href="/my"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium min-h-[44px] ${
                    isActive('/my')
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  My Feed
                </Link>

                <Link
                  href="/sources"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium min-h-[44px] ${
                    isActive('/sources')
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  Sources
                </Link>

                <Link
                  href="/feeds"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium min-h-[44px] ${
                    isActive('/feeds')
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  Custom Feeds
                </Link>

                <Link
                  href="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium min-h-[44px] ${
                    isActive('/saved')
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  Saved
                </Link>
              </>
            )}
          </div>

          {/* Mobile Auth Section */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            {session ? (
              <div className="space-y-1">
                {session.user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block pl-3 pr-4 py-3 text-base font-medium text-purple-600 hover:bg-gray-50 min-h-[44px]"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block pl-3 pr-4 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 min-h-[44px]"
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="block w-full text-left pl-3 pr-4 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 min-h-[44px]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="px-4">
                <Link
                  href="/auth/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center bg-primary-600 text-white px-4 py-3 rounded-md text-base font-medium hover:bg-primary-700 min-h-[44px]"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
