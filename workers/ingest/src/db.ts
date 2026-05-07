/**
 * D1 access layer for INGEST.
 *
 * Idempotent upserts with prepared statements + batching. Single transaction
 * per batch for throughput.
 */

import type { MediaItem } from '@shared/types';

const BATCH_SIZE = 50;

const UPSERT_SQL = `
INSERT INTO media (
  code, source, source_id, source_url, type,
  title, client, project, location, year, description, tags,
  thumbnail_url, duration_sec, width, height, embed_url,
  created_at, indexed_at, vector_id
) VALUES (
  ?1, ?2, ?3, ?4, ?5,
  ?6, ?7, ?8, ?9, ?10, ?11, ?12,
  ?13, ?14, ?15, ?16, ?17,
  ?18, ?19, ?20
)
ON CONFLICT(code) DO UPDATE SET
  source        = excluded.source,
  source_id     = excluded.source_id,
  source_url    = excluded.source_url,
  type          = excluded.type,
  title         = excluded.title,
  client        = excluded.client,
  project       = excluded.project,
  location      = excluded.location,
  year          = excluded.year,
  description   = excluded.description,
  tags          = excluded.tags,
  thumbnail_url = excluded.thumbnail_url,
  duration_sec  = excluded.duration_sec,
  width         = excluded.width,
  height        = excluded.height,
  embed_url     = excluded.embed_url,
  created_at    = excluded.created_at,
  indexed_at    = excluded.indexed_at,
  vector_id     = COALESCE(excluded.vector_id, media.vector_id)
`;

export interface UpsertSummary {
  attempted: number;
  succeeded: number;
  failed: number;
}

export async function upsertMedia(db: D1Database, items: MediaItem[]): Promise<UpsertSummary> {
  let succeeded = 0;
  let failed = 0;
  const stmt = db.prepare(UPSERT_SQL);

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const slice = items.slice(i, i + BATCH_SIZE);
    const batch = slice.map((it) =>
      stmt.bind(
        it.code,
        it.source,
        it.source_id,
        it.source_url,
        it.type,
        it.title,
        it.client,
        it.project,
        it.location,
        it.year,
        it.description,
        JSON.stringify(it.tags),
        it.thumbnail_url,
        it.duration_sec,
        it.width,
        it.height,
        it.embed_url,
        it.created_at,
        it.indexed_at,
        it.vector_id,
      ),
    );
    try {
      await db.batch(batch);
      succeeded += slice.length;
    } catch (e) {
      console.error('[db] batch failed', { from: i, to: i + slice.length, err: (e as Error).message });
      failed += slice.length;
    }
  }

  return { attempted: items.length, succeeded, failed };
}

export async function setVectorId(db: D1Database, code: string, vectorId: string): Promise<void> {
  await db.prepare('UPDATE media SET vector_id = ?1 WHERE code = ?2').bind(vectorId, code).run();
}

export async function startIngestRun(
  db: D1Database,
  trigger: 'cron' | 'admin',
): Promise<number> {
  const res = await db
    .prepare(
      'INSERT INTO ingest_runs (started_at, status, trigger) VALUES (?1, ?2, ?3) RETURNING id',
    )
    .bind(Math.floor(Date.now() / 1000), 'running', trigger)
    .first<{ id: number }>();
  if (!res) throw new Error('failed to start ingest run');
  return res.id;
}

export async function finishIngestRun(
  db: D1Database,
  id: number,
  status: 'success' | 'error',
  totals: { added: number; updated: number; failed: number },
  errorMessage?: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE ingest_runs
         SET finished_at = ?1, status = ?2,
             items_added = ?3, items_updated = ?4, items_failed = ?5,
             error_message = ?6
       WHERE id = ?7`,
    )
    .bind(
      Math.floor(Date.now() / 1000),
      status,
      totals.added,
      totals.updated,
      totals.failed,
      errorMessage ?? null,
      id,
    )
    .run();
}

export async function existingCodes(db: D1Database): Promise<Set<string>> {
  const rows = await db.prepare('SELECT code FROM media').all<{ code: string }>();
  return new Set((rows.results ?? []).map((r) => r.code));
}
