/**
 * @pages/server 实时通道
 *
 * <p>主机资产区域（{@code AssetsView}）只保留一条全局 SSE 长连接：底部资源摘要
 * （句柄数 / inode）与邮箱新邮件都经 {@code hostAssetsSse} 推送。其它页面/组件
 * 不再自建 {@code new EventSource()}，避免一个页签开多条长连接。</p>
 *
 * <p>socket.io 的指标/延迟推送不属于 SSE，仍按原有 socket 通道接入。</p>
 */
export * from './realtime';
