/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { ManagedAgent, ManagedAgentPayload, OrchestrationData } from '@/common/types/agent/managedAgent';
import { Button, Empty, Message, Modal, Spin, Tooltip } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { RobotOne } from '@icon-park/react';
import { HUB_PAGE_TITLE_CLASS } from '@/renderer/components/layout/HubPageShell';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AgentFormModal from './AgentFormModal';
import AgentOrchestrationGraph from './AgentOrchestrationGraph';
import { GanttChart } from '@/renderer/components/charts';
import { HeatmapChart } from '@/renderer/components/charts';
import type { AgentNodeData } from './AgentNodeComponent';

const AgentManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const [message, messageContext] = useArcoMessage();

  const [agents, setAgents] = useState<ManagedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState<ManagedAgent | null>(null);

  const [orchestration, setOrchestration] = useState<OrchestrationData | null>(null);
  const [orchLoading, setOrchLoading] = useState(false);
  const [registeredModels, setRegisteredModels] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'orchestration' | 'gantt' | 'heatmap'>('orchestration');

  const selectedAgent = useMemo(
    () => agents.find((a) => a.agent_id === selectedId) ?? null,
    [agents, selectedId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await ipcBridge.managedAgent.list.invoke();
      setAgents(list ?? []);
      // 初始化已注册模型状态
      const regMap: Record<string, string> = {};
      for (const a of (list ?? [])) {
        if (a.parent_id == null && a.registered_model_name) {
          regMap[a.agent_id] = a.registered_model_name;
        }
      }
      setRegisteredModels(regMap);
      if (list && list.length > 0 && !list.some((a) => a.agent_id === selectedId)) {
        setSelectedId(list[0].agent_id);
      }
    } catch (e) {
      message.error(t('agents.loadFailed', { defaultValue: '加载 Agent 列表失败' }));
      console.error('load agents failed', e);
    } finally {
      setLoading(false);
    }
  }, [selectedId, t, message]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrchestration = useCallback(
    async (agentId: string) => {
      setOrchLoading(true);
      try {
        const data = await ipcBridge.managedAgent.getOrchestration.invoke({ agent_id: agentId });
        setOrchestration(data ?? null);
      } catch (e) {
        console.error('load orchestration failed', e);
        setOrchestration(null);
      } finally {
        setOrchLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedId) {
      void loadOrchestration(selectedId);
    } else {
      setOrchestration(null);
    }
  }, [selectedId, loadOrchestration]);

  const openCreate = useCallback(() => {
    setEditingAgent(null);
    setFormVisible(true);
  }, []);

  const openEdit = useCallback((agent: ManagedAgent) => {
    setEditingAgent(agent);
    setFormVisible(true);
  }, []);

  const handleSubmit = useCallback(
    async (payload: ManagedAgentPayload) => {
      try {
        if (editingAgent) {
          await ipcBridge.managedAgent.update.invoke({ agent_id: editingAgent.agent_id, ...payload });
          message.success(t('agents.saveSuccess', { defaultValue: '已保存' }));
        } else {
          await ipcBridge.managedAgent.create.invoke(payload);
          message.success(t('agents.createSuccess', { defaultValue: 'Agent 已创建' }));
        }
        setFormVisible(false);
        await load();
        if (selectedId) {
          await loadOrchestration(selectedId);
        }
      } catch (e) {
        message.error(t('agents.saveFailed', { defaultValue: '保存失败' }));
        console.error('save agent failed', e);
        throw e;
      }
    },
    [editingAgent, selectedId, load, loadOrchestration, t, message]
  );

  const handleDelete = useCallback(
    (agent: ManagedAgent) => {
      Modal.confirm({
        title: t('agents.deleteTitle', { defaultValue: '删除 Agent' }),
        content: t('agents.deleteContent', {
          defaultValue: `确认删除「${agent.name}」？确认后将无法恢复。`,
        }),
        okText: t('agents.deleteOk', { defaultValue: '删除' }),
        cancelText: t('common.cancel', { defaultValue: '取消' }),
        okButtonProps: { status: 'danger' },
        onOk: async () => {
          try {
            await ipcBridge.managedAgent.remove.invoke({ agent_id: agent.agent_id });
            message.success(t('agents.deleteSuccess', { defaultValue: '已删除' }));
            setSelectedId(null);
            await load();
          } catch (e) {
            message.error(t('agents.deleteFailed', { defaultValue: '删除失败' }));
            console.error(e);
          }
        },
      });
    },
    [load, t, message]
  );

  const handleRegisterModel = useCallback(
    async (agent: ManagedAgent) => {
      const isRegistered = Boolean(registeredModels[agent.agent_id]);
      try {
        if (isRegistered) {
          await ipcBridge.managedAgent.unregisterModel.invoke({ agent_id: agent.agent_id });
          setRegisteredModels((prev) => {
            const next = { ...prev };
            delete next[agent.agent_id];
            return next;
          });
          message.success(t('agents.unregisterSuccess', { defaultValue: '已取消注册' }));
        } else {
          const result = await ipcBridge.managedAgent.registerAsModel.invoke({
            agent_id: agent.agent_id,
          });
          setRegisteredModels((prev) => ({
            ...prev,
            [agent.agent_id]: result.modelName ?? ('agent-' + agent.name),
          }));
          message.success(t('agents.registered', { defaultValue: '已注册为模型' }));
        }
      } catch (e) {
        message.error(isRegistered
          ? t('agents.unregisterFailed', { defaultValue: '取消注册失败' })
          : t('agents.registerFailed', { defaultValue: '注册失败' }));
        console.error(e);
      }
    },
    [registeredModels, t, message]
  );

  const handleEditNode = useCallback((nodeId: string, nodeData: AgentNodeData) => {
    const agent = agents.find((a) => a.agent_id === nodeId);
    if (agent) {
      setEditingAgent(agent);
      setFormVisible(true);
    }
  }, [agents]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    const agent = agents.find((a) => a.agent_id === nodeId);
    if (agent) {
      handleDelete(agent);
    }
  }, [agents, handleDelete]);

  return (
    <div className='box-border w-full min-h-full overflow-y-auto px-12px py-24px md:px-40px md:py-32px'>
      {messageContext}
      <div className='mx-auto flex w-full max-w-1200px box-border flex-col gap-16px'>
        <div className='flex w-full items-center justify-between gap-12px'>
          <div className='min-w-0 flex-1'>
            <h1 className={HUB_PAGE_TITLE_CLASS}>
              {t('agents.page.title', { defaultValue: 'Agent 管理' })}
            </h1>
            <p className='m-0 mt-6px text-13px leading-18px text-t-tertiary'>
              {t('agents.page.description', {
                defaultValue: '管理已配置的 Agent 主 Agent、模型、MCP 及 Skill 编排部署，支持拖拽编排、X6 图谱。',
              })}
            </p>
          </div>
          <Button type='primary' shape='round' icon={<IconPlus />} onClick={openCreate}>
            {t('agents.create', { defaultValue: '创建 Agent' })}
          </Button>
        </div>

        <div className='grid w-full gap-16px lg:grid-cols-[300px_minmax(0,1fr)]'>
          {/* 左侧：Agent 列表 */}
          <div className='flex flex-col gap-10px'>
            {loading ? (
              <div className='flex h-200px items-center justify-center rounded-12px border border-dashed border-[var(--color-border-2)] bg-fill-1'>
                <Spin />
              </div>
            ) : agents.length === 0 ? (
              <div className='flex h-200px items-center justify-center rounded-12px border border-dashed border-[var(--color-border-2)] bg-fill-1 [&_.arco-empty-image]:!text-56px'>
                <Empty description={t('agents.empty', { defaultValue: '暂无 Agent' })} />
              </div>
            ) : (
              agents.map((agent) => {
                const active = agent.agent_id === selectedId;
                return (
                  <div
                    key={agent.agent_id}
                    onClick={() => setSelectedId(agent.agent_id)}
                    className={`flex cursor-pointer items-center gap-10px rounded-12px border border-solid px-14px py-12px transition-colors ${
                      active
                        ? 'border-[var(--color-primary-6)] bg-primary-1'
                        : 'border-[var(--color-border-2)] bg-fill-1 hover:border-[var(--color-border-3)]'
                    }`}
                  >
                    <span className={`flex size-36px shrink-0 items-center justify-center rounded-10px ${active ? 'bg-primary-6 text-white' : 'bg-fill-2 text-t-secondary'}`}>
                      <RobotOne theme='outline' size='18' fill='currentColor' />
                    </span>
                    <div className='min-w-0 flex-1'>
                      <div className='truncate text-14px font-500 text-t-primary'>{agent.name}</div>
                      <div className='truncate text-12px text-t-tertiary'>
                        {agent.model || t('agents.noModel', { defaultValue: '未配置模型' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 右侧：详情 + 编排图 */}
          <div className='flex min-h-480px flex-col gap-16px'>
            {!selectedAgent ? (
              <div className='flex h-full min-h-300px items-center justify-center rounded-16px border border-dashed border-[var(--color-border-2)] bg-fill-1'>
                <Empty description={t('agents.selectHint', { defaultValue: '选择一个 Agent 查看详情' })} />
              </div>
            ) : (
              <>
                {/* 详情头部 */}
                <div className='flex items-center justify-between gap-12px rounded-12px border border-solid border-[var(--color-border-2)] bg-fill-1 px-16px py-14px'>
                  <div className='flex min-w-0 items-center gap-10px'>
                    <span className='flex size-40px shrink-0 items-center justify-center rounded-10px bg-primary-6 text-white'>
                      <RobotOne theme='outline' size='20' fill='currentColor' />
                    </span>
                    <div className='min-w-0'>
                      <div className='truncate text-16px font-600 text-t-primary'>{selectedAgent.name}</div>
                      <div className='truncate text-12px text-t-tertiary'>
                        {selectedAgent.description || t('agents.noDescription', { defaultValue: '暂无描述' })}
                      </div>
                    </div>
                  </div>
                  <div className='flex shrink-0 items-center gap-6px'>
                    <Tooltip content={t('agents.edit', { defaultValue: '编辑' })}>
                      <Button size='mini' onClick={() => openEdit(selectedAgent)}>
                        {t('agents.edit', { defaultValue: '编辑' })}
                      </Button>
                    </Tooltip>
                    <Tooltip content={t('agents.registerModel', { defaultValue: '注册为模型' })}>
                      <Button size='mini' onClick={() => void handleRegisterModel(selectedAgent)}>
                        {registeredModels[selectedAgent.agent_id]
                          ? t('agents.unregisterModel', { defaultValue: '取消注册' })
                          : t('agents.registerModel', { defaultValue: '注册模型' })}
                      </Button>
                    </Tooltip>
                    <Button size='mini' status='danger' onClick={() => handleDelete(selectedAgent)}>
                      {t('agents.delete', { defaultValue: '删除' })}
                    </Button>
                  </div>
                </div>

                {/* 图表 Tab 容器 */}
                <div className='rounded-12px border border-solid border-[var(--color-border-2)] bg-fill-1 p-16px'>
                  {/* Tab 导航 */}
                  <div className='mb-12px flex items-center justify-between'>
                    <div className='flex items-center gap-2px rounded-lg bg-white p-1 shadow-sm border border-[var(--color-border-2)]'>
                      {([
                        { key: 'orchestration', label: t('agents.orchestration', { defaultValue: '编排图谱' }) },
                        { key: 'gantt', label: t('agents.gantt', { defaultValue: '甘特图' }) },
                        { key: 'heatmap', label: t('agents.heatmap', { defaultValue: '活跃热力图' }) },
                      ] as const).map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: 12,
                            fontWeight: activeTab === tab.key ? 600 : 400,
                            background: activeTab === tab.key ? '#1677ff' : 'transparent',
                            color: activeTab === tab.key ? '#fff' : '#86909c',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <span className='text-12px text-t-tertiary'>
                      {t('agents.orchestrationHint', { defaultValue: '点击节点右键可编辑/删除' })}
                    </span>
                  </div>

                  {/* Tab 内容 */}
                  <div className='min-h-380px'>
                    {activeTab === 'orchestration' && (
                      orchLoading ? (
                        <div className='flex h-380px items-center justify-center'>
                          <Spin />
                        </div>
                      ) : (
                        <AgentOrchestrationGraph
                          data={orchestration ?? { nodes: [], edges: [] }}
                          editable
                          onEditNode={handleEditNode}
                          onDeleteNode={handleDeleteNode}
                        />
                      )
                    )}
                    {activeTab === 'gantt' && selectedAgent && (
                      <GanttChart tasks={[]} />
                    )}
                    {activeTab === 'heatmap' && selectedAgent && (
                      <HeatmapChart cells={[]} />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AgentFormModal
        visible={formVisible}
        editing={editingAgent}
        onSubmit={handleSubmit}
        onCancel={() => setFormVisible(false)}
      />
    </div>
  );
};

export default AgentManagementPage;
