# Foundation Brief — Leonfindel

> **Fase F (FRAME) del `PLAN.md`.** Salida de estrategia: arquitectura de información, copy y
> decisiones que gobiernan el diseño cinematográfico antes de tocar Claude Design.
>
> **Estado del dato:** escrito asumiendo la forma REAL del Excel del cliente documentada en
> [`data/discovery.md`](../../data/discovery.md), no los supuestos del `PLAN.md`. Donde el plan
> asumía códigos limpios tipo `B052` y columnas `Cliente`/`Tipo`, el dato real es más sucio
> (ver §6). El brief diseña para esa realidad.
>
> Última actualización: 2026-06-18.

---

## 1. Identidad y posicionamiento

**Leonfindel** es un estudio audiovisual chileno (video + foto) con +20 años de archivo:
trabajo industrial, académico y corporativo. El sitio no es un portfolio de "trabajos
seleccionados" — es **el archivo mismo, abierto y buscable**.

**Tesis de diseño:** el activo visual ES el archivo. La home no necesita stock ni renders
genéricos; usa el propio material de Leonfindel (SCANIA, USM, Santander, INACAP…). El sistema
no solo muestra el trabajo: lo **cataloga, lo cura y lo hace encontrable**. Ese rigor de
archivo —20 años indexados con código— es el diferenciador, y se vuelve lenguaje visual.

