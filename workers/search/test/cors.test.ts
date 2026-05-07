import { describe, expect, it } from 'vitest';
import { corsHeaders, handlePreflight } from '../src/cors';

const ALLOWED = 'https://leonfindel.cl,http://localhost:4321';

function reqWith(headers: HeadersInit, method = 'GET'): Request {
  return new Request('https://api.example.com/api/search', { method, headers });
}

describe('corsHeaders', () => {
  it('adds origin when in allowList', () => {
    const h = corsHeaders(reqWith({ origin: 'http://localhost:4321' }), ALLOWED);
    expect(h['access-control-allow-origin']).toBe('http://localhost:4321');
    expect(h.vary).toBe('Origin');
  });

  it('returns empty for unknown origin', () => {
    const h = corsHeaders(reqWith({ origin: 'https://evil.com' }), ALLOWED);
    expect(h).toEqual({});
  });

  it('returns empty when no origin', () => {
    const h = corsHeaders(reqWith({}), ALLOWED);
    expect(h).toEqual({});
  });
});

describe('handlePreflight', () => {
  it('returns null for non-OPTIONS', () => {
    expect(handlePreflight(reqWith({}), ALLOWED)).toBeNull();
  });
  it('returns 204 for OPTIONS', () => {
    const r = handlePreflight(reqWith({ origin: 'http://localhost:4321' }, 'OPTIONS'), ALLOWED);
    expect(r?.status).toBe(204);
  });
});
