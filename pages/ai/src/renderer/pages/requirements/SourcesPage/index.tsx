/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SourcesPage — the requirements「数据源 / Data Sources」section.
 *
 * Backend-driven: lists configured data sources (`/api/requirements/data-sources`),
 * offers 新建/编辑/删除/测试/同步 actions, and shows the available provider types
 * (`/api/requirements/data-sources/types`: LOCAL / LARK / GENERIC).
 *
 * Renders inside RequirementsLayout's content pane, which already provides the
 * scroll container, centered max-width and responsive horizontal padding. So
 * this renders bare section blocks in a plain flex column — matching the
 * WorkspacePage / ExtensionsPage convention (no own scroll / width / padding).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DatabaseConfig, Excel, Plug, Sync } from '@icon-park/react';
import { Button, Space, Spin, Tag } from '@arco-design/web-react';
import { ipcBridge } from '@/common';
import type { IDataSource } from '@/common/adapter/ipcBridge';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import SourceCard from './SourceCard';
import DataSourceFormModal from './DataSourceFormModal';

const GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
  gap: '14px',
};

const TYPE_META: Record<string, { icon: React.ReactNode; status: 'active' | 'soon' | 'planned' }> = {
  LOCAL: { icon: <DatabaseConfig theme='outline' size={20} strokeWidth={3} />, status: 'active' },
  LARK: { icon: <Excel theme='outline' size={20} strokeWidth={3} />, status: 'soon' },
  GENERIC: { icon: <Plug theme='outline' size={20} strokeWidth={3} />, status: 'planned' },
};

const SourcesPage: React.FC = () => {
  const { t } = useTranslation();
  const [message, ctx] = useArcoMessage();
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<IDataSource[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<IDataSource | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, typeList] = await Promise.all([
        ipcBridge.requirements.listDataSources.invoke(),
        ipcBridge.requirements.dataSourceTypes.invoke(),
      ]);
      setSources(list);
      setTypes(typeList);
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleTest = async (ds: IDataSource) => {
    setPending(ds.id);
    try {
      const r = await ipcBridge.requirements.testDataSource.invoke({ id: ds.id });
      if (r.connected) {
        message.success(`「${ds.name}」连接正常`);
      } else {
        message.error(`「${ds.name}」连接失败`);
      }
    } catch (e) {
      message.error(String(e));
    } finally {
      setPending(null);
    }
  };

  const handleSync = async (ds: IDataSource) => {
    setSyncing(ds.id);
    try {
      const r = await ipcBridge.requirements.syncDataSource.invoke({ id: ds.id });
      message.success(`已同步 ${r.synced ?? 0} 条需求`);
      await refresh();
    } catch (e) {
      message.error(String(e));
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async (ds: IDataSource) => {
    try {
      await ipcBridge.requirements.removeDataSource.invoke({ id: ds.id });
      message.success(`已删除「${ds.name}」`);
      await refresh();
    } catch (e) {
      message.error(String(e));
    }
  };

  const openCreate = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const openEdit = (ds: IDataSource) => {
    setEditing(ds);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-40px'>
        <Spin />
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-24px'>
      {ctx}

      {/* Section 1 — configured data sources */}
      <div className='flex flex-col gap-14px'>
        <div className='flex items-center justify-between'>
          <div className='text-13px font-600 leading-18px text-t-secondary uppercase tracking-wide'>
            {t('requirements.source.connectedTitle')} · {sources.length}
          </div>
          <Button size='small' type='primary' onClick={openCreate}>
            {t('requirements.source.newSource')}
          </Button>
        </div>

        {sources.length === 0 ? (
          <div className='rounded-12px border border-dashed p-24px text-center text-13px text-t-tertiary'>
            {t('requirements.source.emptyDescription')}
          </div>
        ) : (
          <div style={GRID_STYLE}>
            {sources.map((ds) => {
              const meta = TYPE_META[ds.type] ?? TYPE_META.GENERIC;
              const countText = ds.last_sync_status
                ? `${t('requirements.source.lastSync')}: ${ds.last_sync_status}`
                : t('requirements.source.neverSynced');
              return (
                <div key={ds.id} className='flex flex-col gap-8px'>
                  <SourceCard
                    icon={meta.icon}
                    name={ds.name}
                    description={`${TYPE_META[ds.type]?.status === 'active' ? t('requirements.source.local.desc') : countText}`}
                    status={ds.enabled === false ? 'planned' : 'active'}
                  />
                  <Space size={4} className='justify-end'>
                    <Button
                      size='mini'
                      loading={pending === ds.id}
                      onClick={() => void handleTest(ds)}
                    >
                      {t('requirements.source.test')}
                    </Button>
                    <Button
                      size='mini'
                      loading={syncing === ds.id}
                      icon={<Sync />}
                      onClick={() => void handleSync(ds)}
                    >
                      {t('requirements.source.sync')}
                    </Button>
                    <Button size='mini' onClick={() => openEdit(ds)}>
                      {t('requirements.source.edit')}
                    </Button>
                    <Button size='mini' status='danger' onClick={() => void handleDelete(ds)}>
                      {t('requirements.source.delete')}
                    </Button>
                  </Space>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2 — available providers */}
      <div className='flex flex-col gap-14px'>
        <div className='text-13px font-600 leading-18px text-t-secondary uppercase tracking-wide'>
          {t('requirements.source.upcomingTitle')}
        </div>
        <div style={GRID_STYLE}>
          {types.map((tname) => {
            const meta = TYPE_META[tname] ?? { icon: <Plug />, status: 'planned' as const };
            const label =
              (TYPE_LABEL_CUSTOM as Record<string, string>)[tname] ?? tname;
            return (
              <SourceCard
                key={tname}
                icon={meta.icon}
                name={label}
                description={t(`requirements.source.${tname.toLowerCase()}SelectedDesc`, {
                  defaultValue: t('requirements.source.note'),
                })}
                status={meta.status}
              />
            );
          })}
        </div>
      </div>

      {/* Muted explanatory note */}
      <p className='m-0 text-12px leading-20px text-t-tertiary'>{t('requirements.source.note')}</p>

      <DataSourceFormModal
        visible={modalVisible}
        editing={editing}
        types={types}
        onClose={() => setModalVisible(false)}
        onSuccess={async () => {
          setModalVisible(false);
          await refresh();
        }}
      />
    </div>
  );
};

const TYPE_LABEL_CUSTOM: Record<string, string> = {
  LOCAL: '本机数据库',
  LARK: '飞书 · Lark 多维表格',
  GENERIC: '其他第三方',
};

export default SourcesPage;