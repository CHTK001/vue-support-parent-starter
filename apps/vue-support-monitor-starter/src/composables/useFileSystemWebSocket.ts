import { ref, reactive, onUnmounted } from "vue";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";
import type {
  FileSystemRealtimeStatus,
  UploadQueueStatus,
  FileSystem,
} from "@/api/monitor/filesystem";

// WebSocket消息类型
export const FILE_SYSTEM_WS_MESSAGE_TYPE = {
  // 文件上传相关
  UPLOAD_PROGRESS: "upload_progress",
  UPLOAD_STATUS: "upload_status",
  UPLOAD_COMPLETED: "upload_completed",
  UPLOAD_FAILED: "upload_failed",

  // 文件合并相关
  MERGE_PROGRESS: "merge_progress",
  MERGE_COMPLETED: "merge_completed",
  MERGE_FAILED: "merge_failed",

  // 系统状态相关
  SYSTEM_STATUS: "system_status",
  QUEUE_STATUS: "queue_status",
  STATISTICS_UPDATE: "statistics_update",

  // 文件操作相关
  FILE_CREATED: "file_created",
  FILE_DELETED: "file_deleted",
  FILE_UPDATED: "file_updated",
} as const;

export type FileSystemWebSocketMessageType =
  (typeof FILE_SYSTEM_WS_MESSAGE_TYPE)[keyof typeof FILE_SYSTEM_WS_MESSAGE_TYPE];

// WebSocket消息接口
export interface FileSystemWebSocketMessage {
  messageType: FileSystemWebSocketMessageType;
  timestamp: number;
  data?: any;
  fileId?: number;
  fileName?: string;
  error?: string;
}

// 连接状态
export interface FileSystemWebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastHeartbeat: number;
  reconnectAttempts: number;
}

/**
 * 文件系统WebSocket连接管理
 */
