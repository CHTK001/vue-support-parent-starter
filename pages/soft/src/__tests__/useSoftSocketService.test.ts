import { computed, effectScope } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useManagedSocketService = vi.fn();

vi.mock("@repo/core", () => ({
  useManagedSocketService,
  useModuleSocketService: vi.fn(options => {
    const managed = useManagedSocketService(options);

    return {
      state: computed(() =>
        options.mapState
          ? options.mapState(managed.state.value)
          : managed.state.value,
      ),
      getService: managed.getService,
      ensureConnected: managed.ensureConnected,
      subscribe: managed.subscribe,
      clearSubscriptions: managed.clearSubscriptions,
    };
  }),
}));

const createSocketStub = (connected = false) => {
  const service = {
    isConnected: connected,
    connect: vi.fn(() => {
      service.isConnected = true;
    }),
    subscribe: vi.fn(() => vi.fn()),
  };
  return service;
};

describe("useSoftSocketService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps managed global source to usingGlobal state", async () => {
    const globalService = createSocketStub(true);
    const unsubscribe = vi.fn();
    globalService.subscribe.mockReturnValue(unsubscribe);
    useManagedSocketService.mockReturnValue({
      state: {
        value: {
          source: "global",
          connected: true,
          error: null,
        },
      },
      getService: vi.fn(() => globalService),
      ensureConnected: vi.fn(() => globalService),
      subscribe: vi.fn(() => unsubscribe),
      clearSubscriptions: vi.fn(),
    });

    const { useSoftSocketService } = await import("../composables/useSoftSocketService");

    const scope = effectScope();
    scope.run(() => {
      const socket = useSoftSocketService();
      expect(socket.getService()).toBe(globalService);
      const off = socket.subscribe("SOFT", "INSTALL_PROGRESS", vi.fn());
      expect(socket.state.value.usingGlobal).toBe(true);
      off();
    });
    scope.stop();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("maps managed named source to non-global state", async () => {
    const namedService = createSocketStub(false);
    useManagedSocketService.mockReturnValue({
      state: {
        value: {
          source: "created",
          connected: false,
          error: null,
        },
      },
      getService: vi.fn(() => namedService),
      ensureConnected: vi.fn(() => {
        namedService.connect();
        return namedService;
      }),
      subscribe: vi.fn(() => vi.fn()),
      clearSubscriptions: vi.fn(),
    });

    const { useSoftSocketService } = await import("../composables/useSoftSocketService");

    const scope = effectScope();
    scope.run(() => {
      const socket = useSoftSocketService();
      const service = socket.ensureConnected();
      expect(service).toBe(namedService);
      expect(namedService.connect).toHaveBeenCalledTimes(1);
      expect(socket.state.value.usingGlobal).toBe(false);
      expect(socket.state.value.error).toBeNull();
    });
    scope.stop();
  });

  it("returns a controlled error from managed socket state", async () => {
    useManagedSocketService.mockReturnValue({
      state: {
        value: {
          source: "missing",
          connected: false,
          error: "未解析到可用的 Socket 地址",
        },
      },
      getService: vi.fn(() => null),
      ensureConnected: vi.fn(() => null),
      subscribe: vi.fn(() => vi.fn()),
      clearSubscriptions: vi.fn(),
    });

    const { useSoftSocketService } = await import("../composables/useSoftSocketService");

    const scope = effectScope();
    scope.run(() => {
      const socket = useSoftSocketService();
      expect(socket.ensureConnected()).toBeNull();
      expect(socket.state.value.error).toBe("未解析到可用的 Socket 地址");
    });
    scope.stop();
  });
});
