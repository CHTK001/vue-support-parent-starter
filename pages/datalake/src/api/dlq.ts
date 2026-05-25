import { http, type ReturnResult } from "@repo/utils";
import type { DlqEntry } from "../types";

/** 死信列表 */
export const fetchDlqList = (page = 1, size = 20) =>
  http.request<ReturnResult<DlqEntry[]>>("get", "/v2/datalake/dlq/list", {
    params: { page, size },
  });

/** 重试死信 */
export const fetchRetryDlq = (id: number) =>
  http.request<ReturnResult<boolean>>("post", `/v2/datalake/dlq/${id}/retry`);

/** 删除死信 */
export const fetchDeleteDlq = (id: number) =>
  http.request<ReturnResult<boolean>>("delete", `/v2/datalake/dlq/${id}`);

/** 清空死信队列 */
export const fetchClearDlq = () =>
  http.request<ReturnResult<boolean>>("delete", "/v2/datalake/dlq/clear");
