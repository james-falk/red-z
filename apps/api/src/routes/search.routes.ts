import { Router, Response } from 'express';
import prisma from '../db/client';
import { advancedSearchSchema } from '@fantasy-red-zone/shared';
import { AuthRequest, optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * Advanced Search Endpoint
 * POST /search/advanced
 * 
 * Supports:
 * - Full-text search across title and description
 * - Multiple tag filtering with AND/OR logic
 * - Multiple source filtering
 * - Content type filtering
 * - Date range filtering
 * - Multiple sort options (recent, popular, relevance)
 */
router.post('/advanced', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const filters = advancedSearchSchema.parse(req.body);
    
    const where: any = {};
    const orderByOptions: any[] = [];

    // Text search
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } }
      ];
    }

    // Tag filtering
    if (filters.tags && filters.tags.length > 0) {
      // Find tag IDs from slugs
      const tags = await prisma.tag.findMany({
        where: { slug: { in: filters.tags } },
        select: { id: true }
      });
      const tagIds = tags.map(t => t.id);

      if (tagIds.length > 0) {
        if (filters.tagMatchMode === 'all') {
          // AND logic: Content must have ALL specified tags
          // We'll filter in post-processing since Prisma doesn't support this directly
          where.contentTags = {
            some: {
              tagId: { in: tagIds }
            }
          };
        } else {
          // OR logic (default): Content must have ANY of the specified tags
          where.contentTags = {
            some: {
              tagId: { in: tagIds }
            }
          };
        }
      }
    }

    // Source filtering
    if (filters.sources && filters.sources.length > 0) {
      where.sourceId = { in: filters.sources };
    }

    // Content type filtering
    if (filters.contentTypes && filters.contentTypes.length > 0) {
      where.type = { in: filters.contentTypes };
    }

    // Date range filtering
    if (filters.dateFrom || filters.dateTo) {
      where.publishedAt = {};
      if (filters.dateFrom) {
        where.publishedAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.publishedAt.lte = new Date(filters.dateTo);
      }
    }

    // Cursor pagination
    if (filters.cursor) {
      where.id = { lt: filters.cursor };
    }

    // Sorting
    if (filters.sort === 'popular') {
      orderByOptions.push({ clickCount: 'desc' });
    } else if (filters.sort === 'relevance' && filters.query) {
      // For relevance, prioritize title matches over description matches
      // Prisma doesn't support relevance scoring natively, so we sort by recency as fallback
      orderByOptions.push({ publishedAt: 'desc' });
    } else {
      // Default: recent
      orderByOptions.push({ publishedAt: 'desc' });
    }

    // Execute query
    let content = await prisma.content.findMany({
      where,
      orderBy: orderByOptions,
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

    // Post-process for AND tag logic
    if (filters.tagMatchMode === 'all' && filters.tags && filters.tags.length > 0) {
      const requiredTagCount = filters.tags.length;
      content = content.filter(item => {
        const itemTagSlugs = item.contentTags.map(ct => ct.tag.slug);
        const matchCount = filters.tags!.filter(slug => itemTagSlugs.includes(slug)).length;
        return matchCount === requiredTagCount;
      });
    }

    // Format response
    const hasMore = content.length > filters.limit;
    const items = hasMore ? content.slice(0, -1) : content;
    const nextCursor = hasMore ? items[items.length - 1].id : undefined;

    const data = items.map(item => ({
      ...item,
      tags: item.contentTags.map(ct => ct.tag),
      isSaved: req.user ? (item.savedBy && Array.isArray(item.savedBy) ? item.savedBy.length > 0 : false) : false
    }));

    res.json({
      data,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('Error in advanced search:', error);
    res.status(500).json({ error: 'Failed to perform advanced search' });
  }
});

export default router;
