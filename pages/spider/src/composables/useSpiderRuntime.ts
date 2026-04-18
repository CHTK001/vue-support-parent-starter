import { onBeforeUnmount, ref } from "vue";
import { getRuntime } from "../api/spider-platform";

type RuntimeChannel = "idle" | "sse" | "socket" | "poll";

type RuntimeEventPayload = {
  type: string;
  data: any;
  channel: RuntimeChannel;
};

type UseSpiderRuntimeOptions = {
  onEvent?: (payload: RuntimeEventPayload) => void;
  onSnapshot?: (snapshot: any) => void;
  pollIntervalMs?: number;
};

type GlobalSocketLike = {
  connect?: () => void;
  on?: (event: string, handler: (data: unknown) => void) => void;
  off?: (event: string) => void;
};

const toJson = (input: unknown) => {
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  }
  return input;
};

export function useSpiderRuntime(options: UseSpiderRuntimeOptions = {}) {
  const channel = ref<RuntimeChannel>("idle");
  const connected = ref(false);
  const lastError = ref("");

  let currentTaskId: number | null = null;
  let eventSource: EventSource | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let socketCleanup: (() => void) | null = null;

  const emitEvent = (type: string, data: any, eventChannel: RuntimeChannel) => {
    options.onEvent?.({ type, data, channel: eventChannel });
  };

  const stopPoll = () => {
    if (!pollTimer) return;
    clearInterval(pollTimer);
    pollTimer = null;
  };

  const stopSocket = () => {
    socketCleanup?.();
    socketCleanup = null;
  };

  const stopSse = () => {
    if (!eventSource) return;
    eventSource.close();
    eventSource = null;
  };

  const clearFallbackTimer = () => {
    if (!fallbackTimer) return;
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  };

  const stop = () => {
    clearFallbackTimer();
    stopSse();
    stopSocket();
    stopPoll();
    connected.value = false;
    channel.value = "idle";
    currentTaskId = null;
  };

  const startPoll = (taskId: number) => {
    stopSse();
    stopSocket();
    stopPoll();
    channel.value = "poll";
    connected.value = true;

    const fetchSnapshot = async () => {
      try {
        const snapshot = await getRuntime(taskId);
        options.onSnapshot?.(snapshot);
      } catch (error) {
        lastError.value =
          error instanceof Error ? error.message : "轮询运行时快照失败";
      }
    };

    void fetchSnapshot();
    pollTimer = setInterval(fetchSnapshot, options.pollIntervalMs ?? 5000);
  };

  const startSocket = (taskId: number) => {
    const socket = (
      (globalThis as any)?.globalSocket ||
      (globalThis as any)?.__GLOBAL_SOCKET__
    ) as GlobalSocketLike | undefined;

    if (!socket?.on || !socket?.off) {
      startPoll(taskId);
      return;
    }

    stopSse();
    stopSocket();
    stopPoll();
    channel.value = "socket";
    connected.value = true;

    socket.connect?.();
    const eventName = "nodeStatus";
    const handler = (raw: unknown) => {
      const payload = toJson(raw);
      emitEvent(eventName, payload, "socket");
    };
    socket.on(eventName, handler);

    socketCleanup = () => {
      socket.off?.(eventName);
    };
  };

  const startSse = (taskId: number) => {
    stopSse();
    stopSocket();
    stopPoll();
    clearFallbackTimer();

    channel.value = "sse";
    connected.value = false;

    eventSource = new EventSource(`/v1/spider/tasks/${taskId}/runtime/stream`);

    const handlePayload = (type: string, payload: unknown) => {
      const data = toJson(payload);
      connected.value = true;
      emitEvent(type, data, "sse");
    };

    const onNodeStatus = (event: MessageEvent) => {
      handlePayload("nodeStatus", event.data);
    };

    eventSource.addEventListener("nodeStatus", onNodeStatus as EventListener);
    eventSource.onmessage = (event) => handlePayload("message", event.data);
    eventSource.onopen = () => {
      connected.value = true;
      clearFallbackTimer();
    };
    eventSource.onerror = () => {
      lastError.value = "SSE 连接失败，已降级到 Socket/轮询";
      clearFallbackTimer();
      startSocket(taskId);
    };

    fallbackTimer = setTimeout(() => {
      if (!connected.value) {
        lastError.value = "SSE 未建立连接，已降级到 Socket/轮询";
        startSocket(taskId);
      }
    }, 8000);
  };

  const start = (taskId: number) => {
    if (!taskId) return;
    currentTaskId = taskId;
    lastError.value = "";
    startSse(taskId);
  };

  const reload = () => {
    if (!currentTaskId) return;
    start(currentTaskId);
  };

  onBeforeUnmount(() => {
    stop();
  });

  return {
    channel,
    connected,
    lastError,
    start,
    stop,
    reload,
  };
}
