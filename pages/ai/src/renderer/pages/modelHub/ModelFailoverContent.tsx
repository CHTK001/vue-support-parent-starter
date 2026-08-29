/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, InputNumber, Switch } from '@arco-design/web-react';
import { Close, Down, Plus, SettingTwo, Up } from '@icon-park/react';
import { ipcBridge } from '@/common';
import type { IModelFailoverCandidate, IModelFailoverConfig } from '@/common/adapter/ipcBridge';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import { useProvidersQuery } from '@renderer/hooks/agent/useModelProviderList';
import TaskModelSelect, { type TaskModelSelection } from '@/renderer/components/model/TaskModelSelect';
import { buildModelFailoverConfigForSave } from './modelFailoverQueue';
import type { ProviderId } from '@/common/types/ids';
import { useModelSelectorProviderLabel } from '@/renderer/hooks/agent/useModelSelectorProviderLabel';

const DEFAULT_CONFIG: IModelFailoverConfig = {
  enabled: false,
  queue: [],
  max_switches: 4,
};

/**
 * Global model failover queue editor (Phase-3 D8). An ordered list of
 * provider+model candidates the conversation send-loop falls back through when a
 * NOMI session hits a pre-response provider fault. Persisted as one JSON blob
 * under the `agent.model_failover` client preference, via the same
 * idmm-settings-style channel as the IDMM defaults tab.
 */
