import { computed, onUnmounted, ref } from "vue";
import { ServerTopics } from "@repo/core";
import type { ServerAlertEvent, ServerRealtimeEnvelope } from "../api";
import { useServerSocketService } from "./useServerSocketService";

export function useServerAlertStream() {
  const socket = useServerSocketService();
  const connected = ref(false);
  const error = ref<string | null>(null);
  const lastEventAt = ref<number | null>(null);
  const alerts = ref<Record<number, ServerAlertEvent>>({});
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
      ServerTopics.EVENTS.ALERT,
      (message: unknown) => {
        const envelope = message as ServerRealtimeEnvelope;
        const payload = envelope.data as ServerAlertEvent;
        if (!payload?.serverAlertEventId) {
          return;
        }
        alerts.value = {
          ...alerts.value,
          [payload.serverAlertEventId]: payload,
        };
        connected.value = true;
        error.value = null;
        lastEventAt.value = Date.now();
      },
    );
    connected.value = true;
  };

  onUnmounted(disconnect);

  return {
    connected: computed(() => connected.value),
    error: computed(() => error.value),
    lastEventAt: computed(() => lastEventAt.value),
    alerts,
    connect,
    disconnect,
  };
}
