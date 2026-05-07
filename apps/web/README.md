# `apps/web` — Astro frontend

## Local dev

```bash
npm install
cp .env.example .env  # apuntar PUBLIC_SEARCH_API al worker local
npm run dev           # http://localhost:4321
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Manualmente:

```bash
npm run build
wrangler pages deploy dist --project-name=leonfindel
```

En CI, `.github/workflows/deploy.yml` se encarga.

## Estructura

```
src/
├── pages/
│   ├── index.astro          # /
│   ├── work/
│   │   ├── index.astro      # /work — galería + buscador (Svelte islands)
│   │   └── [code].astro     # /work/B052 — detalle (SSG via getStaticPaths)
│   ├── about.astro
│   ├── contact.astro
│   └── 404.astro
├── components/
│   ├── SearchBar.svelte     # island
│   ├── Filters.svelte       # island
│   ├── ResultsGrid.svelte   # island (compone los anteriores)
│   └── MediaCard.astro      # estático
├── layouts/Base.astro
├── lib/
│   ├── catalog.ts           # cliente HTTP del Worker SEARCH
│   └── seo.ts
└── styles/global.css
```

## Sobre los islands

`ResultsGrid.svelte` se monta con `client:load` en `/work`. Compone `SearchBar` + `Filters` y
maneja el estado local de la búsqueda. Cero estado global, cero stores externos.

## SSG y `getStaticPaths`

`/work/[code]` se prerendea con todas las páginas de detalle en build time, pidiéndole al Worker
SEARCH la lista completa de códigos via `/api/items/codes`. Si el worker no está accesible (por
ejemplo, primer build antes de Fase 4 deployada), el array sale vacío y la página simplemente no
se genera — el sitio sigue construyendo.
