import prisma from '../db/client';
import { TagType } from '@fantasy-red-zone/shared';

interface TagPattern {
  id: string;
  slug: string;
  name: string;
  type: TagType;
  patterns: RegExp[];
}

export class TaggerService {
  private tagDictionary: TagPattern[] = [];
  private loaded = false;

  /**
   * Load all tags from database and compile regex patterns
   * Call once at startup before ingestion
   */
  async loadDictionary(): Promise<void> {
    console.log('[Tagger] 📚 Loading tag dictionary...');

    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        description: true,
      },
    });

    this.tagDictionary = [];

    for (const tag of tags) {
      const patterns = this.getPatternsForTag(tag);

      if (patterns.length > 0) {
        this.tagDictionary.push({
          id: tag.id,
          slug: tag.slug,
          name: tag.name,
          type: tag.type as TagType,
          // Compile regex with case-insensitive flag
          patterns: patterns.map(p => new RegExp(p, 'i')),
        });
      }
    }

    this.loaded = true;
    console.log(`[Tagger] ✅ Loaded ${this.tagDictionary.length} tags with patterns`);
  }

  /**
   * Extract patterns from tag description (stored as JSON)
   */
  private getPatternsForTag(tag: any): string[] {
    if (!tag.description) return [];

    try {
      const config = JSON.parse(tag.description);
      return config.patterns || [];
    } catch {
      return [];
    }
  }

  /**
   * Match tags against content title and description
   * Returns array of tag IDs that matched
   */
  matchTags(title: string, description: string | null): string[] {
    if (!this.loaded) {
      throw new Error('[Tagger] Tag dictionary not loaded. Call loadDictionary() first.');
    }

    // Combine title and description into single text
    const combinedText = `${title} ${description || ''}`;

    const matchedTagIds: string[] = [];

    // Test each tag's patterns
    for (const tag of this.tagDictionary) {
      for (const pattern of tag.patterns) {
        if (pattern.test(combinedText)) {
          matchedTagIds.push(tag.id);
          // Only match each tag once
          break;
        }
      }
    }

    return matchedTagIds;
  }

  /**
   * Check if dictionary is loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get tag count for debugging
   */
  getTagCount(): number {
    return this.tagDictionary.length;
  }
}

// Singleton instance
export const taggerService = new TaggerService();
