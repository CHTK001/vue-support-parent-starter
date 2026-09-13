/**
 * Java 后端 API 服务
 * 对接 spring-support-ai-starter 后端（8787端口）
 */
import axios from 'axios';
import { http as httpClient } from '@/http';

// ==================== 统一HTTP请求封装（推荐使用 http()） ====================
// 远程组件统一repo/http，使用http()进行请求
// 示例：
//   import { http } from '@/services/javaApi';
//   const res = await http.get('/models');
//   const res = await http.post('/models', { name: 'test' });
export { httpClient as http };

const API_BASE = '/v2';

const http = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

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

export const manufacturerKeyApi = {
  list: (params?: any) => http.get('/manufacturer-keys', { params }),
  create: (data: any) => http.post('/manufacturer-keys', data),
  update: (id: string, data: any) => http.put(`/manufacturer-keys/${id}`, data),
  delete: (id: string) => http.delete(`/manufacturer-keys/${id}`),
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
  list: (params?: any) => http.get('/api/mcp/servers', { params }),
  create: (data: any) => http.post('/api/mcp/servers', data),
  update: (id: string, data: any) => http.put(`/api/mcp/servers/${id}`, data),
  delete: (id: string) => http.delete(`/api/mcp/servers/${id}`),
};

// ==================== Agent 管理 ====================
export const agentApi = {
  list: (params?: any) => http.get('/api/agents', { params }),
  create: (data: any) => http.post('/api/agents/managed', data),
  update: (id: string, data: any) => http.put(`/api/agents/managed/${id}`, data),
  delete: (id: string) => http.delete(`/api/agents/managed/${id}`),
  get: (id: string) => http.get(`/api/agents/managed/${id}`),
  // 子Agent管理（主从工作流）
  listSubAgents: (agentId: string) => http.get(`/api/agents/managed/${agentId}/sub-agents`),
  addSubAgent: (agentId: string, data: any) => http.post(`/api/agents/managed/${agentId}/sub-agents`, data),
  updateSubAgent: (agentId: string, subId: string, data: any) => http.put(`/api/agents/managed/${agentId}/sub-agents/${subId}`, data),
  deleteSubAgent: (agentId: string, subId: string) => http.delete(`/api/agents/managed/${agentId}/sub-agents/${subId}`),
  // 编排配置
  getOrchestration: (agentId: string) => http.get(`/api/agents/managed/${agentId}/orchestration`),
  saveOrchestration: (agentId: string, data: any) => http.post(`/api/agents/managed/${agentId}/orchestration`, data),
  runOrchestration: (agentId: string, data: any) => http.post(`/api/agents/managed/${agentId}/orchestration/run`, data),
  // 注册为模型
  registerAsModel: (agentId: string) => http.post(`/api/agents/managed/${agentId}/register`),
  unregisterModel: (agentId: string) => http.delete(`/api/agents/managed/${agentId}/register`),
  getRegisteredModel: (agentId: string) => http.get(`/api/agents/managed/${agentId}/registered-model`),
  listRegisteredModels: () => http.get('/api/agents/managed/registered-models'),
  rebuild: (agentId: string) => http.post(`/api/agents/managed/${agentId}/rebuild`),
};

// ==================== 服务管理 ====================
export const serviceApi = {
  list: (params?: any) => http.get('/api/services', { params }),
  create: (data: any) => http.post('/api/services', data),
  update: (id: string, data: any) => http.put(`/api/services/${id}`, data),
  delete: (id: string) => http.delete(`/api/services/${id}`),
  start: (id: string) => http.post(`/api/services/${id}/start`),
  stop: (id: string) => http.post(`/api/services/${id}/stop`),
};

// ==================== 用量管理 ====================
export const usageApi = {
  statistics: (params?: any) => http.get('/usage/statistics', { params }),
  list: (params?: any) => http.get('/usage', { params }),
  syncLogs: (params?: any) => http.get('/usage/sync-logs', { params }),
  sync: () => http.post('/usage/sync'),
  syncAll: () => http.post('/usage/sync-all'),
  export: (params?: any) => http.get('/usage/export', { params, responseType: 'blob' }),
  config: () => http.get('/usage/config'),
  updateConfig: (data: any) => http.put('/usage/config', data),
  providers: () => http.get('/usage/providers'),
  toggleProvider: (provider: string, enabled: boolean) => http.put(`/usage/providers/${provider}`, { enabled }),
};

// ==================== 模型指标采集 ====================
export const modelMetricsApi = {
  list: (params?: any) => http.get('/api/model-metrics', { params }),
  refresh: () => http.post('/api/model-metrics/refresh'),
  getConfig: () => http.get('/api/model-metrics/config'),
  updateConfig: (data: any) => http.put('/api/model-metrics/config', data),
  syncPricing: () => http.post('/api/model-metrics/sync-pricing'),
};

// ==================== 聊天会话/上下文 ====================
export const chatApi = {
  sessions: (params?: any) => http.get('/chat/sessions', { params }),
  sessionDetail: (sessionId: string) => http.get(`/chat/sessions/${sessionId}`),
  sessionContext: (sessionId: string) => http.get(`/chat/sessions/${sessionId}/context`),
  messages: (sessionId: string, params?: any) => http.get(`/chat/sessions/${sessionId}/messages`, { params }),
  sendMessage: (sessionId: string, data: any) => http.post(`/chat/sessions/${sessionId}/messages`, data),
  createSession: (data: any) => http.post('/chat/sessions', data),
  deleteSession: (sessionId: string) => http.delete(`/chat/sessions/${sessionId}`),
};

// ==================== Skills 管理 ====================
export const skillsApi = {
  list: (params?: any) => http.get('/api/skills', { params }),
  scan: () => http.post('/api/skills/scan'),
  install: (data: any) => http.post('/api/skills/install', data),
  uninstall: (id: string) => http.delete(`/api/skills/${id}`),
  marketSearch: (keyword: string) => http.get('/api/skills/market/search', { params: { keyword } }),
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
  updateGlobalBeans: (group: string, data: any) => http.put(`/global-settings/${group}`, data),
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
  updateImageRecognitionConfig: (data: any) => http.put('/image-recognition/config', data),
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

// ==================== Bot 管理 ====================
export const botApi = {
  list: (params?: any) => http.get('/ai/bot-binding', { params }),
  create: (data: any) => http.post('/ai/bot-binding', data),
  update: (id: string, data: any) => http.put(`/ai/bot-binding/${id}`, data),
  delete: (id: string) => http.delete(`/ai/bot-binding/${id}`),
  conversations: (botId: string) => http.get(`/ai/bot-binding/${botId}/conversations`),
};

// ==================== 视觉管线 ====================
export const pipelineApi = {
  list: () => http.get('/models/pipelines'),
  detail: (code: string) => http.get(`/pipelines/${code}`),
  models: (code: string) => http.get(`/pipelines/${code}/models`),
  config: (group: string) => http.get(`/global-settings/${group}`),
  updateConfig: (group: string, data: any) => http.put(`/global-settings/${group}`, data),
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

export default http;
