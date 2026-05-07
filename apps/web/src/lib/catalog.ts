import type {
  Facets,
  MediaItem,
  SearchFilters,
  SearchQuery,
  SearchResult,
} from '@shared/types';

const API_BASE = import.meta.env.PUBLIC_SEARCH_API ?? 'http://localhost:8788';

function buildSearchURL(query: SearchQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.page) params.set('page', String(query.page));
  if (query.page_size) params.set('page_size', String(query.page_size));

  const f: SearchFilters = query.filters ?? {};
  if (f.type) params.set('type', f.type);
  if (f.client) params.set('client', f.client);
  if (f.project) params.set('project', f.project);
  if (f.location) params.set('location', f.location);
  if (f.year_from !== undefined) params.set('year_from', String(f.year_from));
  if (f.year_to !== undefined) params.set('year_to', String(f.year_to));
  if (f.tags && f.tags.length > 0) params.set('tags', f.tags.join(','));

  return `${API_BASE}/api/search?${params.toString()}`;
}

export async function search(
  query: SearchQuery,
  init?: RequestInit,
): Promise<SearchResult> {
  const res = await fetch(buildSearchURL(query), init);
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  return (await res.json()) as SearchResult;
}

export async function getItem(code: string): Promise<MediaItem | null> {
  const res = await fetch(`${API_BASE}/api/item/${encodeURIComponent(code)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`item fetch failed: ${res.status}`);
  return (await res.json()) as MediaItem;
}

export async function getFacets(): Promise<Facets> {
  const res = await fetch(`${API_BASE}/api/facets`);
  if (!res.ok) throw new Error(`facets fetch failed: ${res.status}`);
  return (await res.json()) as Facets;
}

export async function listAllCodes(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/items/codes`);
  if (!res.ok) throw new Error(`codes fetch failed: ${res.status}`);
  const body = (await res.json()) as { codes: string[] };
  return body.codes;
}
