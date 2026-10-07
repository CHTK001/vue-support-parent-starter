/**
 * 实时浏览器客户端：对接 scripts/live-browser.mjs sidecar（127.0.0.1:19097）。
 *
 * 协议是「HTTP 发 CDP 命令 + SSE 收 CDP 事件」而不是 WebSocket：
 * sidecar 侧没有独立 ws 依赖，CDP 本质就是 JSON 请求/响应 + 事件流，
 * fetch/EventSource 前端零依赖即可等价实现（详见 sidecar 文件头注释）。
 *
 * 该文件不 import 任何 Vue 东西，纯网络层，可单测。
 */

/** sidecar 基地址；dev 由 Vite 插件自动拉起，生产环境不存在 → 探测失败即回退静态模式 */
const BASE = `http://127.0.0.1:${(import.meta as any).env?.VITE_LIVE_BROWSER_PORT || 19097}`;

/** 建会话的返回 */
export interface LiveSession {
  sessionId: string;
  viewport: { width: number; height: number };
  url: string;
}

/** 一条 CDP 事件（SSE 推送） */
export interface LiveEvent {
  sessionId: string;
  method: string;
  params: any;
}

/**
 * 探测 sidecar 是否活着。
 *
 * @param timeoutMs 探测超时（毫秒）
 * @returns 活着返回 true；前端据此决定拾取器默认用实时还是静态模式
 */
export async function probeLive(timeoutMs = 600): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const resp = await fetch(`${BASE}/api/health`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!resp.ok) {
      return false;
    }
    const body = await resp.json();
    return body.ok === true;
  } catch {
    return false;
  }
}

/**
 * 建一个浏览器会话（Playwright context + page + CDP session）。
 *
 * @param url 要打开的地址，http/https
 * @returns 会话信息；sessionId 用于后续所有 cdp 调用
 */
export async function createLiveSession(url: string): Promise<LiveSession> {
  const resp = await fetch(`${BASE}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const body = await resp.json();
  if (!resp.ok || body.error) {
    throw new Error(body.error || `建会话失败（HTTP ${resp.status}）`);
  }
  return body;
}

/**
 * 关会话（页面 + context 销毁；浏览器进程留着复用）。
 *
 * @param sessionId 会话 id
 */
export async function closeLiveSession(sessionId: string): Promise<void> {
  try {
    await fetch(`${BASE}/api/session/${sessionId}`, { method: "DELETE" });
  } catch {
    /* 关失败无所谓：sidecar 有闲置回收兜底 */
  }
}

/**
 * 发一条 CDP 命令并等结果。
 *
 * @param sessionId 会话 id
 * @param method CDP 方法名，如 Page.startScreencast
 * @param params 方法参数
 * @returns CDP result；命令本身失败时 reject
 */
export async function sendCdp(sessionId: string, method: string, params?: any): Promise<any> {
  const resp = await fetch(`${BASE}/api/cdp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, method, params: params ?? {} }),
  });
  const body = await resp.json();
  if (!resp.ok) {
    throw new Error(body.error || `CDP 调用失败（HTTP ${resp.status}）`);
  }
  if (body.error) {
    throw new Error(body.error);
  }
  return body.result;
}

/**
 * 订阅 CDP 事件流。
 *
 * @param onEvent 每条事件回调（调用方自行按 sessionId 过滤）
 * @returns 取消订阅函数
 */
export function openEvents(onEvent: (evt: LiveEvent) => void): () => void {
  const source = new EventSource(`${BASE}/api/events`);
  source.onmessage = (msg) => {
    try {
      onEvent(JSON.parse(msg.data));
    } catch {
      /* 单帧解析失败不影响后续 */
    }
  };
  // EventSource 自带断线重连；页面卸载时手动关
  return () => source.close();
}
