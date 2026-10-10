/**
 * @pages/ai 管理 API —— 以 UI 配置 ai-starter 的全局能力（提供商 / 模型 / 默认模型与管线）。
 *
 * **后端零改动**：全部打 spring-support-ai-starter 的既有端点，共三种响应信封：
 *   - `/api/**`（ApiResult）：成功 `{success:true, data}`；失败 HTTP 4xx + 内层 `{success:false, code, error}`
 *   - `/v2/settings/**`：框架 `{code, data}` 包着 ApiResult，merged 出口为双层信封 `{code, data:{success, data:[…]}}`
 *   - `/v2/{layout,ocr}/config`（ReturnResult）：`{code, data:[…]}`，PUT 为**整组替换**（管理员）
 *
 * **写层约定（决定走哪个端点，见 SettingsController 的分组名单）**：
 *   - 分组 `models`（默认模型）不在用户隔离名单 → 管理员 `PUT /v2/settings/models` 直接落**全局层**
 *   - 分组 `layout` / `ocr` 在 USER_MODEL_GROUPS → 走 `PUT /v2/settings/{group}` 会落到「本人覆盖层」，
 *     而阅卷/管线的虚拟线程无登录身份只读全局层，必须走 `PUT /v2/{layout,ocr}/config`
 *     （整组替换 + 事件热更新，r45 已验证）
 */
import { ElMessage } from "element-plus";
import { http } from "@repo/utils";

/** 框架成功码 */
const OK = "00000";

/** 提供商模型行（GET /api/provider-models；PUT 响应同形） */
export interface AiProviderModelRow {
  provider_id: string;
  model: string;
  id?: string;
  enabled: boolean;
  sort_order?: number;
  alias?: string;
  description?: string;
  context_window?: number | null;
  max_tokens?: number | null;
  temperature?: number | null;
  top_p?: number | null;
  frequency_penalty?: number | null;
  capabilities?: Array<Record<string, unknown>>;
  metrics?: Record<string, unknown>;
  created_at?: number;
  updated_at?: number;
}

/** 提供商行（GET /api/providers；含嵌套 models 与凭据掩码，不回明文 key 之外的敏感项） */
export interface AiProviderRow {
  provider_id: string;
  platform: string;
  name: string;
  base_url: string;
  auth_scheme: string;
  has_credentials: boolean;
  api_key_count?: number;
  api_key_mask?: string;
  api_keys?: string[];
  enabled: boolean;
  proxy?: string | null;
  extra?: Record<string, unknown> | null;
  sort_order?: number;
  models?: AiProviderModelRow[];
  connections?: Array<Record<string, unknown>>;
  created_at?: number;
  updated_at?: number;
}

/** 分组设置合并视图行（GET /v2/settings/{group}/merged：全局默认 + 本人覆盖） */
export interface SettingsMergedRow {
  group: string;
  field: string;
  value: unknown;
  valueType: string;
  description?: string;
  sort?: number;
  overridden?: boolean;
  systemDefault?: boolean;
  defaultValue?: unknown;
}

/** 管线配置项（GET /v2/{layout,ocr}/config：定义 + 当前全局值） */
export interface PipelineField {
  field: string;
  valueType: string;
  description?: string;
  sort?: number;
  value?: unknown;
}

/** 测试连通的业务负载（2xx 时即使 success=false 也按结果展示，不当错误抛） */
export interface TestConnectionResult {
  success: boolean;
  message?: string;
  latency?: number;
}

/**
 * 剥掉 axios 响应外壳（AxiosResponse 特征：data + status/headers/config）。
 *
 * 本仓 `http()` 有的配置走拦截器预剥、有的透传 AxiosResponse，两种形态都要接住。
 */
function stripAxios(res: unknown): unknown {
  if (
    res &&
    typeof res === "object" &&
    "data" in res &&
    ("status" in res || "headers" in res || "config" in res)
  ) {
    return (res as { data: unknown }).data;
  }
  return res;
}

