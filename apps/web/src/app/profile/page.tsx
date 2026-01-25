'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SleeperStatus, ContentItem, Source, Feed } from '@fantasy-red-zone/shared';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sleeperStatus, setSleeperStatus] = useState<SleeperStatus | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Stats
  const [savedCount, setSavedCount] = useState(0);
  const [followedSources, setFollowedSources] = useState<Source[]>([]);
  const [customFeeds, setCustomFeeds] = useState<Feed[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated') {
      loadProfileData();
    }
  }, [status, router]);

  const loadProfileData = async () => {
    setLoadingStats(true);
    try {
      const [sleeperResp, savedResp, sourcesResp, feedsResp] = await Promise.all([
        apiClient.get('/integrations/sleeper/status'),
        apiClient.get('/me/saved?limit=1'),
        apiClient.get('/me/favorites/sources'),
        apiClient.get('/feeds'),
      ]);
      
      setSleeperStatus(sleeperResp.data);
      setSavedCount(savedResp.data.data?.length || 0);
      setFollowedSources(sourcesResp.data);
      setCustomFeeds(feedsResp.data);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoadingStats(false);
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

  const handleUnfollowSource = async (sourceId: string) => {
    try {
      await apiClient.delete(`/me/favorites/sources/${sourceId}`);
      setFollowedSources(followedSources.filter(s => s.id !== sourceId));
    } catch (error) {
      console.error('Error unfollowing source:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Quick Stats */}
      {!loadingStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/saved" className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Saved Items</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{savedCount}</p>
          </Link>
          <Link href="/sources" className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Following</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{followedSources.length}</p>
          </Link>
          <Link href="/feeds" className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Custom Feeds</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{customFeeds.length}</p>
          </Link>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Sleeper</p>
            <p className="text-xs sm:text-sm font-medium text-gray-900">
              {sleeperStatus?.connected ? '✓ Connected' : 'Not Connected'}
            </p>
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Account Information
        </h2>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">Email</label>
            <p className="text-sm sm:text-base text-gray-900">{session.user?.email}</p>
          </div>
          <div>
            <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">Account Type</label>
            <p className="text-sm sm:text-base text-gray-900">
              {session.user?.role === 'ADMIN' ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  Admin
                </span>
              ) : (
                'User'
              )}
            </p>
          </div>
          {/* Future: Password change button */}
          <div className="pt-2 sm:pt-3 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-500">
              Password management and account deletion coming soon
            </p>
          </div>
        </div>
      </div>

      {/* Followed Sources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Followed Sources
          </h2>
          <Link
            href="/sources"
            className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Browse All
          </Link>
        </div>
        
        {followedSources.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">No sources followed yet</p>
            <Link
              href="/sources"
              className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-primary-700"
            >
              Browse Sources
            </Link>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {followedSources.slice(0, 5).map((source) => (
              <div key={source.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  {source.logoUrl && (
                    <img src={source.logoUrl} alt={source.name} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0" />
                  )}
                  <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{source.name}</p>
                </div>
                <button
                  onClick={() => handleUnfollowSource(source.id)}
                  className="text-xs sm:text-sm text-gray-600 hover:text-red-600 ml-2 whitespace-nowrap"
                >
                  Unfollow
                </button>
              </div>
            ))}
            {followedSources.length > 5 && (
              <Link
                href="/sources"
                className="block text-center text-xs sm:text-sm text-primary-600 hover:text-primary-700 py-2"
              >
                View all {followedSources.length} sources →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Custom Feeds */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            My Custom Feeds
          </h2>
          <Link
            href="/feeds"
            className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Manage
          </Link>
        </div>
        
        {customFeeds.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">No custom feeds yet</p>
            <Link
              href="/feeds"
              className="inline-block bg-primary-600 text-white px-4 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-primary-700"
            >
              Create Feed
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customFeeds.slice(0, 4).map((feed) => (
              <Link
                key={feed.id}
                href={`/feeds/${feed.id}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <p className="text-sm sm:text-base font-medium text-gray-900 mb-1 line-clamp-1">{feed.name}</p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {feed._count?.sources || 0} sources
                </p>
              </Link>
            ))}
            {customFeeds.length > 4 && (
              <Link
                href="/feeds"
                className="flex items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-xs sm:text-sm text-primary-600 font-medium"
              >
                View all {customFeeds.length} feeds →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Sleeper Integration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Sleeper Integration
        </h2>

        {sleeperStatus?.connected ? (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-md p-3 sm:p-4 mb-4">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm sm:text-base text-green-800 font-medium">
                  Connected to Sleeper
                </span>
              </div>
              <p className="text-xs sm:text-sm text-green-700 mt-2">
                Username: {sleeperStatus.sleeperUsername}
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={handleSync}
                disabled={loading}
                className="w-full bg-primary-600 text-white px-4 py-2.5 sm:py-2 rounded-md text-sm sm:text-base font-medium hover:bg-primary-700 disabled:opacity-50 min-h-[44px]"
              >
                {loading ? 'Syncing...' : 'Sync Leagues & Rosters'}
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-2 rounded-md text-sm sm:text-base font-medium hover:bg-gray-300 min-h-[44px]"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnectSleeper}>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Connect your Sleeper account by entering your username. We'll use
              Sleeper's read-only API to fetch your leagues and rosters.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-red-800 text-xs sm:text-sm">{error}</p>
              </div>
            )}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Sleeper username"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 mb-4 min-h-[44px]"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white px-4 py-2.5 sm:py-2 rounded-md text-sm sm:text-base font-medium hover:bg-primary-700 disabled:opacity-50 min-h-[44px]"
            >
              {loading ? 'Connecting...' : 'Connect Sleeper'}
            </button>
          </form>
        )}
      </div>

      {/* Preferences (Coming Soon) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Preferences
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <div>
              <p className="text-sm sm:text-base font-medium text-gray-900">Email Notifications</p>
              <p className="text-xs sm:text-sm text-gray-500">Get notified about new content</p>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 italic">Coming Soon</div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <div>
              <p className="text-sm sm:text-base font-medium text-gray-900">Dark Mode</p>
              <p className="text-xs sm:text-sm text-gray-500">Toggle dark mode theme</p>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 italic">Coming Soon</div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm sm:text-base font-medium text-gray-900">Weekly Digest</p>
              <p className="text-xs sm:text-sm text-gray-500">Receive a weekly summary email</p>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 italic">Coming Soon</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
          💡 Notification features require email service configuration
        </p>
      </div>
    </div>
  );
}
