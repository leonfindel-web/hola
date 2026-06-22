# Render Prompts — Leonfindel

> **Fase R (RENDER) del `PLAN.md`, Bloque A.** Selección de material hero del archivo + prompts
> de generación solo para los huecos que el archivo no cubre.
>
> **Insumo de contexto:** [`foundation-brief.md`](./foundation-brief.md). Tesis vigente: *el activo
> visual ES el archivo* (brief §1). Por eso este documento **prioriza recortar loops del propio
> material de Leonfindel** y trata la generación AI como último recurso, solo donde el archivo no
> da material apto.
>
> **Insumo de dato:** assessment real de candidatos hero en Vimeo (16 piezas evaluadas, ver §6).
>
> **Salida de esta fase:** este documento + `assets/hero/` (material crudo descargado) → alimenta
> Fase A (Animation), donde estos clips se convierten en loops perfectos.
>
> Última actualización: 2026-06-22.

---

## 1. Criterios de selección de hero

Un clip entra como hero solo si cumple **todos** los criterios duros. Los blandos desempatan.

**Criterios duros (excluyentes):**

1. **Resolución ≥ 1080p, idealmente 4K UHD.** El hero ocupa pantalla completa en desktop; 720p
   no aguanta. Las piezas de 720p quedan fuera por definición.
2. **Embeddable y accesible vía API.** `privacy` ∈ {`unlisted`, `anybody`, `disable`} con embed
   público funcionando. `privacy: error` (404) queda fuera: no podemos descargar ni linkear.
3. **Movimiento continuo y estable, apto para loop.** El hero es un *fondo* en bucle, no una
   pieza narrativa. Necesita movimiento fluido y sostenido (drone aéreo estable, travelling),
   **no** cortes duros, **no** voz en off, **no** plano-secuencia con relato.
4. **Tono sobrio / cinematográfico.** Coherente con la estética de archivo curado (brief §1).
   Sujetos dramáticos o erráticos (fuego, carreras de drones) rompen el tono de "fondo calmo".

**Criterios blandos (desempate):**

5. **Duración manejable** — más corto es mejor para recortar un loop limpio (4–8s). Clips muy
   largos no penalizan, pero el más corto con buen movimiento gana.
6. **Sin audio relevante** — el hero va *muted* siempre; tener o no audio es indiferente, pero
   confirma que no es una pieza con relato.
7. **Diversidad de cliente / tipo de servicio.** El eje primario es Industrial / Académico /
   Corporativo (brief §3). Idealmente el set hero cubre los tres ejes para que la home represente
   el archivo completo, no un solo cliente.

**Regla de degradación de tono (heredada del brief §5):** si el archivo no ofrece material apto
para un eje, **no se fuerza** un clip malo ni se rellena con stock genérico. Se genera material
cinematográfico específico (§4) o el eje simplemente no tiene loop propio en el MVP.

---

## 2. Selección final de hero (3–5 piezas)

Cinco piezas del archivo real pasan todos los criterios duros. Todas son **Industrial**, todas
4K UHD, todas de la campaña SACYR Ruta 78 (drone aéreo sobre autopista). Es el material más
fuerte y técnicamente más apto del archivo para un hero en bucle.

| # | Vimeo ID | Título | Duración | ServiceType | Por qué loopea |
|---|---|---|---|---|---|
| 1 | `720494578` | P485 SACYR Ruta 78 (Américo Vespucio) | 5:45 (345s) | Industrial | **Top pick.** 4K UHD, drone aéreo sobre autopista, sin audio, movimiento continuo y estable. El plano más cinematográfico del set; ideal para loop seamless. |
| 2 | `723328988` | P485V7 SACYR Ruta 78 - Melipilla | 2:36 (156s) | Industrial | El clip SACYR más corto, sin audio, movimiento de drone limpio. Por brevedad es el más fácil de recortar a un loop de 4–8s. Fuerte candidato. |
| 3 | `723712876` | P485V3 SACYR Ruta 78 - Rinconada | 4:43 (283s) | Industrial | 4K aéreo, movimiento de drone continuo, fuerte candidato cinematográfico a loop. |
| 4 | `723333325` | P782V2 SACYR Ruta 78 - Isabel Riquelme | 4:30 (270s) | Industrial | 4K aéreo estable, público y embeddable. Tiene audio pero es irrelevante (va muted). Buen seamless loop. |
| 5 | `723316751` | P485 SACYR Ruta 78 - Malloco | 4:40 (280s) | Industrial | 4K aéreo estable, apto para loop corto. Cierra el set con variedad de tramo de autopista. |

