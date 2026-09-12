/**
 * DEM 高程下载 API
 */
import { http } from "./http"
import type { DemSource, DownloadEstimate, GeoBounds } from "@/types"

/**
 * 获取 DEM 图源列表
 * @returns 以图源 ID 为键的图源映射
 */
export function getDemSources(): Promise<Record<string, DemSource>> {
  return http.get("/v1/geo/dem/sources")
}

/**
 * 估算 DEM 瓦片数量与大小
 * @param source 图源 ID
 * @param bounds 地理边界
 * @param zoom 缩放级别
 * @param format 输出格式
 * @returns 下载估算结果
 */
export function estimateDem(source: string, bounds: GeoBounds, zoom: number, format: string): Promise<DownloadEstimate> {
  return http.post("/v1/geo/dem/estimate", { source, bounds, zoom, format })
}

/**
 * 创建 DEM 下载任务
 * @param source 图源 ID
 * @param bounds 地理边界
 * @param zoom 缩放级别
 * @param format 输出格式
 * @param savePath 保存路径
 * @returns 任务 ID
 */
export function downloadDem(source: string, bounds: GeoBounds, zoom: number, format: string, savePath: string): Promise<{ taskId: string }> {
  return http.post("/v1/geo/dem/download", { source, bounds, zoom, format, savePath })
}
