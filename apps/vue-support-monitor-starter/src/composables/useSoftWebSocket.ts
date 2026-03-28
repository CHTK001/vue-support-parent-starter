/**
 * 软件管理实时消息封装
 * 基于现有全局 Socket 服务，对旧版 useSoftWebSocket 调用保持兼容。
 */

import { reactive, ref, onUnmounted } from "vue";
import { MonitorTopics, useGlobalSocket } from "@repo/core";
import { message as notify } from "@repo/utils";
import { getWebSocketTopics } from "@/api/soft";

export const SOFT_WS_MESSAGE_TYPE = {
  CONTAINER_STATUS_CHANGED: "container_status_changed",
  CONTAINER_CREATED: "container_created",
  CONTAINER_REMOVED: "container_removed",
  CONTAINER_STARTED: "container_started",
  CONTAINER_STOPPED: "container_stopped",
  CONTAINER_RESTARTED: "container_restarted",
  CONTAINER_LOG: "container_log",
  CONTAINER_LOG_ERROR: "container_log_error",
  CONTAINER_STATS: "container_stats",
  CONTAINER_RESOURCE_USAGE: "container_resource_usage",
  INSTALL_PROGRESS: "install_progress",
  INSTALL_STARTED: "install_started",
  INSTALL_COMPLETED: "install_completed",
  INSTALL_FAILED: "install_failed",
  UNINSTALL_PROGRESS: "uninstall_progress",
  UNINSTALL_STARTED: "uninstall_started",
  UNINSTALL_COMPLETED: "uninstall_completed",
  UNINSTALL_FAILED: "uninstall_failed",
  SOFT_SYNC_PROGRESS: "soft_sync_progress",
  SOFT_SYNC_COMPLETED: "soft_sync_completed",
  SOFT_SYNC_FAILED: "soft_sync_failed",
  SYSTEM_STATUS: "system_status",
  HEARTBEAT: "heartbeat",
} as const;

export type SoftWebSocketMessageType =
  (typeof SOFT_WS_MESSAGE_TYPE)[keyof typeof SOFT_WS_MESSAGE_TYPE];

export interface SoftWebSocketMessage {
  type: SoftWebSocketMessageType;
  timestamp: number;
  data?: any;
  softId?: number;
  containerId?: string;
  serverId?: number;
  recordId?: number;
  error?: string;
}

export interface ContainerStatusMessage extends SoftWebSocketMessage {
  type: typeof SOFT_WS_MESSAGE_TYPE.CONTAINER_STATUS_CHANGED;
  data: {
    containerId: string;
    status: string;
    previousStatus?: string;
    softId?: number;
    serverId?: number;
  };
}

export interface InstallProgressMessage extends SoftWebSocketMessage {
  type: typeof SOFT_WS_MESSAGE_TYPE.INSTALL_PROGRESS;
  data: {
    recordId?: number;
    softId?: number;
    serverId?: number;
    progress?: number;
    stage?: string;
    message?: string;
  };
}

export interface ContainerLogMessage extends SoftWebSocketMessage {
  type: typeof SOFT_WS_MESSAGE_TYPE.CONTAINER_LOG;
  data: {
    containerId: string;
    log?: string;
    timestamp?: string;
    level?: "info" | "warn" | "error" | "debug";
  };
}

export interface ContainerStatsMessage extends SoftWebSocketMessage {
  type: typeof SOFT_WS_MESSAGE_TYPE.CONTAINER_STATS;
  data: {
    containerId: string;
    cpuUsage?: number;
    memoryUsage?: number;
    networkIO?: {
      rx?: number;
      tx?: number;
    };
    diskIO?: {
      read?: number;
      write?: number;
    };
  };
}

export interface SoftWebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastHeartbeat: number;
  reconnectAttempts: number;
}

export type SoftMessageHandler<T = SoftWebSocketMessage> = (message: T) => void;

