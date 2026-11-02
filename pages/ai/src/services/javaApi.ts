/**
 * 后端 API 服务封装
 *
 * 统一使用 Vue 体系的请求模块（@repo/utils 的 Http + @repo/core createApp 注入的
 * 鉴权拦截器实例），不自行 axios.create / fetch；Authorization 头与 401/403 处理
 * 全部由框架拦截器负责，业务侧不再读写 localStorage 里的 token。
 */
import { createClient, rootHttp, v2Http } from '@/framework/context';
import { createSseClient } from '@repo/utils';

// ==================== 客户端：统一走 @repo/utils 请求模块，不解包（调用方拿 {code,data,msg}） ====================
// /v2 接口客户端（常规业务：models / sessions / chat / usage / settings ...）
const http = createClient(v2Http, { unwrap: false });
// 根路径客户端（管理类：model-metrics / mcp / agents / services / skills，控制器不在 /v2 下）
const apiHttp = createClient(rootHttp, { unwrap: false });

/**
 * 分组设置响应摊平。
 *
 * <p>后端按分组的真实出口是 {@code /v2/settings/{group}}（{@code /v2/global-settings} 只有
 * 无参的单条接口，带分组的路径一律 404）。该出口的响应是<b>双层信封</b>：
 * {@code {code, data: {success, data: {field -> value}}}}，而本文件的客户端是
 * {@code unwrap: false}，直接取 {@code res.data} 会拿到内层信封本身。这里就地摊平成
 * {@code field -> value}，让调用方拿到的形状与 {@code settings.api.ts}
 * 的 {@code fetchGroupSettings} 一致。</p>
 */
const flattenGroupSettings = (res: any) => res?.data?.data ?? res?.data ?? res ?? {};

// ==================== 模型管理 ====================
export const modelApi = {
  list: (params?: any) => http.get('/models', { params }),
  create: (data: any) => http.post('/models', data),
  update: (id: string, data: any) => http.put(`/models/${id}`, data),
  delete: (id: string) => http.delete(`/models/${id}`),
  batchDelete: (ids: number[]) => http.delete('/models/batch', { data: { ids } }),
  testLatency: (id: string) => http.post(`/models/${id}/test-latency`),
  // 模型管理卡片的延迟测试走 provider 复合标识：旧 /models/{modelId} 是
  // sys_ai_model 数字主键，不适用于 /api/providers 返回的 providerId:modelName 行。
  testProviderModelLatency: (providerId: string, modelName: string) =>
    apiHttp.post(`/api/providers/${encodeURIComponent(providerId)}/models/${encodeURIComponent(modelName)}/test-latency`),
  syncPricing: (providerId: string) =>
    apiHttp.post(`/api/providers/${encodeURIComponent(providerId)}/models/sync-pricing`),
  pipelines: () => http.get('/models/pipelines'),
  get: (id: string) => http.get(`/models/${id}`),
};

// ==================== 多Key管理 (AppKey / ManufacturerKey) ====================
export const appKeyApi = {
  list: (params?: any) => http.get('/app-keys', { params }),
  create: (data: any) => http.post('/app-keys', data),
  update: (id: string, data: any) => http.put(`/app-keys/${id}`, data),
  delete: (id: string) => http.delete(`/app-keys/${id}`),
  batchDelete: (ids: number[]) => http.delete('/app-keys/batch', { data: { ids } }),
};

