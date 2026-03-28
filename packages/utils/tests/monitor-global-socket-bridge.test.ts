import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockAppConfig: Record<string, any> = {
  OpenSetting: true,
};

vi.mock("@repo/core", () => ({
  GlobalSocketKey: Symbol("GlobalSocketKey"),
  getGlobalSocketConfig: () => ({
    protocol: "socketio",
    urls: [],
    context: "/socket.io",
  }),
  initGlobalSocketService: vi.fn(),
  provideGlobalSocketService: vi.fn(),
  getGlobalSocketService: () => null,
  useConfigStoreHook: () => ({
    load: vi.fn(async () => {}),
  }),
}));

vi.mock("@repo/config", () => ({
  getConfig: () => mockAppConfig,
}));

type SocketTemplate = {
  protocol: string;
  socket: unknown;
  isConnected: boolean;
  connected: { value: boolean };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};

const createSocketServiceStub = () => {
  const connected = ref(false);

  const service: SocketTemplate = {
    protocol: "socketio",
    socket: {},
    get isConnected() {
      return connected.value;
    },
    connected,
    connect: vi.fn(() => {
      connected.value = true;
    }),
    disconnect: vi.fn(() => {
      connected.value = false;
    }),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    close: vi.fn(() => {
      connected.value = false;
    }),
    subscribe: vi.fn(() => vi.fn()),
  };

  return service;
};

describe("monitor global socket bridge", () => {
  beforeEach(() => {
    mockAppConfig = {
      OpenSetting: true,
    };
  });

  it("loads remote config before replaying queued connect and listen actions", async () => {
    const { createMonitorGlobalSocketBridge } = await import(
      "../../../apps/vue-support-monitor-starter/src/plugins/globalSocket"
    );
    const service = createSocketServiceStub();
    let currentService: SocketTemplate | null = null;
    const loadConfig = vi.fn(async () => {
      currentService = service;
    });

    const bridge = createMonitorGlobalSocketBridge({
      getGlobalSocketService: () => currentService,
      getGlobalSocketConfig: () => ({
        protocol: "socketio",
        urls: [],
        context: "/socket.io",
      }),
      initGlobalSocketService: vi.fn(() => service),
      loadConfig,
      onError: vi.fn(),
    });

    const handler = vi.fn();
    bridge.on("container:stats", handler);
    bridge.connect();

    await Promise.resolve();
    await Promise.resolve();

    expect(loadConfig).toHaveBeenCalledTimes(1);
    expect(service.on).toHaveBeenCalledWith(
      "container:stats",
      handler,
      undefined,
    );
    expect(service.connect).toHaveBeenCalledTimes(1);
  });

  it("creates a disconnected socket service from resolved runtime config when needed", () => {
    const testPromise = import(
      "../../../apps/vue-support-monitor-starter/src/plugins/globalSocket"
    ).then(({ createMonitorGlobalSocketBridge }) => {
    const service = createSocketServiceStub();
    let currentService: SocketTemplate | null = null;
    const initGlobalSocketService = vi.fn((config) => {
      currentService = service;
      return service;
    });

    const bridge = createMonitorGlobalSocketBridge({
      getGlobalSocketService: () => currentService,
      getGlobalSocketConfig: () => ({
        protocol: "socketio",
        urls: ["ws://172.16.0.40:29181"],
        context: "/socket.io",
      }),
      initGlobalSocketService,
      loadConfig: vi.fn(async () => {}),
      onError: vi.fn(),
    });

    bridge.emit("docker:refresh", { force: true });

    expect(initGlobalSocketService).toHaveBeenCalledWith({
      protocol: "socketio",
      urls: ["ws://172.16.0.40:29181"],
      context: "/socket.io",
      autoConnect: false,
    });
    expect(service.emit).toHaveBeenCalledWith("docker:refresh", { force: true });
    });

    return testPromise;
  });

  it("falls back to local startup config when remote settings are disabled", async () => {
    mockAppConfig = {
      OpenSetting: false,
      SocketOpen: true,
      SocketUrl: "http://172.16.0.40:29181",
      SocketPath: "/socket.io",
      SocketProtocol: "socketio",
    };

    const { createMonitorGlobalSocketBridge } = await import(
      "../../../apps/vue-support-monitor-starter/src/plugins/globalSocket"
    );
    const service = createSocketServiceStub();
    let currentService: SocketTemplate | null = null;
    const initGlobalSocketService = vi.fn((config) => {
      currentService = service;
      return service;
    });
    const loadConfig = vi.fn(async () => {});

    const bridge = createMonitorGlobalSocketBridge({
      getGlobalSocketService: () => currentService,
      getGlobalSocketConfig: () => ({
        protocol: "socketio",
        urls: [],
        context: "/socket.io",
      }),
      initGlobalSocketService,
      getLocalConfig: () => mockAppConfig,
      loadConfig,
      onError: vi.fn(),
    });

    bridge.connect();

    expect(initGlobalSocketService).toHaveBeenCalledWith({
      protocol: "socketio",
      urls: ["http://172.16.0.40:29181"],
      context: "/socket.io",
      autoConnect: false,
    });
    expect(service.connect).toHaveBeenCalledTimes(1);
    expect(loadConfig).not.toHaveBeenCalled();
  });
});
