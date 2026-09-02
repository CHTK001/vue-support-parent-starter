/**
 * 应用更新 API
 */
import { http } from "./http"

/** 获取更新信息 */
export interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  downloadUrl: string
  releaseNotes: string
}

export function getUpdateInfo(): Promise<UpdateInfo> {
  return http.get("/v1/geo/update/info")
}