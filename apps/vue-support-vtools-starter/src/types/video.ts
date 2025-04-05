export interface VideoItem {
  videoId: number | string;
  videoName: string;
  videoTitle?: string;
  videoAliasName?: string;
  videoDescription?: string;
  videoCover?: string;
  videoPath?: string;
  videoUrl?: string;
  videoSize?: number | string;
  videoDuration?: number;
  videoStatus?: number;
  videoType?: string;
  videoTags?: string;
  videoYear?: string | number;
  videoDistrict?: string;
  videoScore?: number;
  videoViews?: number;
  videoLikes?: number;
  videoActor?: string;
  videoDirector?: string;
  videoWriter?: string;
  videoLanguage?: string;
  videoQuality?: string;
  videoRelease?: string;
  videoDouBanId?: string;
  videoPlatform?: string;
  videoPublishDate?: string | Date;
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