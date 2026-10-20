/**
 * RTSP 网关配置。
 *
 * <p>浏览器无法直连 {@code rtsp://}，后端 /video/stream 当前也只是原样返回厂商地址，
 * 因此前端需要服务端转流。支持两种开源/可配置网关：</p>
 * <ul>
 *   <li>模板型：{@code VITE_RTSP_GATEWAY_TEMPLATE} 直接替换 {@code {url}}；</li>
 *   <li>go2rtc 型：默认 {@code http://127.0.0.1:1984}，先通过 API 创建流，再返回 HLS 播放地址。</li>
 * </ul>
 */

import type { RtspGateway } from "./streamProtocol";

const TEMPLATE = (import.meta.env.VITE_RTSP_GATEWAY_TEMPLATE as string | undefined)?.trim() ?? "";
const PROTOCOL = (import.meta.env.VITE_RTSP_GATEWAY_PROTOCOL as string | undefined)?.trim().toLowerCase();
const GO2RTC = (import.meta.env.VITE_RTSP_GATEWAY_GO2RTC as string | undefined)?.trim() || "/go2rtc";

/** 解析环境变量里的 RTSP 网关；未配置模板时默认走本地 go2rtc */
export function resolveRtspGateway(): RtspGateway | undefined {
  if (TEMPLATE.includes("{url}")) {
    return {
      kind: "template",
      template: TEMPLATE,
      protocol: PROTOCOL === "hls" || PROTOCOL === "mp4" ? PROTOCOL : "flv",
    };
  }
  return {
    kind: "go2rtc",
    baseUrl: GO2RTC,
    protocol: "flv",
  };
}

/**
 * 通过 go2rtc API 把 RTSP 源注册为临时 stream，并返回 FLV 播放地址。
 * 实测 RTSP → go2rtc → HTTP-FLV → flv.js 可正常出帧。
 *
 * @param source  RTSP 原始地址
 * @param baseUrl go2rtc API 地址
 */
export async function resolveGo2rtcUrl(source: string, baseUrl: string): Promise<string> {
  const name = `rtsp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const createUrl = `${baseUrl}/api/streams?src=${encodeURIComponent(source)}&name=${encodeURIComponent(name)}`;
  const res = await fetch(createUrl, { method: "PUT" });
  if (!res.ok) {
    throw new Error(`RTSP 网关创建流失败：HTTP ${res.status}`);
  }
  return `${baseUrl}/api/stream.flv?src=${encodeURIComponent(name)}`;
}
