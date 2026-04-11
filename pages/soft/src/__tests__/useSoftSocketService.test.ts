import { effectScope } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSocketService = vi.fn();
const getGlobalSocketConfig = vi.fn();
const getNamedSocketService = vi.fn();
const createNamedSocketService = vi.fn();

let appConfig: Record<string, any> = {};

vi.mock("@repo/config", () => ({
  getConfig: () => appConfig,
}));

vi.mock("@repo/core", () => ({
  useSocketService,
  getGlobalSocketConfig,
  getNamedSocketService,
  createNamedSocketService,
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
    appConfig = {};
    useSocketService.mockReturnValue(null);
    getGlobalSocketConfig.mockReturnValue({
      protocol: "socketio",
      urls: [],
      context: "/socket.io",
    });
    getNamedSocketService.mockReturnValue(null);
  });

  it("prefers the injected global socket service", async () => {
    const globalService = createSocketStub(true);
    const unsubscribe = vi.fn();
    globalService.subscribe.mockReturnValue(unsubscribe);
    useSocketService.mockReturnValue(globalService);

    const { useSoftSocketService } = await import("../composables/useSoftSocketService");

    const scope = effectScope();
    scope.run(() => {
      const socket = useSoftSocketService();
      expect(socket.getService()).toBe(globalService);
      const off = socket.subscribe("SOFT", "INSTALL_PROGRESS", vi.fn());
      expect(globalService.connect).not.toHaveBeenCalled();
      expect(globalService.subscribe).toHaveBeenCalledTimes(1);
      off();
    });
    scope.stop();

    expect(createNamedSocketService).not.toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("creates a named socket service from local runtime config when no global service exists", async () => {
    const namedService = createSocketStub(false);
    createNamedSocketService.mockReturnValue(namedService);
    appConfig = {
      BaseUrl: "http://127.0.0.1:18170/system/api",
      SocketPath: "/socket.io",
      SocketProtocol: "socketio",
    };

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

    expect(createNamedSocketService).toHaveBeenCalledWith("soft", {
      protocol: "socketio",
      urls: ["http://127.0.0.1:18170"],
      context: "/socket.io",
      autoConnect: false,
    });
  });

  it("returns a controlled error when no socket url can be resolved", async () => {
    appConfig = {
      BaseUrl: "",
      SocketPath: "/socket.io",
    };

    const { useSoftSocketService } = await import("../composables/useSoftSocketService");

    const scope = effectScope();
    scope.run(() => {
      const socket = useSoftSocketService();
      expect(socket.ensureConnected()).toBeNull();
      expect(socket.state.value.error).toBe("未解析到可用的 Socket 地址");
    });
    scope.stop();

    expect(createNamedSocketService).not.toHaveBeenCalled();
  });
});
