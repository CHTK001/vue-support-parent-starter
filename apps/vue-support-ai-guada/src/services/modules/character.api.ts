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
}

export const characterApi: CharacterApi = {
  async fetchCharacters(this: ApiContext, groupId?: string) {
    const params = groupId ? `?groupId=${groupId}` : "";
    const raw = await this._request(`/roles${params}`);
    // 后端返回数组，映射字段名到前端期望格式
    const list = Array.isArray(raw) ? raw : (raw?.items || []);
    const items = list.map((item: any) => ({
      ...item,
      id: item.id,
      name: item.sysAiRoleName || item.name || "未命名角色",
      title: item.sysAiRoleName || item.title || item.name,
      description: item.description || "",
      systemPrompt: item.sysAiRoleSystemPrompt || item.systemPrompt || "",
    }));
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
    return {
      ...raw,
      id: raw.id,
      name: raw.name || "未命名角色",
      title: raw.name || raw.title,
      description: raw.description || "",
      systemPrompt: raw.systemPrompt || "",
    };
  },

  async createCharacter(this: ApiContext, characterData: any) {
    // 前端字段名映射到后端实体字段名
    const backendData = {
      code: characterData.code || characterData.name || characterData.sysAiRoleCode,
      name: characterData.title || characterData.name || characterData.sysAiRoleName,
      description: characterData.description || "",
      systemPrompt: characterData.systemPrompt || characterData.prompt || "",
    };
    return await this._request("/roles", {
      method: "POST",
      data: backendData,
    });
  },

  async updateCharacter(this: ApiContext, characterId: string, characterData: any) {
    const backendData = {
      name: characterData.title || characterData.name,
      description: characterData.description,
      systemPrompt: characterData.systemPrompt || characterData.prompt,
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
};
