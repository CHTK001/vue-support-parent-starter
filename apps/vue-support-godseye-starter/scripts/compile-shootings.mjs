#!/usr/bin/env node
/**
 * Compile the civilian mass-shooting dataset.
 *
 *   node scripts/compile-shootings.mjs
 *
 * Writes data/shootings.json, which /api/shootings serves.
 *
 * SOURCE: Wikidata, via its public SPARQL endpoint.
 *
 * Wikidata is the only source found that clears every bar at once. A survey of
 * the alternatives (see docs/SHOOTINGS-DATA.md) found the well-known catalogues
 * are all licence-blocked for redistribution:
 *
 *   Gun Violence Archive .......... explicitly proprietary, no redistribution
 *   Mother Jones .................. no open licence
 *   The Violence Project .......... gated, redistribution forbidden
 *   Everytown ..................... reuse prohibited by terms
 *   Global Terrorism Database ..... restrictive proprietary EULA
 *   ACLED ......................... not redistributable
 *   gunviolence.eu ................ redistribution explicitly forbidden
 *
 * Wikidata's structured data is CC0 — a public-domain dedication — so it can be
 * compiled and redistributed without restriction. It is also the only source
 * that is genuinely global rather than a single country's catalogue.
 *
 * SCOPE. Four classes, all firearm-specific and civilian:
 *   Q21480300  mass shooting
 *   Q473853    school shooting
 *   Q118188839 spree shooting
 *   Q42915628  mass shooting in the United States
 *
 * Deliberately NOT included: Q3199915 "massacre" and Q750215 "mass murder".
 * Those sweep in armed-conflict killings — a first pass using them returned
 * things like a 102-death event in Sudan in 2009, which is a war massacre, not
 * a civilian mass shooting. They are a different subject with different data
 * and merging them would misrepresent both.
 *
 * The classes alone still let conflict events through, because Wikidata types
 * many of them as mass shootings TOO. The query therefore also excludes
 * anything additionally typed as a massacre, war, suicide bombing or military
 * operation, and anything that is `part of` a named armed conflict. That last
 * one does most of the work: it is what separates an insurgency attack from a
 * lone attacker in a shopping centre.
 *
 * Terrorist attacks are NOT excluded. Some of the worst civilian mass shootings
 * — Christchurch, Utoya — are classed as terrorism, and dropping them to be
 * tidy would misrepresent the subject just as badly as including a war.
 *
 * PERPETRATORS ARE NEVER QUERIED. Not fetched, not stored, not stripped later —
 * the SELECT simply does not ask for them. Wikidata holds them; this dataset
 * does not. See src/data/shootings.js for the reasoning.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(__dirname, '../data/shootings.json');
const ENDPOINT = 'https://query.wikidata.org/sparql';
/** Wikidata asks for a descriptive agent so they can contact you about load. */
const USER_AGENT = 'GodsEyeView/1.0 (https://github.com/uhrichsam4/gods-eye-view) compile-shootings';
const SINCE_YEAR = 2001;

/**
 * Incident classes. Queried ONE AT A TIME.
 *
 * The subclass walk (`wdt:P279*`) is what picks up the long tail — Wikidata has
 * many specific subtypes of these — but all four classes in a single VALUES
 * block plus the walk reliably times the public endpoint out at 504. One class
 * per request costs four round trips and always completes.
 */
