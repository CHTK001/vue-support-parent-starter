import { computed, onUnmounted, ref } from "vue";
import { ServerTopics } from "@repo/core";
import type { ServerRealtimeEnvelope, ServerRealtimePayload } from "../api";
import { useServerSocketService } from "./useServerSocketService";

export function useServerFileLogStream() {
  const socket = useServerSocketService();
  const connected = ref(false);
  const error = ref<string | null>(null);
  const lastEventAt = ref<number | null>(null);
  const lines = ref<string[]>([]);
  const latest = ref<ServerRealtimePayload | null>(null);
  const activeWatchId = ref<number | null>(null);
  let unsubscribe: (() => void) | null = null;

  const disconnect = () => {
    unsubscribe?.();
    unsubscribe = null;
    connected.value = false;
    activeWatchId.value = null;
  };

  const connect = (watchId: number, preserveLines = true) => {
    disconnect();
    if (!preserveLines) {
      lines.value = [];
    }
    activeWatchId.value = watchId;
    const service = socket.ensureConnected();
    if (!service) {
      error.value = socket.state.value.error || "未找到可用的 Socket 服务";
      return;
    }

    unsubscribe = socket.subscribe(
      ServerTopics.MODULE,
      ServerTopics.EVENTS.FILE_LOG,
      (message: unknown) => {
        const envelope = message as ServerRealtimeEnvelope;
        const payload = envelope.data;
        if (String(payload.watchId) !== String(watchId)) {
          return;
        }
        latest.value = payload;
        connected.value = true;
        error.value = null;
        lastEventAt.value = Date.now();
        if (payload.line) {
          lines.value = [...lines.value, payload.line];
        }
      },
    );

    connected.value = true;
  };

  onUnmounted(disconnect);

  return {
    connected: computed(() => connected.value),
    error: computed(() => error.value),
    lastEventAt: computed(() => lastEventAt.value),
    lines,
    latest,
    activeWatchId,
    connect,
    disconnect,
  };
}
