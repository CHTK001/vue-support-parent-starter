import { useTranslation } from 'react-i18next';
import { httpRequest } from '@/common/adapter/httpBridge';
import { InputNumber, Select } from '@arco-design/web-react';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import PreferenceRow from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent/PreferenceRow';
import { useAutoSave } from '@/renderer/hooks/settings/useAutoSave';

const EMBEDDING_OPTIONS = [
  { label: 'memory（离线）', value: 'memory' },
  { label: 'openai', value: 'openai' },
  { label: 'siliconflow', value: 'siliconflow' },
];

const VECTOR_STORAGE_OPTIONS = [
  { label: 'jvector（磁盘）', value: 'jvector' },
  { label: 'milvus', value: 'milvus' },
  { label: 'mysql', value: 'mysql' },
  { label: 'memory（内存）', value: 'memory' },
];

const SPLITTER_OPTIONS = [
  { label: 'sentence（按句）', value: 'sentence' },
  { label: 'character（按字符）', value: 'character' },
  { label: 'word（按词）', value: 'word' },
];

const RagSettingsPage: React.FC = () => {
  const { t } = useTranslation();

  const { values, set, loading } = useAutoSave(
    async () => httpRequest('GET', '/v2/global-settings'),
    async (v) => httpRequest('PUT', '/v2/global-settings', v),
  );

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
          <div className='px-[12px] md:px-[32px] py-16px bg-2 rd-16px space-y-12px'>
            <div className='w-full flex flex-col divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
              <PreferenceRow label={t('settings.ragEmbeddingModel', { defaultValue: 'Embedding 引擎' })}>
                <Select
                  className='w-200px'
                  value={strVal('ragEmbeddingModel')}
                  onChange={(v) => set('ragEmbeddingModel', v as string)}
                  placeholder='选择引擎'
                  allowClear
                >
                  {EMBEDDING_OPTIONS.map((o) => (
                    <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                  ))}
                </Select>
              </PreferenceRow>
              <PreferenceRow label={t('settings.ragVectorStorage', { defaultValue: '向量存储' })}>
                <Select
                  className='w-200px'
                  value={strVal('ragVectorStorage')}
                  onChange={(v) => set('ragVectorStorage', v as string)}
                  placeholder='选择存储'
                  allowClear
                >
                  {VECTOR_STORAGE_OPTIONS.map((o) => (
                    <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                  ))}
                </Select>
              </PreferenceRow>
              <PreferenceRow label={t('settings.ragChunkSize', { defaultValue: '文本切片大小（字符）' })}>
                <input
                  type='number'
                  min={100}
                  className='w-120px rounded-8px border border-solid border-[var(--color-border-2)] bg-fill-1 px-10px py-7px text-13px text-[var(--color-text-1)] outline-none'
                  value={numVal('ragChunkSize') ?? 1000}
                  onChange={(e) => set('ragChunkSize', Number(e.target.value) ?? 1000)}
                />
              </PreferenceRow>
              <PreferenceRow label={t('settings.ragChunkOverlap', { defaultValue: '文本切片重叠（字符）' })}>
                <input
                  type='number'
                  min={0}
                  className='w-120px rounded-8px border border-solid border-[var(--color-border-2)] bg-fill-1 px-10px py-7px text-13px text-[var(--color-text-1)] outline-none'
                  value={numVal('ragChunkOverlap') ?? 200}
                  onChange={(e) => set('ragChunkOverlap', Number(e.target.value) ?? 200)}
                />
              </PreferenceRow>
              <PreferenceRow label={t('settings.ragSplitter', { defaultValue: '文本切片策略' })}>
                <Select
                  className='w-200px'
                  value={strVal('ragSplitter')}
                  onChange={(v) => set('ragSplitter', v as string)}
                  placeholder='选择策略'
                  allowClear
                >
                  {SPLITTER_OPTIONS.map((o) => (
                    <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                  ))}
                </Select>
              </PreferenceRow>
            </div>
          </div>
        </NomiScrollArea>
      </div>
    </SettingsPageWrapper>
  );
};

export default RagSettingsPage;
