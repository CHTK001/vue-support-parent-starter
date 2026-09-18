import type { AxiosRequestConfig } from "axios";
import type { ApiContext } from "./api-context";
import type { Model, ModelProvider } from "@/types/api";
import type { PaginatedResponse } from "@/types/common";

export interface ModelApi {
  fetchModels(): Promise<PaginatedResponse<ModelProvider>>;
  fetchAllModels(): Promise<PaginatedResponse<ModelProvider>>;
  fetchRemoteModels(providerId: string): Promise<PaginatedResponse<Model>>;
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

export const modelApi: ModelApi = {
  async fetchModels(this: ApiContext) {
    // 调用 /api/providers 获取供应商和模型数据
    const res = await fetch('/api/providers');
    const data = await res.json();
    // 转换成前端期望的格式：{ items: [...] }
    return { items: data.data || [] };
  },

  async fetchAllModels(this: ApiContext) {
    return await this._request("/models/all");
  },

  async fetchRemoteModels(this: ApiContext, providerId: string) {
    // 后端接口在 /api/providers/...，不是 /v2/providers/...
    const res = await fetch(`/api/providers/${encodeURIComponent(providerId)}/remote_models`);
    return await res.json();
  },

  async createModel(this: ApiContext, data: any) {
    // 后端接口格式：PUT /api/provider-models，body是 { provider_id: "xxx", model: { ... } }
    const body = {
      provider_id: data.providerId,
      model: {
        model: data.model || data.name,
        enabled: data.enabled !== false,
        sort_order: data.sort_order || 0,
        capabilities: data.capabilities || []
      }
    };
    const res = await fetch('/api/provider-models', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  },

  async updateModel(this: ApiContext, modelId: string, data: any) {
    // 后端接口格式：PUT /api/provider-models
    const body = {
      provider_id: data.providerId,
      model: {
        model: data.model || data.name,
        enabled: data.enabled !== false,
        sort_order: data.sort_order || 0,
        capabilities: data.capabilities || []
      }
    };
    const res = await fetch('/api/provider-models', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  },

  async deleteModel(this: ApiContext, modelId: string) {
    // 后端接口格式：DELETE /api/provider-models?provider_id=xxx&model=xxx
    // modelId格式：providerId:modelName
    const [providerId, modelName] = modelId.split(':');
    const res = await fetch(`/api/provider-models?provider_id=${encodeURIComponent(providerId)}&model=${encodeURIComponent(modelName)}`, {
      method: 'DELETE'
    });
    return await res.json();
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
    const res = await fetch('/api/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async testProviderConnection(this: ApiContext, data: any) {
    const res = await fetch('/api/providers/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async deleteProvider(this: ApiContext, providerId: string) {
    const res = await fetch(`/api/providers/${encodeURIComponent(providerId)}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  async updateProvider(this: ApiContext, providerId: string, data: any) {
    const res = await fetch(`/api/providers/${encodeURIComponent(providerId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  async getProviderTemplates(this: ApiContext) {
    return await this._request("/providers/templates");
  },

  async getModelPresets(this: ApiContext) {
    return await this._request("/models/presets");
  },
};
