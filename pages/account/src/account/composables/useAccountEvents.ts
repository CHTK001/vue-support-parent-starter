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
import { createSseService, getGlobalSocketConfig, type SocketTemplate } from '@repo/core';

/** 账号事件 SSE 路径（后端 AccountEventController） */
const ACCOUNT_EVENTS_PATH = '/api/accounts/events';

/** 全局唯一实例（模块级单例） */
let instance: SocketTemplate | null = null;

/**
 * 取账号页 SSE 连接（懒创建，多次调用返回同一实例）。
 *
 * <p>地址优先取全局 Socket 配置里的 urls（宿主可能配置了独立推送地址），
 * 没有则退回当前源；token 由 SSE 客户端按默认行为放进
 * {@code Authorization} / {@code x-oauth-token} 请求头，不走 URL。</p>
 */
export function useAccountEvents(): SocketTemplate {
  if (!instance) {
    const { urls } = getGlobalSocketConfig();
    const resolved = urls.length > 0 ? urls : [window.location.origin];
    instance = createSseService({
      urls: resolved,
      path: ACCOUNT_EVENTS_PATH,
      reconnection: true,
      reconnectionDelay: 3000
    });
  }
  return instance;
}
