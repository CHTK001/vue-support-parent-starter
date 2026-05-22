import { getCurrentScope, onScopeDispose, ref } from "vue";
import { useSocketService, DockerTopics } from "@repo/core";
import type { WsMessage } from "@repo/core";

// ─── Types ──────────────────────────────────────────

export interface DockerOpProgress {
  progressPercent: number;
  logs: string[];
  status: "idle" | "running" | "success" | "error";
  errorMessage?: string;
}

// ─── Module-level singletons ────────────────────────

const operationsByKey = ref<Record<string, DockerOpProgress>>({});
const connected = ref(false);
const error = ref<string | null>(null);

// ─── Helpers ────────────────────────────────────────

const fmtTime = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
};

const ensureTimestamp = (line: string): string => {
  if (/^\[\d{2}:\d{2}:\d{2}\]/.test(line)) return line;
  return `${fmtTime(new Date())} ${line}`;
};

const tryParse = (str: string): any => {
  try { return JSON.parse(str); } catch { return null; }
};

function setOp(key: string, patch: Partial<DockerOpProgress>) {
  const cur = operationsByKey.value[key] || { progressPercent: 0, logs: [], status: "idle" };
  operationsByKey.value = {
    ...operationsByKey.value,
    [key]: { ...cur, ...patch },
  };
}

function addLogLine(key: string, line: string) {
  if (!line) return;
  const stamped = ensureTimestamp(line);
  const cur = operationsByKey.value[key];
  const logs = cur?.logs ? [...cur.logs, stamped] : [stamped];
  if (logs.length > 1000) logs.splice(0, logs.length - 1000);
  setOp(key, { logs });
}

/** Extract image key from a message payload */
function extractImageKey(data: Record<string, any>): string | null {
  const name = data.imageName ?? data.image;
  if (name && typeof name === "string") return `pull:${name}`;
  return null;
}

// ─── Composable ─────────────────────────────────────

export function useDockerProgressSocket() {
  const cleanupFns: Array<() => void> = [];

  const disconnect = () => {
    while (cleanupFns.length) cleanupFns.pop()?.();
    connected.value = false;
  };

  const connect = () => {
    if (connected.value) return;
    disconnect();

    const svc = useSocketService();
    if (!svc) {
      error.value = "未找到可用的全局 Socket 服务";
      return;
    }
    connected.value = true;

    if (!svc.isConnected) {
      svc.connect();
    }

    // Subscribe to DockerTopics (new-style module-based topics)
    const topicEvents = [
      DockerTopics.EVENTS.INSTALL_PROGRESS,
      DockerTopics.EVENTS.INSTALL_LOG,
      DockerTopics.EVENTS.INSTALL_RESULT,
    ];
    for (const event of topicEvents) {
      const unsub = svc.subscribe(DockerTopics.MODULE, event, (message: WsMessage) => {
        handleDockerTopicMsg(message as any);
      });
      cleanupFns.push(unsub);
    }

    // Raw socket fallback — catches ANY event, including old-style monitor:docker:* messages
    const rawSocket: any = (svc as any).socket;
    if (rawSocket) {
      const rawHandler = (raw: unknown) => {
        let parsed: any = raw;
        if (typeof parsed === "string") {
          const p = tryParse(parsed);
          if (p) parsed = p;
        }
        // Process all messages — both with and without module property
        if (parsed && typeof parsed === "object") {
          handleRawMessage(parsed);
        }
      };
      rawSocket.on("message", rawHandler);
      cleanupFns.push(() => rawSocket.off("message", rawHandler));
    }
  };

  /** Handle messages from DockerTopics subscribe (module="DOCKER") */
  const handleDockerTopicMsg = (msg: Record<string, any>) => {
    const data = msg.data || msg;
    const key = extractImageKey(data);
    if (!key) return;

    const line = data.line || data.message || data.text || data.log || null;
    if (line) addLogLine(key, String(line));

    const pct = data.progress ?? data.progressPercent ?? data.percentage;
    if (typeof pct === "number") setOp(key, { progressPercent: pct });

    const status = data.status ?? msg.event;
    if (typeof status === "string") {
      const s = status.toUpperCase();
      if (s === "SUCCESS" || msg.event === "docker.install.result") setOp(key, { status: "success", progressPercent: 100 });
      else if (s === "FAILED" || s === "ERROR") setOp(key, { status: "error", errorMessage: line || undefined });
      else if (s === "RUNNING" || s === "PULLING" || s === "INSTALLING") setOp(key, { status: "running" });
    }
  };

  /** Handle raw socket messages (old-style monitor:docker:* events) */
  const handleRawMessage = (parsed: Record<string, any>) => {
    const data = parsed.data || parsed;
    const key = extractImageKey(data) || extractImageKey(parsed);
    if (!key) return;

    const line = data.line || data.message || data.text || data.log || parsed.line || parsed.message || JSON.stringify(data);
    addLogLine(key, String(line));

    const type = String(parsed.type || data.type || "").toLowerCase();
    const pct = data.percentage ?? data.progress ?? data.percent;
    if (typeof pct === "number") setOp(key, { progressPercent: Number(pct) });

    if (type.includes("complete") || type.includes("finish") || data.status === "SUCCESS") {
      setOp(key, { status: "success", progressPercent: 100 });
    } else if (type.includes("error") || type.includes("fail")) {
      setOp(key, { status: "error", errorMessage: line });
    } else if (type.includes("start") || type.includes("progress") || data.status === "PULLING") {
      setOp(key, { status: "running" });
    }
  };

  /** Get progress state for a specific operation key */
  const getOperation = (key: string): DockerOpProgress => {
    return operationsByKey.value[key] || { progressPercent: 0, logs: [], status: "idle" };
  };

  /** Reset an operation to idle */
  const resetOperation = (key: string) => {
    setOp(key, { progressPercent: 0, logs: [], status: "idle", errorMessage: undefined });
  };

  /** Remove an operation entry */
  const removeOperation = (key: string) => {
    const { [key]: _, ...rest } = operationsByKey.value;
    operationsByKey.value = rest;
  };

  if (getCurrentScope()) {
    onScopeDispose(disconnect);
  }

  return {
    connected,
    error,
    operationsByKey,
    connect,
    disconnect,
    getOperation,
    resetOperation,
    removeOperation,
  };
}
