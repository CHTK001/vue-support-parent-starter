#!/usr/bin/env node
/**
 * Print the node / mesh / animation inventory of a GLB.
 *
 * Flight Sim maps simulator controls (gear, ailerons, flaps, engine fans …)
 * onto whatever the asset actually contains, so the mapping has to be written
 * against real node names rather than assumed ones. This prints them.
 *
 *   node scripts/inspect-model.mjs public/models/airplane.glb
 *   node scripts/inspect-model.mjs --all
 *
 * GLB is a container: a 12-byte header then length-prefixed chunks, the first
 * of which is the glTF JSON. No dependency is needed to read the structure.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const GLB_MAGIC = 0x46546c67; // 'glTF'
const CHUNK_JSON = 0x4e4f534a; // 'JSON'

/**
 * Extract the glTF JSON document from a .glb file.
 *
 * @param {string} file - Path to a .glb.
 * @returns {object} Parsed glTF JSON document.
 */
function readGlbJson(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 12 || buf.readUInt32LE(0) !== GLB_MAGIC) {
    throw new Error(`${file} is not a GLB (bad magic)`);
  }
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const chunkLength = buf.readUInt32LE(offset);
    const chunkType = buf.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (chunkType === CHUNK_JSON) {
      return JSON.parse(buf.subarray(start, start + chunkLength).toString('utf8'));
    }
    offset = start + chunkLength;
  }
  throw new Error(`${file} has no JSON chunk`);
}

/** Control-surface vocabulary Flight Sim looks for, and the name hints that match it. */
const SEMANTIC_HINTS = {
  // FlightGear-derived airliners name gear NLG_* (nose) and FLG_* (fuselage),
  // which a \blg\b pattern can never match — there is no word boundary before
  // the LG. That false negative reported "no gear" on a model with 26 gear
  // nodes, so the prefixes are matched explicitly.
  gear: [/gear/i, /undercarriage/i, /^[fn]lg[_-]/i, /\blg[_-]/i],
  wheel: [/wheel/i, /tire/i, /tyre/i, /^[fn]lg_.*(_in|_out)/i],
  aileron: [/aileron/i],
  elevator: [/elevator/i, /stabilator/i],
  rudder: [/rudder/i],
  flap: [/flap/i],
  spoiler: [/spoiler/i, /airbrake/i, /speedbrake/i],
  // 'blades_1..4' is how the FlightGear airliners name engine fans.
  engine: [/engine/i, /\bfan\b/i, /blades?[_-]?\d/i, /prop/i, /turbine/i, /nacelle/i],
  door: [/door/i],
  light: [/light/i, /beacon/i, /strobe/i, /nav[_-]?l/i],
};

/**
 * Bucket a node name into the semantic controls it might drive.
 *
 * @param {string} name - Node or mesh name.
 * @returns {string[]} Matching control keys.
 */
function classify(name) {
  const hits = [];
  for (const [key, patterns] of Object.entries(SEMANTIC_HINTS)) {
    if (patterns.some((re) => re.test(name))) hits.push(key);
  }
  return hits;
}

/**
 * Print one model's inventory and its Flight Sim control availability.
 *
 * @param {string} file - Path to a .glb.
 * @returns {void}
 */
function inspect(file) {
  const gltf = readGlbJson(file);
  const nodes = gltf.nodes || [];
  const meshes = gltf.meshes || [];
  const animations = gltf.animations || [];
  const bytes = fs.statSync(file).size;

  console.log(`\n${'='.repeat(72)}`);
  console.log(`${path.basename(file)}  —  ${(bytes / 1024).toFixed(0)} KB`);
  console.log('='.repeat(72));
  console.log(
    `nodes: ${nodes.length}   meshes: ${meshes.length}   `
    + `animations: ${animations.length}   materials: ${(gltf.materials || []).length}`
  );

  if (animations.length) {
    console.log('\nANIMATION CLIPS');
    animations.forEach((a, i) => {
      console.log(`  [${i}] ${a.name ?? '(unnamed)'}  channels=${(a.channels || []).length}`);
    });
  } else {
    console.log('\nANIMATION CLIPS: none — control surfaces must be driven by node transforms');
  }

  console.log('\nNODES');
  const matches = new Map();
  nodes.forEach((n, i) => {
    const name = n.name ?? `(unnamed ${i})`;
    const tags = classify(name);
    const hasMesh = n.mesh !== undefined;
    const marker = tags.length ? `  << ${tags.join(', ')}` : '';
    console.log(`  [${i}] ${name}${hasMesh ? ' (mesh)' : ''}${marker}`);
    for (const t of tags) {
      if (!matches.has(t)) matches.set(t, []);
      matches.get(t).push(name);
    }
  });

  if (meshes.length) {
    console.log('\nMESHES');
    meshes.forEach((m, i) => {
      console.log(`  [${i}] ${m.name ?? '(unnamed)'}  primitives=${(m.primitives || []).length}`);
    });
  }

  console.log('\nFLIGHT SIM CONTROL AVAILABILITY');
  for (const key of Object.keys(SEMANTIC_HINTS)) {
    const found = matches.get(key);
    console.log(`  ${key.padEnd(10)} ${found ? `FOUND: ${found.join(', ')}` : 'not present — degrade gracefully'}`);
  }
}

const args = process.argv.slice(2);
const targets = args.includes('--all')
  ? fs.readdirSync('public/models').filter((f) => f.endsWith('.glb')).map((f) => path.join('public/models', f))
  : args;

if (!targets.length) {
  console.error('usage: node scripts/inspect-model.mjs <file.glb> [...]  |  --all');
  process.exit(1);
}
for (const t of targets) {
  try {
    inspect(t);
  } catch (err) {
    console.error(`\n${t}: ${err.message}`);
  }
}
