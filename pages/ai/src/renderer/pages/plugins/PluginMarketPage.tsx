/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import HubPageShell from '@/renderer/components/layout/HubPageShell';
import { ipcBridge } from '@/common';
import type { SkillMarketSource } from '@/common/adapter/ipcBridge';
import PluginSettingsPanel from './PluginSettingsPanel';

const PluginMarketPage: React.FC = () => {
  const { t } = useTranslation();
  const [enabledSources, setEnabledSources] = useState<SkillMarketSource[]>([]);
  const [sourcesLoaded, setSourcesLoaded] = useState(false);

  useEffect(() => {
    void ipcBridge.fs.statusSkillMarketSources
      .invoke({ marketType: 'plugin' })
      .then((res) => {
        const inner = (res as { data?: unknown }).data ?? res;
        const list = (inner as { sources?: unknown })?.sources;
        if (Array.isArray(list)) {
          setEnabledSources(
            list
              .filter((s) => (s as { enabled: boolean }).enabled)
              .map((s) => (s as { source: string }).source as SkillMarketSource)
          );
        }
      })
      .catch(() => {})
      .finally(() => setSourcesLoaded(true));
  }, []);

  return (
    <HubPageShell
      title={t('settings.pluginsHub.title', { defaultValue: '插件市场' })}
      subtitle={t('settings.pluginsHub.subtitle', {
        defaultValue: '浏览 ClawHub 插件市场，将选中的插件安装到当前工作区。',
      })}
      maxWidthClass='md:max-w-1200px'
    >
      {sourcesLoaded ? (
        <PluginSettingsPanel
          section='market'
          sources={enabledSources.length > 0 ? enabledSources : undefined}
        />
      ) : (
        <div className='py-24px text-center text-13px text-t-secondary'>加载中…</div>
      )}
    </HubPageShell>
  );
};

export default PluginMarketPage;
