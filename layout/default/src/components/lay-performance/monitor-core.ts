export interface MonitorMemorySnapshot {
  used: string;
  limit: string;
}

export interface MonitorSnapshot {
  fps: number;
  cpuLoad: number;
  history: number[];
  memory: MonitorMemorySnapshot | null;
}

export interface MonitorTickInput {
  now: number;
  frameDuration: number;
  memory?: MonitorMemorySnapshot | null;
}

export interface MonitorRuntimeState {
  frameCount: number;
  lastFpsWindowStart: number;
  lastEmitAt: number;
  fps: number;
  cpuLoad: number;
  memory: MonitorMemorySnapshot | null;
  fpsHistory: number[];
  frameTimes: number[];
}

const IDEAL_FRAME_TIME = 16.67;
const MIN_FRAME_TIME = 8;
const MAX_FRAME_TIME = 100;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const calculateCpuLoad = (avgFrameTime: number) => {
  if (avgFrameTime <= MIN_FRAME_TIME) {
    return (avgFrameTime / MIN_FRAME_TIME) * 10;
  }
  if (avgFrameTime <= IDEAL_FRAME_TIME) {
    return (
      10 +
      ((avgFrameTime - MIN_FRAME_TIME) / (IDEAL_FRAME_TIME - MIN_FRAME_TIME)) *
        10
    );
  }
  if (avgFrameTime <= MAX_FRAME_TIME) {
    return (
      20 +
      ((avgFrameTime - IDEAL_FRAME_TIME) /
        (MAX_FRAME_TIME - IDEAL_FRAME_TIME)) *
        80
    );
  }
  return 100;
};

export const createMonitorRuntimeState = (
  historyLength = 20,
  initialFps = 60,
): MonitorRuntimeState => ({
  frameCount: 0,
  lastFpsWindowStart: 0,
  lastEmitAt: 0,
  fps: initialFps,
  cpuLoad: 0,
  memory: null,
  fpsHistory: new Array(historyLength).fill(initialFps),
  frameTimes: [],
});

export const createMonitorSnapshot = (
  state: MonitorRuntimeState,
): MonitorSnapshot => ({
  fps: state.fps,
  cpuLoad: state.cpuLoad,
  history: [...state.fpsHistory],
  memory: state.memory,
});

export const createMonitorRuntimeStateFromSnapshot = (
  snapshot: MonitorSnapshot,
): MonitorRuntimeState => ({
  frameCount: 0,
  lastFpsWindowStart: 0,
  lastEmitAt: 0,
  fps: snapshot.fps,
  cpuLoad: snapshot.cpuLoad,
  memory: snapshot.memory,
  fpsHistory: [...snapshot.history],
  frameTimes: [],
});

export const applyMonitorTick = (
  state: MonitorRuntimeState,
  input: MonitorTickInput,
): MonitorSnapshot | null => {
  if (!Number.isFinite(input.now) || !Number.isFinite(input.frameDuration)) {
    return null;
  }

  if (!state.lastFpsWindowStart) {
    state.lastFpsWindowStart = input.now;
  }

  state.frameCount += 1;
  state.frameTimes.push(input.frameDuration);
  if (state.frameTimes.length > 60) {
    state.frameTimes.shift();
  }

  const avgFrameTime =
    state.frameTimes.length >= 3
      ? state.frameTimes.reduce((sum, duration) => sum + duration, 0) /
        state.frameTimes.length
      : input.frameDuration;

  state.cpuLoad = clamp(calculateCpuLoad(avgFrameTime), 0, 100);

  if (input.memory !== undefined) {
    state.memory = input.memory;
  }

  let shouldEmit = input.now - state.lastEmitAt >= 200;
  if (input.now - state.lastFpsWindowStart >= 1000) {
    state.fps = Math.round(
      (state.frameCount * 1000) / (input.now - state.lastFpsWindowStart),
    );
    state.frameCount = 0;
    state.lastFpsWindowStart = input.now;
    state.fpsHistory = [...state.fpsHistory.slice(1), state.fps];
    shouldEmit = true;
  }

  if (!shouldEmit) {
    return null;
  }

  state.lastEmitAt = input.now;
  return createMonitorSnapshot(state);
};
