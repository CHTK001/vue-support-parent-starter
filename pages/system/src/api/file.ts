import { http, type ReturnResult } from "@repo/utils";

/**
 * 文件上传请求接口
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export interface SysFileUploadRequest {
  /** 文件bucket */
  fileBucket: string;
  /** 文件名 */
  fileName?: string;
  /** OSS类型; 本地(FILESYSTEM: 默认), 七牛(QINIU) */
  ossType?: string;
}

/**
 * 文件系统配置接口
 */
export interface SysFileSystemSetting {
  sysFileSystemSettingId?: number;
  sysFileSystemSettingName?: string;
  sysFileSystemSettingChunkEnabled?: boolean;
  sysFileSystemSettingChunkSizeMb?: number;
  sysFileSystemSettingAutoMergeEnabled?: boolean;
  sysFileSystemSettingMergeTaskLimit?: number;
  sysFileSystemSettingManualMergeEnabled?: boolean;
  sysFileSystemSettingHttpServerEnabled?: boolean;
  sysFileSystemSettingHttpServerPort?: number;
  sysFileSystemSettingHttpServerHost?: string;
  sysFileSystemSettingHttpServerContext?: string;
  sysFileSystemSettingDownloadEnabled?: boolean;
  sysFileSystemSettingPreviewEnabled?: boolean;
  sysFileSystemSettingHttpAccessDomain?: string;
  sysFileSystemSettingAllowedTypes?: string;
  sysFileSystemSettingMaxFileSizeMb?: number;
  sysFileSystemSettingStorageRootPath?: string;
  sysFileSystemSettingTempPath?: string;
  sysFileSystemSettingRetentionDays?: number;
  sysFileSystemSettingEnabled?: boolean;
  sysFileSystemSettingDefaultStorageType?: string;
  sysFileSystemSettingRemark?: string;
}

/**
 * 文件系统分组接口
 */
export interface SysFileSystemGroup {
  sysFileSystemGroupId?: number;
  sysFileSystemGroupName?: string;
  sysFileSystemGroupParentId?: number;
  sysFileSystemGroupPath?: string;
  sysFileSystemGroupFullPath?: string;
  sysFileSystemGroupLevel?: number;
  sysFileSystemGroupTreePath?: string;
  sysFileSystemGroupDescription?: string;
  sysFileSystemGroupIsDefault?: boolean;
  sysFileSystemGroupSort?: number;
  sysFileSystemGroupStatus?: number;
  sysFileSystemGroupIcon?: string;
  sysFileSystemGroupColor?: string;
  children?: SysFileSystemGroup[];
  fileCount?: number;
}

/**
 * 文件系统文件接口
 */
export interface SysFileSystem {
  sysFileSystemId?: number;
  sysFileSystemTid?: string;
  sysFileSystemBucket?: string;
  sysFileSystemName?: string;
  sysFileSystemOriginalName?: string;
  sysFileSystemType?: string;
  sysFileSystemExtension?: string;
  sysFileSystemPath?: string;
  sysFileSystemSize?: number;
  sysFileSystemMd5?: string;
  sysFileSystemChunkTotal?: number;
  sysFileSystemChunkUploaded?: number;
  sysFileSystemChunkSize?: number;
  sysFileSystemStatus?: number;
  sysFileSystemHttpEnabled?: boolean;
  sysFileSystemHttpUrl?: string;
  sysFileSystemGroupId?: number;
  sysFileSystemSummary?: string;
  createTime?: string;
}

/**
 * 文件统计接口
 */
export interface FileStats {
  totalCount: number;
  pendingMergeCount: number;
  errorCount: number;
  completedCount: number;
  uploadingCount: number;
}

/**
 * 分片任务创建请求接口
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export interface SysFileUploadTaskRequest {
  /** 文件名称 */
  fileName?: string;
  /** 文件md5 */
  fileMd5: string;
  /** 文件类型 */
  fileType: string;
  /** 任务摘要 */
  fileSummary?: string;
  /** 存储桶 */
  fileBucket: string;
  /** OSS类型; 本地(FILESYSTEM: 默认), 七牛(QINIU) */
  ssoType?: string;
  /** 文件大小 */
  fileSize: number;
}

/**
 * 分片任务创建响应接口
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export interface SysFileUploadTaskResponse {
  /** 任务ID */
  taskId: string;
  /** 任务数量 */
  setSysTaskSsoNumber?: number;
  /** 文件大小 */
  sysTaskSsoChuck?: number;
  /** 文件名称/url */
  url?: string;
}

/**
 * 分片上传请求接口
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export interface SysFileUploadTaskPartRequest {
  /** 任务ID */
  taskId: string;
  /** 分片序号 */
  partNumber: number;
}

/**
 * 分片上传响应接口
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export interface SysFileUploadTaskPartResponse {
  /** 是否成功 */
  success: boolean;
  /** 分片序号 */
  partNumber?: number;
  /** 已上传大小 */
  uploadedSize?: number;
}

/**
 * 上传结果接口
 * @author CH
 * @since 2024/12/4
 * @version 1.0.0
 */
export interface PutObjectResult {
  /** 文件URL */
  url?: string;
  /** 文件名 */
  name?: string;
  /** 文件大小 */
  size?: number;
  /** 上传时间 */
  uploadTime?: string;
}

/**
 * 上传文件
 * @param request 上传请求参数
 * @param file 文件
 * @returns 上传结果
 */
