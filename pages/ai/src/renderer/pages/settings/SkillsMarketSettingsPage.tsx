import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, Tag } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import type { SkillMarketSource } from '@/common/adapter/ipcBridge';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import SkillMarketSettings from './SkillMarketSettings';
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
 * 技能市场设置页（/settings/skills）。
 *
 * <p>市场源由后端 {@code SkillMarketSourceProvider} SPI 定义。本页作用：
 * <ol>
 *   <li>枚举 SPI 渲染「来源配置」列表（每个市场源一个开关，持久化到
 *       {@code sys_ai_global_setting} 的 {@code skills} 分组）；</li>
 *   <li>仅渲染已启用来源的技能市场内容（SkillMarketSettings 按 enabled 过滤 sources）。</li>
 * </ol>
 * 关掉某个来源，前端就只显示剩余启用的来源，对应市场不再拉取。</p>
 */
const SkillsMarketSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [message, messageContext] = useArcoMessage({ maxCount: 3 });
  const [sources, setSources] = useState<SkillMarketSourceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<SkillMarketSource | null>(null);

  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ipcBridge.fs.statusSkillMarketSources.invoke({ marketType: 'skill' });
      setSources(
        (res?.sources ?? []).map((s) => ({ ...s, source: s.source as SkillMarketSource }))
      );
    } catch (error) {
      console.error('Failed to load skill market sources:', error);
      message.error(
        t('settings.skillsMarket.loadSourcesFailed', {
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

  const enabledSources = useMemo(
    () => sources.filter((s) => s.enabled).map((s) => s.source),
    [sources]
  );

  const toggleSource = useCallback(
    async (source: SkillMarketSource, enabled: boolean) => {
      setToggling(source);
      setSources((prev) => prev.map((s) => (s.source === source ? { ...s, enabled } : s)));
      try {
        await ipcBridge.fs.toggleSkillMarketSource.invoke({ source, enabled });
        message.success(
          t('settings.skillsMarket.sourceToggleSuccess', {
            name: marketSourceLabel(source),
            enabled,
            defaultValue: `${marketSourceLabel(source)} 已${enabled ? '启用' : '关闭'}`,
          })
        );
      } catch (error) {
        setSources((prev) => prev.map((s) => (s.source === source ? { ...s, enabled: !enabled } : s)));
        console.error(`Failed to toggle skill market source ${source}:`, error);
        message.error(
          t('settings.skillsMarket.sourceToggleFailed', {
            defaultValue: '市场源开关操作失败',
          })
        );
      } finally {
        setToggling(null);
      }
    },
    [message, t]
  );

  const enabledCount = enabledSources.length;
  const sourceTone = (source: SkillMarketSource): string => {
    if (['clawhub', 'loophub', 'skillhub'].includes(source)) return 'bg-[rgba(var(--success-6),0.1)] text-success-6';
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
                  {t('settings.skillsMarket.sourceConfigTitle', { defaultValue: '技能市场来源配置' })}
                </div>
                <div className='mt-2px text-12px leading-18px text-t-secondary'>
                  {t('settings.skillsMarket.sourceConfigDesc', {
                    count: enabledCount,
                    total: sources.length,
                    defaultValue: `市场源由后端 SPI 定义，共 ${sources.length} 个，当前启用 ${enabledCount} 个；仅启用的来源会展示在下方市场。`,
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
                        data-testid={`skill-market-source-toggle-${source.source}`}
                      />
                    </span>
                  </PreferenceRow>
                ))
              )}
            </div>
          </div>

          {enabledSources.length > 0 && (
            <div className='mt-16px'>
              <SkillMarketSettings sources={enabledSources} />
            </div>
          )}
        </NomiScrollArea>
      </div>
    </SettingsPageWrapper>
  );
};

export default SkillsMarketSettingsPage;