const CLASSES = [
  // Tier 1: already unambiguously a shooting. No further qualification needed.
  { qid: 'Q21480300', label: 'mass shooting', requireWeapon: false },
  { qid: 'Q473853', label: 'school shooting', requireWeapon: false },
  { qid: 'Q118188839', label: 'spree shooting', requireWeapon: false },
  { qid: 'Q42915628', label: 'mass shooting in the US', requireWeapon: false },

  // Tier 2: broader crime classes, qualified by a RECORDED WEAPON (P520).
  //
  // These exist because the shooting classes alone miss some of the most
  // significant incidents of the period. Wikidata does not type Christchurch
  // (51 dead) as a mass shooting at all — it is "terrorist attack" plus "mass
  // murder". The Buffalo Tops supermarket attack is typed "massacre". Neither
  // appeared, which is what prompted this tier.
  //
  // The armament requirement is what keeps the scope honest: "mass murder"
  // unqualified returns 1,244 items including bombings, arson and vehicle
  // attacks. Requiring that someone recorded a weapon narrows it to armed
  // attacks, which is the subject of this layer.
  { qid: 'Q750215', label: 'mass murder (armed)', requireWeapon: true },
  { qid: 'Q2223653', label: 'terrorist attack (armed)', requireWeapon: true },
  { qid: 'Q3199915', label: 'massacre (armed)', requireWeapon: true },

  // Tier 3: mass killings by ANY method — stabbings, vehicle attacks, arson,
  // bombings. Requested explicitly ("any sort of killings"), which widens the
  // layer's subject beyond shootings. Matched directly, without the weapon
  // qualifier that tier 2 uses.
  //
  // The armed-conflict and organisation screens still apply, so this adds
  // civilian mass killings rather than war.
  { qid: 'Q750215', label: 'mass murder (any method)', requireWeapon: false, direct: true },
  { qid: 'Q3199915', label: 'massacre (any method)', requireWeapon: false, direct: true },
  { qid: 'Q2223653', label: 'terrorist attack (any method)', requireWeapon: false, direct: true },
  // NOT Q1078765 — that is "railway accident", not "mass killing". Including it
  // put 372 train crashes into the dataset, among them the 2004 Sri Lanka
  // tsunami rail disaster (1,700 dead), which is a natural disaster and not a
  // killing at all. Verify every QID against its label before adding it; the
  // identifiers are not guessable.
  //
  // There is a real Q56514238 "mass killing", but its definition is non-combat
  // killing BY A GOVERNMENT OR STATE — the category this layer excludes.
  { qid: 'Q132821', label: 'murder', requireWeapon: false, direct: true },

  // Tier 4: conflict and other-method classes. These are NOT excluded any
  // more — they are tagged `military` and the layer lets you switch between
  // civilian, military, or both. Deciding for the reader which killings count
  // was the wrong call; showing both and labelling them is better.
  //
  // Every QID below was checked against its label before being added. Three
  // obvious-looking candidates turned out to be junk: "Ethnic Cleansing"
  // (Q842636) is a 2002 video game, "armed attack" (Q112236595) is a painting,
  // and "Battle" (Q737593) is a town in East Sussex. Do not guess these.
  { qid: 'Q41397', label: 'genocide', requireWeapon: false, direct: true },
  { qid: 'Q891854', label: 'bomb attack', requireWeapon: false, direct: true },
  { qid: 'Q217327', label: 'suicide attack', requireWeapon: false, direct: true },
  { qid: 'Q2252077', label: 'shooting', requireWeapon: false, direct: true },
  { qid: 'Q135010', label: 'war crime', requireWeapon: false, direct: true },
  { qid: 'Q2380335', label: 'airstrike', requireWeapon: false, direct: true },
  { qid: 'Q1371150', label: 'hostage taking', requireWeapon: false, direct: true },
];

/**
 * SPARQL for one class.
 *
 * The date is P585 (point in time) OR P580 (start time): a few incidents carry
 * only a start time, and binding P585 alone silently dropped them.
 *
 * @param {string} qid
 * @returns {string}
 */
