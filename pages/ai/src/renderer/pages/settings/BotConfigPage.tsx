import React, { useCallback, useEffect, useState } from 'react';
import { Message, Switch } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { httpRequest } from '@/common/adapter/httpBridge';
import NomiSelect from '@/renderer/components/base/NomiSelect';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import PreferenceRow from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent/PreferenceRow';

/**
 * Bot 配置页（/settings/bots）。
 *
 * <p>全局 Bot 设置：默认 AI 模型、上下文思考、上下文数量、历史加载上限、命令开关。
 * 布局与系统配置页（SystemSettings）保持一致。</p>
 */
const BotConfigPage: React.FC = () => {
  const { t } = useTranslation();

  /* 全局 Bot 配置（上下文思考 / 上下文数量 / 历史加载上限 / 命令开关 / 压缩阈值） */
  const [contextThinking, setContextThinking] = useState(false);
  const [contextSize, setContextSize] = useState<number>(10);
  const [historySize, setHistorySize] = useState<number>(50);
  const [commandEnabled, setCommandEnabled] = useState(false);
  const [compressionThreshold, setCompressionThreshold] = useState<number>(0);

  /* Bot 默认模型 */
  const [botDefaultModel, setBotDefaultModel] = useState<string>('');
  const [botModelOptions, setBotModelOptions] = useState<string[]>([]);

  useEffect(() => {
    /* 加载全局 Bot 配置 */
    (async () => {
      try {
        const res = await httpRequest<Record<string, unknown>>('GET', '/v2/ai/bot-binding/global-config');
        if (res) {
          if (typeof res.contextThinking === 'boolean') setContextThinking(res.contextThinking);
          if (typeof res.contextSize === 'number') setContextSize(res.contextSize);
          if (typeof res.historySize === 'number') setHistorySize(res.historySize);
          if (typeof res.commandEnabled === 'boolean') setCommandEnabled(res.commandEnabled);
          if (typeof res.compressionThreshold === 'number') setCompressionThreshold(res.compressionThreshold);
        }
      } catch { /* 忽略 */ }
    })();
    /* 加载 Bot 默认模型 */
    (async () => {
      try {
        const res = await httpRequest<{ model?: string }>('GET', '/v2/ai/bot-binding/default-model');
        setBotDefaultModel(res?.model ?? '');
      } catch { /* 忽略 */ }
    })();
    (async () => {
      try {
        const res = await httpRequest<{ data?: string[] }>('GET', '/v2/ai/bot-binding/models');
        const list = Array.isArray(res) ? res : res?.data;
        if (Array.isArray(list)) setBotModelOptions(list);
      } catch { /* 忽略 */ }
    })();
  }, []);

  /** 保存全局 Bot 配置 */
  const saveGlobalConfig = useCallback(async (patch: Record<string, unknown>) => {
    try {
      await httpRequest('PUT', '/v2/ai/bot-binding/global-config', patch);
      Message.success(t('common.saveSuccess', { defaultValue: '已保存' }));
    } catch {
      Message.error(t('common.saveFailed', { defaultValue: '保存失败' }));
    }
  }, [t]);

  const handleContextThinkingChange = useCallback(async (checked: boolean) => {
    setContextThinking(checked);
    await saveGlobalConfig({ contextThinking: checked });
  }, [saveGlobalConfig]);

  const handleContextSizeChange = useCallback(async (value: number) => {
    setContextSize(value);
    await saveGlobalConfig({ contextSize: value });
  }, [saveGlobalConfig]);

  const handleHistorySizeChange = useCallback(async (value: number) => {
    setHistorySize(value);
    await saveGlobalConfig({ historySize: value });
  }, [saveGlobalConfig]);

  const handleCommandEnabledChange = useCallback(async (checked: boolean) => {
    setCommandEnabled(checked);
    await saveGlobalConfig({ commandEnabled: checked });
  }, [saveGlobalConfig]);

  const handleCompressionThresholdChange = useCallback(async (value: number) => {
    setCompressionThreshold(value);
    await saveGlobalConfig({ compressionThreshold: value });
  }, [saveGlobalConfig]);

  const handleBotDefaultModelChange = useCallback(async (value: string) => {
    try {
      await httpRequest('PUT', '/v2/ai/bot-binding/default-model', { model: value });
      setBotDefaultModel(value);
      Message.success(t('settings.botDefaultModelSaved', { defaultValue: 'Bot 默认模型已保存' }));
    } catch {
      Message.error(t('settings.botDefaultModelSaveFailed', { defaultValue: '保存失败' }));
    }
  }, [t]);

  return (
    <SettingsPageWrapper>
      <div className='flex flex-col h-full w-full'>
        <NomiScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow>
          <div className='space-y-16px'>
            {/* 上下文与命令 */}
            <div className='px-[12px] md:px-[32px] py-16px bg-2 rd-16px space-y-12px'>
              <div className='w-full flex flex-col divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
                <PreferenceRow
                  label={t('settings.botDefaultModel', { defaultValue: 'Bot 默认模型' })}
                  description={t('settings.botDefaultModelDesc', { defaultValue: '未单独配置模型的 Bot 所使用的全局兜底 AI 模型。' })}
                >
                  <NomiSelect
                    className='w-200px'
                    value={botDefaultModel}
                    onChange={(v) => void handleBotDefaultModelChange(v as string)}
                    placeholder={t('settings.botDefaultModelPlaceholder', { defaultValue: '选择默认模型' })}
                  >
                    {botModelOptions.map((m) => (
                      <NomiSelect.Option key={m} value={m}>{m}</NomiSelect.Option>
                    ))}
                  </NomiSelect>
                </PreferenceRow>

                <PreferenceRow
                  label={t('bots.config.contextThinking', { defaultValue: '深度思考' })}
                  description={t('bots.config.contextThinkingDesc', { defaultValue: '开启后 AI 回复时自动拼接最近聊天历史作为上下文，实现连续对话。作为 Bot 未单独设置时的默认值。' })}
                >
                  <Switch checked={contextThinking} onChange={handleContextThinkingChange} />
                </PreferenceRow>

                <PreferenceRow
                  label={t('bots.config.contextSize', { defaultValue: '上下文数量' })}
                  description={t('bots.config.contextSizeDesc', { defaultValue: '传给 AI 的历史消息条数上限（仅上下文思考开启时生效）。' })}
                >
                  <NomiSelect
                    className='w-120px'
                    value={contextSize}
                    onChange={(v) => void handleContextSizeChange(v as number)}
                  >
                    {[5, 10, 15, 20, 30].map((n) => (
                      <NomiSelect.Option key={n} value={n}>{n}</NomiSelect.Option>
                    ))}
                  </NomiSelect>
                </PreferenceRow>

                <PreferenceRow
                  label={t('bots.config.historySize', { defaultValue: '聊天记录加载上限' })}
                  description={t('bots.config.historySizeDesc', { defaultValue: '从数据库加载的历史消息条数上限，用于 IM 页滚动分页加载。' })}
                >
                  <NomiSelect
                    className='w-120px'
                    value={historySize}
                    onChange={(v) => void handleHistorySizeChange(v as number)}
                  >
                    {[20, 50, 100, 200].map((n) => (
                      <NomiSelect.Option key={n} value={n}>{n}</NomiSelect.Option>
                    ))}
                  </NomiSelect>
                </PreferenceRow>

                <PreferenceRow
                  label={t('bots.config.commandEnabled', { defaultValue: '命令处理' })}
                  description={t('bots.config.commandEnabledDesc', { defaultValue: '开启后支持 /list @userId #userId /help 等命令。' })}
                >
                  <Switch checked={commandEnabled} onChange={handleCommandEnabledChange} />
                </PreferenceRow>

                <PreferenceRow
                  label={t('bots.config.compressionThreshold', { defaultValue: '自动压缩阈值' })}
                  description={t('bots.config.compressionThresholdDesc', { defaultValue: '上下文消息数占比达到阈值时自动压缩。0 表示不压缩。' })}
                >
                  <NomiSelect
                    className='w-120px'
                    value={compressionThreshold}
                    onChange={(v) => void handleCompressionThresholdChange(v as number)}
                  >
                    {[0, 30, 50, 70, 80, 90, 100].map((n) => (
                      <NomiSelect.Option key={n} value={n}>{n}%</NomiSelect.Option>
                    ))}
                  </NomiSelect>
                </PreferenceRow>
              </div>
            </div>
          </div>
        </NomiScrollArea>
      </div>
    </SettingsPageWrapper>
  );
};

export default BotConfigPage;
