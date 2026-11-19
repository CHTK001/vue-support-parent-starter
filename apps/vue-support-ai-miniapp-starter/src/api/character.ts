import { http } from "./http";

/** 角色（assistant）精简信息（后端为 SysAiRole 实体，字段与 PC 端 mapRoleItem 入参一致） */
export interface CharacterItem {
  id: string;
  code?: string;
  title?: string;
  name?: string;
  /** 后端实体原始名称字段（sys_ai_role_name） */
  sysAiRoleName?: string;
}

/** 角色列表（GET /v2/roles，与 PC 端 characterApi.fetchCharacters 同一接口），用于挑选新建会话的默认角色 */
export async function fetchCharacters(): Promise<CharacterItem[]> {
  const data = await http.get<{ items?: CharacterItem[] } | CharacterItem[]>("/roles");
  if (Array.isArray(data)) return data;
  return data?.items || [];
}

/**
 * 挑选默认角色：与 PC 端 CreateSessionChatPanel 同一口径——
 * 优先内置「通用」角色（code=general-assistant 或名称含「通用」），否则取列表第一个。
 */
export function pickDefaultCharacter(characters: CharacterItem[]): CharacterItem | null {
  const generic = characters.find(
    (c) =>
      String(c.code || "").toLowerCase() === "general-assistant" ||
      /通用/.test(String(c.title || c.name || c.sysAiRoleName || "")),
  );
  return generic || characters[0] || null;
}
