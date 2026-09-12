/**
 * Wayback 历史影像 API
 */
import { http } from "./http"
import type { WaybackVersion, WaybackVersionsResponse } from "@/types"

/**
 * 获取 Wayback 历史版本列表
 * @returns 版本列表响应
 */
export function getWaybackVersions(): Promise<WaybackVersionsResponse> {
  return http.get("/v1/geo/wayback/versions")
}

/**
 * 创建 Wayback 下载任务
 * @param req 任务请求参数
 * @returns 任务 ID 与瓦片数量
 */
export function createWaybackTask(req: Record<string, unknown>): Promise<{ taskId: string; tileCount: number }> {
  return http.post("/v1/geo/wayback/download", req)
}

/**
 * 探测指定坐标的最大可用缩放级别
 * @param req 版本 ID 与坐标
 * @returns 最大缩放级别
 */
export function probeWaybackMaxZoom(req: { versionId: string; lat: number; lng: number }): Promise<{ maxZoom: number }> {
  return http.post("/v1/geo/wayback/probe", req)
}

/**
 * 扫描 Wayback 元数据
 * @param req 扫描请求参数
 * @returns 扫描结果
 */
export function scanWaybackMetadata(req: Record<string, unknown>): Promise<any> {
  return http.post("/v1/geo/wayback/scan", req)
}
