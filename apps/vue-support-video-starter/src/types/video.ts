/**
 * 视频资源领域类型
 *
 * 与后端 spring-api-support-common-video-starter 的实体对应：
 * VideoInfoResult / VideoPlayAddress / VideoDownload。
 */

/** 视频条目（列表/详情通用） */
export interface VideoInfo {
  id: string;
  name: string;
  /** 原图/封面地址 */
  cover?: string;
  /** 类型：movie / tv / variety / anime / documentary 等 */
  videoType?: string;
  /** 年份 */
  year?: string;
  /** 评分 0-10 */
  score?: number;
  /** 地区 */
  district?: string;
  /** 标签（科幻/动作…） */
  tags?: string[];
  /** 导演 */
  director?: string;
  /** 主演 */
  actor?: string;
  /** 简介 */
  remark?: string;
  /** 剧集更新状态，如 "更新至 12 集" / "已完结" */
  continueInfo?: string;
  /** 更新时间 */
  updateTime?: string;
}

/** 单集播放地址 */
export interface VideoPlayAddressItem {
  /** 线路名，如 "线路一" */
  line?: string;
  /** 集数序号（从 1 开始） */
  index: number;
  /** 集名，如 "第 01 集" */
  name?: string;
  /** 播放地址（m3u8/mp4 等） */
  url: string;
}

/** 播放线路（一季/一组剧集） */
export interface VideoPlayLine {
  line: string;
  episodes: VideoPlayAddressItem[];
}

/** 下载地址 */
export interface VideoDownloadItem {
  /** 来源：pan（网盘）/ cl（直链） */
  type: "pan" | "cl";
  name?: string;
  url: string;
  password?: string;
}

/** 视频详情（含播放地址与下载） */
export interface VideoDetail extends VideoInfo {
  playLines: VideoPlayLine[];
  downloads: VideoDownloadItem[];
}

/** 分页响应 */
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 列表查询参数 */
export interface VideoQuery {
  keyword?: string;
  videoType?: string;
  year?: string;
  district?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
}
