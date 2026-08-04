/**
 * useRemoteControl —— 远程控制 Composable
 *
 * 管理与 Gateway 的原生 WebSocket 连接，支持 SSH 终端、桌面远程、SOCKS5、视频会议。
 * 暴露响应式状态与连接/输入/控制/文件操作方法，供业务组件使用。
 *
 * @since 2026-05-22（迁移并重构于新框架）
 */
import { ref, reactive, onUnmounted, nextTick, type Ref } from "vue";

/* ================== 类型定义 ================== */

export type RemoteProtocol = "SSH" | "DESKTOP" | "SOCKS5" | "AUTO" | "CONFERENCE" | "RUSTDESK";
export type RemoteCodec = "H264" | "H265" | "JPEG";
export type TransportType = "TCP";
export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

export interface ConferenceConfig {
  roomId: string;
  mode: "host" | "guest";
  layoutMode?: "official" | "fixed-host";
  maxParticipants?: number;
  participantId?: string;
}

export interface RemoteConnectionSettings {
  /** Gateway WS 地址（如 ws://127.0.0.1:8082） */
  gatewayUrl: string;
  /** 目标 ID（与 verifyCode 二选一） */
  targetId?: string;
  /** 被控端验证码（与 targetId 二选一，用于自动查找 Agent） */
  verifyCode?: string;
  /** 远程协议 */
  protocol: RemoteProtocol;
  /** 传输协议 */
  transport?: TransportType;
  /** 编码器 */
  codec?: RemoteCodec;
  /** 认证信息（SSH 等场景可传入 host/port/username/password 覆盖） */
  auth?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
  };
  /** 网关令牌（非必填，优先于 URL 参数） */
  token?: string;
  /** 会议配置（CONFERENCE 协议时必填） */
  conference?: ConferenceConfig;
  /** 心跳间隔（毫秒），默认 50000 */
  heartbeatInterval?: number;
  /** 心跳超时（毫秒），默认 150000 */
  heartbeatTimeout?: number;
}

export interface RemoteSession {
  sessionId: string;
  targetId: string;
  protocol: RemoteProtocol;
  transport?: TransportType;
  state: ConnectionState;
  createdAt: number;
  gatewayUrl?: string;
}

export interface DesktopFrameEvent {
  sessionId: string;
  width: number;
  height: number;
  keyFrame: boolean;
  codec?: RemoteCodec;
  data: ArrayBuffer;
}

export interface DesktopMetrics {
  fps?: number;
  memUsed?: number;
  memTotal?: number;
  mouseX?: number;
  mouseY?: number;
}

/* ================== 事件回调 ================== */

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
  onDesktopMetrics?: (sessionId: string, data: DesktopMetrics) => void;
  /** 文件操作回调（结果/进度/完成，通过 data.action 区分） */
  onFileOp?: (sessionId: string, data: Record<string, unknown>) => void;
}

/* ================== Composable ================== */

const DEFAULT_HEARTBEAT_INTERVAL = 60000;
const DEFAULT_HEARTBEAT_TIMEOUT = 180000;

