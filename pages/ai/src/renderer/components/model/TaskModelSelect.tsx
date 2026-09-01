/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@arco-design/web-react';
import type { ModelTask, ModelTrait } from '@/common/config/storage';
import type { ProviderId } from '@/common/types/ids';
import NomiSelect from '@/renderer/components/base/NomiSelect';
import { useModelsForTask } from '@/renderer/hooks/agent/useModelsForTask';
import { useProvidersQuery } from '@/renderer/hooks/agent/useModelProviderList';
import { useModelSelectorProviderLabel } from '@/renderer/hooks/agent/useModelSelectorProviderLabel';
import { capabilityOf } from '@/common/utils/providerModels';
import { httpRequest } from '@/common/adapter/httpBridge';
import {
  taskModelSelectState,
  type TaskModelProviderScope,
  type TaskModelSelection,
} from './taskModelSelectState';
import { ttsUsesModelIdAsVoice, ttsVoiceOptionsFor } from './ttsVoiceOptions';

export type { TaskModelSelection, TaskModelProviderScope } from './taskModelSelectState';

interface TaskModelSelectProps {
  task: ModelTask;
  /** Extra capability the model must carry (e.g. `['vision_input']`). */
  traits?: ModelTrait[];
  value: TaskModelSelection | null;
  /** Fired only with a complete, live selection. */
  onChange: (next: TaskModelSelection) => void;
  scope?: TaskModelProviderScope;
  /** Render the third (voice) select — the speech-synthesis variant. */
  withVoice?: boolean;
  /** Candidate voice ids; the field stays free text regardless. */
  voiceOptions?: readonly string[];
  size?: 'mini' | 'small' | 'default';
  disabled?: boolean;
  /** Suppress the inline warning line (the caller renders its own copy). */
  hideHint?: boolean;
  /** Copy shown when the catalog has no model for this task at all. */
  emptyHint?: string;
  /** Optional copy for the model field; provider keeps its task-aware default. */
  placeholder?: string;
}

/**
 * The shared "pick a model for this task" control: provider + model, plus a
 * voice id for speech synthesis.
 *
 * Membership comes from `useModelsForTask`, which reads the capability nested
 * under each provider model — no name heuristics or second profile request.
 * Every judgement about the SAVED reference lives in
 * `taskModelSelectState`, so a stale provider and a stale model are rendered as
 * explicit disabled "(unavailable)" options rather than silently blanked: the
 * saved value stays visible and the user is told to re-pick.
 */

/** 单个模型的指标摘要 */
interface ModelMetricsInfo {
  inputPerMusd?: number;
  outputPerMusd?: number;
  intelligence?: number;
  speedTps?: number;
  ttftSeconds?: number;
}

let metricsIndexPromise: Promise<Map<string, ModelMetricsInfo>> | null = null;

/**
 * 惰性加载 Artificial Analysis 指标索引（进程内缓存一次）。
 *
 * @return 归一化模型名 → 指标摘要
 */
function useModelMetricsIndex(): Map<string, ModelMetricsInfo> {
  const [index, setIndex] = useState<Map<string, ModelMetricsInfo> | null>(null);
  useEffect(() => {
    let active = true;
    const promise = ensureMetricsLoaded();
    promise.then((m) => {
      if (active) setIndex(m);
    });
    return () => {
      active = false;
    };
  }, []);
  return index ?? new Map();
}

/** 确保指标加载已启动（进程内单例） */
function ensureMetricsLoaded(): Promise<Map<string, ModelMetricsInfo>> {
  if (!metricsIndexPromise) {
    metricsIndexPromise = httpRequest<{ data: Record<string, unknown>[] }>('GET', '/v1/models')
      .then((res) => {
        const map = new Map<string, ModelMetricsInfo>();
        for (const m of res?.data ?? []) {
          const raw = String(m.id ?? '');
          const key = normModelKey(raw);
          if (!key || map.has(key)) continue;
          map.set(key, {
            inputPerMusd: typeof m.price_input_per_musd === 'number' ? m.price_input_per_musd : undefined,
            outputPerMusd: typeof m.price_output_per_musd === 'number' ? m.price_output_per_musd : undefined,
            intelligence: typeof m.intelligence_index === 'number' ? m.intelligence_index : undefined,
            speedTps: typeof m.output_speed_tps === 'number' ? m.output_speed_tps : undefined,
            ttftSeconds: typeof m.latency_first_token_seconds === 'number' ? m.latency_first_token_seconds : undefined,
          });
        }
        return map;
      })
      .catch(() => new Map<string, ModelMetricsInfo>());
  }
  return metricsIndexPromise;
}
function normModelKey(id: string): string {
  if (!id) return '';
  const lower = id.toLowerCase();
  const slash = lower.lastIndexOf('/');
  const base = slash >= 0 ? lower.slice(slash + 1) : lower;
  return base.replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-');
}

