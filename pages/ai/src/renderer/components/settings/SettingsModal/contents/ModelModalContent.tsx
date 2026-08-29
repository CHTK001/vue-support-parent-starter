/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IProvider, ModelTask } from '@/common/config/storage';
import type {
  ProviderModelCapabilityResponse,
  ProviderModelResponse,
} from '@/common/types/provider/providerModel';
import type { ProviderId } from '@/common/types/ids';
import { Button, Divider, Input, Message, Modal, Popconfirm, Popover, Switch, Tooltip } from '@arco-design/web-react';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import { DeleteFour, Info, Minus, Plus, Write, Heartbeat, Drag, LinkCloud, Search, Layers, Key, Right, Timer, Brain, Thunderbolt, Send, Download } from '@icon-park/react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { isBackendHttpError } from '@/common/adapter/httpBridge';
import {
  featureRoute,
  groupUsagesByFeature,
  parseProviderInUseDetails,
  type ProviderUsageFeature,
} from './providerInUse';
import AddModelModal from '@/renderer/pages/settings/components/AddModelModal';
import AddPlatformModal from '@/renderer/pages/settings/components/AddPlatformModal';
import ModelAdvancedEditor from '@/renderer/pages/settings/components/ModelAdvancedEditor';
import ProviderConnectionsSection from '@/renderer/pages/settings/components/ProviderConnectionsSection';
import EditModeModal from '@/renderer/pages/settings/components/EditModeModal';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import { useProvidersQuery } from '@/renderer/hooks/agent/useModelProviderList';
import { useContainerWidth } from '@/renderer/hooks/ui/useContainerWidth';
import { consumePendingDeepLink } from '@/renderer/hooks/system/useDeepLink';
import { isManagedModelProvider } from '@/common/types/provider/managedModelService';
import { providerGradientStyle, toneGradientStyle } from '@/renderer/utils/model/providerIdentity';
import { reorderById, reorderStrings } from './modelProviderOrdering';
import {
  capabilityInputFromResponse,
  type ProviderModelCapabilityInput,
} from '@/renderer/pages/settings/components/providerModelAdvanced';
import '../model-provider.css';

/**
 * Health probe entry for one model row. A single-task model stays one click;
 * multi-task models require an explicit task so the probe cannot silently
 * exercise only the first advertised modality.
 */
const ModelHealthCheckAction: React.FC<{
  tasks: readonly ModelTask[];
  loading: boolean;
  onCheck: (task: ModelTask) => Promise<void>;
}> = ({ tasks, loading, onCheck }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const label = t('settings.healthCheck');
  const buttonClass =
    '!w-28px !h-28px !min-w-28px !bg-[var(--color-bg-1)] text-t-secondary hover:text-t-primary hover:!bg-[var(--fill-0)]';

  if (tasks.length <= 1) {
    const task = tasks[0];
    return (
      <Tooltip content={label}>
        <Button
          size='mini'
          className={buttonClass}
          icon={<Heartbeat theme='outline' size='16' />}
          loading={loading}
          disabled={!task}
          aria-label={label}
          onClick={() => task && void onCheck(task)}
        />
      </Tooltip>
    );
  }

  return (
    <Popover
      trigger='click'
      position='bl'
      popupVisible={open}
      onVisibleChange={(visible) => {
        if (!loading) setOpen(visible);
      }}
      content={
        <div
          className='flex flex-col gap-4px min-w-180px'
          role='menu'
          aria-label={label}
          data-health-task-menu
          onClick={(event) => event.stopPropagation()}
        >
          <div className='px-8px pb-2px text-12px text-t-secondary'>
            {label} · {t('settings.modelModality', { defaultValue: '模态能力' })}
          </div>
          {tasks.map((task) => (
            <Button
              key={task}
              type='text'
              size='small'
              long
              role='menuitem'
              className='!justify-start'
              disabled={loading}
              data-health-task={task}
              onClick={() => {
                setOpen(false);
                void onCheck(task);
              }}
            >
              {t(`settings.modelTask.${task}`, { defaultValue: task })}
            </Button>
          ))}
        </div>
      }
    >
      <Tooltip content={label}>
        <Button
          size='mini'
          className={buttonClass}
          icon={<Heartbeat theme='outline' size='16' />}
          loading={loading}
          aria-label={label}
          aria-haspopup='menu'
          aria-expanded={open}
        />
      </Tooltip>
    </Popover>
  );
};

/** One badge reflects one persisted task capability, never the row aggregate. */
const CapabilityHealthTag: React.FC<{ capability: ProviderModelCapabilityResponse }> = ({ capability }) => {
  const { t } = useTranslation();
  const capabilityHealth = capability.health;
  const status = capabilityHealth?.status ?? 'unknown';
  const statusClass = status === 'healthy' ? 'healthy' : status === 'unhealthy' ? 'unhealthy' : '';

  return (
    <Tooltip
      content={
        <div className='health-tooltip' data-capability-health-tooltip={capability.task}>
          <div className='health-tooltip-title'>
            {t(`settings.modelTask.${capability.task}`, { defaultValue: capability.task })}:{' '}
            {status === 'healthy'
              ? t('common.success')
              : status === 'unhealthy'
                ? t('common.failed')
                : t('settings.healthNotChecked', { defaultValue: 'Not checked' })}
          </div>
          {capabilityHealth?.latency !== undefined && (
            <div className='health-tooltip-detail mt-4px'>
              {t('settings.latency')}: {capabilityHealth.latency}ms
            </div>
          )}
          {capabilityHealth?.error && <div className='health-tooltip-detail mt-4px'>{capabilityHealth.error}</div>}
          {capability.health_checked_at !== undefined && (
            <div className='health-tooltip-detail mt-4px'>
              {t('mcp.lastCheck')}: {new Date(capability.health_checked_at).toLocaleString()}
            </div>
          )}
        </div>
      }
    >
      <span
        role='status'
        className={`mh-tag ${statusClass || 'unknown'}`}
        data-capability-health-task={capability.task}
        data-capability-health-status={status}
      >
        <span className='dot' aria-hidden='true' />
        {t(`settings.modelTask.${capability.task}`, { defaultValue: capability.task })}
      </span>
    </Tooltip>
  );
};

