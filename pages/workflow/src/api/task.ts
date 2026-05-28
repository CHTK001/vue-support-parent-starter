import { http, type ReturnResult } from "@repo/utils";
import type { WfTaskProcessRequest } from "../types";

const BASE = "/v2/workflow/task";

/** 审批通过 */
export const approveTask = (request: WfTaskProcessRequest) =>
  http.request<ReturnResult<boolean>>("post", `${BASE}/approve`, { data: request });

/** 审批驳回 */
export const rejectTask = (request: WfTaskProcessRequest) =>
  http.request<ReturnResult<boolean>>("post", `${BASE}/reject`, { data: request });

/** 退回 */
export const returnTask = (request: WfTaskProcessRequest) =>
  http.request<ReturnResult<boolean>>("post", `${BASE}/return`, { data: request });

/** 转交 */
export const transferTask = (request: WfTaskProcessRequest) =>
  http.request<ReturnResult<boolean>>("post", `${BASE}/transfer`, { data: request });
