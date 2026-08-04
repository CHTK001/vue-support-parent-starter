/**
 * 统一 HTTP 请求封装
 * 
 * 基于 fetch API 实现，自动组织请求标头和响应处理。
 * 支持类型参数确保返回值类型安全。
 */
const BASE_URL = '/v2/ai';

/** 从 localStorage 获取用户 token */
const getToken = () => localStorage.getItem('token') || '';

/**
 * 发起 HTTP 请求
 * @param url - 接口路径（不包含基础路径）
 * @param options - fetch 配置项
 * @returns 响应数据（已解析为 JSON）
 */
export async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // HeadersInit 是联合类型（Headers | 数组 | 普通对象），用原生 Headers 归一化
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '请求失败');
  }

  return res.json();
}

/** GET 请求 */
export const get = <T>(url: string) => request<T>(url, { method: 'GET' });

/** POST 请求 */
export const post = <T>(url: string, data?: any) =>
  request<T>(url, { method: 'POST', body: JSON.stringify(data) });

/** PUT 请求 */
export const put = <T>(url: string, data?: any) =>
  request<T>(url, { method: 'PUT', body: JSON.stringify(data) });

/** DELETE 请求 */
export const del = <T>(url: string) => request<T>(url, { method: 'DELETE' });