/**
 * Social Media Ingestion Service
 * 
 * Manages social media post ingestion from multiple platforms.
 * Disabled by default - requires platform API credentials.
 */

import { InstagramProvider } from './providers/instagram.provider';
import { FacebookProvider } from './providers/facebook.provider';
import { TwitterProvider } from './providers/twitter.provider';
import { ISocialProvider, SocialPlatform, SocialPost } from './types';

class SocialIngestionService {
  private providers: Map<SocialPlatform, ISocialProvider> = new Map();
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.ENABLE_SOCIAL_INGESTION === 'true';
    this.initializeProviders();
  }

  private initializeProviders() {
    const instagram = new InstagramProvider();
    const facebook = new FacebookProvider();
    const twitter = new TwitterProvider();

    if (instagram.isConfigured) {
      this.providers.set(SocialPlatform.INSTAGRAM, instagram);
    }

    if (facebook.isConfigured) {
      this.providers.set(SocialPlatform.FACEBOOK, facebook);
    }

    if (twitter.isConfigured) {
      this.providers.set(SocialPlatform.TWITTER, twitter);
    }

    if (this.enabled) {
      if (this.providers.size === 0) {
        console.warn('⚠️  Social ingestion enabled but no providers configured');
      } else {
        console.log(`✅ Social ingestion initialized with: ${Array.from(this.providers.keys()).join(', ')}`);
      }
    }
  }

  get isEnabled(): boolean {
    return this.enabled && this.providers.size > 0;
  }

  get availablePlatforms(): SocialPlatform[] {
    return Array.from(this.providers.keys());
  }

  getProvider(platform: SocialPlatform): ISocialProvider {
    const provider = this.providers.get(platform);
    if (!provider) {
      throw new Error(`Provider for ${platform} is not configured`);
    }
    return provider;
  }

  /**
   * Fetch posts from a specific account on a platform
   */
  async fetchAccountPosts(
    platform: SocialPlatform,
    username: string,
    limit?: number
  ): Promise<SocialPost[]> {
    if (!this.enabled) {
      throw new Error('Social ingestion is not enabled');
    }

    const provider = this.getProvider(platform);
    return provider.fetchAccountPosts(username, limit);
  }

  /**
   * Search posts by hashtag
   */
  async searchHashtag(
    platform: SocialPlatform,
    hashtag: string,
    limit?: number
  ): Promise<SocialPost[]> {
    if (!this.enabled) {
      throw new Error('Social ingestion is not enabled');
    }

    const provider = this.getProvider(platform);
    return provider.searchHashtag(hashtag, limit);
  }

  /**
   * Ingest posts from configured accounts (called by cron job)
   */
  async ingestConfiguredAccounts(): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    if (!this.enabled) {
      console.log('Social ingestion is disabled, skipping');
      return { success: 0, failed: 0, total: 0 };
    }

    let success = 0;
    let failed = 0;

    // Instagram accounts
    if (this.providers.has(SocialPlatform.INSTAGRAM)) {
      const accounts = (process.env.INSTAGRAM_ACCOUNTS || '').split(',').filter(Boolean);
      for (const account of accounts) {
        try {
          const posts = await this.fetchAccountPosts(SocialPlatform.INSTAGRAM, account.trim(), 10);
          // TODO: Save posts to database
          console.log(`Fetched ${posts.length} posts from Instagram @${account}`);
          success++;
        } catch (error) {
          console.error(`Failed to fetch Instagram @${account}:`, error);
          failed++;
        }
      }

      const hashtags = (process.env.INSTAGRAM_HASHTAGS || '').split(',').filter(Boolean);
      for (const hashtag of hashtags) {
        try {
          const posts = await this.searchHashtag(SocialPlatform.INSTAGRAM, hashtag.trim(), 10);
          // TODO: Save posts to database
          console.log(`Fetched ${posts.length} posts for Instagram #${hashtag}`);
          success++;
        } catch (error) {
          console.error(`Failed to search Instagram #${hashtag}:`, error);
          failed++;
        }
      }
    }

    // Facebook pages
    if (this.providers.has(SocialPlatform.FACEBOOK)) {
      const pageIds = (process.env.FACEBOOK_PAGE_IDS || '').split(',').filter(Boolean);
      for (const pageId of pageIds) {
        try {
          const posts = await this.fetchAccountPosts(SocialPlatform.FACEBOOK, pageId.trim(), 10);
          // TODO: Save posts to database
          console.log(`Fetched ${posts.length} posts from Facebook page ${pageId}`);
          success++;
        } catch (error) {
          console.error(`Failed to fetch Facebook page ${pageId}:`, error);
          failed++;
        }
      }
    }

    // Twitter accounts
    if (this.providers.has(SocialPlatform.TWITTER)) {
      const accounts = (process.env.TWITTER_ACCOUNTS || '').split(',').filter(Boolean);
      for (const account of accounts) {
        try {
          const posts = await this.fetchAccountPosts(SocialPlatform.TWITTER, account.trim(), 10);
          // TODO: Save posts to database
          console.log(`Fetched ${posts.length} posts from Twitter @${account}`);
          success++;
        } catch (error) {
          console.error(`Failed to fetch Twitter @${account}:`, error);
          failed++;
        }
      }

      const hashtags = (process.env.TWITTER_HASHTAGS || '').split(',').filter(Boolean);
      for (const hashtag of hashtags) {
        try {
          const posts = await this.searchHashtag(SocialPlatform.TWITTER, hashtag.trim(), 10);
          // TODO: Save posts to database
          console.log(`Fetched ${posts.length} posts for Twitter #${hashtag}`);
          success++;
        } catch (error) {
          console.error(`Failed to search Twitter #${hashtag}:`, error);
          failed++;
        }
      }
    }

    return {
      success,
      failed,
      total: success + failed,
    };
  }

  /**
   * Check health of all configured providers
   */
  async checkHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    for (const [platform, provider] of this.providers) {
      try {
        health[platform] = await provider.checkHealth();
      } catch {
        health[platform] = false;
      }
    }

    return health;
  }
}

export const socialIngestionService = new SocialIngestionService();
