import prisma from '../db/client';

async function checkThumbnails() {
  console.log('🔍 THUMBNAIL DATA ANALYSIS');
  console.log('═══════════════════════════════════════\n');

  // Total content
  const totalContent = await prisma.content.count();
  console.log(`📦 Total content items: ${totalContent}`);

  // Items with thumbnails
  const withThumbnails = await prisma.content.count({
    where: {
      thumbnailUrl: { not: null }
    }
  });
  console.log(`🖼️  Items with thumbnails: ${withThumbnails}`);
  console.log(`📊 Thumbnail coverage: ${((withThumbnails / totalContent) * 100).toFixed(1)}%\n`);

  // Per-source breakdown
  console.log('📊 PER-SOURCE THUMBNAIL COVERAGE:');
  console.log('═══════════════════════════════════════\n');

  const sources = await prisma.source.findMany({
    where: { isActive: true },
    include: {
      content: {
        select: {
          thumbnailUrl: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  for (const source of sources) {
    const total = source.content.length;
    const withThumb = source.content.filter(c => c.thumbnailUrl).length;
    const percentage = total > 0 ? ((withThumb / total) * 100).toFixed(0) : 0;
    const icon = withThumb > 0 ? '✅' : '❌';
    
    console.log(`${icon} ${source.name}`);
    console.log(`   ${withThumb}/${total} items (${percentage}%)`);
    
    // Show sample thumbnail if exists
    if (withThumb > 0) {
      const sampleUrl = source.content.find(c => c.thumbnailUrl)?.thumbnailUrl;
      if (sampleUrl) {
        console.log(`   Sample: ${sampleUrl.substring(0, 80)}...`);
      }
    }
    console.log('');
  }

  // Sample some items to see what we're getting
  console.log('═══════════════════════════════════════');
  console.log('📸 SAMPLE ITEMS WITH THUMBNAILS:');
  console.log('═══════════════════════════════════════\n');

  const samples = await prisma.content.findMany({
    where: {
      thumbnailUrl: { not: null }
    },
    include: {
      source: {
        select: { name: true }
      }
    },
    take: 5,
    orderBy: { publishedAt: 'desc' }
  });

  samples.forEach((item, i) => {
    console.log(`${i + 1}. ${item.title.substring(0, 60)}...`);
    console.log(`   Source: ${item.source.name}`);
    console.log(`   Thumbnail: ${item.thumbnailUrl}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkThumbnails();
