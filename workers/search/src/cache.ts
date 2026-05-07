/**
 * Wrapper alrededor de Cloudflare Cache API.
 *
 * Las respuestas se cachean por URL completa (que incluye query params).
 * TTL configurable; default 1h. Bypass con header `cache-control: no-cache`
 * en la request (útil para debugging).
 */

const DEFAULT_TTL = 60 * 60; // 1h

export async function getCached(req: Request): Promise<Response | null> {
  if (req.headers.get('cache-control') === 'no-cache') return null;
  const cache = caches.default;
  const hit = await cache.match(req);
  return hit ?? null;
}

export function makeCacheable(res: Response, ttlSec: number = DEFAULT_TTL): Response {
  // Clonamos para mutar headers sin romper el caller.
  const headers = new Headers(res.headers);
  headers.set('cache-control', `public, max-age=${ttlSec}, s-maxage=${ttlSec}`);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export function putInCache(ctx: ExecutionContext, req: Request, res: Response): void {
  // ctx.waitUntil → no bloquea la response.
  ctx.waitUntil(caches.default.put(req, res.clone()));
}
