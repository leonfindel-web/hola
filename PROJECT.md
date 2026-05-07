# Leonfindel — Portfolio Buscable

> Documento maestro del proyecto. Pensado para trabajarse desde **Claude Code** paso a paso.
> Cada fase es un PR/commit independiente. No saltar fases.

---

## 0. Contexto y objetivo

### Cliente
**Leonfindel** — productora audiovisual chilena (video + foto). Sitio actual: `https://leonfindel.cl` (WordPress + Elementor, single-page landing minimalista).

### Problema que resuelve este proyecto
El **contenido real** de Leonfindel vive disperso:
- Videos en **Vimeo** (plan Plus, ~1500+ items)
- Fotos en **Flickr**
- Catálogo maestro en un **Excel propio** (con códigos tipo `B052`, `B053`...)

El sitio actual no permite explorar nada de eso. El visitante ve 4 cards de servicios y 3 botones de redes. **No hay portfolio navegable, no hay buscador, no hay SEO sobre el catálogo.**

### Objetivo
Construir un sitio nuevo que:
1. Indexe el catálogo del Excel + Vimeo + Flickr en una sola galería buscable.
2. Tenga búsqueda híbrida (léxica + semántica) con filtros estructurados.
3. Genere páginas individuales por item (SEO de cola larga).
4. Performance edge global (Lighthouse 100, TTFB < 50ms).
5. Costo operativo < 5 USD/mes.
6. Workflow de actualización: Leonfindel sigue editando su Excel, el sitio se autoactualiza.

### Source of truth
**El Excel es la columna vertebral**, no Vimeo ni Flickr.
- Vimeo aporta media de video (thumbnail, duración, embed URL) — join por código en el título.
- Flickr aporta media de foto — join por código (a confirmar cómo está mapeado).
- Excel aporta toda la metadata rica: cliente, proyecto, año, locación, tags, descripción.

**Posicionamiento al cliente:** "saquemos provecho público de tu archivo profesional de 20+ años", no "hagamos un sitio nuevo".

---

## 1. Stack técnico

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | **Astro 5+** | SSG por defecto, islands para interactividad puntual, View Transitions nativas, mejor SEO posible |
| UI islands | **Svelte 5** | Más liviano que React para search bar + filtros |
| Hosting | **Cloudflare Pages** | Free tier generoso, edge global, integración nativa con Workers |
| Search API | **Cloudflare Worker** (HTTP) | Endpoint `/api/search` con D1 + Vectorize |
| Ingest job | **Cloudflare Worker** (Cron) | Mensual: lee Excel + Vimeo + Flickr, normaliza, indexa |
| Storage estructurado | **Cloudflare D1** (SQLite) | Catálogo + FTS5 para búsqueda léxica |
| Storage vectorial | **Cloudflare Vectorize** | Búsqueda semántica multilingüe |
| Embeddings | **Workers AI** (`@cf/baai/bge-m3` o multilingual) | Soporta español + inglés + portugués |
| Excel sync | **Google Sheets API** | El Excel se sube a Sheets, Worker lo lee mensualmente |
| CI/CD | **GitHub Actions** + Wrangler | Deploy automático en push a `main` |
| DNS | **Cloudflare** | Apex + www → Pages |

**Mismo stack que Kontext**, ajustado para portfolio audiovisual.

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         VISITANTE                            │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ HTML/CSS/JS                  │ /api/search
               ▼                              ▼
       ┌──────────────┐              ┌─────────────────┐
       │  Cloudflare  │              │  Worker SEARCH  │
       │    Pages     │              │   (HTTP)        │
       │  (Astro SSG) │              └────┬───────┬────┘
       └──────────────┘                   │       │
                                          ▼       ▼
                                       ┌────┐  ┌──────────┐
                                       │ D1 │  │Vectorize │
                                       │FTS5│  │embeddings│
                                       └─▲──┘  └────▲─────┘
                                         │          │
                                         │          │
       ┌─────────────────────────────────┴──────────┴────────┐
       │                Worker INGEST (Cron mensual)          │
       │  1. Lee Google Sheet (Excel)                         │
       │  2. Lee Vimeo API → join por código                  │
       │  3. Lee Flickr API → join por código                 │
       │  4. Normaliza a schema común                         │
       │  5. Upsert a D1                                      │
       │  6. Genera embeddings (Workers AI) → Vectorize       │
       └──────────────────────────────────────────────────────┘
