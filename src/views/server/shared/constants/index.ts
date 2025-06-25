/**
 * 共享常量定义
 */

// 组件类型常量
export const COMPONENT_TYPES = {
  CARD: 'card',
  GAUGE: 'gauge',
  LINE_CHART: 'line',
  BAR_CHART: 'bar',
  PIE_CHART: 'pie',
  TABLE: 'table',
  TEXT: 'text',
  PROGRESS: 'progress',
  METRIC: 'metric',
} as const;

// 数据源类型常量
export const DATA_SOURCE_TYPES = {
  SQL: 'sql',
  PROMETHEUS: 'prometheus',
  API: 'api',
  STATIC: 'static',
  REALTIME: 'realtime',
} as const;

// 表达式类型常量
export const EXPRESSION_TYPES = {
  SQL: 'sql',
  PROMETHEUS: 'prometheus',
  JAVASCRIPT: 'javascript',
  TEMPLATE: 'template',
} as const;

// 协议类型常量
export const PROTOCOL_TYPES = {
  SSH: "SSH",
  RDP: "RDP",
  VNC: "VNC",
} as const;

// 服务器状态常量
export const SERVER_STATUS = {
  DISABLED: 0,    // 已禁用
  ENABLED: 1,     // 已启用
  MAINTENANCE: 2, // 维护中
  ERROR: 3,       // 异常
} as const;

// 连接状态常量
export const CONNECTION_STATUS = {
  DISCONNECTED: 0, // 未连接
  CONNECTED: 1,    // 已连接
  CONNECTING: 2,   // 连接中
  ERROR: 3,        // 连接失败
} as const;

// 在线状态常量
export const ONLINE_STATUS = {
  OFFLINE: 0,  // 离线
  ONLINE: 1,   // 在线
  UNKNOWN: 2,  // 未知
} as const;

// 文件类型常量
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

// 布局操作类型常量
export const LAYOUT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MOVE: 'move',
  RESIZE: 'resize',
  ADD_COMPONENT: 'add_component',
  REMOVE_COMPONENT: 'remove_component',
  IMPORT: 'import',
  EXPORT: 'export',
  RESET: 'reset',
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  // 默认布局配置
  LAYOUT: {
    colNum: 24,
    rowHeight: 30,
    margin: [10, 10] as [number, number],
    containerPadding: [10, 10] as [number, number],
    isDraggable: true,
    isResizable: true,
    isMirrored: false,
    verticalCompact: true,
    useCSSTransforms: true,
    responsive: false,
  },
  
  // 默认组件配置
  COMPONENT: {
    refreshInterval: 30,
    enabled: true,
    sortOrder: 0,
    position: { x: 0, y: 0, w: 6, h: 6 },
  },
  
  // 默认文件管理配置
  FILE_MANAGER: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxConcurrentUploads: 3,
    maxConcurrentDownloads: 3,
    chunkSize: 1024 * 1024, // 1MB
    retryCount: 3,
    timeout: 30000, // 30秒
  },
} as const;

// 图标映射
export const ICON_MAP = {
  // 组件类型图标
  COMPONENT_TYPES: {
    card: 'ri:file-text-line',
    gauge: 'ri:dashboard-line',
    line: 'ri:line-chart-line',
    bar: 'ri:bar-chart-line',
    pie: 'ri:pie-chart-line',
    table: 'ri:table-line',
    text: 'ri:text',
    progress: 'ri:progress-line',
    metric: 'ri:bar-chart-box-line',
  },
  
  // 文件类型图标
  FILE_TYPES: {
    // 图片
    jpg: 'ri:image-line',
    jpeg: 'ri:image-line',
    png: 'ri:image-line',
    gif: 'ri:image-line',
    svg: 'ri:image-line',
    webp: 'ri:image-line',
    
    // 文档
    txt: 'ri:file-text-line',
    md: 'ri:markdown-line',
    pdf: 'ri:file-pdf-line',
    doc: 'ri:file-word-line',
    docx: 'ri:file-word-line',
    xls: 'ri:file-excel-line',
    xlsx: 'ri:file-excel-line',
    ppt: 'ri:file-ppt-line',
    pptx: 'ri:file-ppt-line',
    
    // 代码
    js: 'ri:file-code-line',
    ts: 'ri:file-code-line',
    vue: 'ri:vuejs-line',
    html: 'ri:html5-line',
    css: 'ri:css3-line',
    json: 'ri:file-code-line',
    xml: 'ri:file-code-line',
    
    // 压缩包
    zip: 'ri:file-zip-line',
    rar: 'ri:file-zip-line',
    '7z': 'ri:file-zip-line',
    tar: 'ri:file-zip-line',
    gz: 'ri:file-zip-line',
    
    // 其他
    log: 'ri:file-list-line',
    conf: 'ri:settings-line',
    config: 'ri:settings-line',
    folder: 'ri:folder-line',
    unknown: 'ri:file-line',
  },
  
  // 协议类型图标
  PROTOCOL_TYPES: {
    SSH: 'ri:terminal-line',
    RDP: 'ri:computer-line',
    VNC: 'ri:remote-control-line',
  },
} as const;

// 颜色主题
export const COLOR_THEMES = {
  PRIMARY: '#409eff',
  SUCCESS: '#67c23a',
  WARNING: '#e6a23c',
  DANGER: '#f56c6c',
  INFO: '#909399',
  
  // 图表颜色
  CHART_COLORS: [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#8085e9',
    '#f6bd16', '#e86452', '#6ca2ea', '#ba53a9', '#78d3f8'
  ],
  
  // 状态颜色
  STATUS_COLORS: {
    online: '#67c23a',
    offline: '#f56c6c',
    connecting: '#e6a23c',
    unknown: '#909399',
  },
} as const;

// 尺寸配置
export const SIZE_CONFIG = {
  // 组件默认尺寸
  COMPONENT_SIZES: {
    card: { w: 6, h: 4 },
    gauge: { w: 8, h: 8 },
    line: { w: 12, h: 8 },
    bar: { w: 12, h: 8 },
    pie: { w: 8, h: 8 },
    table: { w: 24, h: 12 },
    text: { w: 6, h: 2 },
    progress: { w: 8, h: 2 },
    metric: { w: 4, h: 4 },
  },
  
  // 最小尺寸
  MIN_SIZES: {
    w: 1,
    h: 1,
  },
  
  // 最大尺寸
  MAX_SIZES: {
    w: 24,
    h: 50,
  },
} as const;
