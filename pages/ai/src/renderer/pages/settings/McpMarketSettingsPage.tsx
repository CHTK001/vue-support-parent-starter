import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import McpMarketSettings from '@/renderer/pages/mcp/McpMarketSettings';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import PreferenceRow from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent/PreferenceRow';
import { useMcpServers } from '@/renderer/hooks/mcp';

/**
 * MCP 市场设置页（/settings/mcp）。
 *
 * <p>承载 MCP 市场（SkillHub MCP / MCP World）与「MCP 市场」总开关。
 * 市场开关经后端 SPI 持久化到 sys_ai_global_setting（mcp/market_enabled）；
 * 关闭后 McpMarketSettings 隐藏（不渲染、不拉取），仅保留开关供重新开启。</p>
 */
const McpMarketSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [message, messageContext] = useArcoMessage({ maxCount: 3 });
  const [marketEnabled, setMarketEnabled] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const {
    mcpServers,
    isMcpServersLoading,
    mcpServersLoadFailed,
    saveMcpServers,
  } = useMcpServers();

  useEffect(() => {
    let active = true;
    setStatusLoading(true);
      void ipcBridge.mcpService.statusMcpMarket
        .invoke()
      .then((status) => {
        if (active) setMarketEnabled(status?.enabled ?? true);
      })
      .catch(() => {
        if (active) setMarketEnabled(true);
      })
      .finally(() => {
        if (active) setStatusLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleMarket = useCallback(
    async (enabled: boolean) => {
      setSaving(true);
      setMarketEnabled(enabled);
      try {
        if (enabled) {
          await ipcBridge.mcpService.enableMcpMarket.invoke();
        } else {
          await ipcBridge.mcpService.disableMcpMarket.invoke();
        }
        message.success(
          t('settings.mcpMarket.toggleSuccess', {
            defaultValue: enabled ? 'MCP 市场已开启' : 'MCP 市场已关闭',
          })
        );
      } catch (error) {
        setMarketEnabled(!enabled);
        console.error('Failed to toggle MCP market:', error);
        message.error(
          t('settings.mcpMarket.toggleFailed', { defaultValue: 'MCP 市场开关操作失败' })
        );
      } finally {
        setSaving(false);
      }
    },
    [message, t]
  );

  return (
    <SettingsPageWrapper>
      {messageContext}
      <div className='flex flex-col h-full w-full'>
        <NomiScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow>
          <div className='px-[12px] md:px-[32px] py-16px bg-2 rd-16px space-y-12px'>
            <div className='w-full flex flex-col divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
              <PreferenceRow
                label={t('settings.mcpMarket.enableMarket', { defaultValue: '启用 MCP 市场' })}
                description={t('settings.mcpMarket.enableMarketDesc', {
                  defaultValue: '开启后展示 SkillHub MCP、MCP World 等市场；关闭后隐藏市场并停止拉取。',
                })}
              >
                <Switch
                  checked={marketEnabled}
                  loading={saving || statusLoading}
                  onChange={(v: boolean) => void toggleMarket(v)}
                  data-testid='mcp-market-enabled-switch'
                />
              </PreferenceRow>
            </div>
          </div>

          {marketEnabled && !statusLoading && (
            <div className='mt-16px'>
              <McpMarketSettings
                saveMcpServers={saveMcpServers}
                mcpServers={mcpServers}
                addedStateLoading={isMcpServersLoading || mcpServersLoadFailed}
              />
            </div>
          )}
        </NomiScrollArea>
      </div>
    </SettingsPageWrapper>
  );
};

export default McpMarketSettingsPage;