// 视频信息接口
export interface VideoInfo {
  monitorVideoId: string;
  monitorVideoTitle: string;
  monitorVideoDescription: string;
  monitorVideoThumbnail: string;
  monitorVideoUrl: string;
  monitorVideoDuration: string;
  monitorVideoViews: number;
  monitorVideoLikes: number;
  monitorVideoPublishDate: string;
  monitorVideoType: string;
  monitorVideoPlatform: string;
  monitorVideoAuthor: string;
}

// 定义视频搜索结果接口
export interface MonitorVideoResult {
  monitorVideoId: string;
  monitorVideoTitle: string;
  monitorVideoPlatform: string;
  monitorVideoThumbnail: string;
  monitorVideoUrl: string;
  monitorVideoViews: number;
  monitorVideoDuration: string;
  monitorVideoPublishDate: string;
  monitorVideoType: string;
  monitorVideoSize?: string;
  monitorVideoResolution?: string;
  monitorVideoAuthor?: string;
  monitorVideoDescription?: string;
  monitorVideoDownloadUrl?: string;
}

// 通用响应接口
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  success: boolean;
}

// 搜索参数接口
export interface VideoSearchParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  selectedType?: string;
  platformId?: string;
}

// 搜索结果接口
export interface VideoSearchResult {
  data: VideoInfo[];
  total: number;
}

// 定义视频类型接口
export interface VideoType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// 定义视频平台接口
export interface VideoPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  url: string;
}
