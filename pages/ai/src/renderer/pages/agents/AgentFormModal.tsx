/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpRequest } from '@/common/adapter/httpBridge';
import type { ManagedAgent, ManagedAgentPayload } from '@/common/types/agent/managedAgent';
import NomiModal from '@/renderer/components/base/NomiModal';
import { useProvidersQuery } from '@/renderer/hooks/agent/useModelProviderList';
import { Form, Input, Select, Switch } from '@arco-design/web-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AgentFormModalProps {
  visible: boolean;
  editing?: ManagedAgent | null;
  isSub?: boolean;
  onSubmit: (payload: ManagedAgentPayload) => Promise<void>;
  onCancel: () => void;
}

const AGENT_MODES = [
  { label: 'SINGLE（单一）', value: 'SINGLE' },
  { label: 'ROUTER（路由）', value: 'ROUTER' },
  { label: 'AUTO（自动）', value: 'AUTO' },
  { label: 'PIPELINE（流水线）', value: 'PIPELINE' },
  { label: 'FAN_OUT（扇出）', value: 'FAN_OUT' },
  { label: 'PLAN_AND_EXECUTE（规划执行）', value: 'PLAN_AND_EXECUTE' },
];

interface McpServer { name: string; command: string; }
interface SkillEntry { name: string; description?: string; }

