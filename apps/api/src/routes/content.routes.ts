import { Router, Response } from 'express';
import prisma from '../db/client';
import { contentFiltersSchema } from '@fantasy-red-zone/shared';
import { AuthRequest, optionalAuth, authenticateToken } from '../middleware/auth';

const router = Router();

// Get content with filters and pagination
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const filters = contentFiltersSchema.parse({
      ...req.query,
      limit: req.query.limit ? Number(req.query.limit) : 20
    });

    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.sourceId) {
      where.sourceId = filters.sourceId;
    }

    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } }
      ];
    }

    // Tag filtering: content must have ALL specified tags (AND logic)
    if (filters.tags) {
      const tagSlugs = filters.tags.split(',').map(s => s.trim()).filter(Boolean);
      if (tagSlugs.length > 0) {
        // Find tag IDs from slugs
        const tags = await prisma.tag.findMany({
          where: { slug: { in: tagSlugs } },
          select: { id: true }
        });
        const tagIds = tags.map(t => t.id);

        if (tagIds.length > 0) {
          where.contentTags = {
            some: {
              tagId: { in: tagIds }
            }
          };
        }
      }
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
        savedBy: req.user ? {
          where: { userId: req.user.id },
          select: { id: true }
        } : false
      }
    });

    const hasMore = content.length > filters.limit;
    const items = hasMore ? content.slice(0, -1) : content;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    const data = items.map(item => ({
      ...item,
      tags: item.contentTags.map(ct => ct.tag),
      contentTags: undefined,
      isSaved: req.user ? item.savedBy && (item.savedBy as any[]).length > 0 : false,
      savedBy: undefined
    }));

    res.json({
      data,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Get single content item
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const content = await prisma.content.findUnique({
      where: { id: req.params.id },
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
        },
        savedBy: req.user ? {
          where: { userId: req.user.id },
          select: { id: true }
        } : false
      }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const result = {
      ...content,
      tags: content.contentTags.map(ct => ct.tag),
      contentTags: undefined,
      isSaved: req.user ? content.savedBy && (content.savedBy as any[]).length > 0 : false,
      savedBy: undefined
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Track content click
router.post('/:id/click', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.content.update({
      where: { id: req.params.id },
      data: { clickCount: { increment: 1 } }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

export default router;
