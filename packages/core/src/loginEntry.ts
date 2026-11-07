/**
 * 登录类型 → 后端地址（core）
 *
 * <p>登录页允许配置多个登录入口（app.yaml {@code loginConfig.types}），
 * 每个入口可以指向不同的后端（平台站点 / 租户独立站点）。选中某一项后：</p>
 *
 * <ol>
 *   <li>登录请求本身发往该入口的地址（{@link getActiveBaseUrl}）；</li>
 *   <li>登录成功后写入 {@code http.baseUrl}，此后所有业务请求都走同一个后端 ——
 *       否则令牌是在 A 站签发的，业务请求却打到 B 站，必然 401。</li>
 * </ol>
 *
 * <p>地址为空串或 {@code null} 表示「沿用 app.yaml 的 httpConfig.baseUrl」，
 * 此时什么都不写，不能把同源代理配置覆盖成空串。</p>
 */
import { getConfig, applyConfig } from "@repo/config";

/** 当前选中的登录入口后端地址（空串 = 未选 / 沿用本地 httpConfig.baseUrl） */
let activeBaseUrl = "";

/**
 * 规整地址：去首尾空白与末尾斜杠。
 *
 * <p>末尾斜杠必须去掉：http 客户端拼接时是 {@code baseUrl + "/" + path}，
 * 不过滤会拼出 {@code //v2/login}，部分网关会当成不同路径返回 404。</p>
 */
function normalizeBaseUrl(url?: string | null): string {
  return String(url ?? "").trim().replace(/\/+$/, "");
}

/**
 * 记住登录入口的后端地址。
 *
 * @param url 入口配置的 baseUrl；空串 / null 表示沿用本地配置（内部按空串处理）
 */
export function setActiveBaseUrl(url?: string | null): void {
  activeBaseUrl = normalizeBaseUrl(url);
}

/** 当前登录入口的后端地址；未选或留空时返回空串 */
export function getActiveBaseUrl(): string {
  return activeBaseUrl;
}

/**
 * 登录成功后把入口地址落进全局配置。
 *
 * <p>只写非空地址：留空意味着「和 app.yaml 一样」，此时覆盖会把同源代理
 * （monitor 的 baseUrl="/"）改成空串，反而让请求路径变成绝对路径丢失代理前缀。</p>
 */
export function applyActiveBaseUrl(): void {
  if (!activeBaseUrl) return;
  applyConfig({ http: { baseUrl: activeBaseUrl } } as never);
}

/** 清空登录入口地址（登出 / 登出失败回登录页时调用，避免下一个人继承上一个入口） */
export function resetActiveBaseUrl(): void {
  activeBaseUrl = "";
}

/** 读取当前生效的请求地址：登录入口优先，未设置时用全局配置 */
export function resolveRequestBaseUrl(): string {
  return activeBaseUrl || normalizeBaseUrl(getConfig()?.http?.baseUrl);
}
