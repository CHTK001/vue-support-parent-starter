/**
 * 图源与设置 API
 */
import { http } from "./http"
import type { AppSettings, TileSource } from "@/types"

/**
 * 获取全部瓦片图源
 * @returns 以图源 ID 为键的图源映射
 */
export function getTileSources(): Promise<Record<string, TileSource>> {
  return http.get("/v1/geo/tile/sources")
}

/**
 * 获取全局设置
 * @returns 应用设置
 */
export function getSettings(): Promise<AppSettings> {
  return http.get("/v1/geo/settings")
}

/**
 * 保存全局设置
 * @param settings 应用设置
 * @returns 操作结果
 */
export function saveSettings(settings: AppSettings): Promise<{ message: string }> {
  return http.post("/v1/geo/settings", settings)
}

/**
 * 获取全部图源（含 URL 模板）
 * @returns 以图源 ID 为键的图源映射
 */
export function getSourcesAll(): Promise<Record<string, TileSource>> {
  return http.get("/v1/geo/source/all")
}

/**
 * 分析图源 URL 结构
 * @param rawUrl 原始 URL
 * @param proxy 代理地址，可选
 * @returns 分析结果
 */
export function analyzeTileSourceUrl(rawUrl: string, proxy: string | null = null): Promise<any> {
  return http.post("/v1/geo/source/analyze", { rawUrl, proxy })
}

/**
 * 新增自定义图源
 * @param source 图源定义对象
 * @returns 操作结果
 */
export function addCustomSource(source: Record<string, unknown>): Promise<{ message: string }> {
  return http.post("/v1/geo/source/custom", source)
}
