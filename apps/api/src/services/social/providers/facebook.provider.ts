/**
 * Facebook Provider
 * 
 * NOTE: Requires Facebook Graph API credentials
 * Sign up: https://developers.facebook.com/
 * 
 * API Limitations:
 * - Requires Page Access Token for public pages
 * - Limited to pages you manage or have permissions for
 * - Rate limits apply
 */

import {
  ISocialProvider,
  SocialPlatform,
  SocialPost,
} from '../types';

export class FacebookProvider implements ISocialProvider {
  readonly platform = SocialPlatform.FACEBOOK;
  private accessToken: string | undefined;
  private appId: string | undefined;
  private appSecret: string | undefined;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.appId = process.env.FACEBOOK_APP_ID;
    this.appSecret = process.env.FACEBOOK_APP_SECRET;
  }

  get isConfigured(): boolean {
    return !!(this.accessToken && this.appId && this.appSecret);
  }

  async fetchAccountPosts(pageId: string, limit: number = 10): Promise<SocialPost[]> {
    if (!this.isConfigured) {
      throw new Error('Facebook provider not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${pageId}/posts?fields=id,message,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true),shares&limit=${limit}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.data.map((post: any) => ({
        id: post.id,
        platform: this.platform,
        username: pageId,
        displayName: pageId,
        profileUrl: `https://facebook.com/${pageId}`,
        content: post.message || '',
        mediaUrls: post.full_picture ? [post.full_picture] : [],
        mediaType: post.full_picture ? ('image' as const) : ('text' as const),
        url: post.permalink_url,
        publishedAt: new Date(post.created_time),
        likesCount: post.likes?.summary?.total_count || 0,
        commentsCount: post.comments?.summary?.total_count || 0,
        sharesCount: post.shares?.count || 0,
        hashtags: this.extractHashtags(post.message || ''),
      }));
    } catch (error) {
      console.error(`Failed to fetch Facebook posts for ${pageId}:`, error);
      return [];
    }
  }

  async searchHashtag(_hashtag: string, _limit: number = 10): Promise<SocialPost[]> {
    // Facebook doesn't support public hashtag search
    console.warn('Facebook hashtag search not supported');
    return [];
  }

  async getAccountInfo(pageId: string): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Facebook provider not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${pageId}?fields=id,name,username,picture,followers_count,verification_status&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        username: data.username || data.id,
        displayName: data.name,
        profileUrl: `https://facebook.com/${data.username || data.id}`,
        profileImageUrl: data.picture?.data?.url,
        followersCount: data.followers_count,
        verified: data.verification_status === 'blue_verified' || data.verification_status === 'gray_verified',
      };
    } catch (error) {
      console.error(`Failed to fetch Facebook page info for ${pageId}:`, error);
      return {
        username: pageId,
        displayName: pageId,
        profileUrl: `https://facebook.com/${pageId}`,
      };
    }
  }

  async checkHealth(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/me?access_token=${this.accessToken}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  }
}
