'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { emailSchema } from '@/lib/auth/validation';

/**
 * Sign In Page
 * 
 * SECURITY:
 * - Uses Auth.js signIn() for both credentials and OAuth
 * - Client-side validation with Zod
 * - Generic error messages from server
 * - No password visible in URL
 * - CSRF protected by Auth.js
 */

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for success messages from redirects
  const verified = searchParams?.get('verified');
  const resetSuccess = searchParams?.get('reset');

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Client-side validation
      const emailValidation = emailSchema.safeParse(email);
      if (!emailValidation.success) {
        setError(emailValidation.error.errors[0].message);
        setLoading(false);
        return;
      }

      if (!password) {
        setError('Password is required');
        setLoading(false);
        return;
      }

      // Sign in with credentials
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        // SECURITY: Auth.js returns generic error
        setError('Invalid email or password');
      } else if (result?.ok) {
        // Success - redirect to home
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Sign in to Fantasy Red Zone
          </h2>
        </div>

        {/* Success messages */}
        {verified === 'true' && (
          <div className="rounded-md bg-green-50 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-green-800">
              ✅ Email verified successfully! You can now sign in.
            </p>
          </div>
        )}

        {resetSuccess === 'true' && (
          <div className="rounded-md bg-green-50 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-green-800">
              ✅ Password reset successfully! Sign in with your new password.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Credentials form */}
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleCredentialsSignIn}>
          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base min-h-[44px]"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2.5 sm:py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base min-h-[44px]"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500 min-h-[44px] inline-flex items-center"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 sm:py-2.5 px-4 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Sign up link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/auth/sign-up"
              className="font-medium text-primary-600 hover:text-primary-500 inline-flex items-center min-h-[44px]"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
