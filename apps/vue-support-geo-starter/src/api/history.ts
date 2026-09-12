/**
 * 下载历史 API
 */
import { http } from "./http"
import type { DownloadHistoryPage, DownloadHistoryRecord } from "@/types"

/**
 * 分页获取下载历史
 * @param page 页码，默认 1
 * @param pageSize 每页条数，默认 20
 * @returns 历史分页结果
 */
export function getDownloadHistory(page = 1, pageSize = 20): Promise<DownloadHistoryPage> {
  return http.get("/v1/geo/history/page", { params: { page, pageSize } })
}

/**
 * 获取全部下载历史
 * @returns 历史记录列表
 */
export function getAllHistory(): Promise<DownloadHistoryRecord[]> {
  return http.get("/v1/geo/history")
}

/**
 * 添加下载历史记录
 * @param record 历史记录（部分字段）
 * @returns 操作结果
 */
export function addDownloadRecord(record: Partial<DownloadHistoryRecord>): Promise<{ message: string }> {
  return http.post("/v1/geo/history", record)
}

/**
 * 删除下载历史记录
 * @param id 记录 ID
 * @returns 操作结果
 */
export function deleteDownloadRecord(id: string | number): Promise<{ message: string }> {
  return http.delete(`/v1/geo/history/${id}`)
}

/**
 * 清空全部下载历史
 * @returns 操作结果
 */
export function clearDownloadHistory(): Promise<{ message: string }> {
  return http.delete("/v1/geo/history/clear")
}

/**
 * 为指定文件构建金字塔
 * @param recordId 历史记录 ID
 * @returns 操作结果
 */
export function buildPyramidForFile(recordId: string | number): Promise<{ message: string }> {
  return http.post(`/v1/geo/history/${recordId}/pyramid`)
}
