/**
 * 下载历史 API
 */
import { http } from "./http"
import type { DownloadHistoryPage, DownloadHistoryRecord } from "@/types"

/** 分页获取历史 */
export function getDownloadHistory(page = 1, pageSize = 20): Promise<DownloadHistoryPage> {
  return http.get("/v1/geo/history/page", { params: { page, pageSize } })
}

/** 获取全部历史 */
export function getAllHistory(): Promise<DownloadHistoryRecord[]> {
  return http.get("/v1/geo/history")
}

/** 添加历史记录 */
export function addDownloadRecord(record: Partial<DownloadHistoryRecord>): Promise<{ message: string }> {
  return http.post("/v1/geo/history", record)
}

/** 删除历史记录 */
export function deleteDownloadRecord(id: string | number): Promise<{ message: string }> {
  return http.delete(`/v1/geo/history/${id}`)
}

/** 清空历史 */
export function clearDownloadHistory(): Promise<{ message: string }> {
  return http.delete("/v1/geo/history/clear")
}

/** 构建金字塔 */
export function buildPyramidForFile(recordId: string | number): Promise<{ message: string }> {
  return http.post(`/v1/geo/history/${recordId}/pyramid`)
}
