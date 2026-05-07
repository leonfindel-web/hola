/**
 * CORS allowed origins are configured via ALLOWED_ORIGINS (comma-separated).
 * If the request origin is not in the list, no CORS headers are added — the
 * browser will block the response. Server-to-server callers don't care.
 */

export function corsHeaders(req: Request, allowed: string): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowList = allowed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!origin || !allowList.includes(origin)) {
    return {};
  }
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

export function handlePreflight(req: Request, allowed: string): Response | null {
  if (req.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: corsHeaders(req, allowed) });
}
