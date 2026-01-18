import { Router, Response } from 'express';
import prisma from '../db/client';
import { createFeedSchema, contentFiltersSchema } from '@fantasy-red-zone/shared';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Get user's feeds
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const feeds = await prisma.feed.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sources: true }
        }
      }
    });

    res.json(feeds);
  } catch (error) {
    console.error('Error fetching feeds:', error);
    res.status(500).json({ error: 'Failed to fetch feeds' });
  }
});

// Create feed
router.post(
  '/',
  authenticateToken,
  validateRequest(createFeedSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const feed = await prisma.feed.create({
        data: {
          userId: req.user!.id,
          name: req.body.name
        }
      });

      res.status(201).json(feed);
    } catch (error) {
      console.error('Error creating feed:', error);
      res.status(500).json({ error: 'Failed to create feed' });
    }
  }
);

// Add source to feed
router.post('/:feedId/sources/:sourceId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Verify feed ownership
    const feed = await prisma.feed.findFirst({
      where: {
        id: req.params.feedId,
        userId: req.user!.id
      }
    });

    if (!feed) {
      return res.status(404).json({ error: 'Feed not found' });
    }

    const feedSource = await prisma.feedSource.create({
      data: {
        feedId: req.params.feedId,
        sourceId: req.params.sourceId
      }
    });

    res.status(201).json(feedSource);
  } catch (error) {
    console.error('Error adding source to feed:', error);
    res.status(500).json({ error: 'Failed to add source to feed' });
  }
});

// Remove source from feed
router.delete('/:feedId/sources/:sourceId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Verify feed ownership
    const feed = await prisma.feed.findFirst({
      where: {
        id: req.params.feedId,
        userId: req.user!.id
      }
    });

    if (!feed) {
      return res.status(404).json({ error: 'Feed not found' });
    }

    await prisma.feedSource.deleteMany({
      where: {
        feedId: req.params.feedId,
        sourceId: req.params.sourceId
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error removing source from feed:', error);
    res.status(500).json({ error: 'Failed to remove source from feed' });
  }
});

// Get content for a specific feed
router.get('/:feedId/content', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Verify feed ownership
    const feed = await prisma.feed.findFirst({
      where: {
        id: req.params.feedId,
        userId: req.user!.id
      },
      include: {
        sources: {
          select: { sourceId: true }
        }
      }
    });

    if (!feed) {
      return res.status(404).json({ error: 'Feed not found' });
    }

    const sourceIds = feed.sources.map(s => s.sourceId);

    if (sourceIds.length === 0) {
      return res.json({ data: [], nextCursor: undefined, hasMore: false });
    }

    const filters = contentFiltersSchema.parse({
      ...req.query,
      limit: req.query.limit ? Number(req.query.limit) : 20
    });

    const where: any = {
      sourceId: { in: sourceIds }
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } }
      ];
    }

    if (filters.cursor) {
      where.id = { lt: filters.cursor };
    }

    const orderBy: any = filters.sort === 'popular'
      ? { clickCount: 'desc' }
      : { publishedAt: 'desc' };

    const content = await prisma.content.findMany({
      where,
      orderBy,
      take: filters.limit + 1,
      include: {
        source: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        },
        savedBy: {
          where: { userId: req.user!.id },
          select: { id: true }
        }
      }
    });

    const hasMore = content.length > filters.limit;
    const items = hasMore ? content.slice(0, -1) : content;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    const data = items.map(item => ({
      ...item,
      isSaved: item.savedBy && (item.savedBy as any[]).length > 0,
      savedBy: undefined
    }));

    res.json({
      data,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching feed content:', error);
    res.status(500).json({ error: 'Failed to fetch feed content' });
  }
});

export default router;
