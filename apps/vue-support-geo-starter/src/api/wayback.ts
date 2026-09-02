/**
 * Wayback 历史影像 API
 */
import { http } from "./http"
import type { WaybackVersion, WaybackVersionsResponse } from "@/types"

/** 获取历史版本列表 */
export function getWaybackVersions(): Promise<WaybackVersionsResponse> {
  return http.get("/v1/geo/wayback/versions")
}

/** 创建 Wayback 下载任务 */
export function createWaybackTask(req: Record<string, unknown>): Promise<{ taskId: string; tileCount: number }> {
  return http.post("/v1/geo/wayback/download", req)
}

/** 探测最大缩放级别 */
export function probeWaybackMaxZoom(req: { versionId: string; lat: number; lng: number }): Promise<{ maxZoom: number }> {
  return http.post("/v1/geo/wayback/probe", req)
}

/** 扫描元数据 */
export function scanWaybackMetadata(req: Record<string, unknown>): Promise<any> {
  return http.post("/v1/geo/wayback/scan", req)
}
