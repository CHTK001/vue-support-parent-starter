import type { ApiContext } from "./api-context";
import type {
  Character,
  CharacterListResponse,
  CharacterGroup,
} from "@/types/character";

export interface CharacterApi {
  fetchCharacters(groupId?: string): Promise<CharacterListResponse>;
  fetchCharacterGroups(): Promise<CharacterGroup[]>;
  createCharacterGroup(data: { name: string }): Promise<CharacterGroup>;
  updateCharacterGroup(groupId: string, data: { name: string }): Promise<CharacterGroup>;
  deleteCharacterGroup(groupId: string): Promise<{ success: boolean }>;
  fetchCharacter(characterId: string): Promise<Character>;
  createCharacter(characterData: any): Promise<Character>;
  updateCharacter(characterId: string, characterData: any): Promise<Character>;
  deleteCharacter(characterId: string): Promise<{ success: boolean }>;
  importCharacters(files: { content: string; filename: string }[]): Promise<{ filename: string; status: string; characterId?: string; error?: string }[]>;
  fetchBuiltinCharacterCatalog(): Promise<CharacterCatalogItem[]>;
  fetchBuiltinCharacterDetail(id: string): Promise<CharacterCatalogDetail>;
  addBuiltinCharacterToRoles(id: string): Promise<{ success: boolean; message: string; alreadyAdded?: boolean; roleId?: string }>;
  fetchRolePrompts(characterId: string): Promise<RolePromptMap>;
  saveRolePrompt(characterId: string, mode: RolePromptMode, data: { content?: string; enabled?: boolean }): Promise<boolean>;
  deleteRolePrompt(characterId: string, mode: RolePromptMode): Promise<boolean>;
  fetchPromptForms(): Promise<PromptForm[]>;
  createPromptForm(data: { formKey: string; formName: string; formIcon?: string; formDescription?: string }): Promise<PromptForm | null>;
  updatePromptForm(formKey: string, data: { formName?: string; formIcon?: string; formDescription?: string; formSort?: number }): Promise<boolean>;
  deletePromptForm(formKey: string): Promise<boolean>;
}

/** 角色提示词适用形态。build 恒存，其余由用户在角色配置里自定义 */
export type RolePromptMode = string;

/**
 * 提示词形态定义。
 *
 * <p>形态是用户可自定义的（build / plan / 评审 / 只读排查…），会话里的形态切换器
 * 与角色编辑器里的提示词分栏渲染的是<b>同一份</b>列表，所以切换器上每一项都必须
 * 带上中文名、图标和说明——这三样正是 {@link RunModePopover} 直接消费的字段。</p>
 */
export interface PromptForm {
  /** 形态标识，会话的 runMode 存的就是它 */
  formKey: RolePromptMode;
  /** 形态中文名 */
  formName: string;
  /** 图标标识（前端图标注册表 key） */
  formIcon: string | null;
  /** 形态说明 */
  formDescription: string | null;
  /** 是否内置形态（build 恒存，不可删除） */
  builtin: number;
  formSort: number;
}

/** 单个形态下的提示词配置 */
export interface RolePromptEntry {
  /** 正文是否命中分形态表；false 表示继承角色默认 */
  fromTable: boolean;
  /** 实际生效的正文 */
  content: string | null;
  enabled: boolean;
}

/** 形态 → 配置 的映射 */
export interface RolePromptMap {
  roleId: number;
  modes: Record<RolePromptMode, RolePromptEntry>;
  error?: string;
}

export interface CharacterCatalogItem {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  avatar: string;
  added: boolean;
}

export interface CharacterCatalogSkill {
  id: string;
  name: string;
}

export interface CharacterCatalogDetail {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  avatar: string;
  modelType: string;
  added: boolean;
  tags: string[];
  prompts: string[];
  skills: CharacterCatalogSkill[];
}

/**
 * 归一化角色 settings：字符串则解析，确保返回对象（无有效内容时返回 null）。
 */
const normalizeSettings = (raw: any): any => {
  let settings = raw;
  if (typeof settings === "string") {
    try {
      settings = JSON.parse(settings);
    } catch {
      settings = null;
    }
  }
  if (!settings || typeof settings !== "object") return null;
  return settings;
};

/**
 * 将后端 SysAiRole 实体字段映射为前端 Character 结构。
 * - settings 后端以 JSON 字符串存储，这里解析回对象
 * - model（角色绑定模型）映射为前端 modelId
 */
const mapRoleItem = (item: any) => {
  let settings: any = item.settings;
  if (typeof settings === "string" && settings.trim()) {
    try {
      settings = JSON.parse(settings);
    } catch {
      settings = {};
    }
  } else if (!settings || typeof settings !== "object") {
    settings = {};
  }
  const name = item.sysAiRoleName || item.name || "未命名角色";
  const boundModel = item.modelId ?? item.model ?? null;
  return {
    ...item,
    id: item.id,
    name,
    title: item.sysAiRoleName || item.title || name,
    description: item.description || "",
    avatarUrl: item.sysAiRoleAvatar || item.avatar || item.avatarUrl || "",
    systemPrompt: item.sysAiRoleSystemPrompt || item.systemPrompt || settings.systemPrompt || "",
    modelId: boundModel,
    model_id: boundModel,
    temperature: item.temperature ?? null,
    settings,
  };
};

