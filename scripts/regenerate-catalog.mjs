#!/usr/bin/env node
/**
 * regenerate-catalog.mjs — Regenera el catálogo enriquecido desde el Google Sheet público.
 *
 * Por qué existe: el catálogo completo (`data/enriched/catalog-enriched.full.json`) NO se
 * commitea (dato del cliente, gitignored). Este script lo reconstruye desde cero leyendo el
 * Sheet, para que quien reciba el repo no dependa de traspasar el archivo local.
 *
 * OJO: la derivación de `cliente`/`tipo`/`tags` acá es HEURÍSTICA (reglas de keywords), una
 * aproximación de la versión canónica que se generó con un pase de IA. Es suficiente para
 * desarrollar y para cargar a D1; el `normalize.ts` de Fase 3 puede refinarla.
 *
 * Uso:
 *   node scripts/regenerate-catalog.mjs                # escribe data/enriched/catalog-enriched.full.json
 *   node scripts/regenerate-catalog.mjs --out ruta.json
 *
 * Sin dependencias externas (Node 20+, usa fetch global).
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SHEET_ID = '1Ba3BOiPhdWnnV4gP8o5lXdxld7mLIIhQpRbtNNLYGPM';
const GID = '1256451792'; // tab "Información"
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const outArg = process.argv.indexOf('--out');
const OUT = outArg !== -1 ? process.argv[outArg + 1] : 'data/enriched/catalog-enriched.full.json';

/** Parser CSV mínimo que respeta comillas dobles y comas/saltos dentro de comillas. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Mapea headers reales (pueden cambiar de orden) a índices de columna. */
function columnIndex(headers) {
  const find = (...names) => {
    const wanted = names.map(norm);
    return headers.findIndex((h) => wanted.includes(norm(h)));
  };
  return {
    fecha: find('FECHA', 'a'),
    codigo: find('Nª Proyecto', 'N° Proyecto', 'Na Proyecto'),
    proyecto: find('Proyecto'),
    datos: find('DATOS'),
    detalle: find('DETALLE'),
    detalleProyecto: find('Detalle Proyecto'),
    lugar: find('Lugar'),
  };
}

const CLIENTES = [
  [/santa mar|utfsm|\busm\b/, 'Universidad Técnica Federico Santa María'],
  [/scania/, 'SCANIA'], [/sacyr/, 'SACYR'], [/masisa/, 'Masisa'], [/tesla/, 'Tesla'],
  [/codelco/, 'Codelco'], [/santander/, 'Banco Santander'], [/inacap/, 'INACAP'],
  [/\buai\b/, 'UAI'], [/berthelon/, 'Berthelon'], [/san sebast/, 'Universidad San Sebastián'],
  [/komatsu/, 'KOMATSU'], [/\bbhp\b/, 'BHP'], [/esval/, 'ESVAL'], [/cctval/, 'CCTVal'],
  [/\bmetro\b/, 'Metro'], [/el bosque/, 'Municipalidad El Bosque'],
];
const ACADEMICO = /universidad|ingenier|seminario|charla|mentor|tedx|clase|conversatorio|tesis|\bpace\b|open dea|estudiante|academ|diploma|\busm\b|\buai\b|inacap|san sebast/;
const INDUSTRIAL = /fabrica|scania|sacyr|\bruta\b|autopista|codelco|miner|komatsu|\bbhp\b|planta|obra|construc|energia|esval|\bmetro\b|dron.*(fuego|obra)/;

function deriveCliente(text) {
  for (const [re, name] of CLIENTES) if (re.test(text)) return name;
  return null;
}
function deriveTipo(text) {
  if (ACADEMICO.test(text)) return 'Academico';
  if (INDUSTRIAL.test(text)) return 'Industrial';
  return 'Corporativo';
}
function deriveTags(proyecto, lugar) {
  const stop = new Set(['de', 'la', 'el', 'los', 'las', 'del', 'y', 'en', 'a', 'con', 'para', 'un', 'una', '2016', '2017', '2018']);
  return [...new Set(norm(`${proyecto} ${lugar}`).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w)))].slice(0, 6);
}

function isGarbage(codigo, proyecto) {
  if (!proyecto || !proyecto.trim()) return true;
  if (/^-?\d{6,}[,.]\d/.test(proyecto.trim())) return true;              // coordenada GPS
  if (/^\d{4}-\d{2}-\d{2}[ t]\d{2}:\d{2}/i.test((codigo || '').trim())) return true; // timestamp Excel
  return false;
}

async function main() {
  console.log(`Leyendo Sheet: ${CSV_URL}`);
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Fetch falló: ${res.status} ${res.statusText}`);
  const rows = parseCsv(await res.text());
  const headers = rows[0];
  const col = columnIndex(headers);
  if (col.proyecto === -1) throw new Error(`No encontré la columna "Proyecto". Headers: ${headers.join(' | ')}`);

  const records = [];
  let garbage = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const get = (idx) => (idx >= 0 ? (r[idx] || '').trim() : '');
    const codigo = get(col.codigo);
    const proyecto = get(col.proyecto);
    if (isGarbage(codigo, proyecto)) { garbage++; continue; }

    const detalle = get(col.detalle);
    const detalleProyecto = get(col.detalleProyecto);
    const lugar = get(col.lugar);
    const blob = `${proyecto} ${detalleProyecto} ${detalle} ${lugar} ${get(col.datos)}`;
    const vimeoId = (blob.match(/vimeo\.com\/(?:manage\/videos\/)?(\d+)/) || [])[1] || null;
    const flickrUrl = (blob.match(/https?:\/\/(?:www\.)?flic(?:kr)?\.[^\s,]+/) || [])[0] || null;

    records.push({
      fecha: get(col.fecha),
      codigo: codigo.replace(/\s+/g, ''),
      proyecto,
      cliente: deriveCliente(norm(blob)),
      tipo: deriveTipo(norm(blob)),
      tags: deriveTags(proyecto, lugar),
      lugar,
      vimeoId,
      flickrUrl,
      starred: /[★*]\s*$/.test(proyecto),
      excluir: /material perdido|borrado/i.test(detalle),
      descripcion: detalleProyecto || proyecto,
    });
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(records, null, 1));

  const byTipo = records.reduce((a, r) => ((a[r.tipo] = (a[r.tipo] || 0) + 1), a), {});
  console.log(`\n✔ ${records.length} registros → ${OUT}`);
  console.log(`  Basura filtrada: ${garbage}`);
  console.log(`  Por tipo: ${JSON.stringify(byTipo)}`);
  console.log(`  Con Vimeo: ${records.filter((r) => r.vimeoId).length} · Destacados: ${records.filter((r) => r.starred).length} · Excluidos: ${records.filter((r) => r.excluir).length}`);
  console.log(`\nNota: derivación de cliente/tipo/tags es heurística (aprox. de la versión IA).`);
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
