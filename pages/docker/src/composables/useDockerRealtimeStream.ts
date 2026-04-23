import { computed, getCurrentScope, onScopeDispose, ref } from "vue";
import { DockerTopics, type SocketTemplate, type WsMessage } from "@repo/core";
import type { DockerRealtimeEnvelope, DockerRealtimePayload } from "../types";
import { useDockerSocketService } from "./useDockerSocketService";

export interface DockerRealtimeStreamState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastEventAt: number | null;
}

export function useDockerRealtimeStream(preferredSocket?: SocketTemplate | null) {
  const socket = useDockerSocketService(preferredSocket);
  const state = ref<DockerRealtimeStreamState>({
    connected: false,
    connecting: false,
    error: null,
    lastEventAt: null,
  });
  const latest = ref<DockerRealtimeEnvelope | null>(null);
  const payloads = ref<Record<string, DockerRealtimePayload>>({});
  const logs = ref<Record<string, string[]>>({});
  const events = ref<DockerRealtimeEnvelope[]>([]);
  const unsubscribers: Array<() => void> = [];

  const disconnect = () => {
    while (unsubscribers.length) {
      unsubscribers.pop()?.();
    }
    socket.clearSubscriptions();
    state.value.connected = false;
    state.value.connecting = false;
  };

  const connect = () => {
    disconnect();
    state.value.connecting = true;
    state.value.error = null;
    const service = socket.ensureConnected();
    if (!service) {
      state.value.connecting = false;
      state.value.error = socket.state.value.error || "未找到可用的 Docker Socket 服务";
      return;
    }

    const handleEnvelope = (message: WsMessage | unknown) => {
      const envelope = message as DockerRealtimeEnvelope;
      const payload = envelope?.data || null;
      const taskId = String(envelope?.dataId || payload?.taskId || "").trim();
      if (!payload || !taskId) {
        return;
      }
      state.value.connected = true;
      state.value.connecting = false;
      state.value.error = null;
      state.value.lastEventAt = Date.now();
      latest.value = envelope;
      payloads.value = {
        ...payloads.value,
        [taskId]: payload,
      };
      if (payload.line) {
        const nextLines = logs.value[taskId] ? [...logs.value[taskId]] : [];
        nextLines.push(String(payload.line));
        logs.value = {
          ...logs.value,
          [taskId]: nextLines.slice(-300),
        };
      }
      events.value = [...events.value, envelope].slice(-500);
    };

    [
      DockerTopics.EVENTS.INSTALL_PROGRESS,
      DockerTopics.EVENTS.INSTALL_LOG,
      DockerTopics.EVENTS.INSTALL_RESULT,
      DockerTopics.EVENTS.SYNC_RESULT,
      DockerTopics.EVENTS.OPERATION_PROGRESS,
      DockerTopics.EVENTS.OPERATION_RESULT,
    ].forEach((eventName) => {
      unsubscribers.push(
        socket.subscribe(DockerTopics.MODULE, eventName, handleEnvelope),
      );
    });

    state.value.connected = true;
    state.value.connecting = false;
  };

  if (getCurrentScope()) {
    onScopeDispose(disconnect);
  }

  return {
    state: computed(() => state.value),
    latest,
    payloads,
    logs,
    events,
    connect,
    disconnect,
  };
}
