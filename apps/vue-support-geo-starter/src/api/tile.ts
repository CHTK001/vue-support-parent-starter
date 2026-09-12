/**
 * 瓦片下载 API（Imagery）
 */
import { http } from "./http"
import type { CreateTaskResult, DownloadEstimate, DownloadRequest, TaskInfo } from "@/types"

/**
 * 估算瓦片数量与大小
 * @param req 下载请求参数
 * @returns 下载估算结果
 */
export function estimateDownload(req: DownloadRequest): Promise<DownloadEstimate> {
  return http.post("/v1/geo/tile/estimate", req)
}

/**
 * 创建瓦片下载任务
 * @param req 下载请求参数
 * @returns 任务 ID 与瓦片数量
 */
export function createDownloadTask(req: DownloadRequest): Promise<CreateTaskResult> {
  return http.post("/v1/geo/tile/download", req)
}

/**
 * 直接下载（同步）
 * @param req 下载请求参数
 * @returns 任务 ID 与瓦片数量
 */
export function downloadTiles(req: DownloadRequest): Promise<CreateTaskResult> {
  return http.post("/v1/geo/tile/download", req)
}

/**
 * 列出所有下载任务
 * @returns 任务列表
 */
export function getActiveTasks(): Promise<TaskInfo[]> {
  return http.get("/v1/geo/tile/tasks")
}

/**
 * 获取单个下载任务
 * @param taskId 任务 ID
 * @returns 任务信息
 */
export function getTask(taskId: string): Promise<TaskInfo> {
  return http.get(`/v1/geo/tile/task/${taskId}`)
}

/**
 * 取消下载任务
 * @param taskId 任务 ID
 * @returns 操作结果
 */
export function cancelTask(taskId: string): Promise<{ message: string }> {
  return http.post(`/v1/geo/tile/task/${taskId}/cancel`)
}

/**
 * 暂停/继续下载任务
 * @param taskId 任务 ID
 * @returns 操作结果
 */
export function togglePauseTask(taskId: string): Promise<{ message: string }> {
  return http.post(`/v1/geo/tile/task/${taskId}/pause`)
}

/**
 * 删除下载任务
 * @param taskId 任务 ID
 * @returns 操作结果
 */
export function removeTask(taskId: string): Promise<{ message: string }> {
  return http.delete(`/v1/geo/tile/task/${taskId}`)
}

/**
 * 导出任务的部分结果
 * @param taskId 任务 ID
 * @returns 操作结果
 */
export function exportPartialTask(taskId: string): Promise<{ message: string }> {
  return http.post(`/v1/geo/tile/task/${taskId}/export`)
}
