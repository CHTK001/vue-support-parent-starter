/**
 * 视频模块类型定义
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

/**
 * 通用响应类型
 */
export interface ApiResponse<T = any> {
  /** 响应状态码 */
  code: number;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: T;
  /** 请求是否成功 */
  success: boolean;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 分页响应类型
 */
export interface PageResponse<T = any> {
  /** 数据列表 */
  list: T[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  current: number;
  /** 每页大小 */
  size: number;
  /** 总页数 */
  pages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrevious: boolean;
}

/**
 * 分页请求参数
 */
export interface PageRequest {
  /** 当前页码 */
  current?: number;
  /** 每页大小 */
  size?: number;
  /** 排序字段 */
  orderBy?: string;
  /** 排序方向 */
  orderDirection?: 'asc' | 'desc';
}

/**
 * 视频信息类型
 */
export interface VideoInfo {
  /** 视频ID */
  id: string;
  /** 视频标题 */
  title: string;
  /** 视频描述 */
  description?: string;
  /** 视频封面 */
  cover?: string;
  /** 视频时长（秒） */
  duration?: number;
  /** 视频大小（字节） */
  size?: number;
  /** 视频格式 */
  format?: string;
  /** 视频分辨率 */
  resolution?: string;
  /** 视频比特率 */
  bitrate?: number;
  /** 视频帧率 */
  frameRate?: number;
  /** 视频编码 */
  codec?: string;
  /** 视频URL */
  url: string;
  /** 原始URL */
  originalUrl?: string;
  /** 视频来源 */
  source?: string;
  /** 视频分类 */
  category?: string;
  /** 视频标签 */
  tags?: string[];
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 播放次数 */
  playCount?: number;
  /** 下载次数 */
  downloadCount?: number;
  /** 收藏次数 */
  favoriteCount?: number;
  /** 评分 */
  rating?: number;
  /** 状态 */
  status?: VideoStatus;
  /** 是否收藏 */
  isFavorite?: boolean;
  /** 播放进度 */
  progress?: number;
}

/**
 * 视频状态枚举
 */
export enum VideoStatus {
  /** 正常 */
  NORMAL = 'normal',
  /** 处理中 */
  PROCESSING = 'processing',
  /** 失败 */
  FAILED = 'failed',
  /** 禁用 */
  DISABLED = 'disabled',
  /** 删除 */
  DELETED = 'deleted'
}

/**
 * 视频搜索请求参数
 */
export interface VideoSearchRequest extends PageRequest {
  /** 搜索关键词 */
  keyword?: string;
  /** 视频分类 */
  category?: string;
  /** 视频来源 */
  source?: string;
  /** 视频格式 */
  format?: string;
  /** 最小时长（秒） */
  minDuration?: number;
  /** 最大时长（秒） */
  maxDuration?: number;
  /** 最小评分 */
  minRating?: number;
  /** 最大评分 */
  maxRating?: number;
  /** 创建时间范围 - 开始 */
  createTimeStart?: string;
  /** 创建时间范围 - 结束 */
  createTimeEnd?: string;
  /** 状态 */
  status?: VideoStatus;
  /** 是否收藏 */
  isFavorite?: boolean;
}

/**
 * 视频下载信息
 */
export interface VideoDownloadInfo {
  /** 下载ID */
  id: string;
  /** 视频ID */
  videoId: string;
  /** 下载URL */
  downloadUrl: string;
  /** 文件名 */
  filename: string;
  /** 文件大小 */
  fileSize: number;
  /** 下载进度 */
  progress: number;
  /** 下载状态 */
  status: DownloadStatus;
  /** 下载速度 */
  speed?: number;
  /** 剩余时间 */
  remainingTime?: number;
  /** 创建时间 */
  createTime: string;
  /** 完成时间 */
  finishTime?: string;
  /** 错误信息 */
  errorMessage?: string;
}

/**
 * 下载状态枚举
 */
export enum DownloadStatus {
  /** 等待中 */
  WAITING = 'waiting',
  /** 下载中 */
  DOWNLOADING = 'downloading',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 已暂停 */
  PAUSED = 'paused',
  /** 失败 */
  FAILED = 'failed',
  /** 已取消 */
  CANCELLED = 'cancelled'
}

/**
 * 视频评分信息
 */
export interface VideoRating {
  /** 评分ID */
  id: string;
  /** 视频ID */
  videoId: string;
  /** 用户ID */
  userId: string;
  /** 评分值 */
  rating: number;
  /** 评论 */
  comment?: string;
  /** 创建时间 */
  createTime: string;
}

/**
 * 视频收藏信息
 */
export interface VideoFavorite {
  /** 收藏ID */
  id: string;
  /** 视频ID */
  videoId: string;
  /** 用户ID */
  userId: string;
  /** 收藏夹ID */
  folderId?: string;
  /** 创建时间 */
  createTime: string;
}

/**
 * 搜索关键词信息
 */
export interface SearchKeyword {
  /** 关键词ID */
  id: string;
  /** 关键词 */
  keyword: string;
  /** 搜索次数 */
  searchCount: number;
  /** 最后搜索时间 */
  lastSearchTime: string;
  /** 是否热门 */
  isHot: boolean;
}

/**
 * 配置信息类型
 */
export interface ConfigInfo {
  /** 配置ID */
  id: string;
  /** 配置键 */
  key: string;
  /** 配置值 */
  value: string;
  /** 配置名称 */
  name: string;
  /** 配置描述 */
  description?: string;
  /** 配置分组 */
  group: string;
  /** 配置类型 */
  type: ConfigType;
  /** 是否必需 */
  required: boolean;
  /** 默认值 */
  defaultValue?: string;
  /** 验证规则 */
  validation?: string;
  /** 排序 */
  sort: number;
  /** 状态 */
  status: ConfigStatus;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

/**
 * 配置类型枚举
 */
export enum ConfigType {
  /** 字符串 */
  STRING = 'string',
  /** 数字 */
  NUMBER = 'number',
  /** 布尔值 */
  BOOLEAN = 'boolean',
  /** JSON */
  JSON = 'json',
  /** 数组 */
  ARRAY = 'array',
  /** 文件 */
  FILE = 'file',
  /** 密码 */
  PASSWORD = 'password'
}

/**
 * 配置状态枚举
 */
export enum ConfigStatus {
  /** 启用 */
  ENABLED = 'enabled',
  /** 禁用 */
  DISABLED = 'disabled'
}

/**
 * 同步配置信息
 */
export interface SyncConfig {
  /** 同步ID */
  id: string;
  /** 同步名称 */
  name: string;
  /** 同步类型 */
  type: SyncType;
  /** 源地址 */
  sourceUrl: string;
  /** 目标地址 */
  targetUrl?: string;
  /** 同步间隔（分钟） */
  interval: number;
  /** 是否启用 */
  enabled: boolean;
  /** 最后同步时间 */
  lastSyncTime?: string;
  /** 下次同步时间 */
  nextSyncTime?: string;
  /** 同步状态 */
  status: SyncStatus;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

/**
 * 同步类型枚举
 */
export enum SyncType {
  /** 视频同步 */
  VIDEO = 'video',
  /** 配置同步 */
  CONFIG = 'config',
  /** 数据同步 */
  DATA = 'data'
}

/**
 * 同步状态枚举
 */
export enum SyncStatus {
  /** 等待中 */
  WAITING = 'waiting',
  /** 同步中 */
  SYNCING = 'syncing',
  /** 成功 */
  SUCCESS = 'success',
  /** 失败 */
  FAILED = 'failed'
}

/**
 * 解析接口信息
 */
export interface ParseInterface {
  /** 接口ID */
  id: string;
  /** 接口名称 */
  name: string;
  /** 接口URL */
  url: string;
  /** 接口类型 */
  type: ParseType;
  /** 支持的网站 */
  supportedSites: string[];
  /** 是否启用 */
  enabled: boolean;
  /** 优先级 */
  priority: number;
  /** 超时时间（秒） */
  timeout: number;
  /** 重试次数 */
  retryCount: number;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求参数 */
  params?: Record<string, any>;
  /** 响应格式 */
  responseFormat: ResponseFormat;
  /** 状态 */
  status: InterfaceStatus;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

/**
 * 解析类型枚举
 */
export enum ParseType {
  /** 官方接口 */
  OFFICIAL = 'official',
  /** 第三方接口 */
  THIRD_PARTY = 'third_party',
  /** 自定义接口 */
  CUSTOM = 'custom'
}

/**
 * 响应格式枚举
 */
export enum ResponseFormat {
  /** JSON */
  JSON = 'json',
  /** XML */
  XML = 'xml',
  /** HTML */
  HTML = 'html',
  /** 纯文本 */
  TEXT = 'text'
}

/**
 * 接口状态枚举
 */
export enum InterfaceStatus {
  /** 正常 */
  NORMAL = 'normal',
  /** 异常 */
  ERROR = 'error',
  /** 维护中 */
  MAINTENANCE = 'maintenance'
}

/**
 * 解析结果
 */
export interface ParseResult {
  /** 解析是否成功 */
  success: boolean;
  /** 视频信息 */
  videoInfo?: VideoInfo;
  /** 错误信息 */
  errorMessage?: string;
  /** 解析耗时（毫秒） */
  duration: number;
  /** 使用的接口 */
  interfaceId: string;
  /** 解析时间 */
  parseTime: string;
}

/**
 * 解析历史记录
 */
export interface ParseHistory {
  /** 历史ID */
  id: string;
  /** 原始URL */
  originalUrl: string;
  /** 解析结果 */
  result: ParseResult;
  /** 用户ID */
  userId?: string;
  /** IP地址 */
  ipAddress?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 创建时间 */
  createTime: string;
}

/**
 * 系统统计信息
 */
export interface SystemStats {
  /** 总视频数 */
  totalVideos: number;
  /** 今日新增视频数 */
  todayVideos: number;
  /** 总解析次数 */
  totalParses: number;
  /** 今日解析次数 */
  todayParses: number;
  /** 总用户数 */
  totalUsers: number;
  /** 在线用户数 */
  onlineUsers: number;
  /** 系统运行时间 */
  uptime: number;
  /** 内存使用率 */
  memoryUsage: number;
  /** CPU使用率 */
  cpuUsage: number;
  /** 磁盘使用率 */
  diskUsage: number;
}

/**
 * 文件上传信息
 */
export interface FileUploadInfo {
  /** 文件ID */
  id: string;
  /** 原始文件名 */
  originalName: string;
  /** 存储文件名 */
  fileName: string;
  /** 文件路径 */
  filePath: string;
  /** 文件大小 */
  fileSize: number;
  /** 文件类型 */
  fileType: string;
  /** 文件扩展名 */
  fileExtension: string;
  /** 上传进度 */
  progress: number;
  /** 上传状态 */
  status: UploadStatus;
  /** 上传时间 */
  uploadTime: string;
  /** 错误信息 */
  errorMessage?: string;
}

/**
 * 上传状态枚举
 */
export enum UploadStatus {
  /** 等待中 */
  WAITING = 'waiting',
  /** 上传中 */
  UPLOADING = 'uploading',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 失败 */
  FAILED = 'failed',
  /** 已取消 */
  CANCELLED = 'cancelled'
}

/**
 * WebSocket消息类型
 */
export interface WebSocketMessage {
  /** 消息类型 */
  type: MessageType;
  /** 消息数据 */
  data: any;
  /** 时间戳 */
  timestamp: number;
  /** 消息ID */
  messageId?: string;
}

/**
 * 消息类型枚举
 */
export enum MessageType {
  /** 连接 */
  CONNECT = 'connect',
  /** 断开连接 */
  DISCONNECT = 'disconnect',
  /** 心跳 */
  HEARTBEAT = 'heartbeat',
  /** 解析进度 */
  PARSE_PROGRESS = 'parse_progress',
  /** 下载进度 */
  DOWNLOAD_PROGRESS = 'download_progress',
  /** 上传进度 */
  UPLOAD_PROGRESS = 'upload_progress',
  /** 系统通知 */
  SYSTEM_NOTIFICATION = 'system_notification',
  /** 错误信息 */
  ERROR = 'error'
}

/**
 * 表单验证规则
 */
export interface ValidationRule {
  /** 是否必需 */
  required?: boolean;
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 正则表达式 */
  pattern?: string;
  /** 自定义验证函数 */
  validator?: (value: any) => boolean | string;
  /** 错误信息 */
  message?: string;
}

/**
 * 表单字段配置
 */
export interface FormFieldConfig {
  /** 字段名 */
  name: string;
  /** 字段标签 */
  label: string;
  /** 字段类型 */
  type: FieldType;
  /** 默认值 */
  defaultValue?: any;
  /** 占位符 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readonly?: boolean;
  /** 验证规则 */
  rules?: ValidationRule[];
  /** 选项列表（用于select、radio、checkbox） */
  options?: Array<{ label: string; value: any; disabled?: boolean }>;
  /** 额外属性 */
  props?: Record<string, any>;
}

/**
 * 字段类型枚举
 */
export enum FieldType {
  /** 文本输入 */
  TEXT = 'text',
  /** 密码输入 */
  PASSWORD = 'password',
  /** 数字输入 */
  NUMBER = 'number',
  /** 邮箱输入 */
  EMAIL = 'email',
  /** URL输入 */
  URL = 'url',
  /** 文本域 */
  TEXTAREA = 'textarea',
  /** 选择框 */
  SELECT = 'select',
  /** 单选框 */
  RADIO = 'radio',
  /** 复选框 */
  CHECKBOX = 'checkbox',
  /** 开关 */
  SWITCH = 'switch',
  /** 日期选择 */
  DATE = 'date',
  /** 时间选择 */
  TIME = 'time',
  /** 日期时间选择 */
  DATETIME = 'datetime',
  /** 文件上传 */
  FILE = 'file',
  /** 图片上传 */
  IMAGE = 'image',
  /** 颜色选择 */
  COLOR = 'color',
  /** 滑块 */
  SLIDER = 'slider',
  /** 评分 */
  RATE = 'rate'
}

/**
 * 导出所有类型
 */
export * from './video';
export * from './config';
export * from './parse';
export * from './search';
export * from './system';
export * from './upload';
export * from './websocket';