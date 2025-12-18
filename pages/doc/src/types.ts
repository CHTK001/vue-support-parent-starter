/**
 * API 文档模块类型定义
 */

/** API 分组 */
export interface ApiGroup {
  /** 分组名称 */
  name: string;
  /** 分组描述 */
  description?: string;
  /** 该分组下的API列表 */
  apis: ApiInfo[];
}

/** API 信息 */
export interface ApiInfo {
  /** API 路径 */
  path: string;
  /** HTTP 方法 */
  method: string;
  /** API 摘要 */
  summary?: string;
  /** API 详细描述 */
  description?: string;
  /** API 参数列表 */
  parameters?: ApiParameter[];
  /** 请求体定义 */
  requestBody?: ApiRequestBody;
  /** 响应定义 */
  responses?: Record<string, ApiResponseDef>;
  /** 标签列表 */
  tags?: string[];
  /** 是否已废弃 */
  deprecated?: boolean;
}

/** API 参数 */
export interface ApiParameter {
  /** 参数名称 */
  name: string;
  /** 参数位置: path, query, header, cookie */
  in: "path" | "query" | "header" | "cookie";
  /** 是否必填 */
  required: boolean;
  /** 参数类型 */
  type: string;
  /** 参数描述 */
  description?: string;
  /** 默认值 */
  default?: any;
  /** 枚举值 */
  enum?: any[];
  /** 示例值 */
  example?: any;
}

/** 请求体定义 */
export interface ApiRequestBody {
  /** 内容类型 */
  type?: string;
  /** 是否必填 */
  required?: boolean;
  /** 属性定义 */
  properties?: Record<string, ApiPropertyDef>;
  /** 描述 */
  description?: string;
  /** 示例 */
  example?: any;
}

/** 属性定义 */
export interface ApiPropertyDef {
  /** 类型 */
  type: string;
  /** 描述 */
  description?: string;
  /** 是否必填 */
  required?: boolean;
  /** 示例 */
  example?: any;
  /** 默认值 */
  default?: any;
  /** 枚举值 */
  enum?: any[];
}

/** 响应定义 */
export interface ApiResponseDef {
  /** 描述 */
  description?: string;
  /** 响应内容 */
  content?: Record<string, any>;
}

/** API 执行响应 */
export interface ApiResponse {
  /** HTTP 状态码 */
  status: number;
  /** 状态文本 */
  statusText: string;
  /** 响应头 */
  headers: Record<string, string>;
  /** 响应数据 */
  data: any;
  /** 请求耗时(ms) */
  duration: number;
}

/** 参数值 */
export interface ParamValues {
  /** 路径参数 */
  path: Record<string, string>;
  /** 查询参数 */
  query: Record<string, string>;
  /** 请求头参数 */
  header?: Record<string, string>;
}

/** 全局请求头配置 */
export interface HeaderConfig {
  /** 键 */
  key: string;
  /** 值 */
  value: string;
  /** 是否启用 */
  enabled?: boolean;
}

/** API 执行请求参数 */
export interface ExecuteApiParams {
  /** 基础URL */
  baseUrl: string;
  /** API信息 */
  api: ApiInfo;
  /** 路径参数值 */
  pathParams?: Record<string, string>;
  /** 查询参数值 */
  queryParams?: Record<string, string>;
  /** 请求体 */
  requestBody?: string;
  /** 额外请求头 */
  headers?: Record<string, string>;
  /** 超时时间(ms) */
  timeout?: number;
  /** 重试次数 */
  retryCount?: number;
}

/** 代码示例语言 */
export type CodeLanguage = "java" | "javascript" | "python" | "curl";

/** 编辑器配置 */
export interface EditorOptions {
  /** 编辑器模式 */
  mode: string;
  /** 主题 */
  theme?: string;
  /** 是否显示行号 */
  lineNumbers?: boolean;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否自动换行 */
  lineWrapping?: boolean;
  /** 是否启用折叠 */
  foldGutter?: boolean;
  /** 工具栏配置 */
  gutters?: string[];
}

/** API 文档查看器配置 */
export interface ApiDocViewerConfig {
  /** 是否显示返回按钮 */
  showBackButton?: boolean;
  /** 是否显示刷新按钮 */
  showRefreshButton?: boolean;
  /** 是否显示全局请求头设置 */
  showGlobalHeaders?: boolean;
  /** 是否显示代码示例 */
  showCodeExamples?: boolean;
  /** 是否显示节点选择器 */
  showNodeSelector?: boolean;
  /** 是否显示历史记录 */
  showHistory?: boolean;
  /** 是否显示导出功能 */
  showExport?: boolean;
  /** 是否显示 Mock 功能 */
  showMock?: boolean;
  /** 默认展开的分组 */
  defaultExpandedGroups?: string[];
  /** 编辑器高度 */
  editorHeight?: string;
  /** 代码示例语言列表 */
  codeLanguages?: CodeLanguage[];
}

/** API 文档数据源接口 */
export interface ApiDocDataSource {
  /** 获取API文档分组 */
  fetchApiDocs: () => Promise<ApiGroup[]>;
  /** 执行API请求 */
  executeApi: (params: ExecuteApiParams) => Promise<ApiResponse>;
}

/** 节点状态 */
export type NodeStatus = "online" | "offline" | "unknown";

/** 节点信息 */
export interface NodeInfo {
  /** 节点 ID */
  id: string;
  /** 节点名称 */
  name: string;
  /** 基础 URL */
  baseUrl: string;
  /** 节点状态 */
  status?: NodeStatus;
  /** 节点描述 */
  description?: string;
  /** 额外配置 */
  extra?: Record<string, any>;
}

/** 多节点配置 */
export interface MultiNodeConfig {
  /** 是否启用多节点 */
  enabled: boolean;
  /** 节点列表 */
  nodes: NodeInfo[];
  /** 当前节点 ID */
  currentNodeId?: string;
}
