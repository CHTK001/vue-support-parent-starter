/**
 * ipcBridge — Tauri IPC 桥接
 *
 * 在 WebUI/dev 模式下降级为 HTTP 调用；桌面模式走 '@tauri-apps/api'。
 */

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
      invoke: async (): Promise<unknown[]> => [],
    },
    detectAndCountExternalSkills: {
      invoke: async (): Promise<unknown[]> => [],
    },
    installSkillMarketPackage: {
      invoke: async (_opts: { source: string; id: string; url: string }): Promise<{ installed_skill_names: string[]; errors: string[] }> => {
        return { installed_skill_names: [], errors: [] };
      },
    },
  },
};
