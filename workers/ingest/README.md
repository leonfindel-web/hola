# `workers/ingest` — Cron + admin

Lee Excel (Google Sheets) + Vimeo + Flickr → normaliza → upsert a D1 + embeddings a Vectorize.

## Triggers

| Tipo | Cuándo | Dónde |
|---|---|---|
| `scheduled()` | Día 1 de cada mes, 03:00 UTC | `wrangler.toml [triggers]` |
| `POST /admin/reindex` | Manual, requiere `x-admin-secret` | Para forzar fuera del cron |
| `GET /admin/status` | Manual, requiere `x-admin-secret` | Últimos 10 runs |
| `GET /` | Health probe público | — |

## Local dev

```bash
npm install
# .dev.vars en este dir con los secrets:
#   VIMEO_TOKEN=...
#   FLICKR_API_KEY=...
#   GOOGLE_SHEETS_CREDS={"type":"service_account",...}
#   ADMIN_SECRET=...
npm run dev          # http://localhost:8787
npm test             # vitest con bindings mock
```

## Trigger manual del cron en local

```bash
curl "http://localhost:8787/__scheduled?cron=0+3+1+*+*"
```

## Deploy

```bash
npm run deploy       # wrangler deploy

# Setear secrets una sola vez por entorno:
wrangler secret put VIMEO_TOKEN
wrangler secret put FLICKR_API_KEY
wrangler secret put GOOGLE_SHEETS_CREDS
wrangler secret put ADMIN_SECRET
```

## Pendiente (Fase 0)

- [ ] Confirmar headers reales del Excel y actualizar `SHEET_COLUMNS` en `src/normalize.ts`.
- [ ] Confirmar regex de extracción de código en `src/sources/vimeo.ts` y `src/sources/flickr.ts` si difiere de `^[A-Z]\d{3,4}`.
- [ ] Reemplazar `SHEET_RANGE = 'A:Z'` con un rango más específico una vez que el Sheet tenga forma final.
