import type { ReturnResult } from "@repo/utils";
import type { ScGraph } from "../types";
import { datalakeRequest } from "./request";

const base = "/v2/datalake/pipeline";

/** Pipeline 列表 */
export const fetchPipelineList = () =>
  datalakeRequest<ReturnResult<ScGraph[]>>("get", `${base}/list`);

/** Pipeline 详情 */
export const fetchPipelineById = (id: string) =>
  datalakeRequest<ReturnResult<ScGraph>>("get", `${base}/${id}`);

/** 创建 Pipeline */
export const fetchCreatePipeline = (data: Partial<ScGraph>) =>
  datalakeRequest<ReturnResult<ScGraph>>("post", base, { data });

/** 更新 Pipeline */
export const fetchUpdatePipeline = (data: Partial<ScGraph>) =>
  datalakeRequest<ReturnResult<ScGraph>>("put", base, { data });

/** 删除 Pipeline */
export const fetchDeletePipeline = (id: string) =>
  datalakeRequest<ReturnResult<boolean>>("delete", `${base}/${id}`);

/** 启动 Pipeline */
export const fetchStartPipeline = (id: string) =>
  datalakeRequest<ReturnResult<boolean>>("post", `${base}/${id}/start`);

/** 停止 Pipeline */
export const fetchStopPipeline = (id: string) =>
  datalakeRequest<ReturnResult<boolean>>("post", `${base}/${id}/stop`);

/** 暂停 Pipeline */
export const fetchPausePipeline = (id: string) =>
  datalakeRequest<ReturnResult<boolean>>("post", `${base}/${id}/pause`);

/** 恢复 Pipeline */
export const fetchResumePipeline = (id: string) =>
  datalakeRequest<ReturnResult<boolean>>("post", `${base}/${id}/resume`);

/** Pipeline 状态 */
export const fetchPipelineStatus = (id: string) =>
  datalakeRequest<ReturnResult<{ id: string; lifecycle: string }>>("get", `${base}/${id}/status`);

export type PipelineSpiItem = string | { name?: string; label?: string; spi?: string; id?: string; value?: string };
export type PipelineSpiCatalog = Record<string, PipelineSpiItem[]>;

/** SPI 清单 */
export const fetchPipelineSpis = () =>
  datalakeRequest<ReturnResult<PipelineSpiCatalog> | PipelineSpiCatalog>("get", `${base}/spis`);

/** 同步执行管线（测试/调试用） */
export const fetchSubmitPipeline = (id: string, data: { payload?: any; parsed?: Record<string, any>; formatType?: string }) =>
  datalakeRequest<ReturnResult<any>>("post", `${base}/${id}/submit`, { data });

/** 测试脚本节点 */
export const fetchTestScript = (data: { script: string; scriptType: string; payload: string }) =>
  datalakeRequest<ReturnResult<any> | any>("post", "/v2/datalake/script/test", { data });
