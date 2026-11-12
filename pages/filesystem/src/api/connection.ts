/**
 * 后端连接设置（应用接口地址 + 文件服务地址）。
 *
 * <p><b>为什么需要这一层</b>：页面此前把「应用接口」固定为同源
 * （由 Vite dev 代理 / 网关转发），把「文件服务」固定为 app.yaml 下发值。
 * 一旦前端在本机跑、后端部署到另一台机器（真实场景：本机 8899 + 远端 8082），
 * 同源代理就成了唯一通道：要换后端必须改 vite.config.ts 再重启 dev，
 * 生产构建更是完全改不了。这里把两个地址都做成<b>页面级可配置</b>，
 * 落 localStorage，保存后下一次请求立即生效，无需重启前端。</p>
 *
 * <p><b>口径</b>：</p>
 * <ul>
 *   <li>{@code filestorage.apiBase}：应用接口（{@code /v2/...}）基址，
 *       空 = 跟随当前页面同源（保持原有 dev 代理 / 网关行为）。</li>
 *   <li>{@code filestorage.server}：文件服务基址，空 = 使用后端
 *       {@code /v2/file/server-config} 下发值（embedded/standalone 语义不变）。</li>
 * </ul>
 *
 * <p>协同 SSE / hub 上行与普通接口共用同一基址：只改一处就能整体切后端，
 * 不会出现「列表连的是 A、协同推送还连 B」的半截状态。</p>
 */

import { getAccessToken } from "@repo/utils";

/** localStorage：应用接口基址（/v2/...） */
export const API_BASE_KEY = "filestorage.apiBase";

/** localStorage：文件服务基址覆盖 */
export const SERVER_KEY = "filestorage.server";

/** 连接设置变更事件名（同页多组件感知） */
export const CONNECTION_CHANGED_EVENT = "filestorage:connection-changed";

/** 当前页面源（SSR / 测试环境无 window 时给空串） */
function currentOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

/**
 * 去掉尾部斜杠。
 *
 * @param value 原始地址
 * @returns 归一后的地址
 */
function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * 读取用户显式配置的应用接口基址。
 *
 * @returns 基址；未配置时为空串
 */
export function getApiBase(): string {
  try {
    return trimSlash((localStorage.getItem(API_BASE_KEY) || "").trim());
  } catch {
    return "";
  }
}

/**
 * 保存应用接口基址。
 *
 * @param value 基址（空串 = 清除覆盖，回到同源）
 */
export function setApiBase(value: string): void {
  const next = trimSlash(value.trim());
  try {
    if (next) {
      localStorage.setItem(API_BASE_KEY, next);
    } else {
      localStorage.removeItem(API_BASE_KEY);
    }
  } catch {
    /* 隐私模式下 localStorage 不可写：本次会话仍可用当前值 */
  }
  emitConnectionChanged();
}

/**
 * 应用接口的可用源：用户配置优先，否则同源。
 *
 * @returns 绝对地址，无尾部斜杠
 */
export function apiOrigin(): string {
  return getApiBase() || currentOrigin();
}

/**
 * 传给 {@code createHttp({ baseUrl })} 的值。
 *
 * <p>未配置时返回 {@code undefined} 而不是空串：空串会让 Http 跳过
 * {@code app.yaml httpConfig.baseUrl}（system 应用是 {@code /system/api}，
 * collect 是 {@code /collect/api}），内嵌到那些应用时接口会整片 404。</p>
 *
 * @returns 显式基址；未配置时 undefined（沿用应用配置）
 */
export function apiHttpBase(): string | undefined {
  return getApiBase() || undefined;
}

/**
 * 拼接应用接口绝对地址。
 *
 * @param path 以 / 开头的接口路径
 * @returns 绝对地址
 */