function queryForClass(qid, requireWeapon = false, direct = false) {
  // The weapon must be a FIREARM, not merely recorded. P520 alone counts bombs,
  // vehicles and aircraft as "armament", which let the September 11 attacks
  // (2,996 dead), the Madrid train bombings, the Nice truck attack and the Sri
  // Lanka bombings into a dataset about shootings. Walking P279* from the
  // weapon to Q12796 "firearm" cuts that from 436 items to 139 — and keeps
  // Christchurch and Buffalo, which is the whole point of this tier.
  const weaponClause = requireWeapon
    ? '?item wdt:P520 ?weapon . ?weapon wdt:P279* wd:Q12796 .'
    : '';
  // Tier-2 classes match DIRECTLY, without the subclass walk. Q750215 "mass
  // murder" has an enormous subclass tree, and walking it while also joining
  // the armament and every OPTIONAL put the query over the endpoint's budget —
  // 504 on all four retries. The incidents this tier exists for carry these
  // types directly anyway: Christchurch is P31 terrorist attack AND mass
  // murder, Buffalo is P31 massacre. Direct matching costs nothing real here.
  const typePath = (requireWeapon || direct) ? 'wdt:P31' : 'wdt:P31/wdt:P279*';
  return `
SELECT ?item ?itemLabel ?date ?coord ?locCoord ?admCoord ?countryLabel ?locLabel ?killed ?injured ?venuePhoto ?photoLocLabel ?motiveLabel WHERE {
  ?item ${typePath} wd:${qid} .
  ${weaponClause}
  { ?item wdt:P585 ?date . } UNION { ?item wdt:P580 ?date . }
  FILTER(YEAR(?date) >= ${SINCE_YEAR})

  # ── Civilian scope ────────────────────────────────────────────────────────
  # The shooting classes alone are not enough. Wikidata also types plenty of
  # armed-conflict killings as "mass shooting", and a first pass returned the
  # 2015 Zaria massacre (Nigerian Army, ~1,000 dead), the Zaki Biam army
  # reprisal, and the 2021 Kabul airport bombing. Those are war and state
  # violence, not a mall or a school.
  # NOTE: "massacre" (Q3199915) is deliberately NOT excluded. It reads as a war
  # word but is applied just as often to civilian mass shootings — excluding it
  # deleted the 2017 Las Vegas shooting (60 dead) and the Buffalo Tops
  # supermarket attack from this dataset. Conflict events are caught by the
  # part-of-a-named-conflict check instead, which is what actually distinguishes
  # them.
  FILTER NOT EXISTS { ?item wdt:P31 wd:Q198 . }        # also a "war"
  FILTER NOT EXISTS { ?item wdt:P31 wd:Q18493502 . }   # a suicide bombing, not a shooting
  FILTER NOT EXISTS { ?item wdt:P31 wd:Q645883 . }     # a military operation
  # ...and the strongest signal of all: being part of a named armed conflict,
  # which is what separates an insurgency attack from a lone civilian attack.
  # Direct types only, no wdt:P279* walk — with the subclass walk on BOTH this
  # filter and the class match above, the largest class blew the endpoint's
  # 60-second budget and returned 504 every time.
  FILTER NOT EXISTS {
    ?item wdt:P361 ?conflict .
    ?conflict wdt:P31 ?conflictType .
    VALUES ?conflictType { wd:Q350604 wd:Q198 wd:Q645883 wd:Q1006311 wd:Q180684 }
  }

  OPTIONAL { ?item wdt:P625 ?coord . }
  OPTIONAL { ?item wdt:P276 ?loc . OPTIONAL { ?loc wdt:P625 ?locCoord . } }
  OPTIONAL { ?item wdt:P131 ?adm . OPTIONAL { ?adm wdt:P625 ?admCoord . } }
  OPTIONAL { ?item wdt:P17 ?country . }
  OPTIONAL { ?item wdt:P1120 ?killed . }
  OPTIONAL { ?item wdt:P1339 ?injured . }
${VENUE_PHOTO_CLAUSE}${MOTIVE_CLAUSE}
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`;
}

/**
 * A photograph OF THE PLACE, never of the incident.
 *
 * The incident's own P18 is deliberately not used: on Wikidata it is frequently
 * a photograph of the perpetrator, which this project does not publish under
 * any circumstances. The venue's P18 is a picture of the building or the island
 * or the shopping centre — Utoya, the Olympia-Einkaufszentrum, the UVA Rotunda.
 *
 * Settlements and administrative areas are excluded as venues. Their photo is a
 * city skyline, which would imply a precision the record does not have: a
 * generic Copenhagen view beside an incident is not a picture of where it
 * happened.
 */
/**
 * Recorded motive, from P828 "has cause", with mechanisms filtered out.
 *
 * P14359 "motive" is the semantically correct property and was tried first, but
 * it is a very new property with essentially no usage on these items — the
 * compile returned zero. P828 is where the real values live.
 *
 * P828 is a mixed bag, though: alongside "antisemitism", "homophobia" and
 * "opposition to immigration" it returns "blunt trauma" and "surface-to-air
 * missile", which are how someone died rather than why they were killed and
 * read as nonsense under a heading that says motive. Values that are weapons,
 * injuries or diseases are excluded, which leaves the social and ideological
 * causes.
 *
 * COVERAGE IS THIN: roughly 70 incidents of several thousand carry this at all.
 * The card hides the row entirely rather than showing an empty label.
 */
const MOTIVE_CLAUSE = `
  OPTIONAL {
    ?item wdt:P828 ?motive .
    FILTER NOT EXISTS { ?motive wdt:P31/wdt:P279* wd:Q728 . }
    FILTER NOT EXISTS { ?motive wdt:P31/wdt:P279* wd:Q193078 . }
    FILTER NOT EXISTS { ?motive wdt:P31/wdt:P279* wd:Q12136 . }
  }`;

