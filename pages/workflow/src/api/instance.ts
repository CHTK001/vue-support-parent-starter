import { http, type ReturnResult } from "@repo/utils";
import type { PageResult } from "@repo/utils";
import type { WfInst, WfInstVO, WfInstCreateRequest } from "../types";

const BASE = "/v2/workflow/inst";

/** 我的申请列表 */
export const fetchMyApply = (params?: Record<string, any>) =>
  http.request<ReturnResult<PageResult<WfInst>>>("get", `${BASE}/myApply`, { params });

/** 我的待办列表 */
export const fetchMyTodo = (params?: Record<string, any>) =>
  http.request<ReturnResult<PageResult<WfInst>>>("get", `${BASE}/myTodo`, { params });

/** 创建流程实例(草稿) */
export const createInst = (request: WfInstCreateRequest) =>
  http.request<ReturnResult<WfInst>>("post", `${BASE}/create`, { data: request });

/** 提交审批 */
export const submitInst = (instId: number) =>
  http.request<ReturnResult<boolean>>("post", `${BASE}/submit`, { params: { instId } });

/** 实例详情 */
export const fetchInstDetail = (instId: number) =>
  http.request<ReturnResult<WfInstVO>>("get", `${BASE}/detail`, { params: { instId } });

/** 撤销申请 */
export const withdrawInst = (instId: number) =>
  http.request<ReturnResult<boolean>>("post", `${BASE}/withdraw`, { params: { instId } });

/** 删除实例 */
export const deleteInst = (instId: number) =>
  http.request<ReturnResult<boolean>>("delete", `${BASE}/delete`, { params: { instId } });
