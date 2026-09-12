/**
 * AgentManagementPage — Agent 管理
 *
 * 功能：Agent 列表 / 新建编辑（基本参数）/ 主从编排（子 Agent 配置）/ 注册为模型
 * 后端：/api/agents/managed（CRUD + 子 Agent + 编排图 + as-model 注册）
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Message,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Switch,
  Tag,
  Tooltip,
} from '@arco-design/web-react';
import {
  Add,
  Delete,
  Edit,
  Link,
  Refresh,
  Search,
  SettingOne,
  Unlink,
  User,
} from '@icon-park/react';
import {
  agentApi,
  AgentDefinition,
  DEFAULT_MANUFACTURERS,
  OrchestrationData,
} from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

const { TextArea } = Input;

export default function AgentManagementPage() {
  const { t } = useTranslation('settings');
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<AgentDefinition | null>(null);
  const [saving, setSaving] = useState(false);
  const [orchestrationAgent, setOrchestrationAgent] = useState<AgentDefinition | null>(null);
  const [orchestrationData, setOrchestrationData] = useState<OrchestrationData | null>(null);
  const [orchestrationLoading, setOrchestrationLoading] = useState(false);
  const [manufacturers, setManufacturers] = useState(DEFAULT_MANUFACTURERS);
  const [form] = Form.useForm();

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const list = await agentApi.list().catch(() => [] as AgentDefinition[]);
      setAgents(list);
    } catch {
      Message.error(t('console.agent.loadFailed', 'Agent 列表加载失败'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return agents;
    return agents.filter((a) =>
      `${a.name ?? ''} ${a.description ?? ''} ${a.agentId ?? ''}`.toLowerCase().includes(kw),
    );
  }, [agents, keyword]);

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({
      name: '',
      description: '',
      model: '',
      providerId: undefined,
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      enabled: true,
      isLeader: false,
      mode: 'SINGLE',
    });
    setModalVisible(true);
  };

  const openEdit = (agent: AgentDefinition) => {
    setEditing(agent);
    form.setFieldsValue({
      name: agent.name ?? '',
      description: agent.description ?? '',
      model: agent.model ?? '',
      providerId: agent.providerId,
      systemPrompt: agent.systemPrompt ?? '',
      temperature: agent.temperature ?? 0.7,
      maxTokens: agent.maxTokens ?? 4096,
      topP: agent.topP ?? 1,
      enabled: agent.enabled ?? true,
      isLeader: agent.isLeader ?? false,
      mode: agent.mode ?? 'SINGLE',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validate();
      setSaving(true);
      if (editing?.agentId) {
        await agentApi.update(editing.agentId, values);
        Message.success(t('console.agent.updated', 'Agent 已更新'));
      } else {
        await agentApi.create(values);
        Message.success(t('console.agent.created', 'Agent 已创建'));
      }
      setModalVisible(false);
      loadAgents();
    } catch (e) {
      // 表单校验失败不提示
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (agentId: string) => {
    try {
      await agentApi.remove(agentId);
      Message.success(t('console.agent.deleted', 'Agent 已删除'));
      loadAgents();
    } catch {
      Message.error(t('console.agent.deleteFailed', '删除失败'));
    }
  };

  const handleRegister = async (agent: AgentDefinition, modelName?: string) => {
    try {
      await agentApi.registerAsModel(agent.agentId!, modelName);
      Message.success(t('console.agent.registered', '已注册为模型'));
      loadAgents();
    } catch {
      Message.error(t('console.agent.registerFailed', '注册失败'));
    }
  };

  const handleUnregister = async (agent: AgentDefinition) => {
    try {
      await agentApi.unregisterModel(agent.agentId!);
      Message.success(t('console.agent.unregistered', '已取消模型注册'));
      loadAgents();
    } catch {
      Message.error(t('console.agent.unregisterFailed', '取消注册失败'));
    }
  };

  const openOrchestration = async (agent: AgentDefinition) => {
    setOrchestrationAgent(agent);
    setOrchestrationLoading(true);
    try {
      const data = await agentApi.getOrchestration(agent.agentId!).catch(() => ({ nodes: [], edges: [], mode: 'SINGLE' }));
      setOrchestrationData(data);
    } finally {
      setOrchestrationLoading(false);
    }
  };

  const saveOrchestration = async () => {
    if (!orchestrationAgent || !orchestrationData) return;
    try {
      await agentApi.saveOrchestration(orchestrationAgent.agentId!, orchestrationData);
      Message.success(t('console.agent.orchSaved', '编排已保存'));
      setOrchestrationAgent(null);
    } catch {
      Message.error(t('console.agent.orchSaveFailed', '编排保存失败'));
    }
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <div>
          <h2 className="ai-page-title">{t('console.agent.title', 'Agent 管理')}</h2>
          <p className="ai-page-subtitle">{t('console.agent.subtitle', '配置智能体基本参数、主从编排，注册为模型对外提供服务')}</p>
        </div>
        <div className="ai-page-actions">
          <Button icon={<Refresh {...iconProps} />} onClick={loadAgents}>{t('console.common.refresh', '刷新')}</Button>
          <Button type="primary" icon={<Add {...iconProps} />} onClick={openCreate}>{t('console.agent.create', '新建 Agent')}</Button>
        </div>
      </div>

      <div className="ai-toolbar">
        <Input
          prefix={<Search {...iconProps} />}
          placeholder={t('console.agent.searchPlaceholder', '搜索 Agent 名称 / 描述')}
          value={keyword}
          onChange={setKeyword}
          allowClear
          style={{ width: 320 }}
        />
      </div>

      <Spin loading={loading} style={{ display: 'block' }}>
        {filtered.length === 0 ? (
          <Empty description={t('console.agent.empty', '暂无 Agent，点击右上角新建')} />
        ) : (
          <div className="ai-card-grid">
            {filtered.map((agent) => (
              <Card
                key={agent.agentId}
                className="ai-agent-card"
                hoverable
                title={
                  <div className="ai-agent-card-title">
                    <User {...iconProps} />
                    <span>{agent.name}</span>
                    {agent.isLeader && <Tag color="arcoblue" size="small">{t('console.agent.leader', '主 Agent')}</Tag>}
                    {!agent.isLeader && <Tag size="small">{t('console.agent.sub', '子 Agent')}</Tag>}
                    {agent.enabled ? (
                      <Tag color="green" size="small">{t('console.common.enabled', '已启用')}</Tag>
                    ) : (
                      <Tag color="gray" size="small">{t('console.common.disabled', '已禁用')}</Tag>
                    )}
                  </div>
                }
                extra={
                  <div className="ai-card-actions">
                    <Tooltip content={t('console.agent.edit', '编辑')}>
                      <Button type="text" size="small" icon={<Edit {...iconProps} />} onClick={() => openEdit(agent)} />
                    </Tooltip>
                    <Tooltip content={t('console.agent.orchestration', '编排')}>
                      <Button type="text" size="small" icon={<SettingOne {...iconProps} />} onClick={() => openOrchestration(agent)} />
                    </Tooltip>
                    {agent.registeredModel ? (
                      <Popconfirm
                        title={t('console.agent.confirmUnregister', '取消注册为模型？')}
                        onOk={() => handleUnregister(agent)}
                      >
                        <Tooltip content={t('console.agent.unregister', '取消模型注册')}>
                          <Button type="text" size="small" status="danger" icon={<Unlink {...iconProps} />} />
                        </Tooltip>
                      </Popconfirm>
                    ) : (
                      <Tooltip content={t('console.agent.register', '注册为模型')}>
                        <Button type="text" size="small" icon={<Link {...iconProps} />} onClick={() => handleRegister(agent)} />
                      </Tooltip>
                    )}
                    <Popconfirm
                      title={t('console.agent.confirmDelete', '确定删除该 Agent？')}
                      onOk={() => handleDelete(agent.agentId!)}
                    >
                      <Tooltip content={t('console.common.delete', '删除')}>
                        <Button type="text" size="small" status="danger" icon={<Delete {...iconProps} />} />
                      </Tooltip>
                    </Popconfirm>
                  </div>
                }
              >
                <div className="ai-agent-card-body">
                  <p className="ai-agent-desc">{agent.description || t('console.agent.noDesc', '暂无描述')}</p>
                  <div className="ai-agent-meta">
                    <div className="ai-agent-meta-item">
                      <span className="ai-agent-meta-label">{t('console.agent.model', '模型')}</span>
                      <span className="ai-agent-meta-value">{agent.model || '—'}</span>
                    </div>
                    <div className="ai-agent-meta-item">
                      <span className="ai-agent-meta-label">{t('console.agent.mode', '模式')}</span>
                      <span className="ai-agent-meta-value">{agent.mode === 'ROUTER' ? t('console.agent.router', '路由主从') : t('console.agent.single', '单 Agent')}</span>
                    </div>
                    <div className="ai-agent-meta-item">
                      <span className="ai-agent-meta-label">{t('console.agent.subCount', '子 Agent')}</span>
                      <span className="ai-agent-meta-value">{agent.subAgents?.length ?? 0}</span>
                    </div>
                    {agent.registeredModel && (
                      <div className="ai-agent-meta-item">
                        <span className="ai-agent-meta-label">{t('console.agent.registeredAs', '注册模型')}</span>
                        <span className="ai-agent-meta-value" style={{ color: 'var(--color-primary-6)' }}>{agent.registeredModel}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Spin>

      {/* 新建/编辑 Agent */}
      <Modal
        {...({
          title: editing ? t('console.agent.editTitle', '编辑 Agent') : t('console.agent.createTitle', '新建 Agent'),
          visible: modalVisible,
          onCancel: () => setModalVisible(false),
          onOk: () => { handleSave(); },
          confirmLoading: saving,
          width: 680,
          okText: t('console.common.save', '保存'),
          cancelText: t('console.common.cancel', '取消'),
        } as any)}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={t('console.agent.formName', 'Agent 名称')} field="name" required>
              <Input placeholder={t('console.agent.formNamePlaceholder', '如：研究员、代码助手')} />
            </Form.Item>
            <Form.Item label={t('console.agent.formMode', '运行模式')} field="mode">
              <Select getPopupContainer={(node) => node.parentNode as HTMLElement}>
                <Select.Option value="SINGLE">{t('console.agent.single', '单 Agent')}</Select.Option>
                <Select.Option value="ROUTER">{t('console.agent.router', '路由主从')}</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item label={t('console.agent.formDesc', '描述')} field="description">
              <TextArea placeholder={t('console.agent.formDescPlaceholder', 'Agent 的功能描述')} rows={2} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={t('console.agent.formProvider', '供应商')} field="providerId">
              <Select placeholder={t('console.agent.formProviderPlaceholder', '选择供应商')} allowClear getPopupContainer={(node) => node.parentNode as HTMLElement}>
                {manufacturers.map((m) => (
                  <Select.Option key={m.id} value={m.id}>{m.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label={t('console.agent.formModel', '模型')} field="model">
              <Input placeholder={t('console.agent.formModelPlaceholder', '如：gpt-4o、deepseek-chat')} allowClear />
            </Form.Item>
          </div>
          <Form.Item label={t('console.agent.formSystemPrompt', '系统提示词')} field="systemPrompt">
            <TextArea placeholder={t('console.agent.formSystemPromptPlaceholder', '定义 Agent 的角色和行为')} rows={3} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={t('console.agent.formTemperature', '温度')} field="temperature">
              <InputNumber min={0} max={2} step={0.1} />
            </Form.Item>
            <Form.Item label={t('console.agent.formMaxTokens', '最大 Token')} field="maxTokens">
              <InputNumber min={1} step={1} />
            </Form.Item>
            <Form.Item label={t('console.agent.formTopP', 'Top P')} field="topP">
              <InputNumber min={0} max={1} step={0.05} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item label={t('console.agent.formEnabled', '启用')} field="enabled">
              <Switch />
            </Form.Item>
            <Form.Item label={t('console.agent.formIsLeader', '主 Agent（可编排子 Agent）')} field="isLeader">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 编排图 Modal */}
      <Modal
        {...({
          title: t('console.agent.orchTitle', '主从编排 - {{name}}', { name: orchestrationAgent?.name ?? '' }),
          visible: !!orchestrationAgent,
          onCancel: () => setOrchestrationAgent(null),
          onOk: () => { saveOrchestration(); },
          width: 800,
          okText: t('console.common.save', '保存'),
          cancelText: t('console.common.cancel', '取消'),
        } as any)}
      >
        <Spin loading={orchestrationLoading}>
          {orchestrationData && (
            <div className="ai-orchestration-panel">
              <div className="ai-orchestration-canvas">
                {orchestrationData.nodes?.map((node) => (
                  <div
                    key={node.id}
                    className={`ai-orch-node ${node.kind === 'master' ? 'ai-orch-node-master' : 'ai-orch-node-sub'}`}
                    style={{ left: node.position?.x ?? 100, top: node.position?.y ?? 100 }}
                  >
                    <div className="ai-orch-node-label">{node.label}</div>
                    <div className="ai-orch-node-kind">{node.kind === 'master' ? t('console.agent.master', '主') : t('console.agent.sub', '子')}</div>
                  </div>
                ))}
                <svg className="ai-orch-edges" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {orchestrationData.edges?.map((edge) => {
                    const source = orchestrationData.nodes?.find((n) => n.id === edge.source);
                    const target = orchestrationData.nodes?.find((n) => n.id === edge.target);
                    if (!source || !target) return null;
                    const x1 = (source.position?.x ?? 0) + 70;
                    const y1 = (source.position?.y ?? 0) + 30;
                    const x2 = (target.position?.x ?? 0) + 70;
                    const y2 = (target.position?.y ?? 0) + 30;
                    return (
                      <line key={edge.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-primary-5)" strokeWidth={2} markerEnd="url(#arrow)" />
                    );
                  })}
                  <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L9,3 z" fill="var(--color-primary-5)" />
                    </marker>
                  </defs>
                </svg>
              </div>
              <div className="ai-orch-info">
                <Tag color="arcoblue">{t('console.agent.mode', '模式')}: {orchestrationData.mode ?? 'SINGLE'}</Tag>
                <span>{t('console.agent.nodeCount', '节点')}: {orchestrationData.nodes?.length ?? 0}</span>
                <span>{t('console.agent.edgeCount', '连线')}: {orchestrationData.edges?.length ?? 0}</span>
              </div>
              <p className="ai-orch-hint">{t('console.agent.orchHint', '编排数据由后端持久化，保存后可热更新运行时 Agent')}</p>
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
}

const iconProps = { theme: 'outline' as const, size: 16, strokeWidth: 4, fill: 'currentColor' as const };
