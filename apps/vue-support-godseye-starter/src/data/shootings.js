import * as Cesium from 'cesium';

/**
 * Civilian mass shootings.
 *
 * Public-record incidents — school, workplace, place-of-worship, retail and
 * public-space attacks — placed on the globe by date and location, with a
 * death-toll filter.
 *
 * DELIBERATE OMISSION: perpetrator names are never fetched, stored or shown.
 * That follows the "No Notoriety" / "Don't Name Them" guidance that criminology
 * researchers and most newsrooms now work to, on evidence that naming attackers
 * contributes to contagion. The map's subject is WHERE this happened and HOW
 * MANY people it took, which is also the only part a map can honestly render.
 * The ingest drops any perpetrator field a source carries; see
 * `/api/shootings` in vite.config.js.
 *
 * SCOPE: civilian incidents only. Armed conflict, insurgency, military
 * operations and state violence are excluded at the source level — those are a
 * different subject with different data, and merging them would misrepresent
 * both.
 *
 * COVERAGE IS UNEVEN AND THE LAYER SAYS SO. A handful of countries — the United
 * States most of all — have dedicated organisations cataloguing these events;
 * most have none. So this map is dense over North America and sparse elsewhere,
 * and that reflects WHERE RECORDS ARE KEPT, not where shootings happen. The row
 * meta line states this rather than letting the visual imply otherwise.
 */

/** Compiled dataset, served by our own endpoint rather than fetched per-source. */
const API_URL = '/api/shootings';

/**
 * Static history: there is nothing to re-poll. The manager still calls update()
 * once on enable, and this keeps it from re-fetching on a timer afterwards.
 */
const UPDATE_INTERVAL_MS = 0;

/**
 * Within this range of the camera, markers ignore the depth test so terrain
 * cannot swallow them; beyond it the globe occludes them normally.
 */
const NEAR_DEPTH_TEST_SKIP_M = 50_000;

/**
 * How deep to drill when picking. Enough to see past the tile surface and a
 * couple of other layers' primitives without walking the whole scene.
 */
const PICK_DEPTH = 8;

/** Filter floor presented on the row slider. */
export const MIN_KILLED_FLOOR = 0;
/** Filter ceiling. Above this the slider stops being useful — very few
 *  incidents reach it, and the map would go empty. */
export const MIN_KILLED_CEILING = 50;

/**
 * Marker colour by death toll.
 *
 * A restrained, single-hue ramp on purpose. This is a record of people killed;
 * a rainbow scale or anything that reads as "score" would be grotesque.
 *
 * @param {number} killed
 * @returns {Cesium.Color}
 */
export function tollColor(killed) {
  const n = Number(killed) || 0;
  if (n >= 20) return Cesium.Color.fromCssColorString('#f2545b');
  if (n >= 10) return Cesium.Color.fromCssColorString('#e07a5f');
  if (n >= 5) return Cesium.Color.fromCssColorString('#dfa06e');
  return Cesium.Color.fromCssColorString('#c8b6a6');
}

/**
 * Marker colour for a military/conflict event.
 *
 * Same lightness ramp as tollColor, shifted to a cool hue. Category is carried
 * by hue and death toll by intensity, so the two dimensions never compete.
 *
 * @param {number} killed
 * @returns {Cesium.Color}
 */
export function militaryColor(killed) {
  const n = Number(killed) || 0;
  if (n >= 20) return Cesium.Color.fromCssColorString('#6f8fd6');
  if (n >= 10) return Cesium.Color.fromCssColorString('#7fa3c9');
  if (n >= 5) return Cesium.Color.fromCssColorString('#93b0c4');
  return Cesium.Color.fromCssColorString('#a9bcc6');
}

/**
 * Marker radius in pixels.
 *
 * Compressed with a cube root so a 60-death incident does not render sixty
 * times the area of a single-death one; the point is to be findable, not to
 * dramatise a body count.
 *
 * @param {number} killed
 * @returns {number}
 */
