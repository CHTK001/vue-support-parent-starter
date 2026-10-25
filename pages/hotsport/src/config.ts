/**
 * @pages/hotsport 接口地址配置。
 *
 * <p><strong>为什么需要这一层</strong>：本包原先只在独立应用
 * （{@code apps/vue-support-hotspot-starter}）里跑，接口地址由该应用的 vite
 * 代理写死（{@code /api/apm} → 某个固定端口）。迁进平台后同一套页面既要能被
 * 平台同源网关代理，也要能直连独立部署的观测后端，所以地址必须可配置。</p>
 *
 * <p><strong>取值优先级</strong>（高 → 低）：</p>
 * <ol>
 *   <li>运行时设置 —— 页面内「接口设置」写入 {@code localStorage}，改完即时生效，无需重新构建；</li>
 *   <li>构建期 {@code VITE_HOTSPORT_BASE}；</li>
 *   <li>同源（空串）—— 与 {@code @repo/utils} 的其它接口一致，交给平台网关/反向代理转发。</li>
 * </ol>
 *
 * <p>配置值只描述「源」，不含 {@code /api/apm} 前缀：前缀由 {@link APM_PREFIX}
 * 统一拼接，避免调用方各拼一遍导致地址漂移。</p>
 *
 * @since 4.0.0
 */

/** 独立部署时存储配置的键名 */
const STORAGE_KEY = "hotsport.api-base";

/** 观测接口统一前缀（与后端 Controller 的 {@code @RequestMapping} 对齐） */
export const APM_PREFIX = "/api/apm";

/** 实时告警/配置推送的 WebSocket 路径 */
export const APM_WS_PATH = "/ws/apm";

/**
 * 页面路由根前缀。
 *
 * <p>本包原先自己拥有路由表（{@code /dashboard}、{@code /traces}…），迁入平台后
 * 所有页面挂到该前缀下。页面之间的跳转统一引用本常量，避免散落的绝对路径。</p>
 */
export const ROUTE_PREFIX = "/hotsport";

/** 构建期缺省值；未配置时为空串 = 同源 */
const ENV_BASE: string = (() => {
  try {
    return String((import.meta as any).env?.VITE_HOTSPORT_BASE ?? "");
  } catch {
    return "";
  }
})();

/**
 * 规范化地址：去掉尾部斜杠，保留协议与端口。
 *
 * @param raw 原始地址
 * @returns 规范化后的地址，空串表示同源
 */
function normalize(raw: string): string {
  const value = (raw || "").trim();
  if (!value) {
    return "";
  }
  return value.replace(/\/+$/, "");
}

/**
 * 读取当前生效的接口源地址。
 *
 * @returns 源地址；空串表示与当前页面同源
 */
export function getApiBase(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return normalize(stored);
    }
  } catch {
    /* 隐私模式下 localStorage 不可用，退回构建期配置 */
  }
  return normalize(ENV_BASE);
}

/**
 * 保存接口源地址。
 *
 * @param raw 源地址；传空串表示恢复同源
 */
export function setApiBase(raw: string): void {
  try {
    const value = normalize(raw);
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* 写不进去时保持内存态由调用方提示，不阻断页面 */
  }
}

/** 恢复为构建期缺省（同源或 VITE_HOTSPORT_BASE） */
export function resetApiBase(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 忽略 */
  }
}

/**
 * 拼接观测接口完整地址。
 *
 * @param path 以 {@code /} 开头的接口路径，如 {@code /stats}、{@code /stream?intervalMs=3000}
 * @returns 完整地址；同源时返回相对地址
 */
export function apiUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${APM_PREFIX}${suffix}`;
}

/**
 * 拼接 WebSocket 地址（http/https 自动映射到 ws/wss）。
 *
 * @param path 以 {@code /} 开头的路径，缺省为 {@link APM_WS_PATH}
 * @returns 完整 ws(s) 地址
 */
export function wsUrl(path: string = APM_WS_PATH): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBase();
  if (!base) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${suffix}`;
  }
  // http(s) 源映射成 ws(s) 源；已显式写 ws(s) 的保持原样
  const wsBase = /^https:/i.test(base)
    ? base.replace(/^https:/i, "wss:")
    : /^http:/i.test(base)
      ? base.replace(/^http:/i, "ws:")
      : base;
  return `${wsBase}${suffix}`;
}

/**
 * 当前是否走同源。
 *
 * @returns 同源为 true
 */
export function isSameOrigin(): boolean {
  return getApiBase() === "";
}