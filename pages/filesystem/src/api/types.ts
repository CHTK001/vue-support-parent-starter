/**
 * 文件系统管理模块类型定义（@pages/filesystem）
 *
 * 覆盖后端 SysFileSystemController（/v2/file）相关实体与 DTO：
 *   SysFileSystem / SysFileSystemGroup / SysFileSystemSetting / 分片上传任务 DTO
 */

/** 统一返回结构（后端 ReturnResult） */
export interface ApiResult<T = unknown> {
  code?: string | number;
  msg?: string;
  data?: T;
}

/** 公共审计字段 */
export interface Auditable {
  createName?: string;
  createBy?: number;
  createTime?: string;
  updateName?: string;
  updateBy?: number;
  updateTime?: string;
}

/* ================== 文件 ================== */

/** 文件状态常量 */
export const FileStatus = {
  /** 待上传 */
  PENDING: 0,
  /** 上传中 */
  UPLOADING: 1,
  /** 待合并 */
  PENDING_MERGE: 2,
  /** 合并中 */
  MERGING: 3,
  /** 已完成 */
  COMPLETED: 4,
  /** 异常 */
  ERROR: -1,
} as const;

/** 文件 */
export interface SysFileSystem extends Auditable {
  sysFileSystemId?: number;
  /** 任务唯一标识（ULID） */
  sysFileSystemTid?: string;
  /** 存储桶/存储位置 */
  sysFileSystemBucket?: string;
  /** 文件名称 */
  sysFileSystemName?: string;
  /** 文件原始名称 */
  sysFileSystemOriginalName?: string;
  /** 存储类型：local/oss/cos等 */
  sysFileSystemType?: string;
  /** 文件扩展名 */
  sysFileSystemExtension?: string;
  /** 文件路径 */
  sysFileSystemPath?: string;
  /** 文件大小(字节) */
  sysFileSystemSize?: number;
  /** 文件MD5值 */
  sysFileSystemMd5?: string;
  /** 分片数量 */
  sysFileSystemChunkTotal?: number;
  /** 已上传分片数 */
  sysFileSystemChunkUploaded?: number;
  /** 分片大小(字节) */
  sysFileSystemChunkSize?: number;
  /** 状态: 0待上传,1上传中,2待合并,3合并中,4已完成,-1异常 */
  sysFileSystemStatus?: number;
  /** 是否启用HTTP访问 */
  sysFileSystemHttpEnabled?: boolean;
  /** HTTP访问URL */
  sysFileSystemHttpUrl?: string;
  /** 绑定的服务ID */
  sysFileSystemServiceId?: number;
  /** 文件分组ID */
  sysFileSystemGroupId?: number;
  /** 上传开始时间 */
  sysFileSystemUploadStartTime?: string;
  /** 上传完成时间 */
  sysFileSystemUploadCompleteTime?: string;
  /** 本地临时文件路径 */
  sysFileSystemLocalPath?: string;
  /** 描述/摘要 */
  sysFileSystemSummary?: string;
  /** 文件分组名称（非DB） */
  sysFileSystemGroupName?: string;
}

/** 文件分页查询参数 */
export interface FileListQuery {
  page?: number;
  size?: number;
  groupId?: number;
  status?: number;
  keyword?: string;
}

/* ================== 分组 ================== */

/** 分组状态常量 */
export const GroupStatus = {
  DISABLED: 0,
  ENABLED: 1,
} as const;

/** 文件分组 */
export interface SysFileSystemGroup extends Auditable {
  sysFileSystemGroupId?: number;
  /** 分组名称 */
  sysFileSystemGroupName?: string;
  /** 父分组ID，顶级为0 */
  sysFileSystemGroupParentId?: number;
  /** 分组路径 */
  sysFileSystemGroupPath?: string;
  /** 分组完整路径 */
  sysFileSystemGroupFullPath?: string;
  /** 分组层级，从1开始 */
  sysFileSystemGroupLevel?: number;
  /** 分组树路径（ID链路，如1/2/3） */
  sysFileSystemGroupTreePath?: string;
  /** 分组描述 */
  sysFileSystemGroupDescription?: string;
  /** 是否默认分组 */
  sysFileSystemGroupIsDefault?: boolean;
  /** 分组排序 */
  sysFileSystemGroupSort?: number;
  /** 分组状态: 0禁用,1启用 */
  sysFileSystemGroupStatus?: number;
  /** 分组图标 */
  sysFileSystemGroupIcon?: string;
  /** 分组颜色 */
  sysFileSystemGroupColor?: string;
  /** 子分组列表（非DB） */
  children?: SysFileSystemGroup[];
  /** 文件数量（非DB） */
  fileCount?: number;
}