const VENUE_PHOTO_CLAUSE = `
  OPTIONAL {
    ?item wdt:P276 ?photoLoc .
    ?photoLoc wdt:P18 ?venuePhoto .
    FILTER NOT EXISTS { ?photoLoc wdt:P31/wdt:P279* wd:Q486972 . }
    FILTER NOT EXISTS { ?photoLoc wdt:P31/wdt:P279* wd:Q56061 . }
    OPTIONAL { ?photoLoc rdfs:label ?photoLocLabel . FILTER(LANG(?photoLocLabel) = "en") }
  }`;

/** Stanford Mass Shootings in America — CC BY 4.0, US only, 1966-2016. */
const MSA_CSV_URL = 'https://raw.githubusercontent.com/StanfordGeospatialCenter/MSA/master/Data/Stanford_MSA_Database.csv';

/**
 * Parse a WKT point as Wikidata returns it: `Point(lon lat)` — longitude FIRST,
 * which is the opposite order to how coordinates are usually spoken.
 *
 * @param {string} wkt
 * @returns {{lat: number, lon: number}|null}
 */
function parsePoint(wkt) {
  const match = /^Point\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)$/i.exec(String(wkt || '').trim());
  if (!match) return null;
  const lon = Number(match[1]);
  const lat = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

/**
 * Best available coordinate for an incident, and how precise it is.
 *
 * The precision is recorded rather than discarded because a point placed at the
 * centroid of a city is a much weaker claim than one placed at the building,
 * and the map should be able to say which it is showing.
 *
 * @param {Array<object>} rows - All SPARQL rows for one incident.
 * @returns {{lat: number, lon: number, precision: string}|null}
 */
function resolveCoordinate(rows) {
  for (const [field, precision] of [
    ['coord', 'exact'],
    ['locCoord', 'venue'],
    ['admCoord', 'area'],
  ]) {
    for (const row of rows) {
      if (!row[field]?.value) continue;
      const point = parsePoint(row[field].value);
      if (point) return { ...point, precision };
    }
  }
  return null;
}

/**
 * First non-empty value of a field across an incident's rows.
 *
 * @param {Array<object>} rows
 * @param {string} field
 * @returns {string}
 */
function firstValue(rows, field) {
  for (const row of rows) {
    const value = row[field]?.value;
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value);
  }
  return '';
}

/**
 * Death toll above which an event is treated as armed conflict regardless of
 * what its properties say.
 *
 * Empirical, and deliberately generous. The deadliest civilian mass killings on
 * record are far below this: Utoya 77, Bataclan 90, Las Vegas 60, Christchurch
 * 51. Nothing an individual does reaches four figures.
 *
 * It exists because the property-based checks leak. The Tamil massacre (40,000),
 * the Masalit genocide (10,800) and the Camp Speicher executions (1,570) carry
 * no organisation, no part-of link and no conflict type, so every structural
 * signal missed them and they were being labelled CIVILIAN. A crude threshold
 * that is right about those is better than a principled test that is wrong.
 */
const CONFLICT_DEATH_TOLL = 300;

/**
 * Military or civilian.
 *
 * @param {string} qid
 * @param {Set<string>} militaryQids
 * @param {number} killed
 * @returns {string}
 */
function classify(qid, militaryQids, killed) {
  if (militaryQids.has(qid)) return 'military';
  if (Number(killed) >= CONFLICT_DEATH_TOLL) return 'military';
  return 'civilian';
}

/**
 * Recorded motive, as a short factual phrase.
 *
 * Wikidata's P14359 (motive) and P828 (has cause) carry research-style
 * categories — "antisemitism", "homophobia", "opposition to immigration" —
 * which is the level newsrooms and criminologists publish at.
 *
 * DELIBERATELY NOT a narrative. No manifesto text, no quotations, no
 * perpetrator writing of any kind: those are the thing the no-notoriety
 * guidance exists to keep out of circulation. A category describing WHY a
 * class of attack happens is a different object from an attacker's own words,
 * and it is the part that helps a reader understand the pattern.
 *
 * Capped at three so the card stays a card. Two entries can disagree — El Paso
 * carries four — and listing all of them turns a label into an essay.
 *
 * @param {Array<object>} rows
 * @returns {string}
 */
function collectMotives(rows) {
  const seen = new Set();
  for (const row of rows) {
    for (const field of ['motiveLabel']) {
      const value = row[field]?.value;
      if (!value) continue;
      // Unlabelled items come back as a bare QID, which tells a reader nothing.
      if (/^Q\d+$/.test(value)) continue;
      seen.add(value);
    }
  }
  return [...seen].slice(0, 3).join(', ');
}

