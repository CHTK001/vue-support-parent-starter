import { computed, onUnmounted, ref } from "vue";
import { ServerTopics } from "@repo/core";
import type { ServerRealtimeEnvelope, ServerRealtimePayload } from "../api";
import { useServerSocketService } from "./useServerSocketService";

export function useServerMetricsStream() {
  const socket = useServerSocketService();
  const connected = ref(false);
  const error = ref<string | null>(null);
  const lastEventAt = ref<number | null>(null);
  const snapshots = ref<Record<number, ServerRealtimePayload>>({});
  let unsubscribe: (() => void) | null = null;

  const resolveTimestamp = (value?: number | string) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return Date.now();
  };

  const disconnect = () => {
    unsubscribe?.();
    unsubscribe = null;
    connected.value = false;
  };

  const connect = () => {
    disconnect();
    const service = socket.ensureConnected();
    if (!service) {
      error.value = socket.state.value.error || "未找到可用的 Socket 服务";
      return;
    }
    unsubscribe = socket.subscribe(
      ServerTopics.MODULE,
      ServerTopics.EVENTS.METRICS,
      (message: unknown) => {
        const envelope = message as ServerRealtimeEnvelope;
        const payload = {
          ...(envelope.data as ServerRealtimePayload),
          collectTimestamp: resolveTimestamp(envelope.timestamp),
        };
        if (!payload?.serverId) {
          return;
        }
        snapshots.value = {
          ...snapshots.value,
          [payload.serverId]: payload,
        };
        connected.value = true;
        error.value = null;
        lastEventAt.value = payload.collectTimestamp || Date.now();
      },
    );
    connected.value = true;
  };

  onUnmounted(disconnect);

  return {
    connected: computed(() => connected.value),
    error: computed(() => error.value),
    lastEventAt: computed(() => lastEventAt.value),
    snapshots,
    connect,
    disconnect,
  };
}
