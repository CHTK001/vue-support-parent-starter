import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { getInitialConfig, putConfig } from "@repo/config";
import { useThemeStore } from "../stores/themeStore";

const globalStorage = {
  configure: {},
} as any;

vi.mock("@pureadmin/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@pureadmin/utils")>();
  return {
    ...actual,
    useGlobal: () => ({
      $storage: globalStorage,
    }),
  };
});

vi.mock("@repo/core", () => ({
  emitter: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
  useUserStoreHook: () => ({
    username: "",
    roles: [],
  }),
}));

vi.mock("../themes", () => ({
  layoutThemes: [],
  getLayoutTheme: vi.fn(() => null),
  loadThemeStylesheet: vi.fn(),
}));

vi.mock("../utils/loadThemeFont", () => ({
  loadThemeFont: vi.fn(),
}));

vi.mock("@repo/utils", () => ({
  getLogger: () => ({
    debug: vi.fn(),
  }),
}));

describe("theme store runtime config", () => {
  let store: ReturnType<typeof useThemeStore> | null = null;

  afterEach(() => {
    store?.$dispose();
    store = null;
    localStorage.clear();
    globalStorage.configure = {};
    putConfig("ShowFpsMonitor", getInitialConfig("ShowFpsMonitor"));
    putConfig(
      "PerformanceMonitorLayout",
      getInitialConfig("PerformanceMonitorLayout"),
    );
  });

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("follows runtime fps config updates when no local override exists", async () => {
    localStorage.removeItem("sys-fps-monitor-enabled");
    putConfig("ShowFpsMonitor", false);

    store = useThemeStore();
    expect(store.fpsMonitorEnabled).toBe(false);

    putConfig("ShowFpsMonitor", true);
    await nextTick();

    expect(store.fpsMonitorEnabled).toBe(true);
  });

  it("keeps local fps override when runtime config changes", async () => {
    localStorage.setItem("sys-fps-monitor-enabled", "false");
    putConfig("ShowFpsMonitor", true);

    store = useThemeStore();
    expect(store.fpsMonitorEnabled).toBe(false);

    putConfig("ShowFpsMonitor", false);
    await nextTick();

    expect(store.fpsMonitorEnabled).toBe(false);
  });

  it("uses runtime monitor layout config when local storage is absent", async () => {
    localStorage.removeItem("sys-performance-monitor-layout");
    putConfig("PerformanceMonitorLayout", "split");

    store = useThemeStore();
    expect(store.performanceMonitorLayout).toBe("split");

    putConfig("PerformanceMonitorLayout", "merged");
    await nextTick();

    expect(store.performanceMonitorLayout).toBe("merged");
  });
});
