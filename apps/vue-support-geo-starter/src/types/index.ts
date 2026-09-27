/**
 * GeoDownloader 类型定义
 * 与后端 spring-api-support-geo-starter 数据契约对应
 */

/**
 * 地理边界（WGS-84）
 * @author CH
 * @since 4.0.0
 */
export interface GeoBounds {
  north: number
  south: number
  east: number
  west: number
}

/**
 * 瓦片图源
 * @author CH
 * @since 4.0.0
 */
export interface TileSource {
  id: string
  name: string
  maxZoom?: number
  attribution?: string
  url?: string
  urlTemplate?: string
  subdomains?: string[]
  headers?: Record<string, string>
}

/**
 * 下载请求
 * @author CH
 * @since 4.0.0
 */
export interface DownloadRequest {
  source: string
  bounds: GeoBounds
  zoom: number
  zoomMax?: number | null
  zoomLevels?: number[] | null
  format: string
  savePath?: string | null
  concurrency?: number
  proxy?: string | null
  polygon?: number[][][] | null
  cropToShape?: boolean
  sourceName?: string
  tiandituToken?: string | null
  compression?: string
  buildPyramid?: boolean
  generateSidecars?: boolean
  overlaySources?: string[] | null
}

/**
 * 下载估算结果
 * @author CH
 * @since 4.0.0
 */
export interface DownloadEstimate {
  tileCount: number
  cols?: number
  rows?: number
  rawSizeMb?: number
  estimatedOutputMb?: number
  zoom?: number
  message?: string
}

/**
 * 创建任务结果
 * @author CH
 * @since 4.0.0
 */
export interface CreateTaskResult {
  taskId: string
  tileCount: number
}

/**
 * 任务信息
 * @author CH
 * @since 4.0.0
 */
export interface TaskInfo {
  id: string
  name: string
  source?: string
  sourceName?: string
  zoom?: number
  format?: string
  savePath?: string
  status: string
  progress?: number
  completed?: number
  total?: number
  failedCount?: number
  successCount?: number
  fileSize?: number
  message?: string
  error?: string
  createdAt?: string
}

/**
 * 任务状态
 * @author CH
 * @since 4.0.0
 */
export type TaskStatus =
  | 'pending'
  | 'downloading'
  | 'merging'
  | 'processing'
  | 'exporting'
  | 'building_pyramid'
  | 'completed'
  | 'completed_with_gaps'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'pending_decision'

/**
 * 下载历史记录
 * @author CH
 * @since 4.0.0
 */
export interface DownloadHistoryRecord {
  id: string | number
  name: string
  source?: string
  sourceName?: string
  zoom?: number
  format?: string
  filePath?: string
  fileSize?: number
  tileCount?: number
  failedCount?: number
  status?: string
  createdAt?: string
  durationSecs?: number
}

/**
 * 历史分页结果
 * @author CH
 * @since 4.0.0
 */
export interface DownloadHistoryPage {
  records: DownloadHistoryRecord[]
  total: number
  page: number
  pageSize: number
}

/**
 * DEM 图源
 * @author CH
 * @since 4.0.0
 */
export interface DemSource {
  id: string
  name: string
  maxZoom?: number
}

/**
 * Wayback 版本
 * @author CH
 * @since 4.0.0
 */
export interface WaybackVersion {
  id: string
  title: string
  date?: string
  layerId?: string
}

/**
 * Wayback 版本列表响应
 * @author CH
 * @since 4.0.0
 */
export interface WaybackVersionsResponse {
  versions: WaybackVersion[]
  count: number
}

/**
 * 3D Tiles 数据源
 * @author CH
 * @since 4.0.0
 */
export interface Tiles3dSource {
  type: 'url' | 'cesium_ion'
  assetId?: number
  accessToken?: string
  tilesetQueryUrl?: string
}

/**
 * 3D Tiles 摘要
 * @author CH
 * @since 4.0.0
 */
export interface TilesetSummary {
  version: string
  extent?: number[] | null
  totalTiles: number
  contentTiles: number
  maxDepth: number
  levels: number
  hasExternalTilesets: boolean
}

/**
 * 全局设置
 * @author CH
 * @since 4.0.0
 */
export interface AppSettings {
  tiandituToken?: string
  proxyEnabled?: boolean
  proxyUrl?: string
  defaultConcurrency?: number
  defaultZoom?: number
  defaultFormat?: string
  memoryBudgetMb?: number
  allowInvalidCerts?: boolean
  tileCacheEnabled?: boolean
  tileCacheMaxSizeMb?: number
  exportBufferMb?: number
}
