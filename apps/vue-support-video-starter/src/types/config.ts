/**
 * 视频/直播配置领域类型
 *
 * 与后端 spring-api-support-common-video-starter 的 VideoConfigSnapshot /
 * VideoConfigController 对应。
 */
import type { LiveGroup, LiveChannel } from "@/types/live";

/** 直播目录（分组 + 频道） */
export interface LiveCatalog {
  groups: LiveGroup[];
  channels: LiveChannel[];
}

/** 配置概览（GET /video/api/config） */
export interface VideoConfigOverview {
  /** 存储模式：db | json */
  storage: string;
  catalogUrl?: string;
  defaultKeyword?: string;
  browseKeywords?: Record<string, string>;
  liveChannelCount?: number;
}

/** 配置快照（GET /export，POST /import），用于导出/导入/页面编辑 */
export interface VideoConfigSnapshot {
  catalogUrl?: string;
  defaultKeyword?: string;
  browseKeywords?: Record<string, string>;
  liveCatalog?: LiveCatalog;
}
