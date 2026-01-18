import { Router, Response } from 'express';
import prisma from '../db/client';
import { createFeaturedItemSchema, updateFeaturedItemSchema } from '@fantasy-red-zone/shared';
import { AuthRequest, authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Get featured items
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    
    const featured = await prisma.featuredItem.findMany({
      where: {
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } }
        ]
      },
      orderBy: { rank: 'asc' },
      include: {
        content: {
          include: {
            source: {
              select: {
                id: true,
                name: true,
                logoUrl: true
              }
            },
            savedBy: req.user ? {
              where: { userId: req.user.id },
              select: { id: true }
            } : false
          }
        }
      }
    });

    const data = featured.map(item => ({
      ...item,
      content: {
        ...item.content,
        isSaved: req.user ? item.content.savedBy && (item.content.savedBy as any[]).length > 0 : false,
        savedBy: undefined
      }
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching featured items:', error);
    res.status(500).json({ error: 'Failed to fetch featured items' });
  }
});

// Create featured item (admin only)
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validateRequest(createFeaturedItemSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const featured = await prisma.featuredItem.create({
        data: {
          contentId: req.body.contentId,
          rank: req.body.rank,
          startDate: req.body.startDate ? new Date(req.body.startDate) : null,
          endDate: req.body.endDate ? new Date(req.body.endDate) : null
        },
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

      res.status(201).json(featured);
    } catch (error) {
      console.error('Error creating featured item:', error);
      res.status(500).json({ error: 'Failed to create featured item' });
    }
  }
);

// Update featured item (admin only)
router.patch(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateRequest(updateFeaturedItemSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const updateData: any = {};
      
      if (req.body.rank !== undefined) updateData.rank = req.body.rank;
      if (req.body.startDate !== undefined) {
        updateData.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
      }
      if (req.body.endDate !== undefined) {
        updateData.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
      }

      const featured = await prisma.featuredItem.update({
        where: { id: req.params.id },
        data: updateData,
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

      res.json(featured);
    } catch (error) {
      console.error('Error updating featured item:', error);
      res.status(500).json({ error: 'Failed to update featured item' });
    }
  }
);

// Delete featured item (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.featuredItem.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting featured item:', error);
    res.status(500).json({ error: 'Failed to delete featured item' });
  }
});

export default router;
