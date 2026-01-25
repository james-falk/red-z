/**
 * Social Media Ingestion Framework
 * 
 * Provider-agnostic infrastructure for ingesting social media posts.
 * Supports Instagram, Facebook, and Twitter (X).
 * 
 * NOTE: Disabled by default. Requires platform API credentials.
 */

export enum SocialPlatform {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
}

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  username: string;
  displayName: string;
  profileUrl: string;
  profileImageUrl?: string;
  content: string;
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'carousel' | 'text';
  url: string;
  publishedAt: Date;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  hashtags: string[];
}

export interface ISocialProvider {
  readonly platform: SocialPlatform;
  readonly isConfigured: boolean;

  /**
   * Fetch posts from a specific account
   */
  fetchAccountPosts(username: string, limit?: number): Promise<SocialPost[]>;

  /**
   * Search posts by hashtag
   */
  searchHashtag(hashtag: string, limit?: number): Promise<SocialPost[]>;

  /**
   * Get account info
   */
  getAccountInfo(username: string): Promise<{
    username: string;
    displayName: string;
    profileUrl: string;
    profileImageUrl?: string;
    followersCount?: number;
    verified?: boolean;
  }>;

  /**
   * Check if provider is healthy
   */
  checkHealth(): Promise<boolean>;
}

export interface SocialIngestionConfig {
  enabled: boolean;
  platforms: {
    instagram: {
      enabled: boolean;
      accounts: string[];
      hashtags: string[];
    };
    facebook: {
      enabled: boolean;
      pageIds: string[];
    };
    twitter: {
      enabled: boolean;
      accounts: string[];
      hashtags: string[];
    };
  };
  refreshInterval: number; // in minutes
}
