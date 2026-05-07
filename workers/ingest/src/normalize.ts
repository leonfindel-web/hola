/**
 * Normalize Excel + Vimeo + Flickr → MediaItem.
 *
 * The Excel column mapping is FROZEN UNTIL THE REAL EXCEL ARRIVES.
 * Update SHEET_COLUMNS once Fase 0 confirms the headers, then adjust
 * `excelRowToPartial` accordingly.
 */

import type { MediaItem, MediaSource, MediaType } from '@shared/types';
import type { SheetRow } from './sources/sheets';
import {
  bestThumbnail,
  extractCode as extractVimeoCode,
  vimeoIdFromUri,
  type VimeoVideo,
} from './sources/vimeo';
import {
  extractCode as extractFlickrCode,
  pageUrl as flickrPageUrl,
  staticUrl as flickrStaticUrl,
  type FlickrPhoto,
} from './sources/flickr';

/**
 * Mapping from Excel header → internal field. PLACEHOLDER — replace once we
 * see the real Excel headers in `data/discovery.md`.
 */
export const SHEET_COLUMNS = {
  code: 'Codigo',
  type: 'Tipo',
  title: 'Titulo',
  client: 'Cliente',
  project: 'Proyecto',
  location: 'Locacion',
  year: 'Año',
  description: 'Descripcion',
  tags: 'Tags',
  vimeoUrl: 'Vimeo',
  flickrUrl: 'Flickr',
} as const;

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;|]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseYear(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1900 && n <= 2200 ? n : null;
}

function normalizeType(raw: string | undefined): MediaType {
  const v = (raw ?? '').toLowerCase();
  if (v.startsWith('video') || v === 'v') return 'video';
  if (v.startsWith('foto') || v.startsWith('photo') || v === 'f' || v === 'p') return 'photo';
  return 'document';
}

/** Take an Excel row → partial MediaItem (no media-provider data yet). */
export function excelRowToPartial(row: SheetRow): Partial<MediaItem> & { code: string } | null {
  const code = (row[SHEET_COLUMNS.code] ?? '').trim();
  if (!code) return null;
  return {
    code,
    type: normalizeType(row[SHEET_COLUMNS.type]),
    title: (row[SHEET_COLUMNS.title] ?? '').trim() || code,
    client: (row[SHEET_COLUMNS.client] ?? '').trim() || null,
    project: (row[SHEET_COLUMNS.project] ?? '').trim() || null,
    location: (row[SHEET_COLUMNS.location] ?? '').trim() || null,
    year: parseYear(row[SHEET_COLUMNS.year]),
    description: (row[SHEET_COLUMNS.description] ?? '').trim() || null,
    tags: parseTags(row[SHEET_COLUMNS.tags]),
  };
}

/** Index Vimeo videos by extracted code. Drops videos without a parseable code. */
export function indexVimeoByCode(videos: VimeoVideo[]): Map<string, VimeoVideo> {
  const out = new Map<string, VimeoVideo>();
  for (const v of videos) {
    const code = extractVimeoCode(v.name);
    if (code) out.set(code, v);
  }
  return out;
}

export function indexFlickrByCode(photos: FlickrPhoto[]): Map<string, FlickrPhoto> {
  const out = new Map<string, FlickrPhoto>();
  for (const p of photos) {
    const code = extractFlickrCode(p);
    if (code) out.set(code, p);
  }
  return out;
}

/**
 * Merge an Excel-derived partial with media provider data. Excel always wins
 * for human-curated fields (title, client, etc); provider data fills
 * thumbnail/duration/embed.
 */
export function merge(
  partial: Partial<MediaItem> & { code: string },
  vimeo: VimeoVideo | undefined,
  flickr: FlickrPhoto | undefined,
  now: number,
): MediaItem {
  let source: MediaSource = 'excel-only';
  let source_id: string | null = null;
  let source_url: string | null = null;
  let thumbnail_url: string | null = null;
  let duration_sec: number | null = null;
  let width: number | null = null;
  let height: number | null = null;
  let embed_url: string | null = null;
  let created_at: number | null = null;

  if (vimeo) {
    source = 'vimeo';
    source_id = vimeoIdFromUri(vimeo.uri);
    source_url = vimeo.link;
    thumbnail_url = bestThumbnail(vimeo);
    duration_sec = vimeo.duration;
    width = vimeo.width;
    height = vimeo.height;
    embed_url = vimeo.player_embed_url ?? null;
    const t = Date.parse(vimeo.created_time);
    created_at = Number.isFinite(t) ? Math.floor(t / 1000) : null;
  } else if (flickr) {
    source = 'flickr';
    source_id = flickr.id;
    source_url = flickrPageUrl(flickr);
    thumbnail_url = flickrStaticUrl(flickr, 'z');
    width = flickr.width_l ? parseInt(flickr.width_l, 10) : null;
    height = flickr.height_l ? parseInt(flickr.height_l, 10) : null;
    if (flickr.dateupload) {
      const t = parseInt(flickr.dateupload, 10);
      created_at = Number.isFinite(t) ? t : null;
    }
  }

  return {
    code: partial.code,
    source,
    source_id,
    source_url,
    type: partial.type ?? (vimeo ? 'video' : flickr ? 'photo' : 'document'),
    title: partial.title ?? partial.code,
    client: partial.client ?? null,
    project: partial.project ?? null,
    location: partial.location ?? null,
    year: partial.year ?? null,
    description: partial.description ?? null,
    tags: partial.tags ?? [],
    thumbnail_url,
    duration_sec,
    width,
    height,
    embed_url,
    created_at,
    indexed_at: now,
    vector_id: null, // assigned by embed.ts
  };
}
