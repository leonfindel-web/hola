<script lang="ts">
  import type { Facets, SearchFilters, SearchHit, SearchResult } from '@shared/types';
  import { getFacets, search } from '../lib/catalog';
  import Filters from './Filters.svelte';
  import SearchBar from './SearchBar.svelte';

  interface Props {
    initialHits?: SearchHit[];
    initialTotal?: number;
  }

  let { initialHits = [], initialTotal = 0 }: Props = $props();

  let hits = $state<SearchHit[]>(initialHits);
  let total = $state(initialTotal);
  let took = $state<number | null>(null);
  let q = $state('');
  let filters = $state<SearchFilters>({});
  let facets = $state<Facets | null>(null);
  let loadingFacets = $state(true);

  async function loadFacets(): Promise<void> {
    try {
      facets = await getFacets();
    } catch {
      facets = null;
    } finally {
      loadingFacets = false;
    }
  }

  async function refresh(): Promise<void> {
    const res = await search({ q, filters, page: 1, page_size: 24 });
    hits = res.hits;
    total = res.total;
    took = res.took_ms;
  }

  function onResults(res: SearchResult, query: string): void {
    hits = res.hits;
    total = res.total;
    took = res.took_ms;
    q = query;
  }

  function onFiltersChange(next: SearchFilters): void {
    filters = next;
    refresh();
  }

  // Eager-load facets on mount
  $effect(() => {
    loadFacets();
  });
</script>

<SearchBar onResults={onResults} />

<div class="layout">
  <div class="sidebar">
    {#if loadingFacets}
      <p class="muted">Cargando filtros…</p>
    {:else}
      <Filters {facets} value={filters} onChange={onFiltersChange} />
    {/if}
  </div>

  <div class="main">
    <header class="results-header">
      <p class="muted">
        {total} resultado{total === 1 ? '' : 's'}
        {#if took !== null}<span class="faint"> · {took}ms</span>{/if}
      </p>
    </header>

    {#if hits.length === 0}
      <div class="empty">
        <p>No hay resultados todavía. Empezá tipeando un cliente, año, locación o palabra clave.</p>
      </div>
    {:else}
      <ul class="grid">
        {#each hits as hit (hit.item.code)}
          <li>
            <a class="card" href={`/work/${hit.item.code}`}>
              <div class="card__media">
                {#if hit.item.thumbnail_url}
                  <img src={hit.item.thumbnail_url} alt={hit.item.title} loading="lazy" />
                {:else}
                  <div class="card__placeholder">{hit.item.code}</div>
                {/if}
              </div>
              <div class="card__body">
                <h3>{hit.item.title}</h3>
                <p class="muted">
                  {[hit.item.client, hit.item.year].filter(Boolean).join(' · ')}
                </p>
                <p class="faint code">{hit.item.code}</p>
              </div>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 1.5rem;
  }
  @media (max-width: 720px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
  .results-header {
    margin-bottom: 1rem;
  }
  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }
  .card {
    display: block;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: transform 0.18s ease, border-color 0.18s ease;
  }
  .card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
  .card__media {
    aspect-ratio: 16 / 9;
    background: var(--bg-elev);
  }
  .card__media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .card__placeholder {
    display: grid;
    place-items: center;
    height: 100%;
    color: var(--fg-faint);
    font-family: var(--font-mono);
  }
  .card__body {
    padding: 0.75rem 0.875rem 0.875rem;
  }
  h3 {
    font-size: 0.95rem;
    margin: 0 0 0.25rem;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  p {
    margin: 0 0 0.15rem;
    font-size: 0.85rem;
  }
  .code {
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .empty {
    padding: 3rem 1rem;
    text-align: center;
    color: var(--fg-muted);
    border: 1px dashed var(--border);
    border-radius: var(--radius-lg);
  }
</style>
