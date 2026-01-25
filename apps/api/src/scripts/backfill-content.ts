/**
 * Backfill Content Script
 * 
 * Runs ingestion to fetch historical content from all active sources.
 * Use after resetting database or adding new sources.
 * 
 * Usage: pnpm exec tsx src/scripts/backfill-content.ts
 */

import { ingestionService } from '../services/ingestion.service';
import prisma from '../db/client';

async function backfillContent() {
  const startTime = Date.now();
  
  console.log('🔄 CONTENT BACKFILL SCRIPT');
  console.log('========================================');
  console.log(`📅 Started: ${new Date().toISOString()}`);
  console.log('========================================\n');

  try {
    // Show what we're about to ingest
    const sources = await prisma.source.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Found ${sources.length} active source(s):\n`);
    sources.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name} (${s.type})`);
    });
    console.log('');

    // Count content before
    const contentBefore = await prisma.content.count();
    console.log(`📦 Current content count: ${contentBefore}\n`);

    // Run ingestion
    console.log('🚀 Starting ingestion...\n');
    await ingestionService.ingestAllActiveSources();

    // Count content after
    const contentAfter = await prisma.content.count();
    const newItems = contentAfter - contentBefore;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n========================================');
    console.log('✅ BACKFILL COMPLETE');
    console.log('========================================');
    console.log(`📦 Content before: ${contentBefore}`);
    console.log(`📦 Content after: ${contentAfter}`);
    console.log(`📈 New items: ${newItems}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('========================================\n');

    // Show per-source results
    console.log('📊 Per-source results:\n');
    const sourcesWithStats = await prisma.source.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { content: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    sourcesWithStats.forEach(s => {
      const status = s.lastError ? '❌' : '✅';
      const lastIngested = s.lastIngestedAt 
        ? new Date(s.lastIngestedAt).toLocaleString()
        : 'Never';
      console.log(`   ${status} ${s.name}`);
      console.log(`      Items: ${s._count.content}`);
      console.log(`      Last ingested: ${lastIngested}`);
      if (s.lastError) {
        console.log(`      Error: ${s.lastError.substring(0, 100)}...`);
      }
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ BACKFILL FAILED');
    console.error('========================================');
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backfillContent();
