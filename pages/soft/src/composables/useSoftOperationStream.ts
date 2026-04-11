import { computed, onUnmounted, ref } from "vue";
import { SoftTopics } from "@repo/core";
import type { SoftRealtimeEnvelope, SoftRealtimePayload } from "../api";
import { useSoftSocketService } from "./useSoftSocketService";

export interface SoftOperationStreamState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastEventAt: number | null;
  operationId: number | null;
}

export function useSoftOperationStream() {
  const socket = useSoftSocketService();
  const state = ref<SoftOperationStreamState>({
    connected: false,
    connecting: false,
    error: null,
    lastEventAt: null,
    operationId: null,
  });
  const latest = ref<SoftRealtimePayload | null>(null);
  const events = ref<SoftRealtimeEnvelope[]>([]);
  const lines = ref<string[]>([]);
  const stages = ref<string[]>([]);
  const unsubscribers: Array<() => void> = [];

  const disconnect = () => {
    while (unsubscribers.length) {
      unsubscribers.pop()?.();
    }
    state.value.connected = false;
    state.value.connecting = false;
  };

  const connect = (operationId: number) => {
    disconnect();
    latest.value = null;
    events.value = [];
    lines.value = [];
    stages.value = [];
    state.value = {
      connected: false,
      connecting: true,
      error: null,
      lastEventAt: null,
      operationId,
    };

    const service = socket.ensureConnected();
    if (!service) {
      state.value.connecting = false;
      state.value.error = socket.state.value.error || "未找到可用的 Socket 服务";
      return;
    }

    const handleEnvelope = (message: unknown) => {
      const envelope = message as SoftRealtimeEnvelope;
      if (String(envelope.dataId) !== String(operationId)) {
        return;
      }
      state.value.connected = true;
      state.value.connecting = false;
      state.value.error = null;
      state.value.lastEventAt = Date.now();
      latest.value = envelope.data;
      events.value = [...events.value, envelope];
      if (envelope.data.line) {
        lines.value = [...lines.value, envelope.data.line];
      }
      if (envelope.data.stage && !stages.value.includes(envelope.data.stage)) {
        stages.value = [...stages.value, envelope.data.stage];
      }
    };

    [
      SoftTopics.EVENTS.OPERATION_UPDATE,
      SoftTopics.EVENTS.INSTALL_PROGRESS,
      SoftTopics.EVENTS.INSTALL_LOG,
    ].forEach((eventName) => {
      unsubscribers.push(
        socket.subscribe(SoftTopics.MODULE, eventName, handleEnvelope),
      );
    });

    state.value.connected = true;
    state.value.connecting = false;
  };

  onUnmounted(disconnect);

  return {
    state: computed(() => state.value),
    latest,
    events,
    lines,
    stages,
    connect,
    disconnect,
  };
}
