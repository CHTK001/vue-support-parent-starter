import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, Tag } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import type { SkillMarketSource } from '@/common/adapter/ipcBridge';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import PreferenceRow from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent/PreferenceRow';
import { marketSourceLabel } from './skill/skillMarket';

/** 后端 SkillMarketSourceProvider SPI 枚举的市场源配置。 */
export type SkillMarketSourceConfig = {
  source: SkillMarketSource;
  displayName: string;
  url: string;
  marketType: string;
  enabled: boolean;
};

/**
 * MCP 设置页（/settings/mcp）。
 *
 * <p>市场源由后端 {@code SkillMarketSourceProvider} SPI 定义。本页只做一件事：
 * 枚举 SPI 渲染「来源配置」开关列表（每个 MCP 市场源一个开关，持久化到
 * {@code sys_ai_global_setting} 的 {@code skills} 分组），控制启用哪些 MCP 市场；
 * 不在此展示市场内容，只配置源开关。</p>
 */
const McpMarketSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [message, messageContext] = useArcoMessage({ maxCount: 3 });
  const [sources, setSources] = useState<SkillMarketSourceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<SkillMarketSource | null>(null);

  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ipcBridge.fs.statusSkillMarketSources.invoke({ marketType: 'mcp' });
      setSources(
        (res?.sources ?? []).map((s) => ({ ...s, source: s.source as SkillMarketSource }))
      );
    } catch (error) {
      console.error('Failed to load MCP market sources:', error);
      message.error(
        t('settings.mcpMarket.loadSourcesFailed', {
          defaultValue: '市场源配置加载失败',
        })
      );
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  const toggleSource = useCallback(
    async (source: SkillMarketSource, enabled: boolean) => {
      setToggling(source);
      setSources((prev) => prev.map((s) => (s.source === source ? { ...s, enabled } : s)));
      try {
        await ipcBridge.fs.toggleSkillMarketSource.invoke({ source, enabled });
        message.success(
          t('settings.mcpMarket.sourceToggleSuccess', {
            name: marketSourceLabel(source),
            enabled,
            defaultValue: `${marketSourceLabel(source)} 已${enabled ? '启用' : '关闭'}`,
          })
        );
      } catch (error) {
        setSources((prev) => prev.map((s) => (s.source === source ? { ...s, enabled: !enabled } : s)));
        console.error(`Failed to toggle MCP market source ${source}:`, error);
        message.error(
          t('settings.mcpMarket.sourceToggleFailed', {
            defaultValue: '市场源开关操作失败',
          })
        );
      } finally {
        setToggling(null);
      }
    },
    [message, t]
  );

  const enabledCount = sources.filter((s) => s.enabled).length;
  const sourceTone = (source: SkillMarketSource): string => {
    if (['skillhub_mcp', 'mcpworld'].includes(source)) return 'bg-[rgba(var(--success-6),0.1)] text-success-6';
    return 'bg-[rgba(var(--primary-6),0.08)] text-primary-6';
  };

  return (
    <SettingsPageWrapper>
      {messageContext}
      <div className='flex flex-col h-full w-full'>
        <NomiScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow>
          <div className='px-[12px] md:px-[32px] py-16px bg-2 rd-16px space-y-12px'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-14px font-600 text-t-primary'>
                  {t('settings.mcpMarket.settingsTitle', { defaultValue: 'MCP 设置' })}
                </div>
                <div className='mt-2px text-12px leading-18px text-t-secondary'>
                  {t('settings.mcpMarket.sourceConfigDesc', {
                    count: enabledCount,
                    total: sources.length,
                    defaultValue: `市场源由后端 SPI 定义，共 ${sources.length} 个，当前启用 ${enabledCount} 个；仅启用的来源会在 MCP 市场中被拉取。`,
                  })}
                </div>
              </div>
              <Tag size='small' className={enabledCount > 0 ? 'bg-[rgba(var(--success-6),0.1)] text-success-6' : 'bg-fill-2 text-t-secondary'}>
                {enabledCount}/{sources.length}
              </Tag>
            </div>
            <div className='w-full flex flex-col divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
              {loading ? (
                <div className='py-16px text-center text-13px text-t-secondary'>
                  {t('settings.globalSettingsLoading', { defaultValue: '加载中…' })}
                </div>
              ) : (
                sources.map((source) => (
                  <PreferenceRow
                    key={source.source}
                    label={source.displayName}
                    description={source.url}
                  >
                    <span className='flex items-center gap-8px'>
                      <Tag size='small' bordered={false} className={sourceTone(source.source)}>
                        {marketSourceLabel(source.source)}
                      </Tag>
                      <Switch
                        size='small'
                        checked={source.enabled}
                        loading={toggling === source.source}
                        onChange={(v: boolean) => void toggleSource(source.source, v)}
                        data-testid={`mcp-market-source-toggle-${source.source}`}
                      />
                    </span>
                  </PreferenceRow>
                ))
              )}
            </div>
          </div>
        </NomiScrollArea>
      </div>
    </SettingsPageWrapper>
  );
};

export default McpMarketSettingsPage;