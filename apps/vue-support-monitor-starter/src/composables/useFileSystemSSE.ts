import { ref, reactive, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import type {
  FileSystemRealtimeStatus,
  UploadQueueStatus,
  FileSystem,
} from "@/api/monitor/filesystem";
import { getConfig } from "@repo/config";

// SSE连接状态
interface FileSystemSSEState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastHeartbeat: number;
  reconnectAttempts: number;
  clientId: string | null;
}

// SSE消息类型
export enum SSE_MESSAGE_TYPE {
  UPLOAD_PROGRESS = "upload_progress",
  UPLOAD_COMPLETED = "upload_completed",
  UPLOAD_FAILED = "upload_failed",
  MERGE_PROGRESS = "merge_progress",
  MERGE_COMPLETED = "merge_completed",
  MERGE_FAILED = "merge_failed",
  FILE_DELETED = "file_deleted",
  SYSTEM_STATUS = "system_status",
  QUEUE_STATUS = "queue_status",
  CONNECTED = "connected",
  ERROR = "error",
}

// SSE消息接口
interface FileSystemSSEMessage {
  type: SSE_MESSAGE_TYPE;
  data: any;
  timestamp: number;
}

/**
 * 文件系统SSE连接管理
 */
export function useFileSystemSSE() {
  // 连接状态
  const state = ref<FileSystemSSEState>({
    connected: false,
    connecting: false,
    error: null,
    lastHeartbeat: 0,
    reconnectAttempts: 0,
    clientId: null,
  });

  // SSE实例
  const eventSource = ref<EventSource | null>(null);

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
    SSE_MESSAGE_TYPE,
    Set<(message: FileSystemSSEMessage) => void>
  >();

  // 心跳定时器
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;

  // 常量配置
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;
  const HEARTBEAT_INTERVAL = 30000;

  /**
   * 处理SSE消息
   */
  const handleMessage = (message: FileSystemSSEMessage) => {
    console.log("收到文件系统SSE消息:", message);

    // 更新心跳时间
    state.value.lastHeartbeat = Date.now();

    // 处理不同类型的消息
    switch (message.type) {
      case SSE_MESSAGE_TYPE.UPLOAD_PROGRESS:
        handleUploadProgress(message.data);
        break;
      case SSE_MESSAGE_TYPE.UPLOAD_COMPLETED:
        handleUploadCompleted(message.data);
        break;
      case SSE_MESSAGE_TYPE.UPLOAD_FAILED:
        handleUploadFailed(message.data);
        break;
      case SSE_MESSAGE_TYPE.MERGE_PROGRESS:
        handleMergeProgress(message.data);
        break;
      case SSE_MESSAGE_TYPE.MERGE_COMPLETED:
        handleMergeCompleted(message.data);
        break;
      case SSE_MESSAGE_TYPE.MERGE_FAILED:
        handleMergeFailed(message.data);
        break;
      case SSE_MESSAGE_TYPE.SYSTEM_STATUS:
        handleSystemStatus(message.data);
        break;
      case SSE_MESSAGE_TYPE.QUEUE_STATUS:
        handleQueueStatus(message.data);
        break;
      case SSE_MESSAGE_TYPE.CONNECTED:
        handleConnected(message.data);
        break;
      case SSE_MESSAGE_TYPE.ERROR:
        handleError(message.data);
        break;
    }

    // 调用注册的消息处理器
    const handlers = messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error("消息处理器执行失败:", error);
        }
      });
    }
  };

  /**
   * 处理上传进度
   */
  const handleUploadProgress = (data: any) => {
    if (data.fileId && data.progress !== undefined) {
      const status = queueStatus.value.get(data.fileId) || {
        fileId: data.fileId,
        fileName: data.fileName || "",
        progress: 0,
        status: "uploading",
        speed: 0,
        remainingTime: 0,
        error: null,
      };

      status.progress = data.progress;
      status.speed = data.speed || 0;
      status.remainingTime = data.remainingTime || 0;

      queueStatus.value.set(data.fileId, status);
    }
  };

  /**
   * 处理上传完成
   */
  const handleUploadCompleted = (data: any) => {
    if (data.fileId) {
      const status = queueStatus.value.get(data.fileId);
      if (status) {
        status.progress = 100;
        status.status = "completed";
        queueStatus.value.set(data.fileId, status);
      }
    }
    ElMessage.success(data.message || "文件上传完成");
  };

  /**
   * 处理上传失败
   */
  const handleUploadFailed = (data: any) => {
    if (data.fileId) {
      const status = queueStatus.value.get(data.fileId);
      if (status) {
        status.status = "failed";
        status.error = data.error || "上传失败";
        queueStatus.value.set(data.fileId, status);
      }
    }
    ElMessage.error(data.message || "文件上传失败");
  };

  /**
   * 处理合并进度
   */
  const handleMergeProgress = (data: any) => {
    if (data.fileId && data.progress !== undefined) {
      const status = queueStatus.value.get(data.fileId);
      if (status) {
        status.status = "merging";
        status.progress = data.progress;
        queueStatus.value.set(data.fileId, status);
      }
    }
  };

  /**
   * 处理合并完成
   */
  const handleMergeCompleted = (data: any) => {
    if (data.fileId) {
      const status = queueStatus.value.get(data.fileId);
      if (status) {
        status.progress = 100;
        status.status = "completed";
        queueStatus.value.set(data.fileId, status);
      }
    }
    ElMessage.success(data.message || "文件合并完成");
  };

  /**
   * 处理合并失败
   */
  const handleMergeFailed = (data: any) => {
    if (data.fileId) {
      const status = queueStatus.value.get(data.fileId);
      if (status) {
        status.status = "failed";
        status.error = data.error || "合并失败";
        queueStatus.value.set(data.fileId, status);
      }
    }
    ElMessage.error(data.message || "文件合并失败");
  };

  /**
   * 处理系统状态更新
   */
  const handleSystemStatus = (data: any) => {
    Object.assign(realtimeStatus, data);
  };

  /**
   * 处理队列状态更新
   */
  const handleQueueStatus = (data: any) => {
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        if (item.fileId) {
          queueStatus.value.set(item.fileId, item);
        }
      });
    }
  };

  /**
   * 处理连接成功
   */
  const handleConnected = (data: any) => {
    state.value.clientId = data.clientId;
    console.log("文件系统SSE连接成功，客户端ID:", data.clientId);
  };

  /**
   * 处理错误消息
   */
  const handleError = (data: any) => {
    console.error("文件系统SSE错误:", data);
    ElMessage.error(data.message || "系统错误");
  };

  /**
   * 建立SSE连接
   */
  const connect = () => {
    if (state.value.connected || state.value.connecting) {
      console.log("文件系统SSE已连接或正在连接中");
      return;
    }

    try {
      state.value.connecting = true;
      state.value.error = null;

      // 生成客户端ID
      const clientId = `filesystem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 创建SSE连接
      const url =
        getConfig().BaseUrl + `/v1/filesystem/sse/connect?clientId=${clientId}`;
      eventSource.value = new EventSource(url);

      // 连接打开
      eventSource.value.onopen = () => {
        state.value.connected = true;
        state.value.connecting = false;
        state.value.reconnectAttempts = 0;
        state.value.lastHeartbeat = Date.now();
        console.log("文件系统SSE连接已建立");

        // 启动心跳
        startHeartbeat();

        // 订阅所有事件类型
        subscribeToEvents();
      };

      // 接收消息
      eventSource.value.onmessage = (event) => {
        try {
          console.log("收到SSE原始消息:", event.data, "类型:", event.type);

          // 检查数据是否为空或undefined
          if (!event.data || event.data === "undefined") {
            console.warn("收到空的SSE消息数据:", event.data);
            return;
          }

          const data = JSON.parse(event.data);
          const message: FileSystemSSEMessage = {
            type:
              (event.type as SSE_MESSAGE_TYPE) ||
              SSE_MESSAGE_TYPE.SYSTEM_STATUS,
            data: data,
            timestamp: Date.now(),
          };
          handleMessage(message);
        } catch (error) {
          console.error(
            "解析文件系统SSE消息失败 (event.data):",
            event.data,
            "error:",
            error
          );
        }
      };

      // 监听特定事件类型
      Object.values(SSE_MESSAGE_TYPE).forEach((eventType) => {
        eventSource.value!.addEventListener(eventType, (event: any) => {
          try {
            console.log(`收到SSE特定事件 ${eventType}:`, event.data);

            // 检查数据是否为空或undefined
            if (!event.data || event.data === "undefined") {
              console.warn(`收到空的SSE消息数据 (${eventType}):`, event.data);
              return;
            }

            const data = JSON.parse(event.data);
            const message: FileSystemSSEMessage = {
              type: eventType,
              data: data,
              timestamp: Date.now(),
            };
            handleMessage(message);
          } catch (error) {
            console.error(
              `解析文件系统SSE消息失败 (${eventType}):`,
              event.data,
              "error:",
              error
            );
          }
        });
      });

      // 连接错误
      eventSource.value.onerror = (error) => {
        // 检查 EventSource 的状态
        const es = eventSource.value;
        const readyState = es?.readyState;

        console.error("文件系统SSE连接错误:", error, "readyState:", readyState);

        // 停止心跳
        stopHeartbeat();

        // 如果连接已关闭（CLOSED = 2），清理状态
        if (readyState === EventSource.CLOSED) {
          state.value.connected = false;
          state.value.connecting = false;

          // 只有在之前是连接状态才尝试重连，避免初始连接失败时无限重连
          if (state.value.lastHeartbeat > 0) {
            state.value.error = "连接已断开";

            // 尝试重连
            if (state.value.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              state.value.reconnectAttempts++;
              console.log(
                `文件系统SSE重连尝试 ${state.value.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`
              );

              // 清理旧的重连定时器
              if (reconnectTimer) {
                clearTimeout(reconnectTimer);
              }

              reconnectTimer = setTimeout(() => {
                // 再次检查是否需要重连
                if (!state.value.connected && !state.value.connecting) {
                  connect();
                }
              }, RECONNECT_DELAY);
            } else {
              console.error("文件系统SSE重连次数已达上限，停止重连");
              ElMessage.error("文件系统连接失败，请刷新页面重试");
            }
          } else {
            // 初始连接失败，不自动重连
            state.value.error = "连接失败";
            console.warn("文件系统SSE初始连接失败，不自动重连");
          }
        } else if (readyState === EventSource.CONNECTING) {
          // 正在重连中（CONNECTING = 0），等待浏览器自动重连
          console.log("文件系统SSE正在重连中...");
          state.value.connecting = true;
          state.value.connected = false;
        }
      };
    } catch (error) {
      state.value.connecting = false;
      state.value.error = error instanceof Error ? error.message : "连接失败";
      console.error("文件系统SSE连接失败:", error);
    }
  };

  /**
   * 断开SSE连接
   */
  const disconnect = () => {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }

    state.value.connected = false;
    state.value.connecting = false;
    state.value.clientId = null;

    // 停止心跳和重连定时器
    stopHeartbeat();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    console.log("文件系统SSE连接已断开");
  };

  /**
   * 启动心跳
   */
  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
      if (state.value.connected && state.value.clientId) {
        // 发送心跳请求
        fetch(getConfig().BaseUrl + "/v1/filesystem/sse/heartbeat", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `clientId=${state.value.clientId}`,
        }).catch((error) => {
          console.error("发送文件系统SSE心跳失败:", error);
        });
      }
    }, HEARTBEAT_INTERVAL);
  };

  /**
   * 停止心跳
   */
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  /**
   * 订阅事件
   */
  const subscribeToEvents = () => {
    if (!state.value.clientId) return;

    const eventTypes = Object.values(SSE_MESSAGE_TYPE).join(",");
    fetch(getConfig().BaseUrl + "/v1/filesystem/sse/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `clientId=${state.value.clientId}&eventTypes=${eventTypes}`,
    }).catch((error) => {
      console.error("订阅文件系统SSE事件失败:", error);
    });
  };

  /**
   * 注册消息处理器
   */
  const onMessage = (
    type: SSE_MESSAGE_TYPE,
    handler: (message: FileSystemSSEMessage) => void
  ) => {
    if (!messageHandlers.has(type)) {
      messageHandlers.set(type, new Set());
    }
    messageHandlers.get(type)!.add(handler);

    // 返回取消注册函数
    return () => {
      const handlers = messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          messageHandlers.delete(type);
        }
      }
    };
  };

  // 组件卸载时自动断开连接
  onUnmounted(() => {
    disconnect();
  });

  return {
    state,
    realtimeStatus,
    queueStatus,
    connect,
    disconnect,
    onMessage,
    MESSAGE_TYPE: SSE_MESSAGE_TYPE,
  };
}
