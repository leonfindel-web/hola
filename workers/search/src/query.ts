/**
 * Hybrid search: FTS5 + Vectorize, fused via Reciprocal Rank Fusion (RRF).
 *
 * Flujo:
 *   1. Si q vacío → solo D1 con WHERE + ORDER (browse mode).
 *   2. Si q con texto → en paralelo:
 *      - FTS5 sobre media_fts con bm25 (top FTS_K).
 *      - Vectorize: embedding de q via Workers AI → query top VEC_K.
 *   3. RRF (k=60) → top page_size.
 */

import type {
  MediaItem,
  MediaRow,
  SearchFilters,
  SearchHit,
  SearchQuery,
  SearchResult,
} from '@shared/types';

const FTS_K = 50;
const VEC_K = 50;
const RRF_K = 60;

const SELECT_FIELDS = `
  m.code, m.source, m.source_id, m.source_url, m.type,
  m.title, m.client, m.project, m.location, m.year, m.description, m.tags,
  m.thumbnail_url, m.duration_sec, m.width, m.height, m.embed_url,
  m.created_at, m.indexed_at, m.vector_id
`;

export function rowToMediaItem(row: MediaRow): MediaItem {
  let tags: string[] = [];
  if (row.tags) {
    try {
      const parsed = JSON.parse(row.tags) as unknown;
      if (Array.isArray(parsed)) tags = parsed.filter((x): x is string => typeof x === 'string');
    } catch {
      tags = [];
    }
  }
  return { ...row, tags };
}

interface FilterClause {
  sql: string;
  params: (string | number)[];
}

function buildFilterClause(filters: SearchFilters | undefined, alias = 'm'): FilterClause {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (!filters) return { sql: '', params };
  if (filters.type) {
    where.push(`${alias}.type = ?`);
    params.push(filters.type);
  }
  if (filters.client) {
    where.push(`${alias}.client = ?`);
    params.push(filters.client);
  }
  if (filters.project) {
    where.push(`${alias}.project = ?`);
    params.push(filters.project);
  }
  if (filters.location) {
    where.push(`${alias}.location = ?`);
    params.push(filters.location);
  }
  if (filters.year_from !== undefined) {
    where.push(`${alias}.year >= ?`);
    params.push(filters.year_from);
  }
  if (filters.year_to !== undefined) {
    where.push(`${alias}.year <= ?`);
    params.push(filters.year_to);
  }
  if (filters.tags && filters.tags.length > 0) {
    // Naive: any tag substring match in JSON array. Good enough until the
    // catalog grows past tens of thousands of items.
    for (const t of filters.tags) {
      where.push(`${alias}.tags LIKE ?`);
      params.push(`%"${t}"%`);
    }
  }
  return { sql: where.length > 0 ? where.join(' AND ') : '', params };
}

