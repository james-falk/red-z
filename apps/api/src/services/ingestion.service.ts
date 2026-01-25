import Parser from 'rss-parser';
import prisma from '../db/client';
import { ContentType, SourceType } from '@fantasy-red-zone/shared';
import { taggerService } from './tagger.service';

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:content', 'mediaContent'],
      ['media:group', 'mediaGroup']
    ]
  }
});

export class IngestionService {
  /**
   * In-memory lock for single-instance MVP
   * 
   * SCALING NOTE: When running multiple instances, replace this with:
   * 
   * Option A: Postgres Advisory Lock (recommended, no schema change)
   * ```
   * const lockId = 123456; // Unique ID for ingestion job
   * const acquired = await prisma.$queryRaw`SELECT pg_try_advisory_lock(${lockId})`;
   * if (!acquired[0].pg_try_advisory_lock) return; // Another instance is running
   * try {
   *   // ... ingestion logic ...
   * } finally {
   *   await prisma.$queryRaw`SELECT pg_advisory_unlock(${lockId})`;
   * }
   * ```
   * 
   * Option B: JobLock table (requires migration, easier to debug)
   * - Create JobLock model with: jobName, lockedAt, lockedUntil
   * - Acquire lock: upsert with lockedUntil = now + 2 hours
   * - Release lock: delete row
   */
  private static isRunning = false;

  /**
   * Ingest all active sources
   * 
   * OBSERVABILITY:
   * - Continues on error (doesn't crash entire batch)
   * - Updates lastIngestedAt on success
   * - Stores lastError on failure
   * - Logs summary at the end
   * 
   * CONCURRENCY:
   * - Single-run guard prevents overlap (in-memory flag)
   * - Logs skip message if already running
   */
  async ingestAllActiveSources(): Promise<void> {
    // Single-run guard
    if (IngestionService.isRunning) {
      console.log('[Ingestion] ⏭️  Skipped: already running');
      return;
    }

    IngestionService.isRunning = true;
    const startTime = Date.now();
    
    try {
      // Load tag dictionary before ingestion
      if (!taggerService.isLoaded()) {
        await taggerService.loadDictionary();
      }

      const sources = await prisma.source.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      console.log(`[Ingestion] Starting batch for ${sources.length} active source(s)`);
      
      let successCount = 0;
      let failureCount = 0;
      let totalItemsIngested = 0;

      for (const source of sources) {
        try {
          const itemCount = await this.ingestSource(source.id);
          successCount++;
          totalItemsIngested += itemCount;
        } catch (error) {
          failureCount++;
          console.error(`[Ingestion] Failed for source ${source.id} (${source.name}):`, error);
          // Error is already stored in source.lastError by ingestSource
        }
      }

      console.log(`[Ingestion] Batch complete: ${successCount} succeeded, ${failureCount} failed, ${totalItemsIngested} total items ingested`);
    } finally {
      IngestionService.isRunning = false;
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[Ingestion] ⏱️  Completed in ${duration}s`);
    }
  }

  /**
   * Ingest a single source
   * 
   * OBSERVABILITY:
   * - Returns count of newly ingested items
   * - Updates lastIngestedAt + clears lastError on success
   * - Updates lastError on failure (doesn't throw)
   * - Always updates lastFetchedAt (even on failure)
   * 
   * @returns Number of items ingested
   */
  async ingestSource(sourceId: string): Promise<number> {
    const source = await prisma.source.findUnique({
      where: { id: sourceId }
    });

    if (!source) {
      const error = `Source ${sourceId} not found`;
      console.error(`[Ingestion] ${error}`);
      throw new Error(error);
    }

    console.log(`[Ingestion] Starting: ${source.name} (${source.type}) - ${source.feedUrl}`);

    try {
      // Fetch and parse feed
      const feed = await parser.parseURL(source.feedUrl);
      
      if (!feed.items || feed.items.length === 0) {
        console.warn(`[Ingestion] No items found in feed: ${source.name}`);
        await prisma.source.update({
          where: { id: sourceId },
          data: {
            lastFetchedAt: new Date(),
            lastIngestedAt: new Date(),
            lastError: 'No items found in feed'
          }
        });
        return 0;
      }

      let ingestedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const item of feed.items) {
        try {
          const canonicalUrl = item.link || item.guid;
          if (!canonicalUrl) {
            console.warn(`[Ingestion] Item missing link/guid in ${source.name}, skipping`);
            errorCount++;
            continue;
          }

          // Check if already exists
          const existing = await prisma.content.findUnique({
            where: { canonicalUrl }
          });

          if (existing) {
            skippedCount++;
            continue;
          }

          // Determine content type
          let contentType = ContentType.ARTICLE;
          if (source.type === SourceType.YOUTUBE) {
            contentType = ContentType.VIDEO;
          } else if (source.type === SourceType.PODCAST) {
            contentType = ContentType.PODCAST;
          }

          // Extract thumbnail (multiple sources, prioritized)
          let thumbnailUrl = null;
          
          // 1. YouTube: mediaGroup.media:thumbnail
          if ((item as any).mediaGroup?.['media:thumbnail']?.[0]?.$?.url) {
            thumbnailUrl = (item as any).mediaGroup['media:thumbnail'][0].$.url;
          }
          // 2. Standard image enclosure
          else if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
            thumbnailUrl = item.enclosure.url;
          }
          // 3. Media RSS (mediaThumbnail)
          else if ((item as any).mediaThumbnail) {
            const thumb = (item as any).mediaThumbnail;
            thumbnailUrl = thumb.$?.url || thumb.url || thumb;
          }
          // 4. iTunes podcast image
          else if ((item as any).itunes?.image) {
            thumbnailUrl = (item as any).itunes.image;
          }
          // 5. Fallback: extract first image from content/description
          else if (!thumbnailUrl && item.content) {
            const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch) {
              thumbnailUrl = imgMatch[1];
            }
          }

          // Match tags for this content
          const title = item.title || 'Untitled';
          const description = item.contentSnippet || item.content || item.summary || null;
          const tagIds = taggerService.matchTags(title, description);

          // Create content with tag associations
          await prisma.content.create({
            data: {
              title,
              description,
              canonicalUrl,
              thumbnailUrl,
              type: contentType,
              publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
              sourceId: source.id,
              metadata: {
                author: item.creator || (item as any).author,
                categories: item.categories || []
              },
              // Create ContentTag join records
              contentTags: {
                create: tagIds.map(tagId => ({ tagId }))
              }
            }
          });

          ingestedCount++;
        } catch (error) {
          errorCount++;
          console.error(`[Ingestion] Error processing item from ${source.name}:`, error);
          // Continue processing other items
        }
      }

      // Update source with success
      await prisma.source.update({
        where: { id: sourceId },
        data: {
          lastFetchedAt: new Date(),
          lastIngestedAt: new Date(),
          lastError: null  // Clear any previous error
        }
      });

      console.log(`[Ingestion] ✅ ${source.name}: ${ingestedCount} new, ${skippedCount} skipped, ${errorCount} errors`);
      return ingestedCount;

    } catch (error: any) {
      // Store error in source
      const errorMessage = error.message || String(error);
      await prisma.source.update({
        where: { id: sourceId },
        data: {
          lastFetchedAt: new Date(),
          lastError: errorMessage.substring(0, 1000)  // Limit error length
        }
      });

      console.error(`[Ingestion] ❌ ${source.name}: ${errorMessage}`);
      throw error;  // Re-throw so batch handler knows it failed
    }
  }
}

export const ingestionService = new IngestionService();
