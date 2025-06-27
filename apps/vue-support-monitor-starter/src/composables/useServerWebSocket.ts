import { ref } from "vue";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";
import { splitToArray } from "@repo/utils";
import type { ServerWebSocketMessage } from "@/api/server";
import { SERVER_WS_MESSAGE_TYPE } from "@/api/server";

/**
 * WebSocket 消息处理器类型
 */
export type MessageHandler = (message: ServerWebSocketMessage) => void;

/**
 * WebSocket 连接状态
 */
export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

/**
 * 服务器 WebSocket 管理 Composable
 */
export function useServerWebSocket() {
  const stompClient = ref<any>(null);
  const state = ref<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
  });

  // 消息处理器映射
  const messageHandlers = new Map<string, Set<MessageHandler>>();

  // 统计未处理的消息类型
  const unhandledMessageTypes = new Set<string>();

  /**
   * 初始化 WebSocket 连接
   */
  const connect = async (): Promise<boolean> => {
    if (stompClient.value && stompClient.value.connected) {
      return true;
    }

    if (state.value.connecting) {
      return false;
    }

    try {
      state.value.connecting = true;
      state.value.error = null;

      const config = getConfig();
      stompClient.value = socket(splitToArray(config.SocketUrl), undefined, {});

      // 连接成功
      state.value.connected = true;
      state.value.connecting = false;
      console.log("服务器 WebSocket 连接成功");

      // 订阅服务器主题
      subscribeToServerTopic();

      return true;
    } catch (error) {
      console.error("WebSocket 连接异常:", error);
      state.value.connected = false;
      state.value.connecting = false;
      state.value.error = error instanceof Error ? error.message : "连接失败";

      // 5秒后重连
      setTimeout(() => {
        if (!state.value.connected) {
          connect();
        }
      }, 5000);

      return false;
    }
  };

  /**
   * 订阅服务器主题
   */
  const subscribeToServerTopic = () => {
    if (!stompClient.value) return;

    const serverTopic = "gen/server";

    stompClient.value.on(serverTopic, (message: any) => {
      try {
        const data = JSON.parse(message.data);
        handleServerMessage(data);
      } catch (error) {
        console.error("解析 WebSocket 消息失败:", error);
      }
    });

    console.log("已订阅服务器主题:", serverTopic);
  };

  /**
   * 处理服务器消息
   */
  const handleServerMessage = (message: ServerWebSocketMessage) => {
    if (!message.messageType) {
      console.warn("收到无效的 WebSocket 消息:", message);
      return;
    }

    console.debug("处理 WebSocket 消息:", message.messageType, message);

    // 调用对应消息类型的处理器
    const handlers = messageHandlers.get(message.messageType);
    if (handlers && handlers.size > 0) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`处理消息 ${message.messageType} 时出错:`, error);
        }
      });
    } else {
      // 记录未处理的消息类型
      if (!unhandledMessageTypes.has(message.messageType)) {
        unhandledMessageTypes.add(message.messageType);
        console.warn("未找到消息类型处理器:", message.messageType, "消息内容:", message);
      } else {
        console.debug("未找到消息类型处理器:", message.messageType);
      }
    }
  };

  /**
   * 注册消息处理器
   */
  const onMessage = (messageType: string, handler: MessageHandler) => {
    if (!messageHandlers.has(messageType)) {
      messageHandlers.set(messageType, new Set());
    }
    messageHandlers.get(messageType)!.add(handler);

    // 返回取消注册函数
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
   * 发送消息到服务器
   */
  const sendMessage = (message: Partial<ServerWebSocketMessage>): boolean => {
    if (!stompClient.value || !state.value.connected) {
      console.warn("WebSocket 未连接，无法发送消息");
      return false;
    }

    try {
      const fullMessage: ServerWebSocketMessage = {
        timestamp: Date.now(),
        ...message,
      } as ServerWebSocketMessage;

      stompClient.value.emit("gen/server", JSON.stringify(fullMessage));
      return true;
    } catch (error) {
      console.error("发送 WebSocket 消息失败:", error);
      return false;
    }
  };

  /**
   * 断开连接
   */
  const disconnect = () => {
    if (stompClient.value) {
      try {
        // Socket.IO 客户端使用 close() 方法断开连接
        if (typeof stompClient.value.close === "function") {
          stompClient.value.close();
        } else if (typeof stompClient.value.disconnect === "function") {
          stompClient.value.disconnect();
        }
      } catch (error) {
        console.error("断开 WebSocket 连接失败:", error);
      }
      stompClient.value = null;
    }

    state.value.connected = false;
    state.value.connecting = false;
    state.value.error = null;

    // 清空消息处理器
    messageHandlers.clear();
  };

  /**
   * 重连
   */
  const reconnect = async (): Promise<boolean> => {
    disconnect();
    return await connect();
  };



  /**
   * 获取未处理的消息类型统计
   */
  const getUnhandledMessageTypes = () => {
    return Array.from(unhandledMessageTypes);
  };

  return {
    // 状态
    state,

    // 方法
    connect,
    disconnect,
    reconnect,
    onMessage,
    sendMessage,
    getUnhandledMessageTypes,

    // 消息类型常量
    MESSAGE_TYPE: SERVER_WS_MESSAGE_TYPE,
  };
}

