# Montage Prompt — Leonfindel (Fase M)

> **Qué es esto.** El prompt one-shot para pegar en **Claude Design**. Genera los tres templates
> cinematográficos del sitio (Home, `/work`, `/work/[slug]`) como HTML autocontenido, listo para
> importar a Express o derivar a otros formatos.
>
> **Cómo usarlo.** Copiá todo el bloque bajo "PROMPT (paste this)" tal cual. Está escrito en inglés
> a propósito (Claude Design rinde mejor en EN); el sitio resultante es bilingüe EN-default + ES.
>
> **Antes de pegar:** confirmá que el material hero de §1 sigue vigente (ver `data/discovery.md` y la
> selección de Fase R). Los IDs de Vimeo del prompt son reales, del archivo de Leonfindel.
>
> Contexto de origen: [`foundation-brief.md`](./foundation-brief.md). Si hay conflicto, manda el brief.

---

## PROMPT (paste this)

```
You are designing the front-end for **Leonfindel**, a Chilean audiovisual studio (film + photography)
with a 20-year archive of industrial, academic and corporate work. This is NOT a "selected works"
agency portfolio — it is **the archive itself, opened and made searchable**. The catalogue rigor
(20 years indexed by code) IS the brand and must become the visual language.

Produce THREE responsive HTML page templates as self-contained HTML (inline/embedded CSS, minimal JS),
each its own artifact:

  1. Home — a cinematic landing.
  2. /work — the searchable gallery (the heart of the site).
  3. /work/[slug] — the piece-detail template.

═══════════════════════════════════════════════════════════════════════════════
ART DIRECTION (read first — this governs everything)
═══════════════════════════════════════════════════════════════════════════════
- Aesthetic: **sober, curated film-archive**. Think museum catalogue / technical spec sheet, NOT
  marketing agency. Restraint over flash.
- **Zero agency clichés.** No stock-photo gradients, no "we tell stories that connect", no glowing
  CTAs, no generic hero buzzwords, no bouncing icons, no emoji. If it looks like a SaaS template,
  it's wrong.
- Palette: near-black / deep charcoal base, warm off-white text, ONE restrained accent at most.
  Let the footage and photography carry all the color.
- Typography: a clean editorial serif or grotesque for display + body, and a **monospace** reserved
  for catalogue codes and technical metadata. The monospace is a signature, not decoration.
- **Catalogue-code-as-brand motif:** codes like `P485V1`, `AP49V1` appear in monospace as archive
  labels — spec-sheet alignments, catalogue numbers as accents, metadata in mono. The audiovisual
  material is ALWAYS the protagonist; the code is the quiet stamp of the archive.
- Motion: **subtle, scroll-driven** reveals only — slow fades, small translate-ups, footage that
  settles. No parallax theme-park, no aggressive scroll-jacking. Motion should feel like an archive
  breathing, not a showreel.
- Generous negative space. Grid discipline. Everything aligned to a clear baseline grid like a
  printed index.

═══════════════════════════════════════════════════════════════════════════════
BILINGUAL (EN default · ES available)
═══════════════════════════════════════════════════════════════════════════════
- Default language is **English**; a visible **EN/ES toggle** lives in the header.
- Translate only the **chrome** (nav, labels, editorial copy, UI states). Catalogue DATA (project
  names, client, place, codes) comes from a Spanish source and is shown verbatim in both languages.
- EN copy is usually shorter than ES — leave room for the longer ES strings without reflow breakage.
- Copy to use (EN canonical · ES below it):

  Home hero:
    H1  EN: "An archive in motion."        ES: "Un archivo en movimiento."
    Sub EN: "Twenty years of industrial, academic and corporate film and photography from Chile —
             catalogued and searchable."
        ES: "Veinte años de cine y fotografía industrial, académica y corporativa de Chile —
             catalogados y buscables."
  Home → Work entry:
    EN: "Search the archive" / "Browse by client, type or year"
    ES: "Buscá el archivo" / "Explorá por cliente, tipo o año"
  /work title + search placeholder:
    EN: "The Archive"  placeholder: "Search by client, project, place or year…"
    ES: "El Archivo"   placeholder: "Buscá por cliente, proyecto, lugar o año…"
  /work states:
    Empty (no query)  EN: "Start typing, or browse the full archive below."
                      ES: "Empezá a escribir, o explorá el archivo completo abajo."
    No results        EN: "Nothing matches that — try a broader term."
                      ES: "No hay coincidencias — probá un término más amplio."
    Loading           skeleton, no text (both)
    Error             EN: "Search is unavailable right now. Try again in a moment."
                      ES: "La búsqueda no está disponible ahora. Probá de nuevo en un momento."

═══════════════════════════════════════════════════════════════════════════════
TEMPLATE 1 — HOME (cinematic)
═══════════════════════════════════════════════════════════════════════════════
- Full-viewport **hero with a background video loop** (muted, autoplay, loop, playsinline) over the
  near-black base, with a **poster image fallback** that shows before/instead of the video.
- The hero footage is from Leonfindel's REAL archive — 4K UHD aerial drone footage over a Chilean
  highway (SACYR Ruta 78). Use these real Vimeo assets; primary pick first, the rest as rotation/
  fallback. Background loop must be muted regardless of source audio:
      Primary : Vimeo 720494578  "P485 SACYR RUTA 78 (Americo Vespucio)" — 4K, no audio, top pick
                poster: https://i.vimeocdn.com/video/1451289839-873f1e80f5a89c9bf34a49a700c9ce0e616074c22e7d73892def12169f05d055-d_640x360
      Alt 1   : Vimeo 723328988  "P485V7 SACYR Ruta 78 - Melipilla" — 4K, shortest, clean loop
                poster: https://i.vimeocdn.com/video/1456479035-adc8a116449fb1c55f71ef5fffd554aa0f6008cd1aadc41885c6eeb6d7d0ad80-d_640x360
      Alt 2   : Vimeo 723712876  "P485V3 SACYR Ruta 78 - Rinconada" — 4K
                poster: https://i.vimeocdn.com/video/1457158379-6f2d32d94a2873cca44e2b04bef3b85a8c061eb6b59c0c8857fc8fe7d3ad70fa-d_640x360
      Alt 3   : Vimeo 723333325  "P782V2 SACYR Ruta 78 - Isabel Riquelme" — 4K
                poster: https://i.vimeocdn.com/video/1456488131-2b722ecdb4c065c9c2dec076a2d65ccb262a517cc21e0c44b0c49c518aa343c6-d_640x360
      Alt 4   : Vimeo 723316751  "P485 SACYR Ruta 78 - Malloco" — 4K
                poster: https://i.vimeocdn.com/video/1456461447-8780fe813850df3b1aa5a79fc6589856e6270047008bd14918f5fb337341eb2d-d_640x360
  (In production the loop will be a short ultra-compressed clip; for the template, treat the hero as a
  muted looping video element with the poster above as the fallback image and the primary code "P485V1"
  shown small in monospace as an archive stamp in a corner of the hero.)
- Over the footage: the H1 + sub (EN default) and a single quiet entry into /work ("Search the
  archive"). No buttons that scream — a restrained text link or a thin-ruled control.
- Below the fold, scroll-driven: a sparse, gridded teaser of the archive — a handful of stills/thumbs
  with monospace codes as labels, hinting at the searchable index. Reveal subtly on scroll.
- The header carries the wordmark, the EN/ES toggle, and minimal nav (Work · About · Contact).

═══════════════════════════════════════════════════════════════════════════════
TEMPLATE 2 — /work (searchable gallery — the core)
═══════════════════════════════════════════════════════════════════════════════
- Title "The Archive" + a prominent search input with the placeholder above.
- **Primary filter: service type** — three values: `Industrial` · `Académico` · `Corporativo`
  (show ES labels as data; this is the main axis, visually dominant — e.g. a segmented control or
  tabbed filter row).
- **Secondary filters: Client · Year · Place** — quieter, as a filter rail or chips below the primary.
- Results as a disciplined **grid of thumbnails**. Each card:
    • the still/thumbnail (protagonist),
    • the project name,
    • the **catalogue code in small monospace, in a corner — an archive label, not a headline.**
- **GRACEFUL DEGRADATION (mandatory — real data has ~30% of rows with no code, plus garbage like
  "Revisar"):** when a code is missing/invalid, **do not render the code slot at all**; the card is
  identified by project name and must look INTENTIONAL without a code, never broken or with an empty
  box. Design the card so the code is an optional accent.
- Render the four UI states from the copy table: empty (no query), no-results, loading (skeleton, no
  text), error. These must be first-class, not afterthoughts — the archive's emptiness should look as
  composed as its fullness.
- Subtle scroll-in reveal as cards enter; nothing flashy.

═══════════════════════════════════════════════════════════════════════════════
TEMPLATE 3 — /work/[slug] (piece detail)
═══════════════════════════════════════════════════════════════════════════════
- A **big monospace catalogue code as the header** of the piece — the page's signature, like a
  catalogue number (e.g. `P485V1`). If the piece has no code, suppress it gracefully and lead with the
  project name instead (same degradation rule as the gallery).
- A **Vimeo embed** as the primary media (responsive 16:9 iframe; use a real archive id, e.g.
  720494578, as placeholder).
- **Narrative + metadata sourced from the Excel** (the catalogue's source of truth): project name,
  client, service type, year, place, and a "Detalle Proyecto" description block — laid out spec-sheet
  style, metadata in monospace, labels in the chrome language, values verbatim from data.
- Quiet back-link to the archive and prev/next within the same service type.

═══════════════════════════════════════════════════════════════════════════════
PERFORMANCE CONSTRAINTS (hard budget — premium look is subordinate to these)
═══════════════════════════════════════════════════════════════════════════════
- Target **Lighthouse 95+** and search interactions that stay snappy (p95 < 200ms server-side).
- Hero/background video: **muted, autoplay, loop, playsinline**, lazy-loaded, with a **poster image
  that loads first** so first paint never waits on video.
- **Respect `prefers-reduced-motion`:** when set, do NOT autoplay the loop — show the poster still —
  and disable scroll-driven animation.
- **Background video loop on desktop only.** On mobile/narrow viewports, show the poster image; do
  not autoplay heavy video.
- Keep CSS/JS minimal and inline; no heavy frameworks, no web-font bloat (subset; system fallbacks).
- Thumbnails lazy-loaded with intrinsic dimensions to avoid layout shift (CLS ~0).
- All motion must be cheap (transform/opacity only) and degrade to static gracefully.

═══════════════════════════════════════════════════════════════════════════════
DELIVERABLE
═══════════════════════════════════════════════════════════════════════════════
Three self-contained, responsive HTML templates (Home, /work, /work/[slug]) sharing one design system
— consistent type scale, color tokens, spacing grid, the monospace catalogue-code motif, and the
EN/ES toggle. Default content in English. Show the bilingual toggle working at least at the chrome
level. Prioritize the archive aesthetic and the performance constraints above over any decorative flourish.
```
