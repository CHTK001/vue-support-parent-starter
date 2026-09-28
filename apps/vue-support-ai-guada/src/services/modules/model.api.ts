import { createClient, rootHttp } from '@/framework/context';
import type { ApiContext } from "./api-context";
import type { Model, ModelProvider } from "@/types/api";
import type { PaginatedResponse } from "@/types/common";

/** /api/** 管理接口客户端：不解包，返回值与后端统一响应体 {code,data,msg} 一致 */
const rawApi = createClient(rootHttp, { unwrap: false });

/**
 * 拉取上游模型列表的响应。
 *
 * <p>该端点（{@code GET /api/providers/{id}/remote_models}）由外部 API 提供，
 * 不走统一分页信封：上游鉴权失败时返回 200 + {@code success:false}（避免被
 * 前端误判为会话过期而登出），成功时模型列表可能落在 {@code items}、
 * {@code data.items} 或 {@code data} 数组三种位置。</p>
 */
export interface RemoteModelsResponse {
  /** 上游鉴权是否成功，缺省视为成功 */
  success?: boolean;
  /** 失败原因，仅 success=false 时有值 */
  error?: string;
  /** 模型列表（顶层） */
  items?: Model[];
  /** 也可能包一层 data */
  data?: Model[] | { items?: Model[] };
}

export interface ModelApi {
  fetchModels(): Promise<PaginatedResponse<ModelProvider>>;
  fetchAllModels(): Promise<PaginatedResponse<ModelProvider>>;
  fetchRemoteModels(providerId: string): Promise<RemoteModelsResponse>;
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

  // 生成参数（image / video）：必须挂在 capabilities[0].generate 下。
  // 后端 GenerateConfigSupport 只从该节点读取，SysAiProviderModel 也没有顶层 generate 字段——
  // 之前放在 model.generate 顶层会被直接丢弃，导致模型表单里的生成参数存不下去。
  const gen = config.generate;
  const mainCap: Record<string, any> = { task: mainTask, traits };
  if (gen && (mainTask === "image_generation" || mainTask === "video_generation")) {
    mainCap.generate = {
      referenceImage: !!gen.referenceImage,
      negativePrompt: gen.negativePrompt !== false,
      seed: gen.seed !== false,
      maxCount: Math.max(1, Number(gen.maxCount) || 1),
      sizes: Array.isArray(gen.sizes) && gen.sizes.length ? gen.sizes : ["1024x1024"],
      durations: Array.isArray(gen.durations) ? gen.durations : [],
      stepsMin: gen.stepsMin ?? null,
      stepsMax: gen.stepsMax ?? null,
      stepsDefault: gen.stepsDefault ?? null,
      // style 表示「允许在提示词里附加风格描述」，不是上游参数；默认 true，
      // 仅模型显式 false 时前端隐藏风格入口
      style: gen.style !== false,
      ...(Array.isArray(gen.styles) && gen.styles.length ? { styles: gen.styles } : {}),
    };
  }

  const model: Record<string, any> = {
    model: data.modelName || data.model || data.name,
    alias: data.alias || "",
    sort_order: data.sort_order || 0,
    capabilities: [mainCap, ...featureCaps],
    context_window: numOrNull(config.contextWindow),
    max_tokens: numOrNull(config.maxOutputTokens),
    temperature: numOrNull(config.temperature),
    top_p: numOrNull(config.topP),
    frequency_penalty: numOrNull(config.frequencyPenalty),
  };
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
