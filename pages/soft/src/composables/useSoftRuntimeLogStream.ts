import { computed, onUnmounted, ref } from "vue";
import { SoftTopics } from "@repo/core";
import type { SoftRealtimeEnvelope, SoftRealtimePayload } from "../api";
import { useSoftSocketService } from "./useSoftSocketService";

export interface SoftRuntimeLogStreamState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastEventAt: number | null;
  installationId: number | null;
}

export interface SoftRuntimeLogStreamConnectOptions {
  preserveLines?: boolean;
}

export function useSoftRuntimeLogStream() {
  const socket = useSoftSocketService();
  const state = ref<SoftRuntimeLogStreamState>({
    connected: false,
    connecting: false,
    error: null,
    lastEventAt: null,
    installationId: null,
  });
  const latest = ref<SoftRealtimePayload | null>(null);
  const lines = ref<string[]>([]);
  let unsubscribe: (() => void) | null = null;

  const disconnect = () => {
    unsubscribe?.();
    unsubscribe = null;
    state.value.connected = false;
    state.value.connecting = false;
  };

  const connect = (
    installationId: number,
    options: SoftRuntimeLogStreamConnectOptions = {},
  ) => {
    disconnect();
    latest.value = null;
    if (!options.preserveLines) {
      lines.value = [];
    }
    state.value = {
      connected: false,
      connecting: true,
      error: null,
      lastEventAt: null,
      installationId,
    };

    const service = socket.ensureConnected();
    if (!service) {
      state.value.connecting = false;
      state.value.error = socket.state.value.error || "未找到可用的 Socket 服务";
      return;
    }

    unsubscribe = socket.subscribe(
      SoftTopics.MODULE,
      SoftTopics.EVENTS.RUNTIME_LOG,
      (message: unknown) => {
        const envelope = message as SoftRealtimeEnvelope;
        if (String(envelope.dataId) !== String(installationId)) {
          return;
        }
        state.value.connected = true;
        state.value.connecting = false;
        state.value.error = null;
        state.value.lastEventAt = Date.now();
        latest.value = envelope.data;
      },
    );

    state.value.connected = true;
    state.value.connecting = false;
  };

  onUnmounted(disconnect);

  return {
    state: computed(() => state.value),
    latest,
    lines,
    connect,
    disconnect,
  };
}