const DEFAULT_TOPICS = {
  containerStatus: MonitorTopics.DOCKER.CONTAINER_STATUS,
  containerLogs: MonitorTopics.DOCKER.CONTAINER_LOG,
  containerStatistics: MonitorTopics.DOCKER.CONTAINER_STATISTICS,
  containerEvents: MonitorTopics.DOCKER.CONTAINER_EVENTS,
} as const;

const isSuccessCode = (code: unknown) =>
  code === "00000" || code === 0 || code === "0";

const normalizeContainerId = (payload: any) => {
  const raw =
    payload?.containerId ??
    payload?.systemSoftContainerId ??
    payload?.dockerId ??
    payload?.dataId;

  return raw !== undefined && raw !== null ? String(raw) : "";
};

const normalizeRecordId = (payload: any) => {
  const raw = payload?.recordId ?? payload?.systemSoftRecordId ?? payload?.dataId;
  return raw !== undefined && raw !== null ? Number(raw) : undefined;
};

const shouldKeepOperationEvent = (payload: any) => {
  const type = String(
    payload?.type ?? payload?.operationType ?? payload?.eventType ?? "",
  ).toLowerCase();

  return (
    !type ||
    type.includes("install") ||
    type.includes("software") ||
    type.includes("image_pull") ||
    type.includes("pull_image")
  );
};

