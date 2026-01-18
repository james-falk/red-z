import prisma from '../db/client.js';

const targetSources = [
  'FantasySP NFL Player News',
  'RotoWire Latest NFL News',
  'Draft Sharks - Shark Bites',
  'Draft Sharks - Injury News'
];

async function verifyNewSources() {
  console.log('📊 PASS/FAIL Table - New Fantasy RSS Sources\n');
  console.log('═'.repeat(120));
  console.log('Source Name'.padEnd(35) + 'Status'.padEnd(10) + 'Items'.padEnd(20) + 'lastIngestedAt'.padEnd(25) + 'lastError');
  console.log('═'.repeat(120));

  for (const sourceName of targetSources) {
    const source = await prisma.source.findFirst({
      where: { name: sourceName }
    });

    if (!source) {
      console.log(`${sourceName.padEnd(35)}NOT FOUND`);
      continue;
    }

    // Get content count
    const contentCount = await prisma.content.count({
      where: { sourceId: source.id }
    });

    const status = source.isActive && source.lastIngestedAt && !source.lastError ? 'PASS ✅' : 'FAIL ❌';
    const items = source.lastIngestedAt ? `${contentCount} total` : 'N/A';
    const lastIngested = source.lastIngestedAt 
      ? source.lastIngestedAt.toISOString().substring(0, 19).replace('T', ' ')
      : 'N/A';
    const lastError = source.lastError 
      ? source.lastError.substring(0, 50) + (source.lastError.length > 50 ? '...' : '')
      : 'None';

    console.log(
      `${sourceName.padEnd(35)}${status.padEnd(10)}${items.padEnd(20)}${lastIngested.padEnd(25)}${lastError}`
    );
  }

  console.log('═'.repeat(120));
  console.log('');

  // Summary stats
  const totalActive = await prisma.source.count({ where: { isActive: true } });
  const totalFantasy = await prisma.source.count({ 
    where: { 
      isActive: true,
      OR: [
        { name: { contains: 'Fantasy' } },
        { name: { contains: 'Draft Sharks' } },
        { name: { contains: 'RotoWire' } }
      ]
    }
  });

  const totalFantasyContent = await prisma.content.count({
    where: {
      source: {
        OR: [
          { name: { contains: 'Fantasy' } },
          { name: { contains: 'Draft Sharks' } },
          { name: { contains: 'RotoWire' } }
        ]
      }
    }
  });

  console.log('📈 Summary:');
  console.log(`   Total active sources: ${totalActive}`);
  console.log(`   Active fantasy sources: ${totalFantasy}`);
  console.log(`   Total fantasy content items: ${totalFantasyContent}`);
}

verifyNewSources().catch(console.error).then(() => process.exit(0));
