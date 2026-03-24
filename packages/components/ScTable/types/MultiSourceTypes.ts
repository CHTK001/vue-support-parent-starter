/**
 * 多数据源表格相关类型定义
 */

// 数据源配置接口
export interface DataSource {
  /** 数据源唯一标识 */
  id: string
  /** 数据源名称 */
  name: string
  /** API接口，可以是函数或URL字符串 */
  api: DataSourceAPI | string
  /** 数据源权重，用于排序 */
  weight?: number
  /** 是否启用该数据源 */
  enabled?: boolean
  /** 数据源描述 */
  description?: string
  /** 自定义配置 */
  config?: Record<string, any>
}

// 数据源API函数类型
export type DataSourceAPI = (params: DataSourceParams) => Promise<DataSourceResponse>

// 数据源请求参数
export interface DataSourceParams {
  /** 页码 */
  page: number
  /** 每页数量 */
  pageSize: number
  /** 排序字段 */
  sortField?: string
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
  /** 搜索关键词 */
  keyword?: string
  /** 筛选条件 */
  filters?: Record<string, any>
  /** 额外参数 */
  [key: string]: any
}

// 数据源响应格式
export interface DataSourceResponse {
  /** 响应状态码 */
  code: number
  /** 响应消息 */
  message?: string
  /** 当前页数据 */
  data?: any[]
  /** 兼容字段：当前页数据 */
  rows?: any[]
  /** 总记录数 */
  total: number
  /** 汇总信息 */
  summary?: Record<string, any>
  /** 额外信息 */
  extra?: Record<string, any>
}

// 数据源加载结果
export interface DataSourceResult {
  /** 数据源ID */
  sourceId: string
  /** 加载的数据 */
  data: any[]
  /** 总记录数 */
  total: number
  /** 是否加载成功 */
  success: boolean
  /** 错误信息 */
  error?: string
  /** 加载耗时（毫秒） */
  duration?: number
  /** 额外信息 */
  extra?: Record<string, any>
}

// 聚合策略枚举
export enum AggregationStrategy {
  /** 合并数据：将所有数据源的数据合并到一起 */
  MERGE = 'merge',
  /** 连接数据：按数据源分组，保留来源信息 */
  CONCAT = 'concat',
  /** 交错数据：按一定规则交错排列不同数据源的数据 */
  INTERLEAVE = 'interleave'
}

// 展示模式枚举
export enum DisplayMode {
  /** 表格模式 */
  TABLE = 'table',
  /** 卡片模式 */
  CARD = 'card',
  /** 列表模式 */
  LIST = 'list',
  /** 虚拟表格模式 */
  VIRTUAL = 'virtual',
  /** 画布模式 */
  CANVAS = 'canvas'
}

// 分页类型枚举
export enum PaginationType {
  /** 普通分页 */
  NORMAL = 'normal',
  /** 滚动分页 */
  SCROLL = 'scroll',
  /** 无限滚动 */
  INFINITE = 'infinite'
}

// 多数据源表格配置
export interface MultiSourceTableConfig {
  /** 数据源列表 */
  dataSources: DataSource[]
  /** 展示模式 */
  displayMode: DisplayMode
  /** 聚合策略 */
  aggregationStrategy: AggregationStrategy
  /** 分页配置 */
  pagination: {
    /** 当前页码 */
    currentPage: number
    /** 每页数量 */
    pageSize: number
    /** 可选页面大小 */
    pageSizes: number[]
    /** 分页类型 */
    type: PaginationType
    /** 是否隐藏分页 */
    hidden: boolean
  }
  /** 排序配置 */
  sorting?: {
    /** 默认排序字段 */
    defaultField?: string
    /** 默认排序方向 */
    defaultOrder?: 'asc' | 'desc'
    /** 是否支持多字段排序 */
    multiple?: boolean
  }
  /** 筛选配置 */
  filtering?: {
    /** 是否启用远程筛选 */
    remote?: boolean
    /** 筛选字段配置 */
    fields?: FilterField[]
  }
  /** 搜索配置 */
  searching?: {
    /** 是否启用搜索 */
    enabled?: boolean
    /** 搜索字段 */
    fields?: string[]
    /** 搜索占位符 */
    placeholder?: string
  }
}