```

### Decisiones clave

- **Cron mensual** (`0 3 1 * *`): el catálogo cambia despacio. Endpoint manual `/admin/reindex` con secret para forzar.
- **Worker 3 (proxy de thumbnails)**: descartado en MVP. Se agrega solo si hay problemas de velocidad o links rotos.
- **Build-time vs runtime search**: con 1500+ items + búsqueda semántica, runtime (Worker + D1 + Vectorize) gana. Build-time (Pagefind) descartado.
- **Páginas de detalle**: SSG en build (`/work/[code]`), una página HTML por item, ~1500 páginas estáticas. Sitemap generado.

---

## 3. Estructura del repo (monorepo simple, sin pnpm workspaces)

```
leonfindel/
├── README.md
├── PROJECT.md                    # Este documento
├── .gitignore
├── .github/workflows/deploy.yml  # CI: build + deploy a Pages + Workers
│
├── apps/
│   └── web/                      # Astro
│       ├── package.json
│       ├── astro.config.mjs
│       ├── tsconfig.json
│       ├── public/
│       └── src/
│           ├── pages/
│           │   ├── index.astro          # Home
│           │   ├── work/
│           │   │   ├── index.astro      # Galería + buscador
│           │   │   └── [code].astro     # Detalle dinámico (SSG)
│           │   ├── about.astro
│           │   └── contact.astro
│           ├── components/
│           │   ├── SearchBar.svelte     # Island
│           │   ├── ResultsGrid.svelte   # Island
│           │   ├── Filters.svelte       # Island
│           │   └── MediaCard.astro      # Estático
│           ├── layouts/
│           │   └── Base.astro
│           └── lib/
│               ├── catalog.ts           # Helpers para fetch a /api/search
│               └── seo.ts
│
├── workers/
│   ├── ingest/
│   │   ├── package.json
│   │   ├── wrangler.toml
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                 # Handler scheduled() + fetch() admin
│   │       ├── sources/
│   │       │   ├── sheets.ts            # Google Sheets reader
│   │       │   ├── vimeo.ts             # Vimeo API client
│   │       │   └── flickr.ts            # Flickr API client
│   │       ├── normalize.ts             # Excel + Vimeo + Flickr → schema D1
│   │       ├── db.ts                    # Upserts a D1
│   │       └── embed.ts                 # Workers AI → Vectorize
│   │
│   └── search/
│       ├── package.json
│       ├── wrangler.toml
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts                 # Handler fetch()
│           ├── query.ts                 # Hybrid search: FTS5 + Vectorize + RRF
│           └── cache.ts                 # Cache API helpers
│
├── shared/
│   └── types.ts                         # MediaItem, SearchResult, etc. (compartido)
│
└── data/
    ├── schema.sql                       # D1 schema + FTS5 + índices
    ├── sample-catalog.csv               # Sample del Excel para dev
    └── README.md                        # Cómo regenerar D1 local
```

---

## 4. Schema de D1 (preliminar — se ajusta al ver el Excel real)

```sql
-- data/schema.sql

CREATE TABLE IF NOT EXISTS media (
  -- Llave primaria del sistema interno de Leonfindel
  code TEXT PRIMARY KEY,                  -- B052, B053, F001, etc.

  -- Origen del media
  source TEXT NOT NULL,                   -- 'vimeo' | 'flickr' | 'excel-only'
  source_id TEXT,                         -- ID en Vimeo/Flickr (NULL si solo Excel)
  source_url TEXT,                        -- URL pública en Vimeo/Flickr

  -- Tipo
  type TEXT NOT NULL,                     -- 'video' | 'photo' | 'document'

  -- Metadata desde Excel (PRIMARIA)
  title TEXT NOT NULL,
  client TEXT,
  project TEXT,
  location TEXT,
  year INTEGER,
  description TEXT,
  tags TEXT,                              -- JSON array

  -- Metadata desde Vimeo/Flickr (SECUNDARIA, para enriquecer)
  thumbnail_url TEXT,
  duration_sec INTEGER,                   -- solo videos
  width INTEGER,
  height INTEGER,
  embed_url TEXT,                         -- URL para iframe

  -- Timestamps
  created_at INTEGER,                     -- de la fuente externa
  indexed_at INTEGER NOT NULL,            -- última vez que se indexó

  -- Vector
  vector_id TEXT                          -- ID en Vectorize
);

