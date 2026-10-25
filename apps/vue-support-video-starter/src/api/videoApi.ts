/**
 * 视频资源 API 层
 *
 * 后端为 spring-api-support-common-video-starter 的 VideoSearchController
 * （/video/api 代理 → 服务端口）。请求层见 {@link import("./request")}。
 */
import type {
  VideoDetail,
  VideoDownloadItem,
  VideoInfo,
  VideoPlayAddressItem,
  VideoPlayLine,
  VideoQuery,
  PageResult,
} from "@/types/video";
import { apiRequest } from "@/api/request";
import { plainText } from "@/utils/text";

/** 后端 VideoPlayAddress / VideoPlayAddressChannel 子集（MacCmsCatalogClient.parsePlayAddresses） */
interface RawPlayLine {
  videoPlayAddressName?: string;
  videoPlayAddressChannels?: Array<{
    videoPlayAddressChannelName?: string;
    videoPlayAddressUrl?: string;
  }> | null;
}

/** 后端 VideoDownload 子集（MacCmsCatalogClient.parseDownloads） */
interface RawDownload {
  videoDownloadPlatform?: string;
  videoDownloadType?: string;
  videoDownloadName?: string;
  videoDownloadUrl?: string;
}

/** 后端 VideoInfoResult 字段子集（与前端类型不同名） */
interface RawVideo {
  videoId?: number;
  videoOriginId?: string;
  videoName?: string;
  videoTitle?: string;
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
  videoQuality?: string;
  videoViews?: number;
  videoPublishDate?: string;
  tags?: string;
  videoRemark?: string;
  /** 播放线路（多线路 / 多集） */
  playAddressesList?: RawPlayLine[] | null;
  /** 下载资源（网盘 / 直链） */
  downloadList?: RawDownload[] | null;
  /** 下载地址串（无 downloadList 时的兜底） */
  downloadUrls?: string;
}

/** "2026-10-18T10:00:00" → "2026-10-18" */
function formatPublishDate(text?: string): string | undefined {
  if (!text) return undefined;
  const matched = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return matched ? `${matched[1]}-${matched[2]}-${matched[3]}` : text;
}

/** 后端条目 → 前端 VideoInfo 映射 */
function mapVideo(raw: RawVideo): VideoInfo {
  return {
    id: String(raw.videoOriginId ?? raw.videoId ?? ""),
    name: raw.videoName || raw.videoTitle || "",
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
    remark: plainText(raw.videoDescription) || undefined,
    /** vod_remarks 是「更新至 N 集 / HD 国语」这类状态，不是更新时间 */
    continueInfo: raw.videoRemark?.trim() || undefined,
    updateTime: formatPublishDate(raw.videoPublishDate),
  };
}

/** 播放线路：后端给的是多线路 × 多集，逐层摊平成前端结构 */
function toPlayLines(raw: RawVideo): VideoPlayLine[] {
  return (raw.playAddressesList ?? [])
    .map((line, i) => {
      const episodes: VideoPlayAddressItem[] = [];
      for (const channel of line.videoPlayAddressChannels ?? []) {
        const url = channel.videoPlayAddressUrl?.trim();
        if (!url) continue;
        episodes.push({
          index: episodes.length + 1,
          name: channel.videoPlayAddressChannelName?.trim() || `第 ${episodes.length + 1} 集`,
          url,
        });
      }
      return {
        line: line.videoPlayAddressName?.trim() || `线路${i + 1}`,
        episodes,
      };
    })
    .filter((line) => line.episodes.length > 0);
}

/** 下载资源：网盘与直链分开归类 */
function classifyDownload(platform: string, type?: string): "pan" | "cl" {
  if (type === "cl") return "cl";
  return /(直链|下载|磁力|magnet|torrent|ed2k)/i.test(platform) ? "cl" : "pan";
}

function toDownloads(raw: RawVideo): VideoDownloadItem[] {
  const list: VideoDownloadItem[] = [];
  for (const item of raw.downloadList ?? []) {
    const url = item.videoDownloadUrl?.trim();
    if (!url) continue;
    const platform = item.videoDownloadPlatform?.trim() ?? "";
    const name = item.videoDownloadName?.trim() || platform || "资源";
    list.push({
      type: classifyDownload(platform, item.videoDownloadType),
      name: platform && platform !== name ? `${platform} · ${name}` : name,
      url,
    });
  }
  // 只有地址串时按直链处理
  if (!list.length && raw.downloadUrls) {
    for (const piece of raw.downloadUrls.split(/[\s,，\n]+/)) {
      if (piece.trim()) list.push({ type: "cl", name: "直链下载", url: piece.trim() });
    }
  }
  return list;
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

/** 获取视频详情（聚合检索按 originId 匹配，含播放线路与下载资源） */
export async function fetchVideoDetail(id: string): Promise<VideoDetail> {
  const raw = await apiRequest<RawVideo>(`/video/${encodeURIComponent(id)}`);
  const info = mapVideo(raw);

  const playLines = toPlayLines(raw);
  // 兜底：后端只给了首个播放地址时按单线路单集呈现
  if (!playLines.length && raw.videoUrl) {
    playLines.push({ line: "默认线路", episodes: [{ index: 1, name: "正片", url: raw.videoUrl }] });
  }

  return { ...info, playLines, downloads: toDownloads(raw) };
}