export function tollRadiusPx(killed) {
  const n = Math.max(0, Number(killed) || 0);
  return 4 + Math.cbrt(n) * 2.6;
}

/**
 * Normalise one API record, rejecting anything unplottable.
 *
 * Returns null rather than a partial entity: a marker at coordinates we guessed
 * would be a false claim about where someone died.
 *
 * @param {object} raw
 * @param {number} index
 * @returns {object|null}
 */
export function normalizeIncident(raw, index = 0) {
  if (!raw) return null;
  const lat = Number(raw.lat);
  const lon = Number(raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  const killed = Number.isFinite(Number(raw.killed)) ? Math.max(0, Number(raw.killed)) : 0;
  const injured = Number.isFinite(Number(raw.injured)) ? Math.max(0, Number(raw.injured)) : 0;

  return {
    id: String(raw.id || `incident-${index}`),
    date: typeof raw.date === 'string' ? raw.date : '',
    lat,
    lon,
    placeName: typeof raw.placeName === 'string' ? raw.placeName : '',
    country: typeof raw.country === 'string' ? raw.country : '',
    killed,
    injured,
    venueType: typeof raw.venueType === 'string' ? raw.venueType : '',
    precision: typeof raw.precision === 'string' ? raw.precision : 'exact',
    venuePhoto: typeof raw.venuePhoto === 'string' ? raw.venuePhoto : '',
    venueName: typeof raw.venueName === 'string' ? raw.venueName : '',
    category: raw.category === 'military' ? 'military' : 'civilian',
    motive: cleanMotive(raw.motive),
    sourceName: typeof raw.sourceName === 'string' ? raw.sourceName : '',
    sourceUrl: typeof raw.sourceUrl === 'string' ? raw.sourceUrl : '',
  };
}

/**
 * Terms that describe HOW someone died rather than why.
 *
 * The compiler already filters values typed as weapons, injuries or diseases,
 * but a few are typed as none of those and still slip through — "blunt trauma",
 * "surface-to-air missile". Two out of eighty-two, and both would read as
 * absurd under a heading that says motive.
 */
const MECHANISM_TERMS = [
  'trauma', 'missile', 'wound', 'gunshot', 'explosion', 'asphyxia',
  'strangulation', 'stabbing', 'blunt', 'firearm', 'bomb',
];

/**
 * Drop mechanism values from a motive string.
 *
 * @param {unknown} raw
 * @returns {string}
 */
export function cleanMotive(raw) {
  if (typeof raw !== 'string' || !raw) return '';
  const kept = raw.split(',')
    .map((part) => part.trim())
    .filter((part) => part && !MECHANISM_TERMS.some((term) => part.toLowerCase().includes(term)));
  return kept.join(', ');
}

/**
 * US state names, so "in Florida" can be resolved.
 *
 * The dataset records `country` but not state, and Wikidata's place names carry
 * the state inline ("2018 Parkland, Florida shooting"). Matching against the
 * name is the only join available, and it works because these titles are
 * written by people who name the state.
 */
const US_STATES = Object.freeze({
  // [west, south, east, north]
  alabama: [-88.5, 30.2, -84.9, 35.0], alaska: [-172, 51, -130, 71.5],
  arizona: [-114.9, 31.3, -109, 37], arkansas: [-94.7, 33, -89.6, 36.5],
  // California's eastern edge is pulled to -115.3 rather than its true -114.1.
  // The CA/NV border runs diagonally — at Las Vegas's latitude California ends
  // near -116.2 — so the honest rectangle swallowed Las Vegas and answered
  // "worst in California" with a Nevada shooting. The cost is the far
  // south-eastern desert corner (Blythe, Needles); the alternative is naming
  // the wrong state on the biggest incident in the set.
  california: [-124.5, 32.5, -115.3, 42], colorado: [-109.1, 36.9, -102, 41],
  connecticut: [-73.8, 40.9, -71.7, 42.1], delaware: [-75.8, 38.4, -75, 39.9],
  florida: [-87.7, 24.4, -79.9, 31.1], georgia: [-85.7, 30.3, -80.8, 35.1],
  hawaii: [-160.3, 18.8, -154.7, 22.3], idaho: [-117.3, 41.9, -111, 49],
  illinois: [-91.6, 36.9, -87.4, 42.6], indiana: [-88.1, 37.7, -84.7, 41.8],
  iowa: [-96.7, 40.3, -90.1, 43.6], kansas: [-102.1, 36.9, -94.5, 40.1],
  kentucky: [-89.6, 36.4, -81.9, 39.2], louisiana: [-94.1, 28.9, -88.8, 33.1],
  maine: [-71.1, 42.9, -66.9, 47.5], maryland: [-79.5, 37.9, -75, 39.8],
  massachusetts: [-73.5, 41.2, -69.8, 42.9], michigan: [-90.5, 41.6, -82.1, 48.3],
  minnesota: [-97.3, 43.4, -89.4, 49.4], mississippi: [-91.7, 30.1, -88.1, 35],
  missouri: [-95.8, 35.9, -89.1, 40.7], montana: [-116.1, 44.3, -104, 49],
  nebraska: [-104.1, 39.9, -95.3, 43.1], nevada: [-120.1, 35, -114, 42],
  'new hampshire': [-72.6, 42.6, -70.6, 45.4], 'new jersey': [-75.6, 38.9, -73.8, 41.4],
  'new mexico': [-109.1, 31.3, -103, 37], 'new york': [-79.8, 40.4, -71.8, 45.1],
  'north carolina': [-84.4, 33.8, -75.4, 36.6], 'north dakota': [-104.1, 45.9, -96.5, 49],
  ohio: [-84.9, 38.4, -80.5, 42.4], oklahoma: [-103.1, 33.6, -94.4, 37.1],
  oregon: [-124.6, 41.9, -116.4, 46.3], pennsylvania: [-80.6, 39.7, -74.7, 42.3],
  'rhode island': [-71.9, 41.1, -71.1, 42.1], 'south carolina': [-83.4, 32, -78.5, 35.2],
  'south dakota': [-104.1, 42.4, -96.4, 45.9], tennessee: [-90.4, 34.9, -81.6, 36.7],
  texas: [-106.7, 25.8, -93.5, 36.5], utah: [-114.1, 37, -109, 42],
  vermont: [-73.5, 42.7, -71.5, 45.1], virginia: [-83.7, 36.5, -75.2, 39.5],
  washington: [-124.8, 45.5, -116.9, 49], 'west virginia': [-82.7, 37.2, -77.7, 40.6],
  wisconsin: [-92.9, 42.5, -86.8, 47.1], wyoming: [-111.1, 40.9, -104, 45],
});

/** Words that mean "rank by death toll", however people phrase it. */
const SUPERLATIVES = /\b(worst|deadliest|biggest|craziest|largest|most people|highest|baddest|insane|crazy)\b/;

/**
 * Search incidents by free text.
 *
 * Handles the two ways people actually ask:
 *
 *   "the worst shooting in Florida"  — a place filter plus a superlative
 *   "miami school shooting"          — words that should appear in the name
 *
 * Scored rather than filtered, because a strict AND match on every word finds
 * nothing: nobody types an incident's exact Wikidata title.
 *
 * @param {Array<object>} incidents
 * @param {string} query
 * @param {number} [limit]
 * @returns {Array<object>} Best matches first.
 */
export function searchIncidents(incidents, query, limit = 5) {
  const text = String(query || '').toLowerCase().trim();
  if (!text) return [];

  const wantsDeadliest = SUPERLATIVES.test(text);
  // Place filtering is GEOGRAPHIC, not by name. Matching the state's name
  // inside the incident title missed the Orlando nightclub shooting for "worst
  // in Florida" — 50 dead, in Florida, but its title never says "Florida".
  // A bounding box catches it because the coordinates are the fact.
  const stateName = Object.keys(US_STATES).find((state) => text.includes(state)) || '';
  const box = stateName ? US_STATES[stateName] : null;
  const countries = new Set(incidents.map((i) => (i.country || '').toLowerCase()).filter(Boolean));
  const country = [...countries].find((c) => c && text.includes(c)) || '';

  // Stop words plus the query verbs — none of these help identify an incident.
  const STOP = new Set([
    'the', 'a', 'an', 'in', 'at', 'of', 'was', 'what', 'whats', 'is', 'me', 'show',
    'find', 'tell', 'about', 'that', 'happened', 'there', 'hey', 'shooting',
    'shootings', 'killing', 'killings', 'attack', 'incident', 'worst', 'deadliest',
    'biggest', 'craziest', 'largest', 'most', 'people', 'highest', 'baddest', 'and',
    'to', 'go', 'zoom', 'take', 'on', 'it', 'one', 'which', 'crazy', 'insane',
  ]);
  // The place words are already doing their job as a geographic filter, so
  // they must NOT also be required to appear in the title. Leaving them in
  // skipped the Orlando nightclub shooting for "worst in Florida" — 50 dead,
  // inside the Florida box, but its name says Orlando.
  const placeWords = new Set([
    ...stateName.split(' '),
    ...country.split(' '),
  ].filter(Boolean));
  const terms = text.split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !placeWords.has(w));

  const scored = [];
  for (const incident of incidents) {
    const name = (incident.placeName || '').toLowerCase();
    const inCountry = (incident.country || '').toLowerCase();

    if (country && inCountry !== country) continue;
    if (box && !(incident.lon >= box[0] && incident.lon <= box[2]
      && incident.lat >= box[1] && incident.lat <= box[3])) continue;

    let nameHits = 0;
    let score = 0;
    for (const term of terms) {
      if (name.includes(term)) { score += 10; nameHits += 1; }
      else if (inCountry.includes(term)) score += 3;
    }
    // A place filter that matched is itself evidence, so "worst in Florida"
    // with no other terms still returns Florida's list.
    if ((box || country) && !terms.length) score += 1;
    // A bounding box cannot follow a diagonal border. California's box takes in
    // Las Vegas, so "worst in California" answered with a Nevada shooting.
    // Naming the state in the title is stronger evidence than falling inside a
    // rectangle, so it outranks a box-only match.
    // Small: a tie-break, not an override. At 25 it beat the death toll and
    // ranked a 6-death incident that says "California" above a 16-death one
    // that does not. The box now does the real work of excluding other states.
    if (stateName && name.includes(stateName)) score += 4;
    // EVERY named term must appear. A partial match is how "miami school
    // shooting" confidently answered with the Beslan school siege: "miami"
    // matched nothing, "school" matched everything, and half a match looked
    // like an answer. Better to find nothing and say so.
    if (terms.length && nameHits < terms.length) continue;
    if (!score) continue;

    // Ranking by toll is what "worst" means; without it the tie-break is
    // arbitrary and the answer to "the worst in Florida" is whichever record
    // happened to be first.
    scored.push({ incident, score: score + (wantsDeadliest ? incident.killed * 2 : 0) });
  }

  scored.sort((a, b) => (b.score - a.score) || (b.incident.killed - a.incident.killed));
  return scored.slice(0, limit).map((entry) => entry.incident);
}

