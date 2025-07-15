import { http, type ReturnResult } from "@repo/utils";

// 分页结果接口
export interface ReturnPageResult<T> {
  code: string;
  message?: string;
  data?: {
    records: T[];
    total: number;
    size: number;
    current: number;
    pages: number;
  };
}

// 文件系统实体接口
export interface FileSystem {
  fileSystemId?: number;
  fileSystemName: string;
  fileSystemOriginalName?: string;
  fileSystemPath: string;
  fileSystemSize: number;
  fileSystemMd5?: string;
  fileSystemType?: string;
  fileSystemExtension?: string;
  fileSystemStatus: number;
  fileSystemChunkTotal?: number;
  fileSystemChunkUploaded?: number;
  fileSystemUploadStartTime?: string;
  fileSystemUploadCompleteTime?: string;
  fileSystemHttpAccessEnabled?: boolean;
  fileSystemHttpAccessUrl?: string;
  fileSystemRemark?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  updateBy?: string;
}

// 文件统计信息接口
export interface FileStatistics {
  totalFiles: number;
  totalSize: number;
  pendingFiles: number;
  mergingFiles: number;
  completedFiles: number;
  failedFiles: number;
  httpAccessEnabledFiles: number;
  todayUploadFiles: number;
  todayUploadSize: number;
  averageFileSize: number;
  storageUsageRate: number;
}

// 上传队列状态接口
export interface UploadQueueStatus {
  fileId: number;
  fileName: string;
  progress: number;
  status: "uploading" | "merging" | "completed" | "failed";
  message?: string;
}

// 目录信息接口
export interface DirectoryInfo {
  name: string; // 目录名称
  path: string; // 目录路径
  size?: number; // 目录大小
  lastModified?: number; // 最后修改时间
  canRead: boolean; // 是否可读
  canWrite: boolean; // 是否可写
  hidden: boolean; // 是否隐藏
}

// 磁盘驱动器信息接口
export interface DriveInfo {
  name: string; // 驱动器名称
  path: string; // 驱动器路径
  type: string; // 驱动器类型
  totalSpace: number; // 总空间
  freeSpace: number; // 可用空间
  usedSpace: number; // 已用空间
}

// 文件系统配置接口
export interface FileSystemConfig {
  chunkSize: number; // 分片大小 (MB)
  maxConcurrent: number; // 最大并发数
  retryCount: number; // 重试次数
  autoMerge: boolean; // 自动合并
  enableHttpAccess: boolean; // 启用HTTP访问
  allowedFileTypes: string[]; // 允许的文件类型
  maxFileSize: number; // 最大文件大小 (MB)
  storageQuota: number; // 存储配额 (GB)
  storageRootPath?: string; // 文件存储根路径
}

// 文件系统实时状态接口
export interface FileSystemRealtimeStatus {
  uploadingCount: number;
  mergingCount: number;
  queueLength: number;
  totalSpeed: number; // 总上传速度 (bytes/s)
  activeConnections: number;
  systemLoad: number; // 系统负载百分比
}

// 文件查询参数接口
export interface FileQueryParams {
  fileName?: string;
  fileStatus?: number;
  groupId?: number;
  groupIds?: number[];
  page?: number;
  size?: number;
}

/**
 * 分页查询文件列表
 */
export const getFileSystemPage = (params: any) => {
  return http.request<ReturnPageResult<FileSystem>>(
    "get",
    "/v1/filesystem/page",
    { params }
  );
};

/**
 * 获取文件统计信息
 */
export const getFileStatistics = () => {
  return http.request<ReturnResult<FileStatistics>>(
    "get",
    "/v1/filesystem/statistics"
  );
};

/**
 * 文件初始化上传响应接口
 */
export interface FileInitUploadResponse {
  fileId: number;
  fileName: string;
  fileSize: number;
  fileMd5: string;
  chunkTotal: number;
  chunkSize: number;
  exists?: boolean;
  message?: string;
}

/**
 * 初始化分片上传
 */
export const initChunkUpload = (data: {
  fileName: string;
  fileSize: number;
  fileMd5: string;
  chunkSize: number;
  groupId?: number;
}) => {
  return http.request<ReturnResult<FileInitUploadResponse>>(
    "post",
    "/v1/filesystem/init-chunk-upload",
    {
      params: {
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileMd5: data.fileMd5,
        chunkSize: data.chunkSize,
        groupId: data.groupId,
      },
    }
  );
};

