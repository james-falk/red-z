import prisma from './client.js';
import { SourceType, ContentType, TagType } from '@fantasy-red-zone/shared';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate favicon URL from website URL using Google's service
 */
function getFaviconUrl(websiteUrl: string): string {
  try {
    const domain = new URL(websiteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=fantasyfootball.com&sz=64`;
  }
}

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
    {
      name: 'Pro Football Focus',
      type: SourceType.RSS,
      feedUrl: 'https://www.pff.com/feed',
      websiteUrl: 'https://www.pff.com',
      description: 'Pro Football Focus',
      isActive: true
    },
    {
      name: 'Fantasy Football Analytics',
      type: SourceType.RSS,
      feedUrl: 'https://fantasyfootballanalytics.net/feed',
      websiteUrl: 'https://fantasyfootballanalytics.net',
      description: 'Fantasy Football Analytics',
      isActive: true
    },
    {
      name: 'Walter Football',
      type: SourceType.RSS,
      feedUrl: 'https://walterfootball.com/rss.xml',
      websiteUrl: 'https://walterfootball.com',
      description: 'WalterFootball.com',
      isActive: true
    },
    {
      name: 'FFToday News',
      type: SourceType.RSS,
      feedUrl: 'https://www.fftoday.com/rss/news.xml',
      websiteUrl: 'https://www.fftoday.com',
      description: 'FFToday: Fantasy Football News',
      isActive: true
    },
    {
      name: 'Dynasty League Football',
      type: SourceType.RSS,
      feedUrl: 'https://dynastyleaguefootball.com/feed/',
      websiteUrl: 'https://dynastyleaguefootball.com',
      description: 'Dynasty League Football',
      isActive: true
    },
    {
      name: 'Dynasty Nerds',
      type: SourceType.RSS,
      feedUrl: 'https://www.dynastynerds.com/feed/',
      websiteUrl: 'https://www.dynastynerds.com',
      description: 'Dynasty Nerds',
      isActive: true
    },
    {
      name: 'RotoViz',
      type: SourceType.RSS,
      feedUrl: 'https://www.rotoviz.com/feed/',
      websiteUrl: 'https://www.rotoviz.com',
      description: 'RotoViz',
      isActive: true
    },
    {
      name: 'Player Profiler',
      type: SourceType.RSS,
      feedUrl: 'https://www.playerprofiler.com/feed/',
      websiteUrl: 'https://www.playerprofiler.com',
      description: 'PlayerProfiler',
      isActive: true
    },
    {
      name: 'Apex Fantasy Leagues',
      type: SourceType.RSS,
      feedUrl: 'https://apexfantasyleagues.com/feed/',
      websiteUrl: 'https://apexfantasyleagues.com',
      description: 'Apex Fantasy Football Money Leagues',
      isActive: true
    },
    {
      name: 'Dynasty Football Factory',
      type: SourceType.RSS,
      feedUrl: 'https://dynastyfootballfactory.com/feed/',
      websiteUrl: 'https://dynastyfootballfactory.com',
      description: 'Dynasty Football Factory',
      isActive: true
    },
    {
      name: 'Fantasy Football Counselor',
      type: SourceType.RSS,
      feedUrl: 'https://thefantasyfootballcounselor.com/category/fantasy-football-101/feed/',
      websiteUrl: 'https://thefantasyfootballcounselor.com',
      description: 'Fantasy Football 101: How to Win Fantasy Football',
      isActive: true
    },
    {
      name: 'UTH Dynasty',
      type: SourceType.RSS,
      feedUrl: 'https://uthdynasty.com/feed/',
      websiteUrl: 'https://uthdynasty.com',
      description: 'UTHDynasty.com',
      isActive: true
    },
    {
      name: 'The IDP Guru',
      type: SourceType.RSS,
      feedUrl: 'https://feeds.feedburner.com/theIdpGuru',
      websiteUrl: 'https://feeds.feedburner.com',
      description: 'The IDP Guru',
      isActive: true
    },
    {
      name: 'Fantasy Football Guidebook',
      type: SourceType.RSS,
      feedUrl: 'http://fantasyfootballguidebook.blogspot.com/feeds/posts/default?alt=rss',
      websiteUrl: 'http://fantasyfootballguidebook.blogspot.com',
      description: 'Fantasy Football Guidebook',
      isActive: true
    },
    {
      name: 'Dynasty Trade Calculator',
      type: SourceType.RSS,
      feedUrl: 'https://dynastytradecalculator.com/feed/',
      websiteUrl: 'https://dynastytradecalculator.com',
      description: 'Dynasty Trade Calculator',
      isActive: true
    },
    {
      name: 'Cheat Sheet War Room',
      type: SourceType.RSS,
      feedUrl: 'https://www.cheatsheetwarroom.com/blog/feed',
      websiteUrl: 'https://www.cheatsheetwarroom.com',
      description: 'Cheat Sheet War Room',
      isActive: true
    },
    {
      name: 'The Football Girl',
      type: SourceType.RSS,
      feedUrl: 'http://thefootballgirl.com/fantasy/feed/',
      websiteUrl: 'http://thefootballgirl.com',
      description: 'Fantasy Archives | The Football Girl',
      isActive: true
    },
    {
      name: 'Fantasy Fools',
      type: SourceType.RSS,
      feedUrl: 'http://fantasy-fools.blogspot.com/feeds/posts/default?alt=rss',
      websiteUrl: 'http://fantasy-fools.blogspot.com',
      description: 'Fantasy Fools',
      isActive: true
    },
    {
      name: 'Fantasy Knuckleheads',
      type: SourceType.RSS,
      feedUrl: 'https://fantasyknuckleheads.com/feed/',
      websiteUrl: 'https://fantasyknuckleheads.com',
      description: 'Fantasy Knuckleheads',
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
      // Auto-generate logoUrl from websiteUrl if not provided
      const dataWithLogo = {
        ...sourceData,
        logoUrl: sourceData.logoUrl || getFaviconUrl(sourceData.websiteUrl)
      };
      
      const source = await prisma.source.upsert({
        where: { feedUrl: sourceData.feedUrl },
        update: {
          name: dataWithLogo.name,
          description: dataWithLogo.description,
          logoUrl: dataWithLogo.logoUrl,
          isActive: dataWithLogo.isActive
        },
        create: dataWithLogo
      });
      console.log(`  ✓ ${source.name} (${source.type})`);
    } catch (error) {
      console.error(`  ✗ Failed to seed ${sourceData.name}:`, error);
    }
  }

  console.log('\n🏷️  Seeding tags...');
  
  // Load tag data (go up to repo root)
  const tagsPath = path.join(__dirname, '../../../../data/tags.seed.json');
  const tagData = JSON.parse(fs.readFileSync(tagsPath, 'utf-8'));
  
  let tagsCreated = 0;
  for (const tag of tagData.tags) {
    try {
      // Store patterns in description as JSON config
      const configData = {
        patterns: tag.patterns,
        originalDescription: tag.description
      };
      
      await prisma.tag.upsert({
        where: { slug: tag.slug },
        update: {
          name: tag.name,
          type: tag.type as TagType,
          description: JSON.stringify(configData)
        },
        create: {
          name: tag.name,
          slug: tag.slug,
          type: tag.type as TagType,
          description: JSON.stringify(configData)
        }
      });
      tagsCreated++;
    } catch (error) {
      console.error(`  ✗ Failed to seed tag ${tag.name}:`, error);
    }
  }
  
  console.log(`✅ Seeded ${tagsCreated} tags`);

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
