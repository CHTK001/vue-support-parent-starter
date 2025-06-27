/**
 * Guacamole 相关类型定义
 */

export interface GuacamoleConnectionConfig {
  /** 服务器ID */
  serverId: number;
  /** 连接协议 */
  protocol: 'rdp' | 'vnc' | 'ssh';
  /** 服务器主机 */
  host: string;
  /** 服务器端口 */
  port: number;
  /** 用户名 */
  username?: string;
  /** 密码 */
  password?: string;
}

export interface RDPConnectionConfig extends GuacamoleConnectionConfig {
  protocol: 'rdp';
  /** 分辨率 */
  resolution?: string;
  /** 颜色深度 */
  colorDepth?: number;
  /** 启用音频 */
  enableAudio?: boolean;
  /** 启用剪贴板 */
  enableClipboard?: boolean;
  /** 启用驱动器重定向 */
  enableDrive?: boolean;
  /** 启用打印机重定向 */
  enablePrinting?: boolean;
  /** 安全模式 */
  security?: 'rdp' | 'nla' | 'tls' | 'any';
  /** 忽略证书 */
  ignoreCert?: boolean;
  /** 禁用认证 */
  disableAuth?: boolean;
  /** 远程应用程序 */
  remoteApp?: string;
  /** 远程应用程序目录 */
  remoteAppDir?: string;
  /** 远程应用程序参数 */
  remoteAppArgs?: string;
}

export interface VNCConnectionConfig extends GuacamoleConnectionConfig {
  protocol: 'vnc';
  /** 启用剪贴板 */
  enableClipboard?: boolean;
  /** 启用光标 */
  enableCursor?: boolean;
  /** 只读模式 */
  readOnly?: boolean;
  /** 交换红蓝颜色 */
  swapRedBlue?: boolean;
  /** 颜色深度 */
  colorDepth?: number;
  /** 光标类型 */
  cursor?: 'local' | 'remote';
  /** 编码类型 */
  encodings?: string[];
  /** 自动重试 */
  autoRetry?: boolean;
}

export interface SSHConnectionConfig extends GuacamoleConnectionConfig {
  protocol: 'ssh';
  /** 字体名称 */
  fontName?: string;
  /** 字体大小 */
  fontSize?: number;
  /** 终端类型 */
  terminalType?: string;
  /** 启用SFTP */
  enableSftp?: boolean;
  /** SFTP根目录 */
  sftpRootDirectory?: string;
  /** 私钥 */
  privateKey?: string;
  /** 私钥密码 */
  passphrase?: string;
  /** 主机密钥 */
  hostKey?: string;
  /** 终端宽度 */
  width?: number;
  /** 终端高度 */
  height?: number;
  /** DPI */
  dpi?: number;
}

export interface GuacamoleConnectionState {
  /** 连接状态 */
  state: number;
  /** 状态描述 */
  stateText: string;
  /** 是否已连接 */
  connected: boolean;
  /** 是否正在连接 */
  connecting: boolean;
  /** 连接开始时间 */
  startTime?: number;
  /** 连接持续时间 */
  duration: number;
  /** 错误信息 */
  error?: string;
}

export interface GuacamoleStatistics {
  /** 接收字节数 */
  bytesReceived: number;
  /** 发送字节数 */
  bytesSent: number;
  /** 延迟（毫秒） */
  latency: number;
  /** 帧率 */
  frameRate: number;
  /** 最后活动时间 */
  lastActivity: number;
}

export interface GuacamoleDisplayInfo {
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 缩放比例 */
  scale: number;
  /** 是否全屏 */
  fullscreen: boolean;
}

export interface GuacamoleClipboardData {
  /** MIME类型 */
  mimetype: string;
  /** 数据内容 */
  data: string;
}

export interface GuacamoleFileInfo {
  /** 文件名 */
  filename: string;
  /** MIME类型 */
  mimetype: string;
  /** 文件大小 */
  size: number;
  /** 最后修改时间 */
  lastModified: number;
}

export interface GuacamoleKeyEvent {
  /** 按键状态 (1=按下, 0=释放) */
  pressed: number;
  /** 按键符号 */
  keysym: number;
}

