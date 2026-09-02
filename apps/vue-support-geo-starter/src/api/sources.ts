/**
 * 图源与设置 API
 */
import { http } from "./http"
import type { AppSettings, TileSource } from "@/types"

/** 获取全部图源 */
export function getTileSources(): Promise<Record<string, TileSource>> {
  return http.get("/v1/geo/tile/sources")
}

/** 获取设置 */
export function getSettings(): Promise<AppSettings> {
  return http.get("/v1/geo/settings")
}

/** 保存设置 */
export function saveSettings(settings: AppSettings): Promise<{ message: string }> {
  return http.post("/v1/geo/settings", settings)
}

/** 获取全部图源（含 URL 模板） */
export function getSourcesAll(): Promise<Record<string, TileSource>> {
  return http.get("/v1/geo/source/all")
}

/** 分析图源 URL */
export function analyzeTileSourceUrl(rawUrl: string, proxy: string | null = null): Promise<any> {
  return http.post("/v1/geo/source/analyze", { rawUrl, proxy })
}

/** 新增自定义图源 */
export function addCustomSource(source: Record<string, unknown>): Promise<{ message: string }> {
  return http.post("/v1/geo/source/custom", source)
}