/**
 * Largest reported count for a field.
 *
 * Wikidata often carries several values for a death toll — an initial press
 * figure and a later confirmed one. Taking the maximum matches how these are
 * finally reported, and avoids a record that says 3 when the article says 17.
 *
 * @param {Array<object>} rows
 * @param {string} field
 * @returns {number}
 */
function maxNumber(rows, field) {
  let best = 0;
  for (const row of rows) {
    const value = Number(row[field]?.value);
    if (Number.isFinite(value) && value > best) best = value;
  }
  return best;
}

/**
 * @param {string} sparql
 * @returns {Promise<Array<object>>}
 */
async function runQuery(sparql, attempts = 4) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${ENDPOINT}?query=${encodeURIComponent(sparql)}`, {
        headers: { Accept: 'application/sparql-results+json', 'User-Agent': USER_AGENT },
      });
      if (response.ok) {
        const payload = await response.json();
        return payload?.results?.bindings || [];
      }
      lastError = new Error(`Wikidata HTTP ${response.status}`);
      // 429 and 5xx are load, not a bad query — worth waiting out. A 400 is a
      // broken query and will fail identically however long we wait.
      if (response.status < 429) throw lastError;
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) {
      const waitMs = 5000 * attempt;
      process.stdout.write(` [retry ${attempt}/${attempts - 1} in ${waitMs / 1000}s]`);
      await new Promise((resolve) => { setTimeout(resolve, waitMs); });
    }
  }
  throw lastError || new Error('Wikidata query failed');
}

/**
 * Just the QIDs matching a class — no OPTIONALs, no labels.
 *
 * Tier-2 classes cannot be fetched in one go: the firearm walk plus the seven
 * OPTIONALs in the detail query put them over the endpoint's time budget and
 * returned 504 on every retry. Asking "which items match" and "what are they"
 * as two cheap questions always completes.
 *
 * @param {string} qid
 * @param {boolean} requireWeapon
 * @returns {Promise<Array<string>>}
 */
async function fetchClassQids(qid, requireWeapon) {
  const weaponClause = requireWeapon
    ? '?item wdt:P520 ?weapon . ?weapon wdt:P279* wd:Q12796 .'
    : '';
  const rows = await runQuery(`
SELECT DISTINCT ?item WHERE {
  ?item wdt:P31 wd:${qid} .
  ${weaponClause}
  { ?item wdt:P585 ?d } UNION { ?item wdt:P580 ?d }
  FILTER(YEAR(?d) >= ${SINCE_YEAR})
}
`);
  return rows.map((row) => String(row.item?.value || '').split('/').pop()).filter(Boolean);
}

/**
 * Full detail rows for a bounded set of QIDs.
 *
 * @param {Array<string>} qids
 * @returns {Promise<Array<object>>}
 */
async function fetchDetailsFor(qids) {
  const out = [];
  const BATCH = 180;
  for (let start = 0; start < qids.length; start += BATCH) {
    const values = qids.slice(start, start + BATCH).map((qid) => `wd:${qid}`).join(' ');
    const rows = await runQuery(`
