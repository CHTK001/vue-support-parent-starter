/**
 * ipcBridge — Tauri IPC 桥接
 *
 * 在 WebUI/dev 模式下降级为 HTTP 调用；桌面模式走 '@tauri-apps/api'。
 *
 * 技能/插件市场相关操作（listAvailableSkills / detectAndCountExternalSkills /
 * installSkillMarketPackage）已对接后端 AiSkillController（/api/skills*）：
 * 由 @/common/api/skillMarket 提供真实 HTTP 实现，返回结构保持 IPC 契约兼容。
 */

import {
  listSkills,
  detectExternalSkills,
  installMarketPackage,
} from '@/common/api/skillMarket';

export interface ISkillMarketItem {
  id: string;
  source: string;
  name: string;
  url: string;
  description?: string;
  author?: string;
  tags?: string[];
  downloads?: number;
  stars?: number;
}

export interface SkillMarketSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export const ipcBridge = {
  fs: {
    listAvailableSkills: {
      invoke: async (): Promise<{ name: string; description?: string }[]> => {
        const skills = await listSkills();
        return skills.map((s) => ({ name: s.name, description: s.description ?? '' }));
      },
    },
    detectAndCountExternalSkills: {
      invoke: async (): Promise<{ name: string; skills: { name: string }[] }[]> => {
        const sources = await detectExternalSkills();
        return sources.map((s) => ({
          name: s.name,
          skills: (s.skills ?? []).map((k) => ({ name: k.name })),
        }));
      },
    },
    installSkillMarketPackage: {
      invoke: async (opts: { source: string; id: string; url: string }): Promise<{ installed_skill_names: string[]; errors: string[] }> => {
        const result = await installMarketPackage(opts);
        return {
          installed_skill_names: result.installed_skill_names ?? [],
          errors: Array.isArray(result.errors)
            ? result.errors.map((e) => e?.error ?? String(e))
            : [],
        };
      },
    },
  },
};