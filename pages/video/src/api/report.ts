import { http, type ReturnResult } from "@repo/utils";

/**
 * 视频报告统计数据类型
 */
export interface NameCount {
  name: string;
  count: number;
}

export interface VideoReportStatistics {
  totalVideos: number;
  totalDownloads: number;
  totalKeywords: number;
  totalSources: number;
  totalSyncConfigs: number;
  categoryDistribution: NameCount[];
  yearDistribution: NameCount[];
  districtDistribution: NameCount[];
  typeDistribution: NameCount[];
  recentDailyAdded: NameCount[];
  topViewed: Record<string, any>[];
  topRated: Record<string, any>[];
}

/**
 * 获取视频统计数据
 * @returns 统计数据
 */
export const getVideoReportStatistics = () => {
  return http.request<ReturnResult<VideoReportStatistics>>(
    "get",
    "/v1/video/report/statistics",
  );
};
