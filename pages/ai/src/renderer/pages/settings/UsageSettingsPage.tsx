import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpRequest } from '@/common/adapter/httpBridge';
import { Button, Message, Spin, Switch, Tag } from '@arco-design/web-react';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import PreferenceRow from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent/PreferenceRow';
import { useAutoSave } from '@/renderer/hooks/settings/useAutoSave';

interface UsageParserInfo {
  name: string;
  type: string;
  enabled: boolean;
}

const UsageSettingsPage: React.FC = () => {
  const { t } = useTranslation();

  const { values, set, loading } = useAutoSave(
    async () => httpRequest('GET', '/v2/global-settings'),
    async (v) => httpRequest('PUT', '/v2/global-settings', v),
  );

  const handleSave = useCallback(async () => {
    try {
      await httpRequest('PUT', '/v2/global-settings', values);
      Message.success(t('common.saveSuccess', { defaultValue: '已保存' }));
    } catch {
      Message.error(t('common.saveFailed', { defaultValue: '保存失败' }));
    }
  }, [t, values]);

  const [parsers, setParsers] = useState<UsageParserInfo[]>([]);
  const [parsersLoading, setParsersLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setParsersLoading(true);
      try {
        const res = await httpRequest<UsageParserInfo[]>('GET', '/v2/usage/parsers');
        if (!cancelled) setParsers(res ?? []);
      } catch {
        if (!cancelled) setParsers([]);
      } finally {
        if (!cancelled) setParsersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  const enabledParsers = (): Set<string> => {
    const raw = String(values['usageEnabledParsers'] ?? '');
    const set_ = new Set<string>();
    for (const s of raw.split(',')) {
      const name = s.trim();
      if (name) set_.add(name);
    }
    return set_;
  };

  const isEnabled = (name: string): boolean => {
    const set_ = enabledParsers();
    if (set_.size === 0) return true;
    return set_.has(name);
  };

  const toggleParser = (name: string, checked: boolean) => {
    const set_ = enabledParsers();
    if (checked) set_.add(name); else set_.delete(name);
    const next = set_.size === 0 ? '' : [...set_].sort().join(',');
    set('usageEnabledParsers', next);
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
          <div className='space-y-12px px-[12px] md:px-[32px]'>
            <div className='bg-2 rd-16px py-16px px-[12px] md:px-[16px]'>
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

            <div className='bg-2 rd-16px py-16px px-[12px] md:px-[16px]'>
              <div className='flex items-center justify-between mb-4px px-4px'>
                <span className='text-14px font-500 text-[var(--color-text-1)]'>
                  {t('usage.syncSources', { defaultValue: '用量同步数据源' })}
                </span>
                <span className='text-12px text-t-secondary'>
                  {t('usage.syncSourcesHint', { defaultValue: '选择要同步的本地工具（留空 = 全部启用）' })}
                </span>
              </div>
              {parsersLoading ? (
                <div className='py-16px text-center'><Spin size={16} /></div>
              ) : parsers.length === 0 ? (
                <div className='py-16px text-center text-13px text-t-secondary'>
                  {t('usage.noParsers', { defaultValue: '系统暂无可用的用量数据源（SPI）' })}
                </div>
              ) : (
                <div className='w-full flex flex-col divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
                  {parsers.map((p) => (
                    <PreferenceRow key={p.name} label={p.name}>
                      <span className='flex items-center gap-8px'>
                        <Tag color='arcoblue' size='small'>{p.type}</Tag>
                        <Switch
                          size='small'
                          checked={isEnabled(p.name)}
                          onChange={(v) => toggleParser(p.name, v)}
                        />
                      </span>
                    </PreferenceRow>
                  ))}
                </div>
              )}
            </div>
          </div>
        </NomiScrollArea>
        <div className='flex items-center justify-end p-[12px] md:px-[32px] py-12px border-t border-solid border-[var(--color-border-2)]'>
          <Button type='primary' onClick={handleSave}>
            {t('common.save', { defaultValue: '保存' })}
          </Button>
        </div>
      </div>
    </SettingsPageWrapper>
  );
};

export default UsageSettingsPage;
