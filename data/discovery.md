# Fase 0 — Hallazgos al inspeccionar inputs reales

> Última actualización: 2026-06-23 (refresh — ver §8; el cliente editó el Sheet desde 2026-05-08).
> Fuente: lectura del Sheet via export CSV público (sin auth).

---

## 1. Excel del cliente

### Identificación
- **Sheet ID:** `1Ba3BOiPhdWnnV4gP8o5lXdxld7mLIIhQpRbtNNLYGPM`
- **Tab activo:** `Información` (`gid=1256451792`)
- **URL de edición:** `https://docs.google.com/spreadsheets/d/1Ba3BOiPhdWnnV4gP8o5lXdxld7mLIIhQpRbtNNLYGPM/edit?gid=1256451792`
- **Estado de compartido:** público, "anyone with link can view" (export CSV funciona sin auth — confirmado).

### Headers reales (fila 1, en orden de columna A a K)
| Col | Header | Estado | Comentario |
|---|---|---|---|
| A | `a` | ⚠️ raro | Contenido es fecha YYYYMMDD (e.g. `20150520`). Debería renombrarse a `Fecha` en el Sheet. |
| B | `Nª Proyecto` | ✅ | Código del proyecto. **NO es único.** Patrón mixto (ver §1.3). |
| C | `Proyecto` | ✅ | Título del proyecto. A veces tiene basura (coordenadas GPS reformateadas). |
| D | `FALSE` | ⚠️ raro | Header literal "FALSE" — probablemente checkbox sin nombre. **Aclarar con cliente.** |
| E | (vacía) | — | Columna sin header ni datos visibles. |
| F | `Código` | 🟡 | Vacía en muchas filas. ¿Código secundario? Repite a veces el nombre del proyecto. |
| G | `DATOS` | ✅ | Texto libre. **A veces contiene URL de Vimeo** (e.g. `https://vimeo.com/157706669`). Oro puro. |
| H | `DETALLE` | ✅ | Texto libre. Persona / nota / "MATERIAL PERDIDO o BORRADO". |
| I | `Detalle Proyecto` | ✅ | Descripción más larga del contenido específico de la fila. |
| J | `Lugar` | ✅ | Ciudad / locación (Santiago, Valparaíso, Talca, Casa Central Valparaíso). |
| K | `Clasificación` | ❌ | Vacía en todas las filas observadas. ¿Sin uso? |

### Patrón de códigos en `Nª Proyecto`
| Patrón | Ejemplo | Frecuencia (sample) |
|---|---|---|
| `[A-Z]+\d+V\d+` | `P93V1`, `AP49V1`, `AP89V2`, `AP22V1*` | Más común |
| `[A-Z]+\d+` | `AP0`, `AP01` | Algunos |
| Vacío | (sin código) | ~30% del sample |
| Literal `Revisar` | — | Algunas filas (placeholder humano) |
| Timestamp Excel | `2026-03-08 16:43:25` | Algunas (bug Excel) |
| Con sufijo `*` | `AP22V1*` | Algunos |
| Con espacio | `AP2 ` | Algunos |

> Regex propuesto: `^([A-Z]{1,3}\d+(?:V\d+)?)\*?\s*$`
> — pero **incluso con buen regex, el código no sirve como PK** porque hay filas duplicadas y vacías.

### El código NO es único
- `AP43V1` aparece en 2 filas (descripciones distintas).
- `AP69V1` aparece en 2 filas.
- `AP89V1`, `V2`, `V3`, `V*Cena 1`, `Cena 2`, `Final Version Corta` — versiones del mismo proyecto.
- Filas con `Lugar="Día 1"`, `Día 2`, etc. — sesiones de filmación multi-día agrupadas bajo un proyecto.

**Implicación arquitectónica:** la PK de `media` no puede ser el código solo. Opciones:

| Opción | Pros | Contras |
|---|---|---|
| A. PK sintética (autoincrement / UUID) + `code` no único | Refleja el modelo real | Frontend necesita una URL distinta a `/work/{code}` |
| B. PK = `code + sufijo` (ej. `AP43V1#1`, `AP43V1#2`) | URL legible | Frágil al reordenar filas |
| C. PK = `(code, fecha)` compuesta | Determinística | Más complejo; falla cuando ambos faltan |
| D. Agrupar filas por código → 1 `media` con N "tomas" | Más correcto semánticamente | Cambia mucho el modelo de datos |

> **Recomendación:** opción A para velocidad. URL = `/work/{slug}` donde slug = `code`+`-N` solo cuando hay duplicados. Discutir con cliente.

### Cosas que NO están en el Sheet
- ❌ Cliente (implícito en el nombre del proyecto: USM, Banco Santander, Berthelon, INACAP, etc.)
- ❌ Tipo (video / foto). El tab `Información` parece 100% video.
- ❌ Tags. Hay que derivarlos del título + lugar + descripción, o pedir al cliente que agregue una columna.
- ❌ Año aislado (se infiere de `Fecha`).
- ❌ Duración.
- ❌ Estado (publicable / privado / archivado).

### Cosas raras encontradas
- Filas con `Nª Proyecto = 2026-03-08 16:43:25` (timestamp Excel) y `Proyecto = -20105127,3` (parece coordenada GPS lat/long con coma decimal). Bug de Excel donde lat/long se reformateó.
- Filas con `Proyecto = -20105136,3`, `-20114033,49`. Ignorar o limpiar.
- Códigos con asterisco final (`AP22V1*`). ¿Variante? ¿Marca de revisión?
- Texto "MATERIAL PERDIDO o BORRADO" en `DETALLE` — flag de exclusión del portfolio público.