/**
 * Incidents at or above a death-toll floor.
 *
 * @param {Array<object>} incidents
 * @param {number} minKilled
 * @returns {Array<object>}
 */
export function filterByToll(incidents, minKilled) {
  const floor = Math.max(0, Number(minKilled) || 0);
  if (floor <= 0) return incidents;
  return incidents.filter((incident) => incident.killed >= floor);
}

/**
 * Incidents in the selected category.
 *
 * @param {Array<object>} incidents
 * @param {string} category - 'civilian' | 'military' | 'both'
 * @returns {Array<object>}
 */
export function filterByCategory(incidents, category) {
  if (category === 'both') return incidents;
  const want = category === 'military' ? 'military' : 'civilian';
  return incidents.filter((incident) => incident.category === want);
}

/**
 * Human label for the filter readout.
 *
 * @param {number} minKilled
 * @param {number} shown
 * @param {number} total
 * @returns {string}
 */
export function filterLabel(minKilled, shown, total) {
  const floor = Math.max(0, Number(minKilled) || 0);
  const counts = `${shown.toLocaleString('en-US')}/${total.toLocaleString('en-US')}`;
  return floor <= 0 ? `ALL · ${counts}` : `${floor}+ · ${counts}`;
}

/**
 * Card text for one incident.
 *
 * @param {object} incident
 * @returns {string}
 */
