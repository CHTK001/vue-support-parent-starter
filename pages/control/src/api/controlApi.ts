/**
 * 远程控制（WebRTC 远控）API
 *
 * <p>对于页面而言，远控后端（spring-support-control-starter）提供会话/屏幕管理，
 * 视频信令与数据通道走 Java WEBRTC 服务（`ws://<host>:<port>/webrtc`）。</p>
 *
 * <p>后端接口统一返回 {@code ReturnResult<T>}（{ code, data, msg }），
 * 本文件在 {@link request} 中自动解包 {@code data}。</p>
 *
 * @author CH
 * @since 4.0.0.50
 */
// 默认走同源相对路径，由 dev server 的 /control 代理转发到后端；
// 跨域部署时用 VITE_GATEWAY_HTTP 指定后端绝对地址。
const GATEWAY_HTTP = import.meta.env.VITE_GATEWAY_HTTP || "";
const RTC_WS = import.meta.env.VITE_RTC_WS || "ws://127.0.0.1:10000/webrtc";

/** 后端统一响应（com.chua.common.support.lang.code.ReturnResult） */
interface ReturnResult<T> {
  /** 状态码 */
  code?: string;
  /** 数据载荷 */
  data?: T;
  /** 提示信息 */
  msg?: string;
}

/** 会话状态（后端 SessionView 的回显） */
export interface ControlSession {
  /** 会话 ID */
  sessionId: string;
  /** 连接数（浏览器端 peer 数） */
  peerCount: number;
  /** 是否在录制桌面 */
  capturing: boolean;
}

/** 远端屏幕信息（后端 ScreenView 的回显） */
export interface ControlScreen {
  /** 屏幕 ID */
  id: string;
  /** 屏幕名称 */
  name: string;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/** 信令服务配置（后端 /control/config 的回显） */
export interface ControlConfig {
  /** 监听地址 */
  host: string;
  /** 信令端口 */
  port: number;
  /** 信令路径 */
  path: string;
  /** 完整 ws 地址 */
  wsUrl: string;
  /** 采集帧率 */
  frameRate: number;
  /** 采集最大宽度 */
  width: number;
  /** 采集最大高度 */
  height: number;
}

/** 鼠标控制事件（JSON 对接 ControlEvent.MouseEvent） */
export interface MouseEventPayload {
  type: "mouse";
  path: string;
  timestamp: number;
  x: number;
  y: number;
  button: "left" | "middle" | "right";
  action: "press" | "release" | "move" | "wheel";
  delta: number;
}

/** 键盘控制事件（JSON 对接 ControlEvent.KeyboardEvent） */
export interface KeyboardEventPayload {
  type: "keyboard";
  path: string;
  timestamp: number;
  keyCode: number;
  action: "down" | "up";
  control: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

/** 后端成功状态码（ReturnCode.SUCCESS = "00000"） */
const SUCCESS_CODES = new Set(["0", "200", "00000"]);

/**
 * 发起请求并解包后端统一响应。
 *
 * @param path 接口路径（以 / 开头）
 * @param init fetch 配置
 * @returns 解包后的数据
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${GATEWAY_HTTP}${path}`, init);
  if (!resp.ok) {
    throw new Error(`${resp.status} ${resp.statusText}`);
  }
  const body = (await resp.json()) as ReturnResult<T> | T;
  if (body && typeof body === "object" && "data" in (body as ReturnResult<T>)) {
    const result = body as ReturnResult<T>;
    if (result.code && !SUCCESS_CODES.has(result.code)) {
      throw new Error(result.msg || `请求失败(${result.code})`);
    }
    return result.data as T;
  }
  return body as T;
}

/**
 * 创建远控会话
 *
 * @param params 会话参数
 */
export async function createControlSession(params: { sessionId: string; peerId?: string }): Promise<ControlSession> {
  const query = new URLSearchParams({ sessionId: params.sessionId });
  return request<ControlSession>(`/control/session/create?${query.toString()}`, { method: "POST" });
}

/**
 * 销毁远控会话
 *
 * @param sessionId 会话 ID
 */
export async function destroyControlSession(sessionId: string): Promise<void> {
  await request<void>(`/control/session/destroy/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}

/**
 * 拉取活跃会话列表
 */
export async function listControlSessions(): Promise<ControlSession[]> {
  return request<ControlSession[]>("/control/sessions");
}

/**
 * 列出远端屏幕（桌面采集源）
 */
export async function listControlScreens(): Promise<ControlScreen[]> {
  return request<ControlScreen[]>("/control/screens");
}

/**
 * 拉取信令服务配置
 */
export async function getControlConfig(): Promise<ControlConfig> {
  return request<ControlConfig>("/control/config");
}

/**
 * 组装信令 WebSocket 地址
 */
export function signalingUrl(): string {
  return RTC_WS;
}

/**
 * 将鼠标控制事件转为 Java 端反序列化的 JSON 文本（事件字段平铺到根节点）
 *
 * @see ControlEvent.MouseEvent
 */
export function mouseEventJson(e: MouseEventPayload): string {
  return JSON.stringify({
    type: e.type,
    path: e.path,
    timestamp: e.timestamp,
    x: e.x,
    y: e.y,
    button: e.button,
    action: e.action,
    delta: e.delta,
  });
}

/**
 * 将键盘控制事件转为 Java 端反序列化的 JSON 文本
 *
 * @see ControlEvent.KeyboardEvent
 */
export function keyboardEventJson(e: KeyboardEventPayload): string {
  return JSON.stringify({
    type: e.type,
    path: e.path,
    timestamp: e.timestamp,
    keyCode: e.keyCode,
    action: e.action,
    control: e.control,
    alt: e.alt,
    shift: e.shift,
    meta: e.meta,
  });
}
