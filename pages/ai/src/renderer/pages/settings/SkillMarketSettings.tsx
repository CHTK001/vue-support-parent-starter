/**
 * SkillMarketSettings — 插件/技能市场页。
 *
 * 数据链路（全部走后端 AiSkillController /api/skills*）：
 *  - 市场源配置 → GET /api/skills/market/sources/status?marketType=skill
 *  - 排行数据   → POST /api/skills/market/rankings/sync
 *  - 已安装集合 → GET /api/skills + /api/skills/detect-external（经 ipcBridge fs）
 *  - 安装       → POST /api/skills/market/package/install（经 ipcBridge fs）
 */
import { ipcBridge } from '@/common';
import type { ISkillMarketItem, SkillMarketSource } from '@/common/adapter/ipcBridge';
import { listMarketSources, syncMarketRankings, type MarketItem } from '@/common/api/skillMarket';
import { AxiosError } from '@/common/adapter/httpBridge';
import MarketSettingsPanel from './MarketSettingsPanel';
import { ENHANCED_TOOLS_PAGE_STACK_CLASS } from './enhancedToolsLayout';
import { isSkillMarketItemInstalled } from './skill/skillMarket';
import React, { useCallback, useEffect, useState } from 'react';
import { Message } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';

const CACHE_KEY = 'nomifun.skillMarket.rankings.v4';
const AUTO_SYNC_KEY = 'nomifun.skillMarket.autoSynced.v4';

type SkillMarketSettingsProps = {
  active?: boolean;
  /** 启用的市场源列表（缺省由后端 SPI 配置提供：marketType=skill）。 */
  sources?: SkillMarketSource[];
};

/** 将后端排行条目映射为面板可渲染条目（面板展示 name/description/tags） */
function toMarketItem(item: MarketItem): ISkillMarketItem {
  return {
    id: item.id,
    source: item.source,
    name: item.name,
    url: item.url,
    description: item.description,
    tags: item.tags,
  };
}

