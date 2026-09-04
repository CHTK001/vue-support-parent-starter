/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { httpRequest } from '@/common/adapter/httpBridge';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import type { I18nKey } from '@/renderer/services/i18n/i18n-keys';

/**
 * 本地能力模型清单面板。
 *
 * <p>消费后端 {@code GET /v2/ai/models/capabilities}（{@code AiModelCatalogController}），
 * 按能力标签（capability label，与后端 {@code ModelCapabilities} 常量一致）分组展示本地
 * 已注册的管线模型清单。能力标签在前端驱动展示顺序，后端返回的模型 ID 全量按标签归档，
 * 实现前后端分类统一——后续按前端选定模型创建管线时复用同一套标签。</p>
 */
export interface LocalCapabilityModelsPanelProps {
  /** 该区块关注的能力标签（后端 ModelCapabilities 常量，如 detect / ocr / layout）。 */
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
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
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
      setLoadError(true);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [capabilityKeys]);

  useEffect(() => {
    void load();
  }, [load]);

  const capabilityLabel = (capability: string): string =>
    t(`settings.modelHub.capability.${capability}` as I18nKey);

  const renderGroup = (group: CapabilityGroup) => (
    <div key={group.capability} className='mh-group'>
      <div className='mh-group-header'>
        <span className='text-14px font-600 text-t-primary truncate min-w-0'>
          {capabilityLabel(group.capability)}
        </span>
        <span className='mh-chip'>{group.capability}</span>
        <span className='mh-pill ml-auto'>{group.models.length}</span>
      </div>
      <div className='px-10px py-8px flex flex-col'>
        {group.models.map((model) => (
          <div key={model} className='model-row'>
            <div className='model-id'>
              <span
                aria-hidden='true'
                className='model-logo w-22px h-22px rounded-4px shrink-0 flex items-center justify-center bg-[var(--fill-2)] text-10px font-600 text-t-secondary mr-8px'
              >
                {model.slice(0, 1).toUpperCase()}
              </span>
              <span className='model-name' title={model}>
                {model}
              </span>
            </div>
            <div className='model-caps'>
              <span className='mh-tag unknown'>{capabilityLabel(group.capability)}</span>
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
            <h3 className='empty-state-title'>
              {t('settings.modelHub.capability.loading')}
            </h3>
          </div>
        ) : loadError ? (
          <div className='empty-state-container'>
            <span className='empty-state-icon'>{icon}</span>
            <h3 className='empty-state-title'>
              {t('settings.modelHub.capability.loadFailed')}
            </h3>
            <p className='empty-state-description'>
              {t('settings.modelHub.capability.loadFailedHint')}
            </p>
          </div>
        ) : groups.length === 0 ? (
          <div className='empty-state-container'>
            <span className='empty-state-icon'>{icon}</span>
            <h3 className='empty-state-title'>
              {t('settings.modelHub.capability.empty')}
            </h3>
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
