/**
 * 直播频道 API 层
 *
 * 后端为 spring-api-support-common-video-starter 的 LiveChannelController：
 *   - /live/groups   分组列表
 *   - /live/channels 频道列表（group / cctv 过滤）
 *   - /live/{id}/play.m3u8?src=N  经后端 HLS 代理的播放地址
 *
 * 播放地址走后端代理，规避公开源无 CORS 头、http 混合内容与 Referer 限制。
 */
import type { LiveChannel, LiveGroup, LiveQuery } from "@/types/live";
import { API_BASE, apiRequest } from "@/api/request";

/** 查询直播分组 */
export function fetchLiveGroups(): Promise<LiveGroup[]> {
  return apiRequest<LiveGroup[]>("/live/groups");
}

/** 查询直播频道 */
export function fetchLiveChannels(query: LiveQuery = {}): Promise<LiveChannel[]> {
  return apiRequest<LiveChannel[]>("/live/channels", query as Record<string, unknown>);
}

/**
 * 频道播放地址（后端代理，src 为候选源下标）
 *
 * @param channelId 频道标识
 * @param src       候选源下标，从 0 开始
 */
export function livePlayUrl(channelId: string, src = 0): string {
  return `${API_BASE}/live/${encodeURIComponent(channelId)}/play.m3u8?src=${src}`;
}
