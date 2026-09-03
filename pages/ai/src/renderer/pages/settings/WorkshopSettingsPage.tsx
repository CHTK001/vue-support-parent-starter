import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpRequest } from '@/common/adapter/httpBridge';
import { ipcBridge } from '@/common';
import { Button, Message } from '@arco-design/web-react';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import PreferenceRow from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent/PreferenceRow';
import { useAutoSave } from '@/renderer/hooks/settings/useAutoSave';
import { FolderOpen } from '@icon-park/react';

const WorkshopSettingsPage: React.FC = () => {
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

  const strVal = (key: string, def = ''): string =>
    values[key] == null ? def : String(values[key]);

  const numVal = (key: string): number | undefined => {
    const v = values[key];
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const handlePickDirectory = async () => {
    try {
      const result = await ipcBridge.dialog.showOpen.invoke({ properties: ['openDirectory'] });
      if (result && result.length > 0) set('workshopStorageDir', result[0]);
    } catch { /* ignore */ }
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
              <PreferenceRow label={t('settings.workshopStorageDir', { defaultValue: '资产存储目录' })}>
                <div className='flex items-center gap-8px w-full md:w-auto'>
                  <span
                    className='flex-1 min-w-0 truncate text-13px text-[var(--color-text-2)] font-mono bg-fill-1 px-10px py-7px rounded-8px border border-solid border-[var(--color-border-2)]'
                    title={strVal('workshopStorageDir')}
                  >
                    {strVal('workshopStorageDir') || t('settings.workshopStorageDirPlaceholder', { defaultValue: '未配置，使用默认路径' })}
                  </span>
                  <button
                    type='button'
                    className='inline-flex items-center gap-4px rounded-8px border border-solid border-[var(--color-border-2)] bg-fill-1 px-10px py-7px text-12px text-[var(--color-text-2)] cursor-pointer hover:bg-fill-2 hover:text-[var(--color-text-1)] transition-colors'
                    onClick={handlePickDirectory}
                  >
                    <FolderOpen theme='outline' size={14} fill='currentColor' />
                    {t('common.browse', { defaultValue: '浏览' })}
                  </button>
                </div>
              </PreferenceRow>
              <PreferenceRow label={t('settings.workshopMaxUploadSizeMb', { defaultValue: '单次上传大小上限（MB）' })}>
                <input
                  type='number'
                  min={1}
                  max={1024}
                  className='w-120px rounded-8px border border-solid border-[var(--color-border-2)] bg-fill-1 px-10px py-7px text-13px text-[var(--color-text-1)] outline-none'
                  value={numVal('workshopMaxUploadSizeMb') ?? 100}
                  onChange={(e) => set('workshopMaxUploadSizeMb', Number(e.target.value) ?? 100)}
                />
              </PreferenceRow>
            </div>
          </div>
        </NomiScrollArea>
        <div className='flex items-center justify-end p-[12px] md:px-[32px] py-12px border-t border-solid border-[var(--color-border-2)]'>
          <Button type='primary' onClick={handleSave} className='min-w-120px rounded-8px'>
            {t('common.save', { defaultValue: '保存' })}
          </Button>
        </div>
      </div>
    </SettingsPageWrapper>
  );
};

export default WorkshopSettingsPage;
