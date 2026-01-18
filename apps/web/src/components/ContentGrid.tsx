'use client';

import { useState, useEffect } from 'react';
import { ContentItem, PaginatedResponse } from '@fantasy-red-zone/shared';
import { ContentCard } from './ContentCard';
import { apiClient } from '@/lib/api';

interface ContentGridProps {
  endpoint: string;
  filters?: Record<string, any>;
}

export function ContentGrid({ endpoint, filters = {} }: ContentGridProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  useEffect(() => {
    loadContent();
  }, [endpoint, JSON.stringify(filters)]);

  const loadContent = async (cursor?: string) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        ...filters,
        ...(cursor && { cursor }),
      });

      const response = await apiClient.get(`${endpoint}?${params}`);
      const data: PaginatedResponse<ContentItem> = response.data;

      if (cursor) {
        setContent((prev) => [...prev, ...data.data]);
      } else {
        setContent(data.data);
      }

      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      loadContent(nextCursor);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No content found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.map((item) => (
          <ContentCard key={item.id} content={item} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
