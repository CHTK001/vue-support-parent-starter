/**
 * apiHelper — 统一 API 请求错误提示
 *
 * 所有 http/unwrapResult 调用在此包裹一层：失败时默认弹出 Message.error，
 * 避免静默失败；仍向上 rethrow，由调用方决定后续（catch / 业务提示）。
 */
import { Message } from '@arco-design/web-react';

export interface ApiRequestOptions {
  /** 静默模式：失败时不弹 Message（用于预期可能失败、调用方自行处理的场景） */
  silent?: boolean;
  /** 自定义错误文案；默认取 err.message，再兜底「请求失败」 */
  errorMsg?: string;
}

/**
 * 包裹一个 API Promise：失败时统一提示并 rethrow。
 *
 * @param promise  已由 unwrapResult 解封的业务 Promise
 * @param options  silent / errorMsg
 */
export function apiRequest<T>(promise: Promise<T>, options?: ApiRequestOptions): Promise<T> {
  return promise.catch((err) => {
    if (!options?.silent) {
      const msg = options?.errorMsg || err?.message || '请求失败，请稍后重试';
      Message.error(msg);
    }
    throw err;
  });
}