/**
 * 解开**一层**业务信封：`{code,data}` 或 `{success,data}`。
 *
 * 失败信封（`success:false` / `ok:false` / `code≠00000`）抛带后端文案的 Error。
 * 非信封载荷（数组 / 无信封特征的业务对象）原样返回，可安全重复调用（幂等）。
 */
function unwrap1<T>(res: unknown): T {
  let v = stripAxios(res) as Record<string, unknown> | null | undefined;
  if (v && typeof v === "object" && ("code" in v || "success" in v || "ok" in v)) {
    if (v.success === false || v.ok === false || (v.code !== undefined && v.code !== OK)) {
      const err = new Error(
        String(v.msg || v.error || v.message || "请求失败"),
      ) as Error & { code?: unknown };
      err.code = v.code;
      throw err;
    }
    v = "data" in v ? (v.data as Record<string, unknown>) : v;
  }
  return v as T;
}

/** 解开双层信封（如 merged 出口）；单层场景第二次调用为幂等 no-op，两种形态都安全 */
function unwrap2<T>(res: unknown): T {
  return unwrap1<T>(unwrap1<unknown>(res));
}

/**
 * 从各类失败里取可读文案。
 *
 * 优先级：4xx 体内的内层 error（框架会把外层 msg 写成「操作成功」，不能用）
 * → 业务 reject 的 Error.msg/message → 兜底。
 */
function errText(e: unknown): string {
  const err = e as {
    msg?: string;
    message?: string;
    response?: {
      data?: {
        success?: boolean;
        msg?: string;
        error?: string;
        data?: { success?: boolean; msg?: string; error?: string };
      };
    };
  };
  const d = err?.response?.data;
  const inner = d?.data;
  if (inner && inner.success === false) {
    return inner.error || inner.msg || "请求失败";
  }
  if (d && (d.success === false || d.msg) && d.error) {
    return d.error;
  }
  if (err?.msg) return err.msg;
  if (err?.message) return err.message;
  return "请求失败";
}

/**
 * 统一失败提示。
 *
 * 拦截器已处理的两类不重复弹：① 2xx 业务失败（reject 的 Error 带 `.msg`，拦截器已 toast）；
 * ② 5xx/网络错误（拦截器 toast 后把 `message` 清成 undefined）。
 * 4xx（参数错 / 冲突 / 越权）拦截器不弹，由这里补上真实文案。
 */
export function notifyFail(e: unknown): void {
  const err = e as { msg?: string; message?: string; response?: unknown };
  if (err && typeof err === "object") {
    if (err.msg) return;
    if (err.response && err.message === undefined) return;
  }
  const text = errText(e);
  if (text) ElMessage.error(text);
}

/** 提供商表单 → POST/PUT /api/providers 契约的可选负载 */
export interface ProviderPayload {
  provider_id?: string;
  platform?: string;
  name?: string;
  base_url?: string;
  auth_scheme?: string;
  credentials?: Record<string, unknown>;
  extra?: Record<string, unknown> | null;
  proxy?: string | null;
  enabled?: boolean;
  sort_order?: number;
}

/** 模型表单 → PUT /api/provider-models 的 model 节点（缺省键不下发，靠后端 containsKey 合并语义保留原值） */
export interface ModelPayload {
  model: string;
  alias?: string;
  description?: string;
  enabled?: boolean;
  sort_order?: number;
  context_window?: number | null;
  max_tokens?: number | null;
  temperature?: number | null;
  top_p?: number | null;
  frequency_penalty?: number | null;
  capabilities?: Array<Record<string, unknown>>;
}

