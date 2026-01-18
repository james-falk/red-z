import prisma from '../db/client.js';
import { SourceType } from '@fantasy-red-zone/shared';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const newSources = [
  {
    name: 'FantasySP NFL Player News',
    type: SourceType.RSS,
    feedUrl: 'https://www.fantasysp.com/rss/nfl/allplayer/',
    websiteUrl: 'https://www.fantasysp.com',
    description: 'FantasySP player news feed (NFL) - more granular fantasy content'
  },
  {
    name: 'RotoWire Latest NFL News',
    type: SourceType.RSS,
    feedUrl: 'https://www.rotowire.com/rss/news.php?sport=NFL',
    websiteUrl: 'https://www.rotowire.com',
    description: 'RotoWire NFL player/news updates (fantasy relevant)'
  },
  {
    name: 'Draft Sharks - Shark Bites',
    type: SourceType.RSS,
    feedUrl: 'https://www.draftsharks.com/rss/shark-bites',
    websiteUrl: 'https://www.draftsharks.com',
    description: 'DraftSharks quick fantasy news blurbs (Shark Bites)'
  },
  {
    name: 'Draft Sharks - Injury News',
    type: SourceType.RSS,
    feedUrl: 'https://www.draftsharks.com/rss/injury-news',
    websiteUrl: 'https://www.draftsharks.com',
    description: 'DraftSharks NFL injury news feed'
  }
];

async function preflightCheck(feedUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if URL is accessible (200 status)
    console.log(`   Testing accessibility...`);
    try {
      const { stdout: headOutput } = await execAsync(`curl -I -s -L "${feedUrl}" --max-time 10`, { timeout: 15000 });
      
      if (!headOutput.includes('200') && !headOutput.includes('HTTP/2 200')) {
        return { success: false, error: 'HTTP status not 200' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to reach URL (timeout or network error)' };
    }

    // Check if content starts with XML
    console.log(`   Checking for valid XML...`);
    try {
      const { stdout: contentOutput } = await execAsync(`curl -s -L "${feedUrl}" --max-time 10`, { timeout: 15000 });
      const firstChars = contentOutput.trim().substring(0, 200).toLowerCase();
      
      if (!firstChars.includes('<?xml') && !firstChars.includes('<rss') && !firstChars.includes('<feed')) {
        return { success: false, error: 'Response does not appear to be XML (likely HTML error page)' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch content' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function addSourcesWithPreflight() {
  console.log('🔍 Adding 4 new fantasy RSS sources with preflight checks...\n');

  for (const sourceData of newSources) {
    console.log(`📡 ${sourceData.name}`);
    console.log(`   URL: ${sourceData.feedUrl}`);

    try {
      // Check if already exists
      const existing = await prisma.source.findUnique({
        where: { feedUrl: sourceData.feedUrl }
      });

      if (existing) {
        console.log(`   ⏭️  Already exists (skipping)\n`);
        continue;
      }

      // Preflight check
      const preflight = await preflightCheck(sourceData.feedUrl);

      if (!preflight.success) {
        console.log(`   ❌ Preflight FAILED: ${preflight.error}`);
        
        // Create source but mark as inactive with error
        await prisma.source.create({
          data: {
            ...sourceData,
            isActive: false,
            lastError: `Preflight check failed: ${preflight.error}`
          }
        });
        
        console.log(`   Created source (isActive=false, lastError preserved)\n`);
      } else {
        console.log(`   ✅ Preflight PASSED`);
        
        // Create active source
        const source = await prisma.source.create({
          data: sourceData
        });
        
        console.log(`   Created source (isActive=true)\n`);
      }
    } catch (error: any) {
      console.error(`   ❌ Failed to create: ${error.message}\n`);
    }
  }

  console.log('🎉 Source creation complete!\n');

  // Show summary
  const activeCount = await prisma.source.count({ where: { isActive: true } });
  const totalCount = await prisma.source.count();
  
  console.log(`📊 Active sources: ${activeCount} / ${totalCount} total`);
}

addSourcesWithPreflight().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
}).then(() => {
  process.exit(0);
});
