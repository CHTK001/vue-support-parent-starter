import test from 'node:test';
import assert from 'node:assert/strict';

import { createHoverPickThrottle } from './hoverPick.js';

/** A controllable clock and frame scheduler, so nothing here waits on real time. */
function harness({ buttonDown = false, intervalMs = 66, minDistancePx = 4 } = {}) {
  let clock = 1000;
  const frames = [];
  const picked = [];
  const scene = {
    screenSpaceCameraController: {
      _aggregator: { isButtonDown: () => buttonDown },
    },
  };
  const throttle = createHoverPickThrottle({
    scene,
    pick: (p) => picked.push({ ...p }),
    intervalMs,
    minDistancePx,
    now: () => clock,
    schedule: (fn) => { frames.push(fn); },
  });
  return {
    throttle, picked,
    advance: (ms) => { clock += ms; },
    flush: () => { const due = frames.splice(0); due.forEach((fn) => fn()); },
    pendingFrames: () => frames.length,
    setButton: (v) => { scene.screenSpaceCameraController._aggregator.isButtonDown = () => v; },
  };
}

test('a burst of mouse moves produces a single pick', () => {
  // THE COST THIS REPLACES. Every raw mousemove ran a twelve-deep drillPick —
  // twelve scene renders and twelve synchronous GPU readbacks — just to choose
  // a cursor. A trackpad can emit 120 of those a second.
  const h = harness();
  for (let i = 0; i < 60; i += 1) h.throttle.handle({ x: 100 + i, y: 100 });
  h.flush();
  assert.equal(h.picked.length, 1);
});

test('the pick lands where the pointer ended, not where the burst began', () => {
  const h = harness();
  h.throttle.handle({ x: 10, y: 10 });
  h.throttle.handle({ x: 300, y: 40 });
  h.throttle.handle({ x: 640, y: 80 });
  h.flush();
  assert.deepEqual(h.picked, [{ x: 640, y: 80 }]);
});

test('nothing is picked while the camera is being dragged', () => {
  // During a drag the cursor affordance is irrelevant and the readback競 with
  // the interaction the user is actually performing.
  const h = harness({ buttonDown: true });
  for (let i = 0; i < 20; i += 1) h.throttle.handle({ x: i * 10, y: 50 });
  h.flush();
  assert.equal(h.picked.length, 0);
});

test('picking resumes once the drag ends', () => {
  const h = harness({ buttonDown: true });
  h.throttle.handle({ x: 10, y: 10 });
  h.flush();
  assert.equal(h.picked.length, 0);
  h.setButton(false);
  h.throttle.handle({ x: 200, y: 200 });
  h.flush();
  assert.equal(h.picked.length, 1);
});

test('a pointer that has barely moved is not re-picked', () => {
  const h = harness();
  h.throttle.handle({ x: 100, y: 100 });
  h.flush();
  assert.equal(h.picked.length, 1);
  h.advance(500);
  h.throttle.handle({ x: 102, y: 101 });   // under 4 px
  h.flush();
  assert.equal(h.picked.length, 1, 'sub-threshold movement triggered a pick');
});

test('a real move after the interval picks again', () => {
  const h = harness();
  h.throttle.handle({ x: 100, y: 100 });
  h.flush();
  h.advance(200);
  h.throttle.handle({ x: 400, y: 400 });
  h.flush();
  assert.equal(h.picked.length, 2);
});

test('moves inside the interval are held, not dropped, and fire once after it', () => {
  const h = harness({ intervalMs: 66 });
  h.throttle.handle({ x: 0, y: 0 });
  h.flush();
  assert.equal(h.picked.length, 1);
  h.advance(10);
  h.throttle.handle({ x: 500, y: 500 });   // too soon
  h.flush();
  assert.equal(h.picked.length, 1);
  h.advance(100);                          // interval has now elapsed
  h.throttle.handle({ x: 520, y: 520 });
  h.flush();
  assert.equal(h.picked.length, 2);
  assert.deepEqual(h.picked[1], { x: 520, y: 520 });
});

test('cancel drops queued work rather than firing it later', () => {
  const h = harness();
  h.throttle.handle({ x: 10, y: 10 });
  h.throttle.cancel();
  h.flush();
  assert.equal(h.picked.length, 0);
});

test('a missing position is ignored instead of throwing', () => {
  const h = harness();
  h.throttle.handle(null);
  h.throttle.handle(undefined);
  h.flush();
  assert.equal(h.picked.length, 0);
});

test('an absent camera controller does not disable picking', () => {
  // A scene without the private aggregator must still pick, not silently
  // refuse every hover.
  const picked = [];
  let clock = 0;
  const frames = [];
  const t = createHoverPickThrottle({
    scene: {},
    pick: (p) => picked.push(p),
    now: () => clock,
    schedule: (fn) => frames.push(fn),
  });
  t.handle({ x: 5, y: 5 });
  frames.splice(0).forEach((fn) => fn());
  assert.equal(picked.length, 1);
});
