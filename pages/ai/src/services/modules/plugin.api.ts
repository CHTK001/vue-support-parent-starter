import type { ApiContext } from "./api-context";

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "number" | "select" | "textarea";
  required?: boolean;
  default?: any;
  placeholder?: string;
  showIf?: { field: string; equals: any };
  options?: { label: string; value: any }[];
}

export interface AttachmentTypeInfo {
  id: string;
  label: string;
  icon: string;
  pluginId: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  description?: string;
  meta?: Record<string, any>;
}

export interface PluginAttachmentList {
  typeId: string;
  items: AttachmentItem[];
}

export interface UiPageInfo {
  id: string;
  area: string;
  group: string;
  tab: string;
  icon: string;
  component: string;
  pluginId: string;
  order: number;
}

export interface PluginApi {
  getAttachmentTypes(): Promise<AttachmentTypeInfo[]>;
  getPluginAttachments(pluginId: string): Promise<PluginAttachmentList[]>;
  getPluginUiPages(area?: string): Promise<UiPageInfo[]>;
  getPluginData(pluginId: string): Promise<Record<string, any>>;
  setPluginData(pluginId: string, key: string, value: any): Promise<{ success: boolean }>;
  deletePluginData(pluginId: string, key: string): Promise<{ success: boolean }>;
}

/**
 * ⚠️ **后端从未实现「插件运行时」这组端点**，实测（直连后端与走代理）全部 404：
 *   GET    /v2/plugins/attachment-types
 *   GET    /v2/plugins/{pluginId}/attachments
 *   GET    /v2/plugins/ui-pages
 *   GET    /v2/plugins/{pluginId}/data
 *   PUT    /v2/plugins/{pluginId}/data/{key}
 *   DELETE /v2/plugins/{pluginId}/data/{key}
 *
 * 后端代码里搜不到 attachment-types / ui-pages 任何一个；插件市场页实际用的是
 * {@code /v2/plugins-config}（配置 CRUD），与这组「插件注册 UI/附件/数据」是两回事。
 *
 * 原先这些方法真的发请求，于是**每次打开会话、每次点开附件面板、每次进生图页**
 * 都稳定打出 404，只因为调用方都写了 try/catch 才没崩 —— 典型的
 * 「靠兜底掩盖死接口」：功能从来没工作过，控制台却一直是红的。
 *
 * 现在改为本地直接返回空值：语义等价于「没有插件注册任何附件类型/UI 页/数据」，
 * 不再发注定失败的请求。后端补齐运行时后，把方法体换回 _request 即可。
 */
export const pluginApi: PluginApi = {
  async getAttachmentTypes(this: ApiContext) {
    return [] as AttachmentTypeInfo[];
  },

  async getPluginAttachments(this: ApiContext, pluginId: string) {
    return [] as PluginAttachmentList[];
  },

  async getPluginUiPages(this: ApiContext, area?: string) {
    return [] as UiPageInfo[];
  },

  async getPluginData(this: ApiContext, pluginId: string) {
    return {} as Record<string, any>;
  },

  async setPluginData(this: ApiContext, pluginId: string, key: string, value: any) {
    throw new Error(
      "后端未实现插件数据接口（PUT /v2/plugins/{pluginId}/data/{key}），无法保存插件数据",
    );
  },

  async deletePluginData(this: ApiContext, pluginId: string, key: string) {
    throw new Error(
      "后端未实现插件数据接口（DELETE /v2/plugins/{pluginId}/data/{key}），无法删除插件数据",
    );
  },
};