export const characterApi: CharacterApi = {
  async fetchCharacters(this: ApiContext, groupId?: string) {
    const params = groupId ? `?groupId=${groupId}` : "";
    const raw = await this._request(`/roles${params}`);
    // 后端返回数组，映射字段名到前端期望格式
    const list = Array.isArray(raw) ? raw : (raw?.items || []);
    const items = list.map((item: any) => mapRoleItem(item));
    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
    };
  },

  async fetchCharacterGroups(this: ApiContext) {
    const raw = await this._request("/role-groups");
    return Array.isArray(raw) ? raw : (raw?.items || []);
  },

  async createCharacterGroup(this: ApiContext, data: { name: string }) {
    return await this._request("/role-groups", { method: "POST", data });
  },

  async updateCharacterGroup(this: ApiContext, groupId: string, data: { name: string }) {
    return await this._request(`/role-groups/${groupId}`, {
      method: "PUT",
      data,
    });
  },

  async deleteCharacterGroup(this: ApiContext, groupId: string) {
    return await this._request(`/role-groups/${groupId}`, {
      method: "DELETE",
    });
  },

  async fetchCharacter(this: ApiContext, characterId: string) {
    const raw = await this._request(`/roles/${characterId}`);
    // 后端字段名映射到前端期望格式
    return mapRoleItem(raw);
  },

  async createCharacter(this: ApiContext, characterData: any) {
    // 前端字段名映射到后端实体字段名
    const settings = normalizeSettings(characterData.settings);
    const backendData = {
      code: characterData.code || characterData.name || characterData.sysAiRoleCode,
      name: characterData.title || characterData.name || characterData.sysAiRoleName,
      description: characterData.description || "",
      systemPrompt: characterData.systemPrompt || settings?.systemPrompt || "",
      model: characterData.modelId ?? characterData.model ?? null,
      temperature: characterData.temperature ?? null,
      settings: settings ? JSON.stringify(settings) : null,
    };
    const res = await this._request("/roles", {
      method: "POST",
      data: backendData,
    });
    // 后端返回保存后的实体，映射为前端 Character 结构（含 id，供头像上传使用）
    return mapRoleItem(res);
  },

  async updateCharacter(this: ApiContext, characterId: string, characterData: any) {
    const settings = normalizeSettings(characterData.settings);
    const backendData = {
      name: characterData.title || characterData.name,
      description: characterData.description,
      systemPrompt: characterData.systemPrompt || settings?.systemPrompt,
      model: characterData.modelId ?? characterData.model ?? null,
      temperature: characterData.temperature ?? null,
      settings: settings ? JSON.stringify(settings) : null,
    };
    return await this._request(`/roles/${characterId}`, {
      method: "PUT",
      data: backendData,
    });
  },

  async deleteCharacter(this: ApiContext, characterId: string) {
    return await this._request(`/roles/${characterId}`, {
      method: "DELETE",
    });
  },

  async importCharacters(this: ApiContext, files: { content: string; filename: string }[]) {
    return await this._request("/roles/import", {
      method: "POST",
      data: { files },
    });
  },

  async fetchBuiltinCharacterCatalog(this: ApiContext) {
    const raw = await this._request("/roles/catalog/builtin");
    return Array.isArray(raw) ? raw : (raw?.items || []);
  },

  async fetchBuiltinCharacterDetail(this: ApiContext, id: string) {
    return await this._request(`/roles/catalog/builtin/${encodeURIComponent(id)}`);
  },

  async addBuiltinCharacterToRoles(this: ApiContext, id: string) {
    return await this._request(`/roles/catalog/builtin/${id}/add`, {
      method: "POST",
    });
  },

  async fetchRolePrompts(this: ApiContext, characterId: string) {
    return (await this._request(`/roles/${characterId}/prompts`)) as RolePromptMap;
  },

  async saveRolePrompt(this: ApiContext, characterId: string, mode: RolePromptMode,
                        data: { content?: string; enabled?: boolean }) {
    return await this._request(`/roles/${characterId}/prompts/${mode}`, {
      method: "PUT",
      data,
    });
  },

  async deleteRolePrompt(this: ApiContext, characterId: string, mode: RolePromptMode) {
    return await this._request(`/roles/${characterId}/prompts/${mode}`, {
      method: "DELETE",
    });
  },

  async fetchPromptForms(this: ApiContext) {
    const raw = await this._request("/prompt-forms");
    return Array.isArray(raw) ? raw : (raw?.items || []);
  },

  async createPromptForm(this: ApiContext, data: { formKey: string; formName: string; formIcon?: string; formDescription?: string }) {
    return await this._request("/prompt-forms", { method: "POST", data });
  },

  async updatePromptForm(this: ApiContext, formKey: string,
                         data: { formName?: string; formIcon?: string; formDescription?: string; formSort?: number }) {
    return await this._request(`/prompt-forms/${encodeURIComponent(formKey)}`, {
      method: "PUT",
      data,
    });
  },

  async deletePromptForm(this: ApiContext, formKey: string) {
    return await this._request(`/prompt-forms/${encodeURIComponent(formKey)}`, {
      method: "DELETE",
    });
  },
};