/** AppKey 充值/消费流水 API（余额 / 充值 / 扣减 / 流水） */
export const topupApi = {
  /** 查询余额 */
  balance: (appKeyId: number) => http.get(`/app-keys/${appKeyId}/balance`),
  /** 充值（金额 + 备注） */
  recharge: (appKeyId: number, amount: number, remark?: string) =>
    http.post(`/app-keys/${appKeyId}/recharge`, { amount, remark }),
  /** 扣减/调整（金额 + 备注） */
  deduct: (appKeyId: number, amount: number, remark?: string) =>
    http.post(`/app-keys/${appKeyId}/deduct`, { amount, remark }),
  /** 充值/消费/退款/调整流水（按 AppKey 主键） */
  list: (appKeyId: number) => http.get(`/app-keys/${appKeyId}/topups`),
  /** 套餐变更 */
  plan: (appKeyId: number, planId: number) => http.put(`/app-keys/${appKeyId}/plan`, { planId }),
  /** 透支开关变更 */
  overdraft: (appKeyId: number, enabled: boolean) => http.put(`/app-keys/${appKeyId}/overdraft`, { overdraftEnabled: enabled }),
  /** 每分钟单价变更 */
  rate: (appKeyId: number, minuteRate: number) => http.put(`/app-keys/${appKeyId}/rate`, { minuteRate }),
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
  /**
   * ⚠️ **后端未实现该 GET**：`ApiAgentManageController` 对
   * `/api/agents/managed/{id}/sub-agents` 只有 POST / PUT / DELETE 三个映射，
   * 没有 `@GetMapping`，Spring 对 GET 一律回 **405**（路径在、方法不匹配）。
   *
   * <p>保留契约以免后来者重踩，但**勿再接回调用方**：子 Agent 列表已由
   * `GET /api/agents/managed/{id}` 以 `sub_agents` 字段一并返回
   * （`SysAiAgentServiceImpl.getAgent → toResponse(agent, true)`）。
   * `AgentsPage.loadSubAgents()` 现在走的就是那条既有契约。</p>
   *
   * @param agentId 主 Agent 标识
   * @return 该路径当前恒 405
   * @deprecated 改用 `get(agentId)` 读取 `sub_agents`
   */
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

// ==================== 会话 ↔ 智能体（一个会话多个智能体 / 主从动态子会话） ====================
/**
 * ⚠️ **后端尚未实现这组接口**，直连后端实测全部 404（「资源不存在」）：
 *   GET    /api/sessions/{id}/agents
 *   POST   /api/sessions/{id}/agents
 *   DELETE /api/sessions/{id}/agents/{agentId}
 *   GET    /api/sessions/{id}/sub-sessions
 *   POST   /api/sessions/{id}/sub-sessions/spawn
 *   POST   /api/sessions/{id}/sub-sessions/{subId}/close
 *   POST   /api/sessions/{id}/sub-sessions/{subId}/status
 * 后端没有任何 `@RequestMapping("/api/sessions")`，库里也没有会话↔智能体的绑定表，
 * `sys_ai_session` 里更没有 agent 相关列，所以这不是代理配错、也不是路径写错。
 *
 * 因此这里**只保留契约、不再被调用**：原先 GlobalSidebar 展开会话、
 * ChatPage 打开会话都会打这些请求，每次稳定 404，而 Promise.allSettled
 * 的兜底又让功能「看起来正常」，实际永远拿不到数据。
 * 后端补齐后再接回调用方（GlobalSidebar.loadSessionDetail / ChatPage.fetchSession）。
 */
export const sessionAgentApi = {
  /** 会话已绑定的智能体（主 + 子） */
  list: (sessionId: string | number) =>
    apiHttp.get(`/api/sessions/${sessionId}/agents`),
  /** 挂载智能体到会话（幂等） */
  attach: (sessionId: string | number, agentIds: string[]) =>
    apiHttp.post(`/api/sessions/${sessionId}/agents`, { agent_ids: agentIds }),
  /** 解绑 */
  detach: (sessionId: string | number, agentId: string) =>
    apiHttp.delete(`/api/sessions/${sessionId}/agents/${agentId}`),
  /** 会话的子会话列表（页面刷新后恢复多 Tab） */
  listSubSessions: (sessionId: string | number) =>
    apiHttp.get(`/api/sessions/${sessionId}/sub-sessions`),
  /** 主控智能体为子智能体创建真实子会话（后端会广播 sub_agent_create） */
  spawn: (sessionId: string | number, data: any) =>
    apiHttp.post(`/api/sessions/${sessionId}/sub-sessions/spawn`, data),
  /** 结束子会话（广播 sub_agent_closed） */
  close: (sessionId: string | number, subSessionId: string | number, reason = 'completed') =>
    apiHttp.post(`/api/sessions/${sessionId}/sub-sessions/${subSessionId}/close`, { reason }),
  /** 更新子智能体状态（广播 sub_agent_status） */
  updateStatus: (subSessionId: string | number, status: string) =>
    apiHttp.post(`/api/sessions/sub-sessions/${subSessionId}/status`, { status }),
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
  /**
   * 按「天 + 模型」聚合（每日模型堆叠柱状图数据源）。
   *
   * 与 trend() 的区别：trend() 把同一天所有模型并成一个点，丢掉了「某天各模型
   * 分别占多少」；本接口保留模型维度，一天返回多行，前端归并成同一根柱内的分段。
   */
  modelTrend: (params?: any) => http.get('/usage/model-trend', { params }),
  syncLogs: (params?: any) => http.get('/usage/sync-logs', { params }),
  parsers: (params?: any) => http.get('/usage/parsers', { params }),
  /**
   * 服务商 id→名称映射（后端 /v2/usage/providers，需登录态，与用量请求同鉴权）。
   *
   * 2026-10-14 新增接口尚未部署到 198 时会 404：调用方必须 .catch 兜底，
   * 映射失败时服务商列显示原始值，不弹错。
   */
  usageProviders: () => http.get('/usage/providers'),
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
  // 全局设置（按分组）：走 /v2/settings/{group}，见 flattenGroupSettings 注释
  globalBeans: async (group: string) =>
    flattenGroupSettings(await http.get(`/settings/${group}`)),
  updateGlobalBeans: async (group: string, data: any) =>
    flattenGroupSettings(await http.put(`/settings/${group}`, data)),
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

// ==================== 渠道管理（ApiChannelAuthController，基路径 /api/channels，admin-only） ====================
/** 渠道账号连接摘要（不含 credentials 原文） */
export interface ChannelConnectionSummary {
  connectionId: string;
  label?: string;
  role?: string;
  hasCredentials?: boolean;
  status?: string;
  updatedAt?: number;
}

/** 渠道级摘要 */
export interface ChannelSummary {
  channel: string;
  displayName?: string;
  loginMethod?: string;
  supportsCheckin?: boolean;
  supportsRefresh?: boolean;
  providerId?: string;
  enabled?: boolean;
  connections?: ChannelConnectionSummary[];
  models?: Array<{ model: string; enabled: boolean; alias?: string; contextWindow?: number }>;
}

export const channelApi = {
  /** GET /api/channels —— 全部渠道（含未绑定账号的） */
  list: () => apiHttp.get('/api/channels') as Promise<ChannelSummary[]>,
  /** POST /api/channels/{channel}/start-login —— 发起绑定，返回轮询句柄 */
  startLogin: (channel: string) =>
    apiHttp.post(`/api/channels/${channel}/start-login`) as Promise<{ channel: string; handle: Record<string, any> }>,
  /** POST /api/channels/{channel}/poll —— 按句柄轮询；pending=true 表示仍在等待 */
  poll: (channel: string, body: { handle: Record<string, any>; label?: string }) =>
    apiHttp.post(`/api/channels/${channel}/poll`, body) as Promise<{ ok: boolean; pending?: boolean; connectionId?: string }>,
  /**
   * GET /api/channels/{channel}/sse-login?timeoutSec= —— 账号绑定的 SSE 流（替代前端轮询）。
   *
   * 事件：`pending`（附回显 handle）/ `done`（附 connectionId）/ `failed`（附 message）。
   * 后端在任一终态后关流，故这里 `reconnect: false`。
   *
   * @param channel    渠道标识
   * @param body       { handle, label?, intervalMs? }
   * @param handlers   事件回调；返回 sse 客户端（调用 close() 中止）
   */
  sseLogin: (
    channel: string,
    body: { handle: Record<string, any>; label?: string; intervalMs?: number },
    handlers: {
      onPending?: (data: { handle?: Record<string, any> }) => void;
      onDone?: (data: { connectionId?: string; label?: string }) => void;
      onFailed?: (data: { message?: string; code?: string }) => void;
      onError?: (err: unknown) => void;
      /**
       * 流正常结束（服务端 complete）时回调。
       *
       * ⚠️ 必须暴露：服务端可能在没有推 done/failed 的情况下结束流
       * （如 persistCredentials 抛非 SSE 异常、网关中途掐断），此时若前端
       * 只监听 onFailed，绑定弹窗会永远停在「等待中」，用户看不到任何结果。
       */
      onClose?: () => void;
    },
    timeoutSec = 180,
  ) =>
    createSseClient<Record<string, any>>(`/api/channels/${channel}/sse-login?timeoutSec=${timeoutSec}`, {
      method: 'POST',
      body,
      reconnect: false,
      onMessage: (event: any) => {
        // SSE 事件名在 event 字段（fetch-event-source 形态），内容在 data
        const name = String(event?.event ?? event?.type ?? '')
        const data = (event?.data ?? event) as Record<string, any>
        if (name === 'pending') handlers.onPending?.(data)
        else if (name === 'done') handlers.onDone?.(data)
        else if (name === 'failed') handlers.onFailed?.(data)
      },
      onError: handlers.onError,
      onClose: handlers.onClose,
    }),
  /** POST /api/channels/{channel}/refresh —— 按 label 刷新凭据 */
  refresh: (channel: string, body: { label: string }) =>
    apiHttp.post(`/api/channels/${channel}/refresh`, body) as Promise<{ ok: boolean; refreshed?: boolean }>,
  /** POST /api/channels/{channel}/checkin —— 按 label 签到/领额度 */
  checkin: (channel: string, body: { label: string }) =>
    apiHttp.post(`/api/channels/${channel}/checkin`, body) as Promise<{ ok: boolean; channel: string; label: string; result: Record<string, any> }>,
  /** POST /api/channels/{channel}/list-models —— 按 label 拉取账号当前可用模型 */
  listModels: (channel: string, body: { label?: string }) =>
    apiHttp.post(`/api/channels/${channel}/list-models`, body) as Promise<{ ok: boolean; models: Array<{ id: string; name?: string; contextWindow?: number }> }>,
  /** POST /api/channels/{channel}/import-models —— 调 SPI listModels 并落库 sys_ai_provider_model */
  importModels: (channel: string, body: { label?: string }) =>
    apiHttp.post(`/api/channels/${channel}/import-models`, body) as Promise<{ ok: boolean; channel: string; created: number; updated: number; total: number }>,
  /** PUT /api/channels/{channel}/models/{model}/enabled —— 单模型开关 */
  setModelEnabled: (channel: string, model: string, enabled: boolean) =>
    apiHttp.put(`/api/channels/${channel}/models/${encodeURIComponent(model)}/enabled`, { enabled }) as Promise<{ ok: boolean; model: string; enabled: boolean }>,
  /** PUT /api/channels/{channel}/enabled —— 渠道总开关 */
  setEnabled: (channel: string, enabled: boolean) =>
    apiHttp.put(`/api/channels/${channel}/enabled`, { enabled }) as Promise<{ ok: boolean; enabled: boolean }>,
  /** GET /api/channels/{channel}/status?label= —— 凭据状态探活 */
  status: (channel: string, label?: string) =>
    apiHttp.get(`/api/channels/${channel}/status`, { params: { label } }) as Promise<{ ok: boolean; status?: string; details?: Record<string, any> }>,
  /** POST /api/channels/{channel}/delete-connection —— 删除某账号 */
  deleteConnection: (channel: string, label: string) =>
    apiHttp.post(`/api/channels/${channel}/delete-connection`, { label }),
};

/**
 * 渠道健康（子 2API Channel Monitor 模式）探针服务。
 *
 * <p>全量出口：</p>
 * <ul>
 *   <li>GET  /v2/channels/health          全部渠道健康状态</li>
 *   <li>GET  /v2/channels/health/{providerId}                供应商健康统计</li>
 *   <li>GET  /v2/channels/health/{providerId}/{connectionId}  单连接健康状态</li>
 *   <li>POST /v2/channels/health/probe     触发全部渠道探针</li>
 *   <li>POST /v2/channels/health/{connectionId}/probe 触发单连接探针</li>
 *   <li>PUT  /v2/channels/health/{connectionId}/interval 设定单连接探针间隔秒数</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.57
 */
export const channelHealthApi = {
  /** GET /v2/channels/health —— 全部渠道健康状态 */
  list: () => http.get('/v2/channels/health') as Promise<ChannelHealthSummary[]>,
  /** GET /v2/channels/health/{providerId} —— 某供应商的健康统计 */
  statByProvider: (providerId: string) =>
    http.get(`/v2/channels/health/${providerId}`) as Promise<Record<string, number>>,
  /** GET /v2/channels/health/{providerId}/{connectionId} —— 某连接的健康状态 */
  state: (providerId: string, connectionId: string) =>
    http.get(`/v2/channels/health/${providerId}/${connectionId}`) as Promise<ChannelHealthSummary>,
  /** POST /v2/channels/health/probe —— 触发全部渠道探针 */
  probeAll: () => http.post('/v2/channels/health/probe') as Promise<number>,
  /** POST /v2/channels/health/{connectionId}/probe —— 触发单连接探针 */
  probe: (connectionId: string) =>
    http.post(`/v2/channels/health/${connectionId}/probe`) as Promise<ChannelHealthSummary>,
  /** PUT /v2/channels/health/{connectionId}/interval —— 设定单连接探针间隔秒数（0 = 全局） */
  updateInterval: (connectionId: string, interval: number) =>
    http.put(`/v2/channels/health/${connectionId}/interval`, { interval }) as Promise<boolean>,
  /** PUT /v2/channels/{connectionId}/circuit —— 设定人工熔断开关（AUTO / OPEN / CLOSED） */
  updateCircuit: (connectionId: string, state: 'AUTO' | 'OPEN' | 'CLOSED', reason?: string) =>
    http.put(`/v2/channels/${connectionId}/circuit`, { state, reason }) as Promise<ChannelHealthSummary>,
  /** GET /v2/channels/circuit —— 请求级熔断状态列表（供应商 + 模型维度） */
  circuits: () => http.get('/v2/channels/circuit') as Promise<ChannelCircuitSnapshot[]>,
  /** POST /v2/channels/circuit/{providerId}/{model}/reset —— 复位单个熔断条目 */
  resetCircuit: (providerId: string, model: string) =>
    http.post(`/v2/channels/circuit/${providerId}/${model}/reset`) as Promise<boolean>,
  /** POST /v2/channels/circuit/reset —— 复位全部熔断条目 */
  resetAllCircuits: () => http.post('/v2/channels/circuit/reset') as Promise<number>,
};

/**
 * 渠道健康状态载体（通道探针结果，行主键为 connectionId）。
 */
export interface ChannelHealthSummary {
  /** 连接标识（行主键） */
  connectionId?: string;
  /** 供应商标识 */
  providerId?: string;
  /** 渠道（provider platform） */
  channel?: string;
  /** 连接标签 */
  label?: string;
  /** 状态：UNKNOWN / ONLINE / WARNING / DOWN / RATE_LIMITED */
  state?: string;
  /** 连续成功次数 */
  consecutiveSuccesses?: number;
  /** 连续失败次数 */
  consecutiveFailures?: number;
  /** 总成功次数 */
  successes?: number;
  /** 总失败次数 */
  failures?: number;
  /** 累计失败次数（含限流） */
  totalFailures?: number;
  /** 平均延迟（毫秒） */
  averageLatency?: number;
  /** 最后探针状态码 */
  lastProbeStatus?: number;
  /** 最后探针延迟（毫秒） */
  lastProbeLatency?: number;
  /** 最后探针错误信息 */
  lastProbeError?: string;
  /** 最后探针时间（毫秒） */
  lastProbeAt?: number;
  /** 探针间隔秒数（0 = 走全局健康设置） */
  intervalSeconds?: number;
  /** 人工熔断状态：AUTO（跟随探针）/ OPEN（强制熔断）/ CLOSED（强制放行） */
  circuitState?: string;
  /** 人工熔断/放行原因 */
  circuitReason?: string;
  /** 人工熔断状态变更时间（毫秒） */
  circuitUpdatedAt?: number;
  /** 创建时间（毫秒） */
  createdAt?: number;
  /** 更新时间（毫秒） */
  updatedAt?: number;
}

/**
 * 请求级熔断状态快照（按「供应商 + 模型」维度统计真实对话失败）。
 */
export interface ChannelCircuitSnapshot {
  /** 供应商标识 */
  providerId?: string;
  /** 模型名 */
  model?: string;
  /** 熔断状态：CLOSED / OPEN / HALF_OPEN */
  state?: string;
  /** 连续失败次数 */
  consecutiveFailures?: number;
  /** 冷却截止时间戳（毫秒） */
  openUntil?: number;
  /** 剩余冷却毫秒数（0 = 可试探） */
  remainingMillis?: number;
  /** 最近失败原因 */
  lastError?: string;
  /** 最近更新时间戳（毫秒） */
  lastUpdatedAt?: number;
}
export const pipelineApi = {
  list: () => http.get('/models/pipelines'),
  detail: (code: string) => http.get(`/pipelines/${code}`),
  models: (code: string) => http.get(`/pipelines/${code}/models`),
  // 分组配置读写：/global-settings/{group} 在后端不存在（404），真实出口是 /settings/{group}
  config: async (group: string) =>
    flattenGroupSettings(await http.get(`/settings/${group}`)),
  updateConfig: async (group: string, data: any) =>
    flattenGroupSettings(await http.put(`/settings/${group}`, data)),
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
