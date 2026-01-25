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
  const hasRealThumbnail = !!content.thumbnailUrl && !imgError;
  
  // Determine thumbnail to display (ensure it's always a string, never null)
  const thumbnailUrl: string = hasRealThumbnail && content.thumbnailUrl
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

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    const url = encodeURIComponent(content.canonicalUrl);
    const text = encodeURIComponent(content.title);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(content.canonicalUrl);
      // You could add a toast notification here
      alert('Link copied to clipboard!');
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const contentDate = new Date(date);
    const diffInMs = now.getTime() - contentDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Less than 1 hour
    if (diffInMinutes < 60) {
      if (diffInMinutes === 1) return '1 minute ago';
      if (diffInMinutes < 1) return 'just now';
      return `${diffInMinutes} minutes ago`;
    }
    
    // Less than 24 hours
    if (diffInHours < 24) {
      if (diffInHours === 1) return '1 hour ago';
      return `${diffInHours} hours ago`;
    }
    
    // Less than 7 days
    if (diffInDays < 7) {
      if (diffInDays === 1) return '1 day ago';
      return `${diffInDays} days ago`;
    }
    
    // 7 days or more - show actual date
    return contentDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: contentDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
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
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        /* Compact Source Logo for Articles (no real thumbnail) */
        <div className="w-full h-20 sm:h-24 rounded-t-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          {content.source.logoUrl ? (
            <img
              src={content.source.logoUrl}
              alt={content.source.name}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain opacity-90"
              loading="lazy"
            />
          ) : (
            <div className="text-gray-400 text-xs sm:text-sm font-medium px-2 text-center">
              {content.source.name}
            </div>
          )}
        </div>
      )}

      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {content.type}
          </span>

          {session && (
            <button
              onClick={handleSave}
              className="text-gray-400 hover:text-primary-600 p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
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
          className="text-base sm:text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-primary-600 line-clamp-2 sm:line-clamp-3 touch-manipulation"
        >
          {content.title}
        </h3>

        {content.description && (
          <p className="text-gray-600 text-sm mb-2 sm:mb-3 line-clamp-2">
            {content.description}
          </p>
        )}

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
            {content.tags.slice(0, 5).map((tag) => (
              <span
                key={tag.id}
                className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium ${
                  tag.type === 'PLAYER' ? 'bg-blue-100 text-blue-700' :
                  tag.type === 'TEAM' ? 'bg-purple-100 text-purple-700' :
                  tag.type === 'POSITION' ? 'bg-green-100 text-green-700' :
                  tag.type === 'TOPIC' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}
              >
                {tag.name}
              </span>
            ))}
            {content.tags.length > 5 && (
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                +{content.tags.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
          <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1">
            {content.source.logoUrl && (
              <img
                src={content.source.logoUrl}
                alt={content.source.name}
                className="w-4 h-4 rounded-full flex-shrink-0"
                loading="lazy"
              />
            )}
            <span className="truncate">{content.source.name}</span>
          </div>

          <span className="ml-2 flex-shrink-0">{formatDate(content.publishedAt)}</span>
        </div>

        {/* Social Sharing Buttons */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShare('twitter')}
              className="text-gray-400 hover:text-blue-500 transition-colors p-1 touch-manipulation"
              aria-label="Share on Twitter"
              title="Share on Twitter"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="text-gray-400 hover:text-blue-600 transition-colors p-1 touch-manipulation"
              aria-label="Share on Facebook"
              title="Share on Facebook"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="text-gray-400 hover:text-blue-700 transition-colors p-1 touch-manipulation"
              aria-label="Share on LinkedIn"
              title="Share on LinkedIn"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 touch-manipulation"
              aria-label="Copy link"
              title="Copy link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>

          {content.clickCount > 0 && (
            <div className="text-xs text-gray-400">
              {content.clickCount} {content.clickCount === 1 ? 'view' : 'views'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
