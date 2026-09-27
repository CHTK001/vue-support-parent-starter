/**
 * 后端 API 服务封装
 *
 * 统一使用 Vue 体系的请求模块（@repo/utils 的 Http + @repo/core createApp 注入的
 * 鉴权拦截器实例），不自行 axios.create / fetch；Authorization 头与 401/403 处理
 * 全部由框架拦截器负责，业务侧不再读写 localStorage 里的 token。
 */
import { createClient, rootHttp, v2Http } from '@/framework/context';

// ==================== 客户端：统一走 @repo/utils 请求模块，不解包（调用方拿 {code,data,msg}） ====================
// /v2 接口客户端（常规业务：models / sessions / chat / usage / settings ...）
const http = createClient(v2Http, { unwrap: false });
// 根路径客户端（管理类：model-metrics / mcp / agents / services / skills，控制器不在 /v2 下）
const apiHttp = createClient(rootHttp, { unwrap: false });

// ==================== 模型管理 ====================
export const modelApi = {
  list: (params?: any) => http.get('/models', { params }),
  create: (data: any) => http.post('/models', data),
  update: (id: string, data: any) => http.put(`/models/${id}`, data),
  delete: (id: string) => http.delete(`/models/${id}`),
  testLatency: (id: string) => http.post(`/models/${id}/test-latency`),
  pipelines: () => http.get('/models/pipelines'),
  get: (id: string) => http.get(`/models/${id}`),
};

// ==================== 多Key管理 (AppKey / ManufacturerKey) ====================
export const appKeyApi = {
  list: (params?: any) => http.get('/app-keys', { params }),
  create: (data: any) => http.post('/app-keys', data),
  update: (id: string, data: any) => http.put(`/app-keys/${id}`, data),
  delete: (id: string) => http.delete(`/app-keys/${id}`),
};

/** 厂商目录（厂商 Key 的归属厂商，用于表单选择器） */
export const manufacturerApi = {
  list: () => http.get('/manufacturer/list'),
};

export const manufacturerKeyApi = {
  list: () => http.get('/manufacturer-key/list'),
  listByCode: (manufacturerCode: string) =>
    http.get('/manufacturer-key/list-by-code', { params: { manufacturerCode } }),
  create: (data: any) => http.post('/manufacturer-key/save', data),
  update: (data: any) => http.put('/manufacturer-key/update', data),
  delete: (id: string | number) => http.delete('/manufacturer-key/delete', { params: { id } }),
  toggle: (id: string | number, enabled: boolean) =>
    http.put('/manufacturer-key/toggle', null, { params: { id, enabled } }),
};

// ==================== 角色管理 ====================
export const roleApi = {
  list: (params?: any) => http.get('/roles', { params }),
  create: (data: any) => http.post('/roles', data),
  update: (id: string, data: any) => http.put(`/roles/${id}`, data),
  delete: (id: string) => http.delete(`/roles/${id}`),
};

// ==================== MCP 管理 ====================
export const mcpApi = {
  // 服务器 CRUD（/api/mcp/servers）
  list: (params?: any) => apiHttp.get('/api/mcp/servers', { params }),
  create: (data: any) => apiHttp.post('/api/mcp/servers', data),
  importServers: (data: any) => apiHttp.post('/api/mcp/servers/import', data),
  update: (id: string, data: any) => apiHttp.put(`/api/mcp/servers/${id}`, data),
  delete: (id: string) => apiHttp.delete(`/api/mcp/servers/${id}`),
  toggle: (id: string, enabled: boolean) =>
    apiHttp.post(`/api/mcp/servers/${id}/toggle`, { enabled }),
  testConnection: (data: any) => apiHttp.post('/api/mcp/test-connection', data),
  // 来源清单（/api/mcp/catalog）：内置推荐 / 在线检索 / 来源开关
  catalogConfig: () => apiHttp.get('/api/mcp/catalog/config'),
  updateCatalogConfig: (data: any) => apiHttp.put('/api/mcp/catalog/config', data),
  builtin: () => apiHttp.get('/api/mcp/catalog/builtin'),
  online: (keyword?: string) =>
    apiHttp.get('/api/mcp/catalog/online', { params: { keyword } }),
};

