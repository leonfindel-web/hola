# Leonfindel — Auditoría del Catálogo

Fuente: Google Sheet `1Ba3BOiPhdWnnV4gP8o5lXdxld7mLIIhQpRbtNNLYGPM`, tab gid `1256451792`.
Fecha auditoría: 2026-06-22. Export CSV → `/tmp/lf_catalog.csv`.

## Resumen

| Métrica | Valor |
|---|---|
| Filas de datos (sin header) | 2761 |
| Filas con proyecto real (meaningful) | 1747 |
| Filas basura (garbage) | 1014 |
| Filas con estrella (favorito del cliente) | 352 |
| Filas con `vimeo.com` | 48 |
| Filas con `flic.kr`/`flickr` | 7 |

## Mapeo de columnas (13 columnas)

> ⚠️ Las columnas reales **NO** corresponden 1:1 con la descripción del brief. Hay shift/ruido a partir de la columna 6. El header literal es el de abajo; el significado útil está anotado.

| # | Header literal | Significado real / observación | Fill |
|---|---|---|---|
| 0 | `FECHA` | Casi siempre `0`; no es fecha utilizable | 1762 |
| 1 | ` Nª Proyecto` | **Código de proyecto** (`B052`, `A077`, `PP147`…). Algunas filas traen un timestamp Excel aquí = basura | 1314 |
| 2 | `Proyecto` | **Nombre del proyecto** (source of truth del título). Estrella final = favorito | 1750 |
| 3 | `FALSE` | Flag booleano `TRUE`/`FALSE`, siempre presente | 2761 |
| 4 | `` (blank) | Concatenado `código - nombre`, solo 19 filas | 19 |
| 5 | `Código` | Código secundario, casi vacío | 68 |
| 6 | `TIME` | Duración/tiempo | 1255 |
| 7 | `VH` | Valor (`$0`…) | 1752 |
| 8 | `DATOS` | Datos libres; 1 fila con vimeo | 523 |
| 9 | `DETALLE` | Detalle; **40 enlaces vimeo aquí** | 285 |
| 10 | `Detalle Proyecto` | Detalle largo; **7 enlaces flickr aquí** | 676 |
| 11 | `Lugar` | Ubicación; 7 vimeo sueltos | 371 |
| 12 | `Clasificación` | **Inservible**: solo 13 filas y con contenido aleatorio (contactos, lugares, `*`, `⭐⭐⭐⭐⭐`). NO sirve como serviceType | 13 |

**Dónde viven los media providers:**
- Vimeo: 40 en `DETALLE`, 7 en `Lugar`, 1 en `DATOS`.
- Flickr: 7 en `Detalle Proyecto`.

## Filas basura (1014)

Criterios de descarte:
- Proyecto y código ambos vacíos, o proyecto vacío.
- Proyecto es una **coordenada GPS** (`-20105127,3`, `-20114033,49`).
- Código es un **timestamp Excel** (`2026-03-08 16:43:25`) — típicamente acompañado de un GPS en la columna proyecto.

Ejemplos: `('2026-03-08 16:43:25', '-20105127,3')`, `('A061', '')`, filas totalmente vacías.

## Favoritos (352)

Detectados por marca de estrella al final del título (`★`, `*`, etc.).
Ejemplos: `SCANIA Testimonios PECI ★`, `USM PACE ★`, `Reinventarse ★`, `Cafe Vivendum ★`.

## Clientes detectados (sobre filas meaningful)

| Cliente | Filas |
|---|---|
| SCANIA | 335 |
| SACYR | 234 |
| USM | 224 |
| CCTVal | 15 |
| Masisa | 14 |
| Metro | 8 |
| PMM | 7 |
| Tesla | 5 |
| Orgones | 4 |
| Berthelon | 4 |
| Pudahuel / Mun. El Bosque | 3 / 1 |
| Santander | 3 |
| INACAP | 3 |
| PACE | 3 |
| Codelco | 3 |
| ESVAL | 1 |
| UAI | 1 |
| Universidad San Sebastián | 0 (no aparece en datos reales) |

Los tres grandes (SCANIA, SACYR, USM) concentran ~795 de las ~1747 filas útiles (~45%).

## ServiceType (inferido por keywords del título)

La columna `Clasificación` no sirve, así que el tipo de servicio se infiere del nombre:

| Tipo | Filas |
|---|---|
| Video (VIDEO/EDICIÓN/ANIMAC/TESTIMONIO/VOZ/SUBT…) | 61 |
| Foto (FOTO/RETRATO/FLICKR) | 73 |
| Video+Foto | 1 |
| Sin clasificar (mayoría) | 1612 |

La gran mayoría de títulos no llevan el tipo de servicio explícito → el serviceType **no se puede derivar de forma fiable solo del título**. Habrá que enriquecer (Vimeo→video, Flickr→foto) o pedir al cliente una columna explícita.

## Segmento de mercado (inferido, aproximado)

| Segmento | Filas | Heurística |
|---|---|---|
| Corporativo | ~339 | SCANIA, Santander, Tesla, Municipalidad, comunicaciones, marketing |
| Industrial | ~327 | SACYR, Masisa, Codelco, ESVAL, agua/hidrógeno, construcción, minería |
| Académico | ~237 | USM, UAI, INACAP, CCTVal, FONDECYT, PACE, ciencia |
| Otro / sin segmentar | ~844 | sin keyword reconocible |

## Recomendaciones

1. **Limpieza de ingest:** descartar en el normalizer las filas GPS+timestamp (≈ basura GPS de algún export de cámara/drone). Son ~37% del total.
2. **serviceType:** no confiar en `Clasificación`. Derivarlo del media provider (Vimeo=video, Flickr=foto) y de keywords como fallback; idealmente pedir al cliente una columna canónica.
3. **Favoritos:** normalizar el carácter estrella (varios glyphs distintos) a un booleano `is_featured` en D1.
4. **Código de proyecto:** vive en `Nª Proyecto` (col 1), no en `Código` (col 5, casi vacía). Confirmar con el cliente cuál es el canónico.
