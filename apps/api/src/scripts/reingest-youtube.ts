import prisma from '../db/client';
import { ingestionService } from '../services/ingestion.service';

async function reingestYouTube() {
  console.log('🔄 RE-INGESTING YOUTUBE CHANNELS');
  console.log('═══════════════════════════════════════\n');

  // Get YouTube sources
  const youtubeSources = await prisma.source.findMany({
    where: {
      type: 'YOUTUBE',
      isActive: true
    }
  });

  console.log(`Found ${youtubeSources.length} YouTube source(s)\n`);

  // Delete existing YouTube content to re-ingest
  for (const source of youtubeSources) {
    const deleted = await prisma.content.deleteMany({
      where: { sourceId: source.id }
    });
    console.log(`🗑️  Deleted ${deleted.count} items from: ${source.name}`);
  }

  console.log('\n🚀 Re-ingesting...\n');

  // Re-ingest
  for (const source of youtubeSources) {
    await ingestionService.ingestSource(source.id);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('✅ RE-INGESTION COMPLETE');
  console.log('═══════════════════════════════════════\n');

  // Check thumbnails
  for (const source of youtubeSources) {
    const content = await prisma.content.findMany({
      where: { sourceId: source.id },
      select: {
        title: true,
        thumbnailUrl: true
      },
      take: 3
    });

    console.log(`📹 ${source.name}:`);
    content.forEach((item, i) => {
      const hasThumb = item.thumbnailUrl ? '✅' : '❌';
      console.log(`   ${hasThumb} ${item.title.substring(0, 50)}...`);
      if (item.thumbnailUrl) {
        console.log(`      ${item.thumbnailUrl}`);
      }
    });
    console.log('');
  }

  await prisma.$disconnect();
}

reingestYouTube();
