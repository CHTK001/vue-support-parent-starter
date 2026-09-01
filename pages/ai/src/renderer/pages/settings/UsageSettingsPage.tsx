import { useTranslation } from 'react-i18next';
import { httpRequest } from '@/common/adapter/httpBridge';
import { Switch } from '@arco-design/web-react';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import PreferenceRow from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent/PreferenceRow';
import { useAutoSave } from '@/renderer/hooks/settings/useAutoSave';

const UsageSettingsPage: React.FC = () => {
  const { t } = useTranslation();

  const { values, set, loading } = useAutoSave(
    async () => httpRequest('GET', '/v2/global-settings'),
    async (v) => httpRequest('PUT', '/v2/global-settings', v),
  );

  const boolVal = (key: string, def: boolean): boolean => {
    const v = values[key];
    if (typeof v === 'boolean') return v;
    if (v == null) return def;
    return String(v).toLowerCase() === 'true' || String(v) === '1';
  };

  const numVal = (key: string): number | undefined => {
    const v = values[key];
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  if (loading) {
    return (
      <SettingsPageWrapper>
        <div className='py-20px text-center text-13px text-t-secondary'>
          {t('settings.globalSettingsLoading', { defaultValue: '加载中…' })}
        </div>
      </SettingsPageWrapper>
    );
  }

  return (
    <SettingsPageWrapper>
      <div className='flex flex-col h-full w-full'>
        <NomiScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow>
          <div className='px-[12px] md:px-[32px] py-16px bg-2 rd-16px space-y-12px'>
            <div className='w-full flex flex-col divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
              <PreferenceRow label={t('settings.enableUsageAnalysis', { defaultValue: '启用用量分析' })}>
                <Switch checked={boolVal('enableUsageAnalysis', true)} onChange={(v) => set('enableUsageAnalysis', v)} />
              </PreferenceRow>
              <PreferenceRow label={t('settings.usageReportInterval', { defaultValue: '用量上报间隔（秒）' })}>
                <input
                  type='number'
                  min={10}
                  className='w-120px rounded-8px border border-solid border-[var(--color-border-2)] bg-fill-1 px-10px py-7px text-13px text-[var(--color-text-1)] outline-none'
                  value={numVal('usageReportInterval') ?? 300}
                  onChange={(e) => set('usageReportInterval', Number(e.target.value) ?? 300)}
                />
              </PreferenceRow>
            </div>
          </div>
        </NomiScrollArea>
      </div>
    </SettingsPageWrapper>
  );
};

export default UsageSettingsPage;
