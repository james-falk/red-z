import cron from 'node-cron';
import { ingestionService } from './services/ingestion.service';

// Run ingestion every 30 minutes
export function startCronJobs() {
  console.log('Starting cron jobs...');

  // Schedule: every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running scheduled ingestion...');
    try {
      await ingestionService.ingestAllActiveSources();
    } catch (error) {
      console.error('Scheduled ingestion error:', error);
    }
  });

  console.log('Cron jobs started: content ingestion every 30 minutes');
}
