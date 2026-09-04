/**
 * How the DATA LAYERS panel is organised.
 *
 * The panel was a flat list. That was fine at six layers and is not fine at
 * twenty-one: the list is taller than the screen, so finding anything means
 * scrolling past everything, and every layer added makes every other layer
 * harder to find.
 *
 * Grouping is DATA, not structure. Adding a group is one entry here; adding a
 * layer to a group is one string. Nothing in the renderer knows what the groups
 * are, so the taxonomy can be wrong today and fixed tomorrow without touching
 * the code that draws it. That matters, because a taxonomy is a guess about
 * what someone will want next and this one is certainly incomplete — there is
 * no home yet for population and migration, for living nature as distinct from
 * geophysics, or for trade and resources. When those arrive they are new
 * entries in this array, not a refactor.
 *
 * ORDER IS DELIBERATE, not alphabetical: the things that move are at the top,
 * because they are what people open the panel to look at, and the static
 * reference layers are at the bottom.
 */

/**
 * @typedef {object} LayerGroup
 * @property {string} id
 * @property {string} label     Shown on the group header.
 * @property {string} icon
 * @property {string} blurb     One line, for the collapsed state.
 * @property {Array<string>} layers  Layer ids, in display order.
 */

/** @type {ReadonlyArray<LayerGroup>} */
export const LAYER_GROUPS = Object.freeze([
  Object.freeze({
    id: 'sky',
    label: 'SKY',
    icon: '✈️',
    blurb: 'Aircraft, satellites and launches',
    layers: Object.freeze(['flights', 'military', 'airports', 'satellites', 'rocket-launches']),
  }),
  Object.freeze({
    id: 'sea',
    label: 'SEA',
    icon: '⚓',
    blurb: 'Vessels and what runs under them',
    layers: Object.freeze(['ais-live-vessels', 'telegeography-submarine-cables']),
  }),
  Object.freeze({
    id: 'earth',
    label: 'EARTH',
    icon: '🌍',
    blurb: 'Geophysics: what the planet is doing right now',
    layers: Object.freeze(['earthquakes', 'temperature', 'local-firms']),
  }),
  Object.freeze({
    id: 'harm',
    label: 'HARM',
    icon: '🕯️',
    blurb: 'Where people have been hurt, and how safe places are',
    layers: Object.freeze(['shootings', 'safety']),
  }),
  Object.freeze({
    id: 'life',
    label: 'LIFE',
    icon: '🌱',
    blurb: 'Forests, reefs, wildlife and protected land',
    layers: Object.freeze([]),
  }),
  Object.freeze({
    id: 'history',
    label: 'HISTORY',
    icon: '🏛️',
    blurb: 'Things that happened here',
    layers: Object.freeze([]),
  }),
  Object.freeze({
    id: 'people',
    label: 'PEOPLE',
    icon: '👥',
    blurb: 'Where people are, and how they move',
    layers: Object.freeze([]),
  }),
  Object.freeze({
    id: 'health',
    label: 'HEALTH',
    icon: '🩺',
    blurb: 'Air, water, disease and care',
    layers: Object.freeze([]),
  }),
  Object.freeze({
    id: 'eyes',
    label: 'EYES & EARS',
    icon: '👁️',
    blurb: 'Live cameras and radio',
    layers: Object.freeze(['cctv', 'radio']),
  }),
  Object.freeze({
    id: 'infrastructure',
    label: 'INFRASTRUCTURE',
    icon: '⚡',
    blurb: 'The built things everything else depends on',
    layers: Object.freeze(['local-datacenters', 'local-dams']),
  }),
  Object.freeze({
    id: 'military',
    label: 'MILITARY',
    icon: '🎖️',
    blurb: 'Installations and activity',
    layers: Object.freeze(['military-installations', 'military-awareness']),
  }),
  Object.freeze({
    id: 'city',
    label: 'CITY',
    icon: '🚗',
    blurb: 'Getting around',
    layers: Object.freeze(['traffic', 'bikeshare']),
  }),
  Object.freeze({
    id: 'trade',
    label: 'TRADE',
    icon: '⚖️',
    blurb: 'Resources, routes and what they are worth',
    layers: Object.freeze([]),
  }),
  Object.freeze({
    id: 'space',
    label: 'SPACE',
    icon: '🔭',
    blurb: 'Looking outward rather than down',
    layers: Object.freeze([]),
  }),
  Object.freeze({
    id: 'power',
    label: 'POWER',
    icon: '🏛',
    blurb: 'Borders, states and who governs where',
    layers: Object.freeze([]),
  }),
  Object.freeze({
    id: 'map',
    label: 'MAP',
    icon: '🗺️',
    blurb: 'How the map itself reads',
    layers: Object.freeze(['map-labels']),
  }),
]);

/**
 * Group a set of layers for display.
 *
 * A layer belonging to no group is NOT dropped — it is returned in a trailing
 * "OTHER" group. Silently hiding a registered layer because someone forgot to
 * list it here would be the worst possible failure: the layer still exists,
 * still costs memory, and simply cannot be turned on.
 *
 * Empty groups are omitted, so a group can be declared before the layer that
 * will fill it exists.
 *
 * @param {Array<object>} layers - Layer descriptors from the manager.
 * @param {ReadonlyArray<LayerGroup>} [groups]
 * @returns {Array<{group: LayerGroup, layers: Array<object>}>}
 */
export function groupLayers(layers, groups = LAYER_GROUPS) {
  const byId = new Map();
  for (const layer of layers || []) {
    if (layer && typeof layer.id === 'string') byId.set(layer.id, layer);
  }

  const out = [];
  const claimed = new Set();
  for (const group of groups) {
    const members = [];
    for (const id of group.layers) {
      const layer = byId.get(id);
      if (!layer) continue;
      members.push(layer);
      claimed.add(id);
    }
    if (members.length) out.push({ group, layers: members });
  }

  const orphans = [...byId.values()].filter((layer) => !claimed.has(layer.id));
  if (orphans.length) {
    out.push({
      group: {
        id: 'other',
        label: 'OTHER',
        icon: '•',
        blurb: 'Not yet filed under a group',
        layers: orphans.map((layer) => layer.id),
      },
      layers: orphans,
    });
  }
  return out;
}

/**
 * The group a layer belongs to, or null.
 *
 * @param {string} layerId
 * @param {ReadonlyArray<LayerGroup>} [groups]
 * @returns {LayerGroup|null}
 */
export function groupForLayer(layerId, groups = LAYER_GROUPS) {
  return groups.find((group) => group.layers.includes(layerId)) || null;
}
