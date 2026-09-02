/**
 * 3D Tiles API
 */
import { http } from "./http"
import type { Tiles3dSource, TilesetSummary } from "@/types"

/** 分析 3D Tiles 结构 */
export function analyze3dTiles(source: Tiles3dSource, proxy: string | null = null): Promise<TilesetSummary> {
  return http.post("/v1/geo/3dtiles/analyze", { source, proxy })
}

/** 下载 3D Tiles */
export function download3dTiles(source: Tiles3dSource, polygon: number[][] | null, savePath: string, proxy: string | null = null): Promise<{ savePath: string; contentCount: number; totalTiles: number }> {
  return http.post("/v1/geo/3dtiles/download", { source, polygon, savePath, proxy })
}
