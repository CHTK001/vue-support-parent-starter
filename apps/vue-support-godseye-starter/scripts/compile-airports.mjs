#!/usr/bin/env node
/**
 * Compile the airports dataset.
 *
 *   node scripts/compile-airports.mjs
 *
 * Writes data/airports.json, which /api/airports serves.
 *
 * SOURCE: OurAirports (https://ourairports.com/data/). Public domain — the
 * project's own data page states the database "is in the Public Domain". No
 * key, no attribution requirement, no redistribution restriction. That is rare
 * enough in this repo's experience to be worth stating plainly.
 *
 * WHY THIS LAYER EXISTS. Partly to show airports, but mostly because the flight
 * simulator had nowhere to aim. Landing needs to know where a runway is, which
 * way it points, how long it is and whether it is paved — none of which the
 * photorealistic tiles can tell you, because they are pictures.
 *
 * WHAT IS KEPT. The raw file is 86,003 rows and 12.7 MB, which is far too many
 * markers and far too many bytes for a browser. Kept:
 *
 *   - every large and medium airport (5,281 of them), always
 *   - small airports ONLY with a hard-surfaced runway of 3,000 ft or more,
 *     which is roughly the line between somewhere you could land something and
 *     a farm strip
 *   - closed airports, heliports, seaplane bases and balloonports: dropped.
 *     A closed airport on a map is a lie about where you can land.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(__dirname, '../data/airports.json');

const BASE = 'https://davidmegginson.github.io/ourairports-data';
const AIRPORTS_URL = `${BASE}/airports.csv`;
const RUNWAYS_URL = `${BASE}/runways.csv`;
const USER_AGENT = 'GodsEyeView/1.0 (https://github.com/uhrichsam4/gods-eye-view) compile-airports';

/** Types worth showing. Heliports and seaplane bases are not landable here. */
const KEEP_TYPES = new Set(['large_airport', 'medium_airport', 'small_airport']);
/** A small airport needs a hard runway at least this long to be included. */
const SMALL_AIRPORT_MIN_FT = 3000;
/** Surfaces that count as hard. OurAirports' surface field is free text. */
const HARD_SURFACE = /asp|con|pem|bit|tar|paved|concrete|asphalt/i;

/** Coordinate precision. 5 dp is about a metre — finer than a runway needs. */
const COORD_DP = 5;

/**
 * Parse a CSV line that may contain quoted fields with commas.
 *
 * Hand-rolled rather than pulling in a dependency: the format here is simple
 * and stable, and a compile script should not add a runtime dependency to the
 * project for one file.
 *
 * @param {string} line
 * @returns {Array<string>}
 */
function parseCsvLine(line) {
  const out = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i += 1; } else { quoted = false; }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      out.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

/**
 * @param {string} text
 * @returns {Array<object>}
 */
function parseCsv(text) {
  const lines = text.split('\n');
  const header = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    if (!lines[i].trim()) continue;
    const cells = parseCsvLine(lines[i]);
    const row = {};
    for (let c = 0; c < header.length; c += 1) row[header[c]] = cells[c] ?? '';
    rows.push(row);
  }
  return rows;
}

/**
 * @param {string} url
 * @returns {Promise<string>}
 */
async function getText(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return response.text();
}

