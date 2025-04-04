/**
 * 视频下载链接类型定义
 */

export interface DownloadItem {
  uploadId: number | string;
  uploadVideoId?: string | number;
  uploadName: string;
  uploadUrl: string;
  uploadType: string;
  uploadQuality?: string;
  uploadSize?: number ;
  uploadMagnetic?: string;
  uploadStatus: number | Byte;
  uploadCount?: number;
  uploadShareTime?: string;
  uploadPath?: string;
  uploadDescription?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  updateBy?: string;
  
  // 兼容旧字段名称，用于与后端API交互
  videoDownloadId?: number | string;
  videoDownloadVideoId?: string | number;
  videoDownloadName?: string;
  videoDownloadUrl?: string;
  videoDownloadType?: string;
  videoDownloadQuality?: string;
  videoDownloadSize?: number | string;
  videoDownloadMagnetic?: string;
  videoDownloadStatus?: number | Byte;
  videoDownloadCount?: number;
  videoDownloadShareTime?: string;
}

type Byte = number;