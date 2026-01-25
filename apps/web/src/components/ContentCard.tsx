'use client';

import { ContentItem } from '@fantasy-red-zone/shared';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';

interface ContentCardProps {
  content: ContentItem;
  featured?: boolean;
}

// Fallback thumbnail URLs based on content type
const FALLBACK_THUMBNAILS = {
  VIDEO: 'https://placehold.co/640x360/1e40af/ffffff?text=Video',
  PODCAST: 'https://placehold.co/640x360/7c3aed/ffffff?text=Podcast',
  ARTICLE: 'https://placehold.co/640x360/059669/ffffff?text=Article'
};

export function ContentCard({ content, featured = false }: ContentCardProps) {
  const { data: session } = useSession();
  const [isSaved, setIsSaved] = useState(content.isSaved || false);
  const [imgError, setImgError] = useState(false);

  // Check if content has a real thumbnail (not a fallback)
  const hasRealThumbnail = content.thumbnailUrl && !imgError;
  
  // Determine thumbnail to display (always return a string, never null)
  const thumbnailUrl = hasRealThumbnail
    ? content.thumbnailUrl 
    : (FALLBACK_THUMBNAILS[content.type as keyof typeof FALLBACK_THUMBNAILS] || FALLBACK_THUMBNAILS.ARTICLE);

  const handleSave = async () => {
    if (!session) return;

    try {
      if (isSaved) {
        await apiClient.delete(`/me/saved/${content.id}`);
        setIsSaved(false);
      } else {
        await apiClient.post(`/me/saved/${content.id}`);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const handleClick = async () => {
    try {
      await apiClient.post(`/content/${content.id}/click`);
      window.open(content.canonicalUrl, '_blank');
    } catch (error) {
      console.error('Error tracking click:', error);
      window.open(content.canonicalUrl, '_blank');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${featured ? 'border-2 border-primary-500' : 'border border-gray-200'}`}>
      {/* Header Image Area */}
      {hasRealThumbnail ? (
        /* Real Thumbnail (Video/Podcast) */
        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100">
          <img
            src={thumbnailUrl}
            alt={content.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        /* Large Source Logo for Articles (no real thumbnail) */
        <div className="aspect-video w-full rounded-t-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          {content.source.logoUrl ? (
            <img
              src={content.source.logoUrl}
              alt={content.source.name}
              className="w-24 h-24 object-contain opacity-90"
            />
          ) : (
            <div className="text-gray-400 text-sm font-medium">
              {content.source.name}
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {content.type}
          </span>

          {session && (
            <button
              onClick={handleSave}
              className="text-gray-400 hover:text-primary-600"
              aria-label={isSaved ? 'Unsave' : 'Save'}
            >
              <svg
                className="w-5 h-5"
                fill={isSaved ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          )}
        </div>

        <h3
          onClick={handleClick}
          className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-primary-600"
        >
          {content.title}
        </h3>

        {content.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {content.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            {content.source.logoUrl && (
              <img
                src={content.source.logoUrl}
                alt={content.source.name}
                className="w-4 h-4 rounded-full"
              />
            )}
            <span>{content.source.name}</span>
          </div>

          <span>{formatDate(content.publishedAt)}</span>
        </div>

        {content.clickCount > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            {content.clickCount} {content.clickCount === 1 ? 'view' : 'views'}
          </div>
        )}
      </div>
    </div>
  );
}
