import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { httpRequest } from '@/common/adapter/httpBridge';
import { Input, InputNumber, Select, Slider, Switch } from '@arco-design/web-react';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import PreferenceRow from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent/PreferenceRow';
import { useAutoSave } from '@/renderer/hooks/settings/useAutoSave';

const AiGlobalSettingsPage: React.FC = () => {
  const { t } = useTranslation();

  const { values, set, loading } = useAutoSave(
    async () => httpRequest('GET', '/v2/global-settings'),
    async (v) => httpRequest('PUT', '/v2/global-settings', v),
  );

  // model options 从 window 读取（避免 state 重渲染）
  const modelOptions = typeof window !== 'undefined'
    ? ((window as unknown as { __modelOptions?: string[] }).__modelOptions ?? [])
    : [];

  const boolVal = (key: string, def: boolean): boolean => {
    const v = values[key];
    if (typeof v === 'boolean') return v;
    if (v == null) return def;
    return String(v).toLowerCase() === 'true' || String(v) === '1';
  };

  const strVal = (key: string, def = ''): string =>
    values[key] == null ? def : String(values[key]);

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
          <div className='space-y-16px'>
            <div className='px-[12px] md:px-[32px] py-16px bg-2 rd-16px space-y-12px'>
              <div className='w-full flex flex-col divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
                <PreferenceRow label={t('settings.defaultModel', { defaultValue: '默认模型' })}>
                  <Select
                    className='w-240px'
                    value={strVal('defaultModel')}
                    onChange={(v) => set('defaultModel', v as string)}
                    placeholder={t('settings.defaultModelPlaceholder', { defaultValue: '选择默认模型' })}
                    allowClear
                  >
                    {modelOptions.map((m) => (
                      <Select.Option key={m} value={m}>{m}</Select.Option>
                    ))}
                  </Select>
                </PreferenceRow>
                <PreferenceRow label={t('settings.temperature', { defaultValue: '默认温度' })} description='0~2'>
                  <div className='flex items-center gap-8px w-280px'>
                    <Slider
                      className='flex-1'
                      min={0} max={2} step={0.1}
                      value={numVal('temperature') ?? 0.7}
                      onChange={(v) => set('temperature', v)}
                      marks={{ 0: '0', 0.5: '0.5', 1: '1', 1.5: '1.5', 2: '2' }}
                    />
                    <input
                      type='number'
                      min={0} max={2} step={0.1}
                      className='w-60px rounded-8px border border-solid border-[var(--color-border-2)] bg-fill-1 px-8px py-6px text-13px text-[var(--color-text-1)] outline-none text-center'
                      value={numVal('temperature') ?? 0.7}
                      onChange={(e) => set('temperature', parseFloat(e.target.value) ?? 0.7)}
                    />
                  </div>
                </PreferenceRow>
                <PreferenceRow label={t('settings.maxTokens', { defaultValue: '默认最大 Tokens' })}>
                  <input
                    type='number'
                    min={1}
                    className='w-120px rounded-8px border border-solid border-[var(--color-border-2)] bg-fill-1 px-10px py-7px text-13px text-[var(--color-text-1)] outline-none'
                    value={numVal('maxTokens') ?? 4096}
                    onChange={(e) => set('maxTokens', Number(e.target.value) ?? 4096)}
                  />
                </PreferenceRow>
                <PreferenceRow label={t('settings.timeout', { defaultValue: '请求超时（秒）' })}>
                  <input
                    type='number'
                    min={1}
                    className='w-120px rounded-8px border border-solid border-[var(--color-border-2)] bg-fill-1 px-10px py-7px text-13px text-[var(--color-text-1)] outline-none'
                    value={numVal('timeout') ?? 30}
                    onChange={(e) => set('timeout', Number(e.target.value) ?? 30)}
                  />
                </PreferenceRow>
                <PreferenceRow label={t('settings.enableCache', { defaultValue: '启用缓存' })}>
                  <Switch checked={boolVal('enableCache', true)} onChange={(v) => set('enableCache', v)} />
                </PreferenceRow>
                <PreferenceRow label={t('settings.stream', { defaultValue: '流式输出' })}>
                  <Switch checked={boolVal('stream', true)} onChange={(v) => set('stream', v)} />
                </PreferenceRow>
                <PreferenceRow label={t('settings.systemPrompt', { defaultValue: '默认系统提示词' })}>
                  <textarea
                    className='w-480px min-h-100px rounded-8px border border-solid border-[var(--color-border-2)] bg-fill-1 px-10px py-8px text-13px text-[var(--color-text-1)] outline-none resize-y'
                    placeholder={t('settings.systemPromptPlaceholder', { defaultValue: '全局 ChatClient 默认系统提示词' })}
                    value={strVal('systemPrompt')}
                    onChange={(e) => set('systemPrompt', e.target.value)}
                    rows={4}
                  />
                </PreferenceRow>
              </div>
            </div>
          </div>
        </NomiScrollArea>
      </div>
    </SettingsPageWrapper>
  );
};

export default AiGlobalSettingsPage;