export const uploadFile = (
  request: SysFileUploadRequest,
  file: File
): Promise<ReturnResult<PutObjectResult>> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileBucket", request.fileBucket);
  if (request.fileName) {
    formData.append("fileName", request.fileName);
  }
  if (request.ossType) {
    formData.append("ossType", request.ossType);
  }

  return http.request("put", "/v2/file/upload", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * 创建分片上传任务
 * @param request 任务创建请求
 * @returns 任务创建响应
 */
export const createUploadTask = (
  request: SysFileUploadTaskRequest
): Promise<ReturnResult<SysFileUploadTaskResponse>> => {
  return http.request("post", "/v2/file/task/create", {
    data: request,
  });
};

/**
 * 上传分片
 * @param request 分片上传请求
 * @param file 分片文件
 * @returns 分片上传响应
 */
export const uploadTaskPart = (
  request: SysFileUploadTaskPartRequest,
  file: Blob
): Promise<ReturnResult<SysFileUploadTaskPartResponse>> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("taskId", request.taskId);
  formData.append("partNumber", String(request.partNumber));

  return http.request("post", "/v2/file/task/upload", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// ==================== 配置管理接口 ====================

/**
 * 获取文件系统配置
 * @returns 当前启用的配置
 */
export const getFileSystemSetting = (): Promise<
  ReturnResult<SysFileSystemSetting>
> => {
  return http.request("get", "/v2/file/setting");
};

/**
 * 更新文件系统配置
 * @param setting 配置信息
 * @returns 更新结果
 */
export const updateFileSystemSetting = (
  setting: SysFileSystemSetting
): Promise<ReturnResult<boolean>> => {
  return http.request("put", "/v2/file/setting", {
    data: setting,
  });
};

// ==================== 服务器控制接口 ====================

/**
 * 启动文件服务器
 * @returns 操作结果
 */
export const startFileServer = (): Promise<ReturnResult<boolean>> => {
  return http.request("post", "/v2/file/server/start");
};

/**
 * 停止文件服务器
 * @returns 操作结果
 */
export const stopFileServer = (): Promise<ReturnResult<boolean>> => {
  return http.request("post", "/v2/file/server/stop");
};

/**
 * 获取文件服务器状态
 * @returns 服务器状态（running/stopped）
 */
export const getFileServerStatus = (): Promise<ReturnResult<string>> => {
  return http.request("get", "/v2/file/server/status");
};

/**
 * 检查端口是否可用
 * @param port 端口号
 * @returns 是否可用
 */
export const checkPortAvailable = (
  port: number
): Promise<ReturnResult<boolean>> => {
  return http.request("get", "/v2/file/server/check-port", {
    params: { port },
  });
};

// ==================== 统计接口 ====================

/**
 * 获取文件统计信息
 * @returns 统计数据
 */
export const getFileStats = (): Promise<ReturnResult<FileStats>> => {
  return http.request("get", "/v2/file/stats");
};

// ==================== 文件列表接口 ====================

/**
 * 文件列表查询参数
 */
export interface FileListParams {
  page?: number;
  size?: number;
  groupId?: number;
  status?: number;
  keyword?: string;
}

/**
 * 分页结果
 */
export interface PageData<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/**
 * 分页查询文件列表
 * @param params 查询参数
 * @returns 文件列表
 */
export const getFileList = (
  params: FileListParams
): Promise<ReturnResult<PageData<SysFileSystem>>> => {
  return http.request("get", "/v2/file/list", { params });
};

/**
 * 手动合并文件
 * @param fileId 文件ID
 * @returns 操作结果
 */
export const mergeFile = (fileId: number): Promise<ReturnResult<boolean>> => {
  return http.request("post", `/v2/file/merge/${fileId}`);
};

/**
 * 删除文件
 * @param fileId 文件ID
 * @returns 操作结果
 */
export const deleteFile = (fileId: number): Promise<ReturnResult<boolean>> => {
  return http.request("delete", `/v2/file/${fileId}`);
};

// ==================== 分组管理接口 ====================

/**
 * 获取分组树
 * @returns 分组树列表
 */
export const getGroupTree = (): Promise<ReturnResult<SysFileSystemGroup[]>> => {
  return http.request("get", "/v2/file/group/tree");
};

/**
 * 获取分组列表
 * @returns 分组列表
 */
export const getGroupList = (): Promise<ReturnResult<SysFileSystemGroup[]>> => {
  return http.request("get", "/v2/file/group/list");
};

/**
 * 新增分组
 * @param group 分组信息
 * @returns 操作结果
 */
export const addGroup = (
  group: SysFileSystemGroup
): Promise<ReturnResult<SysFileSystemGroup>> => {
  return http.request("post", "/v2/file/group", { data: group });
};

/**
 * 更新分组
 * @param group 分组信息
 * @returns 操作结果
 */
export const updateGroup = (
  group: SysFileSystemGroup
): Promise<ReturnResult<boolean>> => {
  return http.request("put", "/v2/file/group", { data: group });
};

/**
 * 删除分组
 * @param groupId 分组ID
 * @returns 操作结果
 */
export const deleteGroup = (
  groupId: number
): Promise<ReturnResult<boolean>> => {
  return http.request("delete", `/v2/file/group/${groupId}`);
};

/**
 * 初始化默认分组
 * @returns 操作结果
 */
export const initDefaultGroups = (): Promise<ReturnResult<boolean>> => {
  return http.request("post", "/v2/file/group/init");
};
