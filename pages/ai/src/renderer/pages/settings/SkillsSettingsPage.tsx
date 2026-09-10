/**
 * SkillsSettingsPage — top-level Skills capability.
 *
 * <p>Tabs:
 *  - 「已安装技能」→ SkillsHubSettings（本地技能库）
 *  - 「技能市场」  → SkillMarketSettings（后端 SPI 市场源，受 /settings/skills 开关控制）</p>
 */
import { Tabs } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useSearchParams } from 'react-router-dom';
import HubPageShell from '@/renderer/components/layout/HubPageShell';
import { ipcBridge } from '@/common';
import type { SkillMarketSource } from '@/common/adapter/ipcBridge';
import SkillsHubSettings from './SkillsHubSettings';
import SkillMarketSettings from './SkillMarketSettings';

const isLegacyMarketLink = (params: URLSearchParams): boolean => params.get('tab') === 'market';

const SkillsSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'installed' | 'market'>('installed');
  const [marketSources, setMarketSources] = useState<SkillMarketSource[]>([]);
  const [sourcesLoaded, setSourcesLoaded] = useState(false);
  const [installedCount, setInstalledCount] = useState<number | null>(null);

  // Legacy market deep link → skills market tab
  if (isLegacyMarketLink(searchParams)) {
    return <Navigate to='/skills?tab=market' replace />;
  }

  useEffect(() => {
    void ipcBridge.fs.statusSkillMarketSources
      .invoke({ marketType: 'skill' })
      .then((res) => {
        const inner = (res as { data?: unknown }).data ?? res;
        const list = (inner as { sources?: unknown })?.sources;
        if (Array.isArray(list)) {
          setMarketSources(
            list
              .filter((s) => (s as { enabled: boolean }).enabled)
              .map((s) => (s as { source: string }).source as SkillMarketSource)
          );
        }
      })
      .catch(() => {})
      .finally(() => setSourcesLoaded(true));
    // 已安装技能数（tab 计数徽标用；失败不显示数字）
    void ipcBridge.fs
      .listAvailableSkills
      .invoke()
      .then((skills) => setInstalledCount(Array.isArray(skills) ? skills.length : 0))
      .catch(() => setInstalledCount(null));
  }, []);

  return (
    <HubPageShell
      title={t('settings.skillsHub.title', { defaultValue: '技能中心' })}
      subtitle={t('settings.skillsHub.description', {
        defaultValue: '集中管理独立的 Agent Skill 能力包，可由任意设定引用。点击技能可查看其内容。',
      })}
      maxWidthClass='md:max-w-1200px'
    >
      <Tabs
        activeTab={activeTab}
        onChange={(key) => setActiveTab(key as 'installed' | 'market')}
        type='line'
        lazyload
        className='flex flex-col flex-1 min-h-0 [&>.arco-tabs-content]:pt-0'
      >
        <Tabs.TabPane
          key='installed'
          title={
            <span className='inline-flex items-center gap-6px'>
              {t('settings.skillsHub.installedTab', { defaultValue: '已安装技能' })}
              {installedCount !== null && installedCount > 0 && (
                <span className='rounded-[100px] bg-fill-2 px-7px text-11px leading-16px text-t-secondary'>
                  {installedCount}
                </span>
              )}
            </span>
          }
        >
          <SkillsHubSettings />
        </Tabs.TabPane>
        <Tabs.TabPane
          key='market'
          title={
            <span className='inline-flex items-center gap-6px'>
              {t('settings.skillsHub.marketTab', { defaultValue: '技能市场' })}
              {sourcesLoaded && marketSources.length > 0 && (
                <span className='rounded-[100px] bg-fill-2 px-7px text-11px leading-16px text-t-secondary'>
                  {marketSources.length}
                </span>
              )}
            </span>
          }
        >
          {sourcesLoaded ? (
            <SkillMarketSettings
              active={activeTab === 'market'}
              sources={marketSources.length > 0 ? marketSources : undefined}
            />
          ) : (
            <div className='py-24px text-center text-13px text-t-secondary'>加载中…</div>
          )}
        </Tabs.TabPane>
      </Tabs>
    </HubPageShell>
  );
};

export default SkillsSettingsPage;