// ==================== Agent 管理 ====================
export const agentApi = {
  list: (params?: any) => apiHttp.get('/api/agents/managed', { params }),
  create: (data: any) => apiHttp.post('/api/agents/managed', data),
  update: (id: string, data: any) => apiHttp.put(`/api/agents/managed/${id}`, data),
  delete: (id: string) => apiHttp.delete(`/api/agents/managed/${id}`),
  get: (id: string) => apiHttp.get(`/api/agents/managed/${id}`),
  // 子Agent管理（主从工作流）
  listSubAgents: (agentId: string) =>
    apiHttp.get(`/api/agents/managed/${agentId}/sub-agents`),
  addSubAgent: (agentId: string, data: any) =>
    apiHttp.post(`/api/agents/managed/${agentId}/sub-agents`, data),
  updateSubAgent: (agentId: string, subId: string, data: any) =>
    apiHttp.put(`/api/agents/managed/${agentId}/sub-agents/${subId}`, data),
  deleteSubAgent: (agentId: string, subId: string) =>
    apiHttp.delete(`/api/agents/managed/${agentId}/sub-agents/${subId}`),
  // 编排配置
  getOrchestration: (agentId: string) =>
    apiHttp.get(`/api/agents/managed/${agentId}/orchestration`),
  saveOrchestration: (agentId: string, data: any) =>
    apiHttp.post(`/api/agents/managed/${agentId}/orchestration`, data),
  runOrchestration: (agentId: string, data: any) =>
    apiHttp.post(`/api/agents/managed/${agentId}/orchestration/run`, data),
  // 注册为模型
  registerAsModel: (agentId: string) =>
    apiHttp.post(`/api/agents/managed/${agentId}/register`),
  unregisterModel: (agentId: string) =>
    apiHttp.delete(`/api/agents/managed/${agentId}/register`),
  getRegisteredModel: (agentId: string) =>
    apiHttp.get(`/api/agents/managed/${agentId}/registered-model`),
  listRegisteredModels: () =>
    apiHttp.get('/api/agents/managed/registered-models'),
  rebuild: (agentId: string) =>
    apiHttp.post(`/api/agents/managed/${agentId}/rebuild`),
  // ==================== 智能体安装包（安装/配置） ====================
  // 磁盘上已安装的智能体包（{nomifun.agents-root}/user|builtin）
  packages: () => apiHttp.get('/api/agents/packages'),
  packagePaths: () => apiHttp.get('/api/agents/packages/paths'),
  // 导入：{ path } 本地目录；或 FormData(file) 上传 zip
  importPackage: (data: any) => apiHttp.post('/api/agents/packages/import', data),
  // 从市场源安装：{ source, path|url }
  installPackage: (data: any) => apiHttp.post('/api/agents/packages/install', data),
  togglePackage: (name: string, enabled: boolean) =>
    apiHttp.post('/api/agents/packages/toggle', { name, enabled }),
  uninstallPackage: (name: string) =>
    apiHttp.delete(`/api/agents/packages/${encodeURIComponent(name)}`),
  marketSources: () => apiHttp.get('/api/agents/packages/market/sources'),
  marketSearch: (params?: any) =>
    apiHttp.get('/api/agents/packages/market/search', { params }),
};

// ==================== 服务管理（后端仅有状态查询与按名启停，无 CRUD） ====================
export const serviceApi = {
  /** 出口返回统一信封 {code,data,msg}，data 为 List<AiServiceStatusDTO> */
  list: () => http.get('/services/status'),
  start: (serviceName: string) => http.post(`/services/${encodeURIComponent(serviceName)}/start`),
  stop: (serviceName: string) => http.post(`/services/${encodeURIComponent(serviceName)}/stop`),
};

