/**
 * OSM 矢量数据 API
 */
import { http } from "./http"
import type { GeoBounds } from "@/types"

/**
 * OSM 查询（估算元素数与大小）
 * @param query Overpass QL 查询语句
 * @param bounds 地理边界
 * @param format 输出格式
 * @returns 元素数量与预计大小
 */
export function osmQuery(query: string, bounds: GeoBounds, format: string): Promise<{ elementCount: number; estimateSizeMb: string }> {
  return http.post("/v1/geo/osm/query", { query, bounds, format })
}

/**
 * 创建 OSM 下载任务
 * @param query Overpass QL 查询语句
 * @param bounds 地理边界
 * @param format 输出格式
 * @param savePath 保存路径
 * @returns 任务 ID 与元素数量
 */
export function createOsmDownloadTask(query: string, bounds: GeoBounds, format: string, savePath: string): Promise<{ taskId: string; elementCount: number }> {
  return http.post("/v1/geo/osm/download", { query, bounds, format, savePath })
}