/**
 * 上传文件分片
 */
export const uploadChunk = (data: FormData) => {
  return http.request<ReturnResult<boolean>>(
    "post",
    "/v1/filesystem/upload-chunk",
    {
      data,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

/**
 * 检查上传状态
 */
export const checkUploadStatus = (fileId: number) => {
  return http.request<
    ReturnResult<{
      fileId: number;
      fileName: string;
      fileStatus: number;
      chunkTotal: number;
      chunkUploaded: number;
      progress: number;
    }>
  >("get", `/v1/filesystem/upload-status/${fileId}`);
};

/**
 * 手动触发文件合并
 */
export const manualMergeFile = (fileId: number) => {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/v1/filesystem/manual-merge/${fileId}`
  );
};

/**
 * 删除文件
 */
export const deleteFile = (fileId: number) => {
  return http.request<ReturnResult<boolean>>(
    "delete",
    `/v1/filesystem/${fileId}`
  );
};

/**
 * 批量删除文件
 */
export const batchDeleteFiles = (fileIds: number[]) => {
  return http.request<ReturnResult<boolean>>("delete", "/v1/filesystem/batch", {
    data: fileIds, // 后端期望直接传递数组
  });
};

/**
 * 下载文件
 */
export const downloadFile = (fileId: number) => {
  return http.request<Blob>("get", `/v1/filesystem/download/${fileId}`, {
    responseType: "blob",
  });
};

/**
 * 获取文件HTTP访问URL
 */
export const getHttpAccessUrl = (fileId: number) => {
  return http.request<ReturnResult<string>>(
    "get",
    `/v1/filesystem/http-url/${fileId}`
  );
};

/**
 * 启用/禁用文件HTTP访问
 */
export const toggleHttpAccess = (fileId: number, enabled: boolean) => {
  return http.request<ReturnResult<boolean>>(
    "put",
    `/v1/filesystem/http-access/${fileId}`,
    {
      params: { enabled },
    }
  );
};

/**
 * 清理过期文件
 */
export const cleanExpiredFiles = () => {
  return http.request<ReturnResult<number>>(
    "delete",
    "/v1/filesystem/clean-expired"
  );
};

/**
 * 重试失败的合并任务
 */
export const retryMergeTask = (fileId: number) => {
  return http.request<ReturnResult<boolean>>(
    "post",
    `/v1/filesystem/retry-merge/${fileId}`
  );
};

/**
 * 获取文件系统配置
 */
export const getFileSystemConfig = () => {
  return http.request<ReturnResult<FileSystemConfig>>(
    "get",
    "/v1/filesystem/config"
  );
};

/**
 * 更新文件系统配置
 */
export const updateFileSystemConfig = (config: Partial<FileSystemConfig>) => {
  return http.request<ReturnResult<boolean>>("put", "/v1/filesystem/config", {
    data: config,
  });
};

/**
 * 获取文件系统实时状态
 */
export const getFileSystemRealtimeStatus = () => {
  return http.request<ReturnResult<FileSystemRealtimeStatus>>(
    "get",
    "/v1/filesystem/realtime-status"
  );
};

/**
 * 获取文件详情
 */
export const getFileDetail = (fileId: number) => {
  return http.request<ReturnResult<FileSystem>>(
    "get",
    `/v1/filesystem/${fileId}`
  );
};

/**
 * 检查文件是否存在
 */
export const checkFileExists = (fileMd5: string) => {
  return http.request<ReturnResult<FileSystem>>(
    "get",
    "/v1/filesystem/check-exists",
    {
      params: { fileMd5 },
    }
  );
};

/**
 * 获取系统磁盘驱动器列表
 */
export const getSystemDrives = () => {
  return http.request<ReturnResult<DriveInfo[]>>(
    "get",
    "/v1/system-info/drives"
  );
};

/**
 * 获取指定路径下的目录列表
 */
export const getDirectories = (
  path: string,
  includeHidden: boolean = false
) => {
  return http.request<ReturnResult<DirectoryInfo[]>>(
    "get",
    "/v1/system-info/directories",
    {
      params: { path, includeHidden },
    }
  );
};
