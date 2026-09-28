#!/usr/bin/env node
/**
 * Derive control-surface hinge points from a GLB and emit a hinge map.
 *
 * WHY THIS EXISTS: in the FlightGear-derived airliners the node transforms are
 * identity and all geometry is baked into mesh vertices in aircraft space. So
 * rotating a node's matrix rotates that part about the AIRCRAFT ORIGIN, not
 * about its own hinge line — the rudder sits ~38 m aft, and would swing through
 * a 38 m arc instead of deflecting a few degrees.
 *
 * The fix is to rotate about the part's own hinge: T(h) · R(axis, θ) · T(−h).
 * This script computes h for every bound part once, offline, so the renderer
 * pays no runtime cost and the values are reviewable in version control.
 *
 * Hinges are derived from each part's own bounding box:
 *   - trailing-edge surfaces (aileron, elevator, flap, spoiler) hinge at their
 *     FORWARD edge — the model's nose is −X, so that is the part's min X
 *   - the rudder hinges at its forward edge about the vertical (Y) axis
 *   - landing gear hinges at the TOP of its strut (max Y)
 *   - fans and wheels spin about their own centre
 *
 *   node scripts/extract-hinges.mjs public/models/flight-sim/boeing-747-8i.glb
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;

/**
 * @param {string} file
 * @returns {object} glTF JSON document.
 */
function readGlbJson(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32LE(0) !== GLB_MAGIC) throw new Error(`${file} is not a GLB`);
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const len = buf.readUInt32LE(offset);
    const type = buf.readUInt32LE(offset + 4);
    if (type === CHUNK_JSON) return JSON.parse(buf.subarray(offset + 8, offset + 8 + len).toString('utf8'));
    offset = offset + 8 + len;
  }
  throw new Error('no JSON chunk');
}

/** Control classes and how each one hinges. */
const RULES = [
  // [ test, axis, hinge-edge ]  axis: 'x' longitudinal, 'y' vertical, 'z' spanwise
  [/^aileron/i, 'z', 'forward'],
  [/^elevator/i, 'z', 'forward'],
  [/^(doubleflaps|external_flap|flap_compart)/i, 'z', 'forward'],
  [/^speedbrake/i, 'z', 'forward'],
  [/^rudder/i, 'y', 'forward'],
  [/^[fn]lg_/i, 'z', 'top'],
  [/^blades_/i, 'x', 'centre'],
];

/**
 * @param {string} name
 * @returns {{axis: string, edge: string}|null}
 */
function ruleFor(name) {
  for (const [test, axis, edge] of RULES) {
    if (test.test(name)) return { axis, edge };
  }
  return null;
}

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/extract-hinges.mjs <model.glb>');
  process.exit(1);
}

const gltf = readGlbJson(file);
const { nodes = [], meshes = [], accessors = [] } = gltf;

const hinges = {};
let counted = 0;

for (const node of nodes) {
  if (!node.name || node.mesh === undefined) continue;
  const rule = ruleFor(node.name);
  if (!rule) continue;

  const mesh = meshes[node.mesh];
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const prim of mesh.primitives || []) {
    const acc = accessors[prim.attributes?.POSITION];
    if (!acc?.min) continue;
    for (let i = 0; i < 3; i += 1) {
      lo[i] = Math.min(lo[i], acc.min[i]);
      hi[i] = Math.max(hi[i], acc.max[i]);
    }
  }
  if (!Number.isFinite(lo[0])) continue;

  const mid = lo.map((v, i) => (v + hi[i]) / 2);
  let hinge;
  if (rule.edge === 'forward') {
    // Nose is −X, so a trailing-edge surface hinges at its most-forward point.
    hinge = [lo[0], mid[1], mid[2]];
  } else if (rule.edge === 'top') {
    hinge = [mid[0], hi[1], mid[2]];
  } else {
    hinge = mid;
  }

  hinges[node.name] = {
    axis: rule.axis,
    hinge: hinge.map((v) => Number(v.toFixed(4))),
  };
  counted += 1;
}

const out = {
  model: path.basename(file),
  generatedBy: 'scripts/extract-hinges.mjs',
  note: 'Node transforms in this asset are identity and geometry is baked in '
    + 'aircraft space, so every control surface must be rotated about the hinge '
    + 'below rather than about the model origin.',
  convention: { nose: '-X', up: '+Y', starboard: '+Z' },
  hinges,
};

const target = file.replace(/\.glb$/i, '.hinges.json');
fs.writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);
console.log(`wrote ${target} — ${counted} hinges`);

// Summarise by class so the result is reviewable at a glance.
const byClass = {};
for (const [name, h] of Object.entries(hinges)) {
  const key = name.replace(/[._]?\d.*$/, '').replace(/_[LR]$/i, '');
  byClass[key] = (byClass[key] || 0) + 1;
  void h;
}
for (const [k, v] of Object.entries(byClass).sort()) console.log(`  ${k.padEnd(18)} ${v}`);
