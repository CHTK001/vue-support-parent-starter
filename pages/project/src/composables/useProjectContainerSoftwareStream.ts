import { computed, getCurrentScope, onScopeDispose, ref } from "vue";
import { ProjectTopics } from "@repo/core";
import type {
  ProjectContainerSoftwareRealtimeEnvelope,
  ProjectContainerSoftwareRealtimePayload,
} from "../api/manage/project-container-software";
import { useProjectSocketService } from "./useProjectSocketService";

export function useProjectContainerSoftwareStream(preferredSocket?: any) {
  const socket = useProjectSocketService(preferredSocket);
  const connected = ref(false);
  const connecting = ref(false);
  const error = ref<string | null>(null);
  const latest = ref<ProjectContainerSoftwareRealtimePayload | null>(null);
  const events = ref<ProjectContainerSoftwareRealtimeEnvelope[]>([]);
  const lines = ref<string[]>([]);
  const operationId = ref<string>("");
  const unsubscribers: Array<() => void> = [];

  const disconnect = () => {
    while (unsubscribers.length) {
      unsubscribers.pop()?.();
    }
    connected.value = false;
    connecting.value = false;
  };

  const connect = (nextOperationId: string) => {
    disconnect();
    latest.value = null;
    events.value = [];
    lines.value = [];
    operationId.value = nextOperationId;
    connecting.value = true;
    error.value = null;

    const service = socket.ensureConnected();
    if (!service) {
      connecting.value = false;
      error.value = socket.state.value.error || "未找到可用的项目 Socket 服务";
      return;
    }

    const handleEnvelope = (message: unknown) => {
      const envelope = message as ProjectContainerSoftwareRealtimeEnvelope;
      if (String(envelope.dataId || "") !== String(nextOperationId)) {
        return;
      }
      connected.value = true;
      connecting.value = false;
      error.value = null;
      latest.value = envelope.data;
      events.value = [...events.value, envelope];
      if (envelope.data.line) {
        lines.value = [...lines.value, envelope.data.line];
      }
    };

    [
      ProjectTopics.EVENTS.CONTAINER_SOFTWARE_PROGRESS,
      ProjectTopics.EVENTS.CONTAINER_SOFTWARE_LOG,
      ProjectTopics.EVENTS.CONTAINER_SOFTWARE_RESULT,
    ].forEach((eventName) => {
      unsubscribers.push(socket.subscribe(ProjectTopics.MODULE, eventName, handleEnvelope));
    });

    connected.value = true;
    connecting.value = false;
  };

  if (getCurrentScope()) {
    onScopeDispose(disconnect);
  }

  return {
    state: computed(() => ({
      connected: connected.value,
      connecting: connecting.value,
      error: error.value,
      operationId: operationId.value,
    })),
    latest,
    events,
    lines,
    connect,
    disconnect,
  };
}
