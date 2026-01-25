/**
 * Recommendations Routes
 * 
 * Endpoints for personalized content recommendations
 */

import { Router } from 'express';
import { recommendationsService } from '../services/recommendations.service';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../db/client';

const router = Router();

/**
 * GET /api/recommendations/for-you
 * Get personalized recommendations for the authenticated user
 * 
 * Query params:
 * - limit: number (default: 20)
 */
router.get('/for-you', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const exclude = req.query.exclude ? (req.query.exclude as string).split(',') : [];

    const recommendations = await recommendationsService.getRecommendations({
      userId: req.user!.id,
      limit,
      excludeContentIds: exclude
    });

    // Fetch full content details
    const contentIds = recommendations.map(r => r.contentId);
    const content = await prisma.content.findMany({
      where: { id: { in: contentIds } },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            websiteUrl: true
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
      }
    });

    // Merge recommendations with content, preserving order and adding reason
    const results = recommendations.map(rec => {
      const item = content.find(c => c.id === rec.contentId);
      if (!item) return null;

      return {
        ...item,
        tags: item.contentTags.map(ct => ct.tag),
        recommendationReason: rec.reason,
        recommendationScore: rec.score
      };
    }).filter(Boolean);

    res.json({
      results,
      total: results.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/recommendations/trending
 * Get trending content (public)
 * 
 * Query params:
 * - limit: number (default: 20)
 */
router.get('/trending', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const contentIds = await recommendationsService.getTrending(limit);

    const content = await prisma.content.findMany({
      where: { id: { in: contentIds } },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            websiteUrl: true
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
        },
        savedBy: {
          select: { id: true }
        }
      },
      orderBy: {
        clickCount: 'desc'
      }
    });

    const results = content.map(item => ({
      ...item,
      tags: item.contentTags.map((ct: any) => ct.tag),
      savesCount: item.savedBy.length
    }));

    res.json({
      results,
      total: results.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/recommendations/similar/:contentId
 * Get similar content based on a specific content item
 * 
 * Query params:
 * - limit: number (default: 10)
 */
router.get('/similar/:contentId', async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const similarIds = await recommendationsService.getSimilarContent(contentId, limit);

    const content = await prisma.content.findMany({
      where: { id: { in: similarIds } },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            websiteUrl: true
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
      }
    });

    // Preserve order from similarIds
    const results = similarIds.map(id => {
      const item = content.find(c => c.id === id);
      if (!item) return null;
      return {
        ...item,
        tags: item.contentTags.map(ct => ct.tag)
      };
    }).filter(Boolean);

    res.json({
      results,
      total: results.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/recommendations/track
 * Track user interaction with content (for ML)
 */
router.post('/track', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { contentId, interactionType } = req.body;

    if (!contentId || !interactionType) {
      return res.status(400).json({
        error: 'contentId and interactionType are required'
      });
    }

    if (!['view', 'save', 'favorite', 'click'].includes(interactionType)) {
      return res.status(400).json({
        error: 'Invalid interactionType'
      });
    }

    await recommendationsService.trackInteraction(
      req.user!.id,
      contentId,
      interactionType
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