export function useFileSystemWebSocket() {
  // 连接状态
  const state = ref<FileSystemWebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastHeartbeat: 0,
    reconnectAttempts: 0,
  });

  // Socket实例
  const socketClient = ref<any>(null);

  // 实时状态数据
  const realtimeStatus = reactive<FileSystemRealtimeStatus>({
    uploadingCount: 0,
    mergingCount: 0,
    queueLength: 0,
    totalSpeed: 0,
    activeConnections: 0,
    systemLoad: 0,
  });

  // 上传队列状态
  const queueStatus = ref<Map<number, UploadQueueStatus>>(new Map());

  // 消息处理器映射
  const messageHandlers = new Map<
    FileSystemWebSocketMessageType,
    Set<(message: FileSystemWebSocketMessage) => void>
  >();

  /**
   * 注册消息处理器
   */
  const onMessage = (
    messageType: FileSystemWebSocketMessageType,
    handler: (message: FileSystemWebSocketMessage) => void
  ) => {
    if (!messageHandlers.has(messageType)) {
      messageHandlers.set(messageType, new Set());
    }
    messageHandlers.get(messageType)!.add(handler);

    // 返回取消订阅函数
    return () => {
      const handlers = messageHandlers.get(messageType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlers.delete(messageType);
        }
      }
    };
  };

  /**
   * 处理接收到的消息
   */
  const handleMessage = (message: FileSystemWebSocketMessage) => {
    try {
      // 更新心跳时间
      state.value.lastHeartbeat = Date.now();

      // 处理系统状态更新
      if (
        message.messageType === FILE_SYSTEM_WS_MESSAGE_TYPE.SYSTEM_STATUS &&
        message.data
      ) {
        Object.assign(realtimeStatus, message.data);
      }

      // 处理队列状态更新
      if (
        message.messageType === FILE_SYSTEM_WS_MESSAGE_TYPE.QUEUE_STATUS &&
        message.data
      ) {
        const queueData = message.data as UploadQueueStatus;
        queueStatus.value.set(queueData.fileId, queueData);
      }

      // 调用注册的处理器
      const handlers = messageHandlers.get(message.messageType);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            console.error(`处理消息失败 [${message.messageType}]:`, error);
          }
        });
      }
    } catch (error) {
      console.error("处理WebSocket消息失败:", error);
    }
  };

  /**
   * 连接WebSocket
   */
  const connect = async () => {
    if (state.value.connected || state.value.connecting) {
      return;
    }

    try {
      state.value.connecting = true;
      state.value.error = null;

      const config = getConfig();
      const socketUrls = config.SocketUrl?.split(",") || [];

      socketClient.value = socket(socketUrls, "/socket.io", {
        transports: ["websocket", "polling"],
        timeout: 10000,
        forceNew: true,
      });

      // 连接成功
      socketClient.value.on("connect", () => {
        state.value.connected = true;
        state.value.connecting = false;
        state.value.reconnectAttempts = 0;
        state.value.lastHeartbeat = Date.now();
        console.log("文件系统WebSocket连接成功");

        // 订阅文件系统相关事件
        socketClient.value.emit("subscribe", "filesystem");
      });

      // 连接断开
      socketClient.value.on("disconnect", (reason: string) => {
        state.value.connected = false;
        state.value.connecting = false;
        console.log("文件系统WebSocket连接断开:", reason);
      });

      // 连接错误
      socketClient.value.on("connect_error", (error: any) => {
        state.value.connected = false;
        state.value.connecting = false;
        state.value.error = error.message || "连接失败";
        state.value.reconnectAttempts++;
        console.error("文件系统WebSocket连接错误:", error);
      });

      // 监听文件系统消息
      socketClient.value.on("filesystem", (data: any) => {
        try {
          const message = typeof data === "string" ? JSON.parse(data) : data;
          handleMessage(message);
        } catch (error) {
          console.error("解析文件系统消息失败:", error);
        }
      });
    } catch (error) {
      state.value.connecting = false;
      state.value.error = error instanceof Error ? error.message : "连接失败";
      console.error("文件系统WebSocket连接失败:", error);
    }
  };

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (socketClient.value) {
      socketClient.value.disconnect();
      socketClient.value = null;
    }
    state.value.connected = false;
    state.value.connecting = false;
    state.value.error = null;
  };

  /**
   * 重新连接
   */
  const reconnect = async () => {
    disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await connect();
  };

  /**
   * 发送消息
   */
  const sendMessage = (message: Partial<FileSystemWebSocketMessage>) => {
    if (!state.value.connected || !socketClient.value) {
      console.warn("WebSocket未连接，无法发送消息");
      return false;
    }

    try {
      socketClient.value.emit("filesystem", {
        timestamp: Date.now(),
        ...message,
      });
      return true;
    } catch (error) {
      console.error("发送WebSocket消息失败:", error);
      return false;
    }
  };

  /**
   * 检查连接状态
   */
  const isConnected = () => state.value.connected;

  // 组件卸载时清理
  onUnmounted(() => {
    disconnect();
    messageHandlers.clear();
  });

  return {
    // 状态
    state,
    realtimeStatus,
    queueStatus,
    isConnected,

    // 方法
    connect,
    disconnect,
    reconnect,
    onMessage,
    sendMessage,

    // 消息类型常量
    MESSAGE_TYPE: FILE_SYSTEM_WS_MESSAGE_TYPE,
  };
}

/**
 * 文件上传进度监听
 */
export function useFileUploadProgress() {
  const { onMessage, MESSAGE_TYPE } = useFileSystemWebSocket();

  const uploadProgresses = ref<Map<number, number>>(new Map());

  // 监听上传进度
  const unsubscribeProgress = onMessage(
    MESSAGE_TYPE.UPLOAD_PROGRESS,
    (message) => {
      if (message.fileId && message.data?.progress !== undefined) {
        uploadProgresses.value.set(message.fileId, message.data.progress);
      }
    }
  );

  // 监听上传完成
  const unsubscribeCompleted = onMessage(
    MESSAGE_TYPE.UPLOAD_COMPLETED,
    (message) => {
      if (message.fileId) {
        uploadProgresses.value.set(message.fileId, 100);
      }
    }
  );

  // 监听上传失败
  const unsubscribeFailed = onMessage(MESSAGE_TYPE.UPLOAD_FAILED, (message) => {
    if (message.fileId) {
      uploadProgresses.value.delete(message.fileId);
    }
  });

  onUnmounted(() => {
    unsubscribeProgress();
    unsubscribeCompleted();
    unsubscribeFailed();
  });

  return {
    uploadProgresses,
  };
}