/**
 * 服务器指标监听 Composable
 */
export function useServerMetrics(serverId?: number) {
  const { onMessage, MESSAGE_TYPE } = useServerWebSocket();

  /**
   * 监听服务器指标数据
   */
  const onServerMetrics = (handler: (metrics: any, message: ServerWebSocketMessage) => void) => {
    return onMessage(MESSAGE_TYPE.SERVER_METRICS, (message) => {
      // 如果指定了serverId，只处理对应服务器的指标
      if (serverId && message.serverId !== serverId) {
        return;
      }

      if (message.data) {
        handler(message.data, message);
      }
    });
  };

  return {
    onServerMetrics,
  };
}

/**
 * SSH WebSocket 处理 Composable
 */
export function useSSHWebSocket(serverId: number) {
  const { onMessage, sendMessage, MESSAGE_TYPE, connect, disconnect } = useServerWebSocket();

  // 存储取消订阅函数，防止重复监听
  const unsubscribeFunctions = new Set<() => void>();

  /**
   * 发送 SSH 连接请求
   */
  const connectSSH = (serverHost: string, serverPort: number) => {
    disconnect();
    if (!connect()) {
      return false;
    }
    return sendMessage({
      messageType: MESSAGE_TYPE.SSH_CONNECT,
      serverId,
      serverHost,
      serverPort,
    });
  };

  /**
   * 发送 SSH 输入
   */
  const sendSSHInput = (input: string) => {
    return sendMessage({
      messageType: MESSAGE_TYPE.SSH_INPUT,
      serverId,
      data: input,
    });
  };

  /**
   * 断开 SSH 连接
   */
  const disconnectSSH = (reason?: string) => {
    let result = sendMessage({
      messageType: MESSAGE_TYPE.SSH_DISCONNECT,
      serverId,
      errorMessage: reason,
    });
    disconnect();
    return result;
  };

  /**
   * 监听 SSH 数据
   */
  const onSSHData = (handler: (data: string) => void) => {
    // 不自动清理之前的监听器，让调用者决定何时清理
    // cleanupSubscriptions();

    // 监听 SSH_DATA 消息类型
    const unsubscribeSSHData = onMessage(MESSAGE_TYPE.SSH_DATA, (message) => {
      if (message.serverId == serverId && typeof message.data === "string") {
        handler(message.data);
      }
    });

    // 监听 SHELL_OUTPUT 消息类型
    const unsubscribeShellOutput = onMessage(MESSAGE_TYPE.SHELL_OUTPUT, (message) => {
      if (message.serverId == serverId && message.data) {
        // shell_output 消息的数据结构: { output: string, type: "output" }
        if (typeof message.data === 'object' && message.data.output) {
          handler(message.data.output);
        } else if (typeof message.data === "string") {
          handler(message.data);
        }
      }
    });

    // 保存取消订阅函数
    unsubscribeFunctions.add(unsubscribeSSHData);
    unsubscribeFunctions.add(unsubscribeShellOutput);

    // 返回取消订阅函数
    return () => {
      unsubscribeSSHData();
      unsubscribeShellOutput();
      unsubscribeFunctions.delete(unsubscribeSSHData);
      unsubscribeFunctions.delete(unsubscribeShellOutput);
    };
  };

  /**
   * 监听 SSH 连接状态
   */
  const onSSHStatus = (
    handler: (
      status: "connected" | "disconnected" | "error",
      message?: string
    ) => void
  ) => {
    const unsubscribeConnect = onMessage(
      MESSAGE_TYPE.SSH_CONNECT,
      (message) => {
        if (message.serverId == serverId) {
          handler("connected");
        }
      }
    );

    const unsubscribeDisconnect = onMessage(
      MESSAGE_TYPE.SSH_DISCONNECT,
      (message) => {
        if (message.serverId == serverId) {
          handler("disconnected", message.errorMessage);
        }
      }
    );

    const unsubscribeError = onMessage(MESSAGE_TYPE.SSH_ERROR, (message) => {
      if (message.serverId == serverId) {
        handler("error", message.errorMessage);
      }
    });

    // 保存取消订阅函数
    unsubscribeFunctions.add(unsubscribeConnect);
    unsubscribeFunctions.add(unsubscribeDisconnect);
    unsubscribeFunctions.add(unsubscribeError);

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeError();
      unsubscribeFunctions.delete(unsubscribeConnect);
      unsubscribeFunctions.delete(unsubscribeDisconnect);
      unsubscribeFunctions.delete(unsubscribeError);
    };
  };

  /**
   * 清理所有订阅
   */
  const cleanupSubscriptions = () => {
    unsubscribeFunctions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('清理订阅时出错:', error);
      }
    });
    unsubscribeFunctions.clear();
  };

  return {
    connectSSH,
    sendSSHInput,
    disconnectSSH,
    onSSHData,
    onSSHStatus,
    cleanupSubscriptions,
  };
}
