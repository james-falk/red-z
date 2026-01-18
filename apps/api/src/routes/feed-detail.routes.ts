import { Router, Response } from 'express';
import prisma from '../db/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Get feed details
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const feed = await prisma.feed.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      include: {
        _count: {
          select: { sources: true }
        }
      }
    });

    if (!feed) {
      return res.status(404).json({ error: 'Feed not found' });
    }

    res.json(feed);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// Get sources in a feed
router.get('/:id/sources', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const feed = await prisma.feed.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id
      },
      include: {
        sources: {
          include: {
            source: true
          }
        }
      }
    });

    if (!feed) {
      return res.status(404).json({ error: 'Feed not found' });
    }

    res.json(feed.sources.map(fs => fs.source));
  } catch (error) {
    console.error('Error fetching feed sources:', error);
    res.status(500).json({ error: 'Failed to fetch feed sources' });
  }
});

export default router;
