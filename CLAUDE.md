# CLAUDE.md

Instrucciones operativas para Claude Code en este repo. **Léelo antes de actuar.**

Documento de contexto completo: `PROJECT.md`. Si hay conflicto, manda `PROJECT.md`.

---

## Identidad del proyecto

- **Nombre:** Leonfindel — Portfolio Buscable
- **Cliente:** Productora audiovisual chilena (video + foto)
- **Source of truth:** Excel propio del cliente (códigos `B052`, `B053`...). Vimeo y Flickr son media providers, no fuentes de verdad.
- **Stack:** Astro + Svelte + Cloudflare Pages + Workers + D1 + Vectorize + Workers AI

---

## Cómo trabajar este repo

1. **Siempre arrancá leyendo `PROJECT.md`** y mirando qué fase está en curso (sección 6, checkboxes).
2. **Una sesión = una fase**, salvo que sea trivial. No saltar de Fase 2 a Fase 5 sin completar las intermedias.
3. **Antes de generar código nuevo:** confirmá con el usuario *qué fase* y *qué archivos* vas a tocar. No empezar a tipear sin acuerdo.
4. **Después de generar código:** mostrá diff resumido, no pegues archivos completos en chat si son largos.
5. **Al cerrar una fase:** marcá los checkboxes en `PROJECT.md` y proponé el commit message.

---

## Reglas duras (no negociables)

### Secrets y credenciales
- **NUNCA** commitear `VIMEO_TOKEN`, `FLICKR_API_KEY`, `GOOGLE_SHEETS_CREDS`, `ADMIN_SECRET`, ni ningún token en archivos del repo.
- Todo secret va por `wrangler secret put <NAME>` o GitHub Actions Secrets.
- Si encontrás un secret hardcodeado en el código existente: detenete, avisá, no commitees.
- `.dev.vars` está en `.gitignore` — usalo para secrets locales en dev, nunca lo commitees.

### Datos del cliente
- `data/sample-catalog.csv` y cualquier archivo en `data/` con info real del cliente: **no modificar sin permiso explícito**.
- Si necesitás un sample para tests, generá uno sintético en `tests/fixtures/`.
- No subir el Excel completo del cliente al repo — solo sample anonimizado de ≤ 20 filas.

### Despliegues
- **Antes de `wrangler deploy`:** mostrar `wrangler whoami` + el `wrangler.toml` relevante + diff de bindings. Pedir confirmación.
- **Antes de tocar D1 producción:** correr primero contra `--local` o `--preview`. Mostrar el SQL exacto que se va a ejecutar.
- **Migraciones de schema:** siempre via archivos `data/migrations/NNN_*.sql` numerados, nunca via comando ad-hoc.
- **Vectorize:** recrear un índice borra todos los embeddings. Avisar siempre antes.

### Git
- No hacer `git push --force` salvo que el usuario lo pida explícitamente.
- No mergear PRs por tu cuenta.
- Commits siguen Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Un commit = un cambio coherente. No mezclar refactors con features.

---

## Reglas blandas (preferencias del usuario)

### Comunicación
- El usuario habla español + inglés mezclados. Respondé en el idioma en que te hable.
- Es **consultor senior** — no expliques lo básico salvo que pregunte. Asumí conocimiento de Cloudflare, Astro, TypeScript, Git.
- Directo y conciso. Sin disclaimers innecesarios. Sin "claro, con gusto te ayudo".
- Cuando hay decisión técnica con tradeoff: **dale tu recomendación primero**, después el razonamiento. No lavarte las manos con "depende".

### Estilo de código
- TypeScript estricto (`"strict": true`). Sin `any`. Sin `@ts-ignore` salvo justificado.
- Funciones puras donde se pueda. Side effects aislados en handlers y `db.ts`.
- Errores explícitos: `Result<T, E>` o lanzar errores tipados, nunca silencioso.
- Logs con `console.log` para Workers (Wrangler los captura). Estructurados como JSON para logs importantes.
- Nombres de variables en inglés. Comentarios en inglés. UI en español.

### Testing
- Tests para lógica de negocio (parsers, normalizers, hybrid search), no para handlers triviales.
- `vitest` con `@cloudflare/vitest-pool-workers` para Workers.
- Mocks de APIs externas siempre. Nunca tocar Vimeo/Flickr reales en tests.

---

## Decisiones ya tomadas (no re-litigar)

Si te tienta proponer alternativas a estas, **no lo hagas** — ya se discutieron:

- **Astro, no Next.js.** Por SSG puro y peso del bundle.
- **Svelte, no React.** Para islands más livianas.
- **Cloudflare Pages, no Vercel.** Por integración con Workers + D1 + Vectorize en una sola plataforma.
- **D1 + Vectorize híbrido, no Algolia/Meilisearch externos.** Por costo y por mantener todo en Cloudflare.
- **Cron mensual, no más frecuente.** El catálogo cambia despacio.
- **Excel via Google Sheets API, no commiteado al repo.** Para que el cliente edite sin tocar Git.
- **Worker 3 (proxy thumbnails) descartado en MVP.** Solo si hay problemas reales.
- **Sin CMS adicional (Sanity, Contentful, etc).** El Excel es el CMS.

