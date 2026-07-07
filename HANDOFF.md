# HANDOFF — Leonfindel · guía inicial para retomar el proyecto

Bienvenido/a. Esta guía te deja operativo/a con esta carpeta: qué es, cómo correrlo,
cómo conectar **tu** Cloudflare con **tu** GitHub para desplegar, y por dónde seguir.
Léela completa una vez; después usa los docs enlazados como referencia.

---

## 1. Qué es esto

**Leonfindel — Portfolio Buscable.** Sitio web cinematográfico + buscador del archivo
audiovisual (video/foto, +20 años) de una productora chilena. La fuente de verdad de la
metadata es un **Excel/Google Sheet** propio del cliente; Vimeo y Flickr son proveedores de media.

**Stack:** Astro 5 + islands Svelte 5 · Cloudflare Workers (static assets + workers de datos) ·
D1 (SQLite) + Vectorize + Workers AI · Google Sheets API.

### Documentos que tienes que leer (en este orden)
1. **`CLAUDE.md`** — reglas operativas del repo (secrets, datos del cliente, git, deploys). No negociables.
2. **`PROJECT.md`** — arquitectura completa y contexto del producto.
3. **`PLAN.md`** — plan maestro de ejecución por fases (FRAME + Cloudflare).
4. **`docs/DECISIONS.md`** — decisiones ya tomadas y **estado actual**. Empieza aquí para saber dónde quedó todo.
5. **`docs/frame/foundation-brief.md`** — IA, copy bilingüe, categorización, código-como-marca.
6. **`data/discovery.md`** — forma REAL del Sheet del cliente (§8 = lo más reciente).

---

## 2. Estado actual (resumen — detalle en `docs/DECISIONS.md`)

- ✅ **Diseño (FRAME):** brief + `render-prompts.md` + `montage-prompt.md`. Falta correr el Montage en Claude Design (paso manual, ver §7).
- ✅ **Enriquecimiento:** catálogo con `Cliente`/`Tipo`/tags derivados (1732 registros). El completo es **local**, no está en el repo (ver §5).
- ✅ **Sitio:** Astro bilingüe (EN default) funcionando — Home, `/work` (galería con filtros), `/work/[slug]` (detalle con embed Vimeo). Corre con un sample de 20 piezas.
- 🟡 **Deploy:** configurado como Cloudflare Worker con static assets. Falta que lo conectes a tu cuenta (§6).
- ⛔ **Backend (buscador + ingest):** NO empezado. Es el **Bloque B** del `PLAN.md` (tu próximo gran trabajo).

---

## 3. Requisitos

**Herramientas:** Node 22 (ver `apps/web/.node-version`), npm, git, y `wrangler` (viene como devDependency).

**Cuentas que vas a necesitar:**
- **GitHub** (tuya) — para alojar el repo y conectar el deploy.
- **Cloudflare** (tuya) — Workers/Pages, D1, Vectorize, Workers AI (todo entra en free tier).
- **Vimeo** — API token (lectura) del usuario `LEONFINDEL` (`user/9652190`). Para el ingest, más adelante.
- **Flickr** — API key. Fase B.
- **Google Cloud** — service account con acceso al Google Sheet del catálogo. Fase B.

---

## 4. Arranque local (5 min)

```bash
git clone <tu-repo> leonfindel-web && cd leonfindel-web
cd apps/web && npm install
npm run dev            # http://localhost:4321
```

Deberías ver la Home cinematográfica, `/work` con filtros y las páginas de detalle.
El sitio corre con el sample tracked (`apps/web/src/data/catalog-enriched.json`) — no necesita
backend ni secrets para verse.

Otros comandos útiles (desde la raíz): `npm run build:web`, `npm run typecheck`, `npm run lint`.

---

## 5. Datos del catálogo (importante)

- El sitio usa un **sample de 20 piezas** commiteado. Suficiente para desarrollar el frontend.
- El **catálogo completo (1732 registros)** vive en `data/enriched/catalog-enriched.full.json`,
  que está **gitignoreado** (regla dura: no subir datos del cliente al repo). **No está en GitHub.**
  - Para obtenerlo: pídeselo a quien te entrega el proyecto, **o regenéralo** desde el Google Sheet
    público con `npm run catalog:regen` (script `scripts/regenerate-catalog.mjs`). Va a D1 en el
    ingest (Fase B), no al repo.
  - Nota: el script deriva `cliente`/`tipo`/`tags` con heurística de keywords (aproximación de la
    versión canónica que se hizo con IA). Suficiente para desarrollar; el `normalize.ts` de Fase 3 lo refina.
