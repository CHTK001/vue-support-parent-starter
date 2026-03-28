export interface ClockSubscriptionOptions {
  immediate?: boolean;
}

export type ClockListener = (now: number) => void;

const DEFAULT_CLOCK_INTERVAL = 1000;

let sharedWorker: Worker | null = null;
let fallbackTimer: ReturnType<typeof setInterval> | null = null;
let lastTimestamp = Date.now();
const listeners = new Set<ClockListener>();

const emitClock = (now: number) => {
  lastTimestamp = now;
  listeners.forEach((listener) => {
    try {
      listener(now);
    } catch (error) {
      console.error("[clock] listener execution failed", error);
    }
  });
};

const stopFallbackClock = () => {
  if (!fallbackTimer) return;
  clearInterval(fallbackTimer);
  fallbackTimer = null;
};

const stopSharedWorker = () => {
  if (!sharedWorker) return;
  try {
    sharedWorker.postMessage({ type: "dispose" });
  } catch {
    // noop
  }
  sharedWorker.terminate();
  sharedWorker = null;
};

const stopClockSource = () => {
  stopSharedWorker();
  stopFallbackClock();
};

const ensureFallbackClock = () => {
  if (fallbackTimer) return;
  fallbackTimer = setInterval(() => {
    emitClock(Date.now());
  }, DEFAULT_CLOCK_INTERVAL);
};

const ensureSharedWorker = () => {
  if (sharedWorker || fallbackTimer || !listeners.size) return;
  if (typeof Worker === "undefined") {
    ensureFallbackClock();
    return;
  }

  try {
    sharedWorker = new Worker(new URL("./clock.worker.ts", import.meta.url), {
      type: "module",
    });
    sharedWorker.onmessage = (event: MessageEvent<{ now?: number }>) => {
      emitClock(event.data?.now ?? Date.now());
    };
    sharedWorker.onerror = () => {
      stopSharedWorker();
      ensureFallbackClock();
    };
  } catch {
    stopSharedWorker();
    ensureFallbackClock();
  }
};

export const getSharedClockTimestamp = (): number => lastTimestamp;

export const subscribeClock = (
  listener: ClockListener,
  options: ClockSubscriptionOptions = {},
): (() => void) => {
  listeners.add(listener);
  ensureSharedWorker();

  if (options.immediate !== false) {
    listener(lastTimestamp);
  }

  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      stopClockSource();
    }
  };
};

export const __resetClockRuntimeForTests = () => {
  listeners.clear();
  stopClockSource();
  lastTimestamp = Date.now();
};
