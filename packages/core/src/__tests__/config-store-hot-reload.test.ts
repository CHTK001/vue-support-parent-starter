import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localStorageState = new Map<string, any>();
const setWatermark = vi.fn();
const clearWatermark = vi.fn();
const crashDebugger = vi.fn();
const loopDebugger = vi.fn();
const redirectDebugger = vi.fn();
const stopCrashDebugger = vi.fn();
const stopLoopDebugger = vi.fn();
const stopRedirectDebugger = vi.fn();
const socketService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  close: vi.fn(),
};
const initGlobalSocketService = vi.fn(() => socketService);
const closeGlobalSocketService = vi.fn();
const setGlobalSocketConfig = vi.fn();
const settingStore = {
  setSetting: vi.fn(),
};

let runtimeConfig: Record<string, any> = {};
let initialConfig: Record<string, any> = {};

vi.mock("@pages/setting", () => ({
  fetchSetting: vi.fn(),
}));

vi.mock("@pureadmin/utils", () => ({
  useWatermark: () => ({
    setWatermark,
    clear: clearWatermark,
  }),
}));

vi.mock("@layout/default", () => ({
  initFontEncryption: vi.fn(),
}));

vi.mock("@repo/utils", () => ({
  localStorageProxy: () => ({
    getItem: (key: string) => localStorageState.get(key) ?? null,
    setItem: (key: string, value: any) => {
      localStorageState.set(key, value);
    },
    removeItem: (key: string) => {
      localStorageState.delete(key);
    },
  }),
  crashDebugger,
  loopDebugger,
  redirectDebugger,
  stopCrashDebugger,
  stopLoopDebugger,
  stopRedirectDebugger,
}));

vi.mock("@repo/config", () => ({
  CONFIG_VERSION_CHANGE_EVENT: "repo-config-version-change",
  buildFrontendSystemConfigOverrides: vi.fn((config: Record<string, any>) => config),
  getConfig: (key?: string) => (key ? runtimeConfig[key] : runtimeConfig),
  getFrontendSystemConfig: vi.fn(() => ({
    themeSkinEnabled: true,
    themeManagementEnabled: true,
    loginThemeSwitcherEnabled: true,
    debugProtectionEnabled: true,
    crashPageOpen: false,
    loopDebuggerOpen: false,
    debugOverlayOpen: true,
    debugBypassEnabled: true,
    debugBypassParamName: "sk",
    debugBypassSecret: "",
    storageEncode: true,
    fontEncryptionEnabled: false,
    fontEncryptionApplyGlobal: false,
    fontEncryptionDisableCopy: false,
    fontEncryptionOcrNoise: false,
    fontEncryptionOcrNoiseLevel: "low",
  })),
  getInitialConfig: (key?: string) => (key ? initialConfig[key] : initialConfig),
  isDevEnvironment: vi.fn(() => false),
  isDebugBypassActive: vi.fn(() => false),
  putConfig: (key: string, value: any) => {
    runtimeConfig[key] = value;
  },
  setConfig: (payload: Record<string, any>) => {
    runtimeConfig = {
      ...runtimeConfig,
      ...payload,
    };
  },
}));

vi.mock("../config/socketService", () => ({
  closeGlobalSocketService,
  getGlobalSocketService: vi.fn(() => null),
  initGlobalSocketService,
  setGlobalSocketConfig,
}));

vi.mock("../store/modules/UserStore", () => ({
  useUserStoreHook: () => ({
    nickname: "sa",
  }),
}));

vi.mock("../store/modules/SettingStore", () => ({
  useSettingStore: () => settingStore,
}));

