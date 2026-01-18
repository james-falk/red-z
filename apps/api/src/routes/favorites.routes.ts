import { Router, Response } from 'express';
import prisma from '../db/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Get followed sources
router.get('/sources', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await prisma.favoriteSource.findMany({
      where: { userId: req.user!.id },
      include: {
        source: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(favorites.map(f => f.source));
  } catch (error) {
    console.error('Error fetching favorite sources:', error);
    res.status(500).json({ error: 'Failed to fetch favorite sources' });
  }
});

// Follow a source
router.post('/sources/:sourceId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const favorite = await prisma.favoriteSource.create({
      data: {
        userId: req.user!.id,
        sourceId: req.params.sourceId
      }
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error('Error following source:', error);
    res.status(500).json({ error: 'Failed to follow source' });
  }
});

// Unfollow a source
router.delete('/sources/:sourceId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.favoriteSource.deleteMany({
      where: {
        userId: req.user!.id,
        sourceId: req.params.sourceId
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error unfollowing source:', error);
    res.status(500).json({ error: 'Failed to unfollow source' });
  }
});

export default router;