**Tono:** sobrio, cinematográfico, de archivo curado. Estética de ficha técnica / catálogo de
museo, no de agencia. Cero "AI slop" (nada de "contamos historias que conectan", "damos vida a
tus ideas", etc.).

---

## 2. Arquitectura de información

```
/                 Home cinematográfica — el archivo en movimiento
/work             Galería buscable (el corazón del sitio)
/work/[slug]      Detalle de pieza — embed Vimeo / lightbox Flickr + metadata del Excel
/about            Estudio: quiénes, 20 años, capacidades
/contact          Contacto
```

- **`/work` es el producto.** La home es la puerta; la galería buscable es donde vive el valor.
- **`slug`, no `code`.** El código no es único ni siempre existe (§6), así que la URL canónica
  es un slug derivado: `code` cuando es válido y único, `code-N` ante duplicados, o un slug del
  nombre de proyecto cuando no hay código. (Confirma la opción A de `discovery.md §1.4`.)
- **About/Contact** son secundarias — una sola pantalla cada una, sin sub-navegación.

---

## 3. Eje de categorización (DECISIÓN CERRADA)

**Primario: Tipo de servicio.** `Industrial` · `Académico` · `Corporativo`.
**Secundario: Cliente.** (USM, Banco Santander, INACAP, Berthelon, SCANIA…)
Filtros adicionales: **Año** y **Lugar** (Lugar sí existe en el Excel, col J).

> ⚠️ **Bloqueante de dato — leer.** Ni `Tipo` ni `Cliente` existen como columna en el Excel
> (`discovery.md §1.5`). El cliente está **implícito en el nombre del proyecto**; el tipo de
> servicio **no está en ninguna parte**. Por lo tanto este eje de categorización **depende de
> metadata que hay que crear** (ver §7, "Enriquecimiento"). El diseño se hace asumiendo que el
> eje existirá; el backend lo materializa vía enriquecimiento antes de Fase 5.

---

## 4. Idioma (DECISIÓN CERRADA)

**Bilingüe. EN por defecto, ES disponible.**

- Default `en`; toggle visible EN/ES en el header.
- Contenido del archivo (nombres de proyecto, cliente, lugar) viene del Excel en español → se
  muestra tal cual en ambos idiomas; se traduce el **chrome** (navegación, labels, copy
  editorial, estados de UI), no los datos del catálogo.
- Implementación: rutas `/[lang]/…` o i18n de Astro. A definir en Fase E; no condiciona el
  diseño FRAME más allá de prever espacio para textos EN y ES (EN suele ser más corto).

---

## 5. Código de catálogo como elemento de marca (DECISIÓN CERRADA, con degradación)

El código (`P93V1`, `AP49V1`…) se muestra como **distintivo de archivo**, en monospace, estética
de ficha técnica:

- **Galería `/work`:** código en esquina de cada thumbnail, monospace pequeño — etiqueta, no
  protagonista.
- **Detalle `/work/[slug]`:** código grande en el header de la pieza, como número de catálogo.
- **Motivo gráfico transversal:** alineaciones tipo ficha, monospace para metadata, números de
  catálogo como acento. El protagonista siempre es el material audiovisual.

> ⚠️ **Regla de degradación (obligatoria por el dato real).** ~30% de las filas no tienen código,
> y hay basura (`"Revisar"`, timestamps, sufijos `*`). El diseño **no puede colgar la identidad
> de un campo que falta en 1 de cada 3 piezas.** Comportamiento:
> - Código válido y limpio → se muestra.
> - Ausente / inválido / `"Revisar"` → **no se muestra el slot de código**; la pieza se identifica
>   por nombre de proyecto. El layout debe verse intencional sin código, no roto.

---

## 6. Realidad del dato que condiciona el diseño

Resumen de `data/discovery.md` — lo que el diseñador y el front deben asumir:

| Hecho real | Consecuencia de diseño |
|---|---|
| Códigos sucios, ~30% vacíos, no únicos | Slug ≠ code; degradación del distintivo (§5) |
| Sin columna `Cliente` (implícita en proyecto) | Cliente se deriva → filtro secundario poblado por enriquecimiento (§7) |
| Sin columna `Tipo` de servicio | Eje primario depende de enriquecimiento (§3, §7) |
| Tab `Información` parece 100% video | Foto/Flickr: ubicación del catálogo aún sin confirmar (`discovery.md §3`) |
| `"MATERIAL PERDIDO o BORRADO"` en filas | Necesitamos flag `Excluir` — esas piezas no entran al portfolio público |
| Filas basura (coordenadas GPS, timestamps) | El ingest filtra; el diseño no las ve, pero el front necesita estado "vacío/limpio" robusto |
| Join Vimeo por URL en col `DATOS` | Embed de detalle depende de esa URL; fallback si falta |

---

## 7. Objetivos de producto (incluye enriquecimiento de metadata)

Más allá de "buscar el archivo", el sistema **cura y mejora la metadata**. Dos problemas
distintos (no confundir):

**A) Metadata faltante en el propio Excel (BLOQUEA la categorización).**
El Excel no tiene `Cliente` / `Tipo` / `Tags` / `Excluir`. Caminos (no excluyentes):
- Derivación AI-assisted: inferir cliente y tipo de servicio desde nombre de proyecto +
  `Detalle Proyecto` + `Lugar`.
- Columnas nuevas en el Sheet (`Cliente`, `Tipo`, `Tags`, `Excluir`) que el cliente o nosotros
  llenamos — ver decisiones pendientes en `discovery.md §5`.

**B) Write-back de metadata a Vimeo y Flickr (workstream POSTERIOR).**
Hoy los videos de Vimeo no tienen descripción; la narrativa vive en el Excel. Una vez que el
Excel esté validado como canónico y el ingest de lectura funcione, un proceso separado empuja la
metadata canónica de vuelta a Vimeo (scope `edit`) y Flickr (OAuth `write`).
- **No es MVP.** Va después de que el pipeline de lectura ande y el Excel se confirme limpio.
- Riesgo casi-destructivo sobre 1500+ piezas reales → dry-run obligatorio, backup del estado
  actual de cada ítem, reporte de diffs y confirmación antes de aplicar (regla dura `CLAUDE.md`).
- **Acción ya en Fase 0:** pedir los scopes de escritura (Vimeo `edit`, Flickr `write`) desde el
  inicio para no rehacer tokens después.

---

## 8. Copy (EN por defecto · ES)

> Borrador editorial sin clichés. EN es el canónico; ES es traducción cuidada, no literal.
> Sujeto a refinamiento del cliente.

