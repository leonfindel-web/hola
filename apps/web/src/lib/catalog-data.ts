/**
 * First-pass catalog data layer.
 *
 * Reads the enriched catalog JSON (apps/web/src/data/catalog-enriched.json) at
 * build time and normalizes it into a stable view model the pages render from.
 * This is the MVP source of truth for the front end — the SEARCH worker (hybrid
 * FTS5 + Vectorize) comes later and will replace the client-side filtering.
 *
 * Design decisions follow docs/frame/foundation-brief.md:
 *  - §2 slug ≠ code. Slug is derived: clean unique code → `code`; duplicate code
 *    → `code-N`; missing/dirty code → slug of the project name.
 *  - §5 code degradation: a piece may legitimately have no catalogue code. The
 *    `code` field is `null` in that case and the UI must not render a code slot.
 *  - §6 `excluir` rows ("MATERIAL PERDIDO o BORRADO", garbage) never reach the
 *    public portfolio.
 */

import rawCatalog from '../data/catalog-enriched.json';

export type ServiceType = 'Industrial' | 'Academico' | 'Corporativo';

/** Raw record shape as produced by the enrichment pipeline. */
interface RawRecord {
  fecha: string | null;
  codigo: string | null;
  proyecto: string | null;
  cliente: string | null;
  tipo: ServiceType | null;
  tags: string[] | null;
  lugar: string | null;
  vimeoId: string | null;
  flickrUrl: string | null;
  starred: boolean | null;
  excluir: boolean | null;
  descripcion: string | null;
}

/** Normalized piece the front end renders. */
export interface CatalogPiece {
  /** Stable URL slug. Always present and unique. */
  slug: string;
  /** Clean catalogue code, or null when absent/invalid (§5 degradation). */
  code: string | null;
  title: string;
  client: string | null;
  serviceType: ServiceType | null;
  year: number | null;
  fecha: string | null;
  place: string | null;
  tags: string[];
  vimeoId: string | null;
  flickrUrl: string | null;
  starred: boolean;
  /** Narrative sourced from the Excel `descripcion` (when it is real text). */
  narrative: string | null;
  thumbnail: string | null;
  embedUrl: string | null;
}

const CODE_GARBAGE = /^(revisar|material perdido|borrado|sin)\b/i;

function isValidCode(code: string | null): code is string {
  if (!code) return false;
  const trimmed = code.trim();
  if (trimmed.length === 0) return false;
  if (CODE_GARBAGE.test(trimmed)) return false;
  // A real catalogue code is short and alphanumeric (P93V1, AP49V1, AAA1…).
  return /^[A-Za-z]{1,4}\d{1,4}[A-Za-z]?\d{0,3}$/.test(trimmed);
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/★/g, '') // strip ★
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function extractYear(fecha: string | null): number | null {
  if (!fecha) return null;
  // Formats observed: YYYY-MM-DD and YYYYMMDD.
  const m = fecha.match(/(19|20)\d{2}/);
  if (!m) return null;
  const y = Number(m[0]);
  return y >= 1990 && y <= 2100 ? y : null;
}

function cleanClient(client: string | null): string | null {
  if (!client) return null;
  const c = client.replace(/★/g, '').trim();
  return c.length > 0 ? c : null;
}

/**
 * The Excel `descripcion` is sometimes just a Vimeo URL or a copy of the
 * project name — not real narrative. Only surface it when it adds information.
 */
