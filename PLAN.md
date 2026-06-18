# PLAN.md — Leonfindel · Sitio web cinematográfico con buscador de archivo

> **Para Claude Code.** Este documento es el plan maestro de ejecución. Combina dos metodologías:
> 1. **FRAME Framework** (Benjamín Cordero) — gobierna el **diseño** (look cinematográfico premium).
> 2. **Arquitectura Cloudflare** (decidida en chat previo) — gobierna el **buscador y los datos** (Vimeo 1500+, Flickr, Excel).
>
> **Orden de mando:** primero se diseña en Claude Design siguiendo FRAME; recién cuando el diseño está aprobado se reconcilia con el scaffold Astro y se construye el backend. Si hay conflicto entre "lo que se ve" y "lo que ya estaba scaffoldeado", **gana el diseño aprobado** — el scaffold se adapta.

---

## 0. Estado actual (punto de partida real)

- ✅ **Fase 1 (scaffold Astro) ya hecha** — repo con Astro + Svelte + adapter Cloudflare existe.
- ⚠️ **Decisión nueva:** el scaffold NO se sigue construyendo todavía. Primero FRAME. El scaffold se trata como "esqueleto técnico en espera", no como el diseño final.
- 📁 Documentos de contexto que deben existir / leerse en el repo: `PROJECT.md` (arquitectura completa), `CLAUDE.md` (reglas operativas), `REFERENCES.md` (frischloft + tokens), y este `PLAN.md`.

---

## 1. Qué es Leonfindel (contexto de producto)

Estudio audiovisual chileno (video + foto), +20 años de archivo. Contenido disperso en:
- **Vimeo** (1500+ videos, plan Plus) — títulos empiezan con código de catálogo: `B052 SCANIA Fabrica Brazil 2026 2_1`.
- **Flickr** — fotos, código en tag o título.
- **Excel** (fuente de verdad de la metadata: cliente, proyecto, ubicación, año, descripción, tags). Código formato `B052` como clave primaria.

**Join entre fuentes:** regex `^([A-Z]\d{3})\s` sobre el título de Vimeo → código → match con fila del Excel.
Vimeo/Flickr NO tienen descripciones; toda la narrativa vive en el Excel.

---

## 2. Stack confirmado (no re-litigar)

| Capa | Decisión |
|---|---|
| Frontend | Astro 5+ con islands Svelte 5 |
| Hosting | Cloudflare Pages |
| Buscador (HTTP) | Worker `/api/search` — D1 FTS5 + Vectorize, fusión RRF |
| Ingesta | Worker scheduled, cron mensual `0 3 1 * *` + endpoint manual `/admin/reindex` (protegido por secret) |
| DB estructurada | Cloudflare D1 (FTS5) |
| Semántica | Cloudflare Vectorize, embeddings `@cf/baai/bge-m3` (1024 dims, multilingüe) |
| Sync Excel | Google Sheets API (service account) |
| Diseño | **Claude Design** (NUEVO — capa FRAME) |
| Media animada | Kling / Luma / Runway (loops de fondo) |
| Costo objetivo | $0–5/mes (free tiers Cloudflare) |

**Anti-patrones (del CLAUDE.md):** cron → Cloudflare Cron Trigger (no node-cron); cache → Cache API (no Redis); IDs → `crypto.randomUUID()`. Dos Workers, no microservicios. REST simple, no GraphQL. Estado local Svelte, no Redux.

---

## 3. Las dos metodologías, entrelazadas

```
        FRAME (diseño)                    Cloudflare (datos/buscador)
        ──────────────                    ───────────────────────────
F  Foundation  → brief + copy + IA        ←  alimenta qué se busca/categoriza
R  Render      → assets cinematográficos
A  Animation   → loops de fondo (Kling)
M  Montage     → ensamble en Claude Design
E  Entrega     → export ZIP → Astro/Code  →  AQUÍ se enchufa el buscador real
                                              (Fases 2–8 del PROJECT.md original)
```

**Regla de oro FRAME:** todo se prepara en Claude Chat ANTES de tocar Claude Design. Nada de improvisar en Design quemando créditos. La fase Montage es un "one-shot" con el prompt y los assets ya listos.

---

