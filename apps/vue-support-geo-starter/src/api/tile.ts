/**
 * 瓦片下载 API（Imagery）
 */
import { http } from "./http"
import type { CreateTaskResult, DownloadEstimate, DownloadRequest, TaskInfo } from "@/types"

/** 估算瓦片数量与大小 */
export function estimateDownload(req: DownloadRequest): Promise<DownloadEstimate> {
  return http.post("/v1/geo/tile/estimate", req)
}

/** 创建下载任务 */
export function createDownloadTask(req: DownloadRequest): Promise<CreateTaskResult> {
  return http.post("/v1/geo/tile/download", req)
}

/** 直接下载（同步） */
export function downloadTiles(req: DownloadRequest): Promise<CreateTaskResult> {
  return http.post("/v1/geo/tile/download", req)
}

/** 列出所有任务 */
export function getActiveTasks(): Promise<TaskInfo[]> {
  return http.get("/v1/geo/tile/tasks")
}

/** 获取单个任务 */
export function getTask(taskId: string): Promise<TaskInfo> {
  return http.get(`/v1/geo/tile/task/${taskId}`)
}

/** 取消任务 */
export function cancelTask(taskId: string): Promise<{ message: string }> {
  return http.post(`/v1/geo/tile/task/${taskId}/cancel`)
}

/** 暂停/继续任务 */
export function togglePauseTask(taskId: string): Promise<{ message: string }> {
  return http.post(`/v1/geo/tile/task/${taskId}/pause`)
}

/** 删除任务 */
export function removeTask(taskId: string): Promise<{ message: string }> {
  return http.delete(`/v1/geo/tile/task/${taskId}`)
}

/** 部分导出 */
export function exportPartialTask(taskId: string): Promise<{ message: string }> {
  return http.post(`/v1/geo/tile/task/${taskId}/export`)
}
