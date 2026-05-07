# Fase 0 — Hallazgos al inspeccionar inputs reales

> Llenar **antes de** modificar `workers/ingest/src/normalize.ts` o `data/schema.sql`.
> Si algo cambia el schema, agregar una migración nueva en `data/migrations/`.

---

## 1. Excel del cliente

### Headers reales
<!-- Pegar EXACTAMENTE como aparecen en el Sheet, en orden -->
- [ ] Columnas confirmadas: `___, ___, ___, ...`

### Mapping a `SHEET_COLUMNS`
Comparar contra `workers/ingest/src/normalize.ts`. Por cada columna del Excel:

| Header real | Campo interno | Comentario |
|---|---|---|
| `Codigo` | `code` | PK |
| `Tipo` | `type` | normalizar a `video|photo|document` |
| ... | ... | ... |

### Casos raros del Excel
- [ ] Hay filas sin código? Cuántas?
- [ ] Hay códigos duplicados? Si sí, cuál es la lógica para deduplicar?
- [ ] Tipos de código encontrados (`B###`, `F###`, otros)?
- [ ] Formato de año: número, string, rango (`2014-2016`)?
- [ ] Formato de tags: separador? Caso vacío?
- [ ] Hay columna explícita de URL de Vimeo / Flickr? (Si sí, no necesitamos
      parsear el código del título — más confiable.)

### Sample anonimizado
- [ ] Subido a `data/sample-catalog.csv` (≤ 20 filas, sin info sensible)

---

## 2. Vimeo API

### User
- [ ] `VIMEO_USER_ID` confirmado: `user/_______`
  ```bash
  curl -H "Authorization: bearer $TOKEN" https://api.vimeo.com/me | jq .uri
  ```
- [ ] Plan activo: `____` (Plus / Pro / Business)
- [ ] Total de videos: `____`

### Regex de código en título
- Default actual: `^([A-Z]\d{3,4})\b`
- [ ] Funciona contra los títulos reales? Sample de 5 títulos:
  - `____`
  - `____`
- [ ] Si NO: nuevo regex `_____`

### Limitaciones del plan
- [ ] El campo `player_embed_url` aparece? Si no → fallback a `oEmbed`.
- [ ] Hay videos privados / unlisted en el catálogo? Necesitan scope `private`.

---

## 3. Flickr API

### User
- [ ] `FLICKR_USER_ID` confirmado: `_______@N00`
  ```bash
  curl "https://api.flickr.com/services/rest/?method=flickr.urls.lookupUser&api_key=$KEY&url=https://www.flickr.com/photos/leonfindel/&format=json&nojsoncallback=1"
  ```
- [ ] Total de fotos públicas: `____`

### Regex de código
- Default actual: `\b([A-Z]\d{3,4})\b` en title o tags.
- [ ] Funciona? Si no, ¿dónde está el código?
  - [ ] En `tags`
  - [ ] En `description`
  - [ ] En ningún lado → **plan B**: agregar columna `flickr_url` al Excel y
        joinear por URL en `normalize.ts`.

---

## 4. Google Sheets

- [ ] Sheet ID: `_______`
- [ ] Service account email: `_______@*.iam.gserviceaccount.com`
- [ ] Sheet compartido con el SA (permiso Visualizador): sí / no
- [ ] Nombre de la hoja (tab) que tiene el catálogo: `_______`
  - Ajustar `SHEET_RANGE` en `workers/ingest/src/index.ts` a algo como
    `'Catalog!A:M'` en vez de `'A:Z'`.

---

## 5. Decisiones tomadas en Fase 0

<!-- Por cada cosa rara que apareció, registrar la decisión -->

- **Decisión X**: contexto, opciones, lo que elegimos, por qué.

---

## 6. Cambios al schema necesarios

<!-- Si el Excel real obliga a sumar columnas, listarlas acá y crear
     data/migrations/002_*.sql en vez de editar 001 -->

- [ ] Ninguno (schema actual sirve).
- [ ] Sumar columna `___` tipo `___`.
