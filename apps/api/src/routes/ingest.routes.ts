import { Router, Response } from 'express';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import { ingestionService } from '../services/ingestion.service';

const router = Router();

// Manual trigger for content ingestion (admin only)
router.post('/run', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Run ingestion asynchronously
    ingestionService.ingestAllActiveSources().catch(err => {
      console.error('Background ingestion error:', err);
    });

    res.json({ message: 'Ingestion started' });
  } catch (error) {
    console.error('Error starting ingestion:', error);
    res.status(500).json({ error: 'Failed to start ingestion' });
  }
});

export default router;
