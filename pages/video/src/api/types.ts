/**
 * 视频模块API类型定义
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

// 通用响应格式
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

// 分页响应格式
export interface PageResponse<T = any> {
  code: number;
  message: string;
  data: {
    records: T[];
    total: number;
    size: number;
    current: number;
    pages: number;
  };
  timestamp: string;
}

// 视频信息
export interface VideoInfo {
  videoId?: string;
  videoName: string;
  videoUrl: string;
  videoCover?: string;
  videoDescription?: string;
  videoCategory?: string;
  videoYear?: number;
  videoRating?: number;
  videoDuration?: string;
  videoDirector?: string;
  videoActors?: string;
  videoLanguage?: string;
  videoCountry?: string;
  videoPlatform?: string;
  videoStatus?: number;
  createTime?: string;
  updateTime?: string;
}

// 视频搜索请求
export interface VideoSearchRequest {
  keyword: string;
  category?: string;
  year?: number;
  rating?: number;
  platform?: string;
  page: number;
  size: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// 视频下载信息
export interface VideoDownload {
  downloadId?: string;
  videoId: string;
  downloadUrl: string;
  downloadPlatform: string;
  downloadQuality?: string;
  downloadSize?: string;
  extractPassword?: string;
  downloadStatus?: number;
  createTime?: string;
  updateTime?: string;
}

// 视频评分
export interface VideoRating {
  ratingId?: string;
  videoId: string;
  ratingScore: number;
  ratingComment?: string;
  ratingUser?: string;
  createTime?: string;
}

// 视频关键词
export interface VideoKeyword {
  keywordId?: string;
  keywordContent: string;
  keywordCount?: number;
  keywordHot?: number;
  createTime?: string;
  updateTime?: string;
}

// 视频同步配置
export interface VideoSyncConfig {
  videoSyncConfigId?: string;
  videoSyncConfigName: string;
  videoSyncConfigSource: string;
  videoSyncConfigUrl?: string;
  videoConfigRemark?: string;
  videoSyncConfigKeyword?: string;
  videoSyncConfigCategory?: string;
  videoSyncConfigCron?: string;
  videoSyncConfigStatus?: number;
  videoSyncInterval?: number;
  syncCount?: number;
  videoSyncConfigLastSyncTime?: string;
  videoConfigHeaders?: string;
  createTime?: string;
  updateTime?: string;
}

// 网盘类型枚举
export enum PanType {
  BAIDU = "BAIDU",
  ALIYUN = "ALIYUN",
  QUARK = "QUARK",
  UC = "UC",
  LANZOU = "LANZOU",
  TIANYI = "TIANYI",
}

// 网盘资源
export interface PanResource {
  title: string;
  url: string;
  panType: PanType;
  size?: string;
  updateTime?: string;
  extractPassword?: string;
}

// PanSou搜索结果
export interface PanSouResult {
  keyword: string;
  results: PanResource[];
  total: number;
  page: number;
  size: number;
}

// SocketIO消息类型
export enum MessageType {
  SYNC_START = "SYNC_START",
  SYNC_PROGRESS = "SYNC_PROGRESS",
  SYNC_COMPLETE = "SYNC_COMPLETE",
  SYNC_ERROR = "SYNC_ERROR",
  VIDEO_PROCESSING = "VIDEO_PROCESSING",
  SYSTEM_NOTIFICATION = "SYSTEM_NOTIFICATION",
}

// SocketIO消息
export interface VideoSyncMessage {
  type: MessageType;
  configId?: string;
  taskName?: string;
  message: string;
  progress?: number;
  total?: number;
  timestamp: string;
  data?: any;
}

// 统计信息
export interface VideoStats {
  totalVideos: number;
  syncConfigs: number;
  todaySearches: number;
  parseCount: number;
}
