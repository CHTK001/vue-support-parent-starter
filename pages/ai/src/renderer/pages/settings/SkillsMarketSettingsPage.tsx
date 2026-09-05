import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import SkillMarketSettings from './SkillMarketSettings';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import PreferenceRow from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent/PreferenceRow';

/**
 * 技能市场设置页（/settings/skills）。
 *
 * <p>承载技能市场（ClawHub/LoopHub/SkillHub 榜单）与「技能市场」总开关。
 * 市场开关经后端 SPI 持久化到 sys_ai_global_setting（skills/market_enabled）；
 * 关闭后 SkillMarketSettings 隐藏（不渲染、不拉取），仅保留开关供重新开启。</p>
 */
const SkillsMarketSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [message, messageContext] = useArcoMessage({ maxCount: 3 });
  const [marketEnabled, setMarketEnabled] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setStatusLoading(true);
    void ipcBridge.fs.statusSkillsMarket
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
          await ipcBridge.fs.enableSkillsMarket.invoke();
        } else {
          await ipcBridge.fs.disableSkillsMarket.invoke();
        }
        message.success(
          t('settings.skillsMarket.toggleSuccess', {
            defaultValue: enabled ? '技能市场已开启' : '技能市场已关闭',
          })
        );
      } catch (error) {
        setMarketEnabled(!enabled);
        console.error('Failed to toggle skill market:', error);
        message.error(
          t('settings.skillsMarket.toggleFailed', { defaultValue: '技能市场开关操作失败' })
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
                label={t('settings.skillsMarket.enableMarket', { defaultValue: '启用技能市场' })}
                description={t('settings.skillsMarket.enableMarketDesc', {
                  defaultValue: '开启后展示 ClawHub、LoopHub、SkillHub 等市场；关闭后隐藏市场并停止拉取。',
                })}
              >
                <Switch
                  checked={marketEnabled}
                  loading={saving || statusLoading}
                  onChange={(v: boolean) => void toggleMarket(v)}
                  data-testid='skill-market-enabled-switch'
                />
              </PreferenceRow>
            </div>
          </div>

          {marketEnabled && !statusLoading && (
            <div className='mt-16px'>
              <SkillMarketSettings active={marketEnabled} />
            </div>
          )}
        </NomiScrollArea>
      </div>
    </SettingsPageWrapper>
  );
};

export default SkillsMarketSettingsPage;