/**
 * Java 后端 API 服务
 * 对接 spring-support-ai-starter 后端（8787端口）
 */
import axios from 'axios';

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
  pipelines: () => http.get('/pipelines'),
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
  update: (id: string, data: any) => http.put(`/api/agents/${id}`, data),
  delete: (id: string) => http.delete(`/api/agents/${id}`),
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
  export: (params?: any) => http.get('/usage/export', { params, responseType: 'blob' }),
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
  globalBeans: (group: string) => http.get(`/global-settings/${group}`),
  updateGlobalBeans: (group: string, data: any) => http.put(`/global-settings/${group}`, data),
  usageConfig: () => http.get('/settings/usage-config'),
  updateUsageConfig: (data: any) => http.put('/settings/usage-config', data),
  skillsConfig: () => http.get('/settings/skills-config'),
  updateSkillsConfig: (data: any) => http.put('/settings/skills-config', data),
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
  list: () => http.get('/pipelines'),
  detail: (code: string) => http.get(`/pipelines/${code}`),
  models: (code: string) => http.get(`/pipelines/${code}/models`),
  config: (group: string) => http.get(`/global-settings/${group}`),
  updateConfig: (group: string, data: any) => http.put(`/global-settings/${group}`, data),
};

export default http;
