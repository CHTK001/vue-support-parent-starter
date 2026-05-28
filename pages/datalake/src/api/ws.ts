import { ref, onUnmounted } from "vue";

type WsMessageHandler = (data: any) => void;

/**
 * Datalake WebSocket 连接管理器
 * 全局单例，自动重连，支持消息监听
 */
const isConnected = ref(false);
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const handlers = new Set<WsMessageHandler>();

function getWsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  // WS runs on HTTP port + 1
  const port = 58082;
  return `${protocol}//${hostname()}:${port}/v2/datalake/ws`;

  function hostname(): string {
    try {
      return new URL(window.location.href).hostname;
    } catch {
      return "localhost";
    }
  }
}

export function connectWs() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    ws = new WebSocket(getWsUrl());

    ws.onopen = () => {
      isConnected.value = true;
      reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handlers.forEach((h) => h(data));
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      isConnected.value = false;
      ws = null;
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws?.close();
    };
  } catch {
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer || reconnectAttempts >= maxReconnectAttempts) return;
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWs();
  }, delay);
}

export function disconnectWs() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  isConnected.value = false;
}

export function sendWsMessage(msg: any) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
}

export function onWsMessage(handler: WsMessageHandler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export function useDatalakeWs() {
  onUnmounted(() => {
    // Don't disconnect on unmount — keep alive for other pages
  });

  return {
    isConnected,
    connect: connectWs,
    disconnect: disconnectWs,
    send: sendWsMessage,
    onMessage: onWsMessage,
  };
}