/** ProviderResponse.models is the only authoritative model collection. */
const modelRowsFor = (platform: IProvider): ProviderModelResponse[] => platform.models;

/** Row-level partial update body minus the composite key. */
type ModelRowPatch = Partial<Pick<ProviderModelResponse, 'enabled' | 'sort_order'>> & {
  description?: string | null;
  mapping_name?: string | null;
};

/** Apply a tri-state row patch to the cached row for optimistic rendering. */
const applyRowPatch = (row: ProviderModelResponse, patch: ModelRowPatch): ProviderModelResponse => ({
  ...row,
  ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
  ...(patch.sort_order !== undefined ? { sort_order: patch.sort_order } : {}),
  ...('description' in patch ? { description: patch.description ?? undefined } : {}),
  ...('mapping_name' in patch ? { mapping_name: patch.mapping_name ?? undefined } : {}),
});

const providerModelInputFor = (row: ProviderModelResponse) => ({
  model: row.model,
  enabled: row.enabled,
  sort_order: row.sort_order,
  ...(row.description ? { description: row.description } : {}),
  ...(row.mapping_name ? { mapping_name: row.mapping_name } : {}),
  capabilities: row.capabilities.map(capabilityInputFromResponse),
});

/**
 * 每模型描述编辑浮层 / Per-model description editor popover.
 * 描述用于智能协作自动选择模型；空态显示占位提示。
 * The description drives automatic model selection for collaboration.
 */
const ModelDescriptionEditor: React.FC<{
  description: string;
  onSave: (text: string) => void;
}> = ({ description, onSave }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(description);

  const placeholder = t('settings.modelDescriptionPlaceholder', {
    defaultValue: '描述该模型擅长什么，用于协作任务自动选择',
  });

  // 每次打开时同步最新描述，避免外部更新后草稿陈旧
  // Re-sync draft when opening so external updates aren't masked by stale draft.
  const handleVisibleChange = (visible: boolean) => {
    if (visible) setDraft(description);
    setOpen(visible);
  };

  const handleSave = () => {
    const next = draft.trim();
    if (next !== (description ?? '').trim()) {
      onSave(next);
    }
    setOpen(false);
  };

  return (
    <Popover
      trigger='click'
      position='bl'
      popupVisible={open}
      onVisibleChange={handleVisibleChange}
      content={
        <div className='flex flex-col gap-8px w-280px' onClick={(e) => e.stopPropagation()}>
          <div className='text-12px text-t-secondary'>
            {t('settings.modelDescriptionTitle', { defaultValue: '模型描述（用于智能协作）' })}
          </div>
          <Input.TextArea
            autoFocus
            value={draft}
            onChange={setDraft}
            placeholder={placeholder}
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
          <div className='flex items-center justify-end gap-8px'>
            <Button size='mini' onClick={() => setOpen(false)}>
              {t('common.cancel', { defaultValue: '取消' })}
            </Button>
            <Button size='mini' type='primary' onClick={handleSave}>
              {t('common.save', { defaultValue: '保存' })}
            </Button>
          </div>
        </div>
      }
    >
      <Tooltip content={t('settings.editModelDescription', { defaultValue: '编辑模型描述' })}>
        <Button
          size='mini'
          className={`model-provider-action-btn !w-24px !h-24px !min-w-24px shrink-0 ${description ? 'text-primary-6 hover:text-primary-5' : 'text-t-secondary hover:text-t-primary'}`}
          icon={<Write theme='outline' size='14' />}
          onClick={(e) => e.stopPropagation()}
        />
      </Tooltip>
    </Popover>
  );
};

const providerSortableId = (providerId: ProviderId) => `provider:${providerId}`;
const modelSortableId = (providerId: ProviderId, model: string) => `model:${providerId}:${model}`;

type SortableDragData =
  | { type: 'provider'; providerId: ProviderId }
  | { type: 'model'; providerId: ProviderId; model: string };

type SortableRenderProps = {
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
  setActivatorNodeRef: ReturnType<typeof useSortable>['setActivatorNodeRef'];
  isDragging: boolean;
};

const SortableProviderCard: React.FC<{
  provider: IProvider;
  children: (props: SortableRenderProps) => React.ReactNode;
}> = ({ provider, children }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: providerSortableId(provider.id),
    data: { type: 'provider', providerId: provider.id } satisfies SortableDragData,
  });

  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'model-provider-sortable-card is-dragging' : 'model-provider-sortable-card'}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {children({ attributes, listeners, setActivatorNodeRef, isDragging })}
    </div>
  );
};

const SortableModelRow: React.FC<{
  providerId: ProviderId;
  model: string;
  children: (props: SortableRenderProps) => React.ReactNode;
}> = ({ providerId, model, children }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: modelSortableId(providerId, model),
    data: { type: 'model', providerId, model } satisfies SortableDragData,
  });

  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'model-provider-sortable-row is-dragging' : 'model-provider-sortable-row'}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {children({ attributes, listeners, setActivatorNodeRef, isDragging })}
    </div>
  );
};