const ModelFailoverContent: React.FC = () => {
  const { t } = useTranslation();
  const [message, messageContext] = useArcoMessage();
  const { data: providers } = useProvidersQuery();
  const providerLabel = useModelSelectorProviderLabel();
  const [config, setConfig] = useState<IModelFailoverConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);

  // Pending "add candidate" selection: one model with an exact Chat capability.
  // The queue previously listed all models of a
  // provider unfiltered, this is its first-time task filtering).
  const [draft, setDraft] = useState<TaskModelSelection | null>(null);

  useEffect(() => {
    void ipcBridge.agentModelFailover.getSettings
      .invoke()
      .then((c) => setConfig({ ...DEFAULT_CONFIG, ...c, queue: c.queue ?? [] }))
      .catch(() => {});
  }, []);

  const providerName = (id: ProviderId) => {
    const provider = (providers ?? []).find((item) => item.id === id);
    return provider ? providerLabel(provider) : id;
  };

  const moveCandidate = (index: number, delta: number) => {
    setConfig((c) => {
      const target = index + delta;
      if (target < 0 || target >= c.queue.length) return c;
      const queue = [...c.queue];
      const [picked] = queue.splice(index, 1);
      queue.splice(target, 0, picked);
      return { ...c, queue };
    });
  };

  const removeCandidate = (index: number) => {
    setConfig((c) => ({ ...c, queue: c.queue.filter((_, i) => i !== index) }));
  };

  const addCandidate = () => {
    if (!draft) return;
    const next: IModelFailoverCandidate = { provider_id: draft.provider_id, model: draft.model };
    const dup = config.queue.some((q) => q.provider_id === next.provider_id && q.model === next.model);
    if (dup) {
      message.warning(t('modelFailover.duplicate'));
      return;
    }
    setConfig((c) => ({ ...c, queue: [...c.queue, next] }));
    setDraft(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const saveResult = buildModelFailoverConfigForSave(config, draft?.provider_id, draft?.model);
      const saved = await ipcBridge.agentModelFailover.updateSettings.invoke(saveResult.config);
      setConfig({ ...DEFAULT_CONFIG, ...saved, queue: saved.queue ?? [] });
      if (saveResult.hasCompleteDraft) {
        setDraft(null);
      }
      message.success(t('modelFailover.saved'));
    } catch (e) {
      message.error(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='mh-card flex flex-col gap-18px px-24px py-20px'>
      {messageContext}
      <header className='flex items-center gap-12px border-b border-b-solid border-[var(--color-border-2)] pb-16px'>
        <span className='mh-page-icon'>
          <SettingTwo theme='outline' size='20' strokeWidth={3} />
        </span>
        <div className='min-w-0'>
          <h2 className='mh-page-title'>{t('modelFailover.title')}</h2>
          <p className='mh-page-subtitle'>{t('modelFailover.desc')}</p>
        </div>
      </header>

      <div className='flex items-center justify-between rd-10px border border-solid border-[var(--mh-border)] bg-[var(--mh-surface)] px-14px py-10px shadow-sm'>
        <span className='text-t-primary text-13px font-500'>{t('modelFailover.enable')}</span>
        <Switch checked={config.enabled} onChange={(v: boolean) => setConfig((c) => ({ ...c, enabled: v }))} />
      </div>

      <div className='flex flex-col gap-8px'>
        <span className='text-t-primary text-13px font-600'>{t('modelFailover.queue')}</span>
        <div className='text-t-tertiary text-12px leading-18px'>{t('modelFailover.queueHint')}</div>

        {config.queue.length === 0 ? (
          <div className='rd-10px border border-dashed border-[rgba(var(--primary-6),0.25)] px-12px py-16px text-center text-12px text-t-tertiary'>
            {t('modelFailover.empty')}
          </div>
        ) : (
          <div className='flex flex-col gap-6px'>
            {config.queue.map((cand, index) => (
              <div key={`${cand.provider_id}::${cand.model}`} className='mh-queue-item'>
                <span className='mh-queue-index'>{index + 1}</span>
                <div className='min-w-0 flex-1'>
                  <div className='truncate text-13px font-500 text-t-primary'>{cand.model}</div>
                  <div className='truncate text-11px text-t-tertiary'>{providerName(cand.provider_id)}</div>
                </div>
                <div
                  role='button'
                  aria-label={t('modelFailover.moveUp')}
                  className={`mh-icon-btn ${index === 0 ? 'disabled' : ''}`}
                  onClick={() => index > 0 && moveCandidate(index, -1)}
                >
                  <Up theme='outline' size='14' fill='currentColor' />
                </div>
                <div
                  role='button'
                  aria-label={t('modelFailover.moveDown')}
                  className={`mh-icon-btn ${index === config.queue.length - 1 ? 'disabled' : ''}`}
                  onClick={() => index < config.queue.length - 1 && moveCandidate(index, 1)}
                >
                  <Down theme='outline' size='14' fill='currentColor' />
                </div>
                <div
                  role='button'
                  aria-label={t('modelFailover.remove')}
                  className='mh-icon-btn danger'
                  onClick={() => removeCandidate(index)}
                >
                  <Close theme='outline' size='14' fill='currentColor' />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add a candidate — unified task-scoped picker (chat models only). */}
        <div className='flex items-center gap-8px mt-2px'>
          <div className='min-w-0 flex-1'>
            <TaskModelSelect
              task='chat'
              value={draft}
              onChange={setDraft}
              placeholder={t('modelFailover.selectModel')}
            />
          </div>
          <div
            role='button'
            aria-label={t('modelFailover.add')}
            className={`flex h-32px shrink-0 items-center gap-4px rd-8px px-12px text-13px transition-colors ${
              draft
                ? 'cursor-pointer bg-[rgba(var(--primary-6),0.12)] text-primary-6 hover:bg-[rgba(var(--primary-6),0.2)]'
                : 'cursor-not-allowed bg-[rgba(var(--primary-6),0.06)] text-t-disabled'
            }`}
            onClick={addCandidate}
          >
            <Plus theme='outline' size='14' fill='currentColor' />
            <span>{t('modelFailover.add')}</span>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-6px'>
        <span className='text-t-primary text-13px font-600'>{t('modelFailover.maxSwitches')}</span>
        <div className='text-t-tertiary text-12px leading-18px'>{t('modelFailover.maxSwitchesHint')}</div>
        <InputNumber
          min={1}
          max={20}
          value={config.max_switches}
          onChange={(v) => setConfig((c) => ({ ...c, max_switches: typeof v === 'number' ? v : c.max_switches }))}
          style={{ width: 160 }}
        />
      </div>

      <div className='flex justify-end border-t border-t-solid border-[var(--color-border-2)] pt-14px'>
        <Button type='primary' loading={saving} onClick={save}>
          {t('common.save', { defaultValue: 'Save' })}
        </Button>
      </div>
    </div>
  );
};

export default ModelFailoverContent;
