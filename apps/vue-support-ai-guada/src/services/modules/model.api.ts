import { createClient, rootHttp } from '@/framework/context';
import type { ApiContext } from "./api-context";
import type { Model, ModelProvider } from "@/types/api";
import type { PaginatedResponse } from "@/types/common";

/** /api/** 管理接口客户端：不解包，返回值与后端统一响应体 {code,data,msg} 一致 */
const rawApi = createClient(rootHttp, { unwrap: false });

/**
 * 远端模型列表接口的响应信封。
 *
 * 后端在鉴权失败时也返回 200 + success:false，因此 success/error 是必备字段；
 * items 与 data 可能同时缺失（失败分支），也可能二选一（成功分支的两种形态）。
 */
export interface RemoteModelsEnvelope {
  success?: boolean;
  msg?: string;
  error?: string;
  items?: any[];
  data?: { items?: any[] } | any[] | null;
}

export interface ModelApi {
  fetchModels(): Promise<PaginatedResponse<ModelProvider>>;
  fetchAllModels(): Promise<PaginatedResponse<ModelProvider>>;
  /**
   * 拉取供应商远端模型列表。
   *
   * 返回的是后端原始信封（可能 200 + success:false），不是分页结构：
   * 鉴权失败时后端也返回 200，因此调用方必须显式判 success。
   */
  fetchRemoteModels(providerId: string): Promise<RemoteModelsEnvelope>;
  createModel(data: any): Promise<Model>;
  updateModel(modelId: string, data: any): Promise<Model>;
  deleteModel(modelId: string): Promise<boolean>;
  toggleModelFavorite(modelId: string): Promise<any>;
  toggleModelActive(modelId: string): Promise<any>;
  createProvider(data: any): Promise<any>;
  testProviderConnection(data: any): Promise<{ success: boolean; message: string }>;
  deleteProvider(providerId: string): Promise<boolean>;
  updateProvider(providerId: string, data: any): Promise<any>;
  getProviderTemplates(): Promise<any[]>;
  getModelPresets(): Promise<any[]>;
}

/**
 * 前端模型表单 → 后端 PUT /api/provider-models 契约。
 *
 * 输入/输出能力与高级特性统一编码进 capabilities[].traits，复用已有的 JSON 列，
 * 不新增数据库字段：
 *   - 输入/输出能力 → traits 里的 `input:image` / `output:image`
 *   - 高级特性     → 追加一条 capability，task 取 tools / thinking / web-search
 *     （与 model.utils 的 FEATURE_TASKS 约定一致，读取时按 task 还原）
 * 窗口与采样参数直接映射到 sys_ai_provider_model 的同名列；null 表示「未指定」，
 * 模型卡片会回退到指标表（sys_ai_model_metrics）的官方值。
 */
function buildProviderModelBody(data: any) {
  const config = data.config || {};
  const caps = Array.isArray(data.capabilities) ? data.capabilities : [];
  const mainTask = caps[0]?.task || "chat";
  const toList = (v: any): string[] => (Array.isArray(v) ? v.filter(Boolean) : []);
  const traits = [
    ...toList(config.inputCapabilities).map((k) => `input:${k}`),
    ...toList(config.outputCapabilities).map((k) => `output:${k}`),
  ];
  const featureCaps = toList(config.features).map((f) => ({ task: f, traits: [] }));
  const numOrNull = (v: any) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));

  const model: Record<string, any> = {
    model: data.modelName || data.model || data.name,
    alias: data.alias || "",
    sort_order: data.sort_order || 0,
    capabilities: [{ task: mainTask, traits }, ...featureCaps],
    context_window: numOrNull(config.contextWindow),
    max_tokens: numOrNull(config.maxOutputTokens),
    temperature: numOrNull(config.temperature),
    top_p: numOrNull(config.topP),
    frequency_penalty: numOrNull(config.frequencyPenalty),
  };
  // 生成参数（image / video）：随模型走 capabilities[].generate 节点。
  // 后端 GenerateConfigSupport 读同一节点，「图像生成」页据此渲染分辨率/张数/参考图。
  const gen = config.generate;
  if (gen && (mainTask === "image_generation" || mainTask === "video_generation")) {
    model.generate = {
      referenceImage: !!gen.referenceImage,
      negativePrompt: gen.negativePrompt !== false,
      seed: gen.seed !== false,
      maxCount: Math.max(1, Number(gen.maxCount) || 1),
      sizes: Array.isArray(gen.sizes) && gen.sizes.length ? gen.sizes : ["1024x1024"],
      durations: Array.isArray(gen.durations) ? gen.durations : [],
      stepsMin: gen.stepsMin ?? null,
      stepsMax: gen.stepsMax ?? null,
      stepsDefault: gen.stepsDefault ?? null,
    };
  }
  // 模型弹框没有这两项，编辑时不下发以免把已有值覆盖成默认值
  if (data.enabled !== undefined) model.enabled = data.enabled !== false;
  if (data.description !== undefined) model.description = data.description;

  return { provider_id: data.providerId, model };
}

