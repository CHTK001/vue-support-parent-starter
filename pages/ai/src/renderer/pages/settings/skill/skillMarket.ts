/**
 * Skill 市场工具
 */
import type { ISkillMarketItem } from '@/common/adapter/ipcBridge';

export const SKILL_MARKET_SOURCES = [
  { id: 'clawhub', name: 'ClawHub', url: 'https://clawhub.example.com', enabled: true },
  { id: 'loophub', name: 'LoopHub', url: 'https://loophub.example.com', enabled: true },
  { id: 'skillhub', name: 'SkillHub', url: 'https://skillhub.example.com', enabled: true },
];

/**
 * 判断 Skill 是否已安装。
 */
export function isSkillMarketItemInstalled(item: ISkillMarketItem, installedNames: Set<string>): boolean {
  return installedNames.has(item.name) || installedNames.has(item.id);
}
