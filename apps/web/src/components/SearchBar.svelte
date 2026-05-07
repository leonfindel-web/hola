<script lang="ts">
  import { onMount } from 'svelte';
  import type { SearchQuery, SearchResult } from '@shared/types';
  import { search } from '../lib/catalog';

  interface Props {
    initialQuery?: string;
    onResults?: (result: SearchResult, q: string) => void;
  }

  let { initialQuery = '', onResults }: Props = $props();

  let q = $state(initialQuery);
  let loading = $state(false);
  let lastError = $state<string | null>(null);
  let debounceId: ReturnType<typeof setTimeout> | undefined;
  let abortController: AbortController | undefined;

  async function runSearch(query: string): Promise<void> {
    abortController?.abort();
    abortController = new AbortController();
    loading = true;
    lastError = null;
    try {
      const params: SearchQuery = { q: query, page: 1, page_size: 24 };
      const res = await search(params, { signal: abortController.signal });
      onResults?.(res, query);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      lastError = (e as Error).message;
    } finally {
      loading = false;
    }
  }

  function onInput(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    q = value;
    if (debounceId) clearTimeout(debounceId);
    debounceId = setTimeout(() => runSearch(value), 200);
  }

  function onSubmit(e: SubmitEvent): void {
    e.preventDefault();
    if (debounceId) clearTimeout(debounceId);
    runSearch(q);
  }

  onMount(() => {
    if (initialQuery) runSearch(initialQuery);
  });
</script>

<form class="search" onsubmit={onSubmit} role="search">
  <input
    type="search"
    name="q"
    value={q}
    oninput={onInput}
    placeholder="Buscar por cliente, locación, año, palabras clave…"
    aria-label="Buscar en el portfolio"
    autocomplete="off"
  />
  <button type="submit" disabled={loading}>{loading ? '…' : 'Buscar'}</button>
  {#if lastError}
    <p class="error" role="alert">Error: {lastError}</p>
  {/if}
</form>

<style>
  .search {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  input[type='search'] {
    flex: 1;
    font-size: 1rem;
    padding: 0.75rem 1rem;
  }
  button {
    padding: 0.75rem 1.25rem;
    font-weight: 500;
  }
  .error {
    flex-basis: 100%;
    color: #ff8585;
    font-size: 0.875rem;
    margin: 0.5rem 0 0;
  }
</style>