export function useRemoteControl(callbacks: RemoteControlCallbacks = {}) {
  const ws: Ref<WebSocket | null> = ref(null);
  const connectionState: Ref<ConnectionState> = ref("disconnected");
  const sessions = reactive<Map<string, RemoteSession>>(new Map());
  const activeSessionId: Ref<string | null> = ref(null);

  let lastConnectionSettings: RemoteConnectionSettings | null = null;
  let autoReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let lastPongTime = 0;

  function startHeartbeat(socket: WebSocket, intervalMs?: number, timeoutMs?: number) {
    stopHeartbeat();
    const interval = intervalMs ?? DEFAULT_HEARTBEAT_INTERVAL;
    const timeout = timeoutMs ?? DEFAULT_HEARTBEAT_TIMEOUT;
    lastPongTime = Date.now();
    heartbeatTimer = setInterval(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        stopHeartbeat();
        return;
      }
      if (Date.now() - lastPongTime > timeout) {
        console.warn("[RemoteControl] 心跳超时，连接可能已断开");
        stopHeartbeat();
        socket.close();
        return;
      }
      try {
        socket.send(JSON.stringify({ type: "ping" }));
      } catch {
        stopHeartbeat();
      }
    }, interval);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function buildLiveKitProxyUrl(gatewayUrl?: string) {
    const source =
      gatewayUrl ||
      lastConnectionSettings?.gatewayUrl ||
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
    try {
      const url = new URL(source);
      url.pathname = "/livekit";
      url.search = "";
      url.hash = "";
      return url.toString();
    } catch {
      return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/livekit`;
    }
  }

  function normalizeConferenceSignal(msg: Record<string, unknown>, sid: string) {
    const gatewayUrl = sessions.get(sid)?.gatewayUrl || lastConnectionSettings?.gatewayUrl;
    return {
      ...msg,
      server: buildLiveKitProxyUrl(gatewayUrl),
    };
  }

  /* 连接 Gateway */
  function connectGateway(
    gatewayUrl: string,
    settingsToken?: string,
    heartbeatIntervalMs?: number,
    heartbeatTimeoutMs?: number,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (ws.value?.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      connectionState.value = "connecting";
      callbacks.onConnectionStateChange?.("connecting");

      try {
        const params = new URLSearchParams(window.location.search);
        const hashToken = new URLSearchParams(window.location.hash.split("?")[1] || "").get("token") || "";
        const token = settingsToken || params.get("token") || hashToken || "";
        const wsUrl = token ? `${gatewayUrl}?token=${token}` : gatewayUrl;
        const socket = new WebSocket(wsUrl);
        socket.binaryType = "arraybuffer";
        ws.value = socket;

        socket.onopen = () => {
          connectionState.value = "connected";
          callbacks.onConnectionStateChange?.("connected");
          startHeartbeat(
            socket,
            heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL,
            heartbeatTimeoutMs ?? DEFAULT_HEARTBEAT_TIMEOUT,
          );
          console.log("[RemoteControl] Gateway WebSocket 已连接");
          resolve(true);
        };

        socket.onclose = () => {
          stopHeartbeat();
          connectionState.value = "disconnected";
          callbacks.onConnectionStateChange?.("disconnected");
          ws.value = null;
          sessions.forEach((s) => (s.state = "disconnected"));
          console.log("[RemoteControl] Gateway WebSocket 已断开");
        };

        socket.onerror = () => {
          connectionState.value = "error";
          callbacks.onConnectionStateChange?.("error");
          console.error("[RemoteControl] WebSocket 错误");
          resolve(false);
        };

        socket.onmessage = (event) => {
          handleWsMessage(event);
        };
      } catch {
        connectionState.value = "error";
        callbacks.onConnectionStateChange?.("error");
        resolve(false);
      }
    });
  }

  /* 处理 WS 文本 / 二进制消息 */
  function handleWsMessage(event: MessageEvent) {
    if (typeof event.data === "string") {
      try {
        const msg = JSON.parse(event.data) as Record<string, unknown>;
        const type = msg.type as string;
        const sid = msg.sessionId as string;

        switch (type) {
          case "connected": {
            if (sid) {
              let found = false;
              let resolvedProtocol: string | null = null;
              sessions.forEach((s, key) => {
                if (!found && key.startsWith("pending-")) {
                  resolvedProtocol = s.protocol;
                  sessions.delete(key);
                  s.sessionId = sid;
                  s.state = "connected";
                  s.gatewayUrl = s.gatewayUrl || lastConnectionSettings?.gatewayUrl;
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
                  gatewayUrl: lastConnectionSettings?.gatewayUrl,
                });
              }
              activeSessionId.value = sid;
              if (resolvedProtocol === "DESKTOP" || resolvedProtocol === "AUTO") {
                sendCapabilities(sid, 1920, 1080);
              }
              callbacks.onConnected?.(sid);
            }
            break;
          }
          case "error": {
            if (sid) {
              if (sessions.has(sid)) sessions.get(sid)!.state = "error";
              callbacks.onError?.(sid, (msg.msg as string) || "unknown error");
            } else {
              let found = false;
              sessions.forEach((s, key) => {
                if (!found && key.startsWith("pending-")) {
                  sessions.delete(key);
                  found = true;
                }
              });
              if (found) callbacks.onError?.("", (msg.msg as string) || "unknown error");
            }
            break;
          }
          case "disconnected": {
            if (sid) {
              setTimeout(() => {
                if (sessions.has(sid)) {
                  sessions.delete(sid);
                  if (activeSessionId.value === sid) {
                    activeSessionId.value = sessions.size > 0 ? sessions.keys().next().value ?? null : null;
                  }
                }
              }, 2000);
              callbacks.onDisconnected?.(sid);
            }
            break;
          }
          case "terminal_output": {
            if (sid && msg.data) callbacks.onTerminalOutput?.(sid, msg.data as string);
            break;
          }
          case "room_joined":
          case "livekit_info": {
            if (sid) {
              let found = false;
              sessions.forEach((s, key) => {
                if (!found && key.startsWith("pending-")) {
                  sessions.delete(key);
                  s.sessionId = sid;
                  s.state = "connected";
                  s.gatewayUrl = s.gatewayUrl || lastConnectionSettings?.gatewayUrl;
                  sessions.set(sid, s);
                  found = true;
                }
              });
              if (!found) {
                sessions.set(sid, {
                  sessionId: sid,
                  targetId: "",
                  protocol: "CONFERENCE",
                  state: "connected",
                  createdAt: Date.now(),
                  gatewayUrl: lastConnectionSettings?.gatewayUrl,
                });
              }
              activeSessionId.value = sid;
              callbacks.onConnected?.(sid);
              nextTick().then(() => {
                callbacks.onTerminalOutput?.(sid, JSON.stringify(normalizeConferenceSignal(msg, sid)));
              });
            }
            break;
          }
          case "participant_joined":
          case "participant_left": {
            if (sid) callbacks.onTerminalOutput?.(sid, JSON.stringify(msg));
            break;
          }
          case "desktop_metrics": {
            if (sid) {
              callbacks.onDesktopMetrics?.(sid, {
                fps: msg.fps as number | undefined,
                memUsed: msg.memUsed as number | undefined,
                memTotal: msg.memTotal as number | undefined,
                mouseX: msg.mouseX as number | undefined,
                mouseY: msg.mouseY as number | undefined,
              });
            }
            break;
          }
          case "file_op": {
            if (sid) callbacks.onFileOp?.(sid, msg);
            break;
          }
          case "pong": {
            lastPongTime = Date.now();
            break;
          }
          case "agent_disconnected": {
            if (sid) {
              console.warn("[RemoteControl] Agent 断开，等待重连: sid=" + sid);
              if (sessions.has(sid)) sessions.get(sid)!.state = "connecting";
              if (lastConnectionSettings && !autoReconnectTimer) {
                autoReconnectTimer = setTimeout(() => {
                  autoReconnectTimer = null;
                  if (ws.value?.readyState === WebSocket.OPEN && lastConnectionSettings) {
                    console.log("[RemoteControl] Agent 已重连，自动重新发起连接...");
                    sessions.forEach((s, key) => {
                      if (s.state === "connecting" || s.state === "disconnected") sessions.delete(key);
                    });
                    connectToTarget(lastConnectionSettings);
                  }
                }, 3000);
              }
            }
            break;
          }
          default:
            console.debug("[RemoteControl] 未知消息类型:", type, msg);
        }
      } catch (e) {
        console.warn("[RemoteControl] 消息解析失败:", e);
      }
    } else if (event.data instanceof Blob) {
      event.data.arrayBuffer().then((buf) => handleBinaryFrame(buf));
    } else if (event.data instanceof ArrayBuffer) {
      handleBinaryFrame(event.data);
    }
  }

  /* 二进制帧：sidLen(4) + sid(sidLen) + width(4) + height(4) + keyFrame(1) + data */
  function handleBinaryFrame(buf: ArrayBuffer) {
    const view = new DataView(buf);
    if (buf.byteLength < 4) return;

    let offset = 0;
    const sidLen = view.getInt32(offset);
    offset += 4;
    if (buf.byteLength < offset + sidLen) return;

    const sid = new TextDecoder().decode(new Uint8Array(buf, offset, sidLen));
    offset += sidLen;

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

  /* 发起连接 */
  function connectToTarget(settings: RemoteConnectionSettings): Promise<{ ok: boolean; error?: string }> {
    return new Promise(async (resolve) => {
      if (connectionState.value !== "connected" || !ws.value) {
        const ok = await connectGateway(
          settings.gatewayUrl,
          settings.token,
          settings.heartbeatInterval,
          settings.heartbeatTimeout,
        );
        if (!ok) {
          resolve({ ok: false, error: "无法连接到 Gateway" });
          return;
        }
      }

      lastConnectionSettings = { ...settings };

      const msg: Record<string, unknown> = {
        type: "connect",
        protocol: settings.protocol,
      };
      if (settings.targetId) msg.targetId = settings.targetId;
      if (settings.verifyCode) msg.verifyCode = settings.verifyCode;
      if (settings.transport) msg.transport = settings.transport;
      if (settings.codec) msg.codec = settings.codec;
      if (settings.auth) msg.auth = settings.auth;
      if (settings.conference) {
        const target: Record<string, unknown> = {
          roomId: settings.conference.roomId,
          mode: settings.conference.mode,
        };
        if (settings.conference.maxParticipants) target.maxParticipants = settings.conference.maxParticipants;
        if (settings.conference.participantId) target.participantId = settings.conference.participantId;
        if (settings.targetId) target.targetId = settings.targetId;
        if (settings.verifyCode) target.verifyCode = settings.verifyCode;
        msg.target = target;
      }

      const tempSessionId = `pending-${Date.now()}`;
      sessions.set(tempSessionId, {
        sessionId: tempSessionId,
        targetId: settings.targetId || settings.verifyCode || "",
        protocol: settings.protocol,
        transport: settings.transport,
        state: "connecting",
        createdAt: Date.now(),
        gatewayUrl: settings.gatewayUrl,
      });

      const originalOnConnected = callbacks.onConnected;
      callbacks.onConnected = (sid: string) => {
        if (sessions.has(tempSessionId)) {
          const s = sessions.get(tempSessionId)!;
          sessions.delete(tempSessionId);
          s.sessionId = sid;
          s.state = "connected";
          sessions.set(sid, s);
          activeSessionId.value = sid;
        }
        originalOnConnected?.(sid);
        callbacks.onConnected = originalOnConnected;
        resolve({ ok: true });
      };

      const originalOnError = callbacks.onError;
      callbacks.onError = (sid: string, errMsg: string) => {
        sessions.delete(tempSessionId);
        connectionState.value = "error";
        callbacks.onConnectionStateChange?.("error");
        originalOnError?.(sid, errMsg);
        callbacks.onError = originalOnError;
        resolve({ ok: false, error: errMsg });
      };

      ws.value!.send(JSON.stringify(msg));

      setTimeout(() => {
        if (sessions.has(tempSessionId) && sessions.get(tempSessionId)!.state === "connecting") {
          sessions.delete(tempSessionId);
          callbacks.onConnected = originalOnConnected;
          callbacks.onError = originalOnError;
          resolve({ ok: false, error: "连接超时（60秒未响应）" });
        }
      }, 60000);
    });
  }

  /* 断开会话 */
  function disconnectSession(sessionId: string) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: "disconnect", sessionId }));
    }
    if (sessions.has(sessionId)) sessions.get(sessionId)!.state = "disconnected";
    if (activeSessionId.value === sessionId) activeSessionId.value = null;
  }

  /* SSH 输入 */
  function sendInput(sessionId: string, data: string) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: "input", sessionId, data }));
    }
  }

  /* 终端调整大小 */
  function sendResize(sessionId: string, cols: number, rows: number) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: "resize", sessionId, cols, rows }));
    }
  }

  /* 鼠标事件 */
  function sendMouseEvent(
    sessionId: string,
    event: { x: number; y: number; button?: number; action?: string; wheel?: number },
  ) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: "mouse", sessionId, ...event }));
    }
  }

  /* 键盘事件 */
  function sendKeyEvent(
    sessionId: string,
    event: { keyCode: number; action: string; shift?: boolean; ctrl?: boolean; alt?: boolean },
  ) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: "key", sessionId, ...event }));
    }
  }

  /* 桌面控制 */
  function sendDesktopControl(sessionId: string, action: string, value?: string | number) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      const msg: Record<string, unknown> = { type: "desktop_control", sessionId, action };
      if (value !== undefined) msg.value = value;
      ws.value.send(JSON.stringify(msg));
    }
  }

  /* 客户端能力声明 */
  function sendCapabilities(sessionId: string, width: number, height: number, fps?: number) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      const msg = {
        type: "capabilities",
        sessionId,
        codecs: ["H264", "H265", "JPEG"],
        width: width || 1920,
        height: height || 1080,
        fps: fps || 30,
      };
      console.log("[RemoteControl] 发送能力声明:", msg);
      ws.value.send(JSON.stringify(msg));
    }
  }

  /* 文件操作 */
  function sendFileOp(sessionId: string, action: string, params: Record<string, unknown> = {}) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type: "file_op", sessionId, action, ...params }));
    }
  }

  /* 断开 Gateway */
  function disconnectGateway() {
    stopHeartbeat();
    if (autoReconnectTimer) {
      clearTimeout(autoReconnectTimer);
      autoReconnectTimer = null;
    }
    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
    sessions.clear();
    activeSessionId.value = null;
    connectionState.value = "disconnected";
    lastConnectionSettings = null;
  }

  onUnmounted(disconnectGateway);

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
    sendFileOp,
    set onDesktopFrame(fn: ((event: DesktopFrameEvent) => void) | undefined) {
      callbacks.onDesktopFrame = fn;
    },
  };
}

export type RemoteControlInstance = ReturnType<typeof useRemoteControl>;
export default useRemoteControl;