/**
 * 账号页统一 SSE 事件连接（单例）。
 *
 * <p>账号页的实时推送（新邮件 {@code new-mail}、新短信 {@code new-sms}、
 * 账号变更 {@code account-changed}）共用一条全局 SSE 连接
 * （后端 {@code /api/accounts/events}），替代逐功能建连。后端载荷为
 * {@code {module:"account", event, data, timestamp}}，SSE event 名即 event，
 * 与 Socket 推送同构，因此 {@code subscribe("account", event, cb)} 的用法不变。</p>
 *
 * <p>单例语义：账号页多个组件（列表、抽屉、角标）共享同一条连接，各自
 * subscribe / unsubscribe 互不影响；断线由 SSE 客户端自动重连。</p>
 */
import { createSseService, type SocketTemplate } from '@repo/core';
import { getConfig } from '@repo/config';

/** 账号事件 SSE 路径（后端 AccountEventController） */
const ACCOUNT_EVENTS_PATH = '/api/accounts/events';

/** 全局唯一实例（模块级单例） */
let instance: SocketTemplate | null = null;

/** 解析 origin（相对地址基于当前页面源） */
function resolveOrigin(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  try {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return new URL(value, window.location.origin).origin;
    }
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * 取账号页 SSE 连接（懒创建，多次调用返回同一实例）。
 *
 * <p>地址跟随 HTTP API 源（与 /api/accounts 同源同代理），不取全局 Socket
 * 推送地址：/api/accounts/events 是应用自身的 MVC 端点
 * （AccountEventController，GET/POST 均开放），而 Socket 地址指向独立的
 * socket.io 推送端口，并不承载该 REST 端点；跨源 POST 还会被 CORS 预检
 * 拦截，导致状态灯永远灰色。token 由 SSE 客户端按默认行为放进
 * {@code Authorization} / {@code x-oauth-token} 请求头，不走 URL。</p>
 */
export function useAccountEvents(): SocketTemplate {
  if (!instance) {
    const httpOrigin = resolveOrigin(getConfig()?.http?.baseUrl);
    const origin = httpOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
    instance = createSseService({
      urls: origin ? [origin] : [],
      path: ACCOUNT_EVENTS_PATH,
      reconnection: true,
      reconnectionDelay: 3000
    });
  }
  return instance;
}
