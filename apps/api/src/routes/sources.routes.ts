import { Router, Response } from 'express';
import prisma from '../db/client';
import { createSourceSchema, updateSourceSchema } from '@fantasy-red-zone/shared';
import { AuthRequest, authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Get all sources
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { name: 'asc' },
      include: {
        favoriteSource: req.user ? {
          where: { userId: req.user.id },
          select: { id: true }
        } : false,
        _count: {
          select: { content: true }
        }
      }
    });

    const data = sources.map(source => ({
      ...source,
      isFollowed: req.user ? source.favoriteSource && (source.favoriteSource as any[]).length > 0 : false,
      favoriteSource: undefined
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// Create source (admin only)
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validateRequest(createSourceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const source = await prisma.source.create({
        data: req.body
      });

      res.status(201).json(source);
    } catch (error) {
      console.error('Error creating source:', error);
      res.status(500).json({ error: 'Failed to create source' });
    }
  }
);

// Update source (admin only)
router.patch(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateRequest(updateSourceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const source = await prisma.source.update({
        where: { id: req.params.id },
        data: req.body
      });

      res.json(source);
    } catch (error) {
      console.error('Error updating source:', error);
      res.status(500).json({ error: 'Failed to update source' });
    }
  }
);

export default router;
