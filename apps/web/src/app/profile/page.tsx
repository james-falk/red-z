'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SleeperStatus } from '@fantasy-red-zone/shared';
import { apiClient } from '@/lib/api';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sleeperStatus, setSleeperStatus] = useState<SleeperStatus | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated') {
      loadSleeperStatus();
    }
  }, [status, router]);

  const loadSleeperStatus = async () => {
    try {
      const response = await apiClient.get('/integrations/sleeper/status');
      setSleeperStatus(response.data);
    } catch (error) {
      console.error('Error loading Sleeper status:', error);
    }
  };

  const handleConnectSleeper = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/integrations/sleeper/connect', {
        username,
      });
      setSleeperStatus(response.data);
      setUsername('');
    } catch (error: any) {
      setError(
        error.response?.data?.error || 'Failed to connect Sleeper account'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await apiClient.delete('/integrations/sleeper/disconnect');
      setSleeperStatus({ connected: false, sleeperUserId: null, sleeperUsername: null });
    } catch (error) {
      console.error('Error disconnecting Sleeper:', error);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      await apiClient.post('/integrations/sleeper/sync');
      alert('Sleeper data synced successfully!');
    } catch (error) {
      alert('Failed to sync Sleeper data');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Account Information
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <p className="text-gray-900">{session.user?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{session.user?.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Sleeper Integration
        </h2>

        {sleeperStatus?.connected ? (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-green-800 font-medium">
                  Connected to Sleeper
                </span>
              </div>
              <p className="text-sm text-green-700 mt-2">
                Username: {sleeperStatus.sleeperUsername}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSync}
                disabled={loading}
                className="w-full bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Syncing...' : 'Sync Leagues & Rosters'}
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-300"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnectSleeper}>
            <p className="text-gray-600 mb-4">
              Connect your Sleeper account by entering your username. We'll use
              Sleeper's read-only API to fetch your leagues and rosters.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Sleeper username"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 mb-4"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Sleeper'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