export function useSoftWebSocket() {
  const globalSocket = useGlobalSocket();
  const state = reactive<SoftWebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastHeartbeat: 0,
    reconnectAttempts: 0,
  });

  const topics = ref({ ...DEFAULT_TOPICS });
  const messageHandlers = new Map<
    SoftWebSocketMessageType,
    Set<SoftMessageHandler>
  >();
  const topicListeners = new Map<string, (payload: any) => void>();
  const subscribedContainerStatuses = new Set<string>();
  const subscribedContainerLogs = new Set<string>();
  const subscribedInstallRecords = new Set<number>();
  let lifecycleBound = false;

  const dispatchMessage = (payload: SoftWebSocketMessage) => {
    state.lastHeartbeat = Date.now();
    const handlers = messageHandlers.get(payload.type);
    if (!handlers?.size) {
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`处理 Socket 消息失败 [${payload.type}]`, error);
      }
    });
  };

  const bindSocketLifecycle = () => {
    if (!globalSocket || lifecycleBound) {
      return;
    }

    lifecycleBound = true;

    globalSocket.on("connect", () => {
      state.connected = true;
      state.connecting = false;
      state.error = null;
      state.reconnectAttempts = 0;
    });

    globalSocket.on("disconnect", () => {
      state.connected = false;
      state.connecting = false;
    });

    globalSocket.on("connect_error", (error: any) => {
      state.connected = false;
      state.connecting = false;
      state.error = error?.message || "连接失败";
    });
  };

  const ensureTopicListener = (
    topic: string,
    factory: (payload: any) => SoftWebSocketMessage | null,
  ) => {
    if (!globalSocket || topicListeners.has(topic)) {
      return;
    }

    const listener = (payload: any) => {
      const message = factory(payload);
      if (message) {
        dispatchMessage(message);
      }
    };

    topicListeners.set(topic, listener);
    globalSocket.on(topic, listener);
  };

  const registerBusinessListeners = () => {
    ensureTopicListener(topics.value.containerStatus, (payload) => {
      const containerId = normalizeContainerId(payload);
      if (
        subscribedContainerStatuses.size > 0 &&
        containerId &&
        !subscribedContainerStatuses.has(containerId)
      ) {
        return null;
      }

      return {
        type: SOFT_WS_MESSAGE_TYPE.CONTAINER_STATUS_CHANGED,
        timestamp: Date.now(),
        containerId,
        softId: payload?.softId ?? payload?.systemSoftId,
        serverId: payload?.serverId ?? payload?.systemServerId,
        data: {
          containerId,
          status:
            payload?.status ??
            payload?.containerStatus ??
            payload?.systemSoftContainerStatus,
          previousStatus: payload?.previousStatus ?? payload?.oldStatus,
          softId: payload?.softId ?? payload?.systemSoftId,
          serverId: payload?.serverId ?? payload?.systemServerId,
        },
      };
    });

    ensureTopicListener(topics.value.containerLogs, (payload) => {
      const containerId = normalizeContainerId(payload);
      if (
        subscribedContainerLogs.size > 0 &&
        containerId &&
        !subscribedContainerLogs.has(containerId)
      ) {
        return null;
      }

      return {
        type: SOFT_WS_MESSAGE_TYPE.CONTAINER_LOG,
        timestamp: Date.now(),
        containerId,
        data: {
          containerId,
          log: payload?.log ?? payload?.message ?? payload?.data,
          timestamp: payload?.timestamp,
          level: payload?.level ?? "info",
        },
      };
    });

    ensureTopicListener(topics.value.containerStatistics, (payload) => {
      const containerId = normalizeContainerId(payload);
      if (
        subscribedContainerStatuses.size > 0 &&
        containerId &&
        !subscribedContainerStatuses.has(containerId)
      ) {
        return null;
      }

      return {
        type: SOFT_WS_MESSAGE_TYPE.CONTAINER_STATS,
        timestamp: Date.now(),
        containerId,
        data: {
          containerId,
          cpuUsage:
            payload?.cpuUsage ??
            payload?.systemSoftContainerStatsCpuPercent,
          memoryUsage:
            payload?.memoryUsage ??
            payload?.systemSoftContainerStatsMemoryPercent,
          networkIO: {
            rx:
              payload?.networkRx ??
              payload?.systemSoftContainerStatsNetworkRxBytes,
            tx:
              payload?.networkTx ??
              payload?.systemSoftContainerStatsNetworkTxBytes,
          },
          diskIO: {
            read:
              payload?.diskRead ?? payload?.systemSoftContainerStatsDiskRead,
            write:
              payload?.diskWrite ?? payload?.systemSoftContainerStatsDiskWrite,
          },
        },
      };
    });

    ensureTopicListener(MonitorTopics.SOFTWARE.INSTALL_PROGRESS, (payload) => {
      const recordId = normalizeRecordId(payload);
      if (
        subscribedInstallRecords.size > 0 &&
        recordId !== undefined &&
        !subscribedInstallRecords.has(recordId)
      ) {
        return null;
      }

      return {
        type: SOFT_WS_MESSAGE_TYPE.INSTALL_PROGRESS,
        timestamp: Date.now(),
        recordId,
        softId: payload?.softId ?? payload?.systemSoftId,
        serverId: payload?.serverId ?? payload?.systemServerId,
        data: {
          recordId,
          softId: payload?.softId ?? payload?.systemSoftId,
          serverId: payload?.serverId ?? payload?.systemServerId,
          progress: payload?.progress,
          stage: payload?.stage ?? payload?.currentStep,
          message: payload?.message,
        },
      };
    });

    ensureTopicListener(MonitorTopics.OPERATION.COMPLETE, (payload) => {
      if (!shouldKeepOperationEvent(payload)) {
        return null;
      }

      return {
        type: SOFT_WS_MESSAGE_TYPE.INSTALL_COMPLETED,
        timestamp: Date.now(),
        recordId: normalizeRecordId(payload),
        data: payload,
      };
    });

    ensureTopicListener(MonitorTopics.OPERATION.ERROR, (payload) => {
      if (!shouldKeepOperationEvent(payload)) {
        return null;
      }

      return {
        type: SOFT_WS_MESSAGE_TYPE.INSTALL_FAILED,
        timestamp: Date.now(),
        recordId: normalizeRecordId(payload),
        error: payload?.error ?? payload?.message,
        data: payload,
      };
    });
  };

  const connect = async () => {
    if (!globalSocket) {
      state.error = "全局 Socket 未初始化";
      state.connected = false;
      state.connecting = false;
      return false;
    }

    if (state.connected) {
      return true;
    }

    state.connecting = true;
    state.error = null;

    try {
      const topicResult = await getWebSocketTopics();
      if (isSuccessCode(topicResult?.code) && topicResult?.data) {
        topics.value = {
          ...DEFAULT_TOPICS,
          ...topicResult.data,
        };
      }
    } catch (error) {
      console.warn("获取 Docker Socket 主题失败，使用默认主题", error);
    }

    bindSocketLifecycle();
    registerBusinessListeners();

    if (!globalSocket.isConnected) {
      globalSocket.connect();
    }

    state.connected = globalSocket.isConnected;
    state.connecting = !globalSocket.isConnected;
    return true;
  };

  const disconnect = () => {
    if (globalSocket) {
      topicListeners.forEach((_, topic) => globalSocket.off(topic));
      if (lifecycleBound) {
        globalSocket.off("connect");
        globalSocket.off("disconnect");
        globalSocket.off("connect_error");
      }
    }

    topicListeners.clear();
    messageHandlers.clear();
    subscribedContainerStatuses.clear();
    subscribedContainerLogs.clear();
    subscribedInstallRecords.clear();
    lifecycleBound = false;
    state.connected = false;
    state.connecting = false;
    state.error = null;
  };

  const onMessage = <T extends SoftWebSocketMessage>(
    type: SoftWebSocketMessageType,
    handler: SoftMessageHandler<T>,
  ) => {
    if (!messageHandlers.has(type)) {
      messageHandlers.set(type, new Set());
    }

    messageHandlers.get(type)!.add(handler as SoftMessageHandler);
  };

  const offMessage = (
    type: SoftWebSocketMessageType,
    handler: SoftMessageHandler,
  ) => {
    const handlers = messageHandlers.get(type);
    if (!handlers) {
      return;
    }

    handlers.delete(handler);
    if (handlers.size === 0) {
      messageHandlers.delete(type);
    }
  };

  const subscribeContainerStatus = (containerId: string) => {
    if (containerId) {
      subscribedContainerStatuses.add(String(containerId));
    }
  };

  const unsubscribeContainerStatus = (containerId: string) => {
    if (containerId) {
      subscribedContainerStatuses.delete(String(containerId));
    }
  };

  const subscribeContainerLogs = (containerId: string) => {
    if (containerId) {
      subscribedContainerLogs.add(String(containerId));
    }
  };

  const unsubscribeContainerLogs = (containerId: string) => {
    if (containerId) {
      subscribedContainerLogs.delete(String(containerId));
    }
  };

  const subscribeInstallProgress = (recordId: number) => {
    if (recordId !== undefined && recordId !== null) {
      subscribedInstallRecords.add(Number(recordId));
    }
  };

  const unsubscribeInstallProgress = (recordId: number) => {
    if (recordId !== undefined && recordId !== null) {
      subscribedInstallRecords.delete(Number(recordId));
    }
  };

  const sendMessage = (message: Partial<SoftWebSocketMessage>) => {
    if (!globalSocket) {
      state.error = "全局 Socket 未初始化";
      return false;
    }

    if (!globalSocket.isConnected) {
      globalSocket.connect();
    }

    if (!message.type) {
      notify("未指定消息类型，无法发送 Socket 消息", { type: "warning" });
      return false;
    }

    globalSocket.emit(message.type, {
      timestamp: Date.now(),
      ...message,
    });
    return true;
  };

  onUnmounted(() => {
    disconnect();
  });

  return {
    state,
    topics,
    connect,
    disconnect,
    onMessage,
    offMessage,
    sendMessage,
    subscribeContainerStatus,
    unsubscribeContainerStatus,
    subscribeContainerLogs,
    unsubscribeContainerLogs,
    subscribeInstallProgress,
    unsubscribeInstallProgress,
    SOFT_WS_MESSAGE_TYPE,
  };
}
