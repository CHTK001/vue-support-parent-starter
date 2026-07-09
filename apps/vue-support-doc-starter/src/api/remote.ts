/**
 * Remote Control API — Gateway HTTP + WebSocket client
 *
 * Gateway ports:
 *   3000 — HTTP Management API (/api/agents, /api/targets, /api/stats, /health)
 *   8082 — WebSocket Remote Control (DWS)
 *
 * WS protocol (text JSON):
 *   → {type:"connect", targetId?, verifyCode?, protocol?, auth?, target?}
 *   ← {type:"connected", sessionId, ...}  or  {type:"error", msg}
 *   → {type:"disconnect", sessionId}
 *   ← {type:"disconnected", sessionId}
 *   → {type:"capabilities", sessionId, codecs, width, height, fps}
 *   → {type:"input/resize/mouse/key/desktop_control/file_op", sessionId, ...}
 *   ← text relay from Agent (terminal output, etc.)
 *
 * WS protocol (binary):
 *   → [4B sidLen][sid UTF8][payload]          — input to Agent
 *   ← [4B sidLen][sid UTF8][4B w][4B h][1B keyFrame][payload] — desktop frame from Agent
 */

// ─── Configuration ────────────────────────────────────────────

export interface GatewayConfig {
  httpHost: string;   // e.g. "localhost"
  httpPort: number;   // e.g. 3000
  wsHost: string;     // e.g. "localhost"
  wsPort: number;     // e.g. 8082
  token?: string;     // optional auth token
}

const DEFAULT_CONFIG: GatewayConfig = {
  httpHost: "localhost",
  httpPort: 3000,
  wsHost: "localhost",
  wsPort: 8082,
};

let gatewayConfig: GatewayConfig = { ...DEFAULT_CONFIG };

export function setGatewayConfig(cfg: Partial<GatewayConfig>) {
  Object.assign(gatewayConfig, cfg);
}

export function getGatewayConfig(): GatewayConfig {
  return { ...gatewayConfig };
}

// ─── HTTP API types ───────────────────────────────────────────

export interface AgentInfo {
  agentId: string;
  online: boolean;
  disabled: boolean;
  weight: number;
  strategy: string;
  apiPath: string;
  agentType: string;
  ipAddress: string;
  remotePort: number;
  verifyCode: string;
  lastHeartbeatAt: string;
  lastRttMs: number;
  protocols: string[];
  codecs: string[];
  capabilities: Record<string, string>;
}

export interface TargetEntry {
  targetId: string;
  host: string;
  port: number;
  protocol: string;
  agentId: string;
  online: boolean;
}

export interface GatewayStats {
  agents: number;
  targets: number;
}

// ─── HTTP API calls ───────────────────────────────────────────

function httpBase(): string {
  return `http://${gatewayConfig.httpHost}:${gatewayConfig.httpPort}`;
}

function authHeaders(): HeadersInit {
  const h: HeadersInit = {};
  if (gatewayConfig.token) {
    h["Authorization"] = `Bearer ${gatewayConfig.token}`;
  }
  return h;
}

export async function fetchAgents(): Promise<AgentInfo[]> {
  const res = await fetch(`${httpBase()}/api/agents`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`fetchAgents: ${res.status}`);
  return res.json();
}

export async function fetchTargets(): Promise<TargetEntry[]> {
  const res = await fetch(`${httpBase()}/api/targets`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`fetchTargets: ${res.status}`);
  return res.json();
}

export async function fetchStats(): Promise<GatewayStats> {
  const res = await fetch(`${httpBase()}/api/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`fetchStats: ${res.status}`);
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; agents: number; targets: number }> {
  const res = await fetch(`${httpBase()}/health`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`fetchHealth: ${res.status}`);
  return res.json();
}

// ─── WebSocket Remote Control ─────────────────────────────────

export type WsState = "disconnected" | "connecting" | "connected";

export type WsMessageHandler = (msg: Record<string, unknown>) => void;
export type WsBinaryHandler = (data: ArrayBuffer) => void;

export class RemoteWsClient {
  private ws: WebSocket | null = null;
  private _state: WsState = "disconnected";
  private msgHandlers: WsMessageHandler[] = [];
  private binHandlers: WsBinaryHandler[] = [];
  private stateHandlers: ((s: WsState) => void)[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  get state(): WsState { return this._state; }

  onMessage(h: WsMessageHandler) { this.msgHandlers.push(h); }
  onBinary(h: WsBinaryHandler) { this.binHandlers.push(h); }
  onStateChange(h: (s: WsState) => void) { this.stateHandlers.push(h); }

  private setState(s: WsState) {
    this._state = s;
    this.stateHandlers.forEach(h => h(s));
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${gatewayConfig.wsHost}:${gatewayConfig.wsPort}/remote-control`;
    this.setState("connecting");
    this.ws = new WebSocket(url);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      this.setState("connected");
    };

    this.ws.onmessage = (ev) => {
      if (typeof ev.data === "string") {
        try {
          const msg = JSON.parse(ev.data);
          this.msgHandlers.forEach(h => h(msg));
        } catch { /* ignore non-JSON text */ }
      } else if (ev.data instanceof ArrayBuffer) {
        this.binHandlers.forEach(h => h(ev.data));
      }
    };

    this.ws.onclose = () => {
      this.setState("disconnected");
    };

    this.ws.onerror = () => {
      this.setState("disconnected");
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.setState("disconnected");
  }

  send(msg: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  sendBinary(data: ArrayBuffer | Uint8Array): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  /** Send connect message to establish a remote session */
  connectToTarget(opts: {
    targetId?: string;
    verifyCode?: string;
    protocol?: string;
    auth?: Record<string, unknown>;
    target?: Record<string, unknown>;
  }): void {
    this.send({ type: "connect", ...opts });
  }

  /** Send disconnect for a session */
  disconnectSession(sessionId: string): void {
    this.send({ type: "disconnect", sessionId });
  }

  /** Send client capabilities */
  sendCapabilities(sessionId: string, codecs: string[], width: number, height: number, fps: number): void {
    this.send({ type: "capabilities", sessionId, codecs, width, height, fps });
  }

  /** Send terminal input */
  sendInput(sessionId: string, data: string): void {
    this.send({ type: "input", sessionId, data });
  }

  /** Send resize */
  sendResize(sessionId: string, width: number, height: number): void {
    this.send({ type: "resize", sessionId, width, height });
  }

  /** Send mouse event */
  sendMouse(sessionId: string, action: string, x: number, y: number, button?: number): void {
    const msg: Record<string, unknown> = { type: "mouse", sessionId, action, x, y };
    if (button !== undefined) msg.button = button;
    this.send(msg);
  }

  /** Send key event */
  sendKey(sessionId: string, action: string, key: string, code?: string, modifiers?: string[]): void {
    const msg: Record<string, unknown> = { type: "key", sessionId, action, key };
    if (code) msg.code = code;
    if (modifiers) msg.modifiers = modifiers;
    this.send(msg);
  }

  /** Send desktop_control command */
  sendDesktopControl(sessionId: string, action: string, params?: Record<string, unknown>): void {
    this.send({ type: "desktop_control", sessionId, action, ...params });
  }
}

// Singleton
export const remoteWs = new RemoteWsClient();