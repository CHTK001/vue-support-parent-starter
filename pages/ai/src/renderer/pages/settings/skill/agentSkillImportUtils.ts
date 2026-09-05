/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export type ExternalAgentSkill = {
  name: string;
  description: string;
  path: string;
};

export type ExternalAgentSkillSource = {
  name: string;
  path: string;
  source: string;
  skill_count?: number;
  skills: ExternalAgentSkill[];
};

export type AgentSkillInfo = {
  name: string;
  description: string;
  source: string;
  provider?: string;
};

/**
 * 后端 `GET /api/skills/agent` 的 SPI provider 记录（4.0.0.42+）。
 *
 * <p>每个条目对应一个 {@code SkillOfflineProvider} SPI 实现，即使该 agent 未安装也会返回，
 * 便于前端展示「全部来源」而非只显示已安装项。</p>
 */
export type AgentProviderInfo = {
  provider: string;
  name: string;
  installed: boolean;
  skill_count: number;
  skills: AgentSkillInfo[];
};

export type AgentSkillImportRow = ExternalAgentSkill & {
  key: string;
  source: string;
  sourceName: string;
  sourcePath: string;
  alreadyImported: boolean;
};

export type AgentSkillImportSummary = {
  selectedCount: number;
  alreadyImportedCount: number;
  importableCount: number;
};

type ImportedSkillForCustomList = {
  name: string;
  alreadyImported: boolean;
};

const rowKey = (source: string, skill: ExternalAgentSkill) => `${source}::${skill.name}::${skill.path}`;

/**
 * 将本地 Agent skills 转换为 ExternalAgentSkillSource 格式。
 *
 * <p>后端 `GET /api/skills/agent` 通过 {@code ServiceProvider.of(SkillOfflineProvider.class)}
 * 枚举全部 SPI provider，每个 skill 携带 {@code provider} 字段。这里按 provider 分组，
 * 一个 provider 一个来源；缺少 provider 的归入默认组，避免把多 provider 结果压成单个
 * "Local Agent" 来源。</p>
 *
 * @param agentSkills 后端返回的 Agent skill 列表（含按 SPI provider 分组的 provider 字段）
 * @return 按 provider 分组的来源列表
 */
export const convertAgentSkillsToSources = (
  agentSkills: AgentSkillInfo[]
): ExternalAgentSkillSource[] => {
  if (agentSkills.length === 0) {
    return [];
  }

  const byProvider = new Map<string, AgentSkillInfo[]>();
  for (const skill of agentSkills) {
    const provider = skill.provider?.trim() || 'agents';
    let bucket = byProvider.get(provider);
    if (!bucket) {
      bucket = [];
      byProvider.set(provider, bucket);
    }
    bucket.push(skill);
  }

  const sources: ExternalAgentSkillSource[] = [];
  for (const [provider, skills] of byProvider) {
    sources.push({
      name: provider === 'agents' ? 'Local Agent' : `${provider} Agent Skills`,
      path: `agent://${provider}`,
      source: provider === 'agents' ? 'agent' : provider,
      skill_count: skills.length,
      skills: skills.map((skill) => ({
        name: skill.name,
        description: skill.description,
        path: `agent://${provider}/${skill.name}`,
      })),
    });
  }
  return sources;
};

/**
 * 将后端返回的 SPI provider 记录列表转换为「全部来源」展示。
 *
 * <p>与 {@link convertAgentSkillsToSources} 不同：此函数接收的是按 provider 组织的
 * 顶层记录（含未安装项），每项输出为一个来源卡片——未安装的来源技能列表为空，
 * 由调用方决定如何呈现（例如置灰「未安装」）。</p>
 *
 * @param providers 后端 SPI provider 记录列表
 * @return 来源列表（顺序与后端 SPI 注册保持一致）
 */
export const convertAgentProvidersToSources = (
  providers: AgentProviderInfo[]
): ExternalAgentSkillSource[] =>
  providers.map((providerInfo) => ({
    name: `${providerInfo.name || providerInfo.provider} Agent Skills`,
    path: `agent://${providerInfo.provider}`,
    source: providerInfo.provider,
    skill_count: providerInfo.skill_count ?? 0,
    skills: (providerInfo.skills ?? []).map((skill) => ({
      name: skill.name,
      description: skill.description,
      path: `agent://${providerInfo.provider}/${skill.name}`,
    })),
  }));

export const buildAgentSkillRows = (
  sources: ExternalAgentSkillSource[],
  existingSkillNames: Set<string>
): AgentSkillImportRow[] =>
  sources.flatMap((source) =>
    source.skills.map((skill) => ({
      ...skill,
      key: rowKey(source.source, skill),
      source: source.source,
      sourceName: source.name,
      sourcePath: source.path,
      alreadyImported: existingSkillNames.has(skill.name),
    }))
  );

export const defaultSelectedAgentSkillKeys = (rows: AgentSkillImportRow[]): string[] =>
  rows.filter((row) => !row.alreadyImported).map((row) => row.key);

export const mergeImportedSkillNames = (current: string[], imported: string[]): string[] =>
  Array.from(new Set([...current, ...imported.filter((name) => name.trim().length > 0)]));

export const customSkillNamesForImportedAgentSkills = (
  imported: ImportedSkillForCustomList[],
  existingCustomSkillNames: Set<string>
): string[] =>
  imported
    .filter((skill) => !skill.alreadyImported || existingCustomSkillNames.has(skill.name))
    .map((skill) => skill.name);

export const summarizeAgentSkillImport = (
  _rows: AgentSkillImportRow[],
  selectedRows: AgentSkillImportRow[]
): AgentSkillImportSummary => {
  const alreadyImportedCount = selectedRows.filter((row) => row.alreadyImported).length;
  return {
    selectedCount: selectedRows.length,
    alreadyImportedCount,
    importableCount: selectedRows.length - alreadyImportedCount,
  };
};
