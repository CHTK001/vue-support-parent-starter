import { http, type ReturnResult } from "@repo/utils";

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

export interface UploadQueueStatus {
  fileId: number;
  fileName: string;
  progress: number;
  status: "uploading" | "merging" | "completed" | "failed";
  message?: string;
}

export interface DirectoryInfo {
  name: string;
  path: string;
  size?: number;
  lastModified?: number;
  canRead: boolean;
  canWrite: boolean;
  hidden: boolean;
}

export interface DriveInfo {
  name: string;
  path: string;
  type: string;
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
}

export interface FileSystemSetting {
  fileSystemSettingId?: number;
  fileSystemSettingName?: string;
  fileSystemSettingChunkUploadEnabled?: boolean;
  fileSystemSettingChunkSizeMb?: number;
  fileSystemSettingMergeTaskLimit?: number;
  fileSystemSettingManualMergeEnabled?: boolean;
  fileSystemSettingDownloadEnabled?: boolean;
  fileSystemSettingPreviewEnabled?: boolean;
  fileSystemSettingWebjarEnabled?: boolean;
  fileSystemSettingRemoteFileEnabled?: boolean;
  fileSystemSettingViewEnabled?: boolean;
  fileSystemSettingHttpAccessEnabled?: boolean;
  fileSystemSettingHttpAccessDomain?: string;
  fileSystemSettingAllowedFileTypes?: string;
  fileSystemSettingMaxFileSizeMb?: number;
  fileSystemSettingStorageRootPath?: string;
  fileSystemSettingTempStoragePath?: string;
  fileSystemSettingFileRetentionDays?: number;
  fileSystemSettingEnabled?: boolean;
  fileSystemSettingRemark?: string;
}

export type FileSystemConfig = FileSystemSetting;

export interface FileSystemRealtimeStatus {
  uploadingCount: number;
  mergingCount: number;
  queueLength: number;
  totalSpeed: number;
  activeConnections: number;
  systemLoad: number;
}

export interface FileQueryParams {
  fileName?: string;
  fileStatus?: number;
  groupId?: number;
  groupIds?: number[];
  page?: number;
  size?: number;
}

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

export const getFileSystemPage = (params: any) => {
  return http.request<ReturnPageResult<FileSystem>>("get", "/v1/filesystem/page", {
    params,
  });
};

export const getFileStatistics = () => {
  return http.request<ReturnResult<FileStatistics>>("get", "/v1/filesystem/statistics");
};

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
    },
  );
};

export const uploadChunk = (data: FormData) => {
  return http.request<ReturnResult<boolean>>("post", "/v1/filesystem/upload-chunk", {
    data,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

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

export const manualMergeFile = (fileId: number) => {
  return http.request<ReturnResult<boolean>>("post", `/v1/filesystem/manual-merge/${fileId}`);
};

export const deleteFile = (fileId: number) => {
  return http.request<ReturnResult<boolean>>("delete", `/v1/filesystem/${fileId}`);
};

export const batchDeleteFiles = (fileIds: number[]) => {
  return http.request<ReturnResult<boolean>>("delete", "/v1/filesystem/batch", {
    data: fileIds,
  });
};

export const downloadFile = (fileId: number) => {
  return http.request<Blob>("get", `/v1/filesystem/download/${fileId}`, {
    responseType: "blob",
  });
};

export const distributeFileSystemFile = (data: {
  fileId: number;
  targetType: "SERVER" | "NODE";
  targetIds: Array<string | number>;
  targetDir: string;
  overwrite?: boolean;
}) => {
  return http.request<ReturnResult<any>>("post", "/v1/filesystem/distribute", {
    data,
  });
};

export const getHttpAccessUrl = (fileId: number) => {
  return http.request<ReturnResult<string>>("get", `/v1/filesystem/http-url/${fileId}`);
};

export const toggleHttpAccess = (fileId: number, enabled: boolean) => {
  return http.request<ReturnResult<boolean>>("put", `/v1/filesystem/http-access/${fileId}`, {
    params: { enabled },
  });
};

export const cleanExpiredFiles = () => {
  return http.request<ReturnResult<number>>("delete", "/v1/filesystem/clean-expired");
};

export const retryMergeTask = (fileId: number) => {
  return http.request<ReturnResult<boolean>>("post", `/v1/filesystem/retry-merge/${fileId}`);
};

export const getFileSystemConfig = () => {
  return http.request<ReturnResult<FileSystemSetting>>("get", "/v1/filesystem/config");
};

export const updateFileSystemConfig = (config: Partial<FileSystemSetting>) => {
  return http.request<ReturnResult<boolean>>("put", "/v1/filesystem/config", {
    data: config,
  });
};

export const getFileSystemRealtimeStatus = () => {
  return http.request<ReturnResult<FileSystemRealtimeStatus>>("get", "/v1/filesystem/realtime-status");
};

export const getFileDetail = (fileId: number) => {
  return http.request<ReturnResult<FileSystem>>("get", `/v1/filesystem/${fileId}`);
};

export const checkFileExists = (fileMd5: string) => {
  return http.request<ReturnResult<FileSystem>>("get", "/v1/filesystem/check-exists", {
    params: { fileMd5 },
  });
};

export const getSystemDrives = () => {
  return http.request<ReturnResult<DriveInfo[]>>("get", "/v1/system-info/drives");
};

export const getDirectories = (path: string, includeHidden: boolean = false) => {
  return http.request<ReturnResult<DirectoryInfo[]>>("get", "/v1/system-info/directories", {
    params: { path, includeHidden },
  });
};