// ==================== 用量管理 ====================
export const usageApi = {
  statistics: (params?: any) => http.get('/usage/statistics', { params }),
  /** 按 分组+服务商+模型 聚合（模型/分组分布数据源，只含实际用过的模型） */
  list: (params?: any) => http.get('/usage', { params }),
  /** 分页用量明细（页面下方明细表） */
  detailList: (params?: any) => http.get('/usage/list', { params }),
  /** 按天趋势（Token 趋势图） */
  trend: (params?: any) => http.get('/usage/trend', { params }),
  syncLogs: (params?: any) => http.get('/usage/sync-logs', { params }),
  parsers: (params?: any) => http.get('/usage/parsers', { params }),
  taskStatus: (params?: any) => http.get('/usage/task-status', { params }),
  /** 手动触发一次同步 + 当天聚合 */
  sync: () => http.post('/usage/trigger'),
  /** 仅聚合当天 */
  aggregate: () => http.post('/usage/aggregate'),
  /** 全量回填日汇总表（异步；重复点击会取消前一次任务） */
  syncAll: () => http.post('/usage/aggregate-all'),
  cancelSyncAll: () => http.post('/usage/aggregate-all/cancel'),
  export: (params?: any) =>
    http.get('/usage/export', { params, responseType: 'blob' }),
  config: () => http.get('/usage/config'),
  updateConfig: (data: any) => http.put('/usage/config', data),
};

// ==================== 模型指标采集 ====================
export const modelMetricsApi = {
  /** 分页查询全量指标库 */
  table: (params: { page?: number; size?: number; keyword?: string }) =>
    apiHttp.get('/api/model-metrics/table', { params }),
  /** 旧版快照（兼容） */
  list: (params?: any) => apiHttp.get('/api/model-metrics', { params }),
  refresh: () => apiHttp.post('/api/model-metrics/refresh'),
  getConfig: () => apiHttp.get('/api/model-metrics/config'),
  updateConfig: (data: any) => apiHttp.put('/api/model-metrics/config', data),
  syncPricing: () => apiHttp.post('/api/model-metrics/sync-pricing'),
  saveManual: (data: {
    key: string;
    values?: Record<string, number>; locked: string[]; operator?: string;
  }) => apiHttp.put('/api/model-metrics/manual', data),
};

// ==================== 聊天会话/上下文 ====================
export const chatApi = {
  sessions: (params?: any) => http.get('/chat/sessions', { params }),
  sessionDetail: (sessionId: string) =>
    http.get(`/chat/sessions/${sessionId}`),
  sessionContext: (sessionId: string) =>
    http.get(`/chat/sessions/${sessionId}/context`),
  messages: (sessionId: string, params?: any) =>
    http.get(`/chat/sessions/${sessionId}/messages`, { params }),
  sendMessage: (sessionId: string, data: any) =>
    http.post(`/chat/sessions/${sessionId}/messages`, data),
  createSession: (data: any) => http.post('/chat/sessions', data),
  deleteSession: (sessionId: string) =>
    http.delete(`/chat/sessions/${sessionId}`),
};

// ==================== Skills 管理 ====================
export const skillsApi = {
  /** 已安装技能清单（含启用状态与正文字数），管理列表与搜索弹层共用 */
  installed: () => apiHttp.get('/api/skills/installed'),
  /** 启用/停用某个已安装技能（停用即不再注入对话）；source 用于区分 builtin/user 同名技能 */
  toggle: (name: string, enabled: boolean, source?: string) =>
    apiHttp.post(`/api/skills/${encodeURIComponent(name)}/toggle`, { enabled, source }),
  /** 卸载（删除 skillsRoot/user 下的技能目录） */
  uninstall: (name: string) => apiHttp.delete(`/api/skills/${encodeURIComponent(name)}`),
  /** 在线市场搜索：后端按市场源 SPI 扇出，search 为空即浏览榜单 */
  marketSearch: (params: { search?: string; page?: number; limit?: number; sortBy?: string }) =>
    apiHttp.get('/api/skills/market/search', { params }),
  /** 安装市场条目：真实下载 GitHub 目录到 skillsRoot/user */
  marketInstall: (data: { source: string; id: string; url: string; path?: string }) =>
    apiHttp.post('/api/skills/market/package/install', data),
  /** 预览市场条目：按 GitHub 仓库地址 + 子目录拉取 SKILL.md（不落盘） */
  marketContent: (data: { url: string; path?: string }) =>
    apiHttp.post('/api/skills/market/content', data),
};

