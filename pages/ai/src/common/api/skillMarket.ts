/**
 * skillMarketApi — 插件/技能市场前端 API 层
 *
 * 对接后端 ApiSkillController（/api/skills*）：
 *  - 已安装技能列表 → GET /api/skills
 *  - 外部技能探测   → GET /api/skills/detect-external
 *  - 市场源配置     → GET /api/skills/market/sources/status
 *  - 市场排行同步   → POST /api/skills/market/rankings/sync
 *  - 安装市场包     → POST /api/skills/market/package/install
 *  - 技能内容预览   → POST /api/skills/market/content
 *  - 删除技能       → DELETE /api/skills/{skill_name}
 *
 * 统一使用 @repo/core 的 http() + @repo/utils 的 unwrapResult 解包 { success, data } 信封。
 */
import { http } from '@repo/core';
import { unwrapResult } from '@repo/utils';

export interface SkillEntry {
  name: string;
  description?: string;
  location?: string;
  relative_location?: string;
  is_custom?: boolean;
  source?: string;
}

export interface ExternalSkillSource {
  name: string;
  path: string;
  source: string;
  skill_count: number;
  skills: { name: string; description?: string; path?: string }[];
}

export interface MarketSourceConfig {
  source: string;
  displayName: string;
  url: string;
  marketType: string;
  enabled: boolean;
}

export interface MarketItem {
  id: string;
  source: string;
  rank: number;
  name: string;
  description?: string;
  url: string;
  install_command?: string;
  tags?: string[];
  stats?: string;
}

export interface MarketSyncResult {
  items: MarketItem[];
  fetched_at: number;
  errors: string[];
  source_status: Record<string, string>;
}

export interface InstallResult {
  package?: {
    name: string;
    description?: string;
    skill_slugs?: string[];
  };
  installed_skill_names: string[];
  errors: { skill_slug: string; error: string }[];
}

/** 列出已安装技能（user + builtin） */
export function listSkills(): Promise<SkillEntry[]> {
  return http().get('/api/skills').then((r) => unwrapResult<SkillEntry[]>(r));
}

/** 探测外部技能目录 */
export function detectExternalSkills(): Promise<ExternalSkillSource[]> {
  return http().get('/api/skills/detect-external').then((r) => unwrapResult<ExternalSkillSource[]>(r));
}

/** 查询市场源配置（按市场类型过滤：skill / mcp / plugin / preset，空返回全部） */
export function listMarketSources(marketType?: string): Promise<MarketSourceConfig[]> {
  const q = marketType ? `?marketType=${encodeURIComponent(marketType)}` : '';
  return http().get(`/api/skills/market/sources/status${q}`)
    .then((r) => unwrapResult<{ sources: MarketSourceConfig[] }>(r))
    .then((d) => d?.sources ?? []);
}

/** 同步市场排行数据 */
export function syncMarketRankings(sources: string[]): Promise<MarketSyncResult> {
  return http().post('/api/skills/market/rankings/sync')
    .data({ sources })
    .then((r) => unwrapResult<MarketSyncResult>(r));
}

/** 安装市场技能包（GitHub 仓库子目录真实下载安装） */
export function installMarketPackage(opts: { source: string; id: string; url: string }): Promise<InstallResult> {
  return http().post('/api/skills/market/package/install')
    .data(opts)
    .then((r) => unwrapResult<InstallResult>(r));
}

/** 拉取市场技能内容预览（SKILL.md） */
export function fetchMarketContent(opts: { source: string; id: string; url: string }): Promise<{
  content: string;
  available: boolean;
  source_url?: string;
}> {
  return http().post('/api/skills/market/content')
    .data(opts)
    .then((r) => unwrapResult<{ content: string; available: boolean; source_url?: string }>(r));
}

/** 删除用户技能 */
export function deleteSkill(skillName: string): Promise<void> {
  return http().delete(`/api/skills/${encodeURIComponent(skillName)}`)
    .then((r) => unwrapResult<unknown>(r))
    .then(() => undefined);
}