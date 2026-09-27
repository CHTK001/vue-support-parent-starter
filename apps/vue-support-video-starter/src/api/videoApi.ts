/**
 * 视频资源 API 层
 *
 * 后端为 spring-api-support-common-video-starter 的 VideoSearchController
 * （/video/api 代理 → 服务端口）。请求层见 {@link import("./request")}。
 */
import type { VideoDetail, VideoInfo, VideoQuery, PageResult } from "@/types/video";
import { apiRequest } from "@/api/request";

/** 后端 VideoInfoResult 字段子集（与前端类型不同名） */
interface RawVideo {
  videoId?: number;
  videoOriginId?: string;
  videoName?: string;
  videoAliasName?: string;
  videoScore?: number;
  videoYear?: number;
  videoDistrict?: string;
  videoDirector?: string;
  videoActor?: string;
  videoDescription?: string;
  videoCover?: string;
  videoThumbnail?: string;
  videoType?: string;
  videoCategory?: string;
  videoPlatform?: string;
  videoUrl?: string;
  tags?: string;
  videoRemark?: string;
}

/** 后端条目 → 前端 VideoInfo 映射 */
function mapVideo(raw: RawVideo): VideoInfo {
  return {
    id: String(raw.videoOriginId ?? raw.videoId ?? ""),
    name: raw.videoName ?? "",
    cover: raw.videoCover || raw.videoThumbnail || undefined,
    videoType: raw.videoCategory || raw.videoType || undefined,
    year: raw.videoYear != null ? String(raw.videoYear) : undefined,
    score: raw.videoScore ?? undefined,
    district: raw.videoDistrict || undefined,
    tags: raw.tags
      ? raw.tags
          .split(/[,，、\s]+/)
          .filter(Boolean)
          .slice(0, 5)
      : undefined,
    director: raw.videoDirector || undefined,
    actor: raw.videoActor || undefined,
    remark: raw.videoDescription || undefined,
    updateTime: raw.videoRemark || undefined,
  };
}

/** 分页查询视频列表（多源聚合） */
export async function fetchVideoList(query: VideoQuery): Promise<PageResult<VideoInfo>> {
  const rawList = await apiRequest<RawVideo[]>("/video/list", query as Record<string, unknown>);
  const list = (Array.isArray(rawList) ? rawList : []).map(mapVideo);
  return {
    list,
    total: list.length,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 24,
  };
}

/** 获取视频详情（聚合检索按 originId 匹配） */
export async function fetchVideoDetail(id: string): Promise<VideoDetail> {
  const raw = await apiRequest<RawVideo>(`/video/${encodeURIComponent(id)}`);
  const info = mapVideo(raw);
  // 聚合接口返回单条含 videoUrl 的条目；有地址时作为单线路单集呈现
  return {
    ...info,
    playLines: info.id
      ? [{ line: "默认线路", episodes: [{ index: 1, name: "正片", url: raw.videoUrl ?? "" }] }]
      : [],
    downloads: [],
  };
}