/* ================== 存储配置 ================== */

/** 文件系统配置 */
export interface SysFileSystemSetting extends Auditable {
  sysFileSystemSettingId?: number;
  /** 配置名称 */
  sysFileSystemSettingName?: string;
  /** 是否启用分片上传 */
  sysFileSystemSettingChunkEnabled?: boolean;
  /** 分片大小(MB) */
  sysFileSystemSettingChunkSizeMb?: number;
  /** 是否开启自动合并 */
  sysFileSystemSettingAutoMergeEnabled?: boolean;
  /** 合并任务数量限制 */
  sysFileSystemSettingMergeTaskLimit?: number;
  /** 是否支持手动合并 */
  sysFileSystemSettingManualMergeEnabled?: boolean;
  /** 是否开启HTTP服务 */
  sysFileSystemSettingHttpServerEnabled?: boolean;
  /** HTTP服务端口 */
  sysFileSystemSettingHttpServerPort?: number;
  /** HTTP服务主机 */
  sysFileSystemSettingHttpServerHost?: string;
  /** HTTP服务上下文路径 */
  sysFileSystemSettingHttpServerContext?: string;
  /** 是否启用文件下载 */
  sysFileSystemSettingDownloadEnabled?: boolean;
  /** 是否启用文件预览 */
  sysFileSystemSettingPreviewEnabled?: boolean;
  /** 是否启用Webjar支持 */
  sysFileSystemSettingWebjarEnabled?: boolean;
  /** 是否启用远程文件支持 */
  sysFileSystemSettingRemoteFileEnabled?: boolean;
  /** 是否启用视图预览 */
  sysFileSystemSettingViewEnabled?: boolean;
  /** HTTP访问域名 */
  sysFileSystemSettingHttpAccessDomain?: string;
  /** 文件类型白名单(逗号分隔) */
  sysFileSystemSettingAllowedTypes?: string;
  /** 单个文件最大大小(MB) */
  sysFileSystemSettingMaxFileSizeMb?: number;
  /** 文件存储根路径 */
  sysFileSystemSettingStorageRootPath?: string;
  /** 临时文件存储路径 */
  sysFileSystemSettingTempPath?: string;
  /** 文件保留天数(0永久) */
  sysFileSystemSettingRetentionDays?: number;
  /** 是否启用 */
  sysFileSystemSettingEnabled?: boolean;
  /** 默认存储类型: local/oss/cos/s3 */
  sysFileSystemSettingDefaultStorageType?: string;
  /** 备注 */
  sysFileSystemSettingRemark?: string;
}

/* ================== 上传 DTO ================== */

/** 秒传检查响应 */
export interface InstantUploadResponse {
  /** 是否秒传成功 */
  instantUpload?: boolean;
  /** 已存在文件ID */
  existingFileId?: number;
  /** 已存在文件URL */
  existingFileUrl?: string;
  /** 已存在文件HTTP URL */
  existingFileHttpUrl?: string;
  /** 已存在文件名 */
  existingFileName?: string;
}

/** 上传任务信息（断点续传） */
export interface FileTaskInfo {
  taskId?: string;
  fileName?: string;
  fileMd5?: string;
  fileSize?: number;
  chunkSize?: number;
  totalChunks?: number;
  uploadedChunks?: number;
  /** 已上传分片序号 */
  uploadedParts?: number[];
  /** 任务状态 */
  status?: number;
  url?: string;
  exists?: boolean;
}

/** 上传结果（PutObjectResult 精简） */
export interface UploadResult {
  objectName?: string;
  url?: string;
  success?: boolean;
  [key: string]: unknown;
}

/** 统计信息 */
export interface FileSystemStats {
  totalCount?: number;
  pendingMergeCount?: number;
  errorCount?: number;
  completedCount?: number;
  uploadingCount?: number;
  [key: string]: unknown;
}