---

## 2. Vimeo API

### User
- [ ] `VIMEO_USER_ID` confirmado: `user/_______`
  ```bash
  curl -H "Authorization: bearer $TOKEN" https://api.vimeo.com/me | jq .uri
  ```
- [ ] Plan activo: `____`
- [ ] Total de videos: `____`

### Estrategia de matching
- **Plan A (preferido):** usar la URL en columna `DATOS` cuando exista. Match directo, sin regex.
- **Plan B (fallback):** extraer `vimeo.com/(\d+)` de cualquier columna de texto.
- **Plan C (último recurso):** regex sobre el título del video en Vimeo. Pero con códigos no únicos, el regex va a producir colisiones.

> Conclusión: **descartar el plan original de regex sobre título de Vimeo**. La columna `DATOS` con URL explícita es el canal confiable.

---

## 3. Flickr API

- [ ] **¿Hay un tab en el Sheet para fotos?** El tab `Información` parece todo video.
  - Si NO: necesitamos confirmar dónde vive el catálogo de fotos.
  - Si SÍ: pedir gid del tab.
- [ ] User ID: `_______@N00`

---

## 4. Google Sheets — config para el Worker INGEST

- ✅ `GOOGLE_SHEET_ID = "1Ba3BOiPhdWnnV4gP8o5lXdxld7mLIIhQpRbtNNLYGPM"`
- ✅ `GOOGLE_SHEET_TAB = "Información"` (con tilde)
- [ ] Service account email: `_______@*.iam.gserviceaccount.com`
- [ ] Sheet compartido con SA: por ahora público, pero **mejor compartir con SA** y volver el sheet privado por defecto.

---

## 5. Decisiones pendientes (para conversar con el cliente)

1. **¿Renombrar headers del Sheet?**
   - Col A `a` → `Fecha`
   - Col D `FALSE` → `Publicado` (o lo que represente)
   - Col F `Código` → ¿es necesaria? ¿qué representa exactamente?
   - Col K `Clasificación` → ¿qué iría acá?
2. **¿Sumar columnas que faltan?**
   - `Cliente` (texto libre, normalizado)
   - `Tipo` (video / foto / documento)
   - `Tags` (separadas por coma)
   - `Excluir` (boolean — para "MATERIAL PERDIDO o BORRADO" y similares)
3. **¿Cómo manejamos códigos duplicados?** Ver §1.4 opciones A-D.
4. **¿Hay otro tab para Flickr/foto?**
5. **Las filas con coordenadas GPS / timestamps en columnas equivocadas — limpiar en origen o filtrar en INGEST?**

---

## 6. Cambios necesarios al schema D1

> **No tocar `001_init.sql` — ya commiteado. Crear `002_*.sql` cuando definamos el modelo final.**

Probable cambio: PK = `id INTEGER PRIMARY KEY AUTOINCREMENT`, agregar `code TEXT NOT NULL` con `INDEX` (no UNIQUE). El frontend usa un `slug` derivado de code+fecha.

---

## 7. Cambios al `normalize.ts`

Bloqueado hasta resolver §5. Mientras tanto, `SHEET_COLUMNS` queda en placeholder.

---

## 8. Refresh 2026-06-23 (el cliente editó el Sheet + enrichment hecho)

Al releer el Sheet real, la forma cambió respecto a §1 y se corrió el enriquecimiento.

### Headers actuales (fila 1, A→M)
`FECHA`, `Nª Proyecto`, `Proyecto`, `FALSE`, (vacía), `Código`, `TIME`, `VH`, `DATOS`,
`DETALLE`, `Detalle Proyecto`, `Lugar`, `Clasificación`.
- Col A ya se renombró `a` → **`FECHA`**. Nuevas columnas **`TIME`** y **`VH`** (peso/duración?).
- Siguen faltando `Cliente`, `Tipo`, `Tags`, `Excluir` → se derivan (ver abajo).

### Auditoría (2768 filas totales)
- **~1747 filas con proyecto real** · **~1014 basura** (coords GPS, timestamps Excel, vacías) · **~352 con `★`** (favorito del cliente).
- **Solo 47 filas con URL de Vimeo** → confirma: join por URL en `DATOS`, NO regex sobre título.
- Códigos en `Nª Proyecto`: patrón `[A-Z]+\d+(V\d+)?\*?` (`P485`, `AP85V1`, `AP22V1*`), no únicos, ~30% vacíos → **PK sintética + slug**, no el código.

### Enriquecimiento (derivación AI, workflow multi-agente)
- **1732 registros:** 898 Corporativo / 481 Académico / 353 Industrial; 28 excluidos; 47 con Vimeo.
- Clientes detectados: SCANIA, SACYR, USM, Masisa, Metro, Tesla, Codelco, Santander, INACAP, CCTVal, Berthelon, ESVAL, UAI, KOMATSU, BHP, etc.
- Salidas: `data/enriched/catalog-enriched.full.json` (**local/gitignored** — va a D1), sample de 20 en `apps/web/src/data/catalog-enriched.json` (tracked), agregados en `data/enriched/SUMMARY.md` y `catalog-audit.md`.

### Vimeo (confirmado vía API)
- Cuenta **LEONFINDEL** (`user/9652190`), plan **Plus**, **2343 videos**.
- Piezas hero validadas → serie **SACYR Ruta 78** (4K ProRes, dron) como material principal.

> Decisión pendiente con el cliente (sigue vigente §5): poblar Tipo/Cliente de forma persistente
> (columnas nuevas en el Sheet vs. mantener la derivación AI en el ingest).