# PLAN DE EJECUCIÓN

## ════════ BLOQUE A — DISEÑO (FRAME) ════════

### Fase F — Foundation (en Claude Chat, NO en Code)
> Esta fase es de estrategia humana + Chat. Code solo documenta el resultado.

- [x] Definir identidad: el archivo de Leonfindel ES el activo visual. La home no necesita stock — usa el propio material.
- [x] Arquitectura de información: Home cinematográfica → Work (galería buscable) → Detalle (`/work/[slug]`) → About/Contacto.
- [x] **Eje de categorización primario:** tipo de servicio (Industrial/Académico/Corporativo) primario + cliente secundario (+ Año, Lugar). ⚠️ Depende de enriquecimiento de metadata — ni `Tipo` ni `Cliente` existen en el Excel (ver brief §3, §7).
- [x] Idioma: bilingüe, **EN por defecto** + ES.
- [x] El **código de catálogo como elemento de marca** visible, con regla de degradación (real ≠ `B052`; ~30% vacíos — ver brief §5).
- [~] Copy de todas las secciones, sin "AI slop" — borrador en brief §8; **pendiente:** elegir Hero final + copy /about.
- [x] **Salida:** `docs/frame/foundation-brief.md` — brief estructural + copy + decisiones de IA.

### Fase R — Render (assets)
- [ ] Seleccionar 3–5 piezas estrella del archivo Leonfindel (las de clientes potentes tipo SCANIA) como material hero.
- [ ] Donde falte material: Claude genera prompts específicos (Flux/Midjourney) — texturas cinematográficas, no genéricas.
- [ ] **Salida:** `docs/frame/render-prompts.md` + carpeta `assets/hero/` con material crudo.

### Fase A — Animation (loops de fondo)
- [ ] Tomar los renders/clips hero y producir **loops perfectos** (frame inicial = frame final) en Kling/Luma/Runway.
- [ ] Para Leonfindel: idealmente recortar loops de su propio archivo en vez de generar — más auténtico y barato.
- [ ] Optimizar peso: loops cortos (4–8s), comprimidos para web (WebM/MP4 H.265), con poster image de fallback.
- [ ] **Salida:** `assets/loops/` (versionados ligeros) + nota de peso/performance budget.

### Fase M — Montage (ensamble en Claude Design)
> El "one-shot". Pegar el prompt preparado en F + subir assets de R/A.

- [ ] Generar el **one-shot prompt** para Claude Design (Claude Chat lo redacta a partir del foundation-brief).
- [ ] Incluir en el prompt: referencias de los video-assets, animaciones scroll-driven, tokens de `REFERENCES.md`.
- [ ] Ensamblar Home + plantilla de Work + plantilla de Detalle en Design.
- [ ] Refinar con herramientas "Draw" y "Comment" (ajustes quirúrgicos, NO regeneraciones completas).
- [ ] **Salida:** proyecto Claude Design aprobado + export ZIP.

### Fase E — Entrega (handoff a Code) ← AQUÍ ENTRA CLAUDE CODE EN SERIO
- [ ] Exportar ZIP desde Claude Design.
- [ ] **Reconciliar con el scaffold Astro existente:** trasladar el markup/estilos exportados a componentes Astro/Svelte. NO descartar el scaffold; fusionar.
- [ ] Extraer los tokens reales del diseño aprobado a `apps/web/src/styles/tokens.css` (reemplaza el plan previo de "replicar sitio actual" — ahora los tokens salen del diseño FRAME).
- [ ] Verificar performance budget: Lighthouse 95+ con los loops de fondo (este es el riesgo principal — medir).
- [ ] **Salida:** sitio estático navegable con datos mock, pendiente de enchufar buscador.

## ════════ BLOQUE B — DATOS Y BUSCADOR (Cloudflare) ════════
> Estas son las Fases 0 y 2–8 del PROJECT.md original. Antes estaban primero; ahora van DESPUÉS del diseño aprobado.