### Home — Hero
- **EN (recomendado):**
  - H1: *An archive in motion.*
  - Sub: *Twenty years of industrial, academic and corporate film and photography from Chile — catalogued and searchable.*
- **EN (alternativa más sobria):**
  - H1: *Twenty years, indexed.*
  - Sub: *The complete moving-image and photographic archive of Leonfindel — open and searchable.*
- **ES:**
  - H1: *Un archivo en movimiento.*
  - Sub: *Veinte años de cine y fotografía industrial, académica y corporativa de Chile — catalogados y buscables.*

### Home — entrada a Work
- EN: *Search the archive* / *Browse by client, type or year*
- ES: *Buscá el archivo* / *Explorá por cliente, tipo o año*

### /work — título y placeholder de búsqueda
- EN: *The Archive* — search placeholder: *Search by client, project, place or year…*
- ES: *El Archivo* — placeholder: *Buscá por cliente, proyecto, lugar o año…*

### /work — estados
| Estado | EN | ES |
|---|---|---|
| Vacío (sin query) | *Start typing, or browse the full archive below.* | *Empezá a escribir, o explorá el archivo completo abajo.* |
| Sin resultados | *Nothing matches that — try a broader term.* | *No hay coincidencias — probá un término más amplio.* |
| Cargando | (skeleton, sin texto) | (skeleton, sin texto) |
| Error | *Search is unavailable right now. Try again in a moment.* | *La búsqueda no está disponible ahora. Probá de nuevo en un momento.* |

### /about (esqueleto, copy final en sesión aparte)
- EN: *Leonfindel is a Chilean audiovisual studio. For over twenty years we've documented industry, education and corporate life on film and in photographs.*
- ES: *Leonfindel es un estudio audiovisual chileno. Por más de veinte años hemos documentado la industria, la educación y el mundo corporativo en cine y fotografía.*

---

## 9. Restricciones de diseño heredadas (no negociables en Montage)

Del `PLAN.md §5` (riesgo principal) y `CLAUDE.md` (performance budget):

- **Lighthouse 95+ y search p95 < 200ms** son el budget. El look premium se subordina a eso.
- **Loops de video de fondo:** ultra-comprimidos (4–8s, WebM/MP4 H.265), lazy-load, **poster
  image de fallback**, `prefers-reduced-motion` respetado, y **loop solo en desktop**. Estas
  mitigaciones son requisito de diseño desde el día uno, no parche posterior.
- Idealmente los loops salen del **propio archivo** de Leonfindel, no de generación (más auténtico
  y barato) — ver `PLAN.md` Fase A.

---

## 10. Decisiones cerradas vs. pendientes

**Cerradas (este brief):**
- ✅ Eje: Tipo de servicio primario + Cliente secundario (+ Año, Lugar).
- ✅ Idioma: bilingüe, EN default.
- ✅ Código como marca, con degradación elegante.
- ✅ Write-back Vimeo/Flickr = objetivo de producto, ejecución posterior; scopes de escritura desde Fase 0.

**Pendientes (bloquean partes de Bloque B, no el diseño):**
- [ ] `discovery.md §5`: renombrar headers, columnas nuevas (`Cliente`/`Tipo`/`Tags`/`Excluir`), manejo de duplicados, ubicación del catálogo de fotos — **conversar con el cliente**.
- [ ] Estrategia de poblado del eje Tipo/Cliente: ¿derivación AI, columnas manuales, o híbrido?
- [ ] `REFERENCES.md` no existe en el repo — necesario para Montage (tokens FRAME + referencia frischloft). Crear antes de Fase M.
- [ ] Copy final de Hero (elegir entre las opciones de §8) y de /about.

---

## 11. Próximo paso (Fase R — Render)

Con el brief aprobado: seleccionar 3–5 piezas estrella del archivo (clientes potentes tipo
SCANIA/USM) como material hero, y donde falte, generar prompts cinematográficos específicos.
Salida: `docs/frame/render-prompts.md` + `assets/hero/`.
