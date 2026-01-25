/**
 * Twitter (X) Provider
 * 
 * NOTE: Requires Twitter API v2 credentials
 * Sign up: https://developer.twitter.com/
 * 
 * API Tiers (as of 2024):
 * - Free: Extremely limited (deprecated for most use cases)
 * - Basic: $100/month - 10,000 tweets/month
 * - Pro: $5,000/month - 1M tweets/month
 * 
 * Alternative: Consider RSS feeds for public accounts
 */

import {
  ISocialProvider,
  SocialPlatform,
  SocialPost,
} from '../types';

export class TwitterProvider implements ISocialProvider {
  readonly platform = SocialPlatform.TWITTER;
  private bearerToken: string | undefined;
  private apiKey: string | undefined;
  private apiSecret: string | undefined;
  private baseUrl = 'https://api.twitter.com/2';

  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN;
    this.apiKey = process.env.TWITTER_API_KEY;
    this.apiSecret = process.env.TWITTER_API_SECRET;
  }

  get isConfigured(): boolean {
    return !!(this.bearerToken || (this.apiKey && this.apiSecret));
  }

  async fetchAccountPosts(username: string, limit: number = 10): Promise<SocialPost[]> {
    if (!this.isConfigured) {
      throw new Error('Twitter provider not configured');
    }

    try {
      // First, get user ID from username
      const userResponse = await fetch(
        `${this.baseUrl}/users/by/username/${username}`,
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
          },
        }
      );

      if (!userResponse.ok) {
        throw new Error(`Twitter API error: ${userResponse.statusText}`);
      }

      const userData = await userResponse.json();
      const userId = userData.data.id;

      // Fetch user's tweets
      const tweetsResponse = await fetch(
        `${this.baseUrl}/users/${userId}/tweets?max_results=${Math.min(limit, 100)}&tweet.fields=created_at,public_metrics,entities,attachments&expansions=attachments.media_keys&media.fields=url,preview_image_url,type`,
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
          },
        }
      );

      if (!tweetsResponse.ok) {
        throw new Error(`Twitter API error: ${tweetsResponse.statusText}`);
      }

      const tweetsData = await tweetsResponse.json();

      const mediaMap = new Map();
      if (tweetsData.includes?.media) {
        tweetsData.includes.media.forEach((media: any) => {
          mediaMap.set(media.media_key, media);
        });
      }

      return tweetsData.data.map((tweet: any) => {
        const mediaUrls: string[] = [];
        let mediaType: 'image' | 'video' | 'text' = 'text';

        if (tweet.attachments?.media_keys) {
          tweet.attachments.media_keys.forEach((key: string) => {
            const media = mediaMap.get(key);
            if (media) {
              if (media.type === 'photo' && media.url) {
                mediaUrls.push(media.url);
                mediaType = 'image';
              } else if (media.type === 'video' && media.preview_image_url) {
                mediaUrls.push(media.preview_image_url);
                mediaType = 'video';
              }
            }
          });
        }

        const hashtags = tweet.entities?.hashtags?.map((tag: any) => tag.tag) || [];

        return {
          id: tweet.id,
          platform: this.platform,
          username: username,
          displayName: userData.data.name,
          profileUrl: `https://twitter.com/${username}`,
          profileImageUrl: userData.data.profile_image_url,
          content: tweet.text,
          mediaUrls,
          mediaType,
          url: `https://twitter.com/${username}/status/${tweet.id}`,
          publishedAt: new Date(tweet.created_at),
          likesCount: tweet.public_metrics?.like_count || 0,
          commentsCount: tweet.public_metrics?.reply_count || 0,
          sharesCount: tweet.public_metrics?.retweet_count || 0,
          hashtags,
        };
      });
    } catch (error) {
      console.error(`Failed to fetch Twitter posts for ${username}:`, error);
      return [];
    }
  }

  async searchHashtag(hashtag: string, limit: number = 10): Promise<SocialPost[]> {
    if (!this.isConfigured) {
      throw new Error('Twitter provider not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/tweets/search/recent?query=%23${encodeURIComponent(hashtag)}&max_results=${Math.min(limit, 100)}&tweet.fields=created_at,public_metrics,entities,author_id&expansions=author_id&user.fields=username,name,profile_image_url`,
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.statusText}`);
      }

      const data = await response.json();

      const userMap = new Map();
      if (data.includes?.users) {
        data.includes.users.forEach((user: any) => {
          userMap.set(user.id, user);
        });
      }

      return data.data.map((tweet: any) => {
        const author = userMap.get(tweet.author_id);
        const hashtags = tweet.entities?.hashtags?.map((tag: any) => tag.tag) || [];

        return {
          id: tweet.id,
          platform: this.platform,
          username: author?.username || 'unknown',
          displayName: author?.name || 'Unknown',
          profileUrl: `https://twitter.com/${author?.username || 'unknown'}`,
          profileImageUrl: author?.profile_image_url,
          content: tweet.text,
          mediaUrls: [],
          mediaType: 'text' as const,
          url: `https://twitter.com/${author?.username || 'i'}/status/${tweet.id}`,
          publishedAt: new Date(tweet.created_at),
          likesCount: tweet.public_metrics?.like_count || 0,
          commentsCount: tweet.public_metrics?.reply_count || 0,
          sharesCount: tweet.public_metrics?.retweet_count || 0,
          hashtags,
        };
      });
    } catch (error) {
      console.error(`Failed to search Twitter hashtag ${hashtag}:`, error);
      return [];
    }
  }

  async getAccountInfo(username: string): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Twitter provider not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/users/by/username/${username}?user.fields=description,public_metrics,profile_image_url,verified`,
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const user = data.data;

      return {
        username: user.username,
        displayName: user.name,
        profileUrl: `https://twitter.com/${user.username}`,
        profileImageUrl: user.profile_image_url,
        followersCount: user.public_metrics?.followers_count,
        verified: user.verified,
      };
    } catch (error) {
      console.error(`Failed to fetch Twitter account info for ${username}:`, error);
      return {
        username,
        displayName: username,
        profileUrl: `https://twitter.com/${username}`,
      };
    }
  }

  async checkHealth(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/users/me`,
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