**Backups (no en el set principal):**

- `723321661` — P485V5 SACYR Ruta 78 - Talagante (4K, loopable, pero el más largo: 459s; redundante
  con los otros SACYR). Reserva si algún pick principal falla en la descarga.

**Decisión de diseño sobre la homogeneidad del set:** los 5 picks son el mismo cliente y tipo.
Esto es una **fortaleza visual** (consistencia cinematográfica del hero) pero una **debilidad de
representatividad** del eje (brief §3 quiere mostrar Industrial / Académico / Corporativo). Dos
caminos para Montage (Fase M):

- **A — Hero mono-cliente (recomendado para MVP):** el hero es la secuencia SACYR; la diversidad
  de ejes se muestra *abajo*, en la galería `/work` y sus filtros. El hero no tiene que ser un
  muestrario: tiene que ser impactante. Cinco tramos del mismo material 4K dan un loop premium y
  coherente. **Esta es la recomendación.**
- **B — Hero multi-eje:** intercalar un loop Académico y uno Corporativo. **Bloqueado por dato:**
  el archivo hoy no tiene material apto para esos ejes (§3). Solo viable generando (§4), lo que
  contradice la tesis "usá el archivo" del brief. No recomendado para MVP.

---

## 3. Gaps de cobertura del archivo

El assessment confirma que **el archivo solo cubre el eje Industrial con calidad de hero.** Los
otros dos ejes del brief §3 no tienen material apto:

| Eje | Estado en el archivo | Detalle |
|---|---|---|
| **Industrial** | ✅ Cubierto, sobrado | 5 picks 4K + 1 backup. No requiere generación. |
| **Académico** | ❌ Sin material apto | USM (`240020604`, `239056836`) son 1080p, `view disabled`, y son compilados B-roll multi-corte — no son single-shot loopables. Sirven como backup de galería, no de hero. |
| **Corporativo** | ❌ Sin material apto | SCANIA Super Favio (`717639666`) es relato 1080p con voz en off, cut-driven. Tesla (`208959283`) es talking-head. Masisa (`186329149`, `243923603`) están 404 / borrados. Nada loopable. |

**Material descartado y por qué (para no re-evaluarlo):**

- 720p (`184011598` Drone Nationals, `179657300` TEDx USM) → bajo el piso de resolución.
- Tono incompatible (`189556647` Drone Fire: fuego = movimiento errático y dramático, off-tone).
- 404 / borrados (`186329149`, `243923603` Masisa) → inaccesibles vía API.
- Narrativos / talking-head (`717639666` SCANIA Super Favio, `208959283` Tesla) → no son fondo.

**Postura sobre los gaps (alineada al brief):** **no se generan loops para tapar estos huecos en
el MVP.** El hero será Industrial-puro (opción 2-A). Los prompts de §4 quedan documentados como
**material de contingencia**: solo se usan si en Fase M se decide ir por un hero multi-eje (2-B) o
si el cliente pide explícitamente representar Académico/Corporativo en la home. Generar es la
excepción, no el plan.

---

## 4. Prompts de generación (contingencia, solo para los gaps)

> **Usar solo si §3 lo justifica.** Preferí siempre el archivo. Estos prompts buscan material
> *texturado y fílmico*, indistinguible de un drone/cámara real, **no** stock corporativo
> genérico. Estética: grano de película, luz natural motivada, paleta sobria, movimiento de
> cámara real con micro-imperfecciones. Cero look "3D render limpio", cero gente sonriendo a
> cámara, cero gradientes corporativos.

Formato Flux / Midjourney. Pensados como **frame/plano base** que Fase A (Kling/Luma/Runway)
convierte en clip animado y luego en loop.

