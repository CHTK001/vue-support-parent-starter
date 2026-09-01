/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Popover, Switch } from '@arco-design/web-react';
import { Edit, LinkCloud, Timer, Brain, Thunderbolt, Send, Download, Search } from '@icon-park/react';
import { ipcBridge } from '@/common';
import { configService } from '@/common/config/configService';
import type { ConfigKeyMap } from '@/common/config/configKeys';
import type { ProviderId } from '@/common/types/ids';
import { toProviderModelInput } from '@/common/utils/providerModels';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import {
  NomiSettingList,
  NomiSettingRow,
} from '@/renderer/components/base/NomiSettingLayout';
import TaskModelSelect from '@/renderer/components/model/TaskModelSelect';
import { orderModelSelectorProviders } from '@/renderer/hooks/agent/modelSelectorProviderOrdering';
import { useProvidersQuery } from '@/renderer/hooks/agent/useModelProviderList';
import { useModelSelectorProviderLabel } from '@/renderer/hooks/agent/useModelSelectorProviderLabel';
import { useModelsForTask } from '@/renderer/hooks/agent/useModelsForTask';
import type { I18nKey } from '@/renderer/services/i18n/i18n-keys';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import { providerGradientStyle } from '@/renderer/utils/model/providerIdentity';
import { resolveModelVendorLogo } from '@/renderer/utils/model/modelVendorLogo';
import {
  buildModalityGroups,
  MODALITY_SPECS,
  type ModalityKey,
  type ModalityModelRow,
  type ModalityProviderGroup,
} from './modalityModels';
import { SerializedLatestWriteQueue } from './serializedLatestWriteQueue';

type ImageGenerationDefaultModel = NonNullable<
  ConfigKeyMap['models.default.imageGeneration']
>;

interface ImageGenerationDefaultControlProps {
  preferenceKey: 'models.default.imageGeneration';
}

const ImageGenerationDefaultControl: React.FC<
  ImageGenerationDefaultControlProps
