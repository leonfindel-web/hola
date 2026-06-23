# Infra setup — Leonfindel

Comandos en orden, idempotentes. Pegar y correr una vez por entorno (production por default).
**Antes de ejecutar nada con `--remote` o `wrangler deploy` revisar `wrangler whoami`.**

---

## 0. Preparación local

```bash
npm --prefix workers/ingest install
npm --prefix workers/search install
npm --prefix apps/web install
wrangler login
wrangler whoami    # verificar que apunta a la cuenta correcta
```

---

## 1. Crear D1

```bash
wrangler d1 create leonfindel
```

> Copiar `database_id` que devuelve y pegarlo en:
> - `workers/ingest/wrangler.toml` (`[[d1_databases]] database_id`)
> - `workers/search/wrangler.toml` (`[[d1_databases]] database_id`)

Aplicar schema:

```bash
# Local (para dev)
wrangler d1 execute leonfindel --local  --file=data/schema.sql --config workers/ingest/wrangler.toml

# Production
wrangler d1 execute leonfindel --remote --file=data/migrations/001_init.sql --config workers/ingest/wrangler.toml
```

Verificar:

```bash
wrangler d1 execute leonfindel --remote --command="SELECT name FROM sqlite_master WHERE type='table';" --config workers/ingest/wrangler.toml
```

---

## 2. Crear Vectorize

```bash
wrangler vectorize create leonfindel-media \
  --dimensions=1024 \
  --metric=cosine
```

> Si ya existe y necesitás recrearlo: **borra todos los embeddings**. Confirmar antes:
> `wrangler vectorize delete leonfindel-media` y luego volver a crear.

(Opcional, recomendado) índices de metadata para filtros vectoriales:

```bash
wrangler vectorize create-metadata-index leonfindel-media --property-name=type   --type=string
wrangler vectorize create-metadata-index leonfindel-media --property-name=client --type=string
wrangler vectorize create-metadata-index leonfindel-media --property-name=year   --type=number
```

---

## 3. Setear secrets

Por cada Worker:

```bash
# INGEST
cd workers/ingest
wrangler secret put VIMEO_TOKEN          # personal access token de Vimeo
wrangler secret put FLICKR_API_KEY       # api key de Flickr
wrangler secret put GOOGLE_SHEETS_CREDS  # JSON del service account, single-line
wrangler secret put ADMIN_SECRET         # `openssl rand -hex 32`

# SEARCH
cd ../search
wrangler secret put ADMIN_SECRET         # mismo string que en INGEST
```

> El JSON del service account de Google viene multi-línea. Para pegarlo en
> `wrangler secret put`, primero pasalo a single-line:
> ```bash
> jq -c . < service-account.json | pbcopy
> ```

---

## 4. Setear vars públicas en `wrangler.toml`

Editar **manualmente** los `[vars]` de ambos `wrangler.toml`:

| Var | Worker | Valor |
|---|---|---|
| `VIMEO_USER_ID` | ingest | `user/12345678` (verificable con `curl https://api.vimeo.com/me -H "Authorization: bearer $TOKEN"`) |
| `FLICKR_USER_ID` | ingest | `12345678@N00` |
| `GOOGLE_SHEET_ID` | ingest | ID del Sheet (la parte entre `/d/` y `/edit`) |
| `ALLOWED_ORIGINS` | search | `https://leonfindel.cl,https://www.leonfindel.cl` (sumar `http://localhost:4321` solo en dev) |

---

## 5. Compartir el Sheet con el service account

Abrir el Sheet en Google Drive → "Compartir" → pegar el `client_email` del
service account → permiso "Visualizador".

---

## 6. Deploy de Workers

```bash
cd workers/ingest && npm run deploy
cd ../search       && npm run deploy
```

Verificar:

```bash
curl https://leonfindel-ingest.<subdomain>.workers.dev/
curl https://leonfindel-search.<subdomain>.workers.dev/
```

---

## 7. Trigger manual del primer reindex

```bash
curl -X POST \
  -H "x-admin-secret: $ADMIN_SECRET" \
  https://leonfindel-ingest.<subdomain>.workers.dev/admin/reindex
```

Esto va a tomar varios minutos según el tamaño del catálogo. Status:

```bash
curl -H "x-admin-secret: $ADMIN_SECRET" \
  https://leonfindel-ingest.<subdomain>.workers.dev/admin/status
```

---

## 8. Pages (frontend)

El sitio es **estático** (`output: 'static'`) → Pages sirve `apps/web/dist/` sin
bindings ni KV. Config en `apps/web/wrangler.toml` + `apps/web/.node-version`.

### 8.1 Git integration (RECOMENDADO — preview automático por PR)

Una sola vez, en el dashboard de Cloudflare → **Workers & Pages → Create → Pages →
Connect to Git** → repo `jorgecub/leonfindel-web`. Valores exactos:

| Campo | Valor |
|---|---|
| Project name | `leonfindel` |
| Production branch | `main` |
| Framework preset | `Astro` |
| **Root directory** (Build settings → Advanced) | `apps/web` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variables | *(ninguna por ahora — el sitio es estático)* |

- Node lo fija `apps/web/.node-version` (`22`), no hace falta `NODE_VERSION`.
- Funciona con root `apps/web` porque ese paquete instala standalone (tiene su propio
  `package-lock.json`) y CF clona el repo completo (el alias `@shared → ../../shared`
  resuelve en el clone).
- **Resultado:** cada push a una rama / PR genera una preview compartible
  `https://<rama>.leonfindel.pages.dev`; `main` publica producción.
- Cuando exista el search worker (Fase B), agregar la build env var
  `PUBLIC_SEARCH_API=https://leonfindel-search.<subdomain>.workers.dev`.

### 8.2 CLI (deploy puntual / sin Git integration)

```bash
wrangler login && wrangler whoami   # verificar cuenta
npm --prefix apps/web run deploy     # astro build && wrangler pages deploy
```

> La primera vez `wrangler pages deploy` crea el proyecto `leonfindel` si no existe.

---

## 9. Secrets de GitHub Actions

En `Settings → Secrets and variables → Actions`:

| Secret | Valor |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Token con scopes Workers + Pages + D1 + Vectorize Edit |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID (visible en dashboard) |
| `CLOUDFLARE_WORKERS_SUBDOMAIN` | `<subdomain>` (sin `.workers.dev`) |

---

## 10. DNS y go-live (Fase 7)

> **No ejecutar hasta validar `nuevo.leonfindel.cl` por una semana.**

1. En Pages → Custom domains → agregar `leonfindel.cl` y `www.leonfindel.cl`.
2. En DNS de Cloudflare: CNAME `www` → `leonfindel.pages.dev`. Apex via flattening.
3. Confirmar SSL "Full (Strict)".

Antes de switchear: backup completo del WordPress actual.

---

## Anexo — Comandos útiles

```bash
# Ver tablas en D1
wrangler d1 execute leonfindel --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table';"

# Stats de Vectorize
wrangler vectorize info leonfindel-media

# Logs en vivo
wrangler tail leonfindel-ingest
wrangler tail leonfindel-search

# Borrar cache de Cloudflare (cuando cambia el schema de search)
# Pages purges itself on deploy. Para Workers Cache API es necesario cambiar la URL
# o esperar TTL (1h por default).
```
