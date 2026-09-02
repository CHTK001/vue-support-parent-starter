/**
 * OSM 矢量数据 API
 */
import { http } from "./http"
import type { GeoBounds } from "@/types"

/** OSM 查询 */
export function osmQuery(query: string, bounds: GeoBounds, format: string): Promise<{ elementCount: number; estimateSizeMb: string }> {
  return http.post("/v1/geo/osm/query", { query, bounds, format })
}

/** 创建 OSM 下载任务 */
export function createOsmDownloadTask(query: string, bounds: GeoBounds, format: string, savePath: string): Promise<{ taskId: string; elementCount: number }> {
  return http.post("/v1/geo/osm/download", { query, bounds, format, savePath })
}
