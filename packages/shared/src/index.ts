import { z } from 'zod';

// Enums
export enum ContentType {
  ARTICLE = 'ARTICLE',
  VIDEO = 'VIDEO',
  PODCAST = 'PODCAST'
}

export enum SourceType {
  RSS = 'RSS',
  YOUTUBE = 'YOUTUBE',
  PODCAST = 'PODCAST'
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

// Validation Schemas
export const createSourceSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(SourceType),
  feedUrl: z.string().url(),
  websiteUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().optional()
});

export const updateSourceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
  websiteUrl: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().optional()
});

export const contentFiltersSchema = z.object({
  type: z.nativeEnum(ContentType).optional(),
  q: z.string().optional(),
  tags: z.string().optional(),
  sourceId: z.string().optional(),
  sort: z.enum(['recent', 'popular']).optional().default('recent'),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  cursor: z.string().optional()
});

export const createFeedSchema = z.object({
  name: z.string().min(1).max(255)
});

export const sleeperConnectSchema = z.object({
  username: z.string().min(1).max(100)
});

export const createFeaturedItemSchema = z.object({
  contentId: z.string(),
  rank: z.number().int().min(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export const updateFeaturedItemSchema = z.object({
  rank: z.number().int().min(0).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable()
});

// Type exports
export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
export type ContentFilters = z.infer<typeof contentFiltersSchema>;
export type CreateFeedInput = z.infer<typeof createFeedSchema>;
export type SleeperConnectInput = z.infer<typeof sleeperConnectSchema>;
export type CreateFeaturedItemInput = z.infer<typeof createFeaturedItemSchema>;
export type UpdateFeaturedItemInput = z.infer<typeof updateFeaturedItemSchema>;

// User type
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  canonicalUrl: string;
  thumbnailUrl: string | null;
  type: ContentType;
  publishedAt: Date;
  clickCount: number;
  sourceId: string;
  source: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  isSaved?: boolean;
}

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  feedUrl: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  isFollowed?: boolean;
}

export interface Feed {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  _count?: {
    sources: number;
  };
}

export interface FeaturedItem {
  id: string;
  contentId: string;
  rank: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  content: ContentItem;
}

export interface SleeperStatus {
  connected: boolean;
  sleeperUserId: string | null;
  sleeperUsername: string | null;
}