> = ({ preferenceKey }) => {
  const { t } = useTranslation();
  const [message, messageContext] = useArcoMessage({ maxCount: 1 });
  const { groups, isLoading } = useModelsForTask('image_generation');
  const [defaultModel, setDefaultModel] =
    useState<ImageGenerationDefaultModel | null>(
      () => configService.get(preferenceKey) ?? null,
    );
  const [isSavingDefault, setIsSavingDefault] = useState(false);
  const writeQueueRef = useRef(new SerializedLatestWriteQueue());

  useEffect(() => {
    let active = true;
    const sync = () => {
      if (active && !writeQueueRef.current.hasPending) {
        setDefaultModel(configService.get(preferenceKey) ?? null);
      }
    };
    const unsubscribe = configService.subscribe(preferenceKey, (value) => {
      if (active && !writeQueueRef.current.hasPending) {
        setDefaultModel(
          (value as ImageGenerationDefaultModel | undefined) ?? null,
        );
      }
    });
    void configService.whenReady().then(sync);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [preferenceKey]);

  const persistDefault = useCallback(
    async (next: ImageGenerationDefaultModel | null) => {
      setDefaultModel(next);
      setIsSavingDefault(true);

      const queue = writeQueueRef.current;
      const { done } = queue.enqueue(
        () =>
          next
            ? configService.set(preferenceKey, next)
            : configService.remove(preferenceKey),
        {
          onLatestError: async (error, generation) => {
            await configService.reload();
            if (!queue.isLatest(generation)) return;
            setDefaultModel(configService.get(preferenceKey) ?? null);
            console.error(
              '[ModalityModels] Failed to save the default image model:',
              error,
            );
            message.error(t('settings.modelHub.creation.defaultSaveFailed'));
          },
          onLatestSettled: (generation) => {
            if (queue.isLatest(generation)) setIsSavingDefault(false);
          },
        },
      );
      await done;
    },
    [message, preferenceKey, t],
  );

  const hasCandidates = groups.some((group) => group.models.length > 0);
  const noCandidates = !isLoading && !hasCandidates;
  const description = isLoading
    ? t('settings.modelHub.creation.defaultLoading')
    : noCandidates
      ? t('settings.modelHub.creation.defaultNoModels')
      : defaultModel
        ? t('settings.modelHub.creation.defaultHint')
        : t('settings.modelHub.creation.defaultUnset');

  return (
    <div className='mt-14px'>
      {messageContext}
      <NomiSettingList>
        <NomiSettingRow
          style={{ background: 'transparent' }}
          title={t('settings.modelHub.creation.defaultTitle')}
          description={description}
          controlsClassName='justify-start'
          controls={
            <div className='flex min-w-0 flex-wrap items-center gap-8px'>
              <TaskModelSelect
                task='image_generation'
                size='small'
                disabled={noCandidates || isSavingDefault}
                value={defaultModel}
                emptyHint={t('settings.modelHub.creation.defaultNoModels')}
                onChange={({ provider_id, model }) =>
                  void persistDefault({ provider_id, model })
                }
              />
              {defaultModel && (
                <Button
                  size='mini'
                  disabled={isSavingDefault}
                  onClick={() => void persistDefault(null)}
                >
                  {t('settings.modelHub.creation.defaultClear')}
                </Button>
              )}
            </div>
          }
        />
      </NomiSettingList>
    </div>
  );
};

export interface ModalityModelsPanelProps {
  modality: ModalityKey;
  icon: React.ReactNode;
  titleKey: I18nKey;
  subtitleKey: I18nKey;
  /** Chat alone owns the install-wide default conversation model. */
  showDefaultModel?: boolean;
  /** Optional install-wide default owned by this model task. */
  defaultModelPreferenceKey?: 'models.default.imageGeneration';
  /** 头部下方的通用配置区（如 ASR/TTS 的默认模型选择器），与「本类默认模型」同款列表样式。 */
  configRows?: React.ReactNode;
}

/**
 * One management section over the nested provider response. Disabled rows stay
 * visible; every mutation sends one full model definition to the atomic save
 * route, so no capability can be lost by a partial row update.
 */
const ModalityModelsPanel: React.FC<ModalityModelsPanelProps> = ({
  modality,
  icon,
  titleKey,
  subtitleKey,
  showDefaultModel = false,
  defaultModelPreferenceKey,
  configRows,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [message, messageContext] = useArcoMessage({ maxCount: 2 });
  const { data: providerData, mutate } = useProvidersQuery();
  const providerLabel = useModelSelectorProviderLabel();

  const providers = useMemo(
    () => orderModelSelectorProviders(providerData ?? []),
    [providerData],
  );
  const [defaultModel, setDefaultModel] = useState(
    () => configService.get('nomi.defaultModel') ?? null,
  );
  const [draftDescription, setDraftDescription] = useState('');

  const groups = useMemo<ModalityProviderGroup[]>(
    () =>
      buildModalityGroups(providers, MODALITY_SPECS[modality], providerLabel),
    [providers, modality, providerLabel],
  );

  const saveRow = useCallback(
    async (
      row: ModalityModelRow,
      patch: { enabled?: boolean; description?: string },
    ) => {
      const definition = {
        ...row.definition,
        ...patch,
      };
      await ipcBridge.providerModel.save.invoke({
        provider_id: row.providerId,
        model: toProviderModelInput(definition),
      });
      await mutate();
    },
    [mutate],
  );

  const toggleRow = useCallback(
    async (row: ModalityModelRow, enabled: boolean) => {
      try {
        await saveRow(row, { enabled });
      } catch (error) {
        console.error('[ModalityModels] Failed to toggle a model:', error);
        message.error(t('settings.modelHub.modality.toggleFailed'));
      }
    },
    [message, saveRow, t],
  );

  const saveDescription = useCallback(
    async (row: ModalityModelRow, description: string) => {
      try {
        await saveRow(row, { description: description.trim() || undefined });
      } catch (error) {
        console.error(
          '[ModalityModels] Failed to save a model description:',
          error,
        );
        message.error(t('settings.modelHub.modality.descriptionFailed'));
      }
    },
    [message, saveRow, t],
  );

  const persistDefault = useCallback(
    (provider_id: ProviderId, model: string) => {
      const next = { provider_id, model };
      setDefaultModel(next);
      void configService
        .set('nomi.defaultModel', next)
        .catch(async (error: unknown) => {
          await configService.reload();
          setDefaultModel(configService.get('nomi.defaultModel') ?? null);
          console.error(
            '[ModalityModels] Failed to save the default chat model:',
            error,
          );
        });
    },
    [],
  );

  const renderGroup = (group: ModalityProviderGroup) => (
    <div key={group.providerId} className='mh-group'>
      <div className='mh-group-header'>
        <span
          className='mh-avatar text-white shadow-sm'
          style={providerGradientStyle(group.providerName)}
          aria-hidden='true'
        >
          {group.providerName.slice(0, 1)}
        </span>
        <span className='text-14px font-600 text-t-primary truncate min-w-0'>
          {group.providerName}
        </span>
        <span className='mh-chip'>{group.platform}</span>
        {!group.hasCredentials && (
          <span className='mh-tag warning' title='此供应商尚未配置密钥'>
            {t('settings.modelHub.modality.noCredentials')}
          </span>
        )}
        {!group.enabled && (
          <span className='mh-tag unknown'>
            {t('settings.modelHub.modality.modelDisabled')}
          </span>
        )}
        <span className='mh-pill ml-auto'>{group.models.length}</span>
      </div>
      <div className='px-10px py-8px flex flex-col'>
        {group.models.map((row) => {
           const lat = (row.metrics?.latency_ms ?? row.metrics?.probe_latency_ms) as number | undefined;
           const latSec = row.metrics?.latency_first_token_seconds as number | undefined;
           const intel = (row.metrics?.intelligence_index ?? row.metrics?.intelligence) as number | undefined;
           const speed = (row.metrics?.output_speed_tps ?? row.metrics?.output_speed) as number | undefined;
           const inputPrice = row.metrics?.price_input_per_musd as number | undefined;
           const outputPrice = row.metrics?.price_output_per_musd as number | undefined;
           const reasoning = row.metrics?.reasoning_model as boolean | undefined;
           const webSearch = row.metrics?.web_search as boolean | undefined;
           const imageInput = row.metrics?.image_input as boolean | undefined;
          return (
          <div
            key={row.model}
            className={`model-row ${!row.enabled ? 'is-off' : ''}`}
          >
            {/* Identity: icon + name + description */}
            <div className='model-id'>
              {(() => {
                const vendorLogo = resolveModelVendorLogo(row.model, group.platform);
                return vendorLogo ? (
                  <img
                    src={vendorLogo}
                    alt=''
                    aria-hidden='true'
                    className='model-logo w-22px h-22px rounded-4px shrink-0 object-contain mr-8px'
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                    }}
                  />
                ) : (
                  <span
                    aria-hidden='true'
                    className='model-logo w-22px h-22px rounded-4px shrink-0 flex items-center justify-center bg-[var(--fill-2)] text-10px font-600 text-t-secondary mr-8px'
                  >
                    {row.model.slice(0, 1).toUpperCase()}
                  </span>
                );
              })()}
              <span className='model-name' title={row.model}>{row.model}</span>
              {row.description && (
                <span className='model-desc' title={row.description}>{row.description}</span>
              )}
            </div>

            {/* Capability tags */}
            <div className='model-caps'>
              <span className='mh-tag unknown'>
                {t(`settings.modelTask.${row.capability.task}` as I18nKey)}
              </span>
              {row.traits.includes('vision_input') && (
                <span className='mh-tag unknown'>
                  {t('settings.modelHub.modality.traitVision')}
                </span>
              )}
              {reasoning === true && (
                <span className='mh-tag reasoning' title='支持深度思考'>
                  <Brain theme='outline' size='10' strokeWidth={3} /> 深度思考
                </span>
              )}
              {webSearch === true && (
                <span className='mh-tag websearch' title='支持联网查询'>
                  <Search theme='outline' size='10' strokeWidth={3} /> 联网
                </span>
              )}
              {imageInput === true && (
                <span className='mh-tag vision' title='支持图片识别'>
                  图片
                </span>
              )}
              <span className='mh-chip'>{row.protocol}</span>
              {!row.enabled && (
                <span className='mh-tag unknown mh-tag-sm'>
                  {t('settings.modelHub.modality.modelDisabled')}
                </span>
              )}
            </div>

            {/* Metrics */}
            {(lat != null || latSec != null || intel != null || speed != null || inputPrice != null || outputPrice != null) && (
              <div className='model-metrics' data-model-metrics={row.model}>
                {lat != null && (
                  <span className='metric latency' title={`首字延迟: ${lat}ms`}>
                    <Timer theme='outline' size='11' strokeWidth={3} />
                    {lat}<em>ms</em>
                  </span>
                )}
                {lat == null && latSec != null && (
                  <span className='metric latency' title={`首字延迟: ${latSec}s`}>
                    <Timer theme='outline' size='11' strokeWidth={3} />
                    {latSec.toFixed(1)}<em>s</em>
                  </span>
                )}
                {intel != null && (
                  <span className='metric intel' title={`智能指数: ${Math.round(intel)}`}>
                    <Brain theme='outline' size='11' strokeWidth={3} />
                    {Math.round(intel)}<em>分</em>
                  </span>
                )}
                {speed != null && (
                  <span className='metric speed' title={`输出速度: ${Math.round(speed)} tokens/s`}>
                    <Thunderbolt theme='outline' size='11' strokeWidth={3} />
                    {Math.round(speed)}<em>t/s</em>
                  </span>
                )}
                {inputPrice != null && (
                  <span className='metric price-in' title={`输入价格: $${inputPrice}/M tokens`}>
                    <Send theme='outline' size='11' strokeWidth={3} />
                    ${inputPrice}<em>/M</em>
                  </span>
                )}
                {outputPrice != null && (
                  <span className='metric price-out' title={`输出价格: $${outputPrice}/M tokens`}>
                    <Download theme='outline' size='11' strokeWidth={3} />
                    ${outputPrice}<em>/M</em>
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className='model-actions'>
              <Switch
                size='small'
                className='compact-dark-switch shrink-0'
                checked={row.enabled}
                onChange={(enabled: boolean) => void toggleRow(row, enabled)}
              />
              <Popover
                trigger='click'
                onVisibleChange={(visible) => {
                  if (visible) setDraftDescription(row.description ?? '');
                }}
                content={
                  <div className='flex w-260px flex-col gap-8px'>
                    <Input.TextArea
                      autoSize={{ minRows: 2, maxRows: 5 }}
                      value={draftDescription}
                      placeholder={t(
                        'settings.modelHub.modality.descriptionPlaceholder',
                      )}
                      onChange={setDraftDescription}
                    />
                    <Button
                      size='mini'
                      type='primary'
                      onClick={() =>
                        void saveDescription(row, draftDescription)
                      }
                    >
                      {t('settings.modelHub.modality.descriptionSave')}
                    </Button>
                  </div>
                }
              >
                <Button
                  size='mini'
                  className='model-provider-action-btn mh-act-edit !w-26px !h-26px !min-w-26px'
                  icon={<Edit theme='outline' size='13' strokeWidth={3} />}
                />
              </Popover>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );

  return (
    <div className='mh-card flex min-h-0 flex-col px-24px py-18px'>
      {messageContext}
      <header className='flex items-center gap-12px border-b border-b-solid border-[var(--color-border-2)] pb-16px'>
        <span className='mh-page-icon'>
          {icon}
        </span>
        <div className='min-w-0'>
          <h2 className='mh-page-title'>
            {t(titleKey)}
          </h2>
          <p className='mh-page-subtitle'>
            {t(subtitleKey)}
          </p>
        </div>
      </header>

      {showDefaultModel && (
        <div className='mt-14px'>
          <NomiSettingList>
          <NomiSettingRow
            style={{ background: 'transparent' }}
            title={t('settings.modelHub.modality.defaultRow')}
              description={t('settings.modelHub.modality.chatDefaultHint')}
              controlsClassName='justify-start'
              controls={
                <TaskModelSelect
                  task='chat'
                  size='small'
                  value={defaultModel}
                  onChange={({ provider_id, model }) =>
                    persistDefault(provider_id, model)
                  }
                />
              }
            />
          </NomiSettingList>
        </div>
      )}

      {configRows && (
        <div className='mt-14px'>
          <NomiSettingList>{configRows}</NomiSettingList>
        </div>
      )}

      {defaultModelPreferenceKey && (
        <ImageGenerationDefaultControl
          preferenceKey={defaultModelPreferenceKey}
        />
      )}

      <NomiScrollArea className='mt-14px flex-1 min-h-0' disableOverflow>
        {groups.length === 0 ? (
          <div className='empty-state-container'>
            <span className='empty-state-icon'>
              {icon}
            </span>
            <h3 className='empty-state-title'>
              {t('settings.modelHub.modality.empty')}
            </h3>
            <p className='empty-state-description'>
              {t('settings.modelHub.modality.emptyHint')}
            </p>
            <Button
              type='primary'
              size='small'
              className='mt-14px'
              icon={<LinkCloud theme='outline' size='14' />}
              onClick={() => navigate('/models?section=models')}
            >
              {t('settings.modelHub.modality.manageModels')}
            </Button>
          </div>
        ) : (
          <div className='flex flex-col gap-14px'>
            {groups.map(renderGroup)}
          </div>
        )}
      </NomiScrollArea>

      <div className='mt-12px flex items-center gap-8px flex-wrap border-t border-t-solid border-[var(--color-border-2)] pt-10px'>
        <Button
          type='text'
          size='small'
          icon={<LinkCloud theme='outline' size='14' />}
          onClick={() => navigate('/models?section=models')}
        >
          {t('settings.modelHub.modality.manageModels')}
        </Button>
      </div>
    </div>
  );
};

export default ModalityModelsPanel;
