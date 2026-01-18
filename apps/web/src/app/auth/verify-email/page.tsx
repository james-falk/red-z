'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Email Verification Page
 * 
 * SECURITY:
 * - Reads token from query string only (not headers/cookies)
 * - Calls GET /api/auth/verify-email?token=...
 * - Generic error messages (doesn't reveal why token failed)
 * - No open redirects (hard-coded redirect to /auth/sign-in)
 * - Token never logged or sent to analytics
 * - Shows loading/success/failure states
 */

type VerificationState = 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerificationState>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // Get token from query string
      const token = searchParams?.get('token');

      if (!token) {
        setState('error');
        setError('Verification link is invalid. Please check your email for the correct link.');
        return;
      }

      try {
        // Call verification API
        // SECURITY: Token is NOT logged or sent anywhere except the API
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok) {
          setState('success');
          // Redirect to sign-in after 2 seconds
          setTimeout(() => {
            // SECURITY: Hard-coded redirect (no open redirect vulnerability)
            router.push('/auth/sign-in?verified=true');
          }, 2000);
        } else {
          setState('error');
          // SECURITY: Generic error message from server (no enumeration)
          setError(data.error || 'Verification failed. Please try again.');
        }
      } catch (err) {
        setState('error');
        setError('Verification failed. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        {state === 'verifying' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Verifying your email...</p>
          </div>
        )}

        {state === 'success' && (
          <div>
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Email verified successfully!
                  </h3>
                  <p className="mt-2 text-sm text-green-700">
                    You can now sign in to your account. Redirecting...
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/auth/sign-in?verified=true"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Go to sign in
              </Link>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div>
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Verification failed
                  </h3>
                  <p className="mt-2 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-600 text-center">
                The verification link may have expired or already been used.
              </p>

              <div className="flex flex-col space-y-2">
                <Link
                  href="/auth/sign-up"
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Request new verification link
                </Link>

                <Link
                  href="/auth/sign-in"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
