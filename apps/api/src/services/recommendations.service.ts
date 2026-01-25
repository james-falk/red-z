/**
 * Content Recommendations Service
 * 
 * Provides personalized content recommendations based on:
 * - User's saved/favorited content
 * - Followed sources
 * - Viewing history
 * - Trending content
 * - AI-powered suggestions (when enabled)
 */

import { PrismaClient } from '@prisma/client';
import { aiService } from './ai';

const prisma = new PrismaClient();

export interface RecommendationOptions {
  userId: string;
  limit?: number;
  excludeContentIds?: string[];
}

export interface RecommendedContent {
  contentId: string;
  score: number;
  reason: 'personalized' | 'trending' | 'similar' | 'followed_source' | 'ai_suggested';
}

class RecommendationsService {
  /**
   * Get personalized content recommendations for a user
   */
  async getRecommendations(options: RecommendationOptions): Promise<RecommendedContent[]> {
    const { userId, limit = 20, excludeContentIds = [] } = options;

    // Fetch user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        savedContent: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            content: {
              include: {
                contentTags: {
                  include: { tag: true }
                }
              }
            }
          }
        },
        feeds: {
          include: {
            sources: {
              select: { sourceId: true }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const recommendations: RecommendedContent[] = [];

    // 1. Content from followed sources (high priority)
    const followedSourceIds = user.feeds.flatMap(feed => feed.sources.map(s => s.sourceId));
    if (followedSourceIds.length > 0) {
      const recentFromFollowed = await prisma.content.findMany({
        where: {
          sourceId: { in: followedSourceIds },
          id: { notIn: excludeContentIds },
          publishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        take: Math.ceil(limit * 0.4), // 40% from followed sources
        orderBy: { publishedAt: 'desc' },
        select: { id: true }
      });

      recommendations.push(
        ...recentFromFollowed.map(c => ({
          contentId: c.id,
          score: 0.9,
          reason: 'followed_source' as const
        }))
      );
    }

    // 2. Similar content based on saved/favorited tags
    const userContentTags = user.savedContent
      .flatMap((sc: any) => sc.content.contentTags.map((ct: any) => ct.tag.id));
    const uniqueTagIds = [...new Set(userContentTags)] as string[];

    if (uniqueTagIds.length > 0) {
      const similarContent = await prisma.content.findMany({
        where: {
          id: { notIn: [...excludeContentIds, ...recommendations.map(r => r.contentId)] },
          contentTags: {
            some: {
              tagId: { in: uniqueTagIds.slice(0, 10) } // Top 10 tags
            }
          },
          publishedAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Last 14 days
          }
        },
        take: Math.ceil(limit * 0.3), // 30% similar content
        orderBy: { publishedAt: 'desc' },
        select: { id: true }
      });

      recommendations.push(
        ...similarContent.map(c => ({
          contentId: c.id,
          score: 0.8,
          reason: 'similar' as const
        }))
      );
    }

    // 3. Trending content (most saved/favorited recently)
    const trendingContent = await prisma.content.findMany({
      where: {
        id: { notIn: [...excludeContentIds, ...recommendations.map(r => r.contentId)] },
        publishedAt: {
          gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Last 3 days
        }
      },
      take: Math.ceil(limit * 0.2), // 20% trending
      orderBy: [
        { clickCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      select: { id: true }
    });

    recommendations.push(
      ...trendingContent.map(c => ({
        contentId: c.id,
        score: 0.7,
        reason: 'trending' as const
      }))
    );

    // 4. AI-powered recommendations (if enabled)
    if (aiService.isEnabled && recommendations.length < limit) {
      try {
        const userContentTitles = user.savedContent
          .slice(0, 5)
          .map((sc: any) => sc.content.title);

        const aiSuggestions = await aiService.generateRecommendations(
          userId,
          userContentTitles
        );

        // Note: This is a basic implementation
        // In production, you'd parse AI response and match to actual content IDs
        recommendations.push(
          ...aiSuggestions.slice(0, Math.ceil(limit * 0.1)).map(suggestion => ({
            contentId: suggestion, // Would need proper parsing
            score: 0.6,
            reason: 'ai_suggested' as const
          }))
        );
      } catch (error) {
        console.error('AI recommendations failed:', error);
        // Fail gracefully - continue without AI suggestions
      }
    }

    // Sort by score and limit
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get trending content (public, no user context)
   */
  async getTrending(limit: number = 20): Promise<string[]> {
    const trending = await prisma.content.findMany({
      where: {
        publishedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      take: limit,
      orderBy: [
        { clickCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      select: { id: true }
    });

    return trending.map(c => c.id);
  }

  /**
   * Get similar content based on a specific content item
   */
  async getSimilarContent(contentId: string, limit: number = 10): Promise<string[]> {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        contentTags: {
          select: { tagId: true }
        }
      }
    });

    if (!content) {
      return [];
    }

    const tagIds = content.contentTags.map(ct => ct.tagId);

    if (tagIds.length === 0) {
      // Fallback: same source
      const similar = await prisma.content.findMany({
        where: {
          sourceId: content.sourceId,
          id: { not: contentId },
          publishedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        take: limit,
        orderBy: { publishedAt: 'desc' },
        select: { id: true }
      });

      return similar.map(c => c.id);
    }

    // Find content with matching tags
    const similar = await prisma.content.findMany({
      where: {
        id: { not: contentId },
        contentTags: {
          some: {
            tagId: { in: tagIds }
          }
        }
      },
      take: limit,
      orderBy: { publishedAt: 'desc' },
      select: { id: true, contentTags: true }
    });

    // Score by number of matching tags
    const scored = similar.map(c => {
      const matchCount = c.contentTags.filter(ct => tagIds.includes(ct.tagId)).length;
      return {
        id: c.id,
        score: matchCount / tagIds.length
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .map(s => s.id);
  }

  /**
   * Track user interaction (for future ML models)
   */
  async trackInteraction(userId: string, contentId: string, interactionType: 'view' | 'save' | 'favorite' | 'click') {
    // TODO: Implement interaction tracking
    // This would be used to train ML models or improve recommendations
    // For now, just a placeholder
    console.log(`Track: ${userId} ${interactionType} ${contentId}`);
  }
}

export const recommendationsService = new RecommendationsService();
