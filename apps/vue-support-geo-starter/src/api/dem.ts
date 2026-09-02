/**
 * DEM 高程下载 API
 */
import { http } from "./http"
import type { DemSource, DownloadEstimate, GeoBounds } from "@/types"

/** 获取 DEM 图源 */
export function getDemSources(): Promise<Record<string, DemSource>> {
  return http.get("/v1/geo/dem/sources")
}

/** 估算 DEM 瓦片 */
export function estimateDem(source: string, bounds: GeoBounds, zoom: number, format: string): Promise<DownloadEstimate> {
  return http.post("/v1/geo/dem/estimate", { source, bounds, zoom, format })
}

/** 下载 DEM */
export function downloadDem(source: string, bounds: GeoBounds, zoom: number, format: string, savePath: string): Promise<{ taskId: string }> {
  return http.post("/v1/geo/dem/download", { source, bounds, zoom, format, savePath })
}