SELECT ?item ?itemLabel ?date ?coord ?locCoord ?admCoord ?countryLabel ?locLabel ?killed ?injured ?venuePhoto ?photoLocLabel ?motiveLabel WHERE {
  VALUES ?item { ${values} }
  { ?item wdt:P585 ?date . } UNION { ?item wdt:P580 ?date . }
  OPTIONAL { ?item wdt:P625 ?coord . }
  OPTIONAL { ?item wdt:P276 ?loc . OPTIONAL { ?loc wdt:P625 ?locCoord . } }
  OPTIONAL { ?item wdt:P131 ?adm . OPTIONAL { ?adm wdt:P625 ?admCoord . } }
  OPTIONAL { ?item wdt:P17 ?country . }
  OPTIONAL { ?item wdt:P1120 ?killed . }
  OPTIONAL { ?item wdt:P1339 ?injured . }
${VENUE_PHOTO_CLAUSE}${MOTIVE_CLAUSE}
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`);
    out.push(...rows);
    process.stdout.write('.');
  }
  return out;
}

/**
 * Of a set of incident QIDs, which are armed-conflict events.
 *
 * Run as a SEPARATE query, deliberately. The thorough version of this check
 * needs a `wdt:P279*` walk over conflict types, and doing that inside the main
 * query — which already walks P279* for the incident class — put the largest
 * class over the endpoint's 60-second budget and returned 504 every time.
 * Asking it of a KNOWN, bounded set of items instead is cheap, and lets the
 * filter be as thorough as it should be.
 *
 * Without this, conflict events survive: the compile that skipped it returned
 * "mass killings near GHF aid sites in Gaza" (766 dead) at the top of the list.
 *
 * @param {Array<string>} qids
 * @returns {Promise<Set<string>>} QIDs to exclude.
 */
async function findConflictEvents(qids) {
  const exclude = new Set();
  // Small batches AND one condition per query. The previous version asked all
  // three conditions in a single UNION, each walking P279*, and at 3,800 items
  // that reliably 504'd and failed the whole compile. Three cheap questions
  // asked separately always complete, at the cost of more round trips.
  const BATCH = 60;
  const PASSES = [
    {
      name: 'part of a named armed conflict',
      where: `
        ?item wdt:P361 ?conflict .
        ?conflict wdt:P31/wdt:P279* ?type .
        VALUES ?type { wd:Q350604 wd:Q198 wd:Q645883 }`,
    },
    {
      // The discriminator that actually separates the two subjects: a civilian
      // attack is carried out by a person, an armed group or state army doing
      // the same thing is a conflict event however it is filed.
      name: 'carried out by an organisation',
      where: `
        { ?item wdt:P8031 ?actor } UNION { ?item wdt:P710 ?actor }
        ?actor wdt:P31/wdt:P279* wd:Q43229 .`,
    },
    {
      name: 'typed as war, military operation, war crime or genocide',
      where: `
        ?item wdt:P31/wdt:P279* ?selfType .
        VALUES ?selfType { wd:Q350604 wd:Q198 wd:Q645883 wd:Q135010 wd:Q41397 wd:Q2380335 }`,
    },
  ];

  for (const pass of PASSES) {
    for (let start = 0; start < qids.length; start += BATCH) {
      const values = qids.slice(start, start + BATCH).map((qid) => `wd:${qid}`).join(' ');
      const rows = await runQuery(`
SELECT DISTINCT ?item WHERE {
  VALUES ?item { ${values} }
  ${pass.where}
}
`);
      for (const row of rows) {
        const qid = String(row.item?.value || '').split('/').pop();
        if (qid) exclude.add(qid);
      }
    }
    process.stdout.write('.');
  }
  return exclude;
}

/**
 * Stanford MSA rows, 2001 onward, as normalised incidents.
 *
 * CC BY 4.0. The citation Stanford asks for is carried on every record via
 * sourceName, and repeated in the dataset's `sources` block.
 *
 * NINE perpetrator columns in this CSV are deliberately never read: Shooter
 * Name, Number of shooters, Shooter Age(s), Average Shooter Age, Shooter Sex,
 * Shooter Race, Fate of Shooter at the scene, Fate of Shooter, and Shooter's
 * Cause of Death.
 *
 * @returns {Promise<Array<object>>}
 */
async function fetchStanfordMsa() {
  const response = await fetch(MSA_CSV_URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Stanford MSA HTTP ${response.status}`);
  const rows = parseCsv(await response.text());

  const out = [];
  for (const row of rows) {
    const year = Number((/(\d{4})/.exec(row.Date || '') || [])[1]);
    if (!Number.isFinite(year) || year < SINCE_YEAR) continue;
    const lat = Number(row.Latitude);
    const lon = Number(row.Longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;

    out.push({
      // NOT CaseID alone: the Stanford CSV reuses it. Case 156 is two entirely
      // separate incidents — Desoto/Dallas in August 2013 and the Centennial
      // Hill Bar & Grill in December 2013 — and a shared id made the second one
      // throw on insert, which aborted rendering partway through the map.
      // Date plus coordinates is unique per incident by construction.
      id: `msa-${isoDate(row.Date)}-${Number(lat).toFixed(3)}-${Number(lon).toFixed(3)}`,
      date: isoDate(row.Date),
      lat: Number(lat.toFixed(5)),
      lon: Number(lon.toFixed(5)),
      placeName: row.Title || row.Location || '',
      country: 'United States',
      killed: Math.max(0, Number(row['Total Number of Fatalities']) || 0),
      injured: Math.max(0, Number(row['Number of Civilian Injured']) || 0),
      venueType: (row['School Related'] || '').toLowerCase() === 'yes' ? 'school' : '',
      precision: 'exact',
      category: 'civilian',
      sourceName: 'Stanford MSA',
      sourceUrl: 'https://github.com/StanfordGeospatialCenter/MSA',
    });
  }
  return out;
}

