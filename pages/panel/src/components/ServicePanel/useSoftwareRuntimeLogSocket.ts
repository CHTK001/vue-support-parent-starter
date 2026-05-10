import { getCurrentScope, onScopeDispose, ref } from "vue";
import { useSocketService, SoftTopics, ProjectTopics, MonitorTopics } from "@repo/core";
import type { WsMessage } from "@repo/core";
import type { Socket } from "socket.io-client";

// Module-level singletons so all callers share the same reactive state
const logsByBinding = ref<Record<number, string[]>>({});
const progressByBinding = ref<Record<number, number>>({});
const statusByBinding = ref<Record<number, string>>({});
const statsByBinding = ref<Record<number, DockerContainerStats>>({});

/** CPU/memory stats from Docker container_statistics topic */
export interface DockerContainerStats {
  bindingId: number;
  cpuPercent?: number;
  memoryUsage?: number;    // bytes
  memoryLimit?: number;    // bytes
  networkRx?: number;      // bytes
  networkTx?: number;      // bytes
  timestamp?: string;
}

/** Format a Date to [HH:mm:ss] string */
const fmtTime = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
};

/** Add timestamp prefix to a log line if not already present */
const ensureTimestamp = (line: string): string => {
  if (/^\[\d{2}:\d{2}:\d{2}\]/.test(line)) return line;
  return `${fmtTime(new Date())} ${line}`;
};

