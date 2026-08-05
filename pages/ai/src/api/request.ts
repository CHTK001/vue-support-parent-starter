/**
 * 统一 HTTP 请求封装（薄适配层）
 *
 * 复用 @repo/core 注入的共享 http 实例（getApiHttp）：
 *   - 自动携带框架 token（Authorization）
 *   - 复用加密 / 签名 / loading / 失败重试拦截器
 *   - baseURL 由 app.yaml 的 httpConfig.baseUrl（/v2/ai）统一管理，无需本地拼路径
 *
 * 本文件仅保留 ReturnResult 解包逻辑，返回业务数据（data）本身。
 */
import { getApiHttp } from '@repo/core';
import type { AxiosResponse } from 'axios';

/**
 * 解包框架 ReturnResult 结构 { code, data, msg }
 * 成功返回 data，失败抛出 msg 错误。
 */
function unwrap<T>(res: AxiosResponse): T {
  const json = res?.data;
  if (json && typeof json === 'object' && 'code' in json && 'data' in json) {
    const code = String(json.code);
    if (code === '00000' || code === '200' || json.success === true || json.ok === true) {
      return json.data as T;
    }
    throw new Error(json.msg || '请求失败');
  }
  return json as T;
}

/** GET 请求（params 可选，自动转 query） */
export const get = <T>(url: string, params?: Record<string, unknown>) =>
  getApiHttp().get(url).query(params ?? {}).then((r) => unwrap<T>(r));

/** POST 请求 */
export const post = <T>(url: string, data?: unknown) =>
  getApiHttp().post(url).data((data ?? {}) as Record<string, unknown>).then((r) => unwrap<T>(r));

/** PUT 请求 */
export const put = <T>(url: string, data?: unknown) =>
  getApiHttp().put(url).data((data ?? {}) as Record<string, unknown>).then((r) => unwrap<T>(r));

/** DELETE 请求 */
export const del = <T>(url: string, params?: Record<string, unknown>) =>
  getApiHttp().delete(url).query(params ?? {}).then((r) => unwrap<T>(r));
