import { ref, onUnmounted } from "vue";

interface WebSocketMessage {
  id: string;
  title: string;
  content: string;
  type: "system" | "task" | "approval";
  isRead: boolean;
  createTime: string;
  sender?: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;
const messageHandlers: MessageHandler[] = [];

export function useWebSocket() {
  const isConnected = ref(false);
  const reconnectAttempts = ref(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  /**
   * 连接 WebSocket
   */
  const connect = () => {
    // 如果已经连接，直接返回
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // TODO: 替换为实际的 WebSocket 地址
      const wsUrl =
        import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws/message";
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket 连接成功");
        isConnected.value = true;
        reconnectAttempts.value = 0;

        // 启动心跳
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("收到 WebSocket 消息:", message);

          // 通知所有监听器
          messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          console.error("解析 WebSocket 消息失败:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket 错误:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket 连接关闭");
        isConnected.value = false;
        stopHeartbeat();

        // 尝试重连
        if (reconnectAttempts.value < maxReconnectAttempts) {
          reconnectAttempts.value++;
          console.log(
            `尝试重连 WebSocket (${reconnectAttempts.value}/${maxReconnectAttempts})...`,
          );

          reconnectTimer = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          console.error("WebSocket 重连失败，已达到最大重连次数");
        }
      };
    } catch (error) {
      console.error("创建 WebSocket 连接失败:", error);
    }
  };

  /**
   * 断开 WebSocket
   */
  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    stopHeartbeat();

    if (ws) {
      ws.close();
      ws = null;
    }

    isConnected.value = false;
  };

  /**
   * 发送消息
   */
  const send = (message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket 未连接，无法发送消息");
    }
  };

  /**
   * 监听消息
   */
  const onMessage = (handler: MessageHandler) => {
    messageHandlers.push(handler);

    // 返回取消监听的函数
    return () => {
      const index = messageHandlers.indexOf(handler);
      if (index > -1) {
        messageHandlers.splice(index, 1);
      }
    };
  };

  /**
   * 启动心跳
   */
  const startHeartbeat = () => {
    stopHeartbeat();

    heartbeatTimer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000); // 每 30 秒发送一次心跳
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

  // 组件卸载时断开连接
  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected,
    connect,
    disconnect,
    send,
    onMessage,
  };
}
