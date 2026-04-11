import { effectScope } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ensureConnected = vi.fn();
const subscribe = vi.fn();
const clearSubscriptions = vi.fn();

const socketState = {
  value: {
    usingGlobal: false,
    connected: false,
    error: null as string | null,
  },
};

vi.mock("../composables/useSoftSocketService", () => ({
  useSoftSocketService: () => ({
    state: socketState,
    ensureConnected,
    subscribe,
    clearSubscriptions,
  }),
}));

vi.mock("@repo/core", () => ({
  SoftTopics: {
    MODULE: "SOFT",
    EVENTS: {
      INSTALL_PROGRESS: "INSTALL_PROGRESS",
      INSTALL_LOG: "INSTALL_LOG",
      OPERATION_UPDATE: "OPERATION_UPDATE",
      RUNTIME_LOG: "RUNTIME_LOG",
    },
  },
}));

describe("soft socket streams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketState.value.error = null;
    ensureConnected.mockReturnValue({ isConnected: true });
  });

  it("filters operation events by operationId and collects stage/log lines", async () => {
    const handlers = new Map<string, (message: unknown) => void>();
    subscribe.mockImplementation((_module: string, event: string, handler: (message: unknown) => void) => {
      handlers.set(event, handler);
      return vi.fn();
    });

    const { useSoftOperationStream } = await import("../composables/useSoftOperationStream");

    const scope = effectScope();
    scope.run(() => {
      const stream = useSoftOperationStream();
      stream.connect(900);

      handlers.get("INSTALL_PROGRESS")?.({
        dataId: 900,
        data: {
          operationId: 900,
          stage: "INSTALL",
          progressPercent: 80,
          line: "install ok",
          status: "RUNNING",
        },
      });
      handlers.get("INSTALL_LOG")?.({
        dataId: 901,
        data: {
          operationId: 901,
          stage: "VERIFY",
          progressPercent: 95,
          line: "ignored",
          status: "RUNNING",
        },
      });

      expect(stream.state.value.operationId).toBe(900);
      expect(stream.latest.value?.stage).toBe("INSTALL");
      expect(stream.lines.value).toEqual(["install ok"]);
      expect(stream.stages.value).toEqual(["INSTALL"]);
      expect(stream.state.value.connected).toBe(true);
    });
    scope.stop();

    expect(subscribe).toHaveBeenCalledTimes(3);
  });

  it("reports a controlled error when no socket service is available for operation stream", async () => {
    ensureConnected.mockReturnValue(null);
    socketState.value.error = "未解析到可用的 Socket 地址";

    const { useSoftOperationStream } = await import("../composables/useSoftOperationStream");

    const scope = effectScope();
    scope.run(() => {
      const stream = useSoftOperationStream();
      stream.connect(902);
      expect(stream.state.value.connected).toBe(false);
      expect(stream.state.value.error).toBe("未解析到可用的 Socket 地址");
    });
    scope.stop();
  });

  it("filters runtime log events by installationId and unsubscribes on scope dispose", async () => {
    const unsubscribe = vi.fn();
    let runtimeHandler: ((message: unknown) => void) | null = null;
    subscribe.mockImplementation((_module: string, _event: string, handler: (message: unknown) => void) => {
      runtimeHandler = handler;
      return unsubscribe;
    });

    const { useSoftRuntimeLogStream } = await import("../composables/useSoftRuntimeLogStream");

    const scope = effectScope();
    scope.run(() => {
      const stream = useSoftRuntimeLogStream();
      stream.connect(1);

      runtimeHandler?.({
        dataId: 2,
        data: {
          installationId: 2,
          line: "ignored",
          status: "RUNNING",
        },
      });
      runtimeHandler?.({
        dataId: 1,
        data: {
          installationId: 1,
          line: "mysqld started",
          status: "RUNNING",
        },
      });

      expect(stream.latest.value?.installationId).toBe(1);
      expect(stream.lines.value).toEqual(["mysqld started"]);
      expect(stream.state.value.connected).toBe(true);
      stream.disconnect();
    });
    scope.stop();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
