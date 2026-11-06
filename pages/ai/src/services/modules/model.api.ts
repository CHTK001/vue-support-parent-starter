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
 *
 * <p>免费渠道（free-channel）不走上游目录，模型列表来自供应商 extra.routes
 * 路由表：行是路由键（{@code id}/{@code name} 与 {@code modelName} 均为路由键名），
 * 整体由 {@code route_keys} 标记，未配置路由表时只有 {@code hint} 没有模型——
 * 前端需要展示 {@code hint} 而不是空状态。</p>
 */
export interface RemoteModelsResponse {
  /** 上游鉴权是否成功，缺省视为成功 */
  success?: boolean;
  /** 失败原因，仅 success=false 时有值 */
  error?: string;
  /** 模型列表（顶层） */
  items?: Model[];
  /** 也可能包一层 data */
  data?: Model[] | { items?: Model[]; models?: Model[]; route_keys?: boolean; hint?: string };
  /** 免费渠道：模型行由路由表生成（key 为路由键名，也是模型名） */
  models?: Model[];
  /** 免费渠道：已给出 {@code route_keys} 标记（值为 true，key 是路由键名） */
  route_keys?: boolean;
  /** 免费渠道：未配置路由表（或路由表为空）时的提示，不抛错 */
  hint?: string;
}

/**
 * 一键批量录入的响应（{@code POST /api/providers/{id}/models/import-all}）。
 *
 * <p>{@code skipped} 既包含「库里已存在」也包含「上游条目缺模型名」——
 * 两者都是刻意跳过而非错误，重复点击同一按钮只会补录新模型。</p>
 *
 * <p>{@code enriched} 是「已存在模型行被补全元数据」的条数：上游 {@code /models}
 * 真实声明的上下文窗口、输出上限、能力开关与模态会补进空列（不改别名 / 启用状态 /
 * 排序），所以重复点击同时起到「刷新元数据」的作用。</p>
 */
export interface ImportAllModelsResponse {
  /** 上游返回的模型总数 */
  total: number;
  /** 本次真正写库的条数 */
  imported: number;
  /** 跳过的条数（已存在 / 无模型名 / 上游重复） */
  skipped: number;
  /** 已存在模型行中被补全元数据的条数 */
  enriched?: number;
  /** 新写入的模型行 */
  models?: Model[];
}

export interface ModelApi {
  fetchModels(): Promise<PaginatedResponse<ModelProvider>>;
  fetchAllModels(): Promise<PaginatedResponse<ModelProvider>>;
  fetchRemoteModels(providerId: string): Promise<RemoteModelsResponse>;
  /** 拉取该提供商的全部远端模型并一次性批量录入（幂等） */
  importAllModels(providerId: string, opts?: { tryFix?: boolean }): Promise<ImportAllModelsResponse>;
  /** 按模型名从后台指标端点拉取指标快照，供新增/编辑模型页「自动获取」回填表单 */
  fetchModelMetrics(providerId: string, model: string): Promise<Record<string, any>>;
  createModel(data: any): Promise<Model>;
  updateModel(modelId: string, data: any): Promise<Model>;
  deleteModel(modelId: string): Promise<boolean>;
  batchDeleteProviderModels(ids: string[]): Promise<{ success: boolean; deletedCount: number }>;
  toggleModelFavorite(modelId: string): Promise<any>;
  toggleModelActive(modelId: string): Promise<any>;
  createProvider(data: any): Promise<any>;
  /** 已解包：直接拿到 { success, message, latency }（不是 API 信封） */
  testProviderConnection(data: {
    /** 上游基础地址，如 https://api.openai.com/v1 */
    apiUrl: string;
    /** 待验证的单个 Key */
    apiKey: string;
    /** 协议/平台标识，gemini 走 ?key= 与 Google 响应解析 */
    protocol?: string;
    /** HTTP 代理地址，可空 */
    proxy?: string;
    /** 认证方案（api_key/bearer/none），可空，默认 Bearer */
    auth_scheme?: string;
    /** 认证头名覆盖，可空 */
    auth_header?: string;
    /** 认证值前缀覆盖，可空 */
    auth_prefix?: string;
  }): Promise<{ success: boolean; message?: string; latency?: number | null }>;
  deleteProvider(providerId: string): Promise<boolean>;
  /** 批量删除供应商行（级联其模型与连接，Body 为 ids 数组，整批拦截） */
  batchDeleteProviders(ids: string[]): Promise<{ success: boolean; deletedCount: number }>;
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
 *   - 模型细分类型 → capabilities[0].subtype（OCR/人脸组合模型按管线角色过滤）
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
  const subType = String(data.subType || data.modelSubType || config.subType || config.modelSubType || '').trim();
  const mainCap: Record<string, any> = { task: mainTask, traits };
  if (subType) mainCap.subtype = subType;
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