/**
 * Minimal RFC4180 CSV parser — quoted fields, embedded commas and newlines,
 * and doubled quotes. The MSA file has all three.
 *
 * @param {string} text
 * @returns {Array<object>}
 */
function parseCsv(text) {
  const rows = [];
  let field = '';
  let record = [];
  let quoted = false;
  const body = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (quoted) {
      if (ch === '"') {
        if (body[i + 1] === '"') { field += '"'; i += 1; } else { quoted = false; }
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') { record.push(field); field = ''; }
    else if (ch === '\n') {
      record.push(field);
      rows.push(record);
      record = [];
      field = '';
    }
    else if (ch !== '\r') field += ch;
  }
  if (field !== '' || record.length) { record.push(field); rows.push(record); }

  const header = rows.shift() || [];
  return rows
    .filter((cells) => cells.length > 1)
    .map((cells) => Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ''])));
}

/**
 * Normalise a date to ISO. MSA writes M/D/YYYY.
 *
 * @param {string} raw
 * @returns {string}
 */
function isoDate(raw) {
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(raw || '').trim());
  if (slash) {
    const [, m, d, y] = slash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(String(raw || '').trim());
  return iso ? iso[1] : '';
}

/**
 * Whether two incidents are the same event seen through two catalogues.
 *
 * Same day and within ~30 km. Date alone is too loose — several unrelated
 * shootings can share a date — and coordinates alone too strict, because the
 * two sources geocode to different points in the same town.
 *
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
function isSameIncident(a, b) {
  if (!a.date || !b.date || a.date !== b.date) return false;
  const dLat = (a.lat - b.lat) * 111;
  const dLon = (a.lon - b.lon) * 111 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLon) < 30;
}

async function main() {
  // One incident spans several rows when a field has multiple values, and the
  // same incident can appear under more than one class — both collapse here.
  const byItem = new Map();
  for (const cls of CLASSES) {
    process.stdout.write(`Querying Wikidata: ${cls.label}…`);
    // Anything matched directly is fetched in two passes: these classes are
    // large, and one query with every OPTIONAL attached reliably 504s.
    const bindings = (cls.requireWeapon || cls.direct)
      ? await fetchDetailsFor(await fetchClassQids(cls.qid, cls.requireWeapon))
      : await runQuery(queryForClass(cls.qid, false, false));
    let fresh = 0;
    for (const row of bindings) {
      const uri = row.item?.value;
      if (!uri) continue;
      if (!byItem.has(uri)) { byItem.set(uri, []); fresh += 1; }
      byItem.get(uri).push(row);
    }
    process.stdout.write(` ${bindings.length} rows, ${fresh} new incidents\n`);
  }
  process.stdout.write(`  ${byItem.size} distinct Wikidata incidents\n`);

  // Classify rather than delete. Every incident is tagged `military` or
  // `civilian` and the layer switches between them, so the reader decides what
  // they are looking at instead of inheriting our judgement.
  process.stdout.write('Classifying military vs civilian');
  const allQids = [...byItem.keys()].map((uri) => uri.split('/').pop());
  const militaryQids = await findConflictEvents(allQids);
  process.stdout.write(` ${militaryQids.size} military, ${byItem.size - militaryQids.size} civilian\n`);

  const incidents = [];
  let dropped = 0;
  const precisionCounts = { exact: 0, venue: 0, area: 0 };

  for (const [uri, rows] of byItem) {
    const point = resolveCoordinate(rows);
    if (!point) {
      // No location at any precision. Dropped rather than placed at a country
      // centroid: a marker is a claim about where someone died.
      dropped += 1;
      continue;
    }
    precisionCounts[point.precision] += 1;

    const qid = uri.split('/').pop();
    const photo = firstValue(rows, 'venuePhoto');
    const label = firstValue(rows, 'itemLabel');
    const date = firstValue(rows, 'date').slice(0, 10);

    incidents.push({
      id: qid,
      date,
      lat: Number(point.lat.toFixed(5)),
      lon: Number(point.lon.toFixed(5)),
      // A bare QID means Wikidata has no English label — better to show the
      // place than a meaningless identifier.
      placeName: /^Q\d+$/.test(label) ? firstValue(rows, 'locLabel') : label,
      country: firstValue(rows, 'countryLabel'),
      killed: maxNumber(rows, 'killed'),
      injured: maxNumber(rows, 'injured'),
      venueType: '',
      // Thumbnail width keeps the card light: the originals are often several
      // megabytes, and Commons resizes on demand.
      venuePhoto: photo ? `${photo}?width=480` : '',
      venueName: firstValue(rows, 'photoLocLabel'),
      category: classify(qid, militaryQids, maxNumber(rows, 'killed')),
      motive: collectMotives(rows),
      precision: point.precision,
      sourceName: 'Wikidata',
      sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
    });
  }

  // ── Stanford MSA ──────────────────────────────────────────────────────────
  process.stdout.write('Fetching Stanford MSA…');
  let msaAdded = 0;
  let msaDuplicates = 0;
  try {
    const msa = await fetchStanfordMsa();
    process.stdout.write(` ${msa.length} US incidents ${SINCE_YEAR}+\n`);
    // Index by date so the duplicate check is not O(n^2) across the whole set.
    const byDate = new Map();
    for (const incident of incidents) {
      if (!byDate.has(incident.date)) byDate.set(incident.date, []);
      byDate.get(incident.date).push(incident);
    }
    for (const candidate of msa) {
      const sameDay = byDate.get(candidate.date) || [];
      if (sameDay.some((existing) => isSameIncident(existing, candidate))) {
        msaDuplicates += 1;
        continue;
      }
      incidents.push(candidate);
      sameDay.push(candidate);
      byDate.set(candidate.date, sameDay);
      msaAdded += 1;
    }
  } catch (error) {
    // A dead upstream must not destroy an otherwise good Wikidata compile.
    process.stdout.write(` FAILED (${error?.message || error}) — continuing without it\n`);
  }

  incidents.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const countries = new Set(incidents.map((i) => i.country).filter(Boolean));
  const payload = {
    _comment: 'Compiled by scripts/compile-shootings.mjs. Perpetrator names are never queried, stored or served.',
    generated: new Date().toISOString().slice(0, 10),
    coverageNote:
      `${incidents.length} incidents across ${countries.size} countries, ${SINCE_YEAR}-present, from Wikidata (CC0). `
      + 'Coverage is uneven: it reflects where incidents are catalogued, not where they occur. '
      + 'The best-known national databases (Gun Violence Archive, Mother Jones, The Violence Project, '
      + 'Everytown, GTD, ACLED) all forbid redistribution, so none of them are included.',
    sources: [
      {
        name: 'Wikidata',
        url: 'https://query.wikidata.org/',
        licence: 'CC0 1.0 Universal (public domain dedication)',
        redistributable: true,
        retrieved: new Date().toISOString().slice(0, 10),
      },
      {
        name: 'Stanford MSA',
        url: 'https://github.com/StanfordGeospatialCenter/MSA',
        licence: 'CC BY 4.0',
        attribution: 'Stanford Mass Shootings in America, courtesy of the Stanford Geospatial Center and Stanford Libraries',
        redistributable: true,
        retrieved: new Date().toISOString().slice(0, 10),
      },
    ],
    stats: {
      withMotive: incidents.filter((i) => i.motive).length,
      civilian: incidents.filter((i) => i.category === 'civilian').length,
      military: incidents.filter((i) => i.category === 'military').length,
      wikidataIncidents: byItem.size,
      stanfordAdded: msaAdded,
      stanfordDuplicates: msaDuplicates,
      plotted: incidents.length,
      droppedNoLocation: dropped,
      countries: countries.size,
      precision: precisionCounts,
    },
    incidents,
  };

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 1)}\n`, 'utf8');
  process.stdout.write(
    `\nWrote ${OUT_PATH}\n`
    + `  plotted               ${incidents.length}\n`
    + `  civilian              ${incidents.filter((i) => i.category === 'civilian').length}\n`
    + `  military              ${incidents.filter((i) => i.category === 'military').length}\n`
    + `  from Wikidata         ${incidents.length - msaAdded}\n`
    + `  from Stanford MSA     ${msaAdded} (${msaDuplicates} were already present)\n`
    + `  dropped (no location) ${dropped}\n`
    + `  countries             ${countries.size}\n`
    + `  precision             exact ${precisionCounts.exact}, venue ${precisionCounts.venue}, area ${precisionCounts.area}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`compile-shootings failed: ${error?.message || error}\n`);
  process.exitCode = 1;
});
