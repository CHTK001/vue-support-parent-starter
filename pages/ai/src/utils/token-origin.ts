/**
 * 「令牌只发给同源地址」的判定。
 *
 * <p><b>为什么需要它。</b>出图结果里既有后端存下来的字节（{@code /v2/ai/generate/...}），
 * 也有供应商直链（第三方 {@code https://} 地址，后端原样透传）。
 * 前者要带令牌取回，后者<b>绝对不能</b>带 —— 无差别地附上
 * {@code x-oauth-token} / {@code Authorization} 等于主动把 accessToken
 * 送到供应商手里，比「令牌出现在 URL 里」严重得多（URL 至少还会被
 * Referer 策略部分挡一下，请求头则是无条件送达）。</p>
 *
 * <p>刻意不依赖 {@code vue} / {@code window}：判定逻辑必须能在 Node 下
 * 直接验收（见 {@code scripts/verify-token-origin.mts}），所以基准地址
 * 作为参数传入，由调用方给 {@code window.location.href}。</p>
 *
 * @since 4.0.0.42
 */

/** 默认的令牌请求头名；与后端 oauth 客户端的 tokenName 一致 */
export const TOKEN_HEADER = "x-oauth-token";

/**
 * 判断目标地址是否与基准页面**同源**。
 *
 * <p>无 scheme 的地址（{@code /v2/...}、{@code blob:}、{@code data:}）
 * 一律按同源算 —— 它们不可能指向第三方。</p>
 *
 * @param url 待请求地址
 * @param baseHref 基准页面地址（默认当前 {@code document.baseURI}，Node 下为空）
 * @returns 同源时为 true
 */
export function isSameOrigin(url: string, baseHref?: string): boolean {
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    // 协议相对地址（//host/x）以 scheme 开头，这里已排除；剩下的是 /path 形式
    return true;
  }
  const scheme = url.slice(0, url.indexOf(":") + 1).toLowerCase();
  if (scheme !== "http:" && scheme !== "https:") {
    // blob: / data: / file: 等，不构成跨源请求
    return true;
  }
  const base =
    baseHref ?? (typeof document !== "undefined" ? document.baseURI : undefined);
  if (!base) {
    // 没有基准可比：宁可不发令牌（fail-closed）
    return false;
  }
  try {
    return new URL(url, base).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

/**
 * 构造带令牌的请求头；跨源（或无法判定同源）时**一律不带**。
 *
 * @param token 令牌；为空则不带
 * @param url 目标地址
 * @param headerName 令牌头名，默认 {@link TOKEN_HEADER}
 * @param baseHref 基准页面地址，见 {@link isSameOrigin}
 * @returns 请求头对象
 */
export function authHeaders(
  token: string | null | undefined,
  url: string,
  headerName: string = TOKEN_HEADER,
  baseHref?: string,
): Record<string, string> {
  if (!token || !isSameOrigin(url, baseHref)) {
    return {};
  }
  return { [headerName]: token };
}