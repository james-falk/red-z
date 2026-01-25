/**
 * Analytics Routes
 * 
 * Admin-only endpoints for platform metrics and insights
 */

import { Router } from 'express';
import { analyticsService } from '../services/analytics.service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * GET /api/analytics/metrics
 * Get comprehensive platform metrics
 */
router.get('/metrics', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const metrics = await analyticsService.getPlatformMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/content-timeline
 * Get content publication time series
 * Query params:
 * - days: number (default: 30)
 */
router.get('/content-timeline', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await analyticsService.getContentTimeSeries(days);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/user-growth
 * Get user growth time series
 * Query params:
 * - days: number (default: 30)
 */
router.get('/user-growth', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await analyticsService.getUserGrowthTimeSeries(days);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/engagement
 * Get engagement metrics over time
 * Query params:
 * - days: number (default: 30)
 */
router.get('/engagement', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await analyticsService.getEngagementTimeSeries(days);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
