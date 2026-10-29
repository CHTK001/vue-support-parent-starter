/**
 * @pages/server 实时通道
 *
 * <p>所有 SSE/WS 推送只通过 {@code realtimeChannel} 接入，避免每个组件各自
 * {@code new EventSource()} 建只属于自己的连接（主机资产页尤其明显：一个页签
 * 开多个连接就会建立多条长连接）。</p>
 */
export * from './realtime';
