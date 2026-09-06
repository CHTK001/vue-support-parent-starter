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
 * 插件市场设置页（/settings/plugins）。
 *
 * <p>仅渲染 marketType=plugin 的 SPI 市场源开关列表，控制哪些插件来源生效。</p>
 */
const PluginMarketSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [message, messageContext] = useArcoMessage({ maxCount: 3 });
  const [sources, setSources] = useState<SkillMarketSourceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<SkillMarketSource | null>(null);

  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ipcBridge.fs.statusSkillMarketSources.invoke({ marketType: 'plugin' });
      const inner = (res as { data?: unknown }).data ?? res;
      const list = (inner as { sources?: unknown })?.sources;
      setSources(
        (Array.isArray(list) ? list : []).map((s) => ({
          ...(s as { displayName: string; url: string; marketType: string; enabled: boolean }),
          source: (s as { source: string }).source as SkillMarketSource,
        }))
      );
    } catch (error) {
      console.error('Failed to load plugin market sources:', error);
      message.error(t('settings.pluginMarket.loadSourcesFailed', { defaultValue: '市场源配置加载失败' }));
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
          t('settings.pluginMarket.sourceToggleSuccess', {
            name: marketSourceLabel(source),
            enabled,
            defaultValue: `${marketSourceLabel(source)} 已${enabled ? '启用' : '关闭'}`,
          })
        );
      } catch (error) {
        setSources((prev) => prev.map((s) => (s.source === source ? { ...s, enabled: !enabled } : s)));
        console.error(`Failed to toggle plugin market source ${source}:`, error);
        message.error(t('settings.pluginMarket.sourceToggleFailed', { defaultValue: '市场源开关操作失败' }));
      } finally {
        setToggling(null);
      }
    },
    [message, t]
  );

  const enabledCount = sources.filter((s) => s.enabled).length;

  return (
    <SettingsPageWrapper>
      {messageContext}
      <div className='flex flex-col h-full w-full'>
        <NomiScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow>
          <div className='px-[12px] md:px-[32px] py-16px bg-2 rd-16px space-y-12px'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-14px font-600 text-t-primary'>
                  {t('settings.pluginMarket.settingsTitle', { defaultValue: '插件市场设置' })}
                </div>
                <div className='mt-2px text-12px leading-18px text-t-secondary'>
                  {t('settings.pluginMarket.sourceConfigDesc', {
                    count: enabledCount,
                    total: sources.length,
                    defaultValue: `市场源由后端 SPI 定义，共 ${sources.length} 个，当前启用 ${enabledCount} 个；仅启用的来源会在插件市场中被拉取。`,
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
              ) : sources.length === 0 ? (
                <div className='py-16px text-center text-13px text-t-secondary'>
                  {t('settings.pluginMarket.noSources', { defaultValue: '未配置插件市场源' })}
                </div>
              ) : (
                sources.map((source) => (
                  <PreferenceRow
                    key={source.source}
                    label={source.displayName}
                    description={source.url}
                  >
                    <span className='flex items-center gap-8px'>
                      <Tag size='small' bordered={false} className='bg-[rgba(var(--primary-6),0.08)] text-primary-6'>
                        {marketSourceLabel(source.source)}
                      </Tag>
                      <Switch
                        size='small'
                        checked={source.enabled}
                        loading={toggling === source.source}
                        onChange={(v: boolean) => void toggleSource(source.source, v)}
                        data-testid={`plugin-market-source-toggle-${source.source}`}
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

export default PluginMarketSettingsPage;
