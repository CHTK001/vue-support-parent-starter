import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpRequest } from '@/common/adapter/httpBridge';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import type { I18nKey } from '@/renderer/services/i18n/i18n-keys';

export interface LocalCapabilityModelsPanelProps {
  /** 该区块关注的能力标签（与后端 ModelCapabilities 常量一致）。 */
  capabilityKeys: readonly string[];
  icon: React.ReactNode;
  titleKey: I18nKey;
  subtitleKey: I18nKey;
}

interface CapabilityGroup {
  capability: string;
  models: string[];
}

const LocalCapabilityModelsPanel: React.FC<LocalCapabilityModelsPanelProps> = ({
  capabilityKeys,
  icon,
  titleKey,
  subtitleKey,
}) => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<CapabilityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const capabilities = await httpRequest<Record<string, string[]>>(
        'GET',
        '/v2/ai/models/capabilities'
      );
      const next: CapabilityGroup[] = [];
      for (const key of capabilityKeys) {
        const models = capabilities?.[key];
        if (models && models.length > 0) {
          next.push({ capability: key, models });
        }
      }
      setGroups(next);
    } catch (e) {
      console.error('[LocalCapabilityModelsPanel] 能力模型清单加载失败:', e);
      setError(true);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [capabilityKeys]);

  useEffect(() => {
    void load();
  }, [load]);

  const renderGroup = (group: CapabilityGroup) => (
    <div key={group.capability} className='mh-group'>
      <div className='mh-group-header'>
        <span className='text-14px font-600 text-t-primary truncate min-w-0'>
          {t(`settings.modelHub.capability.${group.capability}` as I18nKey)}
        </span>
        <span className='mh-chip'>{group.capability}</span>
        <span className='mh-pill ml-auto'>{group.models.length}</span>
      </div>
      <div className='px-10px py-8px flex flex-col'>
        {group.models.map((model) => (
          <div key={model} className='model-row'>
            <div className='model-id'>
              <span className='model-name' title={model}>
                {model}
              </span>
            </div>
            <div className='model-caps'>
              <span className='mh-tag unknown'>{group.capability}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className='mh-card flex min-h-0 flex-col px-24px py-18px'>
      <header className='flex items-center gap-12px border-b border-b-solid border-[var(--color-border-2)] pb-16px'>
        <span className='mh-page-icon'>{icon}</span>
        <div className='min-w-0'>
          <h2 className='mh-page-title'>{t(titleKey)}</h2>
          <p className='mh-page-subtitle'>{t(subtitleKey)}</p>
        </div>
      </header>

      <NomiScrollArea className='mt-14px flex-1 min-h-0' disableOverflow>
        {loading ? (
          <div className='empty-state-container'>
            <span className='empty-state-icon'>{icon}</span>
            <h3 className='empty-state-title'>{t('settings.modelHub.capability.loading')}</h3>
          </div>
        ) : error ? (
          <div className='empty-state-container'>
            <span className='empty-state-icon'>{icon}</span>
            <h3 className='empty-state-title'>{t('settings.modelHub.capability.loadFailed')}</h3>
            <p className='empty-state-description'>
              {t('settings.modelHub.capability.loadFailedHint')}
            </p>
          </div>
        ) : groups.length === 0 ? (
          <div className='empty-state-container'>
            <span className='empty-state-icon'>{icon}</span>
            <h3 className='empty-state-title'>{t('settings.modelHub.capability.empty')}</h3>
            <p className='empty-state-description'>
              {t('settings.modelHub.capability.emptyHint')}
            </p>
          </div>
        ) : (
          <div className='flex flex-col gap-14px'>{groups.map(renderGroup)}</div>
        )}
      </NomiScrollArea>
    </div>
  );
};

export default LocalCapabilityModelsPanel;