const AgentFormModal: React.FC<AgentFormModalProps> = ({
  visible,
  editing,
  isSub = false,
  onSubmit,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { data: providers } = useProvidersQuery();

  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [skillLoading, setSkillLoading] = useState(false);

  const loadOptions = async () => {
    setMcpLoading(true);
    try {
      const res = await httpRequest<unknown>('GET', '/api/mcp/servers');
      if (Array.isArray(res)) {
        setMcpServers(res as McpServer[]);
      }
    } catch { /* ignore */ } finally { setMcpLoading(false); }
    setSkillLoading(true);
    try {
      const res = await httpRequest<SkillEntry[]>('GET', '/api/skills');
      setSkills(Array.isArray(res) ? res : []);
    } catch { /* ignore */ } finally { setSkillLoading(false); }
  };

  useEffect(() => {
    if (!visible) return;
    void loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const providerOptions = useMemo(
    () => (providers ?? []).filter((p) => p.enabled !== false).map((p) => ({ label: p.name, value: p.id })),
    [providers]
  );

  const selectedProvider = Form.useWatch('provider_id', form) as string | undefined;
  const modelOptions = useMemo(
    () => (providers ?? [])
      .find((p) => p.id === selectedProvider)
      ?.models
      ?.filter((m) => m.enabled)
      .map((m) => ({ label: m.model, value: m.model })) ?? [],
    [providers, selectedProvider]
  );

  useEffect(() => {
    if (!visible) return;
    form.resetFields();
    const currentMcp = Array.isArray(editing?.mcp_ids) ? editing.mcp_ids : [];
    const currentSkill = Array.isArray(editing?.skill_ids) ? editing.skill_ids : [];
    form.setFieldsValue({
      name: editing?.name ?? '',
      description: editing?.description ?? '',
      role: editing?.role ?? '',
      instruction: editing?.instruction ?? '',
      system_prompt: editing?.system_prompt ?? '',
      provider_id: editing?.provider_id ?? undefined,
      model: editing?.model ?? undefined,
      mcp_ids: currentMcp.length > 0 ? currentMcp : undefined,
      skill_ids: currentSkill.length > 0 ? currentSkill : undefined,
      mode: editing?.strategy?.mode ?? (isSub ? 'SINGLE' : 'ROUTER'),
      planning: editing?.strategy?.planning ?? false,
      memory: editing?.strategy?.memory ?? true,
      mcp_enabled: editing?.strategy?.mcp ?? true,
      max_tool_iterations: editing?.strategy?.max_tool_iterations ?? 5,
      temperature: editing?.strategy?.temperature ?? 0.7,
      max_tokens: editing?.strategy?.max_tokens ?? 4096,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editing, isSub]);

  const handleOk = async () => {
    try {
      const values = await form.validate();
      const strategy = {
        mode: values.mode,
        planning: Boolean(values.planning),
        memory: Boolean(values.memory),
        mcp: Boolean(values.mcp_enabled),
        max_tool_iterations: Number(values.max_tool_iterations) || 5,
        temperature: Number(values.temperature) || undefined,
        max_tokens: Number(values.max_tokens) || undefined,
      };
      const mcpIds = values.mcp_ids && Array.isArray(values.mcp_ids) ? values.mcp_ids : [];
      const skillIds = values.skill_ids && Array.isArray(values.skill_ids) ? values.skill_ids : [];
      const payload: ManagedAgentPayload = {
        name: String(values.name ?? '').trim(),
        description: String(values.description ?? '').trim() || undefined,
        role: String(values.role ?? '').trim() || undefined,
        instruction: String(values.instruction ?? '').trim() || undefined,
        system_prompt: String(values.system_prompt ?? '').trim() || undefined,
        provider_id: values.provider_id || undefined,
        model: values.model || undefined,
        mcp_ids: mcpIds.length > 0 ? mcpIds : undefined,
        skill_ids: skillIds.length > 0 ? skillIds : undefined,
        strategy,
      };
      await onSubmit(payload);
    } catch (e) {
      throw e;
    }
  };

  const inputCls = 'w-full';

  return (
    <NomiModal
      visible={visible}
      onCancel={onCancel}
      header={{ title: editing ? t('agents.edit', { defaultValue: '编辑 Agent' }) : t('agents.create', { defaultValue: '新增 Agent' }), showClose: true }}
      style={{ width: 820, maxWidth: '95vw', maxHeight: '90vh' }}
      contentStyle={{ background: 'var(--dialog-fill-0)', borderRadius: 16, padding: '10px 16px 8px', overflow: 'auto' }}
      onOk={() => void handleOk()}
      okText={t('common.save', { defaultValue: '保存' })}
      cancelText={t('common.cancel', { defaultValue: '取消' })}
    >
      <Form form={form} layout='vertical' className='[&_.arco-form-item]:mb-8px'>
        <Form.Item label={t('agents.name', { defaultValue: '名称' })} field='name' required rules={[{ required: true, message: t('agents.nameRequired', { defaultValue: '请输入名称' }) }]}>
          <Input placeholder={t('agents.namePlaceholder', { defaultValue: '如：代码助手' })} />
        </Form.Item>

        <Form.Item label={t('agents.description', { defaultValue: '描述' })} field='description'>
          <Input placeholder={t('agents.descriptionPlaceholder', { defaultValue: 'Agent 的职责说明' })} />
        </Form.Item>

        <Form.Item label={t('agents.role', { defaultValue: '角色' })} field='role'>
          <Input placeholder={t('agents.rolePlaceholder', { defaultValue: '如：developer / researcher' })} />
        </Form.Item>

        <Form.Item label={t('agents.instruction', { defaultValue: '系统指令（SystemPrompt）' })} field='instruction'>
          <Input.TextArea rows={4} placeholder={t('agents.instructionPlaceholder', { defaultValue: '定义 Agent 的行为准则与能力边界' })} maxLength={4000} showWordLimit />
        </Form.Item>

        <Form.Item label={t('agents.customSystemPrompt', { defaultValue: '完整系统提示词（可选，留空自动生成）' })} field='system_prompt'>
          <Input.TextArea rows={3} placeholder='' maxLength={8000} showWordLimit />
        </Form.Item>

        <div className='grid grid-cols-2 gap-x-16px'>
          <Form.Item label={t('agents.provider', { defaultValue: '模型供应商' })} field='provider_id'>
            <Select allowClear placeholder={t('agents.selectProvider', { defaultValue: '选择供应商' })} options={providerOptions} className={inputCls} />
          </Form.Item>
          <Form.Item label={t('agents.model', { defaultValue: '模型' })} field='model'>
            <Select allowClear placeholder={t('agents.selectModel', { defaultValue: '选择模型' })} options={modelOptions} className={inputCls} disabled={!selectedProvider} />
          </Form.Item>
        </div>

        <Form.Item
          label={t('agents.mcpServers', { defaultValue: 'MCP 工具' })}
          field='mcp_ids'
          extra={t('agents.mcpServersHint', { defaultValue: '仅展示已配置的 MCP 服务器，可多选' })}
        >
          <Select
            mode='multiple'
            allowClear
            placeholder={t('agents.selectMcp', { defaultValue: '选择 MCP 工具' })}
            loading={mcpLoading}
            options={mcpServers.map((s) => ({ label: s.name, value: s.name }))}
            className={inputCls}
          />
        </Form.Item>

        <Form.Item
          label={t('agents.skills', { defaultValue: 'Skill 技能' })}
          field='skill_ids'
          extra={t('agents.skillsHint', { defaultValue: '仅展示可用的 Skill，可多选' })}
        >
          <Select
            mode='multiple'
            allowClear
            placeholder={t('agents.selectSkill', { defaultValue: '选择 Skill 技能' })}
            loading={skillLoading}
            options={skills.map((s) => ({ label: `${s.name}（${s.description?.slice(0, 20)}）`, value: s.name }))}
            className={inputCls}
          />
        </Form.Item>

        <Form.Item label={t('agents.mode', { defaultValue: '编排模式' })} field='mode'>
          <Select options={AGENT_MODES} className={inputCls} />
        </Form.Item>

        <div className='grid grid-cols-2 gap-x-16px'>
          <Form.Item label={t('agents.maxToolIterations', { defaultValue: '工具迭代上限' })} field='max_tool_iterations'>
            <Input type='number' placeholder='5' />
          </Form.Item>
          <Form.Item label={t('agents.temperature', { defaultValue: '温度' })} field='temperature'>
            <Input type='number' placeholder='0.7' />
          </Form.Item>
          <Form.Item label={t('agents.maxTokens', { defaultValue: '最大 tokens' })} field='max_tokens'>
            <Input type='number' placeholder='4096' />
          </Form.Item>
          <Form.Item label={t('agents.planning', { defaultValue: '启用规划' })} field='planning' layout='horizontal'>
            <Switch />
          </Form.Item>
          <Form.Item label={t('agents.memory', { defaultValue: '启用记忆' })} field='memory' layout='horizontal'>
            <Switch />
          </Form.Item>
          <Form.Item label={t('agents.mcpEnabled', { defaultValue: '启用 MCP' })} field='mcp_enabled' layout='horizontal'>
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </NomiModal>
  );
};

export default AgentFormModal;
