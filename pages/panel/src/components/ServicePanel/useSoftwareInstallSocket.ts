import { computed, getCurrentScope, onScopeDispose, ref } from "vue";
import { useSocketService, ProjectTopics } from "@repo/core";
import type { WsMessage, SocketTemplate } from "@repo/core";

interface InstallLogEnvelope {
  module?: string;
  event?: string;
  dataId?: string;
  data?: {
    progress?: number;
    line?: string;
    status?: "installing" | "success" | "error";
    message?: string;
  };
  timestamp?: string;
}

export function useSoftwareInstallSocket() {
  const socket = ref<SocketTemplate | null>(null);
  const connected = ref(false);
  const connecting = ref(false);
  const error = ref<string | null>(null);
  const lines = ref<string[]>([]);
  const progress = ref(0);
  const resultStatus = ref<"installing" | "success" | "error" | "">("");
  const resultMessage = ref("");
  const activeOperationId = ref("");

  const unsubscribers: Array<() => void> = [];

  const disconnect = () => {
    while (unsubscribers.length) {
      unsubscribers.pop()?.();
    }
    connected.value = false;
    connecting.value = false;
  };

  const connect = (operationId: string) => {
    disconnect();
    activeOperationId.value = operationId;
    lines.value = [];
    progress.value = 0;
    resultStatus.value = "";
    resultMessage.value = "";
    connecting.value = true;
    error.value = null;

    // 获取面板全局共享的 socket 实例，不自建独立连接
    const svc = useSocketService();
    if (!svc) {
      connecting.value = false;
      error.value = "未找到可用的全局 Socket 服务";
      return;
    }

    socket.value = svc;
    connecting.value = false;
    connected.value = true;

    if (!svc.isConnected) {
      svc.connect();
    }

    const handleEnvelope = (message: WsMessage) => {
      const envelope = message as unknown as InstallLogEnvelope;
      if (String(envelope.dataId || "") !== String(operationId)) {
        return;
      }

      if (envelope.data) {
        if (envelope.data.line) {
          lines.value = [...lines.value, envelope.data.line];
        }
        if (typeof envelope.data.progress === "number") {
          progress.value = envelope.data.progress;
        }
        if (envelope.data.status) {
          resultStatus.value = envelope.data.status;
        }
        if (envelope.data.message) {
          resultMessage.value = envelope.data.message;
        }
      }
    };

    [
      ProjectTopics.EVENTS.CONTAINER_SOFTWARE_PROGRESS,
      ProjectTopics.EVENTS.CONTAINER_SOFTWARE_LOG,
      ProjectTopics.EVENTS.CONTAINER_SOFTWARE_RESULT,
    ].forEach((eventName) => {
      const unsubscribe = svc.subscribe(
        ProjectTopics.MODULE,
        eventName,
        handleEnvelope,
      );
      unsubscribers.push(unsubscribe);
    });
  };

  if (getCurrentScope()) {
    onScopeDispose(disconnect);
  }

  return {
    state: computed(() => ({
      connected: connected.value,
      connecting: connecting.value,
      error: error.value,
      operationId: activeOperationId.value,
    })),
    lines,
    progress,
    resultStatus,
    resultMessage,
    connect,
    disconnect,
  };
}
