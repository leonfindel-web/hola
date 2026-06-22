<script lang="ts">
  import type { PieceLite, ServiceType } from '../lib/catalog-data';

  interface ClientFacet {
    value: string;
    count: number;
  }
  interface Dict {
    searchPlaceholder: string;
    filterAll: string;
    filterService: string;
    filterClient: string;
    filterYear: string;
    filterPlace: string;
    clearFilters: string;
    emptyDefault: string;
    emptyNoResults: string;
    /** Noun for the result count, e.g. ["piece", "pieces"]. */
    nounSingular: string;
    nounPlural: string;
  }
  interface ServiceLabels {
    Industrial: string;
    Academico: string;
    Corporativo: string;
  }

  interface Props {
    pieces: PieceLite[];
    serviceTypes: ServiceType[];
    clients: ClientFacet[];
    years: number[];
    places: ClientFacet[];
    workBase: string;
    dict: Dict;
    serviceLabels: ServiceLabels;
  }

  let {
    pieces,
    serviceTypes,
    clients,
    years,
    places,
    workBase,
    dict,
    serviceLabels,
  }: Props = $props();

  let query = $state('');
  let activeService = $state<ServiceType | null>(null);
  let activeClient = $state('');
  let activeYear = $state('');
  let activePlace = $state('');

  const PAGE = 48;
  let limit = $state(PAGE);

  const normalizedQuery = $derived(query.trim().toLowerCase());

  const filtered = $derived(
    pieces.filter((p) => {
      if (activeService && p.serviceType !== activeService) return false;
      if (activeClient && p.client !== activeClient) return false;
      if (activeYear && String(p.year ?? '') !== activeYear) return false;
      if (activePlace && p.place !== activePlace) return false;
      if (normalizedQuery && !p.haystack.includes(normalizedQuery)) return false;
      return true;
    }),
  );

  const visible = $derived(filtered.slice(0, limit));
  const hasActiveFilters = $derived(
    Boolean(normalizedQuery || activeService || activeClient || activeYear || activePlace),
  );

  function serviceLabel(s: ServiceType): string {
    return serviceLabels[s] ?? s;
  }

  function setService(s: ServiceType | null): void {
    activeService = activeService === s ? null : s;
    limit = PAGE;
  }

  function clearAll(): void {
    query = '';
    activeService = null;
    activeClient = '';
    activeYear = '';
    activePlace = '';
    limit = PAGE;
  }

  // Reset pagination whenever any secondary filter or query changes.
  $effect(() => {
    void normalizedQuery;
    void activeClient;
    void activeYear;
    void activePlace;
    limit = PAGE;
  });
</script>

