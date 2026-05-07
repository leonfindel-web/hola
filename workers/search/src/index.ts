/**
 * Worker SEARCH — entry point.
 *
 * Endpoints (all GET):
 *   GET /                       — health probe
 *   GET /api/search?q=...&...   — hybrid search
 *   GET /api/item/:code         — single item
 *   GET /api/facets             — counts for filter UI
 *   GET /api/items/codes        — flat list of all codes (for SSG)
 *
 * CORS controlled by ALLOWED_ORIGINS in wrangler.toml. Cache via Cache API
 * with 1h TTL. Pass `cache-control: no-cache` to bypass.
 */

import type { SearchFilters, SearchQuery } from '@shared/types';
import type { Env } from './env';
import { corsHeaders, handlePreflight } from './cors';
import { getCached, makeCacheable, putInCache } from './cache';
import { getFacets, getItem, hybridSearch, listAllCodes } from './query';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(body), { ...init, headers });
}

function attachCors(res: Response, req: Request, allowed: string): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(req, allowed))) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function parseSearchQuery(url: URL): SearchQuery {
  const filters: SearchFilters = {};
  const setIf = <K extends keyof SearchFilters>(k: K, v: SearchFilters[K]) => {
    if (v !== undefined) filters[k] = v;
  };

  const t = url.searchParams.get('type');
  if (t === 'video' || t === 'photo' || t === 'document') setIf('type', t);
  const client = url.searchParams.get('client');
  if (client) setIf('client', client);
  const project = url.searchParams.get('project');
  if (project) setIf('project', project);
  const location = url.searchParams.get('location');
  if (location) setIf('location', location);
  const yf = url.searchParams.get('year_from');
  if (yf) setIf('year_from', Number(yf));
  const yt = url.searchParams.get('year_to');
  if (yt) setIf('year_to', Number(yt));
  const tags = url.searchParams.get('tags');
  if (tags) setIf('tags', tags.split(',').map((t) => t.trim()).filter(Boolean));

  const out: SearchQuery = {
    page: Number(url.searchParams.get('page') ?? '1'),
    page_size: Number(url.searchParams.get('page_size') ?? '24'),
  };
  const q = url.searchParams.get('q');
  if (q !== null) out.q = q;
  if (Object.keys(filters).length > 0) out.filters = filters;
  return out;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Preflight
    const preflight = handlePreflight(req, env.ALLOWED_ORIGINS);
    if (preflight) return preflight;

    const url = new URL(req.url);

    // Cache lookup (only for GET)
    if (req.method === 'GET') {
      const cached = await getCached(req);
      if (cached) return attachCors(cached, req, env.ALLOWED_ORIGINS);
    }

    let response: Response;
    try {
      response = await route(req, env, url);
    } catch (e) {
      console.error('[search] error', (e as Error).message);
      response = jsonResponse({ error: 'internal_error', message: (e as Error).message }, { status: 500 });
    }

    if (req.method === 'GET' && response.status === 200) {
      const cacheable = makeCacheable(response);
      putInCache(ctx, req, cacheable);
      return attachCors(cacheable, req, env.ALLOWED_ORIGINS);
    }
    return attachCors(response, req, env.ALLOWED_ORIGINS);
  },
};

async function route(req: Request, env: Env, url: URL): Promise<Response> {
  if (req.method === 'GET' && url.pathname === '/') {
    return jsonResponse({ ok: true, worker: 'search', env: env.ENVIRONMENT });
  }

  if (req.method === 'GET' && url.pathname === '/api/search') {
    const query = parseSearchQuery(url);
    const result = await hybridSearch(query, {
      db: env.DB,
      ai: env.AI,
      vectorize: env.VECTORIZE,
      model: env.EMBED_MODEL,
    });
    return jsonResponse(result);
  }

  if (req.method === 'GET' && url.pathname === '/api/facets') {
    const facets = await getFacets(env.DB);
    return jsonResponse(facets);
  }

  if (req.method === 'GET' && url.pathname === '/api/items/codes') {
    const codes = await listAllCodes(env.DB);
    return jsonResponse({ codes });
  }

  const itemMatch = url.pathname.match(/^\/api\/item\/([A-Za-z0-9_-]+)$/);
  if (req.method === 'GET' && itemMatch) {
    const code = itemMatch[1] as string;
    const item = await getItem(env.DB, code);
    if (!item) return jsonResponse({ error: 'not_found' }, { status: 404 });
    return jsonResponse(item);
  }

  return jsonResponse({ error: 'not_found' }, { status: 404 });
}