export const aiAdminApi = {
  // ==================== 提供商（/api/providers，ApiResult{success,data}） ====================
  /** 全部提供商（含嵌套 models、凭据掩码与已存 key 列表） */
  listProviders: () =>
    http().get("/api/providers").then<AiProviderRow[]>(unwrap1),

  /** 新增提供商；provider_id 留空由后端生成；credentials 缺省即未配置密钥 */
  createProvider: (body: ProviderPayload) =>
    http().post("/api/providers").data(body).then<AiProviderRow>(unwrap1),

  /** 更新提供商：containsKey 合并语义，未出现的键（如 credentials）保持原值 */
  updateProvider: (providerId: string, body: ProviderPayload) =>
    http()
      .put(`/api/providers/${encodeURIComponent(providerId)}`)
      .data(body)
      .then<AiProviderRow>(unwrap1),

  /** 删除提供商（级联删模型与连接；onnx 内置单行后端拒绝删除） */
  deleteProvider: (providerId: string) =>
    http()
      .delete(`/api/providers/${encodeURIComponent(providerId)}`)
      .then<unknown>(unwrap1),

  /** 测试连通：结果在 2xx 载荷里（success/message/latency），失败是业务结果不抛 */
  testConnection: (body: {
    apiUrl: string;
    apiKey: string;
    protocol?: string;
    proxy?: string | null;
    auth_scheme?: string;
    auth_header?: string;
    auth_prefix?: string;
  }) =>
    http()
      .post("/api/providers/test-connection")
      .data(body)
      .then<TestConnectionResult>(unwrap1),

  /** 逐把测试已保存的密钥：{total, ok_count, results[]} */
  testKeys: (providerId: string) =>
    http()
      .post(`/api/providers/${encodeURIComponent(providerId)}/test-keys`)
      .data({})
      .then<{ total: number; ok_count: number; results: Array<Record<string, unknown>> }>(unwrap1),

  /** 一键导入上游全部模型：{total, imported, skipped}（幂等，已存在的跳过） */
  importAllModels: (providerId: string) =>
    http()
      .post(`/api/providers/${encodeURIComponent(providerId)}/models/import-all`)
      .data({})
      .then<{ total?: number; imported?: number; skipped?: number }>(unwrap1),

  // ==================== 模型（/api/provider-models） ====================
  /** 模型行列表（可按提供商过滤） */
  listModels: (providerId?: string) => {
    const req = http().get("/api/provider-models");
    return (providerId ? req.query({ provider_id: providerId }) : req).then<
      AiProviderModelRow[]
    >(unwrap1);
  },

  /** 新增/更新模型行：同 (provider_id, model) 即更新；model 内为 containsKey 合并语义 */
  saveModel: (providerId: string, model: ModelPayload) =>
    http()
      .put("/api/provider-models")
      .data({ provider_id: providerId, model })
      .then<AiProviderModelRow>(unwrap1),

  /** 删除模型行 */
  deleteModel: (providerId: string, model: string) =>
    http()
      .delete("/api/provider-models")
      .query({ provider_id: providerId, model })
      .then<unknown>(unwrap1),

  // ==================== 设置（/v2/settings，写层见文件头注释） ====================
  /** 分组合并视图（全局默认 + 本人覆盖；管理员无覆盖时 value 即全局值） */
  fetchMergedGroup: (group: string) =>
    http()
      .get(`/v2/settings/${encodeURIComponent(group)}/merged`)
      .then<SettingsMergedRow[]>(unwrap2),

  /**
   * 写分组设置：扁平 `{field: value}`。
   * 管理员写非用户隔离分组（如 models）= 落全局层并触发热更新。
   */
  saveGlobalGroup: (group: string, settings: Record<string, unknown>) =>
    http()
      .put(`/v2/settings/${encodeURIComponent(group)}`)
      .data(settings)
      .then<unknown>(unwrap1),

  // ==================== 管线配置（/v2/{layout,ocr}/config，整组替换） ====================
  /** 管线配置项（定义 + 当前全局值） */
  fetchPipelineConfig: (capability: "layout" | "ocr") =>
    http().get(`/v2/${capability}/config`).then<PipelineField[]>(unwrap1),

  /** 管线配置整组替换：必须回传 GET 拿到的**全集**字段（只改 value），缺项会被 replace 掉 */
  savePipelineConfig: (
    capability: "layout" | "ocr",
    fields: Array<PipelineField & { value: unknown }>,
  ) =>
    http()
      .put(`/v2/${capability}/config`)
      .data({ fields })
      .then<unknown>(unwrap1),
};
