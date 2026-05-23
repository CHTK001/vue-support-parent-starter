/**
 * 远程控制 Composable
 * 管理与 Gateway 的原生 WebSocket 连接，支持 SSH 终端和桌面远程
 *
 * @since 2026-05-22
 */
import { ref, reactive, onUnmounted, type Ref } from "vue";

// ============ 类型定义 ============

export type RemoteProtocol = "SSH" | "DESKTOP" | "AUTO";
export type RemoteCodec = "H264" | "JPEG";
export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export interface ConnectionSettings {
  /** Gateway WS 地址（如 ws://127.0.0.1:8082） */
  gatewayUrl: string;
  /** 目标 ID */
  targetId: string;
  /** 远程协议 */
  protocol: RemoteProtocol;
  /** 编码器 */
  codec?: RemoteCodec;
  /** 认证信息 */
  auth?: {
    username?: string;
    password?: string;
    host?: string;
    port?: number;
  };
}

export interface RemoteSession {
  sessionId: string;
  targetId: string;
  protocol: RemoteProtocol;
  state: ConnectionState;
  createdAt: number;
}

export interface DesktopFrameEvent {
  sessionId: string;
  width: number;
  height: number;
  keyFrame: boolean;
  data: ArrayBuffer;
}

// ============ 事件回调 ============

export interface RemoteControlCallbacks {
  /** 会话已连接 */
  onConnected?: (sessionId: string) => void;
  /** SSH 终端输出 */
  onTerminalOutput?: (sessionId: string, data: string) => void;
  /** 桌面帧到达 */
  onDesktopFrame?: (event: DesktopFrameEvent) => void;
  /** 连接错误 */
  onError?: (sessionId: string, msg: string) => void;
  /** 会话断开 */
  onDisconnected?: (sessionId: string) => void;
  /** WebSocket 连接状态变化 */
  onConnectionStateChange?: (state: ConnectionState) => void;
  /** 桌面指标 */
  onDesktopMetrics?: (sessionId: string, data: { fps?: number; memUsed?: number; memTotal?: number; mouseX?: number; mouseY?: number }) => void;
}

// ============ Composable ============

