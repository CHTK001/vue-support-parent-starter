/**
 * 文件管理相关类型定义
 */

// 文件项接口
export interface FileItem {
  name: string;                 // 文件名
  path: string;                 // 文件路径
  size: number;                 // 文件大小（字节）
  lastModified: number;         // 最后修改时间（时间戳）
  isDirectory: boolean;         // 是否为目录
  permissions?: string;         // 文件权限
  owner?: string;               // 文件所有者
  group?: string;               // 文件组
  type?: string;                // 文件类型
  extension?: string;           // 文件扩展名
  mimeType?: string;            // MIME类型
  isHidden?: boolean;           // 是否为隐藏文件
  isSymlink?: boolean;          // 是否为符号链接
  linkTarget?: string;          // 符号链接目标
}

// 文件权限接口
export interface FilePermissions {
  canRead: boolean;             // 是否可读
  canWrite: boolean;            // 是否可写
  canUpload: boolean;           // 是否可上传
  canDownload: boolean;         // 是否可下载
  canDelete: boolean;           // 是否可删除
  canCreateFolder: boolean;     // 是否可创建文件夹
  canRename: boolean;           // 是否可重命名
  canExecute?: boolean;         // 是否可执行
  canChangePermissions?: boolean; // 是否可修改权限
}

// 文件操作类型
export type FileOperation = 
  | 'view'          // 查看
  | 'edit'          // 编辑
  | 'download'      // 下载
  | 'upload'        // 上传
  | 'delete'        // 删除
  | 'rename'        // 重命名
  | 'copy'          // 复制
  | 'move'          // 移动
  | 'compress'      // 压缩
  | 'extract'       // 解压
  | 'properties';   // 属性

// 文件类型枚举
export const FILE_TYPES = {
  UNKNOWN: 'unknown',
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  ARCHIVE: 'archive',
  EXECUTABLE: 'executable',
  DIRECTORY: 'directory',
} as const;

export type FileType = typeof FILE_TYPES[keyof typeof FILE_TYPES];

// 文件上传状态
export interface FileUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  response?: any;
}

// 文件下载状态
export interface FileDownloadStatus {
  fileName: string;
  status: 'pending' | 'downloading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

// 文件搜索参数
export interface FileSearchParams {
  keyword: string;              // 搜索关键词
  path?: string;                // 搜索路径
  fileType?: FileType;          // 文件类型
  minSize?: number;             // 最小文件大小
  maxSize?: number;             // 最大文件大小
  modifiedAfter?: Date;         // 修改时间之后
  modifiedBefore?: Date;        // 修改时间之前
  includeHidden?: boolean;      // 是否包含隐藏文件
  recursive?: boolean;          // 是否递归搜索
}

// 文件搜索结果
export interface FileSearchResult {
  files: FileItem[];
  total: number;
  hasMore: boolean;
  searchTime: number;
}

// 文件操作历史
export interface FileOperationHistory {
  id: string;
  operation: FileOperation;
  source: string;
  target?: string;
  timestamp: number;
  success: boolean;
  error?: string;
  userId?: string;
}

// 文件夹统计信息
export interface DirectoryStats {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  filesByType: Record<FileType, number>;
  largestFile?: FileItem;
  oldestFile?: FileItem;
  newestFile?: FileItem;
}

// 文件预览配置
export interface FilePreviewConfig {
  maxFileSize: number;          // 最大预览文件大小
  supportedTypes: FileType[];   // 支持预览的文件类型
  imageMaxWidth?: number;       // 图片最大宽度
  imageMaxHeight?: number;      // 图片最大高度
  textMaxLines?: number;        // 文本最大行数
}

// 文件编辑配置
export interface FileEditConfig {
  maxFileSize: number;          // 最大编辑文件大小
  supportedTypes: FileType[];   // 支持编辑的文件类型
  autoSave?: boolean;           // 是否自动保存
  autoSaveInterval?: number;    // 自动保存间隔（秒）
  syntaxHighlight?: boolean;    // 是否语法高亮
}

// 文件传输配置
export interface FileTransferConfig {
  maxFileSize: number;          // 最大文件大小
  maxConcurrentUploads: number; // 最大并发上传数
  maxConcurrentDownloads: number; // 最大并发下载数
  chunkSize?: number;           // 分块大小
  retryCount?: number;          // 重试次数
  timeout?: number;             // 超时时间
}

// 文件系统信息
export interface FileSystemInfo {
  totalSpace: number;           // 总空间
  usedSpace: number;            // 已用空间
  freeSpace: number;            // 可用空间
  fileSystem: string;           // 文件系统类型
  mountPoint: string;           // 挂载点
  readonly: boolean;            // 是否只读
}

// 文件压缩参数
export interface FileCompressParams {
  files: string[];              // 要压缩的文件路径
  archiveName: string;          // 压缩包名称
  format: 'zip' | 'tar' | 'tar.gz' | '7z'; // 压缩格式
  compressionLevel?: number;    // 压缩级别
  password?: string;            // 压缩密码
}

// 文件解压参数
export interface FileExtractParams {
  archivePath: string;          // 压缩包路径
  extractPath: string;          // 解压路径
  password?: string;            // 解压密码
  overwrite?: boolean;          // 是否覆盖
}

// 文件同步状态
export interface FileSyncStatus {
  path: string;
  status: 'synced' | 'modified' | 'conflict' | 'error';
  lastSyncTime?: number;
  error?: string;
}

// 文件监控事件
export interface FileWatchEvent {
  type: 'created' | 'modified' | 'deleted' | 'moved';
  path: string;
  oldPath?: string;             // 移动操作的原路径
  timestamp: number;
  size?: number;
  isDirectory: boolean;
}

// 文件分享配置
export interface FileShareConfig {
  path: string;
  shareId: string;
  password?: string;
  expiresAt?: number;
  downloadLimit?: number;
  allowUpload?: boolean;
  allowDelete?: boolean;
}

// 文件版本信息
export interface FileVersion {
  id: string;
  path: string;
  version: number;
  size: number;
  checksum: string;
  createdAt: number;
  createdBy: string;
  comment?: string;
}

// 文件备份配置
export interface FileBackupConfig {
  enabled: boolean;
  schedule: string;             // cron表达式
  retentionDays: number;
  includePaths: string[];
  excludePaths: string[];
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}
