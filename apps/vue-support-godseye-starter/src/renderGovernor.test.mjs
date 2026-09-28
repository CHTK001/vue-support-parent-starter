import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  installRenderGovernor,
  holdContinuousRender,
  releaseContinuousRender,
  governorRequestRender,
  getRenderGovernorDiagnostics,
  setGovernorTargetHz,
  _resetRenderGovernorForTest,
  _setGovernorSchedulerForTest,
} from './renderGovernor.js';

function makeViewer() {
  const calls = { requestRender: 0 };
  const scene = {
    requestRenderMode: false,
    maximumRenderTimeChange: 0,
    requestRender() { calls.requestRender += 1; },
  };
  return { viewer: { scene }, scene, calls };
}

/**
 * A controllable frame clock, so the pump can be observed without real time.
 *
 * @returns {{tick: Function, frames: Function, cancelled: Function}}
 */
function fakeFrames() {
  let nextId = 1;
  let queued = null;
  const cancelled = [];
  _setGovernorSchedulerForTest({
    raf: (fn) => { queued = fn; return nextId++; },
    cancel: (id) => {
      cancelled.push(id);
      queued = null;
    },
  });
  return {
    /** Advance one frame at timestamp `t`. */
    tick(t) {
      const fn = queued;
      queued = null;
      if (fn) fn(t);
    },
    pending: () => queued !== null,
    cancelled: () => cancelled,
  };
}

beforeEach(() => _resetRenderGovernorForTest());

test('install with zero holds enters idle mode and pins maximumRenderTimeChange', () => {
  const { viewer, scene } = makeViewer();
  installRenderGovernor(viewer);
  assert.equal(scene.requestRenderMode, true);
  assert.equal(scene.maximumRenderTimeChange, Infinity);
  assert.equal(getRenderGovernorDiagnostics().mode, 'idle');
});

test('a hold pumps frames without surrendering requestRenderMode', () => {
  // THE CHANGE THIS PINS. A hold used to set requestRenderMode = false, which
  // hands the loop to Cesium to run flat out at the display's refresh rate with
  // no cap. Fifteen reasons can take a hold, so enabling one data layer — the
  // entire point of the app — left it there for the rest of the session.
  // Rendering continuously and rendering as fast as possible are not the same
  // thing, and only the first was ever wanted.
  const frames = fakeFrames();
  const { viewer, scene, calls } = makeViewer();
  installRenderGovernor(viewer);
  const settleBaseline = calls.requestRender;
  holdContinuousRender('flights');
  assert.equal(scene.requestRenderMode, true, 'requestRenderMode must never be surrendered');
  assert.equal(getRenderGovernorDiagnostics().mode, 'continuous');
  assert.ok(frames.pending(), 'a hold must start the pump');
  releaseContinuousRender('flights');
  assert.equal(scene.requestRenderMode, true);
  // Leaving continuous renders one settling frame.
  assert.equal(calls.requestRender, settleBaseline + 1);
});

test('the pump paces frames instead of asking for every one', () => {
  const frames = fakeFrames();
  const { viewer, calls } = makeViewer();
  installRenderGovernor(viewer);
  setGovernorTargetHz(60);           // one frame per 16.67 ms
  holdContinuousRender('flights');
  const baseline = calls.requestRender;
  frames.tick(0);                    // first frame: renders
  frames.tick(4);                    // 4 ms later: too soon
  frames.tick(8);                    // still too soon
  frames.tick(12);
  assert.equal(calls.requestRender, baseline + 1, 'sub-interval frames must be skipped');
  frames.tick(20);                   // past the interval
  assert.equal(calls.requestRender, baseline + 2);
});

test('releasing the last hold stops the pump rather than leaving it spinning', () => {
  const frames = fakeFrames();
  const { viewer } = makeViewer();
  installRenderGovernor(viewer);
  holdContinuousRender('flights');
  frames.tick(0);
  releaseContinuousRender('flights');
  assert.ok(frames.cancelled().length > 0, 'the pump must be cancelled, not abandoned');
});

test('holds are identity-keyed: double-hold cannot leak, double-release cannot corrupt', () => {
  const { viewer, scene } = makeViewer();
  installRenderGovernor(viewer);
  holdContinuousRender('traffic');
  holdContinuousRender('traffic');
  releaseContinuousRender('traffic');
  assert.equal(scene.requestRenderMode, true, 'single release clears an idempotent double-hold');
  releaseContinuousRender('traffic');
  releaseContinuousRender('never-held');
  assert.equal(scene.requestRenderMode, true);
});

test('mode stays continuous until the LAST holder releases', () => {
  const { viewer, scene } = makeViewer();
  installRenderGovernor(viewer);
  holdContinuousRender('flights');
  holdContinuousRender('satellites');
  releaseContinuousRender('flights');
  assert.deepEqual(getRenderGovernorDiagnostics().holds, ['satellites']);
  assert.equal(getRenderGovernorDiagnostics().mode, 'continuous');
  releaseContinuousRender('satellites');
  assert.equal(getRenderGovernorDiagnostics().mode, 'idle');
  assert.equal(scene.requestRenderMode, true);
});

test('governorRequestRender forwards to the scene and records reasons only in idle mode', () => {
  const { viewer, calls } = makeViewer();
  installRenderGovernor(viewer);
  const baseline = calls.requestRender;
  governorRequestRender('layer-tick:earthquakes');
  assert.equal(calls.requestRender, baseline + 1);
  assert.equal(getRenderGovernorDiagnostics().recentRequests.at(-1).reason, 'layer-tick:earthquakes');
  holdContinuousRender('flights');
  const idleRequests = getRenderGovernorDiagnostics().recentRequests.length;
  governorRequestRender('slider');
  assert.equal(
    getRenderGovernorDiagnostics().recentRequests.length,
    idleRequests,
    'continuous-mode requests are not recorded as idle diagnostics',
  );
});

test('hold/release/request are safe no-ops before install (test environments without a viewer)', () => {
  holdContinuousRender('flights');
  releaseContinuousRender('flights');
  governorRequestRender('noop');
  assert.equal(getRenderGovernorDiagnostics().installed, false);
});

test('holds registered before install apply at install time', () => {
  holdContinuousRender('flights');
  const { viewer, scene } = makeViewer();
  installRenderGovernor(viewer);
  assert.equal(getRenderGovernorDiagnostics().mode, 'continuous',
    'a pre-install hold must still be honoured at install time');
  assert.equal(scene.requestRenderMode, true);
  releaseContinuousRender('flights');
  assert.equal(getRenderGovernorDiagnostics().mode, 'idle');
});