export interface GuacamoleMouseEvent {
  /** X坐标 */
  x: number;
  /** Y坐标 */
  y: number;
  /** 按钮状态 */
  buttonMask: number;
}

export interface GuacamoleTouchEvent {
  /** 触摸ID */
  id: number;
  /** X坐标 */
  x: number;
  /** Y坐标 */
  y: number;
  /** 压力 */
  pressure: number;
}

export interface GuacamoleAudioFormat {
  /** 音频格式 */
  mimetype: string;
  /** 采样率 */
  rate: number;
  /** 声道数 */
  channels: number;
  /** 位深度 */
  bps: number;
}

export interface GuacamoleVideoFormat {
  /** 视频格式 */
  mimetype: string;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 帧率 */
  framerate: number;
}

export interface GuacamoleStreamInfo {
  /** 流ID */
  index: number;
  /** MIME类型 */
  mimetype: string;
  /** 流名称 */
  name?: string;
}

export interface GuacamoleError {
  /** 错误代码 */
  code: number;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: any;
}

// 连接状态枚举
export enum GuacamoleConnectionStates {
  IDLE = 0,
  CONNECTING = 1,
  WAITING = 2,
  CONNECTED = 3,
  DISCONNECTING = 4,
  DISCONNECTED = 5
}

// 错误代码枚举
export enum GuacamoleErrorCodes {
  SUCCESS = 0x0000,
  OUT_OF_MEMORY = 0x0100,
  OUT_OF_RESOURCES = 0x0200,
  UNSUPPORTED = 0x0300,
  SERVER_ERROR = 0x0400,
  CLIENT_ERROR = 0x0500,
  PROTOCOL_ERROR = 0x0600,
  CLIENT_OVERRUN = 0x0700,
  UPSTREAM_TIMEOUT = 0x0800,
  UPSTREAM_ERROR = 0x0900,
  RESOURCE_NOT_FOUND = 0x0A00,
  RESOURCE_CONFLICT = 0x0B00,
  RESOURCE_CLOSED = 0x0C00,
  UPSTREAM_NOT_FOUND = 0x0D00,
  UPSTREAM_UNAVAILABLE = 0x0E00,
  SESSION_CONFLICT = 0x0F00,
  SESSION_TIMEOUT = 0x1000,
  SESSION_CLOSED = 0x1100
}

// 按键符号常量
export enum GuacamoleKeysyms {
  BACKSPACE = 0xFF08,
  TAB = 0xFF09,
  RETURN = 0xFF0D,
  ESCAPE = 0xFF1B,
  DELETE = 0xFFFF,
  HOME = 0xFF50,
  LEFT = 0xFF51,
  UP = 0xFF52,
  RIGHT = 0xFF53,
  DOWN = 0xFF54,
  PAGE_UP = 0xFF55,
  PAGE_DOWN = 0xFF56,
  END = 0xFF57,
  INSERT = 0xFF63,
  F1 = 0xFFBE,
  F2 = 0xFFBF,
  F3 = 0xFFC0,
  F4 = 0xFFC1,
  F5 = 0xFFC2,
  F6 = 0xFFC3,
  F7 = 0xFFC4,
  F8 = 0xFFC5,
  F9 = 0xFFC6,
  F10 = 0xFFC7,
  F11 = 0xFFC8,
  F12 = 0xFFC9,
  SHIFT_LEFT = 0xFFE1,
  SHIFT_RIGHT = 0xFFE2,
  CTRL_LEFT = 0xFFE3,
  CTRL_RIGHT = 0xFFE4,
  ALT_LEFT = 0xFFE9,
  ALT_RIGHT = 0xFFEA,
  META_LEFT = 0xFFEB,
  META_RIGHT = 0xFFEC,
  SUPER_LEFT = 0xFFEB,
  SUPER_RIGHT = 0xFFEC
}

// 鼠标按钮常量
export enum GuacamoleMouseButtons {
  NONE = 0x00,
  LEFT = 0x01,
  MIDDLE = 0x02,
  RIGHT = 0x04,
  SCROLL_UP = 0x08,
  SCROLL_DOWN = 0x10
}

export type GuacamoleConnectionConfigType = 
  | RDPConnectionConfig 
  | VNCConnectionConfig 
  | SSHConnectionConfig;
