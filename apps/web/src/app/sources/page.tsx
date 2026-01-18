'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Source } from '@fantasy-red-zone/shared';
import { apiClient } from '@/lib/api';

export default function SourcesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const response = await apiClient.get('/sources');
      setSources(response.data);
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (sourceId: string) => {
    if (!session) {
      router.push('/');
      return;
    }

    try {
      await apiClient.post(`/me/favorites/sources/${sourceId}`);
      setSources(
        sources.map((s) =>
          s.id === sourceId ? { ...s, isFollowed: true } : s
        )
      );
    } catch (error) {
      console.error('Error following source:', error);
    }
  };

  const handleUnfollow = async (sourceId: string) => {
    try {
      await apiClient.delete(`/me/favorites/sources/${sourceId}`);
      setSources(
        sources.map((s) =>
          s.id === sourceId ? { ...s, isFollowed: false } : s
        )
      );
    } catch (error) {
      console.error('Error unfollowing source:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sources</h1>
        <p className="text-gray-600">
          Browse and follow your favorite fantasy football sources
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => (
          <div
            key={source.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {source.logoUrl && (
                  <img
                    src={source.logoUrl}
                    alt={source.name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {source.name}
                  </h3>
                  <span className="text-xs text-gray-500 uppercase">
                    {source.type}
                  </span>
                </div>
              </div>
            </div>

            {source.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {source.description}
              </p>
            )}

            {session && (
              <button
                onClick={() =>
                  source.isFollowed
                    ? handleUnfollow(source.id)
                    : handleFollow(source.id)
                }
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  source.isFollowed
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {source.isFollowed ? 'Following' : 'Follow'}
              </button>
            )}

            {source.websiteUrl && (
              <a
                href={source.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-center text-sm text-primary-600 hover:text-primary-700"
              >
                Visit Website →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
