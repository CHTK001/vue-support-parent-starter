import { http, type ReturnResult } from "@repo/utils";
import type { PageResult } from "@repo/utils";
import type { WfDef, WfDefVO, WfDefNode, WfDefEdge } from "../types";

const BASE = "/v2/workflow/def";

/** 流程定义分页列表 */
export const fetchDefPage = (params?: Record<string, any>) =>
  http.request<ReturnResult<PageResult<WfDef>>>("get", `${BASE}/page`, { params });

/** 查询所有已发布的流程定义 */
export const fetchPublishedDefs = () =>
  http.request<ReturnResult<WfDef[]>>("get", `${BASE}/list`);

/** 流程定义详情(含节点和边) */
export const fetchDefDetail = (defId: number) =>
  http.request<ReturnResult<WfDefVO>>("get", `${BASE}/detail`, { params: { defId } });

/** 保存完整流程定义(含节点和边) */
export const saveDef = (vo: WfDefVO) =>
  http.request<ReturnResult<boolean>>("post", `${BASE}/save`, { data: vo });

/** 发布流程定义 */
export const publishDef = (defId: number) =>
  http.request<ReturnResult<boolean>>("post", `${BASE}/publish`, { params: { defId } });

/** 禁用流程定义 */
export const disableDef = (defId: number) =>
  http.request<ReturnResult<boolean>>("post", `${BASE}/disable`, { params: { defId } });

/** 删除流程定义 */
export const deleteDef = (defId: number) =>
  http.request<ReturnResult<boolean>>("delete", `${BASE}/delete`, { params: { defId } });