// 筛选字段配置
export interface FilterField {
  /** 字段名 */
  field: string
  /** 字段标签 */
  label: string
  /** 筛选类型 */
  type: 'select' | 'input' | 'date' | 'daterange' | 'number'
  /** 选项列表（用于select类型） */
  options?: Array<{ label: string; value: any }>
  /** 默认值 */
  defaultValue?: any
}

// 数据聚合配置
export interface AggregationConfig {
  /** 聚合策略 */
  strategy: AggregationStrategy
  /** 数据去重配置 */
  deduplication?: {
    /** 是否启用去重 */
    enabled: boolean
    /** 去重字段 */
    field: string
    /** 去重策略：保留第一个(first)或最后一个(last) */
    strategy: 'first' | 'last'
  }
  /** 数据排序配置 */
  sorting?: {
    /** 排序字段 */
    field: string
    /** 排序方向 */
    order: 'asc' | 'desc'
    /** 自定义排序函数 */
    compareFn?: (a: any, b: any) => number
  }
  /** 数据转换配置 */
  transformation?: {
    /** 字段映射 */
    fieldMapping?: Record<string, string>
    /** 数据转换函数 */
    transformFn?: (data: any[], sourceId: string) => any[]
  }
}

// 事件类型定义
export interface MultiSourceTableEvents {
  /** 数据变化事件 */
  'data-change': (results: DataSourceResult[], aggregatedData: any[], total: number) => void
  /** 数据加载完成事件 */
  'loaded': () => void
  /** 数据加载完成事件（带参数） */
  'data-loaded': (data: any[], total: number) => void
  /** 行点击事件 */
  'row-click': (row: any, column: any, event: Event) => void
  /** 列点击事件 */
  'col-click': (column: any, event: Event) => void
  /** 选择变化事件 */
  'selection-change': (selection: any[]) => void
  /** 排序变化事件 */
  'sort-change': (sort: { prop: string; order: string }) => void
  /** 筛选变化事件 */
  'filter-change': (filters: Record<string, any>) => void
  /** 页码变化事件 */
  'current-change': (page: number) => void
  /** 页面大小变化事件 */
  'size-change': (size: number) => void
  /** 刷新事件 */
  'refresh': () => void
  /** 加载更多事件 */
  'load-more': () => void
}

// 工具函数类型
export type DataSourceValidator = (dataSource: DataSource) => boolean
export type DataAggregator = (results: DataSourceResult[], config: AggregationConfig) => any[]
export type DataTransformer = (data: any[], sourceId: string) => any[]

// 默认配置
export const DEFAULT_CONFIG: Partial<MultiSourceTableConfig> = {
  displayMode: DisplayMode.TABLE,
  aggregationStrategy: AggregationStrategy.MERGE,
  pagination: {
    currentPage: 1,
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
    type: PaginationType.NORMAL,
    hidden: false
  }
}

// 错误类型
export class MultiSourceTableError extends Error {
  constructor(
    message: string,
    public code: string,
    public sourceId?: string
  ) {
    super(message)
    this.name = 'MultiSourceTableError'
  }
}

// 数据源状态
export enum DataSourceStatus {
  /** 未初始化 */
  UNINITIALIZED = 'uninitialized',
  /** 加载中 */
  LOADING = 'loading',
  /** 加载成功 */
  SUCCESS = 'success',
  /** 加载失败 */
  ERROR = 'error',
  /** 已禁用 */
  DISABLED = 'disabled'
}

// 数据源状态信息
export interface DataSourceStatusInfo {
  /** 数据源ID */
  sourceId: string
  /** 状态 */
  status: DataSourceStatus
  /** 最后更新时间 */
  lastUpdated?: Date
  /** 错误信息 */
  error?: string
  /** 加载耗时 */
  duration?: number
  /** 数据条数 */
  dataCount?: number
}