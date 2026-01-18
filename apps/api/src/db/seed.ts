import prisma from './client.js';
import { SourceType, ContentType } from '@fantasy-red-zone/shared';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin user if ADMIN_EMAIL is set
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN' },
      create: {
        email: adminEmail,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
    console.log(`✅ Admin user created/updated: ${adminUser.email}`);
  }

  // Create sources with working fantasy sources active
  // Placeholders can be disabled for production if desired
  const sources = [
    // === WORKING FANTASY SOURCES (4) ===
    {
      name: 'FantasySP NFL News',
      type: SourceType.RSS,
      feedUrl: 'https://www.fantasysp.com/rss/nfl/fantasysp/',
      websiteUrl: 'https://www.fantasysp.com',
      description: 'FantasySP NFL fantasy news feed',
      isActive: true
    },
    {
      name: 'RotoWire Latest NFL News',
      type: SourceType.RSS,
      feedUrl: 'https://www.rotowire.com/rss/news.php?sport=NFL',
      websiteUrl: 'https://www.rotowire.com',
      description: 'RotoWire NFL player/news updates (fantasy relevant)',
      isActive: true
    },
    {
      name: 'Draft Sharks - Shark Bites',
      type: SourceType.RSS,
      feedUrl: 'https://www.draftsharks.com/rss/shark-bites',
      websiteUrl: 'https://www.draftsharks.com',
      description: 'DraftSharks quick fantasy news blurbs (Shark Bites)',
      isActive: true
    },
    {
      name: 'Draft Sharks - Injury News',
      type: SourceType.RSS,
      feedUrl: 'https://www.draftsharks.com/rss/injury-news',
      websiteUrl: 'https://www.draftsharks.com',
      description: 'DraftSharks NFL injury news feed',
      isActive: true
    },
    // === PLACEHOLDER SOURCES (for testing, can disable for prod) ===
    {
      name: 'ESPN Top Headlines',
      type: SourceType.RSS,
      feedUrl: 'https://www.espn.com/espn/rss/news',
      websiteUrl: 'https://www.espn.com',
      description: 'ESPN sports news (placeholder for testing)',
      isActive: true  // Set to false if you want fantasy-only content
    },
    {
      name: 'Hacker News',
      type: SourceType.RSS,
      feedUrl: 'https://hnrss.org/frontpage',
      websiteUrl: 'https://news.ycombinator.com',
      description: 'HN front page (placeholder for testing)',
      isActive: true  // Set to false if you want fantasy-only content
    }
  ];

  console.log(`🌱 Seeding ${sources.length} sources (4 fantasy + 2 placeholders)...`);

  for (const sourceData of sources) {
    const source = await prisma.source.upsert({
      where: { feedUrl: sourceData.feedUrl },
      update: {
        name: sourceData.name,
        description: sourceData.description,
        isActive: sourceData.isActive
      },
      create: sourceData
    });
    console.log(`  ✓ ${source.name} (${source.isActive ? 'active' : 'inactive'})`);
  }

  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('  1. Run ingestion: pnpm ingest (or POST /ingest/run as admin)');
  console.log('  2. Check sources: SELECT id, name, "lastIngestedAt", "lastError" FROM "Source";');
  console.log('  3. View content: SELECT COUNT(*) FROM "Content";');
  console.log('  4. Add real fantasy sources via admin UI or POST /sources');
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
