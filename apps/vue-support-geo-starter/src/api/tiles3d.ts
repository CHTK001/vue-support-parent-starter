/**
 * 3D Tiles API
 */
import { http } from "./http"
import type { Tiles3dSource, TilesetSummary } from "@/types"

/**
 * 分析 3D Tiles 结构
 * @param source 3D Tiles 数据源
 * @param proxy 代理地址，可选
 * @returns 瓦片集摘要
 */
export function analyze3dTiles(source: Tiles3dSource, proxy: string | null = null): Promise<TilesetSummary> {
  return http.post("/v1/geo/3dtiles/analyze", { source, proxy })
}

/**
 * 下载 3D Tiles 模型
 * @param source 3D Tiles 数据源
 * @param polygon 多边形选区（经纬度坐标对数组），可为 null
 * @param savePath 保存路径
 * @param proxy 代理地址，可选
 * @returns 保存路径、内容数与瓦片总数
 */
export function download3dTiles(source: Tiles3dSource, polygon: number[][] | null, savePath: string, proxy: string | null = null): Promise<{ savePath: string; contentCount: number; totalTiles: number }> {
  return http.post("/v1/geo/3dtiles/download", { source, polygon, savePath, proxy })
}
