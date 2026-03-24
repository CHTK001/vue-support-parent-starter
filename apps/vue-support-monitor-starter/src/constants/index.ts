/**
 * 应用常量定义
 */

// ==================== 服务器相关常量 ====================

/**
 * 服务器协议类型
 */
export const SERVER_PROTOCOLS = {
  SSH: "SSH",
  RDP: "RDP",
  VNC: "VNC",
  TELNET: "TELNET",
} as const;

export type ServerProtocol = typeof SERVER_PROTOCOLS[keyof typeof SERVER_PROTOCOLS];

/**
 * 服务器状态
 */
export const SERVER_STATUS = {
  DISABLED: 0,    // 已禁用
  ENABLED: 1,     // 已启用
  MAINTENANCE: 2, // 维护中
  ERROR: 3,       // 异常
} as const;

export type ServerStatus = typeof SERVER_STATUS[keyof typeof SERVER_STATUS];

/**
 * 连接状态
 */
export const CONNECTION_STATUS = {
  DISCONNECTED: 0, // 未连接
  CONNECTED: 1,    // 已连接
  CONNECTING: 2,   // 连接中
  ERROR: 3,        // 连接失败
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

/**
 * 在线状态
 */
export const ONLINE_STATUS = {
  OFFLINE: 0,  // 离线
  ONLINE: 1,   // 在线
  UNKNOWN: 2,  // 未知
} as const;

export type OnlineStatus = typeof ONLINE_STATUS[keyof typeof ONLINE_STATUS];

// ==================== 文件上传相关常量 ====================

/**
 * 上传模式
 */
export const UPLOAD_MODE = {
  REALTIME: "REALTIME",   // 实时上传
  SCHEDULED: "SCHEDULED", // 定时上传
} as const;

export type UploadMode = typeof UPLOAD_MODE[keyof typeof UPLOAD_MODE];

/**
 * 上传类型
 */
export const UPLOAD_TYPE = {
  SINGLE: "SINGLE",     // 单文件
  BATCH: "BATCH",       // 批量文件
  DIRECTORY: "DIRECTORY", // 目录
} as const;

export type UploadType = typeof UPLOAD_TYPE[keyof typeof UPLOAD_TYPE];

/**
 * 上传状态
 */
export const UPLOAD_STATUS = {
  PENDING: "PENDING",       // 等待中
  UPLOADING: "UPLOADING",   // 上传中
  COMPLETED: "COMPLETED",   // 已完成
  FAILED: "FAILED",         // 失败
  CANCELLED: "CANCELLED",   // 已取消
  PAUSED: "PAUSED",         // 已暂停
} as const;

export type UploadStatus = typeof UPLOAD_STATUS[keyof typeof UPLOAD_STATUS];

// ==================== 脚本相关常量 ====================

/**
 * 脚本类型
 */
export const SCRIPT_TYPE = {
  SHELL: "SHELL",
  PYTHON: "PYTHON",
  POWERSHELL: "POWERSHELL",
  BATCH: "BATCH",
  JAVASCRIPT: "JAVASCRIPT",
  PERL: "PERL",
  RUBY: "RUBY",
} as const;

export type ScriptType = typeof SCRIPT_TYPE[keyof typeof SCRIPT_TYPE];

/**
 * 脚本执行状态
 */
export const SCRIPT_EXECUTION_STATUS = {
  PENDING: "PENDING",       // 等待执行
  RUNNING: "RUNNING",       // 执行中
  COMPLETED: "COMPLETED",   // 执行完成
  FAILED: "FAILED",         // 执行失败
  CANCELLED: "CANCELLED",   // 已取消
  TIMEOUT: "TIMEOUT",       // 执行超时
} as const;

export type ScriptExecutionStatus = typeof SCRIPT_EXECUTION_STATUS[keyof typeof SCRIPT_EXECUTION_STATUS];

// ==================== 日志相关常量 ====================

/**
 * 日志级别
 */
export const LOG_LEVEL = {
  TRACE: "TRACE",
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  FATAL: "FATAL",
} as const;

export type LogLevel = typeof LOG_LEVEL[keyof typeof LOG_LEVEL];

// ==================== WebSocket消息类型 ====================

/**
 * WebSocket消息类型
 */
export const WS_MESSAGE_TYPE = {
  // 服务器相关
  SERVER_STATUS: "server_status",
  SERVER_METRICS: "server_metrics",
  SERVER_ONLINE: "server_online",
  SERVER_OFFLINE: "server_offline",
  
  // 终端相关
  TERMINAL_OUTPUT: "terminal_output",
  TERMINAL_INPUT: "terminal_input",
  TERMINAL_CONTROL: "terminal_control",
  
  // 日志相关
  LOG_MESSAGE: "log_message",
  LOG_FILTER: "log_filter",
  
  // 文件上传相关
  UPLOAD_PROGRESS: "upload_progress",
  UPLOAD_STATUS: "upload_status",
  
  // 脚本执行相关
  SCRIPT_OUTPUT: "script_output",
  SCRIPT_STATUS: "script_status",
  
  // 系统消息
  HEARTBEAT: "heartbeat",
  ERROR: "error",
} as const;

export type WSMessageType = typeof WS_MESSAGE_TYPE[keyof typeof WS_MESSAGE_TYPE];

// ==================== 颜色主题 ====================

/**
 * 状态颜色映射
 */
export const STATUS_COLORS = {
  success: "#67c23a",
  warning: "#e6a23c",
  danger: "#f56c6c",
  info: "#909399",
  primary: "#409eff",
} as const;

/**
 * 图表颜色调色板
 */
export const CHART_COLORS = [
  "#409eff", "#67c23a", "#e6a23c", "#f56c6c", "#909399",
  "#c71585", "#ff8c00", "#32cd32", "#1e90ff", "#ff69b4",
  "#8a2be2", "#00ced1", "#ffd700", "#dc143c", "#00fa9a",
] as const;

// ==================== 文件类型图标映射 ====================

/**
 * 文件类型图标
 */
export const FILE_TYPE_ICONS = {
  // 文档类型
  txt: "ri:file-text-line",
  doc: "ri:file-word-line",
  docx: "ri:file-word-line",
  pdf: "ri:file-pdf-line",
  xls: "ri:file-excel-line",
  xlsx: "ri:file-excel-line",
  ppt: "ri:file-ppt-line",
  pptx: "ri:file-ppt-line",
  
  // 图片类型
  jpg: "ri:image-line",
  jpeg: "ri:image-line",
  png: "ri:image-line",
  gif: "ri:image-line",
  bmp: "ri:image-line",
  svg: "ri:image-line",
  webp: "ri:image-line",
  
  // 视频类型
  mp4: "ri:video-line",
  avi: "ri:video-line",
  mov: "ri:video-line",
  wmv: "ri:video-line",
  flv: "ri:video-line",
  mkv: "ri:video-line",
  
  // 音频类型
  mp3: "ri:music-line",
  wav: "ri:music-line",
  flac: "ri:music-line",
  aac: "ri:music-line",
  
  // 压缩文件
  zip: "ri:file-zip-line",
  rar: "ri:file-zip-line",
  "7z": "ri:file-zip-line",
  tar: "ri:file-zip-line",
  gz: "ri:file-zip-line",
  
  // 代码文件
  js: "ri:javascript-line",
  ts: "ri:javascript-line",
  html: "ri:html5-line",
  css: "ri:css3-line",
  scss: "ri:css3-line",
  less: "ri:css3-line",
  json: "ri:file-code-line",
  xml: "ri:file-code-line",
  yaml: "ri:file-code-line",
  yml: "ri:file-code-line",
  
  // 脚本文件
  sh: "ri:terminal-line",
  bat: "ri:terminal-line",
  ps1: "ri:terminal-line",
  py: "ri:file-code-line",
  php: "ri:file-code-line",
  rb: "ri:file-code-line",
  pl: "ri:file-code-line",
  
  // 配置文件
  conf: "ri:settings-line",
  ini: "ri:settings-line",
  cfg: "ri:settings-line",
  properties: "ri:settings-line",
  
  // 日志文件
  log: "ri:file-list-line",
  
  // 默认
  default: "ri:file-line",
} as const;

// ==================== 时间格式 ====================

/**
 * 时间格式常量
 */
export const TIME_FORMATS = {
  DATE: "YYYY-MM-DD",
  TIME: "HH:mm:ss",
  DATETIME: "YYYY-MM-DD HH:mm:ss",
  DATETIME_WITH_MS: "YYYY-MM-DD HH:mm:ss.SSS",
  TIME_WITH_MS: "HH:mm:ss.SSS",
  ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ",
} as const;

// ==================== 分页配置 ====================

/**
 * 分页大小选项
 */
export const PAGE_SIZES = [10, 20, 50, 100, 200] as const;

/**
 * 默认分页配置
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 20,
  total: 0,
  layout: "total, sizes, prev, pager, next, jumper",
} as const;

// ==================== 网络配置 ====================

/**
 * 请求超时时间（毫秒）
 */
export const REQUEST_TIMEOUT = 30000;

/**
 * WebSocket重连配置
 */
export const WS_RECONNECT_CONFIG = {
  maxAttempts: 5,
  interval: 3000,
  heartbeatInterval: 30000,
} as const;

// ==================== 缓存键名 ====================

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
  // 用户设置
  USER_SETTINGS: "user_settings",
  THEME_SETTINGS: "theme_settings",
  
  // 表格设置
  TABLE_SETTINGS: "table_settings",
  
  // 终端设置
  TERMINAL_SETTINGS: "terminal_settings",
  
  // 日志查看器设置
  LOG_VIEWER_SETTINGS: "log_viewer_settings",
  
  // 监控设置
  MONITOR_SETTINGS: "monitor_settings",
} as const;

// ==================== 正则表达式 ====================

/**
 * 常用正则表达式
 */
export const REGEX_PATTERNS = {
  // IP地址
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  IPV6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  
  // 端口号
  PORT: /^([1-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/,
  
  // 邮箱
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // 手机号
  PHONE: /^1[3-9]\d{9}$/,
  
  // 域名
  DOMAIN: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
} as const;
