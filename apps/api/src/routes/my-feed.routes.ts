import { Router, Response } from 'express';
import prisma from '../db/client';
import { contentFiltersSchema } from '@fantasy-red-zone/shared';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Get content from followed sources (My Feed)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Get user's followed sources
    const favorites = await prisma.favoriteSource.findMany({
      where: { userId: req.user!.id },
      select: { sourceId: true }
    });

    const sourceIds = favorites.map(f => f.sourceId);

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
    console.error('Error fetching my feed:', error);
    res.status(500).json({ error: 'Failed to fetch my feed' });
  }
});

export default router;