---

## Cosas que SÍ podés proponer libremente

- Mejoras de DX (scripts, herramientas locales, Makefile).
- Refactors si ves duplicación o código frágil.
- Cambios de schema D1 si el Excel real lo amerita.
- Tests adicionales.
- Docs adicionales (`infra/SETUP.md`, `data/discovery.md`, etc).
- Nombres y rutas — el árbol en `PROJECT.md` es preliminar, ajustalo si encontrás algo mejor.

---

## Anti-patrones detectados (evitarlos)

### No reinventar lo que ya hay en el stack
- ¿Necesitás un cron? → Cloudflare Cron Trigger. NO npm install `node-cron`.
- ¿Necesitás cache? → Cloudflare Cache API. NO Redis, NO memoria local del Worker.
- ¿Necesitás KV simple? → Cloudflare KV. NO archivo JSON.
- ¿Necesitás ID único? → `crypto.randomUUID()`. NO librerías.

### No sobre-ingenierar el MVP
- No microservicios. Dos Workers (ingest + search) es suficiente.
- No event sourcing, no CQRS. CRUD sobre D1.
- No GraphQL. REST simple sobre `/api/*`.
- No Redux/Zustand/etc en el frontend. Estado local de Svelte.

### No agregar dependencias sin justificar
- Antes de `npm install X`: ¿qué hace X que no podemos hacer en 30 líneas? Si la respuesta es "ahorrar 30 líneas", probablemente no vale la pena.
- Excepciones aceptables: clientes oficiales (Google APIs, Vimeo SDK si existe), libs de testing, frameworks core ya elegidos.

### No optimizar antes de medir
- "Esto podría ser lento" no es razón. "Esto es lento, lo medí" sí.
- Performance budget: Lighthouse 95+, search p95 < 200ms. Si estamos bajo eso, no toques nada.

---

## Comandos frecuentes (cheat sheet)

```bash
# Local dev
npm run dev                          # Astro en :4321
cd workers/ingest && npm run dev     # Worker ingest local
cd workers/search && npm run dev     # Worker search local

# D1 local
wrangler d1 execute leonfindel --local --file=data/schema.sql
wrangler d1 execute leonfindel --local --command="SELECT COUNT(*) FROM media;"

# D1 producción (CUIDADO)
wrangler d1 execute leonfindel --remote --file=data/migrations/001_init.sql

# Cron manual (testing)
curl "http://localhost:8787/__scheduled?cron=0+3+1+*+*"

# Logs en producción
wrangler tail leonfindel-ingest
wrangler tail leonfindel-search

# Deploys
cd workers/ingest && wrangler deploy
cd workers/search && wrangler deploy
cd apps/web && npm run build && wrangler pages deploy dist
```

---

## Flujo típico de una sesión con Claude Code

```
Usuario: "Vamos por la Fase 3, Worker INGEST."

Claude Code:
1. Lee PROJECT.md sección 6, Fase 3.
2. Lee CLAUDE.md (este archivo).
3. Verifica que Fase 2 esté completa (D1 + Vectorize creados, secrets puestos).
4. Propone plan de archivos a crear:
   - workers/ingest/src/sources/sheets.ts
   - workers/ingest/src/sources/vimeo.ts
   - ...
5. Espera OK del usuario.
6. Genera código en commits lógicos:
   - feat(ingest): add Google Sheets reader
   - feat(ingest): add Vimeo client with pagination
   - ...
7. Después de cada commit, muestra diff y pregunta si seguir.
8. Al cerrar fase: actualiza checkboxes en PROJECT.md, propone PR description.
```

---

## Cuándo PARAR y preguntar

- Antes de cualquier `wrangler deploy`.
- Antes de aplicar cualquier SQL contra D1 producción (`--remote`).
- Antes de tocar archivos en `data/` con datos reales del cliente.
- Antes de instalar dependencias nuevas que no estén en `PROJECT.md`.
- Si encontrás ambigüedad en `PROJECT.md` que afecta arquitectura.
- Si el Excel real difiere significativamente del schema preliminar.

---

## Cuándo NO preguntar (avanzar)

- Crear archivos nuevos dentro de la fase actual según estructura de `PROJECT.md`.
- Refactors menores que no cambian comportamiento.
- Agregar tests.
- Mejorar mensajes de error o logs.
- Formateo, linting, fix de tipos.
- Actualizar docs del propio repo.

---

*Si algo en este archivo se contradice con la realidad observada del repo, avisá al usuario antes de actuar — no asumas.*
