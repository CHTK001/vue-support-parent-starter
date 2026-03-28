import {
  __resetClockRuntimeForTests,
  subscribeClock,
} from "../src/time/clock";

class MockWorker {
  static instances: MockWorker[] = [];

  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessage: ((event: MessageEvent<{ now: number }>) => void) | null = null;
  terminated = false;

  constructor(
    public readonly url: URL | string,
    public readonly options?: WorkerOptions,
  ) {
    MockWorker.instances.push(this);
  }

  emit(now: number) {
    this.onmessage?.({ data: { now } } as MessageEvent<{ now: number }>);
  }

  postMessage() {
    return undefined;
  }

  terminate() {
    this.terminated = true;
  }
}

describe("shared clock worker", () => {
  beforeEach(() => {
    vi.stubGlobal("Worker", MockWorker);
    MockWorker.instances.length = 0;
    __resetClockRuntimeForTests();
  });

  afterEach(() => {
    __resetClockRuntimeForTests();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("reuses a single worker across subscribers", () => {
    const firstTicks: number[] = [];
    const secondTicks: number[] = [];

    const offFirst = subscribeClock((now) => firstTicks.push(now), {
      immediate: false,
    });
    const offSecond = subscribeClock((now) => secondTicks.push(now), {
      immediate: false,
    });

    expect(MockWorker.instances).toHaveLength(1);

    MockWorker.instances[0].emit(1234);
    expect(firstTicks).toEqual([1234]);
    expect(secondTicks).toEqual([1234]);

    offFirst();
    expect(MockWorker.instances[0].terminated).toBe(false);

    offSecond();
    expect(MockWorker.instances[0].terminated).toBe(true);
  });

  it("falls back to a timer when Worker is unavailable", () => {
    vi.useFakeTimers();
    vi.unstubAllGlobals();
    __resetClockRuntimeForTests();

    const ticks: number[] = [];
    const off = subscribeClock((now) => ticks.push(now), { immediate: false });

    vi.advanceTimersByTime(1000);
    expect(ticks).toHaveLength(1);

    off();
  });
});