### 4.1 Gap Académico — campus universitario, plano aéreo calmo

**Prompt (EN, canónico para los modelos):**

```
Cinematic aerial drone shot slowly orbiting a mid-century Chilean university campus at golden
hour, brutalist concrete and glass architecture, mature trees casting long soft shadows,
students as small distant figures crossing courtyards, hazy warm low-angle sunlight, subtle
atmospheric haze, anamorphic lens, fine 35mm film grain, muted earthy palette of concrete grey,
warm ochre and deep green, slow continuous stable motion suitable for a seamless loop, no text,
no logos, photoreal documentary tone, shot on ARRI Alexa, shallow depth cues, 4K.
```

**Negativos:** `no harsh midday light, no lens flare gimmicks, no oversaturation, no CGI plastic
look, no smiling people facing camera, no corporate gradient, no stock-footage cleanliness.`

**Notas:** orbita lenta y continua → loop fácil. Golden hour + grano da el tono "archivo", no
"folleto de admisiones".

### 4.2 Gap Corporativo — interior arquitectónico / planta industrial limpia

**Prompt (EN, canónico):**

```
Slow cinematic dolly through the interior of a modern Chilean corporate headquarters at dusk,
floor-to-ceiling windows, polished concrete floor reflecting cool blue exterior light and warm
interior pools of light, empty minimalist space, dust motes drifting in a soft light beam,
shallow depth of field, anamorphic lens, gentle continuous forward camera motion suitable for a
seamless loop, fine film grain, restrained palette of slate blue, charcoal and warm amber
accents, photoreal architectural documentary tone, no people, no text, no logos, shot on
cinema prime lens, 4K.
```

**Negativos:** `no fisheye, no fast motion, no busy office clutter, no stock-business handshakes,
no glossy advertising sheen, no neon, no CGI.`

**Notas:** dolly lento hacia adelante con final que reencuadra cerca del inicio → loopable.
Espacio vacío evita el cliché del "equipo trabajando".

### 4.3 Variante Industrial (solo si se quiere generar, no necesario)

> El archivo ya cubre Industrial; este prompt existe solo por completitud, por si se quiere un
> plano industrial distinto del drone-autopista (ej. faena, planta). **No se usa en el MVP.**

```
Cinematic aerial drone shot over a large-scale Chilean industrial site at blue hour, highway or
mining infrastructure, geometric patterns of roads and structures, sodium vapor lights beginning
to glow, atmospheric haze, slow continuous stable lateral drift suitable for a seamless loop,
fine film grain, desaturated industrial palette of steel grey, asphalt black and warm sodium
amber, photoreal documentary tone, no text, no logos, shot on cinema drone, 4K.
```

---

## 5. Producción del loop (Fase A) — atado al budget Lighthouse 95+

> Heredado de `foundation-brief.md` §9 y `PLAN.md` §5. El riesgo principal del proyecto es
> *loop de fondo vs. performance budget*. Estas reglas son **requisito de diseño desde el día uno**,
> no optimización posterior.

**Especificación de cada loop:**

- **Duración 4–8s**, recortado del clip fuente de modo que **frame inicial ≈ frame final** (loop
  seamless, sin salto visible). Los SACYR de drone estable lo permiten; elegir un tramo de
  movimiento uniforme.
- **Formato dual:** `WebM` (VP9/AV1) como fuente primaria + `MP4` (H.265/HEVC) como fallback de
  compatibilidad. Servir vía `<video>` con dos `<source>`.
- **Ultra-comprimido:** target por loop **< 2 MB**, idealmente ~1 MB. Bitrate bajo: es fondo
  desenfocado bajo texto, no requiere fidelidad. Sin audio (`-an`).
- **Poster image obligatorio:** un frame `.webp`/`.avif` (~50–100 KB) que se pinta de inmediato.
  Es lo que ve el usuario antes de (o si nunca) carga el video. La home debe verse terminada con
  solo el poster. Usar el `thumbnail` de Vimeo como base si hace falta.
- **`prefers-reduced-motion: reduce`** → **no se carga el video**, se muestra solo el poster
  estático. Respetado, no negociable.
