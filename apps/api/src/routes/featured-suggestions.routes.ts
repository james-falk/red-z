import { Router, Response } from 'express';
import prisma from '../db/client';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * AI-Powered Featured Content Suggestions
 * 
 * Algorithm:
 * 1. Recency: Content from last 7 days
 * 2. Engagement: High click count relative to age
 * 3. Tag Relevance: Popular fantasy tags (QB, RB, WR, Injury, etc.)
 * 4. Source Quality: Prefer established sources
 * 5. Type Diversity: Balance of articles, videos, podcasts
 * 6. Not Already Featured: Exclude current featured items
 */
router.get('/suggestions', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const daysBack = 7;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - daysBack);

    // Get currently featured content IDs
    const featured = await prisma.featuredItem.findMany({
      select: { contentId: true }
    });
    const featuredIds = featured.map(f => f.contentId);

    // Get popular tags (positions, injury, rankings)
    const popularTagSlugs = ['qb', 'rb', 'wr', 'te', 'injury', 'rankings', 'start-sit', 'draft'];
    const popularTags = await prisma.tag.findMany({
      where: { slug: { in: popularTagSlugs } },
      select: { id: true }
    });
    const popularTagIds = popularTags.map(t => t.id);

    // Fetch recent content with tags
    const candidates = await prisma.content.findMany({
      where: {
        publishedAt: { gte: sevenDaysAgo },
        id: { notIn: featuredIds },
        contentTags: {
          some: {
            tagId: { in: popularTagIds }
          }
        }
      },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        },
        contentTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true
              }
            }
          }
        }
      },
      take: 100,
      orderBy: [
        { clickCount: 'desc' },
        { publishedAt: 'desc' }
      ]
    });

    // Score each candidate
    const scored = candidates.map(content => {
      const ageInHours = (Date.now() - new Date(content.publishedAt).getTime()) / (1000 * 60 * 60);
      const ageInDays = ageInHours / 24;
      
      // Scoring factors
      const recencyScore = Math.max(0, 10 - ageInDays) / 10; // Newer = better (0-1)
      const engagementScore = Math.min(content.clickCount / 50, 1); // Normalize to 0-1
      const tagRelevanceScore = content.contentTags.length / 5; // More tags = more relevant
      const hasVideoBonus = content.type === 'VIDEO' ? 0.2 : 0;
      
      // Weighted score
      const totalScore = 
        (recencyScore * 0.4) +
        (engagementScore * 0.3) +
        (tagRelevanceScore * 0.2) +
        hasVideoBonus +
        (Math.random() * 0.1); // Small randomness for variety

      return {
        content: {
          ...content,
          tags: content.contentTags.map(ct => ct.tag),
          contentTags: undefined
        },
        score: totalScore,
        metrics: {
          recencyScore: Math.round(recencyScore * 100),
          engagementScore: Math.round(engagementScore * 100),
          tagRelevanceScore: Math.round(tagRelevanceScore * 100),
          ageInDays: Math.round(ageInDays * 10) / 10,
          clickCount: content.clickCount
        }
      };
    });

    // Sort by score and diversify by type
    scored.sort((a, b) => b.score - a.score);

    // Take top results with type diversity
    const suggestions = [];
    const typeCounts: Record<string, number> = { ARTICLE: 0, VIDEO: 0, PODCAST: 0 };
    const maxPerType = Math.ceil(limit / 2);

    for (const item of scored) {
      if (suggestions.length >= limit) break;
      
      const type = item.content.type;
      if (typeCounts[type] < maxPerType) {
        suggestions.push(item);
        typeCounts[type]++;
      }
    }

    // Add remaining if we haven't hit limit
    for (const item of scored) {
      if (suggestions.length >= limit) break;
      if (!suggestions.includes(item)) {
        suggestions.push(item);
      }
    }

    res.json(suggestions.slice(0, limit));
  } catch (error) {
    console.error('Error generating featured suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

export default router;