// ==================== 插件管理 ====================
export const pluginsApi = {
  list: (params?: any) => http.get('/plugins-config', { params }),
  create: (data: any) => http.post('/plugins-config', data),
  update: (id: string, data: any) => http.put(`/plugins-config/${id}`, data),
  delete: (id: string) => http.delete(`/plugins-config/${id}`),
};

// ==================== 系统设置 ====================
export const settingsApi = {
  // 全局设置
  globalBeans: (group: string) => http.get(`/global-settings/${group}`),
  updateGlobalBeans: (group: string, data: any) =>
    http.put(`/global-settings/${group}`, data),
  globalSettingsList: () => http.get('/global-settings'),

  // 用量配置
  usageConfig: () => http.get('/usage/config'),
  updateUsageConfig: (data: any) => http.put('/usage/config', data),

  // Skills配置
  skillsConfig: () => http.get('/settings/skills-config'),
  updateSkillsConfig: (data: any) => http.put('/settings/skills-config', data),

  // 各管线配置
  ocrConfig: () => http.get('/ocr/config'),
  updateOcrConfig: (data: any) => http.put('/ocr/config', data),
  layoutConfig: () => http.get('/layout/config'),
  updateLayoutConfig: (data: any) => http.put('/layout/config', data),
  faceConfig: () => http.get('/face/config'),
  updateFaceConfig: (data: any) => http.put('/face/config', data),
  imageRecognitionConfig: () => http.get('/image-recognition/config'),
  updateImageRecognitionConfig: (data: any) =>
    http.put('/image-recognition/config', data),
  generateConfig: () => http.get('/generate/config'),
  updateGenerateConfig: (data: any) => http.put('/generate/config', data),

  // Agent配置
  agentConfig: () => http.get('/agent-config'),
  updateAgentConfig: (data: any) => http.put('/agent-config', data),

  // RAG配置
  ragConfig: () => http.get('/rag'),
  updateRagConfig: (data: any) => http.put('/rag', data),

  // 角色/MCP/插件SPI配置
  rolesConfig: () => http.get('/settings/roles-config'),
  updateRolesConfig: (data: any) => http.put('/settings/roles-config', data),
  mcpConfig: () => http.get('/settings/mcp-config'),
  updateMcpConfig: (data: any) => http.put('/settings/mcp-config', data),
  pluginsConfig: () => http.get('/settings/plugins-config'),
  updatePluginsConfig: (data: any) => http.put('/settings/plugins-config', data),
};

// ==================== 记忆体（ApiMemoryController，基路径 /api/memories） ====================
/** 记忆条目：列表/召回统一出参，score 仅召回出口回填 */
export interface AiMemoryItem {
  memoryId: string;
  userId?: string;
  scope?: 'global' | 'conversation';
  conversationId?: string;
  kind?: 'preference' | 'fact' | 'instruction' | 'episode';
  title?: string;
  content: string;
  keywords?: string[];
  importance?: number;
  strength?: number;
  score?: number;
  hitCount?: number;
  pinned?: boolean;
  status?: 'active' | 'archived' | 'expired';
  source?: 'manual' | 'auto-extract' | 'tool' | 'import';
  createdAt?: number;
  updatedAt?: number;
  lastUsedAt?: number;
  expiresAt?: number;
}

/** 写入/更新入参：归属用户由服务端按登录态写入，不接受 userId */
export interface AiMemoryUpsert {
  content: string;
  scope?: 'global' | 'conversation';
  conversationId?: string;
  kind?: string;
  title?: string;
  keywords?: string[];
  importance?: number;
  pinned?: boolean;
  expiresAt?: number;
}