const SkillMarketSettings: React.FC<SkillMarketSettingsProps> = ({ active = true, sources }) => {
  const { t } = useTranslation();
  const [backendSources, setBackendSources] = useState<SkillMarketSource[]>([]);
  const enabledSources = sources && sources.length > 0
    ? sources
    : (backendSources.length > 0
      ? backendSources
      : [{ id: 'clawhub', name: 'ClawHub', url: '', enabled: false }]);
  const [installedSkillNames, setInstalledSkillNames] = useState<Set<string>>(new Set());
  const [installedStateLoading, setInstalledStateLoading] = useState(true);
  const [installedStateAvailable, setInstalledStateAvailable] = useState(false);

  /* 加载后端市场源配置（marketType=skill） */
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    listMarketSources('skill')
      .then((list) => {
        if (disposed) return;
        const mapped: SkillMarketSource[] = (list ?? []).map((s) => ({
          id: s.source,
          name: s.displayName || s.source,
          url: s.url || '',
          enabled: s.enabled,
        }));
        if (mapped.length > 0) setBackendSources(mapped);
      })
      .catch((e) => console.error('Failed to load market sources:', e));
    return () => { disposed = true; };
  }, [active]);

  /* 已安装技能集合（后端扫描：Nomi skills + 外部 Agent skills） */
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    setInstalledStateLoading(true);
    setInstalledStateAvailable(false);
    void Promise.allSettled([
      ipcBridge.fs.listAvailableSkills.invoke(),
      ipcBridge.fs.detectAndCountExternalSkills.invoke(),
    ])
      .then(([availableResult, externalResult]) => {
        const names = new Set<string>();
        if (availableResult.status === 'fulfilled') {
          for (const skill of availableResult.value) names.add(skill.name);
        } else {
          console.error('Failed to load Nomi skills for the market:', availableResult.reason);
        }
        if (externalResult.status === 'fulfilled') {
          for (const source of externalResult.value) {
            for (const skill of source.skills) names.add(skill.name);
          }
        } else {
          console.error('Failed to load external Agent skills for the market:', externalResult.reason);
        }
        if (!disposed) {
          setInstalledSkillNames(names);
          setInstalledStateAvailable(
            availableResult.status === 'fulfilled' || externalResult.status === 'fulfilled'
          );
        }
      })
      .finally(() => {
        if (!disposed) setInstalledStateLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [active]);

  const isAdded = useCallback(
    (item: { name: string; id: string }) => isSkillMarketItemInstalled(item, installedSkillNames),
    [installedSkillNames]
  );

  const refreshInstalled = useCallback(async () => {
    try {
      const [availableResult, externalResult] = await Promise.allSettled([
        ipcBridge.fs.listAvailableSkills.invoke(),
        ipcBridge.fs.detectAndCountExternalSkills.invoke(),
      ]);
      const names = new Set<string>();
      if (availableResult.status === 'fulfilled') {
        for (const skill of availableResult.value) names.add(skill.name);
      }
      if (externalResult.status === 'fulfilled') {
        for (const source of externalResult.value) {
          for (const skill of source.skills) names.add(skill.name);
        }
      }
      setInstalledSkillNames(names);
    } catch (error) {
      console.error('Failed to refresh installed skills:', error);
    }
  }, []);

  /* 排行数据拉取：按源同步后端榜单，映射为面板条目 */
  const panelFetchFn = useCallback(async (sourceId: string): Promise<ISkillMarketItem[]> => {
    const result = await syncMarketRankings([sourceId]);
    return (result?.items ?? []).map(toMarketItem);
  }, []);

  const handleAdd = useCallback(
    async (item: { id?: string; source?: string; url?: string; name?: string }) => {
      try {
        const installed = await ipcBridge.fs.installSkillMarketPackage.invoke({
          source: item.source ?? '',
          id: item.id ?? item.name ?? '',
          url: item.url ?? '',
        });
        const failedCount = installed.errors?.length ?? 0;
        const okNames = installed.installed_skill_names ?? [];
        if (okNames.length > 0) {
          Message.success(
            t('settings.skillsMarket.installSuccess', {
              count: okNames.length,
              names: okNames.join(', '),
              defaultValue: `已安装技能：${okNames.join(', ')}`,
            })
          );
          await refreshInstalled();
        } else if (failedCount > 0) {
          const detail = installed.errors?.[0]?.error ?? '';
          Message.error(
            t('settings.skillsMarket.installFailed', {
              detail,
              defaultValue: detail ? `安装失败：${detail}` : '安装失败',
            })
          );
        }
      } catch (error) {
        console.error('Failed to install market skill:', error);
        const serviceDown = error instanceof AxiosError && (error.response?.status ?? 0) >= 500;
        Message.error(
          serviceDown
            ? t('settings.skillsMarket.serviceUnavailable', {
                defaultValue: '服务暂时不可用（后端或 SkillHub），请稍后重试。',
              })
            : String(error)
        );
      }
    },
    [refreshInstalled, t]
  );

  return (
    <div className='flex flex-col h-full w-full'>
      <div className={ENHANCED_TOOLS_PAGE_STACK_CLASS}>
        <MarketSettingsPanel
          title={t('settings.skillsMarket.title', { defaultValue: '技能市场' })}
          description={t('settings.skillsMarket.description', {
            defaultValue: '同步 ClawHub、LoopHub 与 SkillHub 最新榜单，选择技能后直接安装到本机。',
          })}
          sources={enabledSources}
          cacheKey={CACHE_KEY}
          autoSyncKey={AUTO_SYNC_KEY}
          defaultSource={enabledSources[0]?.id ?? 'clawhub'}
          searchPlaceholder={t('settings.skillsMarket.searchPlaceholder', { defaultValue: '搜索当前市场技能...' })}
          emptyText={t('settings.skillsMarket.empty', { defaultValue: '正在准备榜单，点击刷新可重新采集。' })}
          fetchFn={panelFetchFn}
          onAdd={handleAdd}
          isAdded={isAdded}
          addedStateLoading={installedStateLoading || !installedStateAvailable}
          enableTagFilter
          testIdPrefix='skill-market'
          text={{
            syncSuccess: t('settings.skillsMarket.syncSuccess', { defaultValue: '技能市场已更新' }),
            syncKeptCache: t('settings.skillsMarket.syncKeptCache', { defaultValue: '未获取到新榜单，已保留本地缓存。' }),
            syncEmpty: t('settings.skillsMarket.syncEmpty', { defaultValue: '未采集到榜单数据。' }),
            syncError: t('settings.skillsMarket.syncError', { defaultValue: '更新技能市场失败' }),
            openFailed: t('settings.skillsMarket.openMarketFailed', { defaultValue: '无法打开技能市场' }),
            openInBrowser: t('settings.skillsMarket.openInBrowser', { defaultValue: '在浏览器中打开市场' }),
            noSearchMatch: (query, sourceLabel) =>
              t('settings.skillsMarket.noSearchMatch', {
                query,
                source: sourceLabel,
                defaultValue: `当前 ${sourceLabel} 未找到“${query}”相关技能。`,
              }),
            noFilterMatch: t('settings.skillsMarket.noMatch', { defaultValue: '没有符合当前筛选条件的技能。' }),
            lastUpdated: (time) =>
              t('settings.skillsMarket.lastUpdated', { time, defaultValue: '上次更新：{{time}}' }),
          }}
        />
      </div>
    </div>
  );
};

export default SkillMarketSettings;