<div class="browser">
  <div class="controls">
    <input
      class="search"
      type="search"
      bind:value={query}
      placeholder={dict.searchPlaceholder}
      aria-label={dict.searchPlaceholder}
      autocomplete="off"
    />

    <div class="service-tabs" role="group" aria-label={dict.filterService}>
      <button
        class="tab"
        class:tab--active={activeService === null}
        onclick={() => setService(null)}
        type="button">{dict.filterAll}</button
      >
      {#each serviceTypes as s (s)}
        <button
          class="tab"
          class:tab--active={activeService === s}
          onclick={() => setService(s)}
          type="button">{serviceLabel(s)}</button
        >
      {/each}
    </div>

    <div class="secondary">
      <label class="sel">
        <span class="sel__label">{dict.filterClient}</span>
        <select bind:value={activeClient}>
          <option value="">{dict.filterAll}</option>
          {#each clients as c (c.value)}
            <option value={c.value}>{c.value} ({c.count})</option>
          {/each}
        </select>
      </label>

      <label class="sel">
        <span class="sel__label">{dict.filterYear}</span>
        <select bind:value={activeYear}>
          <option value="">{dict.filterAll}</option>
          {#each years as y (y)}
            <option value={String(y)}>{y}</option>
          {/each}
        </select>
      </label>

      <label class="sel">
        <span class="sel__label">{dict.filterPlace}</span>
        <select bind:value={activePlace}>
          <option value="">{dict.filterAll}</option>
          {#each places as p (p.value)}
            <option value={p.value}>{p.value} ({p.count})</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="meta-row">
      <p class="count">
        {filtered.length}
        {filtered.length === 1 ? dict.nounSingular : dict.nounPlural}
      </p>
      {#if hasActiveFilters}
        <button class="clear" type="button" onclick={clearAll}>{dict.clearFilters}</button>
      {/if}
    </div>
  </div>

  {#if filtered.length === 0}
    <div class="empty">
      <p>{hasActiveFilters ? dict.emptyNoResults : dict.emptyDefault}</p>
    </div>
  {:else}
    <ul class="grid">
      {#each visible as p (p.slug)}
        <li>
          <a class="card" href={`${workBase}/${p.slug}`}>
            <div class="card__media">
              {#if p.thumbnail}
                <img src={p.thumbnail} alt={p.title} loading="lazy" decoding="async" />
              {:else}
                <div class="card__placeholder" aria-hidden="true">
                  <span class="card__placeholder-mark">{p.code ?? '—'}</span>
                </div>
              {/if}
              {#if p.serviceType}
                <span class="card__type card__type--{p.serviceType.toLowerCase()}"
                  >{serviceLabel(p.serviceType)}</span
                >
              {/if}
              {#if p.hasVideo}
                <span class="card__play" aria-hidden="true">▶</span>
              {/if}
            </div>
            <div class="card__body">
              <h3 class="card__title">{p.title}</h3>
              <p class="card__sub">
                {[p.client, p.place, p.year].filter(Boolean).join(' · ') || ' '}
              </p>
              {#if p.code}
                <p class="card__code">{p.code}</p>
              {/if}
            </div>
          </a>
        </li>
      {/each}
    </ul>

    {#if visible.length < filtered.length}
      <div class="more">
        <button type="button" onclick={() => (limit += PAGE)}>
          + {Math.min(PAGE, filtered.length - visible.length)}
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  .search {
    width: 100%;
    font-size: 1.05rem;
    padding: 0.85rem 1.1rem;
    background: var(--color-bg-elev);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    color: var(--color-fg);
  }
  .service-tabs {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .tab {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    letter-spacing: var(--tracking-code);
    padding: 0.45rem 0.9rem;
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-fg-muted);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all var(--dur-fast) var(--ease);
  }
  .tab:hover {
    border-color: var(--color-border-strong);
    color: var(--color-fg);
  }
  .tab--active {
    background: var(--color-accent-soft);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
  .secondary {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .sel {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 12rem;
    flex: 1;
  }
  .sel__label {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--color-fg-faint);
  }
  select {
    width: 100%;
    background: var(--color-bg-elev);
    color: var(--color-fg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.55rem 0.65rem;
  }
  .meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-top: 1px solid var(--color-border);
    padding-top: 0.85rem;
  }
  .count {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    letter-spacing: var(--tracking-code);
    color: var(--color-fg-muted);
  }
  .clear {
    font-size: 0.8rem;
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-fg-muted);
    border-radius: var(--radius);
    padding: 0.4rem 0.8rem;
    cursor: pointer;
  }
  .clear:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(248px, 1fr));
    gap: 1rem;
  }
  .card {
    display: block;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    color: inherit;
    transition:
      transform var(--dur) var(--ease),
      border-color var(--dur) var(--ease);
  }
  .card:hover {
    border-color: var(--color-accent);
    transform: translateY(-3px);
  }
  .card__media {
    position: relative;
    aspect-ratio: 16 / 9;
    background:
      radial-gradient(circle at 30% 25%, #1d1d20, var(--color-bg-elev));
    overflow: hidden;
  }
  .card__media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .card__placeholder {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }
  .card__placeholder-mark {
    font-family: var(--font-mono);
    font-size: 1.1rem;
    letter-spacing: var(--tracking-code);
    color: var(--color-fg-faint);
  }
  .card__type {
    position: absolute;
    left: 0.5rem;
    top: 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.62rem;
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
    padding: 0.2rem 0.45rem;
    border-radius: var(--radius-sm);
    background: var(--color-bg-overlay);
    color: var(--color-fg-muted);
    border: 1px solid var(--color-border);
  }
  .card__type--industrial {
    color: var(--color-industrial);
  }
  .card__type--academico {
    color: var(--color-academico);
  }
  .card__type--corporativo {
    color: var(--color-corporativo);
  }
  .card__play {
    position: absolute;
    right: 0.5rem;
    bottom: 0.5rem;
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    background: var(--color-bg-overlay);
    font-size: 0.65rem;
    color: var(--color-fg);
  }
  .card__body {
    padding: 0.8rem 0.9rem 0.9rem;
  }
  .card__title {
    font-size: 0.95rem;
    line-height: 1.3;
    margin: 0 0 0.3rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card__sub {
    margin: 0 0 0.3rem;
    font-size: 0.8rem;
    color: var(--color-fg-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .card__code {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: var(--tracking-code);
    color: var(--color-fg-faint);
  }
  .empty {
    padding: 4rem 1rem;
    text-align: center;
    color: var(--color-fg-muted);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
  }
  .more {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
  }
  .more button {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    padding: 0.7rem 2rem;
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-fg-muted);
    border-radius: var(--radius);
    cursor: pointer;
  }
  .more button:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }
</style>