- **Solo desktop.** En mobile se sirve únicamente el poster (ahorra datos y batería, y mobile es
  donde el budget Lighthouse más sufre). Gate por media query / JS de viewport, lazy-load del
  `<video>` solo cuando corresponde.
- **Lazy-load + `preload="none"`**, `autoplay muted loop playsinline`. El video arranca tras
  pintar el poster, sin bloquear LCP.

**Verificación (Fase E / Fase 7):** medir Lighthouse con el loop activo en desktop. Si baja de
95, primero recortar peso del loop (bitrate, duración), no remover la mitigación. El poster debe
garantizar que LCP no dependa del video.

---

## 6. Apéndice — assessment Vimeo completo (16 piezas)

Origen del dato para §2 y §3. `recommendedAsHero` y `topPicks` provienen del assessment real.

| Vimeo ID | Título | Dur (s) | Res | Privacy | Tipo | Loopable | Hero | Veredicto |
|---|---|---|---|---|---|---|---|---|
| `720494578` | P485 SACYR Ruta 78 (Américo Vespucio) | 345 | 3840×2160 | unlisted | Industrial | ✅ | ✅ | **Pick 1 — top.** Drone 4K, sin audio, motion estable. |
| `723328988` | P485V7 SACYR Ruta 78 - Melipilla | 156 | 3840×2160 | anybody | Industrial | ✅ | ✅ | **Pick 2.** Más corto del set, motion limpio. |
| `723712876` | P485V3 SACYR Ruta 78 - Rinconada | 283 | 3840×2160 | anybody | Industrial | ✅ | ✅ | **Pick 3.** 4K aéreo continuo. |
| `723333325` | P782V2 SACYR Ruta 78 - Isabel Riquelme | 270 | 3840×2160 | anybody | Industrial | ✅ | ✅ | **Pick 4.** 4K estable, audio irrelevante. |
| `723316751` | P485 SACYR Ruta 78 - Malloco | 280 | 3840×2160 | anybody | Industrial | ✅ | ✅ | **Pick 5.** 4K estable, loop corto. |
| `723321661` | P485V5 SACYR Ruta 78 - Talagante | 459 | 3840×2160 | anybody | Industrial | ✅ | ❌ | **Backup.** Loopable pero el más largo y redundante. |
| `717639666` | P478 SCANIA Super Favio | 329 | 1920×1080 | anybody | Industrial | ❌ | ❌ | Descartado: relato con voz en off, cut-driven. |
| `240020604` | AP85V1 USM Edificio Vida Universitaria | 110 | 1920×1080 | disable | Académico | ❌ | ❌ | Backup galería: B-roll multi-corte, no loop. |
| `239056836` | AP85V3 USM Edificio Vida Univ. (Casino) | 127 | 1920×1080 | disable | Académico | ❌ | ❌ | Descartado hero: secuencia editada, no seamless. |
| `186329149` | Masisa (corporativo) | — | — | error | Corporativo | ❌ | ❌ | Descartado: 404, borrado/inaccesible. |
| `243923603` | Masisa Parte 1 | — | — | error | Corporativo | ❌ | ❌ | Descartado: 404, borrado/inaccesible. |
| `189556647` | AP94V1 Drone Fire | 115 | 1920×1080 | disable | Industrial | ❌ | ❌ | Descartado: fuego, movimiento errático, off-tone. |
| `184011598` | AP84V1 Chile Drone Nationals 2016 | 128 | 1280×720 | disable | Industrial | ❌ | ❌ | Descartado: 720p + carrera de drones errática. |
| `208959283` | AP62V1 Tesla | 247 | 1920×1080 | anybody | Corporativo | ❌ | ❌ | Descartado: talking-head, no es fondo. |
| `179657300` | AP50V1 TEDx USM | 129 | 1280×720 | disable | Académico | ❌ | ❌ | Descartado: 720p, escenario/presentador. |

**Lectura del assessment:** 5/16 aptos para hero, todos Industrial 4K. El eje Industrial está
sobre-cubierto; Académico y Corporativo no tienen material de hero (§3). Confirma la estrategia
mono-cliente (§2, opción A) para el MVP.
