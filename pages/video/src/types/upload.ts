/**
 * 视频下载链接类型定义
 */

export interface DownloadItem {
  videoDownloadId?: number | string;
  videoDownloadVideoId?: string | number;
  videoDownloadName?: string;
  videoDownloadUrl?: string;
  videoDownloadType?: string;
  videoDownloadQuality?: string;
  videoDownloadSize?: number;
  videoId?: number;
  videoDownloadMagnetic?: string;
  videoDownloadStatus?: number | Byte;
  videoDownloadCount?: number;
  videoDownloadShareTime?: string;
}

type Byte = number;