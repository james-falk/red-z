import Parser from 'rss-parser';
import prisma from '../db/client';
import { ContentType, SourceType } from '@fantasy-red-zone/shared';

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
   * Ingest all active sources
   * 
   * OBSERVABILITY:
   * - Continues on error (doesn't crash entire batch)
   * - Updates lastIngestedAt on success
   * - Stores lastError on failure
   * - Logs summary at the end
   */
  async ingestAllActiveSources(): Promise<void> {
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

          // Extract thumbnail
          let thumbnailUrl = null;
          if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
            thumbnailUrl = item.enclosure.url;
          } else if ((item as any).mediaThumbnail?.$ || (item as any).mediaThumbnail) {
            const thumb = (item as any).mediaThumbnail;
            thumbnailUrl = thumb.$?.url || thumb.url || thumb;
          } else if (item.itunes?.image) {
            thumbnailUrl = item.itunes.image;
          }

          // Create content
          await prisma.content.create({
            data: {
              title: item.title || 'Untitled',
              description: item.contentSnippet || item.content || item.summary || null,
              canonicalUrl,
              thumbnailUrl,
              type: contentType,
              publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
              sourceId: source.id,
              metadata: {
                author: item.creator || item.author,
                categories: item.categories || []
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
