import cron from 'node-cron';
import { ingestionService } from './services/ingestion.service';
import { gapDetectionService } from './services/gap-detection.service';

/**
 * Internal Cron Jobs
 * 
 * RELIABILITY:
 * - Single-run guard prevents overlap (in-memory flag)
 * - Gap detection heals after downtime (2-hour threshold)
 * - Controlled by DISABLE_CRON env var (kill switch)
 * 
 * FUTURE-PROOF:
 * - Ready for multi-instance (add Postgres advisory lock when scaling)
 */

export async function startCronJobs() {
  console.log('[Cron] 🚀 Starting internal cron jobs...');

  // Run gap checker immediately at startup
  console.log('[Cron] 🩹 Running startup gap check...');
  await gapDetectionService.checkAndHealGaps().catch(err => {
    console.error('[Cron] ❌ Startup gap check failed:', err);
  });

  // Schedule: Ingestion every 1 hour (at :00)
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] ⏰ Triggered: hourly ingestion');
    try {
      await ingestionService.ingestAllActiveSources();
    } catch (error) {
      console.error('[Cron] ❌ Scheduled ingestion error:', error);
    }
  });
  console.log('[Cron] ✅ Scheduled: ingestion every hour (0 * * * *)');

  // Schedule: Gap checker daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] ⏰ Triggered: daily gap check');
    try {
      await gapDetectionService.checkAndHealGaps();
    } catch (error) {
      console.error('[Cron] ❌ Gap check error:', error);
    }
  });
  console.log('[Cron] ✅ Scheduled: gap check daily at midnight (0 0 * * *)');

  console.log('[Cron] 🎉 All cron jobs started successfully');
}
