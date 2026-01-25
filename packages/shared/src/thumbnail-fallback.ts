/**
 * Thumbnail Fallback Strategy
 * 
 * Priority order:
 * 1. Feed-provided thumbnail (YouTube, some RSS)
 * 2. Source-specific placeholder (logo/icon)
 * 3. Generic fantasy football placeholder
 */

type SourceSpecificThumbnails = {
  [key: string]: string;
};

type ContentTypeThumbnails = {
  VIDEO: string;
  PODCAST: string;
  ARTICLE: string;
};

export const FALLBACK_THUMBNAILS = {
  // Source-specific placeholders (can be added later)
  SOURCE_SPECIFIC: {
    'pro-football-focus': 'https://www.pff.com/apple-touch-icon.png',
    'player-profiler': 'https://www.playerprofiler.com/apple-touch-icon.png',
    // Add more as needed
  } as SourceSpecificThumbnails,
  
  // Content type placeholders
  CONTENT_TYPE: {
    VIDEO: '/api/placeholder/video-thumb.jpg',
    PODCAST: '/api/placeholder/podcast-thumb.jpg',
    ARTICLE: '/api/placeholder/article-thumb.jpg'
  } as ContentTypeThumbnails,
  
  // Generic fallback
  GENERIC: '/api/placeholder/fantasy-football.jpg'
};

/**
 * Get fallback thumbnail for content without one
 */
export function getFallbackThumbnail(
  sourceSlug?: string,
  contentType?: string
): string {
  // Try source-specific first
  if (sourceSlug && sourceSlug in FALLBACK_THUMBNAILS.SOURCE_SPECIFIC) {
    return FALLBACK_THUMBNAILS.SOURCE_SPECIFIC[sourceSlug];
  }
  
  // Try content type
  if (contentType && contentType in FALLBACK_THUMBNAILS.CONTENT_TYPE) {
    return FALLBACK_THUMBNAILS.CONTENT_TYPE[contentType as keyof ContentTypeThumbnails];
  }
  
  // Generic fallback
  return FALLBACK_THUMBNAILS.GENERIC;
}
