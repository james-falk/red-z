import { ingestionService } from '../services/ingestion.service.js';

async function runIngestion() {
  console.log('Starting manual ingestion...\n');
  await ingestionService.ingestAllActiveSources();
  console.log('\nIngestion complete!');
  process.exit(0);
}

runIngestion().catch((error) => {
  console.error('Ingestion failed:', error);
  process.exit(1);
});
