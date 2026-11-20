/**
 * RePanelError 状态机辅助函数
 *
 * <p>语义照抄 pages/actuator 的黄金范式 {@code useCardResource.ts}：</p>
 * <ul>
 *   <li>{@code unavailable} —— 端点没暴露（404 / 405 / 501）或没配数据源。这是
 *       <b>正常的部署形态</b>，重试永远不会成功，所以给「怎么开启」的接入指引，
 *       而不是一个骗人的「重试」；</li>
 *   <li>{@code error} —— 网络炸了 / 500 / 解析失败。这是真故障，给「重试」；</li>
 *   <li>鉴权失败（401 / 403）归入 {@code error}，文案加「鉴权失败：」前缀。</li>
 * </ul>
 */

/** 面板资源状态 */
export type PanelState = "loading" | "ready" | "unavailable" | "error";

/** 从任意错误对象里挖出可读文案 */
export function toErrorMessage(err: unknown): string {
  if (!err) return "未知错误";
  const e = err as {
    message?: string;
    status?: number;
    response?: { status?: number; data?: unknown };
  };
  const status = e.response?.status ?? e.status;
  const data = e.response?.data;
  if (typeof data === "string" && data.trim()) return `${status ? `[${status}] ` : ""}${data.slice(0, 200)}`;
  if (data && typeof data === "object") {
    const msg = (data as { message?: string; error?: string }).message ?? (data as { error?: string }).error;
    if (msg) return `${status ? `[${status}] ` : ""}${msg}`;
  }
  if (e.message) return e.message;
  return String(err);
}

/**
 * 是否为「端点未暴露 / 资源不存在」类错误（404 / 405 / 501）。
 *
 * <p>拿不到 HTTP 状态时退回文案匹配 —— 不同 axios 版本、不同拦截器对错误的
 * 包装不一致，只认状态码会在某些链路上把 404 误判成真故障。</p>
 */
export function isUnavailableError(err: unknown): boolean {
  const e = err as { status?: number; response?: { status?: number }; message?: string };
  const status = e?.response?.status ?? e?.status;
  if (status === 404 || status === 405 || status === 501) return true;
  const text = (e?.message ?? "").toString();
  return /(^|\D)(404|405|501)(\D|$)|not found|no static resource|未找到/i.test(text);
}

/** 是否为鉴权类错误（401 / 403） */
export function isAuthError(err: unknown): boolean {
  const e = err as { status?: number; response?: { status?: number }; message?: string };
  const status = e?.response?.status ?? e?.status;
  if (status === 401 || status === 403) return true;
  return /401|403|未授权|无权限|token/i.test(e?.message ?? "");
}

/**
 * 按错误对象分类面板状态。
 *
 * <p>{@code unavailable} 给接入指引（不重试）；鉴权失败与真故障归 {@code error}
 * （可重试），鉴权失败额外加「鉴权失败：」前缀提示重新登录 / 授权。</p>
 */
export function panelStateFromError(err: unknown): { state: PanelState; message: string } {
  if (isAuthError(err)) {
    return { state: "error", message: `鉴权失败：${toErrorMessage(err)}` };
  }
  if (isUnavailableError(err)) {
    return { state: "unavailable", message: toErrorMessage(err) };
  }
  return { state: "error", message: toErrorMessage(err) };
}
