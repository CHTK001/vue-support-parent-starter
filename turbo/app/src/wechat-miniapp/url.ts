/**
 * @repo/app/wechat-miniapp —— URL 拼接（http 与 sse 共用一处）
 */

/** 拼接 baseUrl 与路径（绝对地址原样返回，避免重复拼前缀） */
export function joinUrl(baseUrl: string, url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const base = baseUrl.replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}
