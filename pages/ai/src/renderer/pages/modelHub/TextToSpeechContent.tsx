/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@arco-design/web-react';
import { Voice } from '@icon-park/react';
import type { TextToSpeechConfig } from '@/common/types/provider/speech';
import { NomiSettingRow } from '@/renderer/components/base/NomiSettingLayout';
import TaskModelSelect from '@/renderer/components/model/TaskModelSelect';
import {
  getTextToSpeechConfig,
  saveTextToSpeechConfig,
  TEXT_TO_SPEECH_CONFIG_CHANGED_EVENT,
} from '@/renderer/services/textToSpeechConfig';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import ModalityModelsPanel from './ModalityModelsPanel';

/**
 * TTS 首次获得配置面：全局默认的「语音合成模型 + 音色」。
 *
 * Every companion whose `voice.tts` slot is empty speaks with this. Clearing it
 * deletes the preference key outright (see `saveTextToSpeechConfig`), because
 * the backend registers the key as a required Provider reference and would
 * refuse a half-empty object.
 */
const TextToSpeechContent: React.FC = () => {
  const { t } = useTranslation();
  const [message, messageContext] = useArcoMessage({ maxCount: 2 });
  const [config, setConfig] = useState<TextToSpeechConfig | null>(null);

  useEffect(() => {
    const sync = () => setConfig(getTextToSpeechConfig() ?? null);
    sync();
    window.addEventListener(TEXT_TO_SPEECH_CONFIG_CHANGED_EVENT, sync);
    return () => window.removeEventListener(TEXT_TO_SPEECH_CONFIG_CHANGED_EVENT, sync);
  }, []);

  const persist = useCallback(
    (next: TextToSpeechConfig | null) => {
      setConfig(next);
      void saveTextToSpeechConfig(next)
        .then(() => message.success(t('settings.modelHub.speech.ttsSaved')))
        .catch((error: unknown) => {
          setConfig(getTextToSpeechConfig() ?? null);
          message.error(
            error instanceof Error ? error.message : t('settings.modelHub.speech.ttsSaveFailed')
          );
        });
    },
    [message, t]
  );

  return (
    <div className='flex flex-col gap-14px'>
      {messageContext}
      <ModalityModelsPanel
        modality='tts'
        icon={<Voice theme='outline' size='18' strokeWidth={3} />}
        titleKey='settings.modelHub.modality.ttsTitle'
        subtitleKey='settings.modelHub.modality.ttsSubtitle'
        configRows={
          <NomiSettingRow
            style={{ background: 'transparent' }}
            title={t('settings.modelHub.speech.ttsSource')}
            description={t('settings.taskModel.voiceFreeTextHint')}
            controlsClassName='justify-start'
            controls={
              <TaskModelSelect
                task='speech_synthesis'
                size='small'
                withVoice
                value={config}
                emptyHint={t('settings.modelHub.speech.ttsNoSources')}
                onChange={({ provider_id, model, voice }) =>
                  persist({ provider_id, model, voice: voice ?? null })
                }
              />
            }
            footer={
              config ? (
                <Button size='small' onClick={() => persist(null)}>
                  {t('settings.modelHub.speech.ttsClear')}
                </Button>
              ) : undefined
            }
          />
        }
      />
    </div>
  );
};

export default TextToSpeechContent;