CREATE INDEX idx_media_source ON media(source);
CREATE INDEX idx_media_type ON media(type);
CREATE INDEX idx_media_year ON media(year);
CREATE INDEX idx_media_client ON media(client);

-- Full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS media_fts USING fts5(
  code UNINDEXED,
  title,
  client,
  project,
  location,
  description,
  tags,
  content='media',
  content_rowid='rowid'
);

-- Triggers para mantener FTS sincronizado
CREATE TRIGGER IF NOT EXISTS media_fts_insert AFTER INSERT ON media BEGIN
  INSERT INTO media_fts(rowid, code, title, client, project, location, description, tags)
  VALUES (new.rowid, new.code, new.title, new.client, new.project, new.location, new.description, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS media_fts_delete AFTER DELETE ON media BEGIN
  DELETE FROM media_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS media_fts_update AFTER UPDATE ON media BEGIN
  DELETE FROM media_fts WHERE rowid = old.rowid;
  INSERT INTO media_fts(rowid, code, title, client, project, location, description, tags)
  VALUES (new.rowid, new.code, new.title, new.client, new.project, new.location, new.description, new.tags);
END;

-- Tabla de auditoría de runs del cron
CREATE TABLE IF NOT EXISTS ingest_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  status TEXT NOT NULL,                   -- 'running' | 'success' | 'error'
  items_added INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT
);
```

---

## 5. Variables de entorno y secrets

### Workers (`wrangler secret put <NAME>`)

| Secret | Worker | Cómo obtenerlo |
|---|---|---|
| `VIMEO_TOKEN` | ingest | `developer.vimeo.com/apps` → crear app → personal access token (scopes: `public`, `private`) |
| `FLICKR_API_KEY` | ingest | `flickr.com/services/apps/create/apply` → non-commercial |
| `GOOGLE_SHEETS_CREDS` | ingest | Service account JSON desde Google Cloud Console (compartir el Sheet con email del SA) |
| `ADMIN_SECRET` | ingest, search | Generar con `openssl rand -hex 32` — protege endpoints `/admin/*` |

### Variables públicas (`wrangler.toml > [vars]`)

```toml
[vars]
VIMEO_USER_ID = "user/XXXXXXXX"           # confirmar el user_id real de Leonfindel
FLICKR_USER_ID = "XXXXXXXX@N00"
GOOGLE_SHEET_ID = "1AbCdEfG..."
ENVIRONMENT = "production"
```

---

## 6. Plan de fases (cada una = un PR)

### Fase 0 — Validación de inputs (PRE-CÓDIGO)
- [ ] Subir Excel a `data/sample-catalog.csv` (sample anonimizado de 20 filas).
- [ ] Confirmar columnas reales del Excel.
- [ ] Crear app en `developer.vimeo.com`, obtener token, hacer `curl` de prueba contra el user de Leonfindel.
- [ ] Crear API key de Flickr, listar 5 fotos del usuario.
- [ ] Confirmar user IDs (Vimeo y Flickr).
- [ ] Validar regex de extracción de código desde título de Vimeo (`^([A-Z]\d{3})\s`).
- [ ] **Salida:** `data/discovery.md` con hallazgos + ajustes al schema.

### Fase 1 — Scaffold del repo
- [ ] `git init`, estructura de directorios completa.
- [ ] `package.json` raíz con scripts orquestadores.
- [ ] `apps/web` con `npm create astro@latest` + integración Svelte + Cloudflare adapter.
- [ ] `workers/ingest` y `workers/search` con `wrangler.toml` mínimos.
- [ ] `.gitignore`, `tsconfig.json` por paquete, ESLint + Prettier compartidos.
- [ ] `shared/types.ts` con tipos `MediaItem`, `SearchQuery`, `SearchResult`.
- [ ] `README.md` con setup local en 5 comandos.

### Fase 2 — Infra Cloudflare
- [ ] `wrangler login`.
- [ ] `wrangler d1 create leonfindel` → guardar `database_id`.
- [ ] Aplicar `data/schema.sql`: `wrangler d1 execute leonfindel --file=data/schema.sql`.
- [ ] `wrangler vectorize create leonfindel-media --dimensions=1024 --metric=cosine` (1024 = bge-m3).
- [ ] Vincular bindings en `wrangler.toml` de ambos Workers.
- [ ] `wrangler secret put` para los 4 secrets en cada Worker.
- [ ] **Salida:** `infra/SETUP.md` con todos los comandos ejecutados (idempotente).

### Fase 3 — Worker INGEST
- [ ] `sources/sheets.ts`: leer Sheet con Google Sheets API REST + service account JWT.
- [ ] `sources/vimeo.ts`: paginar `/users/{id}/videos`, extraer código del título.
- [ ] `sources/flickr.ts`: paginar `flickr.people.getPublicPhotos`, extraer código (de tag o título).
- [ ] `normalize.ts`: merge por código, schema unificado.
- [ ] `db.ts`: upsert idempotente a D1 con prepared statements + batching.
- [ ] `embed.ts`: generar embedding con Workers AI, upsert a Vectorize, guardar `vector_id` en D1.
- [ ] `index.ts`: handler `scheduled()` + handler `fetch()` para `/admin/reindex` y `/admin/status`.
- [ ] Tests con `vitest` y `@cloudflare/vitest-pool-workers` (mock APIs externas).
- [ ] Deploy: `wrangler deploy`.
- [ ] **Validación:** ejecutar manualmente, verificar D1 + Vectorize poblados.

### Fase 4 — Worker SEARCH
- [ ] `query.ts`: función `hybridSearch(q, filters)`:
  - Si `q` vacío → solo D1 con WHERE + ORDER.
  - Si `q` con texto → en paralelo:
    - FTS5 sobre `media_fts` con bm25.
    - Vectorize: embedding de `q` → `query()` top 50.
  - Reciprocal Rank Fusion (k=60), top N final.
- [ ] `cache.ts`: Cache API con clave `q+filtros+page`, TTL 1h, headers `cache-control` apropiados.
- [ ] `index.ts`: handler `fetch()`:
  - `GET /api/search` → busca.
  - `GET /api/item/{code}` → fetch único.
  - `GET /api/facets` → counts por client/year/type para UI de filtros.
- [ ] CORS configurado solo para `leonfindel.cl` y `localhost:4321`.
- [ ] Tests.
- [ ] Deploy.

### Fase 5 — Frontend Astro
- [ ] Layout base con tipografía y colores definidos (sobrio, audiovisual, no copiar Kontext).
- [ ] `pages/work/index.astro` con `SearchBar`, `Filters`, `ResultsGrid` como islands.
- [ ] `pages/work/[code].astro` con `getStaticPaths()` que llama a `/api/item-list` (endpoint nuevo en Worker SEARCH) → genera 1500 páginas estáticas.
- [ ] Cada detalle: embed de Vimeo o lightbox de Flickr, metadata estructurada (`VideoObject` / `ImageObject`), botones de share.
- [ ] Sitemap dinámico generado en build (`@astrojs/sitemap`).
- [ ] `og:image` por item (puede ser el thumbnail, en MVP).
- [ ] View Transitions entre lista y detalle.
- [ ] Lighthouse 100 mobile y desktop.

### Fase 6 — CI/CD
- [ ] `.github/workflows/deploy.yml`:
  - Job `lint-test`: ESLint + tests en cada PR.
  - Job `deploy-workers`: `wrangler deploy` en push a `main`.
  - Job `deploy-pages`: build Astro + Pages deploy en push a `main`.
- [ ] Secrets de GitHub: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- [ ] Branch protection en `main`: requiere CI verde + review.

### Fase 7 — Dominio y go-live
- [ ] Apuntar `leonfindel.cl` y `www.leonfindel.cl` a Pages.
- [ ] Backup completo del WordPress actual (por si hay que volver).
- [ ] Plan de migración: deploy en `nuevo.leonfindel.cl` primero, validar 1 semana, swap.
- [ ] Robots.txt + sitemap.xml en Search Console.
- [ ] Tracking básico: Cloudflare Web Analytics (sin cookies, gratis).

### Fase 8 — Mejoras (post-MVP)
- [ ] Worker 3 (proxy thumbnails) si hay problemas de velocidad o links rotos.
- [ ] Enriquecimiento de descripciones con LLM si la metadata del Excel es pobre en algunos items.
- [ ] OG images dinámicas con Cloudflare Workers + ImageResponse (Satori).
- [ ] Dashboard admin protegido con info de runs del cron (`/admin/dashboard`).
- [ ] Webhook desde Google Sheets → trigger reindex automático al editar (en lugar de esperar el cron mensual).

---

## 7. Convenciones del repo

### Git
- Branch principal: `main` (siempre desplegable).
- Feature branches: `feat/<scope>`, `fix/<scope>`, `chore/<scope>`.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Un PR = una fase del plan, salvo que sea muy grande.

### Código
- TypeScript estricto en todo (`"strict": true`).
- ESLint + Prettier con configs en raíz.
- Todo lo que toque APIs externas tiene tipos explícitos en `shared/types.ts`.
- Sin `any`. Sin `@ts-ignore` salvo justificado en comentario.

### Tests
- `vitest` en cada paquete.
- Workers: `@cloudflare/vitest-pool-workers` con bindings mock.
- Astro: tests E2E mínimos con Playwright en Fase 8.

### Documentación
- Cada fase deja un `.md` con lo aprendido (`infra/SETUP.md`, `data/discovery.md`, etc.).
- README de cada paquete con cómo correr local + cómo desplegar.

---

## 8. Cómo trabajar este proyecto desde Claude Code

### Setup inicial (una vez)
```bash
cd ~/Code   # o donde tengas tus repos
mkdir leonfindel && cd leonfindel
git init
# Pegar este PROJECT.md como primer commit
git add PROJECT.md
git commit -m "docs: initial project context"
```

### Workflow por fase
1. Abrir Claude Code en el directorio del repo.
2. Pedirle: *"Lee `PROJECT.md`. Ejecuta la Fase N completa. Crea los archivos necesarios, propone los comandos, no ejecutes nada destructivo sin confirmar."*
3. Revisar diff, ajustar, commitear.
4. Marcar checkboxes de la fase en `PROJECT.md`.
5. Push, PR, merge.

### Skills de Claude Code útiles
- `odoo-mcp-setup` no aplica (no es Odoo).
- `frontend-design` aplica para Fase 5 (Astro UI).
- `mcp-builder` no aplica (no estamos creando MCP).

### Reglas para Claude Code
- **No tocar `data/sample-catalog.csv` sin permiso** — es input del cliente.
- **Antes de aplicar `wrangler deploy`** mostrar el diff de configuración y pedir confirmación.
- **Antes de tocar D1 en producción** correr siempre primero contra `--local` o `--preview`.
- **Cualquier secret va por `wrangler secret put`**, nunca commiteado.

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Excel mal estructurado o inconsistente | Media | Fase 0 valida antes de codear |
| Vimeo API limita lo que devuelve por plan Plus | Media | Validar con `curl` en Fase 0; si limita, usar oEmbed como fallback |
| Códigos no extraíbles uniformemente del título de Vimeo | Media | Si falla el regex, requerir columna `vimeo_url` en el Excel |
| Flickr no tiene códigos en sus fotos | Alta | Plan B: mapeo manual en columna del Excel `flickr_url` |
| Workers AI no soporta bien español | Baja | `bge-m3` es multilingüe entrenado en 100+ idiomas |
| Cliente quiere editar desde el sitio | Baja | Fuera de scope MVP. Si insiste, Fase 8 con UI admin |
| Tráfico explota y rompe free tier | Muy baja | Worker Paid son $5/mes, escalable sin re-arquitectura |

---

## 10. Métricas de éxito

- **Lighthouse mobile:** Performance ≥ 95, SEO 100, Accessibility ≥ 95.
- **TTFB global:** < 100ms (medido desde 5 regiones con WebPageTest).
- **Search latency:** p95 < 200ms (con cache hit < 30ms).
- **Indexación:** 100% de items del Excel terminan en D1; ≥ 90% con embedding en Vectorize.
- **Costo Cloudflare:** ≤ 5 USD/mes el primer año.
- **SEO:** ≥ 50 páginas indexadas en Google al mes 2 post-launch.

---

## 11. Próxima acción inmediata

**Subir el Excel** (sample anonimizado de 20 filas a `data/sample-catalog.csv`) y ejecutar Fase 0.

Una vez validado, Claude Code puede ejecutar Fase 1 → Fase 7 de forma semi-autónoma, con check del humano entre fases.

---

*Documento vivo. Actualizar checkboxes y aprendizajes a medida que avanzan las fases.*
