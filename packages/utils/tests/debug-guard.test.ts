import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const detectorMock = vi.hoisted(() => {
  const detectorState = {
    listener: null as ((isOpen: boolean) => void) | null,
  };

  return {
    detectorState,
    addListener: vi.fn((listener: (isOpen: boolean) => void) => {
      detectorState.listener = listener;
    }),
    removeListener: vi.fn((listener: (isOpen: boolean) => void) => {
      if (detectorState.listener === listener) {
        detectorState.listener = null;
      }
    }),
    launch: vi.fn(),
    stop: vi.fn(),
  };
});

vi.mock("devtools-detector", () => ({
  addListener: detectorMock.addListener,
  removeListener: detectorMock.removeListener,
  launch: detectorMock.launch,
  stop: detectorMock.stop,
}));

import {
  __resetDebugRuntimeForTests,
  loopDebugger,
  redirectDebugger,
  stopLoopDebugger,
  stopRedirectDebugger,
} from "../src/debug";

describe("debug guard runtime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    detectorMock.detectorState.listener = null;
    detectorMock.addListener.mockClear();
    detectorMock.removeListener.mockClear();
    detectorMock.launch.mockClear();
    detectorMock.stop.mockClear();
    __resetDebugRuntimeForTests();
  });

  afterEach(() => {
    __resetDebugRuntimeForTests();
    vi.useRealTimers();
  });

  it("keeps loopDebugger idempotent", () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

    loopDebugger();
    loopDebugger();

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    stopLoopDebugger();
  });

  it("shows and clears the guard overlay through redirectDebugger lifecycle", () => {
    redirectDebugger();
    redirectDebugger();

    expect(detectorMock.addListener).toHaveBeenCalledTimes(1);
    expect(detectorMock.launch).toHaveBeenCalledTimes(1);

    detectorMock.detectorState.listener?.(true);
    expect(document.getElementById("repo-debug-guard-overlay")).not.toBeNull();
    expect(document.documentElement.dataset.debugGuardActive).toBe("true");

    stopRedirectDebugger();

    expect(detectorMock.removeListener).toHaveBeenCalledTimes(1);
    expect(detectorMock.stop).toHaveBeenCalledTimes(1);
    expect(document.getElementById("repo-debug-guard-overlay")).toBeNull();
    expect(document.documentElement.dataset.debugGuardActive).toBeUndefined();
  });
});
