/**
 * Retag Existing Content
 * 
 * This script applies tags to all existing content in the database.
 * Run this after:
 * - Initial tag seed
 * - Adding new tags
 * - Updating tag patterns
 */

import prisma from '../db/client';
import { taggerService } from '../services/tagger.service';

async function retagContent() {
  console.log('[Retag] Starting content retagging...');

  try {
    // Load tag dictionary
    await taggerService.loadDictionary();
    console.log(`[Retag] Loaded ${taggerService.isLoaded() ? 'tag dictionary' : 'no tags'}`);

    // Get all content
    const allContent = await prisma.content.findMany({
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    console.log(`[Retag] Found ${allContent.length} content items to process`);

    let processedCount = 0;
    let taggedCount = 0;
    let totalTagsApplied = 0;

    for (const content of allContent) {
      // Match tags
      const tagIds = taggerService.matchTags(content.title, content.description);

      if (tagIds.length > 0) {
        // Delete existing tags for this content
        await prisma.contentTag.deleteMany({
          where: { contentId: content.id }
        });

        // Create new tag associations
        await prisma.contentTag.createMany({
          data: tagIds.map(tagId => ({
            contentId: content.id,
            tagId
          })),
          skipDuplicates: true
        });

        taggedCount++;
        totalTagsApplied += tagIds.length;
      }

      processedCount++;

      // Progress log every 50 items
      if (processedCount % 50 === 0) {
        console.log(`[Retag] Progress: ${processedCount}/${allContent.length} items processed`);
      }
    }

    console.log(`[Retag] ✅ Complete!`);
    console.log(`[Retag] - Processed: ${processedCount} content items`);
    console.log(`[Retag] - Tagged: ${taggedCount} items (${((taggedCount / processedCount) * 100).toFixed(1)}%)`);
    console.log(`[Retag] - Total tags applied: ${totalTagsApplied} (avg ${(totalTagsApplied / taggedCount).toFixed(1)} per tagged item)`);

    // Show tag distribution
    const tagStats = await prisma.contentTag.groupBy({
      by: ['tagId'],
      _count: true,
      orderBy: {
        _count: {
          tagId: 'desc'
        }
      },
      take: 10
    });

    console.log('\n[Retag] Top 10 most used tags:');
    for (const stat of tagStats) {
      const tag = await prisma.tag.findUnique({
        where: { id: stat.tagId },
        select: { name: true, type: true }
      });
      console.log(`  - ${tag?.name} (${tag?.type}): ${stat._count} items`);
    }

  } catch (error) {
    console.error('[Retag] Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  retagContent()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { retagContent };
