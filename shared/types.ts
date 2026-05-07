/**
 * Shared types between Astro frontend and Cloudflare Workers.
 *
 * These are the contract for the catalog. The D1 schema in data/schema.sql is
 * the source of truth — keep this file in sync when the schema changes.
 */

export type MediaSource = 'vimeo' | 'flickr' | 'excel-only';
export type MediaType = 'video' | 'photo' | 'document';

/**
 * Canonical media item. One row in D1 `media`. The `code` field (B052, F001…)
 * is the primary key from Leonfindel's internal Excel catalog.
 */
export interface MediaItem {
  code: string;
  source: MediaSource;
  source_id: string | null;
  source_url: string | null;
  type: MediaType;

  title: string;
  client: string | null;
  project: string | null;
  location: string | null;
  year: number | null;
  description: string | null;
  tags: string[];

  thumbnail_url: string | null;
  duration_sec: number | null;
  width: number | null;
  height: number | null;
  embed_url: string | null;

  created_at: number | null;
  indexed_at: number;
  vector_id: string | null;
}

/**
 * Row as it lives in D1. `tags` is stored as JSON text; `MediaItem` exposes the
 * decoded array. Convert with `rowToMediaItem` (see workers/search/src/query.ts).
 */
export interface MediaRow {
  code: string;
  source: MediaSource;
  source_id: string | null;
  source_url: string | null;
  type: MediaType;
  title: string;
  client: string | null;
  project: string | null;
  location: string | null;
  year: number | null;
  description: string | null;
  tags: string | null;
  thumbnail_url: string | null;
  duration_sec: number | null;
  width: number | null;
  height: number | null;
  embed_url: string | null;
  created_at: number | null;
  indexed_at: number;
  vector_id: string | null;
}

export interface SearchFilters {
  type?: MediaType | undefined;
  client?: string | undefined;
  project?: string | undefined;
  year_from?: number | undefined;
  year_to?: number | undefined;
  location?: string | undefined;
  tags?: string[] | undefined;
}

export interface SearchQuery {
  q?: string;
  filters?: SearchFilters;
  page?: number;
  page_size?: number;
}

export interface SearchHit {
  item: MediaItem;
  score: number;
  source: 'fts' | 'vector' | 'fused' | 'browse';
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
  page: number;
  page_size: number;
  took_ms: number;
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface Facets {
  type: FacetCount[];
  client: FacetCount[];
  year: FacetCount[];
  location: FacetCount[];
}

export interface IngestRun {
  id: number;
  started_at: number;
  finished_at: number | null;
  status: 'running' | 'success' | 'error';
  items_added: number;
  items_updated: number;
  items_failed: number;
  error_message: string | null;
}

/** Result envelope. Workers and frontend never throw across the wire. */
export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
