import { Router, Response } from 'express';
import prisma from '../db/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Get saved content
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const cursor = req.query.cursor as string | undefined;

    const where: any = { userId: req.user!.id };
    if (cursor) {
      where.id = { lt: cursor };
    }

    const saved = await prisma.savedContent.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        content: {
          include: {
            source: {
              select: {
                id: true,
                name: true,
                logoUrl: true
              }
            }
          }
        }
      }
    });

    const hasMore = saved.length > limit;
    const items = hasMore ? saved.slice(0, -1) : saved;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    res.json({
      data: items.map(s => ({ ...s.content, isSaved: true })),
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching saved content:', error);
    res.status(500).json({ error: 'Failed to fetch saved content' });
  }
});

// Save content
router.post('/:contentId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const saved = await prisma.savedContent.create({
      data: {
        userId: req.user!.id,
        contentId: req.params.contentId
      }
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// Unsave content
router.delete('/:contentId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.savedContent.deleteMany({
      where: {
        userId: req.user!.id,
        contentId: req.params.contentId
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error unsaving content:', error);
    res.status(500).json({ error: 'Failed to unsave content' });
  }
});

export default router;
