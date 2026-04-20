import { computed, onUnmounted, ref } from "vue";
import { ServerTopics } from "@repo/core";
import { useServerSocketService } from "./useServerSocketService";

type ProjectLogType = "runtime" | "deploy";

const normalizeText = (value: unknown) => String(value ?? "").trim();

const readPayload = (message: unknown): Record<string, unknown> => {
  if (!message || typeof message !== "object") {
    return {};
  }
  const envelope = message as Record<string, unknown>;
  if (envelope.data && typeof envelope.data === "object") {
    return envelope.data as Record<string, unknown>;
  }
  return envelope;
};

const hasProjectReference = (
  payload: Record<string, unknown>,
  dataId: string,
) =>
  Boolean(
    normalizeText(payload.projectId) ||
      normalizeText(payload.project_id) ||
      normalizeText(payload.projectCode) ||
      normalizeText(payload.id) ||
      normalizeText(payload.dataId) ||
      dataId,
  );

const matchesProject = (
  payload: Record<string, unknown>,
  dataId: string,
  projectId: string,
) => {
  if (!projectId) {
    return true;
  }
  if (!hasProjectReference(payload, dataId)) {
    return true;
  }
  const candidates = [
    payload.projectId,
    payload.project_id,
    payload.projectCode,
    payload.id,
    payload.dataId,
    dataId,
  ]
    .map(normalizeText)
    .filter(Boolean);
  return candidates.includes(projectId);
};

const matchesLogType = (
  payload: Record<string, unknown>,
  logType: ProjectLogType,
) => {
  const rawType = normalizeText(payload.logType || payload.type).toLowerCase();
  if (!rawType) {
    return true;
  }
  if (logType === "deploy") {
    return ["deploy", "upgrade", "operation", "backup", "rollback"].some(
      token => rawType.includes(token),
    );
  }
  return ["runtime", "run", "nohup", "stdout", "stderr", "tail"].some(token =>
    rawType.includes(token),
  );
};

export function useServerProjectLogStream() {
  const socket = useServerSocketService();
  const connected = ref(false);
  const error = ref<string | null>(null);
  const lastEventAt = ref<number | null>(null);
  const eventCount = ref(0);
  const activeProjectId = ref("");
  const activeLogType = ref<ProjectLogType>("runtime");
  const unsubscribeList: Array<() => void> = [];

  const disconnect = () => {
    while (unsubscribeList.length) {
      unsubscribeList.pop()?.();
    }
    connected.value = false;
  };

  const markUpdated = () => {
    connected.value = true;
    error.value = null;
    lastEventAt.value = Date.now();
    eventCount.value += 1;
  };

  const connect = (projectId: string, logType: ProjectLogType) => {
    disconnect();
    activeProjectId.value = normalizeText(projectId);
    activeLogType.value = logType;
    const service = socket.ensureConnected();
    if (!service) {
      error.value = socket.state.value.error || "未找到可用的 Socket 服务";
      return;
    }
    const handleMessage = (message: unknown) => {
      const envelope = message as Record<string, unknown>;
      const payload = readPayload(message);
      const dataId = normalizeText(envelope.dataId);
      if (
        !matchesProject(payload, dataId, activeProjectId.value) ||
        !matchesLogType(payload, activeLogType.value)
      ) {
        return;
      }
      markUpdated();
    };
    unsubscribeList.push(
      socket.subscribe(
        ServerTopics.MODULE,
        ServerTopics.EVENTS.FILE_LOG,
        handleMessage,
      ),
    );
    unsubscribeList.push(
      socket.subscribe(
        ServerTopics.MODULE,
        ServerTopics.EVENTS.SERVICE,
        handleMessage,
      ),
    );
    connected.value = true;
  };

  onUnmounted(disconnect);

  return {
    connected: computed(() => connected.value),
    error: computed(() => error.value),
    lastEventAt: computed(() => lastEventAt.value),
    eventCount: computed(() => eventCount.value),
    activeProjectId: computed(() => activeProjectId.value),
    activeLogType: computed(() => activeLogType.value),
    connect,
    disconnect,
  };
}