export function apiUrl(path: string): string {
  const base = apiOrigin();
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${suffix}` : suffix;
}

/**
 * 读取用户显式配置的文件服务地址。
 *
 * @returns 地址；未配置时为空串（表示跟随后端下发）
 */
export function getServerOverride(): string {
  try {
    return trimSlash((localStorage.getItem(SERVER_KEY) || "").trim());
  } catch {
    return "";
  }
}

/**
 * 保存文件服务地址覆盖。
 *
 * @param value 地址（空串 = 清除覆盖，回到后端下发）
 */
export function setServerOverride(value: string): void {
  const next = trimSlash(value.trim());
  try {
    if (next) {
      localStorage.setItem(SERVER_KEY, next);
    } else {
      localStorage.removeItem(SERVER_KEY);
    }
  } catch {
    /* 同上 */
  }
  emitConnectionChanged();
}

/**
 * 清除全部连接覆盖（回到「同源 + 后端下发」）。
 */
export function clearConnectionOverride(): void {
  try {
    localStorage.removeItem(API_BASE_KEY);
    localStorage.removeItem(SERVER_KEY);
  } catch {
    /* 同上 */
  }
  emitConnectionChanged();
}

/**
 * 广播连接设置变更。
 */
function emitConnectionChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONNECTION_CHANGED_EVENT));
}

/**
 * 连接测试结果。
 */
export interface ConnectionProbeResult {
  /** 是否可达且返回可解析结果 */
  ok: boolean;
  /** 展示文案（HTTP 状态 / 失败原因） */
  message: string;
  /** 后端下发的文件服务形态（成功时） */
  mode?: string;
  /** 后端下发的文件服务地址（成功时） */
  server?: string;
}

/**
 * 探测一个应用接口基址是否可用。
 *
 * <p>探针用 {@code /v2/file/server-config}：它同时验证「接口连通」与
 * 「这确实是 filesystem-starter 后端」。401/403 也算连通（说明服务在，
 * 只是当前令牌对该实例无效），此时不伪装成失败，文案里如实标注。</p>
 *
 * @param apiBase      待测基址（空 = 同源）
 * @param timeoutMs    超时（默认 8000ms）
 * @returns 探测结果
 */
export async function probeConnection(
  apiBase: string,
  timeoutMs = 8_000,
): Promise<ConnectionProbeResult> {
  const base = trimSlash(apiBase.trim()) || currentOrigin();
  if (!base) {
    return { ok: false, message: "无法确定接口地址" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const token = getAccessToken() ?? "";
    const response = await fetch(`${base}/v2/file/server-config`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { "x-oauth-token": token } : {}),
      },
      cache: "no-store",
      credentials: "include",
      signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403) {
      return {
        ok: true,
        message: `服务可达（HTTP ${response.status}）：当前登录令牌对该实例无效，需重新登录`,
      };
    }
    if (!response.ok) {
      return { ok: false, message: `HTTP ${response.status} ${response.statusText}`.trim() };
    }
    const text = await response.text();
    let body: Record<string, unknown> | null = null;
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { ok: false, message: "响应不是 JSON：该地址可能不是文件服务后端" };
    }
    // 兼容 {code,data,msg} 与裸配置体
    const inner = (body?.data && typeof body.data === "object" ? body.data : body) as Record<string, unknown>;
    const mode = typeof inner?.mode === "string" ? inner.mode : undefined;
    const server = typeof inner?.server === "string" ? inner.server : undefined;
    if (!mode && !server) {
      return { ok: false, message: "接口可达但缺少 filesystem 配置字段（mode/server）" };
    }
    return {
      ok: true,
      message: `连接正常（HTTP 200）${mode ? ` · ${mode}` : ""}`,
      mode,
      server,
    };
  } catch (e) {
    const err = e as Error;
    if (err?.name === "AbortError") {
      return { ok: false, message: `连接超时（${Math.round(timeoutMs / 1000)}s）` };
    }
    return { ok: false, message: err?.message || "网络不可达" };
  } finally {
    clearTimeout(timer);
  }
}