/**
 * 将字符串解析为有限数值。
 * @param {string} v
 * @returns {number|null}
 */
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  process.stdout.write('Fetching airports…');
  const airports = parseCsv(await getText(AIRPORTS_URL));
  process.stdout.write(` ${airports.length} rows\n`);

  process.stdout.write('Fetching runways…');
  const runways = parseCsv(await getText(RUNWAYS_URL));
  process.stdout.write(` ${runways.length} rows\n`);

  /** @type {Map<string, Array<object>>} */
  const runwaysByAirport = new Map();
  for (const r of runways) {
    if (r.closed === '1') continue;
    const lengthFt = num(r.length_ft);
    if (!lengthFt) continue;
    const list = runwaysByAirport.get(r.airport_ref) || [];
    list.push({
      // Identifier pair, e.g. "09/27".
      ident: [r.le_ident, r.he_ident].filter(Boolean).join('/'),
      lengthFt,
      widthFt: num(r.width_ft),
      surface: (r.surface || '').trim(),
      hard: HARD_SURFACE.test(r.surface || ''),
      lit: r.lighted === '1',
      // True heading of the low-numbered end. The flight sim needs this to line
      // an approach up; without it a runway is just a rectangle.
      headingDeg: num(r.le_heading_degT),
      // Threshold coordinates, where they exist — the point to actually aim at.
      leLat: num(r.le_latitude_deg),
      leLon: num(r.le_longitude_deg),
      heLat: num(r.he_latitude_deg),
      heLon: num(r.he_longitude_deg),
    });
    runwaysByAirport.set(r.airport_ref, list);
  }

  const kept = [];
  const dropped = { type: 0, closed: 0, noCoords: 0, tooSmall: 0 };
  for (const a of airports) {
    if (a.type === 'closed') { dropped.closed += 1; continue; }
    if (!KEEP_TYPES.has(a.type)) { dropped.type += 1; continue; }
    const lat = num(a.latitude_deg);
    const lon = num(a.longitude_deg);
    if (lat === null || lon === null) { dropped.noCoords += 1; continue; }

    const rws = (runwaysByAirport.get(a.id) || []).sort((x, y) => y.lengthFt - x.lengthFt);
    const longest = rws[0]?.lengthFt || 0;
    const hasHard = rws.some((r) => r.hard);

    if (a.type === 'small_airport' && !(hasHard && longest >= SMALL_AIRPORT_MIN_FT)) {
      dropped.tooSmall += 1;
      continue;
    }

    kept.push({
      id: a.ident,
      name: a.name,
      type: a.type.replace('_airport', ''),
      // ICAO/IATA where known: what a pilot would actually say.
      icao: a.gps_code || a.ident || '',
      iata: a.iata_code || '',
      lat: Number(lat.toFixed(COORD_DP)),
      lon: Number(lon.toFixed(COORD_DP)),
      elevationFt: num(a.elevation_ft),
      country: a.iso_country || '',
      municipality: a.municipality || '',
      longestFt: longest,
      // Only the three longest runways: an airport with a dozen taxiway-like
      // strips adds bytes without adding anywhere to land.
      runways: rws.slice(0, 3),
    });
  }

  kept.sort((a, b) => b.longestFt - a.longestFt);

  const byType = kept.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  const payload = {
    _comment: 'Compiled by scripts/compile-airports.mjs from OurAirports (public domain).',
    generated: new Date().toISOString().slice(0, 10),
    source: {
      name: 'OurAirports',
      url: 'https://ourairports.com/data/',
      licence: 'Public domain',
      redistributable: true,
    },
    coverageNote:
      `${kept.length} airports with runway data. Every large and medium airport, plus small `
      + `airports with a hard runway of at least ${SMALL_AIRPORT_MIN_FT} ft. Heliports, `
      + 'seaplane bases and closed fields are excluded — a closed airport on a map is a lie '
      + 'about where you can land. Runway headings are TRUE, not magnetic.',
    stats: { airports: kept.length, byType, dropped },
    airports: kept,
  };

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(payload)}\n`, 'utf8');
  const sizeKb = Math.round(fs.statSync(OUT_PATH).size / 1024);
  process.stdout.write(
    `\nWrote ${OUT_PATH}\n`
    + `  kept            ${kept.length}\n`
    + `    large         ${byType.large || 0}\n`
    + `    medium        ${byType.medium || 0}\n`
    + `    small         ${byType.small || 0}\n`
    + `  dropped type    ${dropped.type}\n`
    + `  dropped closed  ${dropped.closed}\n`
    + `  dropped small   ${dropped.tooSmall}\n`
    + `  file size       ${sizeKb} kB\n`
  );
}

main().catch((error) => {
  process.stderr.write(`compile-airports failed: ${error?.message || error}\n`);
  process.exitCode = 1;
});