export function useRemoteControl(callbacks: RemoteControlCallbacks = {}) {
  const ws: Ref<WebSocket | null> = ref(null);
  const connectionState: Ref<ConnectionState> = ref("disconnected");
  const sessions = reactive<Map<string, RemoteSession>>(new Map());
  const activeSessionId: Ref<string | null> = ref(null);

  // 连接 Gateway
  function connectGateway(gatewayUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (ws.value?.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      connectionState.value = "connecting";
      callbacks.onConnectionStateChange?.("connecting");

      try {
        const socket = new WebSocket(gatewayUrl);
        ws.value = socket;

        socket.onopen = () => {
          connectionState.value = "connected";
          callbacks.onConnectionStateChange?.("connected");
          console.log("[RemoteControl] Gateway WebSocket 已连接");
          resolve(true);
        };

        socket.onclose = () => {
          connectionState.value = "disconnected";
          callbacks.onConnectionStateChange?.("disconnected");
          ws.value = null;
          // 清理所有会话
          sessions.forEach((s) => (s.state = "disconnected"));
          console.log("[RemoteControl] Gateway WebSocket 已断开");
        };

        socket.onerror = (err) => {
          connectionState.value = "error";
          callbacks.onConnectionStateChange?.("error");
          console.error("[RemoteControl] WebSocket 错误:", err);
          resolve(false);
        };

        socket.onmessage = (event) => {
          handleWsMessage(event);
        };
      } catch (err) {
        connectionState.value = "error";
        callbacks.onConnectionStateChange?.("error");
        resolve(false);
      }
    });
  }

  // 处理 WS 消息
  function handleWsMessage(event: MessageEvent) {
    if (typeof event.data === "string") {
      // 文本帧 — JSON 信令
      try {
        const msg = JSON.parse(event.data);
        const type = msg.type as string;
        const sid = msg.sessionId as string;

        switch (type) {
          case "connected":
            if (sid) {
              // 查找 pending session 并更新为真实 sessionId
              let found = false;
              let resolvedProtocol: string | null = null;
              sessions.forEach((s, key) => {
                if (!found && key.startsWith("pending-")) {
                  resolvedProtocol = s.protocol;
                  sessions.delete(key);
                  s.sessionId = sid;
                  s.state = "connected";
                  sessions.set(sid, s);
                  found = true;
                }
              });
              if (!found) {
                sessions.set(sid, {
                  sessionId: sid,
                  targetId: "",
                  protocol: "AUTO",
                  state: "connected",
                  createdAt: Date.now(),
                });
              }
              activeSessionId.value = sid;
              // 桌面远程协议：立即发送客户端能力声明
              if (resolvedProtocol === "DESKTOP" || resolvedProtocol === "AUTO") {
                sendCapabilities(sid, 1920, 1080);
              }
              callbacks.onConnected?.(sid);
            }
            break;
          case "error":
            if (sid) {
              if (sessions.has(sid)) sessions.get(sid)!.state = "error";
              callbacks.onError?.(sid, msg.msg || "unknown error");
            } else {
              // 无 sessionId 的错误：查找 pending session 并触发回调
              let found = false;
              sessions.forEach((s, key) => {
                if (!found && key.startsWith("pending-")) {
                  sessions.delete(key);
                  found = true;
                }
              });
              callbacks.onError?.("", msg.msg || "unknown error");
            }
            break;
          case "disconnected":
            if (sid) {
              // 延迟移除断开的会话（让前端有时间展示断开状态再移除）
              setTimeout(() => {
                if (sessions.has(sid)) {
                  sessions.delete(sid);
                  if (activeSessionId.value === sid) {
                    activeSessionId.value = sessions.size > 0 ? sessions.keys().next().value : null;
                  }
                }
              }, 2000);
              callbacks.onDisconnected?.(sid);
            }
            break;
          case "terminal_output":
            if (sid && msg.data) {
              callbacks.onTerminalOutput?.(sid, msg.data);
            }
            break;
          case "desktop_frame_info":
            // 宽高信息更新（如果需要）
            break;
          case "desktop_metrics":
            if (sid) {
              callbacks.onDesktopMetrics?.(sid, {
                fps: msg.fps,
                memUsed: msg.memUsed,
                memTotal: msg.memTotal,
                mouseX: msg.mouseX,
                mouseY: msg.mouseY,
              });
            }
            break;
          default:
            console.debug("[RemoteControl] 未知消息类型:", type, msg);
        }
      } catch (e) {
        console.warn("[RemoteControl] 消息解析失败:", e);
      }
    } else if (event.data instanceof Blob) {
      // 二进制帧 — 桌面帧
      event.data.arrayBuffer().then((buf) => {
        handleBinaryFrame(buf);
      });
    } else if (event.data instanceof ArrayBuffer) {
      handleBinaryFrame(event.data);
    }
  }

  // 处理二进制帧
  function handleBinaryFrame(buf: ArrayBuffer) {
    const view = new DataView(buf);
    if (buf.byteLength < 4) return;

    let offset = 0;
    const sidLen = view.getInt32(offset);
    offset += 4;
    if (buf.byteLength < offset + sidLen) return;

    const sid = new TextDecoder().decode(new Uint8Array(buf, offset, sidLen));
    offset += sidLen;

    // 读取 width(4) + height(4) + keyFrame(1)
    if (buf.byteLength < offset + 9) return;
    const width = view.getInt32(offset);
    offset += 4;
    const height = view.getInt32(offset);
    offset += 4;
    const keyFrame = view.getUint8(offset) === 1;
    offset += 1;

    const data = buf.slice(offset);
    callbacks.onDesktopFrame?.({ sessionId: sid, width, height, keyFrame, data });
  }

  // 发起连接
  function connectToTarget(settings: ConnectionSettings): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (connectionState.value !== "connected" || !ws.value) {
        // 先连接 Gateway
        const ok = await connectGateway(settings.gatewayUrl);
        if (!ok) {
          resolve(false);
          return;
        }
      }

      // 发送 CONNECT 消息
      const msg: Record<string, any> = {
        type: "connect",
        targetId: settings.targetId,
        protocol: settings.protocol,
      };
      if (settings.auth) {
        msg.auth = settings.auth;
      }

      // 创建临时会话记录
      const tempSessionId = `pending-${Date.now()}`;
      sessions.set(tempSessionId, {
        sessionId: tempSessionId,
        targetId: settings.targetId,
        protocol: settings.protocol,
        state: "connecting",
        createdAt: Date.now(),
      });

      // 注册一次性监听，等待 connected 响应
      const originalOnConnected = callbacks.onConnected;
      callbacks.onConnected = (sid: string) => {
        // 更新会话映射
        if (sessions.has(tempSessionId)) {
          const s = sessions.get(tempSessionId)!;
          sessions.delete(tempSessionId);
          s.sessionId = sid;
          s.state = "connected";
          sessions.set(sid, s);
          activeSessionId.value = sid;
        }
        originalOnConnected?.(sid);
        // 恢复原始回调
        callbacks.onConnected = originalOnConnected;
        resolve(true);
      };

      const originalOnError = callbacks.onError;
      callbacks.onError = (sid: string, errMsg: string) => {
        sessions.delete(tempSessionId);
        originalOnError?.(sid, errMsg);
        callbacks.onError = originalOnError;
        resolve(false);
      };

      // 发送 CONNECT
      ws.value.send(JSON.stringify(msg));

      // 超时处理
      setTimeout(() => {
        if (sessions.has(tempSessionId) && sessions.get(tempSessionId)!.state === "connecting") {
          sessions.delete(tempSessionId);
          callbacks.onConnected = originalOnConnected;
          callbacks.onError = originalOnError;
          resolve(false);
        }
      }, 10000);
    });
  }

  // 断开会话
  function disconnectSession(sessionId: string) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: "disconnect", sessionId }));
    }
    if (sessions.has(sessionId)) {
      sessions.get(sessionId)!.state = "disconnected";
    }
    if (activeSessionId.value === sessionId) {
      activeSessionId.value = null;
    }
  }

  // SSH 输入
  function sendInput(sessionId: string, data: string) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: "input", sessionId, data }));
    }
  }

  // 终端调整大小
  function sendResize(sessionId: string, cols: number, rows: number) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: "resize", sessionId, cols, rows }));
    }
  }

  // 鼠标事件
  function sendMouseEvent(sessionId: string, event: {
    x: number;
    y: number;
    button?: number;
    action?: string;
    wheel?: number;
  }) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: "mouse", sessionId, ...event }));
    }
  }

  // 键盘事件
  function sendKeyEvent(sessionId: string, event: {
    keyCode: number;
    action: string;
    shift?: boolean;
    ctrl?: boolean;
    alt?: boolean;
  }) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: "key", sessionId, ...event }));
    }
  }

  // 桌面控制
  function sendDesktopControl(sessionId: string, action: string, value?: string | number) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      const msg: Record<string, any> = { type: "desktop_control", sessionId, action };
      if (value !== undefined) msg.value = value;
      ws.value.send(JSON.stringify(msg));
    }
  }

  // 发送客户端能力声明（编码器、分辨率、帧率）
  function sendCapabilities(sessionId: string, width: number, height: number, fps?: number) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      const msg: Record<string, any> = {
        type: "capabilities",
        sessionId,
        codecs: ["H264", "JPEG"],
        width: width || 1920,
        height: height || 1080,
        fps: fps || 30,
      };
      console.log("[RemoteControl] 发送能力声明:", msg);
      ws.value.send(JSON.stringify(msg));
    }
  }

  // 断开 Gateway
  function disconnectGateway() {
    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
    sessions.clear();
    activeSessionId.value = null;
    connectionState.value = "disconnected";
  }

  onUnmounted(() => {
    disconnectGateway();
  });

  return {
    ws,
    connectionState,
    sessions,
    activeSessionId,
    connectGateway,
    connectToTarget,
    disconnectSession,
    disconnectGateway,
    sendInput,
    sendResize,
    sendMouseEvent,
    sendKeyEvent,
    sendDesktopControl,
    sendCapabilities,
  };
}

export default useRemoteControl;
