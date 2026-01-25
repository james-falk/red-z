import prisma from '../db/client';
import { ingestionService } from './ingestion.service';

const GAP_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

export class GapDetectionService {
  /**
   * Check for sources that haven't been ingested recently
   * and trigger a catch-up ingestion if gaps found
   */
  async checkAndHealGaps(): Promise<void> {
    console.log('[GapDetector] 🔍 Checking for data gaps...');
    
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - GAP_THRESHOLD_MS);

    // Find active sources with stale lastIngestedAt
    const staleSources = await prisma.source.findMany({
      where: {
        isActive: true,
        OR: [
          { lastIngestedAt: null },
          { lastIngestedAt: { lt: thresholdDate } }
        ]
      },
      select: { id: true, name: true, lastIngestedAt: true }
    });

    if (staleSources.length === 0) {
      console.log('[GapDetector] ✅ No gaps detected');
      return;
    }

    console.warn(
      `[GapDetector] ⚠️  Found ${staleSources.length} stale source(s):`
    );
    staleSources.forEach(s => {
      const lastIngested = s.lastIngestedAt 
        ? `${Math.round((now.getTime() - s.lastIngestedAt.getTime()) / 60000)} min ago`
        : 'never';
      console.warn(`  - ${s.name}: ${lastIngested}`);
    });

    console.log('[GapDetector] 🩹 Triggering self-healing ingestion...');
    await ingestionService.ingestAllActiveSources();
    console.log('[GapDetector] ✅ Self-healing complete');
  }
}

export const gapDetectionService = new GapDetectionService();
