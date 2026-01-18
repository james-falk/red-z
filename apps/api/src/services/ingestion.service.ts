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
  async ingestAllActiveSources(): Promise<void> {
    const sources = await prisma.source.findMany({
      where: { isActive: true }
    });

    console.log(`Starting ingestion for ${sources.length} active sources`);

    for (const source of sources) {
      try {
        await this.ingestSource(source.id);
      } catch (error) {
        console.error(`Error ingesting source ${source.id} (${source.name}):`, error);
      }
    }

    console.log('Ingestion completed');
  }

  async ingestSource(sourceId: string): Promise<void> {
    const source = await prisma.source.findUnique({
      where: { id: sourceId }
    });

    if (!source) {
      throw new Error(`Source ${sourceId} not found`);
    }

    console.log(`Ingesting source: ${source.name} (${source.type})`);

    const feed = await parser.parseURL(source.feedUrl);

    let ingestedCount = 0;
    let skippedCount = 0;

    for (const item of feed.items) {
      try {
        const canonicalUrl = item.link || item.guid;
        if (!canonicalUrl) {
          console.warn('Item missing link/guid, skipping');
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
            description: item.contentSnippet || item.content || null,
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
        console.error(`Error processing item from ${source.name}:`, error);
      }
    }

    // Update last fetched timestamp
    await prisma.source.update({
      where: { id: sourceId },
      data: { lastFetchedAt: new Date() }
    });

    console.log(`Ingested ${ingestedCount} new items, skipped ${skippedCount} existing items from ${source.name}`);
  }
}

export const ingestionService = new IngestionService();