export const memoryApi = {
  /** GET /api/memories —— 一次返回本人全局记忆 + 指定会话的会话级记忆 */
  list: (params?: { scope?: string; conversation_id?: string; keyword?: string; status?: string; limit?: number }) =>
    apiHttp.get('/api/memories', { params }),
  /** GET /api/memories/{id} */
  get: (memoryId: string) => apiHttp.get(`/api/memories/${memoryId}`),
  /** POST /api/memories —— 手工记录（source=manual） */
  create: (data: AiMemoryUpsert) => apiHttp.post('/api/memories', data),
  /** PUT /api/memories/{id} —— 整体更新 */
  update: (memoryId: string, data: AiMemoryUpsert) => apiHttp.put(`/api/memories/${memoryId}`, data),
  /** PATCH /api/memories/{id} —— 部分更新（置顶、停用等） */
  patch: (memoryId: string, data: Partial<AiMemoryUpsert> & { status?: string; pinned?: boolean }) =>
    apiHttp.patch(`/api/memories/${memoryId}`, data),
  /** DELETE /api/memories/{id} */
  delete: (memoryId: string) => apiHttp.delete(`/api/memories/${memoryId}`),
  /** DELETE /api/memories/conversation/{id} —— 清空本会话记忆，全局记忆不动，返回删除数 */
  clearConversation: (conversationId: string) => apiHttp.delete(`/api/memories/conversation/${conversationId}`),
  /** GET /api/memories/recall —— 本轮会注入哪些记忆；apply=false 为纯试算，不回写命中统计 */
  recall: (params: { conversation_id?: string; query?: string; apply?: boolean }) =>
    apiHttp.get('/api/memories/recall', { params }),
  /** GET /api/memories/stats —— 当前用户容量统计 */
  stats: () => apiHttp.get('/api/memories/stats'),
  /** POST /api/memories/maintenance —— 立即维护本人记忆库（仅管理员可跨用户） */
  maintenance: () => apiHttp.post('/api/memories/maintenance'),
  /** GET /api/memories/maintenance/latest —— 最近一次后台维护报告，未跑过时为空 */
  maintenanceLatest: () => apiHttp.get('/api/memories/maintenance/latest'),
};

// ==================== Bot 管理（AiBotBindingController，基路径 /v2/ai/bot-binding） ====================
export const botApi = {
  /** GET /v2/ai/bot-binding/list */
  list: (params?: any) => http.get('/ai/bot-binding/list', { params }),
  /** POST /v2/ai/bot-binding/create（body 为 BotBindingCreateRequest，按 botId upsert，回数据库 id） */
  create: (data: any) => http.post('/ai/bot-binding/create', data),
  /** PUT /v2/ai/bot-binding/update（body 必须带 botId，请求体无 id 字段） */
  update: (data: any) => http.put('/ai/bot-binding/update', data),
  /** DELETE /v2/ai/bot-binding/{id} */
  delete: (id: string) => http.delete(`/ai/bot-binding/${id}`),
  /** GET /v2/ai/bot-binding/conversations（全量，无服务端 botId 过滤） */
  conversations: () => http.get('/ai/bot-binding/conversations'),
};

// ==================== 视觉管线 ====================
export const pipelineApi = {
  list: () => http.get('/models/pipelines'),
  detail: (code: string) => http.get(`/pipelines/${code}`),
  models: (code: string) => http.get(`/pipelines/${code}/models`),
  config: (group: string) => http.get(`/global-settings/${group}`),
  updateConfig: (group: string, data: any) =>
    http.put(`/global-settings/${group}`, data),
  // 各管线配置
  ocr: {
    get: () => http.get('/ocr/config'),
    update: (data: any) => http.put('/ocr/config', data),
  },
  layout: {
    get: () => http.get('/layout/config'),
    update: (data: any) => http.put('/layout/config', data),
  },
  face: {
    get: () => http.get('/face/config'),
    update: (data: any) => http.put('/face/config', data),
  },
  imageRecognition: {
    get: () => http.get('/image-recognition/config'),
    update: (data: any) => http.put('/image-recognition/config', data),
  },
  generate: {
    get: () => http.get('/generate/config'),
    update: (data: any) => http.put('/generate/config', data),
  },
};

export { http };
export default http;