const PriorityDragHandle: React.FC<SortableRenderProps & { label: string }> = ({
  attributes,
  listeners,
  setActivatorNodeRef,
  isDragging,
  label,
}) => (
  <Tooltip content={label}>
    <span
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={label}
      className={`model-provider-drag-handle inline-flex shrink-0 transition-all duration-200 ${isDragging ? 'is-dragging scale-110' : 'hover:scale-110'}`}
      style={{ touchAction: 'none' }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Button
        tabIndex={-1}
        size='mini'
        className='model-provider-action-btn !w-24px !h-24px !min-w-24px text-t-tertiary hover:text-t-primary cursor-grab hover:bg-[var(--fill-0)]'
        icon={<Drag theme='outline' size='14' />}
      />
    </span>
  </Tooltip>
);

const ModelModalContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // 以「内容面板实际宽度」而非视口宽度做分档：模型管理面板被一次 rail + 二级
  // ContentSider 占去宽度，视口断点(md:/lg:)会误判为宽屏。窄面板下用紧凑布局，
  // 避免 provider 头 hover 展开区(320px)挤占供应商名称。
  const { ref: paneRef, width: paneWidth } = useContainerWidth<HTMLDivElement>();
  const isWide = paneWidth >= 520;
  const [collapseKey, setCollapseKey] = useState<Record<string, boolean>>({});
  const [healthCheckLoading, setHealthCheckLoading] = useState<Record<string, boolean>>({});
  const { data, mutate, isLoading: providersLoading } = useProvidersQuery();
  // Managed providers have dedicated pages. Keeping them out of generic CRUD
  // prevents exposing or accidentally overwriting their internal endpoint and
  // per-boot credential.
  const editableProviders = useMemo(() => (data ?? []).filter((provider) => !isManagedModelProvider(provider)), [data]);
  const [message, messageContext] = useArcoMessage();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const providerSortableItems = useMemo(
    () => editableProviders.map((platform) => providerSortableId(platform.id)),
    [editableProviders]
  );

  // 供应商搜索过滤（名称 / 平台标识）
  const [providerSearch, setProviderSearch] = useState('');
  const filteredProviders = useMemo(() => {
    const q = providerSearch.trim().toLowerCase();
    if (!q) return editableProviders;
    return editableProviders.filter(
      (p) => p.name.toLowerCase().includes(q) || p.platform.toLowerCase().includes(q)
    );
  }, [editableProviders, providerSearch]);
  const filteredSortableItems = useMemo(
    () => filteredProviders.map((platform) => providerSortableId(platform.id)),
    [filteredProviders]
  );

  // 页面统计概览：供应商 / 模型 / 已配凭证 / 健康模型
  const pageStats = useMemo(() => {
    let totalModels = 0;
    let withCreds = 0;
    let healthy = 0;
    for (const p of editableProviders) {
      const rows = modelRowsFor(p);
      totalModels += rows.length;
      if (p.has_credentials) withCreds += 1;
      healthy += rows.filter((row) => row.capabilities.some((c) => c.health?.status === 'healthy')).length;
    }
    return { providers: editableProviders.length, totalModels, withCreds, healthy };
  }, [editableProviders]);

  /**
   * 行级模型更新：统一走 providerModel.save 全量模型聚合写。
   * Every model write is a full canonical upsert. Capability omission is a
   * deletion, so even metadata edits resend the complete visible capability set.
   */
  const updateModelRow = (
    platform: IProvider,
    row: ProviderModelResponse,
    patch: ModelRowPatch,
    rethrow = false
  ): Promise<void> => {
    const nextRow = applyRowPatch(row, patch);
    if (data) {
      const nextArray = data.map((item) =>
        item.id === platform.id
          ? {
              ...item,
              models: item.models.map((candidate) => (candidate.model === row.model ? nextRow : candidate)),
            }
          : item
      );
      void mutate(nextArray, false);
    }
    return ipcBridge.providerModel.save
      .invoke({ provider_id: platform.id, model: providerModelInputFor(nextRow) })
      .then(() => {
        void mutate();
      })
      .catch((error) => {
        void mutate();
        console.error('Failed to update model row:', error);
        message.error(t('settings.saveModelConfigFailed'));
        if (rethrow) throw error;
      });
  };

const updateModelCapabilities = async (
  platform: IProvider,
  row: ProviderModelResponse,
  capabilities: ProviderModelCapabilityInput[],
  newModelId?: string
): Promise<void> => {
  try {
    // 模型 ID 变更：先用服务端原子 rename（复制新 ID + 删除旧 ID），
    // 再对目标 ID 保存完整能力集，避免旧 ID 残留或覆盖。
    const targetModel = newModelId && newModelId !== row.model ? newModelId : row.model;
    if (targetModel !== row.model) {
      await ipcBridge.providerModel.rename.invoke({
        provider_id: platform.id,
        model: row.model,
        new_model: targetModel,
      });
    }
    await ipcBridge.providerModel.save.invoke({
      provider_id: platform.id,
      model: {
        ...providerModelInputFor(row),
        model: targetModel,
        capabilities,
      },
    });
    await mutate();
  } catch (error) {
    console.error('Failed to save model capabilities:', error);
    message.error(t('settings.saveModelConfigFailed'));
    throw error;
  }
};

  /** Delete one canonical model aggregate. */
  const removeModel = (platform: IProvider, model: string) => {
    if (data) {
      const nextArray = data.map((item) =>
        item.id === platform.id
          ? {
              ...item,
              models: item.models.filter((row) => row.model !== model),
            }
          : item
      );
      void mutate(nextArray, false);
    }
    ipcBridge.providerModel.remove
      .invoke({ provider_id: platform.id, model })
      .then(() => {
        void mutate();
      })
      .catch((error) => {
        void mutate();
        console.error('Failed to delete model:', error);
        message.error(t('settings.saveModelConfigFailed'));
      });
  };

  const removePlatform = (id: ProviderId) => {
    const nextArray = (data ?? []).filter((item: IProvider) => item.id !== id);
    void mutate(nextArray, false);
    ipcBridge.mode.deleteProvider
      .invoke({ provider_id: id })
      .then(() => {
        void mutate();
      })
      .catch((error) => {
        void mutate();
        console.error('Failed to delete provider:', error);
        if (isBackendHttpError(error) && error.code === 'PROVIDER_IN_USE') {
          const groups = groupUsagesByFeature(parseProviderInUseDetails(error.details));
          const featureName: Record<ProviderUsageFeature, string> = {
            desktopCompanion: t('settings.providerInUse.desktopCompanion'),
            customerService: t('settings.providerInUse.customerService'),
            conversation: t('settings.providerInUse.conversation'),
            agentExecution: t('settings.providerInUse.agentExecution'),
          };
          Modal.confirm({
            title: t('settings.providerInUse.title'),
            content: (
              <div className='flex flex-col gap-8px'>
                <div>{t('settings.providerInUse.desc')}</div>
                {groups.map((g) => (
                  <div key={g.feature}>
                    <b>{featureName[g.feature]}</b>：{g.labels.join('、')}
                  </div>
                ))}
              </div>
            ),
            okText: t('settings.providerInUse.goto'),
            cancelText: t('common.cancel', { defaultValue: '取消' }),
            onOk: () => {
              const first = groups[0];
              if (first) navigate(featureRoute(first.feature, first.targetId));
            },
          });
          return;
        }
        message.error(t('settings.saveModelConfigFailed'));
      });
  };

  const persistProviderOrder = async (nextArray: IProvider[], previousArray: IProvider[]) => {
    const previousById = new Map(previousArray.map((item) => [item.id, item.sort_order]));
    const changed = nextArray.filter((item) => previousById.get(item.id) !== item.sort_order);

    if (changed.length === 0) return;

    await Promise.all(
      changed.map((platform) =>
        ipcBridge.mode.updateProvider.invoke({
          provider_id: platform.id,
          sort_order: platform.sort_order,
        })
      )
    );
  };

  const handleProviderDragEnd = (activeData: SortableDragData, overData: SortableDragData) => {
    if (!data || activeData.type !== 'provider' || overData.type !== 'provider') return;

    const reordered = reorderById(editableProviders, activeData.providerId, overData.providerId);
    if (reordered === editableProviders) return;

    // Preserve every managed provider's full-list slot. Refill only editable
    // slots and assign their full-list position as sort_order, avoiding a
    // duplicate sort_order with a managed row (whose CRUD is protected).
    let editableIndex = 0;
    const nextArray = data.map((item, fullIndex) => {
      if (isManagedModelProvider(item)) return item;
      return { ...reordered[editableIndex++], sort_order: fullIndex };
    });
    const reorderedWithOrder = nextArray.filter((item) => !isManagedModelProvider(item));
    void mutate(nextArray, false);

    persistProviderOrder(reorderedWithOrder, editableProviders)
      .then(() => {
        void mutate();
      })
      .catch((error) => {
        void mutate();
        console.error('Failed to save provider order:', error);
        message.error(t('settings.saveModelConfigFailed'));
      });
  };

  /**
   * 模型排序：对受影响的行逐条全量 providerModel.save。
   * Model reorder persists full canonical rows with the new sort order.
   */
  const handleModelDragEnd = (activeData: SortableDragData, overData: SortableDragData) => {
    if (activeData.type !== 'model' || overData.type !== 'model' || activeData.providerId !== overData.providerId) {
      return;
    }

    const platform = (data || []).find((item) => item.id === activeData.providerId);
    if (!platform) return;

    const rows = modelRowsFor(platform);
    const names = rows.map((row) => row.model);
    const nextNames = reorderStrings(names, activeData.model, overData.model);
    if (nextNames === names) return;

    const rowByModel = new Map(rows.map((row) => [row.model, row]));
    const nextRows = nextNames.map((name, index) => ({ ...rowByModel.get(name)!, sort_order: index }));
    const changed = nextRows.filter((row) => rowByModel.get(row.model)!.sort_order !== row.sort_order);

    if (data) {
      const nextArray = data.map((item) =>
        item.id === platform.id
          ? {
              ...item,
              models: nextRows,
            }
          : item
      );
      void mutate(nextArray, false);
    }

    Promise.all(
      changed.map((row) =>
        ipcBridge.providerModel.save.invoke({
          provider_id: platform.id,
          model: providerModelInputFor(row),
        })
      )
    )
      .then(() => {
        void mutate();
      })
      .catch((error) => {
        void mutate();
        console.error('Failed to save model order:', error);
        message.error(t('settings.saveModelConfigFailed'));
      });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;

    const activeData = active.data.current as SortableDragData | undefined;
    const overData = over.data.current as SortableDragData | undefined;
    if (!activeData || !overData || activeData.type !== overData.type) return;

    if (activeData.type === 'provider') {
      handleProviderDragEnd(activeData, overData);
    } else {
      handleModelDragEnd(activeData, overData);
    }
  };

  /**
   * 服务端整组克隆：`POST /api/providers/{id}/clone` 连模型档案与连接档案一起复制。
   * 副本名走本地化后缀（`settings.providerCopySuffix`），由 FE 随 body 传给克隆端点。
   * Server-side provider clone (models + connections copied atomically); the
   * copy's display name carries a localized suffix supplied by the frontend.
   */
  const duplicatePlatform = (platform: IProvider) => {
    ipcBridge.mode.cloneProvider
      .invoke({
        provider_id: platform.id,
        name: `${platform.name} ${t('settings.providerCopySuffix', { defaultValue: '副本' })}`,
      })
      .then((copied) => {
        void mutate();
        setCollapseKey((prev) => ({ ...prev, [copied.id]: true }));
        message.success(t('settings.providerConfigCopied', { name: copied.name }));
      })
      .catch((error) => {
        console.error('Failed to clone provider:', error);
        message.error(t('settings.saveModelConfigFailed'));
      });
  };

  // 供应商启用开关只写 provider.enabled，不批量改变各模型的启用状态。
  // Provider enable switch writes provider.enabled itself.
  const toggleProviderEnabled = (platform: IProvider) => {
    const enabled = platform.enabled === false;
    if (data) {
      void mutate(
        data.map((item) => (item.id === platform.id ? { ...item, enabled } : item)),
        false
      );
    }
    ipcBridge.mode.updateProvider
      .invoke({ provider_id: platform.id, enabled })
      .then(() => {
        void mutate();
      })
      .catch((error) => {
        void mutate();
        console.error('Failed to update provider enabled state:', error);
        message.error(t('settings.saveModelConfigFailed'));
      });
  };

  // Execute provider/model health check without creating a conversation.
  const performHealthCheck = async (platform: IProvider, modelName: string, task: ModelTask) => {
    const loadingKey = `${platform.id}-${modelName}`;
    setHealthCheckLoading((prev) => ({ ...prev, [loadingKey]: true }));

    const startTime = Date.now();

    try {
      const result = await ipcBridge.agentConversation.checkProviderHealth.invoke({
        provider_id: platform.id,
        model: modelName,
        task,
      });
      const latency = result.elapsed_ms || Date.now() - startTime;
      const success = result.status === 'healthy';
      const errorMessage = result.message || t('common.unknownError');

      // The server persists the task capability result; refresh the projection.
      await mutate();
      if (success) {
        Message.success({
          content: `${platform.name} - ${modelName}: ${t('common.success')} (${latency}ms)`,
          duration: 3000,
        });
      } else {
        Message.error({
          content: `${platform.name} - ${modelName}: ${t('common.failed')} - ${errorMessage}`,
          duration: 5000,
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Message.error({
        content: `${platform.name} - ${modelName}: ${t('common.failed')} - ${errorMessage}`,
        duration: 5000,
      });
      // The probe request itself failed (transport error). Refresh anyway in
      // case the server recorded a row-level result before the failure.
      await mutate().catch(() => undefined);
    } finally {
      setHealthCheckLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const [addPlatformModalCtrl, addPlatformModalContext] = AddPlatformModal.useModal({
    onSubmit(platform) {
      setCollapseKey((prev) => ({ ...prev, [platform.id]: true }));
      void mutate();
    },
  });

  // Consume pending deep-link data on mount (set by useDeepLink hook before navigation)
  useEffect(() => {
    const pending = consumePendingDeepLink();
    if (pending) {
      addPlatformModalCtrl.open({ deepLinkData: pending });
    }
  }, [addPlatformModalCtrl]);

  const [addModelModalCtrl, addModelModalContext] = AddModelModal.useModal({
    onSubmit(platform) {
      setCollapseKey((prev) => ({ ...prev, [platform.id]: true }));
      void mutate();
    },
  });

  const [editModalCtrl, editModalContext] = EditModeModal.useModal({
    async onChange(patch) {
      const { id, credentials, ...publicPatch } = patch;
      if (data) {
        void mutate(
          data.map((provider) =>
            provider.id === id
              ? {
                  ...provider,
                  ...publicPatch,
                  has_credentials:
                    credentials === undefined
                      ? provider.has_credentials
                      : Object.keys(credentials).length > 0,
                }
              : provider
          ),
          false
        );
      }
      try {
        await ipcBridge.mode.updateProvider.invoke({
          provider_id: id,
          ...publicPatch,
          ...(credentials === undefined ? {} : { credentials }),
        });
        await mutate();
      } catch (error) {
        void mutate();
        console.error('Failed to save provider:', error);
        message.error(t('settings.saveModelConfigFailed'));
        throw error;
      }
    },
  });

  return (
    <div
      ref={paneRef}
      className={`flex flex-col py-20px ${isWide ? 'px-24px' : 'px-16px'}`}
    >
      {messageContext}
      {addPlatformModalContext}
      {editModalContext}
      {addModelModalContext}

      {/* Header with Add Button */}
      <div className='flex-shrink-0 border-b border-b-solid border-[var(--color-border-2)] pb-14px mb-16px flex flex-col gap-12px'>
        <div className='flex items-center justify-between gap-12px flex-wrap'>
          <div className='flex items-center gap-12px min-w-0'>
            <span className='mh-page-icon'>
              <LinkCloud theme='outline' size='20' strokeWidth={3} />
            </span>
            <div className='min-w-0'>
              <h2 className='mh-page-title'>{t('settings.modelHub.provider.title')}</h2>
              <p className='mh-page-subtitle'>{t('settings.modelHub.provider.subtitle')}</p>
            </div>
          </div>
          <div className='flex items-center gap-8px flex-wrap'>
            <Button
              type='primary'
              shape='round'
              icon={<Plus size='15' />}
              onClick={() => addPlatformModalCtrl.open()}
              className='h-34px px-16px rd-100px font-500'
            >
              {t('settings.addModel')}
            </Button>
          </div>
        </div>
        <div className='flex items-start gap-6px text-12px leading-18px text-t-tertiary'>
          <Info theme='outline' size='14' className='shrink-0 mt-2px' />
          <span className='min-w-0'>
            {t('settings.modelHub.provider.noticeTitle')} · {t('settings.modelHub.provider.note')}
          </span>
        </div>
        {/* 职责收窄：本页只管接入与凭证；「按用途找模型」已迁到模态分区。 */}
        <div className='-mt-6px pl-20px text-12px leading-18px text-t-tertiary'>
          {t('settings.modelHub.provider.scopeNote')}
        </div>

        {/* 统计概览 / Stats overview */}
        <div className='grid grid-cols-4 gap-12px mt-4px'>
          <div className='mh-stat'>
            <span className='mh-stat-icon' style={toneGradientStyle('violet')}>
              <LinkCloud theme='outline' size='15' fill='#fff' />
            </span>
            <div className='min-w-0'>
              <div className='mh-stat-value'>{pageStats.providers}</div>
              <div className='mh-stat-label'>
                {t('settings.modelHub.provider.statProviders', { defaultValue: '供应商' })}
              </div>
            </div>
          </div>
          <div className='mh-stat'>
            <span className='mh-stat-icon' style={toneGradientStyle('sky')}>
              <Layers theme='outline' size='15' fill='#fff' />
            </span>
            <div className='min-w-0'>
              <div className='mh-stat-value'>{pageStats.totalModels}</div>
              <div className='mh-stat-label'>
                {t('settings.modelHub.provider.statModels', { defaultValue: '模型总数' })}
              </div>
            </div>
          </div>
          <div className='mh-stat'>
            <span className='mh-stat-icon' style={toneGradientStyle('amber')}>
              <Key theme='outline' size='15' fill='#fff' />
            </span>
            <div className='min-w-0'>
              <div className='mh-stat-value'>{pageStats.withCreds}</div>
              <div className='mh-stat-label'>
                {t('settings.modelHub.provider.statCredentials', { defaultValue: '已配凭证' })}
              </div>
            </div>
          </div>
          <div className='mh-stat'>
            <span className='mh-stat-icon' style={toneGradientStyle('emerald')}>
              <Heartbeat theme='outline' size='15' fill='#fff' />
            </span>
            <div className='min-w-0'>
              <div className='mh-stat-value mh-stat-ok'>{pageStats.healthy}</div>
              <div className='mh-stat-label'>
                {t('settings.modelHub.provider.statHealthy', { defaultValue: '健康模型' })}
              </div>
            </div>
          </div>
        </div>

        {/* 工具栏：搜索过滤 / Toolbar: search filter */}
        <div className='flex items-center gap-10px mt-2px'>
          <Input
            value={providerSearch}
            onChange={setProviderSearch}
            allowClear
            size='small'
            className='mh-search !w-full !max-w-420px'
            prefix={<Search theme='outline' size='14' strokeWidth={3} />}
            placeholder={t('settings.modelHub.provider.searchPlaceholder', {
              defaultValue: '搜索供应商名称或平台…',
            })}
          />
          {!providersLoading && (
            <span className='text-12px text-t-tertiary'>
              {providerSearch.trim()
                ? t('settings.modelHub.provider.filteredCount', {
                    defaultValue: '{{shown}} / {{total}} 家供应商',
                    shown: filteredProviders.length,
                    total: editableProviders.length,
                  })
                : t('settings.modelHub.provider.totalCount', {
                    defaultValue: '共 {{total}} 家',
                    total: editableProviders.length,
                  })}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <NomiScrollArea className='flex-1 min-h-0' disableOverflow>
        {providersLoading ? (
          <div className='flex flex-col gap-12px'>
            {[0, 1, 2].map((i) => (
              <div key={i} className='mh-skeleton'>
                <div className='flex items-center gap-10px'>
                  <div className='mh-skeleton-line !w-28px !h-28px !rounded-8px' />
                  <div className='mh-skeleton-line !w-160px' />
                  <div className='mh-skeleton-line !w-40px !h-20px !rounded-full' />
                  <div className='flex-1' />
                  <div className='mh-skeleton-line !w-120px' />
                </div>
              </div>
            ))}
          </div>
        ) : !data || editableProviders.length === 0 ? (
          <div className='empty-state-container'>
            <Info theme='outline' size='48' className='empty-state-icon mb-16px' />
            <h3 className='empty-state-title'>{t('settings.noConfiguredModels')}</h3>
            <p className='empty-state-description'>
              {t('settings.needHelpConfigGuide')}
              <a
                href='https://github.com/nomifun/nomifun-app/wiki/LLM-Configuration'
                target='_blank'
                rel='noopener noreferrer'
                className='empty-state-link ml-4px'
              >
                {t('settings.configGuide')}
              </a>
              {t('settings.configGuideSuffix')}
            </p>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className='empty-state-container !py-40px'>
            <Search theme='outline' size='36' className='empty-state-icon mb-12px' />
            <h3 className='empty-state-title'>
              {t('settings.modelHub.provider.noMatch', { defaultValue: '没有匹配的供应商' })}
            </h3>
            <p className='empty-state-description'>
              {t('settings.modelHub.provider.noMatchHint', {
                defaultValue: '试试其他关键词，或清空搜索查看全部供应商。',
              })}
            </p>
          </div>
         ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredSortableItems} strategy={verticalListSortingStrategy}>
              <div className='flex flex-col gap-20px'>
            {filteredProviders.map((platform: IProvider) => {
              const key = platform.id;
              const modelRows = modelRowsFor(platform);
              const isOpen = collapseKey[platform.id] ?? false;
              return (
                <SortableProviderCard key={key} provider={platform}>
                  {({ attributes, listeners, setActivatorNodeRef, isDragging }) => (
                <section className={`mh-group ${isDragging ? 'is-dragging' : ''} ${isOpen ? 'is-open' : ''} ${platform.enabled === false ? 'is-off' : ''}`}>
                  {/* Provider head — card header, click to expand */}
                  <header
                    className='mh-group-header'
                    onClick={() => setCollapseKey((prev) => ({ ...prev, [platform.id]: !isOpen }))}
                  >
                    <span className={`provider-chevron ${isOpen ? 'is-open' : ''}`} aria-hidden='true'>
                      <Right theme='outline' size='13' strokeWidth={3} />
                    </span>
                    <PriorityDragHandle
                      attributes={attributes}
                      listeners={listeners}
                      setActivatorNodeRef={setActivatorNodeRef}
                      isDragging={isDragging}
                      label={t('settings.dragProviderPriority', { defaultValue: '拖拽调整供应商优先级' })}
                    />
                    {platform.icon_url ? (
                      <img
                        src={platform.icon_url}
                        alt={platform.name}
                        className='mh-avatar provider-avatar-img'
                        loading='lazy'
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span
                        className='mh-avatar text-white shadow-sm'
                        style={providerGradientStyle(platform.name)}
                        aria-hidden='true'
                      >
                        {platform.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className='text-14px font-600 text-t-primary truncate min-w-0'>{platform.name}</span>
                    <span className='mh-chip'>{platform.platform}</span>
                    {platform.enabled === false && (
                      <span className='mh-tag unknown mh-tag-sm' data-provider-off>
                        {t('settings.modelHub.modality.modelDisabled', { defaultValue: '停用' })}
                      </span>
                    )}
                    <span className='mh-pill'>{modelRows.length}</span>

                    <div
                      className='provider-tools'
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Tooltip content={t('settings.addModel', { defaultValue: '添加模型' })}>
                        <Button
                          size='mini'
                          className='model-provider-action-btn mh-act-add !w-26px !h-26px !min-w-26px'
                          icon={<Plus size='13' />}
                          onClick={() => addModelModalCtrl.open({ data: platform })}
                        />
                      </Tooltip>
                      <Tooltip content={t('settings.editProvider', { defaultValue: '编辑供应商' })}>
                        <Button
                          size='mini'
                          className='model-provider-action-btn mh-act-edit !w-26px !h-26px !min-w-26px'
                          icon={<Write size='13' />}
                          onClick={() => editModalCtrl.open({ data: platform })}
                        />
                      </Tooltip>
                      <Popconfirm
                        title={t('settings.deleteAllModelConfirm')}
                        onOk={() => removePlatform(platform.id)}
                      >
                        <Button
                          size='mini'
                          className='model-provider-action-btn mh-act-del !w-26px !h-26px !min-w-26px'
                          icon={<Minus size='13' />}
                        />
                      </Popconfirm>
                      <Switch
                        size='small'
                        className='provider-switch'
                        checked={platform.enabled !== false}
                        onChange={() => toggleProviderEnabled(platform)}
                      />
                    </div>
                  </header>

                  {/* Body — collapsed by default, expands on click */}
                  {isOpen && (
                    <div className='provider-body'>
                  {/* Model rows — flat, aligned, scannable */}
                  {modelRows.length > 0 ? (
                    <SortableContext
                      items={modelRows.map((row) => modelSortableId(platform.id, row.model))}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className='provider-model-list'>
                       {modelRows.map((row: ProviderModelResponse) => {
                         const model = row.model;
                         const latency = (row.metrics?.latency_ms ?? row.metrics?.probe_latency_ms) as number | undefined;
                         const latencySec = row.metrics?.latency_first_token_seconds as number | undefined;
                         const intelligence = (row.metrics?.intelligence_index ?? row.metrics?.intelligence) as number | undefined;
                         const outputSpeed = (row.metrics?.output_speed_tps ?? row.metrics?.output_speed) as number | undefined;
                         const inputPrice = row.metrics?.price_input_per_musd as number | undefined;
                         const outputPrice = row.metrics?.price_output_per_musd as number | undefined;
                         const unhealthyCapability = row.capabilities.find(
                          (capability) => capability.health?.status === 'unhealthy'
                        );
                        const checkedCapability =
                          unhealthyCapability ?? row.capabilities.find((capability) => capability.health);
                        const aggregateCapabilityHealth = checkedCapability?.health;
                        const healthStatus = aggregateCapabilityHealth?.status || 'unknown';
                        const modelDescription = row.description ?? '';
                         const healthTasks = row.capabilities.map((capability) => capability.task);


                        return (
                          <SortableModelRow key={model} providerId={platform.id} model={model}>
                            {({
                              attributes: modelAttributes,
                              listeners: modelListeners,
                              setActivatorNodeRef: setModelActivatorNodeRef,
                              isDragging: modelIsDragging,
                            }) => (
                           <div className={`model-row ${modelIsDragging ? 'is-dragging' : ''} ${!row.enabled ? 'is-off' : ''}`}>
                             {/* Drag handle */}
                             <PriorityDragHandle
                               attributes={modelAttributes}
                               listeners={modelListeners}
                               setActivatorNodeRef={setModelActivatorNodeRef}
                               isDragging={modelIsDragging}
                               label={t('settings.dragModelPriority', { defaultValue: '拖拽调整优先级' })}
                             />
                             {/* Status */}
                             <span className={`model-status ${healthStatus}`}>
                              {healthStatus !== 'unknown' && (
                                <Tooltip
                                  content={
                                    <div className='health-tooltip'>
                                      <div className='health-tooltip-title'>
                                        {healthStatus === 'healthy' ? t('common.success') : t('common.failed')}
                                      </div>
                                      {aggregateCapabilityHealth?.latency != null && (
                                        <div className='health-tooltip-detail'>{aggregateCapabilityHealth.latency}ms</div>
                                      )}
                                      {aggregateCapabilityHealth?.error && (
                                        <div className='health-tooltip-detail'>{aggregateCapabilityHealth.error}</div>
                                      )}
                                    </div>
                                  }
                                >
                                  <i className='health-dot' />
                                </Tooltip>
                              )}
                            </span>

                              {/* Identity: name + inline description */}
                              <div className='model-id'>
                               {row.icon_url ? (
                                 <img
                                   src={row.icon_url}
                                   alt=''
                                   className='model-icon-img'
                                   loading='lazy'
                                   aria-hidden='true'
                                   onError={(e) => {
                                     (e.target as HTMLImageElement).style.display = 'none';
                                   }}
                                 />
                               ) : (
                                 <span className='model-icon-fallback' aria-hidden='true'>
                                   {model.slice(0, 1).toUpperCase()}
                                 </span>
                               )}
                               <span className='model-name' title={model}>{model}</span>
                               {!row.enabled && (
                                 <span className='mh-tag unknown mh-tag-sm' data-model-off>
                                   {t('settings.modelHub.modality.modelDisabled', { defaultValue: '停用' })}
                                 </span>
                               )}
                               {modelDescription && (
                                 <span className='model-desc' title={modelDescription}>{modelDescription}</span>
                               )}
                             </div>

                            {/* Capabilities */}
                            {row.capabilities.length > 0 && (
                              <div className='model-caps'>
                                {row.capabilities.map((capability) => (
                                  <CapabilityHealthTag key={capability.task} capability={capability} />
                                ))}
                              </div>
                            )}

                            {/* Metrics — same style as modality sections */}
                            {(latency != null || latencySec != null || intelligence != null || outputSpeed != null || inputPrice != null || outputPrice != null) && (
                              <div className='model-metrics' data-model-metrics={model}>
                                {latency != null && (
                                  <span className='metric latency' title={`首字延迟: ${latency}ms`}>
                                    <Timer theme='outline' size='11' strokeWidth={3} />
                                    {latency}<em>ms</em>
                                  </span>
                                )}
                                {latency == null && latencySec != null && (
                                  <span className='metric latency' title={`首字延迟: ${latencySec}s`}>
                                    <Timer theme='outline' size='11' strokeWidth={3} />
                                    {latencySec.toFixed(1)}<em>s</em>
                                  </span>
                                )}
                                {intelligence != null && (
                                  <span className='metric intel' title={`智能指数: ${Math.round(intelligence)}`}>
                                    <Brain theme='outline' size='11' strokeWidth={3} />
                                    {Math.round(intelligence)}<em>分</em>
                                  </span>
                                )}
                                {outputSpeed != null && (
                                  <span className='metric speed' title={`输出速度: ${Math.round(outputSpeed)} tokens/s`}>
                                    <Thunderbolt theme='outline' size='11' strokeWidth={3} />
                                    {Math.round(outputSpeed)}<em>t/s</em>
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

                            {/* Actions — reveal on hover */}
                            <div className='model-actions'>
                              <Switch
                                size='small'
                                className='model-switch'
                                checked={row.enabled}
                                onChange={(checked) => void updateModelRow(platform, row, { enabled: checked })}
                              />
                              <ModelHealthCheckAction
                                tasks={healthTasks}
                                loading={healthCheckLoading[`${platform.id}-${model}`]}
                                onCheck={(task) => performHealthCheck(platform, model, task)}
                              />
                              <Popconfirm title={t('settings.deleteModelConfirm')} onOk={() => removeModel(platform, model)}>
                                <Button
                                  size='mini'
                                  className='model-provider-action-btn mh-act-del !w-26px !h-26px !min-w-26px'
                                  icon={<DeleteFour theme='outline' size='13' />}
                                />
                              </Popconfirm>
                              <ModelAdvancedEditor
                                providerId={platform.id}
                                preset={platform.platform}
                                providerBaseUrl={platform.base_url}
                                providerAuthScheme={platform.auth_scheme}
                                model={model}
                                capabilities={row.capabilities}
                                onSave={(patch) => updateModelCapabilities(platform, row, patch.capabilities, patch.newModelId)}
                              />
                              <ModelDescriptionEditor
                                description={modelDescription}
                                onSave={(text) => void updateModelRow(platform, row, { description: text || null })}
                              />
                            </div>
                          </div>
                            )}
                          </SortableModelRow>
                        );
                      })}
                      </div>
                    </SortableContext>
                  ) : (
                    <div className='provider-empty'>暂无模型，点击右上角 + 添加</div>
                  )}

                  {/* Connections */}
                  <ProviderConnectionsSection provider={platform} />
                    </div>
                  )}
                </section>
                  )}
                </SortableProviderCard>
              );
            })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </NomiScrollArea>
    </div>
  );
};

export default ModelModalContent;
