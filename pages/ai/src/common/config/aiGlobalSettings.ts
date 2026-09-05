import { httpRequest } from '@/common/adapter/httpBridge';

/**
 * 后端 `/v2/global-settings` 的扁平字段模型（对应 `AiGlobalSettingDTO`）。
 *
 * <p>作为前端统一配置面：AI 运行时参数（默认模型/温度/max tokens/超时）、用量分析
 * 与 RAG（Embedding/向量库/切片）等全部收敛到一个类型安全封装，不再在 UI 上散落
 * `?? 0.7` 之类的硬编码默认值。</p>
 */
export type AiGlobalSettings = {
  /** 是否启用 ChatClient 聚合 */
  chatClientEnabled?: boolean;
  /** 是否启用用量分析 */
  enableUsageAnalysis?: boolean;
  /** 用量上报间隔（秒） */
  usageReportInterval?: number;
  /** 默认模型 */
  defaultModel?: string;
  /** 默认温度（0~2） */
  temperature?: number;
  /** 默认最大 tokens */
  maxTokens?: number;
  /** 默认请求超时（秒） */
  timeout?: number;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 是否流式输出 */
  stream?: boolean;
  /** 全局 ChatClient 默认系统提示词 */
  systemPrompt?: string;
  /** RAG 向量模型/Embedding 引擎 */
  ragEmbeddingModel?: string;
  /** RAG 问答 LLM 模型 */
  ragLlmModel?: string;
  /** RAG OCR 识别模型 */
  ragOcrModel?: string;
  /** RAG 上传文件目录 */
  ragUploadDir?: string;
  /** RAG 向量数据库 */
  ragVectorStorage?: string;
  /** RAG 问答系统提示词 */
  ragSystemPrompt?: string;
  /** RAG 文本切片大小（字符） */
  ragChunkSize?: number;
  /** RAG 文本切片重叠（字符） */
  ragChunkOverlap?: number;
  /** RAG 文本切片策略 */
  ragSplitter?: string;
  /**
   * 创意工坊资产存储目录。映射后端 workshop.storage_dir。
   */
  workshopStorageDir?: string;
  /** 创意工坊单次上传大小上限（MB）。映射后端 workshop.max_upload_size_mb。 */
  workshopMaxUploadSizeMb?: number;
  /** 创意工坊上传文件后缀白名单（逗号分隔，如 jpg,png,webp,mp4；空 = 不限制）。映射 workshop.allowed_extensions。 */
  workshopAllowedExtensions?: string;
  /** 是否启用聚合协议服务（OpenAI/Claude/Gemini 兼容端点）。映射 runtime.protocol_server_enabled。 */
  protocolServerEnabled?: boolean;
  /** 聚合协议服务端口。映射 runtime.protocol_server_port。 */
  protocolServerPort?: number;
  /** [前端扩展字段] 用量同步数据源白名单（逗号分隔，空 = 全部启用）。同上，保存时被忽略。 */
  usageEnabledParsers?: string;
};

/** 受支持字段集合（写回时剔除未知字段，避免脏数据上行） */
const AI_GLOBAL_SETTINGS_KEYS = new Set<keyof AiGlobalSettings>([
  'chatClientEnabled',
  'enableUsageAnalysis',
  'usageReportInterval',
  'defaultModel',
  'temperature',
  'maxTokens',
  'timeout',
  'enableCache',
  'stream',
  'systemPrompt',
  'ragEmbeddingModel',
  'ragLlmModel',
  'ragOcrModel',
  'ragUploadDir',
  'ragVectorStorage',
  'ragSystemPrompt',
  'ragChunkSize',
  'ragChunkOverlap',
  'ragSplitter',
  'workshopStorageDir',
  'workshopMaxUploadSizeMb',
  'workshopAllowedExtensions',
  'protocolServerEnabled',
  'protocolServerPort',
]);

/** 拉取全局设置 */
export async function loadAiGlobalSettings(): Promise<AiGlobalSettings> {
  const res = await httpRequest<Record<string, unknown>>('GET', '/v2/global-settings');
  if (res == null || typeof res !== 'object') return {};
  const out: AiGlobalSettings = {};
  for (const key of Object.keys(res) as (keyof AiGlobalSettings)[]) {
    if (AI_GLOBAL_SETTINGS_KEYS.has(key)) {
      (out as Record<string, unknown>)[key] = res[key];
    }
  }
  return out;
}

/** 保存全局设置（仅上行受支持字段） */
export async function saveAiGlobalSettings(values: Partial<AiGlobalSettings>): Promise<void> {
  const body: Record<string, unknown> = {};
  for (const key of Object.keys(values) as (keyof AiGlobalSettings)[]) {
    if (AI_GLOBAL_SETTINGS_KEYS.has(key)) {
      body[key] = values[key];
    }
  }
  await httpRequest<void>('PUT', '/v2/global-settings', body);
}

/**
 * 默认值（与后端 `RuntimeGlobalSettingProvider` / `RagProperties` 保持一致）。
 * 前端所有读取点都应通过下方访问器 fallback 到这些值，杜绝散落硬编码。
 */
export const AI_GLOBAL_SETTINGS_DEFAULTS: Required<AiGlobalSettings> = {
  chatClientEnabled: true,
  enableUsageAnalysis: true,
  usageReportInterval: 300,
  defaultModel: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 30,
  enableCache: true,
  stream: true,
  systemPrompt: '',
  ragEmbeddingModel: 'memory',
  ragLlmModel: '',
  ragOcrModel: '',
  ragUploadDir: '',
  ragVectorStorage: 'jvector',
  ragSystemPrompt: '',
  ragChunkSize: 1000,
  ragChunkOverlap: 200,
  ragSplitter: 'sentence',
  workshopStorageDir: '',
  workshopMaxUploadSizeMb: 100,
  workshopAllowedExtensions: '',
  protocolServerEnabled: false,
  protocolServerPort: 8090,
  usageEnabledParsers: '',
};

/** 类型安全读取：布尔值（后端可能存 "true"/"1"/"yes"） */
export function aiBool(v: AiGlobalSettings, key: keyof AiGlobalSettings, def: boolean): boolean {
  const value = v[key];
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null) return def;
  const s = String(value).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

/** 类型安全读取：数值（后端可能存字符串数字） */
export function aiNum(v: AiGlobalSettings, key: keyof AiGlobalSettings, def: number): number {
  const value = v[key];
  if (value === undefined || value === null || value === '') return def;
  const n = Number(value);
  return Number.isFinite(n) ? n : def;
}

/** 类型安全读取：字符串 */
export function aiStr(v: AiGlobalSettings, key: keyof AiGlobalSettings, def = ''): string {
  const value = v[key];
  if (value === undefined || value === null) return def;
  return String(value);
}

/** 类型安全读取：可空数值（用于受控 InputNumber 的 value，空值返回 undefined） */
export function aiNumOrUndefined(v: AiGlobalSettings, key: keyof AiGlobalSettings): number | undefined {
  const value = v[key];
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}