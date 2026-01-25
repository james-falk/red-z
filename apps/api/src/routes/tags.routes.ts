import { Router, Response } from 'express';
import prisma from '../db/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get all tags with counts
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { contentTags: true }
        }
      }
    });

    const data = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      type: tag.type,
      count: tag._count.contentTags
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Get popular tags (most used)
router.get('/popular', async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { contentTags: true }
        }
      }
    });

    // Sort by count and take top N
    const popularTags = tags
      .map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        type: tag.type,
        count: tag._count.contentTags
      }))
      .filter(tag => tag.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    res.json(popularTags);
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    res.status(500).json({ error: 'Failed to fetch popular tags' });
  }
});

export default router;
