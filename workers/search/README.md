# `workers/search` — HTTP API para el frontend

Búsqueda híbrida sobre D1 (FTS5) + Vectorize, fusión via Reciprocal Rank Fusion (k=60).

## Endpoints

| Método | Path | Qué |
|---|---|---|
| GET | `/` | Health probe |
| GET | `/api/search?q=&type=&client=&year_from=&...&page=&page_size=` | Búsqueda híbrida |
| GET | `/api/item/:code` | Item individual |
| GET | `/api/facets` | Counts por type/client/year/location |
| GET | `/api/items/codes` | Flat list de códigos (para SSG en build) |

## Cache

Cache API con TTL 1h por URL completa. Bypass con `cache-control: no-cache`.

## CORS

Configurado via `ALLOWED_ORIGINS` (CSV) en `wrangler.toml`. Server-to-server
no necesita CORS (los headers no se envían sin `origin`).

## Dev

```bash
npm install
npm run dev    # http://localhost:8788
npm test
```

## Deploy

```bash
npm run deploy
wrangler secret put ADMIN_SECRET   # mismo string que en ingest
```
