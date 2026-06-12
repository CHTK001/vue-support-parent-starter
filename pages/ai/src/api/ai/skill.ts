import { http, type ReturnResult } from "@repo/utils";

export type AiSkillStatus = 0 | 1;

export interface AiSkill {
  sysAiSkillId?: number;
  sysAiSkillName: string;
  sysAiSkillCode: string;
  sysAiSkillModuleId?: number;
  sysAiSkillContent?: string;
  sysAiSkillIcon?: string;
  sysAiSkillStatus?: AiSkillStatus;
  sysAiSkillSort?: number;
  sysAiSkillRemark?: string;
}

export const listAiSkills = async (
  sysAiModuleId?: number,
  sysAiSkillName?: string,
  sysAiSkillStatus?: AiSkillStatus,
) => {
  return http.request<ReturnResult<AiSkill[]>>("get", "/v2/ai/skill/list", {
    params: { sysAiModuleId, sysAiSkillName, sysAiSkillStatus },
  });
};

export const saveAiSkill = async (data: AiSkill) => {
  return http.request<ReturnResult<AiSkill>>("post", "/v2/ai/skill/save", {
    data,
  });
};

export const updateAiSkill = async (data: AiSkill) => {
  return http.request<ReturnResult<boolean>>("put", "/v2/ai/skill/update", {
    data,
  });
};

export const deleteAiSkill = async (sysAiSkillId: number) => {
  return http.request<ReturnResult<boolean>>("delete", "/v2/ai/skill/delete", {
    params: { sysAiSkillId },
  });
};

export const downloadAiSkill = async (skillCode: string) => {
  return http.request<ReturnResult<string>>("get", "/v2/ai/skill/download", {
    params: { skillCode },
  });
};

export const copyAiSkill = async (skillId: number, newName?: string) => {
  return http.request<ReturnResult<AiSkill>>("post", "/v2/ai/skill/copy", {
    params: { skillId, newName },
  });
};
