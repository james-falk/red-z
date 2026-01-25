'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Feed } from '@fantasy-red-zone/shared';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function FeedsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feedName, setFeedName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated') {
      loadFeeds();
    }
  }, [status, router]);

  const loadFeeds = async () => {
    try {
      const response = await apiClient.get('/feeds');
      setFeeds(response.data);
    } catch (error) {
      console.error('Error loading feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedName.trim()) return;

    try {
      const response = await apiClient.post('/feeds', { name: feedName });
      setFeeds([...feeds, response.data]);
      setFeedName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating feed:', error);
    }
  };

  if (status === 'loading' || loading) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Custom Feeds</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Create and manage your personalized content feeds
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 sm:px-6 py-2.5 sm:py-2 rounded-md text-sm sm:text-base font-medium hover:bg-primary-700 min-h-[44px] whitespace-nowrap"
        >
          + Create Feed
        </button>
      </div>

      {feeds.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm">
          <p className="text-sm sm:text-base text-gray-500 mb-4">No custom feeds yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-md text-sm sm:text-base font-medium hover:bg-primary-700 min-h-[44px]"
          >
            Create Your First Feed
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {feeds.map((feed) => (
            <Link
              key={feed.id}
              href={`/feeds/${feed.id}`}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow touch-manipulation"
            >
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {feed.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {feed._count?.sources || 0} source{feed._count?.sources !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              Create Custom Feed
            </h2>
            <form onSubmit={handleCreateFeed}>
              <input
                type="text"
                value={feedName}
                onChange={(e) => setFeedName(e.target.value)}
                placeholder="Enter feed name"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 mb-4 min-h-[44px]"
                required
                autoFocus
              />
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-4 py-2.5 sm:py-2 rounded-md text-sm sm:text-base font-medium hover:bg-primary-700 min-h-[44px]"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFeedName('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 sm:py-2 rounded-md text-sm sm:text-base font-medium hover:bg-gray-300 min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
