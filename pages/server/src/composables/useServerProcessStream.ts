import { computed, onUnmounted, ref } from "vue";
import { ServerTopics } from "@repo/core";
import type {
  ServerProcessRealtimePayload,
  ServerRealtimeEnvelope,
} from "../api";
import { useServerSocketService } from "./useServerSocketService";

export function useServerProcessStream() {
  const socket = useServerSocketService();
  const connected = ref(false);
  const error = ref<string | null>(null);
  const lastEventAt = ref<number | null>(null);
  const payloads = ref<Record<number, ServerProcessRealtimePayload>>({});
  let unsubscribe: (() => void) | null = null;

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
      ServerTopics.EVENTS.PROCESS,
      (message: unknown) => {
        const envelope = message as ServerRealtimeEnvelope;
        const payload = envelope.data as ServerProcessRealtimePayload;
        const serverId = Number(payload?.serverId || 0);
        if (!serverId) {
          return;
        }
        const refreshedAt =
          Number(payload?.refreshedAt || 0) ||
          (typeof envelope.timestamp === "number"
            ? envelope.timestamp
            : Date.now());
        payloads.value = {
          ...payloads.value,
          [serverId]: {
            ...payload,
            refreshedAt,
          },
        };
        connected.value = true;
        error.value = null;
        lastEventAt.value = refreshedAt;
      },
    );
    connected.value = true;
  };

  onUnmounted(disconnect);

  return {
    connected: computed(() => connected.value),
    error: computed(() => error.value),
    lastEventAt: computed(() => lastEventAt.value),
    payloads,
    connect,
    disconnect,
  };
}
