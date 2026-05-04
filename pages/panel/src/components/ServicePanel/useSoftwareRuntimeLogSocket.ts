import { getCurrentScope, onScopeDispose, ref } from "vue";
import { useSocketService, SoftTopics, ProjectTopics } from "@repo/core";
import type { WsMessage } from "@repo/core";

export function useSoftwareRuntimeLogSocket() {
  const connected = ref(false);
  const error = ref<string | null>(null);
  const logsByBinding = ref<Record<number, string[]>>({});

  const cleanupFns: Array<() => void> = [];

  const disconnect = () => {
    while (cleanupFns.length) cleanupFns.pop()?.();
    connected.value = false;
  };

  const addLine = (bindingId: number, line: string) => {
    if (!line) return;
    if (!logsByBinding.value[bindingId]) {
      logsByBinding.value[bindingId] = [];
    }
    logsByBinding.value[bindingId].push(line);
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
    connect,
    disconnect,
  };
}