/** 模糊匹配指标：精确 → 包含（双向，短侧长度≥6） */
function findMetrics(
  index: Map<string, ModelMetricsInfo>,
  modelId: string
): ModelMetricsInfo | undefined {
  const key = normModelKey(modelId);
  if (!key) return undefined;
  const exact = index.get(key);
  if (exact) return exact;
  for (const [k, v] of index) {
    if (k.length >= 6 && (k.includes(key) || key.includes(k))) return v;
  }
  return undefined;
}
const TaskModelSelect: React.FC<TaskModelSelectProps> = ({
  task,
  traits,
  value,
  onChange,
  scope = 'task',
  withVoice = false,
  voiceOptions,
  size = 'mini',
  disabled = false,
  hideHint = false,
  emptyHint,
  placeholder,
}) => {
  const { t } = useTranslation();
  const { groups, isLoading } = useModelsForTask(task, traits);
  const { data: rawProviders } = useProvidersQuery();
  const providerLabel = useModelSelectorProviderLabel();
  const metricsIndex = useModelMetricsIndex();
  const [draftProviderId, setDraftProviderId] = useState<ProviderId | null>(null);

  useEffect(() => {
    setDraftProviderId(value?.provider_id ?? null);
  }, [value?.provider_id]);

  const enabledProviders = useMemo(
    () => (rawProviders ?? []).filter((p) => p.enabled !== false),
    [rawProviders]
  );

  const state = taskModelSelectState({
    groups,
    enabledProviders,
    scope,
    value,
    draftProviderId,
    isLoading,
  });

  const providerId = draftProviderId;
  const selectedModel = value?.provider_id === providerId ? value.model : null;
  const selectedProvider = state.providers.find((provider) => provider.id === providerId);
  const speechSynthesisProtocol = selectedModel
    ? capabilityOf(selectedProvider, selectedModel, 'speech_synthesis')?.protocol
    : undefined;
  const modelIdIsVoice = ttsUsesModelIdAsVoice(speechSynthesisProtocol);
  const voices = voiceOptions ?? ttsVoiceOptionsFor(speechSynthesisProtocol, selectedModel ?? undefined);
  const selectedVoice = value?.provider_id === providerId ? (value.voice ?? null) : null;

  const hint =
    !state.anyModel && !isLoading
      ? (emptyHint ?? t('settings.taskModel.emptyHint'))
      : state.providerStale
        ? t('settings.taskModel.staleHint', { model: providerId ?? '' })
        : state.modelStale && selectedModel
          ? t('settings.taskModel.staleHint', { model: selectedModel })
          : '';

  return (
    <div className='flex min-w-0 flex-col gap-4px'>
      <div className='flex min-w-0 flex-wrap items-center gap-6px'>
        <NomiSelect
          size={size}
          contentFit
          contentMaxWidth={220}
          disabled={disabled}
          placeholder={t('settings.taskModel.providerPlaceholder')}
          value={providerId ?? undefined}
          onChange={(next: ProviderId) => setDraftProviderId(next)}
        >
          {state.providerStale && providerId && (
            <NomiSelect.Option key={providerId} value={providerId} disabled>
              {t('settings.taskModel.unavailableOption', { model: providerId })}
            </NomiSelect.Option>
          )}
          {state.providers.map((p) => (
            <NomiSelect.Option key={p.id} value={p.id}>
              {providerLabel(p)}
            </NomiSelect.Option>
          ))}
        </NomiSelect>
        <NomiSelect
          size={size}
          contentFit
          contentMaxWidth={280}
          disabled={disabled || providerId == null || state.providerStale}
          placeholder={placeholder ?? t('settings.taskModel.modelPlaceholder')}
          value={selectedModel ?? undefined}
          onChange={(model: string) => {
            if (!providerId) return;
            const nextSpeechSynthesisProtocol = capabilityOf(
              selectedProvider,
              model,
              'speech_synthesis'
            )?.protocol;
            onChange({
              provider_id: providerId,
              model,
              // Re-picking the model must keep a voice already chosen for this
              // provider; only a provider switch resets it.
              voice:
                !ttsUsesModelIdAsVoice(nextSpeechSynthesisProtocol) &&
                value?.provider_id === providerId
                  ? value.voice
                  : null,
            });
          }}
        >
          {state.modelStale && selectedModel && (
            <NomiSelect.Option key={selectedModel} value={selectedModel} disabled>
              {t('settings.taskModel.unavailableOption', { model: selectedModel })}
            </NomiSelect.Option>
          )}
          {state.models.map((m) => {
            const info = findMetrics(metricsIndex, m);
            const tip = info
              ? [
                  info.intelligence != null ? `智能 ${info.intelligence}` : null,
                  info.speedTps != null ? `${info.speedTps} T/s` : null,
                  info.ttftSeconds != null ? `首块 ${info.ttftSeconds}s` : null,
                  info.inputPerMusd != null ? `输入 $${info.inputPerMusd}/M` : null,
                  info.outputPerMusd != null ? `输出 $${info.outputPerMusd}/M` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : '';
            return (
              <NomiSelect.Option key={m} value={m}>
                <Tooltip content={tip} disabled={!tip} position='right'>
                  <span className='inline-flex w-full items-center justify-between gap-8px'>
                    <span className='truncate'>{m}</span>
                    {info?.inputPerMusd != null && (
                      <span className='shrink-0 text-11px text-t-tertiary tabular-nums'>
                        ${info.inputPerMusd}/M
                      </span>
                    )}
                  </span>
                </Tooltip>
              </NomiSelect.Option>
            );
          })}
        </NomiSelect>
        {withVoice && !modelIdIsVoice && (
          <NomiSelect
            size={size}
            contentFit
            contentMaxWidth={200}
            showSearch
            allowCreate
            disabled={disabled || selectedModel == null}
            placeholder={t('settings.taskModel.voicePlaceholder')}
            value={selectedVoice ?? undefined}
            onChange={(voice: string) => {
              if (!providerId || !selectedModel) return;
              onChange({ provider_id: providerId, model: selectedModel, voice: voice || null });
            }}
          >
            {voices.map((voice) => (
              <NomiSelect.Option key={voice} value={voice}>
                {voice}
              </NomiSelect.Option>
            ))}
          </NomiSelect>
        )}
      </div>
      {!hideHint && hint && <span className='text-11px leading-tight text-warning-6'>{hint}</span>}
    </div>
  );
};

export default TaskModelSelect;
