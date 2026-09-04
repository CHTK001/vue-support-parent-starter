import test from 'node:test';
import assert from 'node:assert/strict';

import { createMarkerBatch } from './markerBatch.js';

/** A scene stub that records what the collection is asked to do. */
function makeScene() {
  const added = [];
  let removeAllCalls = 0;
  const collection = {
    show: true,
    get length() { return added.length; },
    add(p) { added.push(p); return p; },
    removeAll() { removeAllCalls += 1; added.length = 0; },
  };
  const primitives = {
    items: [],
    add(c) { this.items.push(collection); return collection; },
    remove(c) { this.items = this.items.filter((x) => x !== c); return true; },
  };
  return { scene: { primitives }, added, collection, removeAllCount: () => removeAllCalls };
}

/** Drain the setTimeout-based chunk scheduler. */
const drain = () => new Promise((resolve) => setTimeout(resolve, 0));

test('every point lands in ONE collection, not one primitive each', async () => {
  // THE WHOLE POINT. Eleven thousand entities is eleven thousand primitives,
  // each with its own draw call. Batched, they are one buffer.
  const env = makeScene();
  const batch = createMarkerBatch({ scene: env.scene, chunkSize: 500 });
  const points = Array.from({ length: 1200 }, (_, i) => ({ lon: i % 180, lat: (i % 80) - 40, size: 5 }));
  batch.setPoints(points);
  for (let i = 0; i < 8 && batch.building(); i += 1) await drain();
  assert.equal(env.scene.primitives.items.length, 1, 'exactly one collection');
  assert.equal(env.added.length, 1200);
});

test('a large build is chunked, not done in one blocking pass', async () => {
  // A synchronous loop over ten thousand points is what froze the tab for
  // seconds. The first chunk must complete and yield with work still pending.
  const env = makeScene();
  const batch = createMarkerBatch({ scene: env.scene, chunkSize: 100 });
  batch.setPoints(Array.from({ length: 1000 }, () => ({ lon: 0, lat: 0 })));
  assert.equal(env.added.length, 100, 'only the first chunk runs synchronously');
  assert.equal(batch.building(), true, 'the rest is still queued');
  for (let i = 0; i < 20 && batch.building(); i += 1) await drain();
  assert.equal(env.added.length, 1000);
  assert.equal(batch.building(), false);
});

test('progress is reported as chunks land, so a slow build can be shown', async () => {
  const env = makeScene();
  const seen = [];
  const batch = createMarkerBatch({
    scene: env.scene, chunkSize: 250,
    onProgress: (done, total) => seen.push([done, total]),
  });
  batch.setPoints(Array.from({ length: 1000 }, () => ({ lon: 1, lat: 1 })));
  for (let i = 0; i < 20 && batch.building(); i += 1) await drain();
  assert.deepEqual(seen, [[250, 1000], [500, 1000], [750, 1000], [1000, 1000]]);
});

test('a rebuild abandons the previous build instead of interleaving with it', async () => {
  // Toggling a filter twice quickly must not leave points from the first build
  // mixed into the second — the count would be wrong and markers would be
  // stale.
  const env = makeScene();
  const batch = createMarkerBatch({ scene: env.scene, chunkSize: 100 });
  batch.setPoints(Array.from({ length: 1000 }, () => ({ lon: 0, lat: 0, size: 1 })));
  batch.setPoints(Array.from({ length: 300 }, () => ({ lon: 2, lat: 2, size: 9 })));
  for (let i = 0; i < 20 && batch.building(); i += 1) await drain();
  assert.equal(env.added.length, 300, 'only the second build survives');
  assert.ok(env.added.every((p) => p.pixelSize === 9));
});

test('rows without usable coordinates are skipped, not added as NaN', async () => {
  const env = makeScene();
  const batch = createMarkerBatch({ scene: env.scene, chunkSize: 100 });
  batch.setPoints([
    { lon: 1, lat: 1 },
    { lon: 'x', lat: 1 },
    { lon: 1 },
    null,
    { lon: 2, lat: 2 },
  ]);
  for (let i = 0; i < 8 && batch.building(); i += 1) await drain();
  assert.equal(env.added.length, 2);
});

test('the pick id is carried through so a click can identify the point', async () => {
  const env = makeScene();
  const batch = createMarkerBatch({ scene: env.scene, chunkSize: 10 });
  batch.setPoints([{ lon: 0, lat: 0, id: { airport: { name: 'Heathrow' } } }]);
  for (let i = 0; i < 8 && batch.building(); i += 1) await drain();
  assert.equal(env.added[0].id.airport.name, 'Heathrow');
});

test('depth test distance is finite, so markers never show through the planet', async () => {
  const env = makeScene();
  const batch = createMarkerBatch({ scene: env.scene, chunkSize: 10 });
  batch.setPoints([{ lon: 0, lat: 0 }]);
  for (let i = 0; i < 8 && batch.building(); i += 1) await drain();
  assert.ok(Number.isFinite(env.added[0].disableDepthTestDistance));
});

test('an empty set clears the collection and reports done', async () => {
  const env = makeScene();
  let doneWith = null;
  const batch = createMarkerBatch({
    scene: env.scene, chunkSize: 10, onDone: (n) => { doneWith = n; },
  });
  batch.setPoints([{ lon: 0, lat: 0 }]);
  for (let i = 0; i < 8 && batch.building(); i += 1) await drain();
  batch.setPoints([]);
  assert.equal(env.added.length, 0);
  assert.equal(doneWith, 0);
});

test('clear stops an in-flight build rather than letting it finish', async () => {
  const env = makeScene();
  const batch = createMarkerBatch({ scene: env.scene, chunkSize: 50 });
  batch.setPoints(Array.from({ length: 5000 }, () => ({ lon: 0, lat: 0 })));
  batch.clear();
  for (let i = 0; i < 10; i += 1) await drain();
  assert.equal(batch.building(), false);
  assert.equal(env.added.length, 0);
});

test('visibility toggles the collection without rebuilding it', async () => {
  const env = makeScene();
  const batch = createMarkerBatch({ scene: env.scene, chunkSize: 100 });
  batch.setPoints(Array.from({ length: 200 }, () => ({ lon: 0, lat: 0 })));
  for (let i = 0; i < 8 && batch.building(); i += 1) await drain();
  const before = env.added.length;
  batch.setVisible(false);
  assert.equal(env.collection.show, false);
  batch.setVisible(true);
  assert.equal(env.collection.show, true);
  assert.equal(env.added.length, before, 'toggling must not rebuild');
});

test('a render is requested as chunks land, so points appear progressively', async () => {
  let renders = 0;
  const env = makeScene();
  const batch = createMarkerBatch({
    scene: env.scene, chunkSize: 100, requestRender: () => { renders += 1; },
  });
  batch.setPoints(Array.from({ length: 300 }, () => ({ lon: 0, lat: 0 })));
  for (let i = 0; i < 10 && batch.building(); i += 1) await drain();
  assert.equal(renders, 3);
});
