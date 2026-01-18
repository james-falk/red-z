import prisma from '../db/client.js';
import { SourceType } from '@fantasy-red-zone/shared';

const newSources = [
  {
    name: 'FantasyPros NFL News',
    type: SourceType.RSS,
    feedUrl: 'https://www.fantasypros.com/rss/nfl-news.xml',
    websiteUrl: 'https://www.fantasypros.com',
    description: 'FantasyPros NFL news feed'
  },
  {
    name: 'NFL.com News',
    type: SourceType.RSS,
    feedUrl: 'https://www.nfl.com/rss/rsslanding?searchString=home',
    websiteUrl: 'https://www.nfl.com',
    description: 'Official NFL.com news feed (fantasy-relevant headlines)'
  },
  {
    name: 'Pro Football Talk',
    type: SourceType.RSS,
    feedUrl: 'https://feeds.feedburner.com/nbcsportscom/pf?format=xml',
    websiteUrl: 'https://profootballtalk.nbcsports.com',
    description: 'Pro Football Talk NFL news (fantasy-relevant)'
  },
  {
    name: 'Bleacher Report Fantasy Football',
    type: SourceType.RSS,
    feedUrl: 'https://bleacherreport.com/articles/feed?tag_id=17',
    websiteUrl: 'https://bleacherreport.com/fantasy-football',
    description: 'Bleacher Report fantasy football tagged feed'
  }
];

async function addFantasySources() {
  console.log('📡 Adding 4 new fantasy football RSS sources...\n');

  for (const sourceData of newSources) {
    try {
      // Check if already exists
      const existing = await prisma.source.findUnique({
        where: { feedUrl: sourceData.feedUrl }
      });

      if (existing) {
        console.log(`⏭️  ${sourceData.name} - Already exists (skipping)`);
        continue;
      }

      // Create source
      const source = await prisma.source.create({
        data: sourceData
      });

      console.log(`✅ ${source.name}`);
      console.log(`   URL: ${source.feedUrl}`);
      console.log(`   Active: ${source.isActive}\n`);
    } catch (error: any) {
      console.error(`❌ Failed to add ${sourceData.name}:`, error.message);
    }
  }

  console.log('🎉 Source creation complete!\n');

  // Show summary
  const activeCount = await prisma.source.count({
    where: { isActive: true }
  });

  console.log(`📊 Total active sources: ${activeCount}`);
}

addFantasySources().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
