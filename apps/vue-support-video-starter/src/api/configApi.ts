/**
 * 视频/直播配置 API 层
 *
 * 后端为 spring-api-support-common-video-starter 的 VideoConfigController：
 *   - GET  /video/api/config           配置概览
 *   - GET  /video/api/config/export    导出配置快照
 *   - POST /video/api/config/import    导入配置快照（页面保存）
 *   - POST /video/api/config/reload    热加载
 *   - POST /video/api/config/sync      配置同步（拉取远程快照 + 热加载）
 */
import { apiPost, apiRequest } from "@/api/request";
import type { VideoConfigOverview, VideoConfigSnapshot } from "@/types/config";

/** 配置概览 */
export function fetchConfigOverview(): Promise<VideoConfigOverview> {
  return apiRequest<VideoConfigOverview>("/config");
}

/** 导出配置快照（含整段直播目录） */
export function exportConfigSnapshot(): Promise<VideoConfigSnapshot> {
  return apiRequest<VideoConfigSnapshot>("/config/export");
}

/**
 * 导入配置快照（页面保存）
 *
 * @param snapshot  配置快照
 * @param overwrite 是否覆盖已存在项
 */
export function importConfigSnapshot(
  snapshot: VideoConfigSnapshot,
  overwrite = true,
): Promise<boolean> {
  return apiPost<boolean>("/config/import", snapshot, { overwrite });
}

/** 从配置库热加载配置与直播目录 */
export function reloadConfig(): Promise<boolean> {
  return apiPost<boolean>("/config/reload");
}

/** 触发配置同步（拉取远程快照 + 热加载），返回同步摘要 */
export function syncConfig(): Promise<Record<string, unknown>> {
  return apiPost<Record<string, unknown>>("/config/sync");
}
