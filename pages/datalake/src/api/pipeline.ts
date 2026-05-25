import { http, type ReturnResult } from "@repo/utils";
import type { ScGraph } from "../types";

const base = "/v2/datalake/pipeline";

/** Pipeline 列表 */
export const fetchPipelineList = () =>
  http.request<ReturnResult<ScGraph[]>>("get", `${base}/list`);

/** Pipeline 详情 */
export const fetchPipelineById = (id: string) =>
  http.request<ReturnResult<ScGraph>>("get", `${base}/${id}`);

/** 创建 Pipeline */
export const fetchCreatePipeline = (data: Partial<ScGraph>) =>
  http.request<ReturnResult<ScGraph>>("post", base, { data });

/** 更新 Pipeline */
export const fetchUpdatePipeline = (data: Partial<ScGraph>) =>
  http.request<ReturnResult<ScGraph>>("put", base, { data });

/** 删除 Pipeline */
export const fetchDeletePipeline = (id: string) =>
  http.request<ReturnResult<boolean>>("delete", `${base}/${id}`);

/** 启动 Pipeline */
export const fetchStartPipeline = (id: string) =>
  http.request<ReturnResult<boolean>>("post", `${base}/${id}/start`);

/** 停止 Pipeline */
export const fetchStopPipeline = (id: string) =>
  http.request<ReturnResult<boolean>>("post", `${base}/${id}/stop`);

/** 暂停 Pipeline */
export const fetchPausePipeline = (id: string) =>
  http.request<ReturnResult<boolean>>("post", `${base}/${id}/pause`);

/** 恢复 Pipeline */
export const fetchResumePipeline = (id: string) =>
  http.request<ReturnResult<boolean>>("post", `${base}/${id}/resume`);

/** Pipeline 状态 */
export const fetchPipelineStatus = (id: string) =>
  http.request<ReturnResult<{ id: string; lifecycle: string }>>("get", `${base}/${id}/status`);
