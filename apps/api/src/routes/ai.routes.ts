/**
 * AI Chat Routes
 * 
 * Endpoints for AI-powered chat and question answering
 */

import { Router } from 'express';
import { aiService } from '../services/ai';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/ai/chat
 * Send a message to the AI assistant
 * 
 * Body:
 * {
 *   message: string;
 *   context?: {
 *     contentIds?: string[];
 *     playerNames?: string[];
 *     teamNames?: string[];
 *   };
 * }
 */
router.post('/chat', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    if (!aiService.isEnabled) {
      return res.status(503).json({
        error: 'AI features are not enabled',
        message: 'AI_ENABLED is set to false or no API keys are configured'
      });
    }

    const { message, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'message field is required'
      });
    }

    const response = await aiService.answerFantasyQuestion({
      userMessage: message,
      context: {
        userId: req.user!.id,
        ...context
      }
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/status
 * Check AI service status and available providers
 */
router.get('/status', async (req, res, next) => {
  try {
    const health = await aiService.checkHealth();
    
    res.json({
      enabled: aiService.isEnabled,
      availableProviders: aiService.availableProviders,
      health
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/suggest-tags
 * Get AI-suggested tags for content (admin only)
 */
router.post('/suggest-tags', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    if (!aiService.isEnabled) {
      return res.status(503).json({
        error: 'AI features are not enabled'
      });
    }

    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'title and description are required'
      });
    }

    const tags = await aiService.suggestTags(title, description);

    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

export default router;
