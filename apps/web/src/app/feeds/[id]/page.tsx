'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Feed, Source } from '@fantasy-red-zone/shared';
import { apiClient } from '@/lib/api';
import { ContentGrid } from '@/components/ContentGrid';

export default function FeedDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const feedId = params?.id as string;
  
  const [feed, setFeed] = useState<Feed | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated' && feedId) {
      loadFeedData();
    }
  }, [status, feedId, router]);

  const loadFeedData = async () => {
    try {
      const [feedResponse, sourcesResponse, allSourcesResponse] = await Promise.all([
        apiClient.get(`/feeds/${feedId}`),
        apiClient.get(`/feeds/${feedId}/sources`),
        apiClient.get('/sources'),
      ]);
      
      setFeed(feedResponse.data);
      setSources(sourcesResponse.data);
      setAllSources(allSourcesResponse.data);
    } catch (error) {
      console.error('Error loading feed data:', error);
      router.push('/feeds');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async (sourceId: string) => {
    try {
      await apiClient.post(`/feeds/${feedId}/sources/${sourceId}`);
      const response = await apiClient.get(`/feeds/${feedId}/sources`);
      setSources(response.data);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding source:', error);
    }
  };

  const handleRemoveSource = async (sourceId: string) => {
    try {
      await apiClient.delete(`/feeds/${feedId}/sources/${sourceId}`);
      setSources(sources.filter(s => s.id !== sourceId));
    } catch (error) {
      console.error('Error removing source:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session || !feed) {
    return null;
  }

  const availableSources = allSources.filter(
    s => !sources.some(fs => fs.id === s.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{feed.name}</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700"
          >
            Add Source
          </button>
        </div>

        {sources.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Sources in this feed:</h2>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full"
                >
                  <span className="text-sm">{source.name}</span>
                  <button
                    onClick={() => handleRemoveSource(source.id)}
                    className="text-gray-500 hover:text-red-600"
                    aria-label="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {sources.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500 mb-4">No sources in this feed yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700"
          >
            Add Your First Source
          </button>
        </div>
      ) : (
        <ContentGrid endpoint={`/feeds/${feedId}/content`} />
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add Source to Feed</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {availableSources.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                All sources are already in this feed
              </p>
            ) : (
              <div className="space-y-2">
                {availableSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {source.logoUrl && (
                        <img
                          src={source.logoUrl}
                          alt={source.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{source.name}</p>
                        <p className="text-xs text-gray-500 uppercase">{source.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddSource(source.id)}
                      className="bg-primary-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-primary-700"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