### Fase 0 — Validación de inputs (PRE-CÓDIGO de backend)
- [ ] Subir Excel a `data/sample-catalog.csv` (sample anonimizado, 20 filas).
- [ ] Confirmar columnas reales del Excel.
- [ ] Crear app en `developer.vimeo.com`, token, `curl` de prueba contra el user de Leonfindel.
- [ ] Crear API key de Flickr, listar 5 fotos.
- [ ] Confirmar user IDs (Vimeo y Flickr).
- [ ] Validar regex `^([A-Z]\d{3})\s` contra títulos reales.
- [ ] **Salida:** `data/discovery.md`.

### Fase 2 — Infra Cloudflare
- [ ] `wrangler login`.
- [ ] `wrangler d1 create leonfindel` → guardar `database_id`.
- [ ] Aplicar `data/schema.sql` (D1 + FTS5 triggers).
- [ ] `wrangler vectorize create leonfindel-media --dimensions=1024 --metric=cosine`.
- [ ] Bindings en `wrangler.toml` de ambos Workers.
- [ ] `wrangler secret put` × 4 secrets (`VIMEO_TOKEN`, `FLICKR_API_KEY`, `GOOGLE_SHEETS_CREDS`, `ADMIN_SECRET`).
- [ ] **Salida:** `infra/SETUP.md` idempotente.

### Fase 3 — Worker INGEST
- [ ] `sources/sheets.ts` — leer Sheet vía Google Sheets API + JWT service account.
- [ ] `sources/vimeo.ts` — paginar `/users/{id}/videos`, extraer código.
- [ ] `sources/flickr.ts` — paginar `getPublicPhotos`, extraer código.
- [ ] `normalize.ts` — merge por código, schema unificado.
- [ ] `db.ts` — upsert idempotente a D1 (prepared statements + batching).
- [ ] `embed.ts` — embedding Workers AI → upsert Vectorize → guardar `vector_id` en D1.

### Fase 4 — Worker SEARCH
- [ ] `/api/search` — query FTS5 + query Vectorize en paralelo, fusión RRF.
- [ ] Filtros estructurados (cliente, tipo, año).
- [ ] Paginación.

### Fase 5 — Frontend conectado (sobre el diseño FRAME ya montado)
- [ ] Conectar la galería `/work` al `/api/search` real (reemplaza mock).
- [ ] Página detalle `/work/[code]`: embed Vimeo o lightbox Flickr + metadata del Excel.
- [ ] Buscador en vivo (island Svelte) + estados: vacío, carga (skeleton), error.

### Fase 6 — Cron + reindex
- [ ] Cron Trigger mensual.
- [ ] `/admin/reindex` protegido por `ADMIN_SECRET`.

### Fase 7 — QA + performance
- [ ] Lighthouse 95+, search p95 < 200ms.
- [ ] Test del join código en datos reales (no solo sample).

### Fase 8 — Deploy
- [ ] `wrangler pages deploy` (web) + `wrangler deploy` (ambos Workers).
- [ ] Verificar dominio leonfindel.cl.

---

## 4. Reglas para Claude Code (resumen operativo)

- **PARAR y preguntar** antes de: cualquier `wrangler deploy`, cualquier SQL `--remote` contra D1 producción, instalar dependencia no justificada.
- **Commits lógicos** con prefijos `feat()/fix()/chore()`; mostrar diff y preguntar antes de seguir.
- **No tocar secrets** ni datos de cliente en commits (ver `.gitignore`).
- Al cerrar cada fase: marcar checkboxes aquí y en `PROJECT.md`.
- Si el diseño FRAME aprobado contradice algo del scaffold previo → gana el diseño, adaptar el scaffold.

## 5. Riesgo principal a vigilar

**Loops de video de fondo vs. Lighthouse 95+.** El look FRAME premium pelea contra el performance budget. Mitigación: loops ultra-comprimidos, lazy-load, poster images, `prefers-reduced-motion`, y servir loop solo en desktop. Medir antes de dar por buena la home.

---

## 6. Primer comando para arrancar en Code

```
Leé PLAN.md completo. Estamos en BLOQUE A, Fase F (Foundation).
El scaffold Astro de Fase 1 ya existe — NO lo amplíes todavía.
Tu primera tarea: ayudame a producir docs/frame/foundation-brief.md
(arquitectura de información + copy + decisión de eje de categorización).
No toques Claude Design ni el backend hasta que el brief esté aprobado.
```
