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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 line-clamp-2">{feed.name}</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 text-white px-4 sm:px-6 py-2.5 sm:py-2 rounded-md text-sm sm:text-base font-medium hover:bg-primary-700 min-h-[44px] whitespace-nowrap"
          >
            + Add Source
          </button>
        </div>

        {sources.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
            <h2 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">
              Sources in this feed ({sources.length}):
            </h2>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="inline-flex items-center gap-2 bg-gray-100 px-2.5 sm:px-3 py-1.5 rounded-full"
                >
                  <span className="text-xs sm:text-sm">{source.name}</span>
                  <button
                    onClick={() => handleRemoveSource(source.id)}
                    className="text-gray-500 hover:text-red-600 p-1 min-w-[24px] min-h-[24px] flex items-center justify-center"
                    aria-label={`Remove ${source.name}`}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm">
          <p className="text-sm sm:text-base text-gray-500 mb-4">No sources in this feed yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-md text-sm sm:text-base font-medium hover:bg-primary-700 min-h-[44px]"
          >
            Add Your First Source
          </button>
        </div>
      ) : (
        <ContentGrid endpoint={`/feeds/${feedId}/content`} />
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Add Source to Feed</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {availableSources.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 text-center py-8">
                All sources are already in this feed
              </p>
            ) : (
              <div className="space-y-2">
                {availableSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      {source.logoUrl && (
                        <img
                          src={source.logoUrl}
                          alt={source.name}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{source.name}</p>
                        <p className="text-xs text-gray-500 uppercase">{source.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddSource(source.id)}
                      className="bg-primary-600 text-white px-3 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-primary-700 ml-2 whitespace-nowrap min-h-[44px]"
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