function cleanNarrative(descripcion: string | null, proyecto: string | null): string | null {
  if (!descripcion) return null;
  const d = descripcion.trim();
  if (d.length === 0) return null;
  if (/^https?:\/\//i.test(d)) return null;
  if (proyecto && d.toLowerCase() === proyecto.trim().toLowerCase()) return null;
  return d;
}

function vimeoThumbnail(vimeoId: string | null): string | null {
  // Real thumbnails arrive via the ingest/Vimeo API later. For first pass we
  // leave it null and let the card fall back to its filmic placeholder.
  return vimeoId ? null : null;
}

function buildPieces(records: RawRecord[]): CatalogPiece[] {
  const usedSlugs = new Set<string>();
  const codeCounts = new Map<string, number>();

  // Pre-count valid codes to know which collide.
  for (const r of records) {
    if (isValidCode(r.codigo)) {
      const key = r.codigo!.trim();
      codeCounts.set(key, (codeCounts.get(key) ?? 0) + 1);
    }
  }
  const codeSeen = new Map<string, number>();

  const pieces: CatalogPiece[] = [];
  for (const r of records) {
    if (r.excluir) continue;

    const title = (r.proyecto ?? '').trim() || (r.codigo ?? '').trim() || 'Untitled';
    const code = isValidCode(r.codigo) ? r.codigo!.trim() : null;

    // Slug derivation (§2 option A).
    let baseSlug: string;
    if (code) {
      const total = codeCounts.get(code) ?? 1;
      if (total > 1) {
        const n = (codeSeen.get(code) ?? 0) + 1;
        codeSeen.set(code, n);
        baseSlug = `${slugify(code)}-${n}`;
      } else {
        baseSlug = slugify(code);
      }
    } else {
      baseSlug = slugify(title) || 'piece';
    }

    // Guarantee global uniqueness even after the above.
    let slug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }
    usedSlugs.add(slug);

    pieces.push({
      slug,
      code,
      title,
      client: cleanClient(r.cliente),
      serviceType: r.tipo,
      year: extractYear(r.fecha),
      fecha: r.fecha,
      place: r.lugar?.trim() || null,
      tags: Array.isArray(r.tags) ? r.tags.filter((t) => t && t.trim().length > 0) : [],
      vimeoId: r.vimeoId,
      flickrUrl: r.flickrUrl,
      starred: r.starred === true,
      narrative: cleanNarrative(r.descripcion, r.proyecto),
      thumbnail: vimeoThumbnail(r.vimeoId),
      embedUrl: r.vimeoId ? `https://player.vimeo.com/video/${r.vimeoId}` : null,
    });
  }
  return pieces;
}

let cachedPieces: CatalogPiece[] | null = null;
let usedMock = false;

function loadRecords(): { records: RawRecord[]; mock: boolean } {
  const data = rawCatalog as unknown as RawRecord[];
  if (Array.isArray(data) && data.length > 0) {
    return { records: data, mock: false };
  }
  return { records: mockRecords(), mock: true };
}

/** All public pieces (excluir filtered out), normalized and slugged. */
export function getAllPieces(): CatalogPiece[] {
  if (cachedPieces) return cachedPieces;
  const { records, mock } = loadRecords();
  usedMock = mock;
  cachedPieces = buildPieces(records);
  return cachedPieces;
}

export function isUsingMockData(): boolean {
  // Ensure load happened so the flag is set.
  getAllPieces();
  return usedMock;
}

export function getPieceBySlug(slug: string): CatalogPiece | undefined {
  return getAllPieces().find((p) => p.slug === slug);
}

/** Hero pieces curated from the Vimeo top-picks (recommendedAsHero, 4K loops). */
export interface HeroPick {
  vimeoId: string;
  title: string;
  serviceType: ServiceType;
  thumbnail: string;
}

export const PRIMARY_HERO: HeroPick = {
  vimeoId: '720494578',
  title: 'P485 SACYR Ruta 78 (Américo Vespucio)',
  serviceType: 'Industrial',
  thumbnail:
    'https://i.vimeocdn.com/video/1451289839-873f1e80f5a89c9bf34a49a700c9ce0e616074c22e7d73892def12169f05d055-d_1280x720',
};

export const HERO_PICKS: HeroPick[] = [
  PRIMARY_HERO,
  {
    vimeoId: '723328988',
    title: 'P485V7 SACYR Ruta 78 - Melipilla',
    serviceType: 'Industrial',
    thumbnail:
      'https://i.vimeocdn.com/video/1456479035-adc8a116449fb1c55f71ef5fffd554aa0f6008cd1aadc41885c6eeb6d7d0ad80-d_1280x720',
  },
  {
    vimeoId: '723712876',
    title: 'P485V3 SACYR Ruta 78 - Rinconada',
    serviceType: 'Industrial',
    thumbnail:
      'https://i.vimeocdn.com/video/1457158379-6f2d32d94a2873cca44e2b04bef3b85a8c061eb6b59c0c8857fc8fe7d3ad70fa-d_1280x720',
  },
];