export function describeIncident(incident) {
  const where = [incident.placeName, incident.country].filter(Boolean).join(', ');
  const toll = [
    incident.killed ? `${incident.killed} killed` : null,
    incident.injured ? `${incident.injured} injured` : null,
  ].filter(Boolean).join(', ') || 'toll not recorded';
  return [incident.date, where, toll].filter(Boolean).join(' · ');
}

/**
 * Create the layer.
 *
 * @returns {object} Layer module.
 */
export function createShootingsLayer() {
  /** @type {Cesium.CustomDataSource|null} */
  let _dataSource = null;
  /** @type {Array<object>} */
  let _incidents = [];
  let _minKilled = MIN_KILLED_FLOOR;
  /** 'civilian' | 'military' | 'both' */
  let _category = 'civilian';
  let _shown = 0;
  let _lastUpdate = null;
  let _lastError = null;
  let _enabled = false;
  let _loaded = false;
  let _coverageNote = '';
  let _rowControlsListener = null;
  /** entityId -> incident, so a pick resolves without searching. */
  const _byEntityId = new Map();
  /** @type {Cesium.ScreenSpaceEventHandler|null} */
  let _clickHandler = null;
  let _card = null;

  /** Repaint entities for the current filter. */
  function render() {
    if (!_dataSource) return;
    _dataSource.entities.removeAll();
    _byEntityId.clear();
    const visible = filterByToll(filterByCategory(_incidents, _category), _minKilled);
    _shown = visible.length;

    let rejected = 0;
    for (const incident of visible) {
      const entityId = `shooting-${incident.id}`;
      // Guarded per record. A duplicate id makes entities.add throw, and an
      // unguarded throw here abandoned the loop partway — 378 of 654 markers
      // drawn and the rest silently missing. One malformed record should cost
      // one marker, not the map.
      try {
      _byEntityId.set(entityId, incident);
      _dataSource.entities.add({
        id: entityId,
        position: Cesium.Cartesian3.fromDegrees(incident.lon, incident.lat),
        point: {
          // Clamped to the surface. Without this the point sits at ellipsoid
          // height zero, which is BELOW ground anywhere with elevation — a
          // marker in Denver or Zurich was buried inside the terrain and could
          // not be seen or clicked.
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          pixelSize: tollRadiusPx(incident.killed),
          // Military events take a cool hue so the two categories stay
          // distinguishable when BOTH is selected — otherwise a mixed map is
          // just an undifferentiated smear of dots.
          color: (incident.category === 'military'
            ? militaryColor(incident.killed)
            : tollColor(incident.killed)).withAlpha(0.85),
          outlineColor: Cesium.Color.BLACK.withAlpha(0.55),
          outlineWidth: 1,
          // Markers stay legible at globe scale without swelling as you close
          // in on one — the size means a death toll, so it must not also mean
          // camera distance.
          scaleByDistance: new Cesium.NearFarScalar(1.0e4, 1.0, 4.0e7, 0.45),
          // FINITE, not Infinity. Infinity disables the depth test outright,
          // which meant markers on the far side of the planet drew straight
          // through it — incidents in the United States appearing over the
          // empty South Pacific and across Antarctica.
          //
          // A finite value keeps the useful half of that behaviour: within
          // this range the depth test is still skipped, so a marker is not
          // swallowed by the hill or building it sits on. Beyond it the globe
          // occludes as it should.
          disableDepthTestDistance: NEAR_DEPTH_TEST_SKIP_M,
        },
        description: describeIncident(incident),
        properties: {
          date: incident.date,
          killed: incident.killed,
          injured: incident.injured,
          venueType: incident.venueType,
          sourceName: incident.sourceName,
          sourceUrl: incident.sourceUrl,
        },
      });
      } catch (error) {
        rejected += 1;
        _byEntityId.delete(entityId);
        if (rejected === 1) console.warn('[Data:Shootings] record rejected:', error?.message || error);
      }
    }
    if (rejected > 0) {
      _shown -= rejected;
      console.warn(`[Data:Shootings] ${rejected} record(s) could not be plotted`);
    }
    _rowControlsListener?.();
  }

  /**
   * Human date: "12 June 2016" reads as a day something happened; "2016-06-12"
   * reads as a database row.
   *
   * @param {string} iso
   * @returns {string}
   */
  function formatDate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    if (!match) return String(iso || '');
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    });
  }

  /**
   * How the marker was placed, said plainly.
   *
   * A point at a city centroid is a far weaker claim than one at the building,
   * and a map that renders both identically is quietly overstating one of them.
   *
   * @param {string} precision
   * @returns {string}
   */
  function precisionNote(precision) {
    if (precision === 'venue') return 'Marker placed at the venue';
    if (precision === 'area') return 'Marker placed at the surrounding area, not the exact site';
    return 'Marker placed at the recorded location';
  }

  /**
   * 关闭详情卡片。
   * @returns {void}
   */
  function closeCard() {
    if (_card) _card.hidden = true;
  }

  /**
   * Show one incident's details.
   *
   * @param {object} incident
   * @returns {void}
   */
  function showCard(incident) {
    if (!_card || !incident) return;
    const set = (key, text) => {
      const node = _card.querySelector(`[data-shooting="${key}"]`);
      if (node) node.textContent = text;
    };
    set('date', formatDate(incident.date));
    set('title', incident.placeName || 'Incident');
    set('place', [incident.country].filter(Boolean).join(''));
    // An unrecorded toll shows as an em dash rather than 0 — "0 killed" would
    // be a claim, and a missing figure is not the same as a zero one.
    set('killed', incident.killed > 0 ? String(incident.killed) : '—');
    set('injured', incident.injured > 0 ? String(incident.injured) : '—');
    const motiveRow = _card.querySelector('[data-shooting="motive-row"]');
    if (motiveRow) {
      set('motive', incident.motive || '');
      motiveRow.hidden = !incident.motive;
    }
    const badge = _card.querySelector('[data-shooting="category"]');
    if (badge) {
      const military = incident.category === 'military';
      badge.textContent = military ? 'Armed conflict' : 'Civilian attack';
      badge.className = `shooting-detail-badge is-${military ? 'military' : 'civilian'}`;
    }
    set('precision', precisionNote(incident.precision));

    // The photograph is of the PLACE. Hidden entirely when there is none —
    // a broken image frame would be worse than no image.
    const figure = _card.querySelector('[data-shooting="figure"]');
    const photo = _card.querySelector('[data-shooting="photo"]');
    if (figure && photo) {
      if (incident.venuePhoto) {
        photo.src = incident.venuePhoto;
        photo.alt = incident.venueName ? `${incident.venueName}` : 'Location';
        set('caption', incident.venueName || 'Location');
        figure.hidden = false;
        // A dead Commons link must not leave an empty grey box on the card.
        photo.onerror = () => { figure.hidden = true; };
      } else {
        figure.hidden = true;
        photo.removeAttribute('src');
      }
    }
    const source = _card.querySelector('[data-shooting="source"]');
    if (source) {
      source.href = incident.sourceUrl || '#';
      source.textContent = `Source · ${incident.sourceName || 'record'}`;
      source.hidden = !incident.sourceUrl;
    }
    _card.hidden = false;
  }

  /**
   * Wire clicks on markers to the detail card.
   *
   * @param {object} viewer
   * @returns {void}
   */
  function installInteraction(viewer) {
    if (_clickHandler || !viewer?.scene?.canvas) return;
    _card = document.getElementById('shooting-detail');
    _card?.querySelector('[data-shooting="close"]')
      ?.addEventListener('click', closeCard);

    _clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    _clickHandler.setInputAction((click) => {
      if (!_enabled) return;
      // drillPick, not pick. A plain pick returns the topmost primitive, which
      // over photoreal tiles is the tile surface the marker is clamped to —
      // measured returning the tileset first and the marker second, so every
      // click on a marker read as a click on empty ground.
      const hits = viewer.scene.drillPick(click.position, PICK_DEPTH);
      let incident = null;
      for (const hit of hits) {
        const id = typeof hit?.id?.id === 'string' ? hit.id.id : null;
        if (id && _byEntityId.has(id)) {
          incident = _byEntityId.get(id);
          break;
        }
      }
      // A click on empty globe dismisses the card, which is what every map
      // does and what people expect without being told.
      if (incident) showCard(incident);
      else closeCard();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  const layer = {
    id: 'shootings',
    // Named for what it now HOLDS, not what it started as. The layer was
    // shootings-only; it now carries mass killings by any method — stabbings,
    // vehicle attacks, bombings. Leaving it labelled "Mass Shootings" with a
    // bombing inside it would be a false label on a map, which is worse than an
    // awkward rename. The layer id is unchanged so share links keep working.
    name: 'Mass Killings',
    icon: '🕯️',
    source: 'public records',
    updateInterval: UPDATE_INTERVAL_MS,

    init(viewer) {
      _dataSource = new Cesium.CustomDataSource('shootings');
      _dataSource.show = false;
      viewer.dataSources.add(_dataSource);
      _incidents = [];
      _shown = 0;
      _loaded = false;
      _lastUpdate = null;
      _lastError = null;
      _enabled = false;
    },

    enable(viewer) {
      _enabled = true;
      if (_dataSource) _dataSource.show = true;
      installInteraction(viewer);
    },

    disable() {
      _enabled = false;
      if (_dataSource) _dataSource.show = false;
      // The card belongs to the layer: leaving it up over a globe with no
      // markers on it would be a detail panel for something invisible.
      closeCard();
    },

    async update() {
      // Historical data: fetched once, then filtered locally. Re-fetching on a
      // timer would be pure waste — none of these records change.
      if (_loaded) return true;
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          _lastError = `Shootings HTTP ${response.status}`;
          return false;
        }
        const payload = await response.json();
        const rows = Array.isArray(payload?.incidents) ? payload.incidents : [];
        _incidents = rows
          .map((row, index) => normalizeIncident(row, index))
          .filter(Boolean)
          // Deadliest last so they draw on top of the denser small markers.
          .sort((a, b) => a.killed - b.killed);
        _coverageNote = typeof payload?.coverageNote === 'string' ? payload.coverageNote : '';
        _loaded = true;
        _lastUpdate = Date.now();
        _lastError = null;
        render();
        return true;
      } catch (error) {
        _lastError = String(error?.message || error);
        return false;
      }
    },

    /**
     * @param {{minKilled?: number}} params
     * @returns {boolean} Whether anything was accepted.
     */
    setParams(params = {}) {
      if (typeof params.category === 'string') {
        const next = ['civilian', 'military', 'both'].includes(params.category)
          ? params.category : 'civilian';
        if (next !== _category) {
          _category = next;
          render();
        }
        return true;
      }
      if (!Number.isFinite(Number(params.minKilled))) return false;
      const next = Math.max(
        MIN_KILLED_FLOOR,
        Math.min(MIN_KILLED_CEILING, Math.round(Number(params.minKilled)))
      );
      if (next === _minKilled) return true;
      _minKilled = next;
      render();
      return true;
    },

    /**
     * 设置行级控制监听器。
     * @param {Function} listener
     */
    setRowControlsListener(listener) {
      _rowControlsListener = typeof listener === 'function' ? listener : null;
    },

    /**
     * Answer a spoken question about an incident: find it, fly to it, show it.
     *
     * @param {object} viewer
     * @param {string} query
     * @returns {Promise<{ok: boolean, incident?: object, reply: string}>}
     */
    async findAndFocus(viewer, query) {
      // The question may arrive before anyone has switched the layer on.
      if (!_loaded) await layer.update();
      if (!_incidents.length) return { ok: false, reply: 'No incident data loaded.' };

      // Search the WHOLE set, not the filtered view: a question about a
      // military event should still answer while the civilian filter is up.
      const matches = searchIncidents(_incidents, query, 5);
      if (!matches.length) {
        // Say plainly that nothing was found and invite another try. Silence,
        // or a confident wrong answer, are both worse than admitting the miss —
        // and this dataset genuinely does not have everything.
        return {
          ok: false,
          reply: "I didn't find anything for that. Is there something else you'd like me to find?",
        };
      }
      const incident = matches[0];

      // Make sure the thing being described is actually visible before flying
      // to it — otherwise the camera lands on an empty patch of ground.
      if (incident.category !== _category && _category !== 'both') {
        _category = incident.category;
      }
      if (_minKilled > incident.killed) _minKilled = MIN_KILLED_FLOOR;
      if (_dataSource) _dataSource.show = true;
      render();

      if (viewer?.camera) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(incident.lon, incident.lat, 2600),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-42),
            roll: 0,
          },
          duration: 3.0,
        });
      }
      showCard(incident);

      const toll = incident.killed
        ? `${incident.killed} killed`
        : 'toll not recorded';
      return {
        ok: true,
        incident,
        reply: `${incident.placeName}. ${toll}.`,
      };
    },

    /**
     * The death-toll filter, plus a legend that doubles as the honest
     * statement about coverage.
     *
     * @returns {object}
     */
    getRowControls() {
      const counts = {
        civilian: _incidents.filter((i) => i.category === 'civilian').length,
        military: _incidents.filter((i) => i.category === 'military').length,
      };
      return {
        chips: [
          { id: 'cat-civilian', label: `CIVILIAN ${counts.civilian}`,
            active: _category === 'civilian', params: { category: 'civilian' },
            title: 'Attacks by individuals on civilians' },
          { id: 'cat-military', label: `MILITARY ${counts.military}`,
            active: _category === 'military', params: { category: 'military' },
            title: 'Armed conflict, insurgency, state violence and attacks by armed groups' },
          { id: 'cat-both', label: 'BOTH',
            active: _category === 'both', params: { category: 'both' },
            title: 'Show every recorded incident' },
        ],
        sliders: [{
          id: 'min-killed',
          paramKey: 'minKilled',
          label: 'Deaths',
          min: MIN_KILLED_FLOOR,
          max: MIN_KILLED_CEILING,
          step: 1,
          value: _minKilled,
          valueLabel: filterLabel(_minKilled, _shown, _incidents.length),
          title: 'Show only incidents at or above this number of deaths',
        }],
        legend: [],
      };
    },

    getStats() {
      return {
        count: _shown,
        lastUpdate: _lastUpdate,
        error: _lastError,
        note: _coverageNote,
      };
    },
  };

  return layer;
}

const shootingsLayer = createShootingsLayer();

export default shootingsLayer;
