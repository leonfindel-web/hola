<script lang="ts">
  import type { Facets, MediaType, SearchFilters } from '@shared/types';

  interface Props {
    facets: Facets | null;
    value: SearchFilters;
    onChange: (next: SearchFilters) => void;
  }

  let { facets, value, onChange }: Props = $props();

  function setType(t: MediaType | ''): void {
    onChange({ ...value, type: t === '' ? undefined : t });
  }

  function setClient(c: string): void {
    onChange({ ...value, client: c === '' ? undefined : c });
  }

  function setYearFrom(y: string): void {
    const n = y === '' ? undefined : Number(y);
    onChange({ ...value, year_from: n });
  }

  function setYearTo(y: string): void {
    const n = y === '' ? undefined : Number(y);
    onChange({ ...value, year_to: n });
  }
</script>

<aside class="filters" aria-label="Filtros">
  <fieldset>
    <legend>Tipo</legend>
    <label>
      <input
        type="radio"
        name="type"
        checked={value.type === undefined}
        onchange={() => setType('')}
      />
      Todos
    </label>
    <label>
      <input
        type="radio"
        name="type"
        checked={value.type === 'video'}
        onchange={() => setType('video')}
      />
      Video
    </label>
    <label>
      <input
        type="radio"
        name="type"
        checked={value.type === 'photo'}
        onchange={() => setType('photo')}
      />
      Foto
    </label>
  </fieldset>

  {#if facets && facets.client.length > 0}
    <fieldset>
      <legend>Cliente</legend>
      <select onchange={(e) => setClient((e.target as HTMLSelectElement).value)}>
        <option value="">Todos</option>
        {#each facets.client as c (c.value)}
          <option value={c.value} selected={value.client === c.value}>
            {c.value} ({c.count})
          </option>
        {/each}
      </select>
    </fieldset>
  {/if}

  <fieldset>
    <legend>Año</legend>
    <div class="year-range">
      <input
        type="number"
        min="1990"
        max="2100"
        placeholder="desde"
        value={value.year_from ?? ''}
        onchange={(e) => setYearFrom((e.target as HTMLInputElement).value)}
      />
      <input
        type="number"
        min="1990"
        max="2100"
        placeholder="hasta"
        value={value.year_to ?? ''}
        onchange={(e) => setYearTo((e.target as HTMLInputElement).value)}
      />
    </div>
  </fieldset>
</aside>

<style>
  .filters {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--bg-elev);
  }
  fieldset {
    border: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  legend {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--fg-muted);
    margin-bottom: 0.4rem;
  }
  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    cursor: pointer;
  }
  select {
    width: 100%;
  }
  .year-range {
    display: flex;
    gap: 0.5rem;
  }
  .year-range input {
    width: 100%;
  }
</style>