/** Derived facet values for the secondary filters (client / year / place). */
export interface CatalogFacets {
  serviceTypes: ServiceType[];
  clients: { value: string; count: number }[];
  years: number[];
  places: { value: string; count: number }[];
}

export function getFacets(pieces: CatalogPiece[] = getAllPieces()): CatalogFacets {
  const clientCounts = new Map<string, number>();
  const placeCounts = new Map<string, number>();
  const years = new Set<number>();
  const serviceTypes = new Set<ServiceType>();

  for (const p of pieces) {
    if (p.client) clientCounts.set(p.client, (clientCounts.get(p.client) ?? 0) + 1);
    if (p.place) placeCounts.set(p.place, (placeCounts.get(p.place) ?? 0) + 1);
    if (p.year) years.add(p.year);
    if (p.serviceType) serviceTypes.add(p.serviceType);
  }

  const byCountDesc = (a: { count: number }, b: { count: number }) => b.count - a.count;

  return {
    serviceTypes: (['Industrial', 'Academico', 'Corporativo'] as ServiceType[]).filter((s) =>
      serviceTypes.has(s),
    ),
    clients: [...clientCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort(byCountDesc),
    years: [...years].sort((a, b) => b - a),
    places: [...placeCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort(byCountDesc),
  };
}

/** A trimmed projection passed to the client-side filtering island as JSON. */
export interface PieceLite {
  slug: string;
  code: string | null;
  title: string;
  client: string | null;
  serviceType: ServiceType | null;
  year: number | null;
  place: string | null;
  thumbnail: string | null;
  hasVideo: boolean;
  starred: boolean;
  haystack: string;
}

export function toLite(p: CatalogPiece): PieceLite {
  const haystack = [p.code, p.title, p.client, p.place, p.serviceType, String(p.year ?? ''), ...p.tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return {
    slug: p.slug,
    code: p.code,
    title: p.title,
    client: p.client,
    serviceType: p.serviceType,
    year: p.year,
    place: p.place,
    thumbnail: p.thumbnail,
    hasVideo: Boolean(p.vimeoId),
    starred: p.starred,
    haystack,
  };
}

/** Small synthetic fallback used only if the enriched JSON is missing/empty. */
function mockRecords(): RawRecord[] {
  const base = (
    codigo: string | null,
    proyecto: string,
    tipo: ServiceType,
    lugar: string | null,
    fecha: string | null,
    vimeoId: string | null,
    starred = false,
  ): RawRecord => ({
    fecha,
    codigo,
    proyecto,
    cliente: null,
    tipo,
    tags: proyecto.toLowerCase().split(/\s+/).slice(0, 4),
    lugar,
    vimeoId,
    flickrUrl: null,
    starred,
    excluir: false,
    descripcion: proyecto,
  });
  return [
    base('P485', 'SACYR Ruta 78 Américo Vespucio', 'Industrial', 'Santiago', '2022-05-10', '720494578', true),
    base('P478', 'SCANIA Super Favio', 'Industrial', 'Santiago', '2021-09-03', '717639666'),
    base('AP85V1', 'USM Edificio Vida Universitaria', 'Academico', 'Valparaíso', '2017-03-21', '240020604'),
    base(null, 'Diploma de Innovación', 'Academico', 'Santiago', '2019-11-02', null, true),
    base('B052', 'Masisa Corporativo', 'Corporativo', 'Concepción', '2018-06-14', null),
    base('B053', 'Ministerio de Energía Campaña', 'Corporativo', 'Santiago', '2020-01-30', null),
    base('AP62V1', 'Tesla Review', 'Corporativo', 'Santiago', '2017-08-19', '208959283'),
    base(null, 'Historias de Sol', 'Corporativo', null, '2016-12-01', null, true),
    base('P782', 'KOMATSU Maquinaria Pesada', 'Industrial', 'Antofagasta', '2021-04-12', null),
    base('AP91V1', 'Desafío del Puma 4K', 'Corporativo', 'El Bosque', '2016-02-20', '157706669'),
    base('AP69V1', 'PACE Enjoy', 'Academico', 'Santiago', '2016-03-30', '173461904', true),
    base(null, 'BHP Minería', 'Industrial', 'Antofagasta', '2020-07-22', null),
  ];
}
