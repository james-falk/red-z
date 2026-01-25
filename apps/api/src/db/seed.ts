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

  // Fantasy Football Sources ONLY - No placeholders!
  const sources = [
    // === FANTASY RSS FEEDS ===
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
      description: 'DraftSharks quick fantasy news blurbs',
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
    // DISABLED: FantasyPros RSS returns invalid XML
    // {
    //   name: 'FantasyPros NFL News',
    //   type: SourceType.RSS,
    //   feedUrl: 'https://www.fantasypros.com/rss/nfl-news.xml',
    //   websiteUrl: 'https://www.fantasypros.com',
    //   description: 'FantasyPros NFL fantasy news feed',
    //   isActive: false
    // },
    {
      name: 'Pro Football Talk',
      type: SourceType.RSS,
      feedUrl: 'https://profootballtalk.nbcsports.com/feed/',
      websiteUrl: 'https://profootballtalk.nbcsports.com',
      description: 'NBC Sports Pro Football Talk (fantasy-relevant NFL news)',
      isActive: true
    },
    {
      name: '4for4 Fantasy Football',
      type: SourceType.RSS,
      feedUrl: 'https://www.4for4.com/rss.xml',
      websiteUrl: 'https://www.4for4.com',
      description: '4for4 fantasy football analysis and news',
      isActive: true
    },
    
    // === YOUTUBE CHANNELS ===
    {
      name: 'Underdog Fantasy - Josh & Hayden',
      type: SourceType.YOUTUBE,
      feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC7fnz7139CGSdtHWaPMCpIw',
      websiteUrl: 'https://www.youtube.com/channel/UC7fnz7139CGSdtHWaPMCpIw',
      description: 'Underdog Fantasy analysis and picks from Josh & Hayden',
      isActive: true
    },
    {
      name: 'The Fantasy Football Fellas',
      type: SourceType.YOUTUBE,
      feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCItKyZGyIYr1vJxCrL5M3Yg',
      websiteUrl: 'https://www.youtube.com/channel/UCItKyZGyIYr1vJxCrL5M3Yg',
      description: 'Fantasy football analysis, rankings, and draft strategies',
      isActive: true
    },
    {
      name: 'Fantasy Football Today',
      type: SourceType.YOUTUBE,
      feedUrl: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCviK78rIWXhZdFzJ1Woi7Fg',
      websiteUrl: 'https://www.youtube.com/channel/UCviK78rIWXhZdFzJ1Woi7Fg',
      description: 'CBS Sports fantasy football podcast and analysis',
      isActive: true
    }
  ];

  console.log(`🌱 Seeding ${sources.length} fantasy football sources (${sources.filter(s => s.type === 'RSS').length} RSS + ${sources.filter(s => s.type === 'YOUTUBE').length} YouTube)...\n`);

  for (const sourceData of sources) {
    try {
      const source = await prisma.source.upsert({
        where: { feedUrl: sourceData.feedUrl },
        update: {
          name: sourceData.name,
          description: sourceData.description,
          isActive: sourceData.isActive
        },
        create: sourceData
      });
      console.log(`  ✓ ${source.name} (${source.type})`);
    } catch (error) {
      console.error(`  ✗ Failed to seed ${sourceData.name}:`, error);
    }
  }

  console.log('\n🎉 Seeding complete!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('  1. Run backfill: pnpm exec tsx src/scripts/backfill-content.ts');
  console.log('  2. Check results: SELECT COUNT(*) FROM "Content";');
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
