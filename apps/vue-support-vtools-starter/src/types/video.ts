export interface VideoItem {
  videoId: number | string;
  videoName: string;
  videoDescription?: string;
  videoCover?: string;
  videoPath?: string;
  videoUrl?: string;
  videoSize?: number;
  videoDuration?: number;
  videoStatus?: number;
  videoType?: string;
  videoTags?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  updateBy?: string;
}

export interface VideoSyncItem {
  syncId: number | string;
  syncName: string;
  syncUrl: string;
  syncPath?: string;
  syncStatus?: number;
  syncType?: string;
  syncCron?: string;
  syncLastTime?: string;
  syncNextTime?: string;
  syncCount?: number;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  updateBy?: string;
}

export interface VideoQuery {
  videoName?: string;
  videoType?: string;
  videoStatus?: number;
  pageNum?: number;
  pageSize?: number;
}

export interface VideoSyncQuery {
  syncName?: string;
  syncType?: string;
  syncStatus?: number;
  pageNum?: number;
  pageSize?: number;
} 