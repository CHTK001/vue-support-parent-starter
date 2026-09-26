import { createClient, rootHttp } from '@/framework/context';
import type { ApiContext } from "./api-context";

/** /v2/** 业务接口客户端：不解包，返回值与后端统一响应体 {success,data,...} 一致 */
const rawApi = createClient(rootHttp, { unwrap: false });

/**
 * ApiResult 信封取值。
 *
 * 失败响应后端返回非 2xx（AiApiExceptionAdvice 保留 HTTP 状态），框架拦截器已抛出；
 * 这里再兜一层 success=false，把后端文案交给页面的 catch 分支提示。
 */
function takeData<T>(body: any): T | null {
  if (body && body.success === false) {
    throw new Error(body.error || body.msg || "请求失败");
  }
  return (body?.data ?? null) as T | null;
}

/** 模型级生成参数（后端 capabilities[].generate 节点） */
export interface GenerateModelConfig {
  /** 是否支持参考图（图生图 / 图生视频） */
  referenceImage: boolean;
  /** 是否支持负面提示词 */
  negativePrompt: boolean;
  /** 是否支持随机种子 */
  seed: boolean;
  /** 单次生成张数上限 */
  maxCount: number;
  /** 可用分辨率列表 */
  sizes: string[];
  /** 可用视频时长（秒） */
  durations: number[];
  /** 推理步数下限 */
  stepsMin: number | null;
  /** 推理步数上限 */
  stepsMax: number | null;
  /** 推理步数默认值 */
  stepsDefault: number | null;
}

/** 可选生成模型 */
export interface GenerateModel {
  model: string;
  alias: string | null;
  providerId: string;
  providerName: string;
  type: "image" | "video";
  config: GenerateModelConfig;
}

/** 生成任务状态 */
export type GenerateTaskStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELED";

/** 生成任务视图 */
export interface GenerateTask {
  taskId: string;
  type: "image" | "video";
  status: GenerateTaskStatus;
  progress: number | null;
  prompt: string;
  negativePrompt: string | null;
  model: string;
  size: string | null;
  duration: number | null;
  count: number | null;
  seed: number | null;
  urls: string[];
  errorMessage: string | null;
  createdAt: number | null;
  updatedAt: number | null;
}

/** 创建生成任务入参 */
export interface CreateGenerateTask {
  type: "image" | "video";
  model: string;
  prompt: string;
  negativePrompt?: string;
  size?: string;
  count?: number;
  duration?: number;
  seed?: number;
  style?: string;
  quality?: string;
  steps?: number;
  /** 参考图（data URL 或 base64） */
  referenceImage?: string;
}

export interface GenerateApi {
  /** 可选生成模型（含模型级生成参数） */
  fetchGenerateModels(type: "image" | "video"): Promise<GenerateModel[]>;
  /** 创建生成任务 */
  createGenerateTask(data: CreateGenerateTask): Promise<GenerateTask>;
  /** 查询生成任务（后端每次向 provider 回源） */
  fetchGenerateTask(taskId: string): Promise<GenerateTask | null>;
  /** 取消生成任务 */
  cancelGenerateTask(taskId: string): Promise<boolean>;
  /** 生成任务历史 */
  fetchGenerateHistory(type?: "image" | "video", limit?: number): Promise<GenerateTask[]>;
}

export const generateApi: GenerateApi = {
  async fetchGenerateModels(this: ApiContext, type) {
    const body = await rawApi.get(
      `/v2/ai/generate/models?type=${encodeURIComponent(type)}`,
    );
    return takeData<GenerateModel[]>(body) ?? [];
  },

  async createGenerateTask(this: ApiContext, data) {
    const body = await rawApi.post("/v2/ai/generate/tasks", data);
    const task = takeData<GenerateTask>(body);
    if (!task) throw new Error("创建生成任务失败");
    return task;
  },

  async fetchGenerateTask(this: ApiContext, taskId) {
    const body = await rawApi.get(
      `/v2/ai/generate/tasks/${encodeURIComponent(taskId)}`,
    );
    return takeData<GenerateTask>(body);
  },

  async cancelGenerateTask(this: ApiContext, taskId) {
    const body = await rawApi.post(
      `/v2/ai/generate/tasks/${encodeURIComponent(taskId)}/cancel`,
    );
    return takeData<boolean>(body) ?? false;
  },

  async fetchGenerateHistory(this: ApiContext, type, limit = 30) {
    const query = new URLSearchParams();
    if (type) query.set("type", type);
    query.set("limit", String(limit));
    const body = await rawApi.get(`/v2/ai/generate/tasks?${query.toString()}`);
    return takeData<GenerateTask[]>(body) ?? [];
  },
};