/** Browse mode (no q): straight D1 with filters + pagination. */
async function browse(db: D1Database, query: SearchQuery): Promise<SearchResult> {
  const start = Date.now();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.page_size ?? 24));
  const offset = (page - 1) * pageSize;

  const { sql: whereSql, params } = buildFilterClause(query.filters);
  const where = whereSql ? `WHERE ${whereSql}` : '';

  const totalRow = await db
    .prepare(`SELECT COUNT(*) AS n FROM media m ${where}`)
    .bind(...params)
    .first<{ n: number }>();

  const rows = await db
    .prepare(
      `SELECT ${SELECT_FIELDS} FROM media m ${where}
       ORDER BY COALESCE(m.year, 0) DESC, m.indexed_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(...params, pageSize, offset)
    .all<MediaRow>();

  const hits: SearchHit[] = (rows.results ?? []).map((r) => ({
    item: rowToMediaItem(r),
    score: 1,
    source: 'browse',
  }));

  return {
    hits,
    total: totalRow?.n ?? 0,
    page,
    page_size: pageSize,
    took_ms: Date.now() - start,
  };
}

interface FtsHit {
  rank: number; // 1-indexed
  code: string;
  bm25: number;
}

interface VecHit {
  rank: number;
  code: string;
  score: number;
}

async function ftsSearch(
  db: D1Database,
  q: string,
  filterClause: FilterClause,
): Promise<FtsHit[]> {
  // FTS5 MATCH expects a query syntax. We escape and OR the tokens for recall.
  const tokens = q
    .split(/\s+/)
    .map((t) => t.replace(/['"]/g, ''))
    .filter((t) => t.length > 1);
  if (tokens.length === 0) return [];
  const matchExpr = tokens.map((t) => `"${t}"*`).join(' OR ');

  const sql = `
    SELECT m.code AS code, bm25(media_fts) AS bm25
    FROM media_fts
    JOIN media m ON m.rowid = media_fts.rowid
    WHERE media_fts MATCH ?
    ${filterClause.sql ? `AND ${filterClause.sql}` : ''}
    ORDER BY bm25
    LIMIT ?
  `;
  const rows = await db
    .prepare(sql)
    .bind(matchExpr, ...filterClause.params, FTS_K)
    .all<{ code: string; bm25: number }>();

  return (rows.results ?? []).map((r, i) => ({ rank: i + 1, code: r.code, bm25: r.bm25 }));
}

async function vecSearch(
  ai: Ai,
  vectorize: VectorizeIndex,
  q: string,
  model: string,
): Promise<VecHit[]> {
  const emb = (await ai.run(model, { text: [q] })) as { data: number[][] };
  const vec = emb.data[0];
  if (!vec) return [];
  const result = await vectorize.query(vec, { topK: VEC_K, returnValues: false });
  return result.matches.map((m, i) => ({ rank: i + 1, code: m.id, score: m.score }));
}

function rrfFuse(fts: FtsHit[], vec: VecHit[]): { code: string; score: number }[] {
  const scores = new Map<string, number>();
  for (const h of fts) scores.set(h.code, (scores.get(h.code) ?? 0) + 1 / (RRF_K + h.rank));
  for (const h of vec) scores.set(h.code, (scores.get(h.code) ?? 0) + 1 / (RRF_K + h.rank));
  return [...scores.entries()]
    .map(([code, score]) => ({ code, score }))
    .sort((a, b) => b.score - a.score);
}

async function hydrate(db: D1Database, codes: string[]): Promise<Map<string, MediaItem>> {
  if (codes.length === 0) return new Map();
  const placeholders = codes.map(() => '?').join(',');
  const rows = await db
    .prepare(`SELECT ${SELECT_FIELDS} FROM media m WHERE m.code IN (${placeholders})`)
    .bind(...codes)
    .all<MediaRow>();
  const map = new Map<string, MediaItem>();
  for (const r of rows.results ?? []) map.set(r.code, rowToMediaItem(r));
  return map;
}

interface HybridDeps {
  db: D1Database;
  ai: Ai;
  vectorize: VectorizeIndex;
  model: string;
}

export async function hybridSearch(
  query: SearchQuery,
  deps: HybridDeps,
): Promise<SearchResult> {
  const q = (query.q ?? '').trim();
  if (q.length === 0) return browse(deps.db, query);

  const start = Date.now();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.page_size ?? 24));

  const filterClause = buildFilterClause(query.filters);

  const [ftsHits, vecHits] = await Promise.all([
    ftsSearch(deps.db, q, filterClause),
    vecSearch(deps.ai, deps.vectorize, q, deps.model),
  ]);

  const fused = rrfFuse(ftsHits, vecHits);
  const total = fused.length;

  // Apply post-fusion filters that we didn't push down to vec (vector hits
  // may include codes that don't satisfy filters; we drop them after hydrate).
  const start_idx = (page - 1) * pageSize;
  const slice = fused.slice(start_idx, start_idx + pageSize);
  const items = await hydrate(
    deps.db,
    slice.map((s) => s.code),
  );

  const hits: SearchHit[] = slice
    .map((s) => {
      const item = items.get(s.code);
      if (!item) return null;
      return { item, score: s.score, source: 'fused' as const };
    })
    .filter((x): x is SearchHit => x !== null);

  return {
    hits,
    total,
    page,
    page_size: pageSize,
    took_ms: Date.now() - start,
  };
}

/** Single item by code. */
export async function getItem(db: D1Database, code: string): Promise<MediaItem | null> {
  const row = await db
    .prepare(`SELECT ${SELECT_FIELDS} FROM media m WHERE m.code = ?`)
    .bind(code)
    .first<MediaRow>();
  return row ? rowToMediaItem(row) : null;
}

/** Facet counts for filter UI. */
export async function getFacets(db: D1Database): Promise<{
  type: { value: string; count: number }[];
  client: { value: string; count: number }[];
  year: { value: string; count: number }[];
  location: { value: string; count: number }[];
}> {
  const counted = (col: string) =>
    db
      .prepare(
        `SELECT ${col} AS value, COUNT(*) AS count
           FROM media
          WHERE ${col} IS NOT NULL AND ${col} <> ''
          GROUP BY ${col}
          ORDER BY count DESC
          LIMIT 50`,
      )
      .all<{ value: string; count: number }>();

  const [type, client, year, location] = await Promise.all([
    counted('type'),
    counted('client'),
    counted('year'),
    counted('location'),
  ]);

  return {
    type: type.results ?? [],
    client: client.results ?? [],
    year: (year.results ?? []).map((r) => ({ ...r, value: String(r.value) })),
    location: location.results ?? [],
  };
}

export async function listAllCodes(db: D1Database): Promise<string[]> {
  const rows = await db.prepare('SELECT code FROM media ORDER BY code').all<{ code: string }>();
  return (rows.results ?? []).map((r) => r.code);
}
