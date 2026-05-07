/**
 * Worker INGEST — entry point.
 *
 * Triggers:
 *   - scheduled() — monthly cron (config in wrangler.toml).
 *   - fetch()     — admin endpoints (require ADMIN_SECRET in `x-admin-secret`):
 *       GET  /admin/status     — last 10 ingest_runs
 *       POST /admin/reindex    — kick off a full reindex now
 *       POST /admin/reindex/:code — reindex a single code
 *
 *   - GET / — public health probe (no secret needed)
 */

import type { MediaItem } from '@shared/types';
import type { Env } from './env';
import { readSheet } from './sources/sheets';
import { iterateUserVideos } from './sources/vimeo';
import { iterateUserPhotos } from './sources/flickr';
import {
  excelRowToPartial,
  indexFlickrByCode,
  indexVimeoByCode,
  merge,
} from './normalize';
import {
  existingCodes,
  finishIngestRun,
  startIngestRun,
  upsertMedia,
} from './db';
import { embedAndStore } from './embed';

const SHEET_RANGE = 'A:Z'; // PLACEHOLDER — narrow once we know the sheet shape

interface IngestTotals {
  added: number;
  updated: number;
  failed: number;
}

async function runIngest(
  env: Env,
  trigger: 'cron' | 'admin',
): Promise<{ runId: number; totals: IngestTotals }> {
  const runId = await startIngestRun(env.DB, trigger);
  console.log(`[ingest] start run=${runId} trigger=${trigger}`);

  try {
    // 1. Pull all sources in parallel.
    const [sheetRows, vimeoVideos, flickrPhotos, prevCodes] = await Promise.all([
      readSheet(env.GOOGLE_SHEET_ID, SHEET_RANGE, env.GOOGLE_SHEETS_CREDS),
      collect(iterateUserVideos(env.VIMEO_USER_ID, env.VIMEO_TOKEN)),
      collect(iterateUserPhotos(env.FLICKR_USER_ID, env.FLICKR_API_KEY)),
      existingCodes(env.DB),
    ]);

    console.log(
      `[ingest] sheet=${sheetRows.length} vimeo=${vimeoVideos.length} flickr=${flickrPhotos.length} prev=${prevCodes.size}`,
    );

    // 2. Index by code.
    const vimeoByCode = indexVimeoByCode(vimeoVideos);
    const flickrByCode = indexFlickrByCode(flickrPhotos);

    // 3. Normalize.
    const now = Math.floor(Date.now() / 1000);
    const items: MediaItem[] = [];
    for (const row of sheetRows) {
      const partial = excelRowToPartial(row);
      if (!partial) continue;
      items.push(merge(partial, vimeoByCode.get(partial.code), flickrByCode.get(partial.code), now));
    }

    // 4. Upsert to D1.
    const upsert = await upsertMedia(env.DB, items);
    const newCodes = items.filter((i) => !prevCodes.has(i.code)).length;

    // 5. Embeddings → Vectorize.
    const embed = await embedAndStore(items, {
      ai: env.AI,
      vectorize: env.VECTORIZE,
      db: env.DB,
      model: env.EMBED_MODEL,
    });

    const totals: IngestTotals = {
      added: newCodes,
      updated: upsert.succeeded - newCodes,
      failed: upsert.failed + embed.failed,
    };

    await finishIngestRun(env.DB, runId, 'success', totals);
    console.log(`[ingest] done run=${runId}`, totals);
    return { runId, totals };
  } catch (e) {
    const msg = (e as Error).message;
    console.error(`[ingest] fail run=${runId}`, msg);
    await finishIngestRun(
      env.DB,
      runId,
      'error',
      { added: 0, updated: 0, failed: 0 },
      msg,
    );
    throw e;
  }
}

async function collect<T>(it: AsyncGenerator<T, void, void>): Promise<T[]> {
  const out: T[] = [];
  for await (const x of it) out.push(x);
  return out;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function authorize(req: Request, env: Env): Response | null {
  const secret = req.headers.get('x-admin-secret');
  if (secret !== env.ADMIN_SECRET) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }
  return null;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runIngest(env, 'cron').then(() => undefined));
  },

  async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    // Public health probe
    if (req.method === 'GET' && url.pathname === '/') {
      return jsonResponse({ ok: true, worker: 'ingest', env: env.ENVIRONMENT });
    }

    // Admin endpoints
    if (url.pathname.startsWith('/admin/')) {
      const unauth = authorize(req, env);
      if (unauth) return unauth;

      if (req.method === 'GET' && url.pathname === '/admin/status') {
        const rows = await env.DB.prepare(
          'SELECT id, started_at, finished_at, status, trigger, items_added, items_updated, items_failed, error_message FROM ingest_runs ORDER BY started_at DESC LIMIT 10',
        ).all();
        return jsonResponse({ runs: rows.results ?? [] });
      }

      if (req.method === 'POST' && url.pathname === '/admin/reindex') {
        const result = await runIngest(env, 'admin');
        return jsonResponse(result);
      }

      return jsonResponse({ error: 'not found' }, 404);
    }

    return jsonResponse({ error: 'not found' }, 404);
  },
};
