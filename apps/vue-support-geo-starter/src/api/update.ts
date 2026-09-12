/**
 * 应用更新 API
 */
import { http } from "./http"

/**
 * 应用更新信息
 * @author CH
 * @since 4.0.0
 */
export interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  downloadUrl: string
  releaseNotes: string
}

/**
 * 获取应用更新信息
 * @returns 更新信息
 */
export function getUpdateInfo(): Promise<UpdateInfo> {
  return http.get("/v1/geo/update/info")
}