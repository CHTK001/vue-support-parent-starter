/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button, Input, InputNumber, Message, Switch, Tooltip } from '@arco-design/web-react';
import {
  AiGlobalSettings,
  aiBool,
  aiNum,
  aiNumOrUndefined,
  aiStr,
  loadAiGlobalSettings,
  saveAiGlobalSettings,
} from '@/common/config/aiGlobalSettings';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PreferenceRow from './PreferenceRow';

/**
 * 全局 AI 设置 —— 对接后端 `/v2/global-settings`（落地到 `sys_ai_global_setting` 键值表）。
 *
 * <p>覆盖 LLM 运行时（默认模型/温度/max tokens/超时/流式/缓存/系统提示词）、
 * 用量分析以及 RAG（Embedding/向量库/切片）等全局配置。读取与保存均为完整往返：
 * 挂载时 GET，保存时 PUT 当前值。默认值统一来自 {@code AI_GLOBAL_SETTINGS_DEFAULTS}。</p>
 */
const GlobalSettingsSection: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<AiGlobalSettings>({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loadAiGlobalSettings();
      setValues(res);
      setHasLoaded(true);
    } catch {
      setHasLoaded(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const set = useCallback(<K extends keyof AiGlobalSettings>(key: K, value: AiGlobalSettings[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await saveAiGlobalSettings(values);
      Message.success(t('settings.globalSettingsSaved', { defaultValue: '全局设置已保存' }));
      await load();
    } catch {
      Message.error(t('settings.globalSettingsSaveFailed', { defaultValue: '保存失败' }));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [t, values, load]);

  if (loading) {
    return (
      <div className='py-20px text-center text-14px text-t-secondary'>
        {t('settings.globalSettingsLoading', { defaultValue: '加载全局设置…' })}
      </div>
    );
  }

  return (
    <div className='w-full flex flex-col'>
      <div className='text-15px font-600 text-t-primary mb-4px'>
        {t('settings.globalSettings', { defaultValue: 'AI 全局设置' })}
      </div>
      <div className='text-13px text-t-tertiary mb-8px'>
        {t('settings.globalSettingsDesc', {
          defaultValue: '默认模型、运行时参数、用量分析与 RAG 等全局配置，实时保存到服务端。',
        })}
      </div>
      {!hasLoaded && (
        <div className='py-8px text-14px text-danger-6'>
          {t('settings.globalSettingsLoadFailed', { defaultValue: '全局设置加载失败，请检查服务端' })}
          <Button size='mini' className='ml-8px' onClick={() => void load()}>
            {t('settings.retry', { defaultValue: '重试' })}
          </Button>
        </div>
      )}

      <PreferenceRow label={t('settings.chatClientEnabled', { defaultValue: '启用 ChatClient 聚合' })}>
        <Switch checked={aiBool(values, 'chatClientEnabled', true)} onChange={(v) => set('chatClientEnabled', v)} />
      </PreferenceRow>
      <PreferenceRow label={t('settings.defaultModel', { defaultValue: '默认模型' })}>
        <Input
          className='w-240px'
          placeholder='gpt-4o'
          value={aiStr(values, 'defaultModel')}
          onChange={(v) => set('defaultModel', v)}
        />
      </PreferenceRow>
      <PreferenceRow label={t('settings.temperature', { defaultValue: '默认温度' })} description='0~2'>
        <InputNumber
          className='w-120px'
          min={0}
          max={2}
          step={0.1}
          value={aiNumOrUndefined(values, 'temperature')}
          onChange={(v) => set('temperature', v ?? aiNum(values, 'temperature', 0.7))}
        />
      </PreferenceRow>
      <PreferenceRow label={t('settings.maxTokens', { defaultValue: '默认最大 Tokens' })}>
        <InputNumber
          className='w-120px'
          min={1}
          value={aiNumOrUndefined(values, 'maxTokens')}
          onChange={(v) => set('maxTokens', v ?? aiNum(values, 'maxTokens', 4096))}
        />
      </PreferenceRow>
      <PreferenceRow label={t('settings.timeout', { defaultValue: '请求超时（秒）' })}>
        <InputNumber
          className='w-120px'
          min={1}
          value={aiNumOrUndefined(values, 'timeout')}
          onChange={(v) => set('timeout', v ?? aiNum(values, 'timeout', 30))}
        />
      </PreferenceRow>
      <PreferenceRow label={t('settings.enableUsageAnalysis', { defaultValue: '启用用量分析' })}>
        <Switch checked={aiBool(values, 'enableUsageAnalysis', true)} onChange={(v) => set('enableUsageAnalysis', v)} />
      </PreferenceRow>
      <PreferenceRow label={t('settings.usageReportInterval', { defaultValue: '用量上报间隔（秒）' })}>
        <InputNumber
          className='w-120px'
          min={10}
          value={aiNumOrUndefined(values, 'usageReportInterval')}
          onChange={(v) => set('usageReportInterval', v ?? aiNum(values, 'usageReportInterval', 300))}
        />
      </PreferenceRow>
      <PreferenceRow label={t('settings.enableCache', { defaultValue: '启用缓存' })}>
        <Switch checked={aiBool(values, 'enableCache', true)} onChange={(v) => set('enableCache', v)} />
      </PreferenceRow>
      <PreferenceRow label={t('settings.stream', { defaultValue: '流式输出' })}>
        <Switch checked={aiBool(values, 'stream', true)} onChange={(v) => set('stream', v)} />
      </PreferenceRow>
      <PreferenceRow label={t('settings.systemPrompt', { defaultValue: '默认系统提示词' })}>
        <Tooltip content={aiStr(values, 'systemPrompt')}>
          <Input
            className='w-240px'
            placeholder={t('settings.systemPromptPlaceholder', { defaultValue: '全局 ChatClient 默认系统提示词' })}
            value={aiStr(values, 'systemPrompt')}
            onChange={(v) => set('systemPrompt', v)}
          />
        </Tooltip>
      </PreferenceRow>

      <div className='text-14px font-600 text-t-primary mt-12px mb-4px'>
        {t('settings.ragSettings', { defaultValue: 'RAG 知识库' })}
      </div>
      <PreferenceRow label={t('settings.ragEmbeddingModel', { defaultValue: 'Embedding 引擎' })}>
        <Input
          className='w-200px'
          placeholder='memory'
          value={aiStr(values, 'ragEmbeddingModel')}
          onChange={(v) => set('ragEmbeddingModel', v)}
        />
      </PreferenceRow>
      <PreferenceRow label={t('settings.ragVectorStorage', { defaultValue: '向量存储' })}>
        <Input
          className='w-200px'
          placeholder='jvector'
          value={aiStr(values, 'ragVectorStorage')}
          onChange={(v) => set('ragVectorStorage', v)}
        />
      </PreferenceRow>
      <PreferenceRow label={t('settings.ragChunkSize', { defaultValue: '文本切片大小（字符）' })}>
        <InputNumber
          className='w-120px'
          min={100}
          value={aiNumOrUndefined(values, 'ragChunkSize')}
          onChange={(v) => set('ragChunkSize', v ?? aiNum(values, 'ragChunkSize', 1000))}
        />
      </PreferenceRow>
      <PreferenceRow label={t('settings.ragChunkOverlap', { defaultValue: '文本切片重叠（字符）' })}>
        <InputNumber
          className='w-120px'
          min={0}
          value={aiNumOrUndefined(values, 'ragChunkOverlap')}
          onChange={(v) => set('ragChunkOverlap', v ?? aiNum(values, 'ragChunkOverlap', 200))}
        />
      </PreferenceRow>
      <PreferenceRow label={t('settings.ragSplitter', { defaultValue: '文本切片策略' })}>
        <Input
          className='w-200px'
          placeholder='sentence'
          value={aiStr(values, 'ragSplitter')}
          onChange={(v) => set('ragSplitter', v)}
        />
      </PreferenceRow>

      <div className='mt-16px'>
        <Button type='primary' loading={saving} disabled={!hasLoaded} onClick={() => void handleSave()}>
          {t('settings.save', { defaultValue: '保存' })}
        </Button>
      </div>
    </div>
  );
};

export default GlobalSettingsSection;
