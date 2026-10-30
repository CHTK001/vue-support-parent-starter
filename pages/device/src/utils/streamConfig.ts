/**
 * 设备取流的全局可配参数。
 *
 * <p>RTSP 是个例外：浏览器没有 TCP socket，<code>rtsp://</code> 地址既不能被
 * <code>flv.js</code> 也不能被 <code>hls.js</code>/<code>&lt;video&gt;</code> 直连播放。
 * 网关把设备侧的 <code>rtsp://</code> 地址转成后端可播放的地址（HTTP-FLV / HLS / MP4），
 * 取地址时交给 <code>ReVideo</code>（见 {@link RtspGateway}）。</p>
 *
 * <h3>部署覆盖</h3>
 * <ul>
 *   <li><code>VITE_RTSP_GATEWAY_TEMPLATE</code> — 网关地址模板（必须包含 <code>{url}</code> 占位符，空的不用拦截）；</li>
 *   <li><code>VITE_RTSP_GATEWAY_PROTOCOL</code> — 网关输出协议（<code>flv</code> / <code>hls</code> / <code>mp4</code>）。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.42
 */
import type { RtspGateway } from './streamProtocol'

const GATEWAY_TEMPLATE = import.meta.env.VITE_RTSP_GATEWAY_TEMPLATE ?? ''
const GATEWAY_PROTOCOL = import.meta.env.VITE_RTSP_GATEWAY_PROTOCOL ?? 'flv'

/** 是否已经配好了 RTSP 网关（没配 / 模板不合法 → 前端原地说明，不拿错地址乱猜） */
export function hasRtspGateway(): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\/.*\{url\}/i.test(GATEWAY_TEMPLATE)
}

/** RTSP 网关配置（由环境变量驱动，默认不拦截：rtsp 原样交给播放器/调用方决定） */
export const RTSP_GATEWAY: RtspGateway = {
  template: GATEWAY_TEMPLATE,
  protocol: (['flv', 'hls', 'mp4'] as const).includes(GATEWAY_PROTOCOL as 'flv' | 'hls' | 'mp4')
    ? (GATEWAY_PROTOCOL as 'flv' | 'hls' | 'mp4')
    : 'flv',
}