  async importAllModels(this: ApiContext, providerId: string, opts?: { tryFix?: boolean }) {
    // 与 remote_models 同属 /api 命名空间：后端一次完成「调上游拉目录 + 批量落库」，
    // 前端不再逐条点「选择」。try_fix 与单次拉取同语义（404 时补全 /v1 重试）。
    const body: any = await rawApi.post(
      `/api/providers/${encodeURIComponent(providerId)}/models/import-all`,
      { try_fix: !!opts?.tryFix },
    );
    // rawApi 不解包（unwrap:false）：正常是 { code, data, msg }，data 即统计；
    // 个别出口直接回统计对象，这里统一成统计对象，信封 code!=0 视为业务失败。
    if (body && typeof body.code === 'number' && body.code !== 0) {
      throw new Error(body.msg || `import-all failed with code ${body.code}`);
    }
    const data = body && typeof body === 'object' && 'data' in body ? body.data : body;
    return (data ?? {}) as ImportAllModelsResponse;
  },

  async fetchModelMetrics(this: ApiContext, providerId: string, model: string) {
    // 按模型名从后台指标端点拉快照（新增/编辑模型页「自动获取」按钮）：
    // GET /api/providers/{id}/models/metrics?model=xxx → data{found, family, ...}
    const body: any = await rawApi.get(
      `/api/providers/${encodeURIComponent(providerId)}/models/metrics`,
      { params: { model } },
    );
    if (body && typeof body.code === 'number' && body.code !== 0) {
      throw new Error(body.msg || `fetch metrics failed with code ${body.code}`);
    }
    const data = body && typeof body === 'object' && 'data' in body ? body.data : (body ?? {});
    return (data ?? {}) as Record<string, any>;
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
    // modelId格式：providerId:modelName。模型名本身可含冒号（如 qwen2.5:7b），
    // split(':') 会把模型名截断成 qwen2.5 导致后端 404，故只在第一个冒号处拆分
    const idx = modelId.indexOf(':');
    const providerId = idx > -1 ? modelId.slice(0, idx) : '';
    const modelName = idx > -1 ? modelId.slice(idx + 1) : modelId;
    return await rawApi.delete('/api/provider-models', {
      params: { provider_id: providerId, model: modelName },
    });
  },

  /**
   * 批量删除该供应商下的模型。
   *
   * <p>入参是 {@code providerId:modelName} 复合 id 数组，走后端
   * {@code DELETE /api/provider-models/batch}（body 为 {ids}）；与 {@link deleteModel}
   * 的解析规则一致，模型名含冒号时只在第一个冒号处分隔。</p>
   *
   * <p>注意用 {@code rawApi}：后端路径是 /api/**（不走 /v2 前缀），_request 会把
   * URL 拼成 /v2/api/… 导致 404。</p>
   */
  async batchDeleteProviderModels(this: ApiContext, ids: string[]) {
    return await rawApi.delete('/api/provider-models/batch', { data: { ids } });
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

  /**
   * 用指定 Key 探测上游模型列表，判定该 Key 是否可用（只读、不改库）。
   *
   * <p><b>必须解包信封</b>：rawApi 是 {@code unwrap:false}，后端回的是
   * {@code { success, data }}——外层 success 只表示「这次 HTTP 调用通了」，
   * 真正的测试结论在 {@code data.success / data.message / data.latency} 里。
   * 之前直接返回整包，调用方读 {@code result.success} 恒为 true，
   * 于是错误 Key 也显示「连接成功」（2026-11-06 定位）。</p>
   */
  async testProviderConnection(this: ApiContext, data: any) {
    const body: any = await rawApi.post('/api/providers/test-connection', data);
    const payload = body && typeof body === 'object' && 'data' in body ? body.data : body;
    return (payload ?? { success: false, message: '' }) as {
      success: boolean;
      message?: string;
      latency?: number | null;
    };
  },

  async deleteProvider(this: ApiContext, providerId: string) {
    return await rawApi.delete(`/api/providers/${encodeURIComponent(providerId)}`);
  },

  /**
   * 批量删除供应商行（级联删除其下模型与连接）。
   *
   * <p>走后端 {@code DELETE /api/providers/batch}（Body 为 {ids}，id 为 {@code provider_id}
   * 字符串，空/不存在的 id 整批拦截不部分删除），返回 { success, deletedCount }。</p>
   *
   * <p>注意用 {@code rawApi}：后端路径是 /api/**（不走 /v2 前缀），_request 会把
   * URL 拼成 /v2/api/… 导致 404。</p>
   */
  async batchDeleteProviders(this: ApiContext, ids: string[]) {
    return await rawApi.delete('/api/providers/batch', { data: { ids } });
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
