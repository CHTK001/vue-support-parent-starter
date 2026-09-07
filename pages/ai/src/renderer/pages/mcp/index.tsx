/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Tabs } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import HubPageShell from '@/renderer/components/layout/HubPageShell';
import { ToolsModalContentWithState } from '@/renderer/components/settings/SettingsModal/contents/ToolsModalContent';
import { useMcpServers } from '@/renderer/hooks/mcp';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import { ipcBridge } from '@/common';
import type { SkillMarketSource } from '@/common/adapter/ipcBridge';
import McpMarketSettings from './McpMarketSettings';

type McpTab = 'servers' | 'market';

const isMcpTab = (value: string | null): value is McpTab =>
  value === 'servers' || value === 'market';

const McpPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mcpMessage, mcpMessageContext] = useArcoMessage({ maxCount: 10 });
  const {
    mcpServers,
    extensionMcpServers,
    saveMcpServers,
    setMcpServers,
  } = useMcpServers();
  const [enabledMcpSources, setEnabledMcpSources] = useState<SkillMarketSource[]>([]);
  const tabParam = searchParams.get('tab');
  const activeTab: McpTab = isMcpTab(tabParam) ? tabParam : 'servers';

  useEffect(() => {
    let active = true;
    void ipcBridge.fs.statusSkillMarketSources
      .invoke({ marketType: 'mcp' })
      .then((res) => {
        if (!active) return;
        const inner = (res as { data?: unknown }).data ?? res;
        const list = (inner as { sources?: unknown })?.sources;
        if (!Array.isArray(list)) return;
        setEnabledMcpSources(
          list
            .filter((s) => (s as { enabled: boolean }).enabled)
            .map((s) => (s as { source: string }).source as SkillMarketSource)
        );
      })
      .catch(() => {
        if (active) setEnabledMcpSources([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleTabChange = (key: string) => {
    if (!isMcpTab(key)) return;
    const next = new URLSearchParams(searchParams);
    if (key === 'servers') next.delete('tab');
    else next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  return (
    <HubPageShell
      title={t('settings.mcpHub.title', { defaultValue: 'MCP' })}
      subtitle={t('settings.mcpHub.subtitle', {
        defaultValue: 'Register and browse MCP servers.',
      })}
      maxWidthClass='md:max-w-1200px'
    >
      <Tabs
        activeTab={activeTab}
        onChange={handleTabChange}
        type='line'
        lazyload
        className='flex flex-col flex-1 min-h-0 [&>.arco-tabs-content]:pt-0'
      >
        <Tabs.TabPane key='servers' title={t('settings.mcpPage.installedMcpTab', { defaultValue: 'Installed MCP' })}>
          <ToolsModalContentWithState
            mcpMessage={mcpMessage}
            mcpMessageContext={mcpMessageContext}
            mcpServers={mcpServers}
            extensionMcpServers={extensionMcpServers}
            saveMcpServers={saveMcpServers}
            setMcpServers={setMcpServers}
          />
        </Tabs.TabPane>
        <Tabs.TabPane
          key='market'
          title={t('settings.mcpPage.mcpMarketTab', { defaultValue: 'MCP Market' })}
        >
          <McpMarketSettings sources={enabledMcpSources} mcpServers={mcpServers} saveMcpServers={saveMcpServers} />
        </Tabs.TabPane>
      </Tabs>
    </HubPageShell>
  );
};

export default McpPage;