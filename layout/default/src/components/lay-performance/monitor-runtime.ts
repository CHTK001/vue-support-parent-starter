import {
  applyMonitorTick,
  createMonitorRuntimeState,
  createMonitorRuntimeStateFromSnapshot,
  createMonitorSnapshot,
  type MonitorMemorySnapshot,
  type MonitorSnapshot,
} from "./monitor-core";

export interface MonitorSubscriptionOptions {
  immediate?: boolean;
}

export type MonitorListener = (snapshot: MonitorSnapshot) => void;

interface MonitorWorkerInput {
  type: "init" | "tick";
  historyLength?: number;
  initialFps?: number;
  now?: number;
  frameDuration?: number;
  memory?: MonitorMemorySnapshot | null;
}

const DEFAULT_HISTORY_LENGTH = 20;
const DEFAULT_INITIAL_FPS = 60;

let sharedWorker: Worker | null = null;
let animationFrameId = 0;
let lastFrameTime = 0;
let lastMemorySyncTime = 0;
let fallbackState = createMonitorRuntimeState(
  DEFAULT_HISTORY_LENGTH,
  DEFAULT_INITIAL_FPS,
);
let currentSnapshot = createMonitorSnapshot(fallbackState);
const listeners = new Set<MonitorListener>();

const emitSnapshot = (snapshot: MonitorSnapshot) => {
  currentSnapshot = snapshot;
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (error) {
      console.error("[performance-monitor] listener execution failed", error);
    }
  });
};

const readMemorySnapshot = (): MonitorMemorySnapshot | null => {
  const perf = globalThis.performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (!perf?.memory) {
    return null;
  }

  return {
    used: (perf.memory.usedJSHeapSize / 1048576).toFixed(2),
    limit: (perf.memory.jsHeapSizeLimit / 1048576).toFixed(2),
  };
};

const stopSharedWorker = () => {
  if (!sharedWorker) return;
  sharedWorker.terminate();
  sharedWorker = null;
};

const stopMonitoringLoop = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
  }
};

const stopMonitorSource = () => {
  stopMonitoringLoop();
  stopSharedWorker();
};

const handleFallbackTick = (now: number, frameDuration: number) => {
  const shouldSyncMemory = now - lastMemorySyncTime >= 1000;
  if (shouldSyncMemory) {
    lastMemorySyncTime = now;
  }

  const snapshot = applyMonitorTick(fallbackState, {
    now,
    frameDuration,
    memory: shouldSyncMemory ? readMemorySnapshot() : undefined,
  });
  if (snapshot) {
    emitSnapshot(snapshot);
  }
};

const collectMetrics = (now: number) => {
  if (!listeners.size) {
    animationFrameId = 0;
    return;
  }

  const frameDuration = now - lastFrameTime;
  lastFrameTime = now;

  const shouldSyncMemory = now - lastMemorySyncTime >= 1000;
  if (shouldSyncMemory) {
    lastMemorySyncTime = now;
  }

  if (sharedWorker) {
    sharedWorker.postMessage({
      type: "tick",
      now,
      frameDuration,
      memory: shouldSyncMemory ? readMemorySnapshot() : undefined,
    } satisfies MonitorWorkerInput);
  } else {
    handleFallbackTick(now, frameDuration);
  }

  animationFrameId = requestAnimationFrame(collectMetrics);
};

const ensureSharedWorker = () => {
  if (sharedWorker || typeof Worker === "undefined") {
    return;
  }

  try {
    sharedWorker = new Worker(new URL("./fps-monitor.worker.ts", import.meta.url), {
      type: "module",
    });
    sharedWorker.onmessage = (event: MessageEvent<MonitorSnapshot>) => {
      emitSnapshot(event.data);
    };
    sharedWorker.onerror = () => {
      fallbackState = createMonitorRuntimeStateFromSnapshot(currentSnapshot);
      stopSharedWorker();
    };
    sharedWorker.postMessage({
      type: "init",
      historyLength: currentSnapshot.history.length || DEFAULT_HISTORY_LENGTH,
      initialFps: currentSnapshot.fps || DEFAULT_INITIAL_FPS,
    } satisfies MonitorWorkerInput);
  } catch {
    sharedWorker = null;
  }
};

const ensureMonitoringLoop = () => {
  if (animationFrameId || !listeners.size) {
    return;
  }

  ensureSharedWorker();
  lastFrameTime = performance.now();
  lastMemorySyncTime = 0;
  animationFrameId = requestAnimationFrame(collectMetrics);
};

export const getSharedMonitorSnapshot = (): MonitorSnapshot => currentSnapshot;

export const subscribePerformanceMonitor = (
  listener: MonitorListener,
  options: MonitorSubscriptionOptions = {},
): (() => void) => {
  listeners.add(listener);
  ensureMonitoringLoop();

  if (options.immediate !== false) {
    listener(currentSnapshot);
  }

  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      stopMonitorSource();
    }
  };
};

export const __resetPerformanceMonitorRuntimeForTests = () => {
  listeners.clear();
  stopMonitorSource();
  fallbackState = createMonitorRuntimeState(
    DEFAULT_HISTORY_LENGTH,
    DEFAULT_INITIAL_FPS,
  );
  currentSnapshot = createMonitorSnapshot(fallbackState);
  lastFrameTime = 0;
  lastMemorySyncTime = 0;
};