export const modelApi: ModelApi = {
  async fetchModels(this: ApiContext): Promise<PaginatedResponse<ModelProvider>> {
    // 调用 /api/providers 获取供应商和模型数据
    const body = await rawApi.get('/api/providers');
    const items = ((body as any)?.data ?? []) as ModelProvider[];
    // 转换成前端期望的分页格式：该接口一次返回全量，分页字段按实际条数补齐
    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
      hasNext: false,
      hasPrev: false,
    };
  },

  async fetchAllModels(this: ApiContext) {
    return await this._request("/models/all");
  },

  async fetchRemoteModels(this: ApiContext, providerId: string) {
    // 后端接口在 /api/providers/...，不是 /v2/providers/...
    return await rawApi.get(`/api/providers/${encodeURIComponent(providerId)}/remote_models`);
  },

  async createModel(this: ApiContext, data: any) {
    return await rawApi.put('/api/provider-models', buildProviderModelBody(data));
  },

  // 注意：运行时签名是 (modelId, data)，modelId 由调用方传入但后端按 body 里的
  // provider_id + model 定位复合主键，这里仅保留形参以维持调用契约
  async updateModel(this: ApiContext, modelId: string, data: any) {
    return await rawApi.put('/api/provider-models', buildProviderModelBody(data));
  },

  async deleteModel(this: ApiContext, modelId: string) {
    // 后端接口格式：DELETE /api/provider-models?provider_id=xxx&model=xxx
    // modelId格式：providerId:modelName
    const [providerId, modelName] = modelId.split(':');
    return await rawApi.delete('/api/provider-models', {
      params: { provider_id: providerId, model: modelName },
    });
  },

  async toggleModelFavorite(this: ApiContext, modelId: string) {
    return await this._request(`/models/${encodeURIComponent(modelId)}/favorite`, {
      method: "PUT",
    });
  },

  async toggleModelActive(this: ApiContext, modelId: string) {
    return await this._request(`/models/${encodeURIComponent(modelId)}/toggle-active`, {
      method: "PUT",
    });
  },

  async createProvider(this: ApiContext, data: any) {
    return await rawApi.post('/api/providers', data);
  },

  async testProviderConnection(this: ApiContext, data: any) {
    return await rawApi.post('/api/providers/test-connection', data);
  },

  async deleteProvider(this: ApiContext, providerId: string) {
    return await rawApi.delete(`/api/providers/${encodeURIComponent(providerId)}`);
  },

  async updateProvider(this: ApiContext, providerId: string, data: any) {
    return await rawApi.put(`/api/providers/${encodeURIComponent(providerId)}`, data);
  },

  async getProviderTemplates(this: ApiContext) {
    return await this._request("/providers/templates");
  },

  async getModelPresets(this: ApiContext) {
    return await this._request("/models/presets");
  },
};
