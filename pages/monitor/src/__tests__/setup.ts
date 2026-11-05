/**
 * @pages/monitor 测试环境补集：jsdom 不提供 hairline 图引擎在 stage.ts 里需要的
 * IntersectionObserver / matchMedia，给它只占位的版本。图的生命周期由
 * register 自己的 tick(0, now) 驱动，不依赖取交判断。
 */
declare global {
  interface Window {
    IntersectionObserver?: typeof IntersectionObserver;
    matchMedia?: (query: string) => MediaQueryList;
  }
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  class IntersectionObserver {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(readonly callback: (entries: any[]) => void) {}
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): never[] {
      return [];
    }
  }
  globalThis.IntersectionObserver = IntersectionObserver;
}

if (typeof globalThis.matchMedia === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList;
}
