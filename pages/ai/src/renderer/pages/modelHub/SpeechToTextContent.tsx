/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Input, Switch } from '@arco-design/web-react';
import { HeadsetOne, Radar } from '@icon-park/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SpeechToTextConfig } from '@/common/types/provider/speech';
import { NomiSettingRow } from '@/renderer/components/base/NomiSettingLayout';
import TaskModelSelect from '@/renderer/components/model/TaskModelSelect';import {
  DEFAULT_SPEECH_TO_TEXT_CONFIG,
  getSpeechToTextConfig,
  normalizeSpeechToTextConfig,
  saveSpeechToTextConfig,
  SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT,
} from '@/renderer/services/speechToTextConfig';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import ModalityModelsPanel from './ModalityModelsPanel';

/**
 * 语音识别（ASR）分区：哪个目录里的模型负责把说话转成文字，外加本机 VAD 说明。
 *
 * Candidates come from the authoritative catalog resolution for
 * `speech_recognition` through the shared `TaskModelSelect` — no provider-row
 * name guessing, and no second copy of the "stale reference" rendering rules.
 *
 * VAD sits here rather than in its own section because it is not a model picker:
 * the engine is the bundled Silero ONNX graph running locally, and the gateway
 * recognises only `"silero"` (anything else falls back to its energy detector).
 * It decides when listening starts and stops, i.e. it is the front half of
 * recognition. The tunable knobs stay per companion, on that companion's 总览
 * page, because a pause length that suits one companion's owner suits nothing
 * else.
 */
const SpeechToTextContent: React.FC = () => {
  const { t } = useTranslation();
  const [message, messageContext] = useArcoMessage({ maxCount: 2 });
  const [config, setConfig] = useState<SpeechToTextConfig>(DEFAULT_SPEECH_TO_TEXT_CONFIG);

  useEffect(() => {
    const syncConfig = () => setConfig(getSpeechToTextConfig());
    syncConfig();
    window.addEventListener(SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT, syncConfig);
    return () => window.removeEventListener(SPEECH_TO_TEXT_CONFIG_CHANGED_EVENT, syncConfig);
  }, []);

  const persist = useCallback(
    (next: SpeechToTextConfig) => {
      const normalized = normalizeSpeechToTextConfig(next);
      setConfig(normalized);
      void saveSpeechToTextConfig(normalized).catch((error) => {
        console.error('Failed to save speech-to-text config:', error);
        setConfig(getSpeechToTextConfig());
        message.error(error instanceof Error ? error.message : t('settings.saveModelConfigFailed'));
      });
    },
    [message, t]
  );

  const selected = Boolean(config.provider_id && config.model);

  return (
    <div className='flex flex-col gap-14px'>
      {messageContext}
      <ModalityModelsPanel
        modality='asr'
        icon={<HeadsetOne theme='outline' size='18' strokeWidth={3} />}
        titleKey='settings.modelHub.modality.asrTitle'
        subtitleKey='settings.modelHub.modality.asrSubtitle'
        configRows={
          <>
            <NomiSettingRow
              style={{ background: 'transparent' }}
              title={t('settings.modelHub.speech.source')}
              controlsClassName='justify-start'
              controls={
                <TaskModelSelect
                  task='speech_recognition'
                  size='small'
                  value={
                    config.provider_id && config.model
                      ? { provider_id: config.provider_id, model: config.model }
                      : null
                  }
                  emptyHint={t('settings.modelHub.speech.noSources')}
                  onChange={({ provider_id, model }) =>
                    persist({ ...config, enabled: true, provider_id, model })
                  }
                />
              }
            />
            <NomiSettingRow
              style={{ background: 'transparent' }}
              title={t('settings.modelHub.speech.defaultLanguage')}
              controlsClassName='justify-start'
              controls={
                <Input
                  value={config.language}
                  placeholder={t('settings.modelHub.speech.languagePlaceholder')}
                  onBlur={() => persist(config)}
                  onChange={(language) => setConfig((current) => ({ ...current, language }))}
                />
              }
            />
            <NomiSettingRow
              style={{ background: 'transparent' }}
              title={t('settings.modelHub.speech.enabled')}
              controlsClassName='justify-start'
              controls={
                <Switch
                  checked={config.enabled && selected}
                  disabled={!selected}
                  onChange={(enabled) => persist({ ...config, enabled })}
                />
              }
            />
            {/* 本机 VAD：没有可选模型，只陈述引擎与默认值。 */}
            <NomiSettingRow
              style={{ background: 'transparent' }}
              leading={
                <span
                  aria-hidden='true'
                  className='size-24px shrink-0 flex items-center justify-center rd-7px bg-primary-1 text-primary-6'
                >
                  <Radar theme='outline' size='14' />
                </span>
              }
              title={t('settings.modelHub.speech.vadTitle')}
              description={t('settings.modelHub.speech.vadBuiltinHint', {
                sensitivity: '0.5',
                silence: 700,
              })}
            />
          </>
        }
      />
    </div>
  );
};

export default SpeechToTextContent;
