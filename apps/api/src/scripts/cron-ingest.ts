/**
 * Standalone ingestion script for Render Cron Jobs
 * 
 * This script is designed to run as a scheduled cron job on Render.
 * It does not require the API server to be running.
 * 
 * Usage: node dist/scripts/cron-ingest.js
 * 
 * Environment Variables Required:
 * - DATABASE_URL: PostgreSQL connection string
 * - NEXTAUTH_SECRET: For compatibility (not actively used in this script)
 */

import { ingestionService } from '../services/ingestion.service';
import prisma from '../db/client';

async function runCronIngestion() {
  const startTime = Date.now();
  console.log('========================================');
  console.log('🕐 CRON INGESTION STARTED');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log('========================================\n');

  try {
    await ingestionService.ingestAllActiveSources();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n========================================');
    console.log('✅ CRON INGESTION COMPLETE');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('========================================');
    
    process.exit(0);
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ CRON INGESTION FAILED');
    console.error('========================================');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCronIngestion();