- Nunca subas al repo el catálogo completo ni secrets. Ver `.gitignore` y `CLAUDE.md`.

---

## 6. Conectar TU Cloudflare con TU GitHub (deploy del sitio)

> Detalle completo en **`infra/SETUP.md §8`**. Resumen:

1. Sube el repo a **tu** GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → elige tu repo.
   (Cloudflare ya **no** ofrece crear "Pages" nuevos; se usa Workers con static assets — la config ya está lista en `apps/web/wrangler.toml`.)
3. En **Build configuration**:

   | Campo | Valor |
   |---|---|
   | Root directory | `apps/web` |
   | Build command | `npm run build` |
   | **Deploy command** | `npx wrangler deploy` |
   | Production branch | `main` |

4. **Save and Deploy.** Cada push a `main` redespliega. URL: `https://leonfindel.<tu-subdominio>.workers.dev`.

**Gotchas que ya resolvimos (no los repitas):**
- El Deploy command **debe** ser `npx wrangler deploy`. Con `wrangler pages deploy` da *auth error 10000* (el token del CI es de Workers).
- El Root directory **debe** ser `apps/web`, si no construye la raíz del monorepo y falla.

Deploy manual desde tu máquina: `cd apps/web && npm run build && npx wrangler deploy`.

---

## 7. Paso manual pendiente: Montage en Claude Design

El look cinematográfico final se genera en **Claude Design** (herramienta aparte, humana).
Abre `docs/frame/montage-prompt.md`, pega ese prompt en Claude Design, y con el resultado
reconcilia los tokens/estilos del sitio (`apps/web/src/styles/tokens.css`). Ningún asistente
puede operar Claude Design por ti.

---

## 8. Cómo seguir desarrollando — Bloque B (backend)

El frontend está encaminado; lo grande que falta es el **buscador y los datos**. Secuencia
en `PLAN.md` (Bloque B):

1. **Fase 0** — validar inputs reales (Vimeo token, Flickr key, Google service account). Ver `data/discovery.md`.
2. **Fase 2** — infra Cloudflare: `wrangler d1 create`, aplicar `data/schema.sql`, crear Vectorize, secrets. Ver `infra/SETUP.md`.
3. **Fase 3** — Worker `ingest` (`workers/ingest/`): leer Sheet + Vimeo + Flickr, normalizar, cargar el **catálogo completo** a D1, generar embeddings.
4. **Fase 4** — Worker `search` (`workers/search/`): `/api/search` con FTS5 + Vectorize (fusión RRF).
5. **Fase 5** — conectar la galería `/work` al `/api/search` real (hoy filtra client-side sobre el sample).

La idea de write-back (mejorar metadata en Vimeo/Flickr) queda para **después** del MVP — ver `docs/DECISIONS.md §1`.

---

## 9. Reglas del repo (de `CLAUDE.md` — respétalas)

- **Secrets:** nunca en el repo. Van por `wrangler secret put` o `.dev.vars` (gitignored).
- **Datos del cliente:** solo sample ≤20 filas en el repo. El catálogo completo es local.
- **Deploys / D1 producción:** confirmar antes; correr primero `--local`/`--dry-run`.
- **Git:** Conventional Commits (`feat:`/`fix:`/`docs:`/…). Un commit = un cambio coherente. Sin `--force`, sin mergear PRs a la ligera.
- **Migraciones D1:** archivos numerados en `data/migrations/`, nunca comandos ad-hoc.

---

## 10. Preguntas rápidas
- *¿Dónde está el estado más actual?* → `docs/DECISIONS.md`.
- *¿Cómo es el Sheet real?* → `data/discovery.md §8`.
- *¿Por qué no está el catálogo completo?* → §5 de este doc.
- *¿Cómo despliego?* → §6 + `infra/SETUP.md §8`.
- *¿Qué falta?* → §8 (Bloque B).