describe("config store hot reload", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorageState.clear();
    setWatermark.mockReset();
    clearWatermark.mockReset();
    crashDebugger.mockReset();
    loopDebugger.mockReset();
    redirectDebugger.mockReset();
    stopCrashDebugger.mockReset();
    stopLoopDebugger.mockReset();
    stopRedirectDebugger.mockReset();
    socketService.connect.mockReset();
    socketService.disconnect.mockReset();
    socketService.close.mockReset();
    initGlobalSocketService.mockClear();
    closeGlobalSocketService.mockClear();
    setGlobalSocketConfig.mockClear();
    settingStore.setSetting.mockClear();
    runtimeConfig = {
      OpenSetting: true,
      Title: "Base Title",
      BaseUrl: "http://base.local",
      ApiAddress: null,
    };
    initialConfig = {
      Title: "Base Title",
      BaseUrl: "http://base.local",
      ApiAddress: null,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    window.location.hash = "";
  });

  it("hot-applies backend config and clears removed runtime overrides", async () => {
    const { useConfigStore } = await import("../store/modules/ConfigStore");
    const store = useConfigStore();

    await store.doRegister([
      {
        sysSettingGroup: "config",
        sysSettingName: "SystemName",
        sysSettingValue: "Monitor Center",
        sysSettingConfig: "uuid-1",
      },
      {
        sysSettingGroup: "config",
        sysSettingName: "ApiAddress",
        sysSettingValue: "http://api.monitor.local",
        sysSettingConfig: "uuid-2",
      },
      {
        sysSettingGroup: "config",
        sysSettingName: "WatermarkOpen",
        sysSettingValue: "true",
        sysSettingConfig: "uuid-3",
      },
      {
        sysSettingGroup: "config",
        sysSettingName: "SocketOpen",
        sysSettingValue: "true",
        sysSettingConfig: "uuid-4",
      },
      {
        sysSettingGroup: "config",
        sysSettingName: "SocketUrl",
        sysSettingValue: "http://socket.monitor.local:29181",
        sysSettingConfig: "uuid-5",
      },
      {
        sysSettingGroup: "config",
        sysSettingName: "SocketPath",
        sysSettingValue: "/socket.io",
        sysSettingConfig: "uuid-6",
      },
      {
        sysSettingGroup: "config",
        sysSettingName: "SocketProtocol",
        sysSettingValue: "socketio",
        sysSettingConfig: "uuid-7",
      },
      {
        sysSettingGroup: "config",
        sysSettingName: "SocketStartupConnect",
        sysSettingValue: "false",
        sysSettingConfig: "uuid-8",
      },
    ]);

    expect(settingStore.setSetting).toHaveBeenCalledWith(
      "Title",
      "Monitor Center",
    );
    expect(runtimeConfig.ApiAddress).toBe("http://api.monitor.local");
    expect(clearWatermark).toHaveBeenCalledTimes(1);
    expect(setWatermark).toHaveBeenCalledTimes(1);
    expect(setGlobalSocketConfig).toHaveBeenCalledWith({
      protocol: "socketio",
      urls: ["http://socket.monitor.local:29181"],
      context: "/socket.io",
    });
    expect(initGlobalSocketService).toHaveBeenCalledWith({
      protocol: "socketio",
      urls: ["http://socket.monitor.local:29181"],
      context: "/socket.io",
      autoConnect: false,
    });
    expect(socketService.disconnect).toHaveBeenCalledTimes(1);

    settingStore.setSetting.mockClear();

    await store.doRegister([]);

    expect(settingStore.setSetting).toHaveBeenNthCalledWith(
      1,
      "Title",
      "Base Title",
    );
    expect(settingStore.setSetting).toHaveBeenNthCalledWith(
      2,
      "BaseUrl",
      "http://base.local",
    );
    expect(runtimeConfig.ApiAddress).toBeNull();
    expect(clearWatermark).toHaveBeenCalledTimes(2);
    expect(closeGlobalSocketService).toHaveBeenCalledTimes(1);
  });

  it("reloads config when backend version change event arrives", async () => {
    vi.useFakeTimers();
    window.location.hash = "#/home";

    const {
      bindConfigVersionUpgradeListener,
      useConfigStore,
    } = await import("../store/modules/ConfigStore");
    const store = useConfigStore();
    const resetSpy = vi.spyOn(store, "reset").mockResolvedValue(undefined);

    bindConfigVersionUpgradeListener(store);
    window.dispatchEvent(
      new CustomEvent("repo-config-version-change", {
        detail: { version: "2" },
      }),
    );

    await vi.runAllTimersAsync();

    expect(store.version).toBe("2");
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });
});
