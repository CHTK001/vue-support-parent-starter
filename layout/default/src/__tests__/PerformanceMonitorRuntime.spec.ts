import {
  __resetPerformanceMonitorRuntimeForTests,
  subscribePerformanceMonitor,
} from "../components/lay-performance/monitor-runtime";

class MockWorker {
  static instances: MockWorker[] = [];

  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessage: ((event: MessageEvent<any>) => void) | null = null;
  terminated = false;

  constructor(
    public readonly url: URL | string,
    public readonly options?: WorkerOptions,
  ) {
    MockWorker.instances.push(this);
  }

  emit(data: any) {
    this.onmessage?.({ data } as MessageEvent<any>);
  }

  postMessage() {
    return undefined;
  }

  terminate() {
    this.terminated = true;
  }
}

describe("performance monitor runtime", () => {
  beforeEach(() => {
    MockWorker.instances.length = 0;
    vi.stubGlobal("Worker", MockWorker);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    __resetPerformanceMonitorRuntimeForTests();
  });

  afterEach(() => {
    __resetPerformanceMonitorRuntimeForTests();
    vi.unstubAllGlobals();
  });

  it("reuses a single worker across subscribers", () => {
    const firstSnapshots: number[] = [];
    const secondSnapshots: number[] = [];

    const offFirst = subscribePerformanceMonitor(
      (snapshot) => firstSnapshots.push(snapshot.fps),
      { immediate: false },
    );
    const offSecond = subscribePerformanceMonitor(
      (snapshot) => secondSnapshots.push(snapshot.fps),
      { immediate: false },
    );

    expect(MockWorker.instances).toHaveLength(1);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

    MockWorker.instances[0].emit({
      fps: 58,
      cpuLoad: 18,
      history: new Array(20).fill(58),
      memory: null,
    });

    expect(firstSnapshots).toEqual([58]);
    expect(secondSnapshots).toEqual([58]);

    offFirst();
    expect(MockWorker.instances[0].terminated).toBe(false);

    offSecond();
    expect(MockWorker.instances[0].terminated).toBe(true);
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it("falls back to main-thread processing when Worker is unavailable", () => {
    let scheduledFrame: FrameRequestCallback | null = null;
    const snapshots: number[] = [];

    vi.stubGlobal("Worker", undefined);
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      scheduledFrame = callback;
      return 7;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal("performance", {
      now: () => 1000,
      memory: {
        usedJSHeapSize: 1024 * 1024,
        jsHeapSizeLimit: 8 * 1024 * 1024,
      },
    });
    __resetPerformanceMonitorRuntimeForTests();

    const off = subscribePerformanceMonitor(
      (snapshot) => snapshots.push(snapshot.fps),
      { immediate: false },
    );

    scheduledFrame?.(1200);

    expect(snapshots).toHaveLength(1);

    off();
  });
});
