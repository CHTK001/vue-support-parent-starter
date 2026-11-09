import type { ApiContext } from "./api-context";
import type { GlobalSettings } from "@/types/service";
import { createClient, rootHttp } from "@/framework/context";

/**
 * 根路径客户端：Agent 引擎运维接口在 /api/agents/engine（不走 /v2），
 * 且 returned 是 {success, data} 信封，这里保持 unwrap:false 自行取 data。
 */
const engineHttp = createClient(rootHttp, { unwrap: false });

export interface SettingsApi {
  fetchSettings(): Promise<GlobalSettings>;
  updateSettings(data: any): Promise<GlobalSettings>;
  fetchGroupSettings(group: string): Promise<any>;
  updateGroupSettings(group: string, data: any): Promise<any>;
  /**
   * 取当前登录用户在该分组的「全局默认 + 本人覆盖」合并视图。
   *
   * 每项含 field / value / defaultValue / overridden：overridden=false 表示该值继承自全局默认。
   */
  fetchMergedGroupSettings(group: string): Promise<any>;
  /**
   * 写入当前登录用户自己的覆盖（只影响本人，不改全局默认）。
   *
   * 值传 null 表示撤销该字段的本人覆盖（即「重置」，回落到继承值）。
   */
  updateUserGroupOverrides(group: string, data: any): Promise<any>;
  /**
   * 读取全局设置（管理员专属）：含 ragVectorStorage / ragVectorStorageConfig（敏感字段已掩码）。
   */
  fetchGlobalSettings(): Promise<any>;
  /**
   * 更新全局设置（管理员专属）：DTO 部分更新，null 字段不覆盖；向量库配置走
   * 后端描述器校验（未知 SPI/未知字段拒绝、敏感字段留空保留原值）。
   */
  updateGlobalSettings(data: any): Promise<any>;
  fetchWorkspaceBaseDir(): Promise<{ workspaceBaseDir: string | null }>;
  updateWorkspaceBaseDir(workspaceBaseDir: string | null): Promise<{ success: boolean }>;
  queryPlugins(config?: any, lang?: string): Promise<any>;
  updateGlobalToolStatus(pluginId: string, enabled: boolean): Promise<{ success: boolean }>;
  addCustomTool(name: string, path: string): Promise<{ success: boolean; message?: string; count?: number }>;
  reloadPlugin(pluginId: string): Promise<{ success: boolean }>;
  fetchToolDisplays(lang?: string): Promise<Record<string, any>>;
  /**
   * 查询 Agent 引擎解析结果与 opencode 可用性（管理员运维面，根路径 /api/agents/engine）。
   *
   * 返回 selected / requested / effective / degraded / fallback / reason / preparing /
   * autoInstall / opencode{installed,binary,serverReady,preparing,degraded,reason,baseUrl}。
   */
  fetchAgentEngineStatus(): Promise<any>;
  /**
   * 手动触发一次 opencode 的下载 + 启动（管理员专属，后台执行，立即返回）。
   */
  prepareAgentEngine(): Promise<any>;
}

export const settingsApi: SettingsApi = {
  async fetchSettings(this: ApiContext) {
    return await this._request("/settings");
  },

  async updateSettings(this: ApiContext, data: any) {
    return await this._request("/settings", { method: "PUT", data });
  },

  async fetchGroupSettings(this: ApiContext, group: string) {
    return await this._request(`/settings/${group}`);
  },

  async updateGroupSettings(this: ApiContext, group: string, data: any) {
    return await this._request(`/settings/${group}`, { method: "PUT", data });
  },

  async fetchMergedGroupSettings(this: ApiContext, group: string) {
    return await this._request(`/settings/${group}/merged`);
  },

  async updateUserGroupOverrides(this: ApiContext, group: string, data: any) {
    return await this._request(`/settings/${group}/overrides`, { method: "PUT", data });
  },

  async fetchGlobalSettings(this: ApiContext) {
    return await this._request("/global-settings");
  },

  async updateGlobalSettings(this: ApiContext, data: any) {
    return await this._request("/global-settings", { method: "PUT", data });
  },

  async fetchWorkspaceBaseDir(this: ApiContext) {
    return await this._request("/settings/workspace-base-dir");
  },

  async updateWorkspaceBaseDir(this: ApiContext, workspaceBaseDir: string | null) {
    return await this._request("/settings/workspace-base-dir", {
      method: "PUT",
      data: { workspaceBaseDir },
    });
  },

  async queryPlugins(this: ApiContext, config?: any, lang?: string) {
    try {
      return await this._request("/plugins/query", {
        method: "POST",
        data: { config, ...(lang ? { lang } : {}) },
      });
    } catch (e) {
      // 后端插件接口暂未提供，返回空列表避免报错
      return { plugins: [] };
    }
  },

  async updateGlobalToolStatus(this: ApiContext, pluginId: string, enabled: boolean) {
    return await this._request("/plugins/global", {
      method: "PUT",
      data: { pluginId, enabled },
    });
  },

  async addCustomTool(this: ApiContext, name: string, path: string) {
    return await this._request("/plugins/custom", {
      method: "POST",
      data: { name, path },
    });
  },

  async reloadPlugin(this: ApiContext, pluginId: string) {
    return await this._request(`/plugins/reload/${pluginId}`, {
      method: "POST",
    });
  },

  async fetchToolDisplays(this: ApiContext, lang?: string) {
    return await this._request("/plugins/tool-displays", {
      params: lang ? { lang } : undefined,
    });
  },

  /**
   * 引擎运维接口不在 /v2 下（{@code ApiAgentEngineController} 基路径 /api/agents/engine），
   * 这里走根路径客户端；后端回 {@code {success, data}} 信封，就地取出 data。
   */
  async fetchAgentEngineStatus(this: ApiContext) {
    const body: any = await engineHttp.get("/api/agents/engine");
    return body?.data ?? body;
  },

  async prepareAgentEngine(this: ApiContext) {
    const body: any = await engineHttp.post("/api/agents/engine/prepare");
    return body?.data ?? body;
  },
};
