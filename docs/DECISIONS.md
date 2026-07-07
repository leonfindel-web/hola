# DECISIONS.md — Registro de decisiones y estado

> Fuente única de verdad de las decisiones tomadas y el estado del proyecto, para que
> el contexto no viva solo en el chat, en mensajes de commit ni en memoria del asistente.
> Complementa `PLAN.md` (plan maestro) y `docs/frame/foundation-brief.md` (Fase F).
>
> Última actualización: 2026-06-23.

---

## 1. Decisiones de producto / diseño (Fase F — cerradas)

| Tema | Decisión | Detalle |
|---|---|---|
| Eje de categorización | **Tipo de servicio primario** (Industrial / Académico / Corporativo) + **cliente secundario** (+ año, lugar) | El Excel NO tiene estas columnas → se derivan (ver §2). Brief §3. |
| Idioma | **Bilingüe, EN por defecto** + ES | Se traduce el chrome, no los datos del catálogo (vienen del Excel en español). Brief §4. |
| Código de catálogo como marca | **Sí, visible, con degradación elegante** | Monospace tipo ficha; grande en detalle, pequeño en galería. Si falta/es inválido (~30% de las filas), NO se muestra el slot; se identifica por proyecto. Brief §5. |
| Write-back de metadata a Vimeo/Flickr | **Objetivo de producto, ejecución POST-MVP** | Riesgo casi-destructivo sobre 1500+ piezas → dry-run + backup + confirmación. Scopes de escritura se piden desde Fase 0. Brief §7-B. |

## 2. Enriquecimiento de metadata (hecho — 2026-06-23)

El Excel no tiene `Cliente` ni `Tipo`; se **derivaron** desde nombre de proyecto + detalle + lugar
(workflow multi-agente sobre las 2768 filas del Sheet).

- **1732 registros** válidos: **898 Corporativo / 481 Académico / 353 Industrial**.
- 353 destacados (`★` = favorito marcado por el cliente), 28 excluidos, 47 con Vimeo.
- **Dataset completo:** `data/enriched/catalog-enriched.full.json` — **LOCAL + gitignoreado**
  (dato real del cliente; regla dura `CLAUDE.md`). Va a D1 en el ingest (Fase B), no al repo.
- **Sample (20 filas, piezas hero reales):** `apps/web/src/data/catalog-enriched.json` — tracked,
  es lo que consume el sitio hasta que exista el search worker.
- Agregados versionados: `data/enriched/SUMMARY.md`, `data/enriched/catalog-audit.md`.

> **Pendiente con el cliente:** cómo poblar Tipo/Cliente de forma persistente — ¿columnas nuevas
> en el Sheet, o mantener la derivación AI en el ingest? Ver `data/discovery.md §5`.

## 3. Manejo de datos del cliente (regla dura)

- El catálogo completo **no se commitea** (`CLAUDE.md`: solo sample ≤20 filas). El sitio buildea
  con el sample; el full vive local para el backend. Reforzado por el clasificador de permisos.
- Secrets solo en `.dev.vars` (gitignored) o `wrangler secret put`. Nunca en el repo.

## 4. Deploy del frontend (2026-06-23)

**Decisión forzada por Cloudflare:** ya **no se pueden crear proyectos Pages nuevos** (Pages se
fusionó en Workers). El frontend estático se despliega como **Worker con static assets**.

- `apps/web/wrangler.toml` usa el modelo Workers: `main = ./dist/_worker.js/index.js` +
  `[assets] directory = ./dist, binding = ASSETS` + `nodejs_compat`. Validado con
  `wrangler deploy --dry-run` (empaqueta sin errores).
- **Deploy command del proyecto CF:** `npx wrangler deploy` (NO `wrangler pages deploy` — ese daba
  auth error 10000 porque el token del CI es de Workers, no de Pages).
- Build config CF: Root `apps/web`, Build `npm run build`, Node fijado por `apps/web/.node-version` (22).
- Deploy a producción y a Cloudflare = **requieren OK explícito** (regla dura). No se hace autónomo.

## 5. Estado actual (2026-06-23)

- ✅ **Fase F (Foundation)** cerrada — brief + decisiones.
- ✅ **Fase R/M/E (primera pasada)** — `render-prompts.md`, `montage-prompt.md` (listo para Claude
  Design), sitio Astro bilingüe funcional (Home cinematográfica, `/work` con filtros, `/work/[slug]`).
- ✅ **PR #1** (sitio + FRAME + enrichment) **mergeado** a `main`.
- 🟡 **PR #2** (config Workers para el deploy) **abierto** — falta: mergear + poner Deploy command
  = `npx wrangler deploy` en el dashboard. El build en CF ya queda **verde**; solo faltaba el
  modelo de deploy correcto.
- ⛔ **Bloque B (datos + buscador)** — no iniciado. Worker de búsqueda, ingest a D1, cron, deploy CF.

## 6. Lo único que sigue siendo 100% manual del usuario

- **Claude Design / Montage:** pegar `docs/frame/montage-prompt.md` para generar el look final.
  El asistente no puede operar Claude Design.
- Autorizar deploys a Cloudflare y merges a `main` (reglas duras).

## 7. Próximos pasos sugeridos

1. Cerrar el deploy (mergear PR #2 + ajustar deploy command) → URL online.
2. Correr el Montage en Claude Design → reconciliar tokens/estilos con el sitio.
3. Resolver con el cliente las columnas del Sheet (`discovery.md §5`).
4. Arrancar **Bloque B**: Fase 0 (validar inputs), Fase 2 (infra CF), Fase 3 (ingest), Fase 4 (search).
