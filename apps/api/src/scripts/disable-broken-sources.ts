import prisma from '../db/client.js';

async function disableBrokenSources() {
  console.log('🔍 Finding sources with errors...\n');
  
  // Find sources with errors
  const brokenSources = await prisma.source.findMany({
    where: { lastError: { not: null } },
    select: {
      id: true,
      name: true,
      feedUrl: true,
      isActive: true,
      lastError: true
    }
  });

  if (brokenSources.length === 0) {
    console.log('✅ No broken sources found!');
    return;
  }

  console.log(`Found ${brokenSources.length} broken source(s):\n`);
  
  for (const source of brokenSources) {
    console.log(`❌ ${source.name}`);
    console.log(`   URL: ${source.feedUrl}`);
    console.log(`   Error: ${source.lastError?.substring(0, 100)}...`);
    console.log(`   Active: ${source.isActive}\n`);
  }

  // Disable them
  console.log('🔧 Disabling broken sources...\n');
  
  const result = await prisma.source.updateMany({
    where: { lastError: { not: null } },
    data: { isActive: false }
  });

  console.log(`✅ Disabled ${result.count} source(s)\n`);

  // Verify
  const activeCount = await prisma.source.count({
    where: { isActive: true }
  });

  console.log(`📊 Active sources remaining: ${activeCount}`);
  
  process.exit(0);
}

disableBrokenSources().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
