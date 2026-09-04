#!/usr/bin/env node
/**
 * Compile the world safety dataset.
 *
 *   node scripts/compile-safety.mjs
 *
 * Writes data/safety.json, which /api/safety serves.
 *
 * WHAT THIS MEASURES: intentional homicide per 100,000 people, per country.
 *
 * That is a deliberate choice and worth defending. "How dangerous is this
 * place" has no single number, and most candidates are worse:
 *
 *   - Total crime counts reward small countries and punish large ones.
 *   - Composite "safety indices" (Numbeo and similar) are built from unweighted
 *     visitor surveys, are proprietary, and cannot be redistributed.
 *   - Theft and robbery rates track REPORTING as much as offending: a country
 *     where people trust the police enough to file a report scores worse than
 *     one where nobody bothers.
 *
 * Homicide is the least distorted of the available measures. A body is hard to
 * not record, so it survives differences in reporting culture better than any
 * other crime statistic, which is exactly why the UN uses it as its headline
 * indicator. It is still a proxy, not a verdict, and the layer says so.
 *
 * HUMAN-CAUSED ONLY, as requested: this counts people killed by other people.
 * Earthquakes, storms, floods and disease are not in it.
 *
 * SOURCES
 *   World Bank indicator VC.IHR.PSRC.P5, sourced from the UN Office on Drugs
 *   and Crime. Licence CC BY 4.0.
 *   Natural Earth 1:110m admin-0 country polygons. Public domain.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(__dirname, '../data/safety.json');

const WB_URL = 'https://api.worldbank.org/v2/country/all/indicator/VC.IHR.PSRC.P5'
  + '?format=json&per_page=400&mrnev=1';
/** Pinned to the same Natural Earth commit the physical-regions pack uses. */
const NE_COMMIT = 'ca96624a56bd078437bca8184e78163e5039ad19';
const NE_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NE_COMMIT}`
  + '/geojson/ne_110m_admin_0_countries.geojson';

const USER_AGENT = 'GodsEyeView/1.0 (https://github.com/uhrichsam4/gods-eye-view) compile-safety';

/**
 * Coordinate precision, in decimal places.
 *
 * Two places is roughly a kilometre, which is far finer than a country-level
 * choropleth can express. It exists to keep the payload small: the raw 110m
 * file is 839 kB and every byte of that ships to the browser.
 */
const COORD_DP = 2;

/**
 * Round a ring and drop points that collapse onto their neighbour.
 *
 * Rounding alone leaves long runs of identical coordinates along smooth
 * coastlines, which cost bytes and draw nothing.
 *
 * @param {Array<Array<number>>} ring
 * @returns {Array<Array<number>>}
 */
function simplifyRing(ring) {
  const out = [];
  let prevLon = null;
  let prevLat = null;
  for (const point of ring) {
    const lon = Number(point[0].toFixed(COORD_DP));
    const lat = Number(point[1].toFixed(COORD_DP));
    if (lon === prevLon && lat === prevLat) continue;
    out.push([lon, lat]);
    prevLon = lon;
    prevLat = lat;
  }
  // A ring needs at least a triangle plus its closing point to be drawable.
  if (out.length < 4) return null;
  // Rounding can unseal a ring; close it again.
  const [fLon, fLat] = out[0];
  const [lLon, lLat] = out[out.length - 1];
  if (fLon !== lLon || fLat !== lLat) out.push([fLon, fLat]);
  return out;
}

/**
 * Outer rings only, simplified.
 *
 * Holes are dropped: at country scale an enclave is a few pixels, and keeping
 * them roughly doubles the vertex count for something invisible.
 *
 * @param {object} geometry
 * @returns {Array<Array<Array<number>>>}
 */
function simplifyGeometry(geometry) {
  if (!geometry) return [];
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon' ? geometry.coordinates
      : [];
  const out = [];
  for (const polygon of polygons) {
    const ring = simplifyRing(polygon[0] || []);
    if (ring) out.push(ring);
  }
  return out;
}

/**
 * @param {string} url
 * @returns {Promise<object>}
 */
async function getJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return response.json();
}

async function main() {
  process.stdout.write('Fetching World Bank homicide rates…');
  const wb = await getJson(WB_URL);
  const rows = Array.isArray(wb) && Array.isArray(wb[1]) ? wb[1] : [];
  /** @type {Map<string, {rate: number, year: string, name: string}>} */
  const byIso3 = new Map();
  for (const row of rows) {
    const iso3 = row?.countryiso3code;
    const value = Number(row?.value);
    if (!iso3 || !Number.isFinite(value)) continue;
    byIso3.set(iso3, { rate: value, year: String(row.date || ''), name: row.country?.value || '' });
  }
  process.stdout.write(` ${byIso3.size} countries with a rate\n`);

  process.stdout.write('Fetching Natural Earth country polygons…');
  const ne = await getJson(NE_URL);
  const features = Array.isArray(ne?.features) ? ne.features : [];
  process.stdout.write(` ${features.length} polygons\n`);

  const countries = [];
  const missing = [];
  for (const feature of features) {
    const props = feature.properties || {};
    // ISO_A3 is "-99" for disputed and some dependent territories; ADM0_A3 is
    // populated for all of them and is what actually joins to the World Bank.
    const iso3 = (props.ISO_A3 && props.ISO_A3 !== '-99') ? props.ISO_A3 : props.ADM0_A3;
    const name = props.NAME_LONG || props.NAME || iso3;
    const stat = byIso3.get(iso3);
    if (!stat) {
      missing.push(name);
      continue;
    }
    const rings = simplifyGeometry(feature.geometry);
    if (!rings.length) continue;
    countries.push({
      iso3,
      name,
      rate: Number(stat.rate.toFixed(2)),
      year: stat.year,
      rings,
    });
  }

  const rates = countries.map((c) => c.rate).sort((a, b) => a - b);
  const median = rates.length ? rates[Math.floor(rates.length / 2)] : 0;

  const payload = {
    _comment: 'Compiled by scripts/compile-safety.mjs. Intentional homicide per 100k, per country.',
    generated: new Date().toISOString().slice(0, 10),
    measure: 'Intentional homicides per 100,000 people',
    coverageNote:
      `${countries.length} countries. Intentional homicide per 100,000 people, the UN's headline `
      + 'safety indicator. Homicide is used because it survives differences in reporting culture '
      + 'better than theft or assault, which track how willing people are to report a crime as '
      + 'much as how often one happens. This is a country-wide average and says nothing about any '
      + 'particular street: safe and dangerous neighbourhoods exist inside every country here. '
      + 'Human-caused only — natural disasters and disease are not counted.',
    sources: [
      {
        name: 'World Bank / UNODC',
        indicator: 'VC.IHR.PSRC.P5',
        url: 'https://data.worldbank.org/indicator/VC.IHR.PSRC.P5',
        licence: 'CC BY 4.0',
        redistributable: true,
      },
      {
        name: 'Natural Earth 1:110m admin-0 countries',
        url: 'https://www.naturalearthdata.com/',
        licence: 'Public domain',
        redistributable: true,
      },
    ],
    stats: {
      countries: countries.length,
      medianRate: median,
      withoutData: missing.length,
    },
    countries,
  };

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(payload)}\n`, 'utf8');
  const sizeKb = Math.round(fs.statSync(OUT_PATH).size / 1024);
  process.stdout.write(
    `\nWrote ${OUT_PATH}\n`
    + `  countries        ${countries.length}\n`
    + `  no rate          ${missing.length}\n`
    + `  median rate      ${median} per 100k\n`
    + `  file size        ${sizeKb} kB\n`
  );
}

main().catch((error) => {
  process.stderr.write(`compile-safety failed: ${error?.message || error}\n`);
  process.exitCode = 1;
});
