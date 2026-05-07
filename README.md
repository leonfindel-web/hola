# Leonfindel — portfolio audiovisual buscable

Portfolio de Leonfindel (productora audiovisual chilena) con búsqueda híbrida
(léxica + semántica) sobre el catálogo del cliente.

> **Lectura obligada antes de tocar código:** `PROJECT.md` (qué hace y por qué) y
> `CLAUDE.md` (cómo trabajamos en este repo).

## Stack

| Capa | Tech |
|---|---|
| Frontend | Astro 5 + Svelte 5 (islands) |
| Hosting frontend | Cloudflare Pages |
| API search | Cloudflare Worker (`workers/search`) |
| Cron ingest | Cloudflare Worker (`workers/ingest`) |
| Storage | Cloudflare D1 + FTS5 |
| Vectores | Cloudflare Vectorize (1024d, bge-m3) |
| Embeddings | Workers AI |
| CMS | Google Sheets (Excel del cliente) |

Diagrama y decisiones detalladas en `PROJECT.md` §2.

## Estructura

```
.
├── apps/web/          # Astro frontend (Pages)
├── workers/
│   ├── ingest/        # Cron mensual + admin endpoints
│   └── search/        # API HTTP de búsqueda
├── shared/            # Tipos compartidos (MediaItem, SearchQuery, ...)
├── data/              # schema.sql, migrations, sample CSV, discovery.md
├── infra/             # SETUP.md (runbook idempotente)
└── .github/workflows/ # CI/CD
```

## Setup local en 5 comandos

```bash
git clone <repo> && cd leonfindel
npm run install:all                                    # instala todos los paquetes
cp apps/web/.env.example apps/web/.env                 # PUBLIC_SEARCH_API → http://localhost:8788
(cd workers/search && npm run dev) &                   # http://localhost:8788
npm --prefix apps/web run dev                          # http://localhost:4321
```

> Para el Worker INGEST necesitás secrets reales (Vimeo/Flickr/Google). Ver
> `infra/SETUP.md`.

## Comandos

| | |
|---|---|
| `npm run dev:web` | Astro dev server |
| `npm run dev:ingest` | Worker INGEST local |
| `npm run dev:search` | Worker SEARCH local |
| `npm run build:web` | Build estático Astro |
| `npm run typecheck` | TypeScript check de los 3 paquetes |
| `npm run lint` | Prettier + ESLint |
| `npm run format` | Prettier write |
| `npm test` | Tests de ambos workers |

## Estado del proyecto

Ver checkboxes en `PROJECT.md` §6. Hoy:

- [x] **Fase 1** — Scaffold completo
- [x] **Fase 2** — Schema + wrangler templates + runbook (sin ejecutar `wrangler` real todavía)
- [x] **Fase 3** — Worker INGEST scaffold (espera Excel real para finalizar `normalize.ts`)
- [x] **Fase 4** — Worker SEARCH completo
- [x] **Fase 5** — Astro frontend scaffold
- [x] **Fase 6** — CI/CD
- [ ] **Fase 0** — Validación de inputs (Excel + Vimeo + Flickr) → `data/discovery.md`
- [ ] **Fase 7** — Dominio y go-live

## Despliegue

Push a `main` → CI hace el resto (ver `.github/workflows/deploy.yml`).
El primer setup manual (D1, Vectorize, secrets, dominio) está en `infra/SETUP.md`.

## Créditos

Producido para Leonfindel. Stack y arquitectura son los mismos que se usaron
en Kontext, ajustados para portfolio audiovisual.