export function useSoftwareRuntimeLogSocket() {
  const connected = ref(false);
  const error = ref<string | null>(null);

  const cleanupFns: Array<() => void> = [];

  const disconnect = () => {
    while (cleanupFns.length) cleanupFns.pop()?.();
    connected.value = false;
  };

  const addLine = (bindingId: number, line: string) => {
    if (!line) return;
    const stamped = ensureTimestamp(line);
    if (!logsByBinding.value[bindingId]) {
      logsByBinding.value[bindingId] = [];
    }
    logsByBinding.value[bindingId].push(stamped);
    logsByBinding.value = { ...logsByBinding.value };
    if (logsByBinding.value[bindingId].length > 1000) {
      logsByBinding.value[bindingId].splice(0, logsByBinding.value[bindingId].length - 1000);
    }
  };

  const getBindingId = (msg: Record<string, any>): number => {
    // Prefer numeric IDs from data payload
    const fromData = Number(msg.data?.sysProjectContainerSoftwareBindingId ?? msg.data?.bindingId ?? msg.sysProjectContainerSoftwareBindingId);
    if (fromData > 0) return fromData;
    // Fallback: dataId might be a numeric string, but often a UUID — still try
    const fromTop = Number(msg.dataId ?? msg.bindingId ?? msg.id ?? 0);
    return fromTop > 0 ? fromTop : 0;
  };

  const getLine = (msg: Record<string, any>): string | null => {
    return (
      msg.data?.line ||
      msg.data?.message ||
      msg.line ||
      msg.message ||
      msg.data?.text ||
      msg.text ||
      msg.data?.log ||
      msg.log ||
      null
    );
  };

  const handleAnyMessage = (data: any) => {
    const msg: Record<string, any> = (typeof data === "string" ? tryParse(data) : data) || {};
    if (typeof msg !== "object") {
      addLine(0, String(data));
      return;
    }
    const bindingId = getBindingId(msg);
    const line = getLine(msg);
    if (line) {
      addLine(bindingId, String(line));
    } else {
      // Fallback: stringify everything
      addLine(bindingId, JSON.stringify(msg));
    }
    // Track progress and status
    const progress = msg.data?.progress ?? msg.data?.progressPercent ?? msg.progress ?? msg.progressPercent;
    if (typeof progress === "number") {
      progressByBinding.value = { ...progressByBinding.value, [bindingId]: progress };
    }
    let status = msg.data?.status ?? msg.status;
    if (typeof status === "string") {
      // Normalize: SUCCESS→success, FAILED→error, RUNNING→installing
      const upper = status.toUpperCase();
      if (upper === "SUCCESS") status = "success";
      else if (upper === "FAILED") status = "error";
      else if (upper === "RUNNING") status = "installing";
      statusByBinding.value = { ...statusByBinding.value, [bindingId]: status };
    }
  };

  const tryParse = (str: string): any => {
    try { return JSON.parse(str); } catch { return null; }
  };

  const connect = () => {
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

    // Subscribe to ALL known log-related topics
    const topics: Array<[string, string]> = [
      [SoftTopics.MODULE, SoftTopics.EVENTS.RUNTIME_LOG],
      [SoftTopics.MODULE, SoftTopics.EVENTS.INSTALL_LOG],
      [SoftTopics.MODULE, SoftTopics.EVENTS.INSTALL_PROGRESS],
      [SoftTopics.MODULE, SoftTopics.EVENTS.OPERATION_UPDATE],
      [ProjectTopics.MODULE, ProjectTopics.EVENTS.CONTAINER_SOFTWARE_LOG],
      [ProjectTopics.MODULE, ProjectTopics.EVENTS.CONTAINER_SOFTWARE_PROGRESS],
      [ProjectTopics.MODULE, ProjectTopics.EVENTS.CONTAINER_SOFTWARE_RESULT],
    ];

    for (const [module, event] of topics) {
      const unsub = svc.subscribe(module, event, (message: WsMessage) => {
        handleAnyMessage(message as any);
      });
      cleanupFns.push(unsub);
    }

    // Container statistics: listen via raw socket for monitor:docker:container_statistics
    const rawSocket2: any = (svc as any).socket;
    if (rawSocket2) {
      const statsHandler = (raw: unknown) => {
        let data = raw;
        if (typeof data === "string") {
          try { data = JSON.parse(data); } catch { return; }
        }
        if (data && typeof data === "object") {
          const d = (data as any).data || data;
          const bindingId = Number(d.bindingId || d.sysProjectContainerSoftwareBindingId || 0);
          if (bindingId > 0) {
            statsByBinding.value = {
              ...statsByBinding.value,
              [bindingId]: {
                bindingId,
                cpuPercent: Number(d.cpuPercent ?? d.cpu ?? 0),
                memoryUsage: Number(d.memoryUsage ?? d.memory ?? 0),
                memoryLimit: Number(d.memoryLimit ?? 0),
                networkRx: Number(d.networkRx ?? d.netRx ?? 0),
                networkTx: Number(d.networkTx ?? d.netTx ?? 0),
                timestamp: d.timestamp || new Date().toISOString(),
              },
            };
          }
        }
      };
      rawSocket2.on(MonitorTopics.DOCKER.CONTAINER_STATISTICS, statsHandler);
      cleanupFns.push(() => rawSocket2.off(MonitorTopics.DOCKER.CONTAINER_STATISTICS, statsHandler));
    }

    // Also listen on raw socket for any "message" event that the subscribe
    // dispatch might miss (messages without module/event fields)
    const rawSocket: any = (svc as any).socket;
    if (rawSocket) {
      const rawHandler = (raw: unknown) => {
        let parsed: any = raw;
        if (typeof parsed === "string") {
          const p = tryParse(parsed);
          if (p) parsed = p;
        }
        // Only handle raw messages WITHOUT module/event fields.
        // Messages with module+event are handled by the subscribe dispatch above.
        if (parsed && typeof parsed === "object" && !parsed.module) {
          handleAnyMessage(parsed);
        }
      };
      rawSocket.on("message", rawHandler);
      cleanupFns.push(() => rawSocket.off("message", rawHandler));
    }
  };

  if (getCurrentScope()) {
    onScopeDispose(disconnect);
  }

  return {
    connected,
    error,
    logsByBinding,
    progressByBinding,
    statusByBinding,
    statsByBinding,
    connect,
    disconnect,
    /** Add a log line for a binding programmatically (e.g. config preview lines from install wizard) */
    pushBindingLog(bindingId: number, line: string) {
      if (!line) return;
      addLine(bindingId, line);
    },
  };
}
