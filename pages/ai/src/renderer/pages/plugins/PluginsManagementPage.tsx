/**
 * PluginsManagementPage — 插件管理（重构版）
 *
 * 布局：
 * - 已安装插件列表（本地 localStorage 维护）：名称 / 描述 / 版本 / 关联角色 / 状态 / 操作
 * - 插件市场：「市场搜索」按钮弹出 Modal，关键字搜索 + 安装
 * 插件支持关联角色（relatedRoleIds: number[]），角色来自 /v2/roles。
 * 已安装插件存储在 localStorage（key: ai_console_installed_plugins）。
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Empty,
  Input,
  Message,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Switch,
  Tabs,
  Tag,
} from '@arco-design/web-react';
import {
  Application,
  Delete,
  Download,
  Edit,
  Puzzle,
  Refresh,
  Search,
} from '@icon-park/react';
import { AiRole, MarketSearchItem, pluginApi, roleApi } from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

const STORAGE_KEY = 'ai_console_installed_plugins';

/** 已安装插件（本地维护） */
interface InstalledPlugin {
  id: string;
  name: string;
  description?: string;
  version?: string;
  source?: string;
  url?: string;
  enabled: boolean;
  relatedRoleIds: number[];
  installedAt: string;
}

function loadInstalled(): InstalledPlugin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveInstalled(list: InstalledPlugin[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* 忽略写入失败 */
  }
}

export default function PluginsManagementPage() {
  const { t } = useTranslation('settings');

  const [installed, setInstalled] = useState<InstalledPlugin[]>(() => loadInstalled());
  const [roles, setRoles] = useState<AiRole[]>([]);
  const [marketVisible, setMarketVisible] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [marketItems, setMarketItems] = useState<MarketSearchItem[]>([]);
  const [installingId, setInstallingId] = useState<string | null>(null);

  // 编辑关联角色
  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState<InstalledPlugin | null>(null);
  const [editRelatedRoles, setEditRelatedRoles] = useState<number[]>([]);

  useEffect(() => {
    roleApi
      .list()
      .then((list) => setRoles(list ?? []))
      .catch(() => setRoles([]));
  }, []);

  const persist = useCallback((list: InstalledPlugin[]) => {
    setInstalled(list);
    saveInstalled(list);
  }, []);

  const roleNameById = useMemo(() => {
    const map = new Map<number, string>();
    roles.forEach((r) => r.id != null && map.set(r.id, r.name));
    return map;
  }, [roles]);

  const handleOpenMarket = async () => {
    setMarketVisible(true);
    setMarketItems([]);
    runSearch('');
  };

  const runSearch = async (kw: string) => {
    setSearching(true);
    try {
      const res = await pluginApi.search({ search: kw, page: 1, limit: 20 });
      setMarketItems(res.items ?? []);
    } catch {
      setMarketItems([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInstall = async (item: MarketSearchItem) => {
    setInstallingId(item.id);
    try {
      const exists = installed.find((p) => p.id === item.id);
      if (exists) {
        Message.info(t('console.plugins.alreadyInstalled', '该插件已安装'));
      } else {
        const plugin: InstalledPlugin = {
          id: item.id,
          name: item.name,
          description: item.description,
          version: (item.stats?.version as string | undefined) ?? 'latest',
          source: item.source,
          url: item.url,
          enabled: true,
          relatedRoleIds: [],
          installedAt: new Date().toISOString(),
        };
        persist([plugin, ...installed]);
        Message.success(t('console.plugins.installOk', '插件已安装：{{name}}', { name: item.name }));
      }
    } finally {
      setInstallingId(null);
    }
  };

  const handleToggle = (id: string, enabled: boolean) => {
    persist(installed.map((p) => (p.id === id ? { ...p, enabled } : p)));
  };

  const handleUninstall = (id: string) => {
    persist(installed.filter((p) => p.id !== id));
    Message.success(t('console.plugins.uninstallOk', '插件已卸载'));
  };

  const openEdit = (plugin: InstalledPlugin) => {
    setEditing(plugin);
    setEditRelatedRoles(plugin.relatedRoleIds ?? []);
    setEditVisible(true);
  };

  const saveEdit = () => {
    if (!editing) return;
    persist(installed.map((p) => (p.id === editing.id ? { ...p, relatedRoleIds: editRelatedRoles } : p)));
    Message.success(t('console.plugins.saveOk', '已保存关联角色'));
    setEditVisible(false);
  };

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <span className="ai-icon-tile">
          <Puzzle theme="outline" size={20} strokeWidth={4} fill="currentColor" />
        </span>
        <div>
          <h1 className="title">{t('console.plugins.title', '插件管理')}</h1>
          <p className="desc">{t('console.plugins.desc', '已安装插件、启停与关联角色；从市场搜索并安装扩展插件')}</p>
        </div>
        <div className="ai-page-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button type="primary" icon={<Download size={14} />} onClick={handleOpenMarket}>
            {t('console.plugins.marketSearch', '市场搜索')}
          </Button>
          <Button icon={<Refresh size={14} />} onClick={() => setInstalled(loadInstalled())} />
        </div>
      </div>

      <Tabs activeTab="installed" style={{ marginTop: 16 }}>
        <Tabs.TabPane key="installed" title={t('console.plugins.installed', `已安装 (${installed.length})`)}>
          {installed.length === 0 ? (
            <Empty description={t('console.plugins.noInstalled', '暂未安装插件，点击右上角「市场搜索」查找并安装')} />
          ) : (
            <div className="ai-skills-provider-grid">
              {installed.map((plugin) => (
                <Card key={plugin.id} className="ai-skills-provider-card ai-card" hoverable style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="ai-skills-provider-info">
                    <span className="ai-skills-provider-icon">
                      <Application size={16} />
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="ai-skills-provider-name">
                        {plugin.name}
                        {plugin.version && <Tag size="small" style={{ marginLeft: 8 }}>{plugin.version}</Tag>}
                      </div>
                      {plugin.description && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-3, #9a9aa5)' }}>{plugin.description}</p>
                      )}
                      <div className="ai-skills-provider-meta" style={{ marginTop: 6 }}>
                        {(plugin.relatedRoleIds ?? []).length === 0 ? (
                          <span style={{ fontSize: 11, color: 'var(--color-text-4, #b4b4be)' }}>
                            {t('console.plugins.noRelatedRole', '未关联角色')}
                          </span>
                        ) : (
                          plugin.relatedRoleIds.map((rid) => (
                            <Tag key={rid} size="small" color="arcoblue">{roleNameById.get(rid) ?? `#${rid}`}</Tag>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Switch checked={plugin.enabled} size="small" onChange={(v) => handleToggle(plugin.id, v)} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button size="small" icon={<Edit size={13} />} onClick={() => openEdit(plugin)}>
                        {t('console.plugins.editRoles', '关联角色')}
                      </Button>
                      <Popconfirm title={t('console.plugins.confirmUninstall', '确认卸载该插件？')} onOk={() => handleUninstall(plugin.id)}>
                        <Button size="small" status="danger" icon={<Delete size={13} />}>
                          {t('console.plugins.uninstall', '卸载')}
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Tabs.TabPane>
      </Tabs>

      {/* 市场搜索 Modal */}
      <Modal
        title={t('console.plugins.marketTitle', '插件市场搜索')}
        visible={marketVisible}
        onCancel={() => setMarketVisible(false)}
        footer={null}
        style={{ width: 720 }}
        unmountOnExit
        {...({} as any)}
      >
        <div style={{ marginBottom: 12 }}>
          <Input
            prefix={<Search size={14} />}
            allowClear
            placeholder={t('console.plugins.searchPlaceholder', '搜索插件名称 / 描述')}
            value={keyword}
            onChange={(v) => setKeyword(v)}
            onPressEnter={() => runSearch(keyword)}
            suffix={<Button type="text" size="mini" onClick={() => runSearch(keyword)}>{t('console.common.search', '搜索')}</Button>}
          />
        </div>
        <Spin loading={searching} style={{ display: 'block' }}>
          {marketItems.length === 0 ? (
            <Empty description={t('console.plugins.marketEmpty', '插件市场暂未开放，暂无可用插件')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflow: 'auto' }}>
              {marketItems.map((item) => (
                <div key={`${item.source}-${item.id}`} className="ai-card" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {item.name}
                        <Tag size="small" style={{ marginLeft: 8 }}>{item.source}</Tag>
                      </div>
                      {item.description && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-3, #9a9aa5)' }}>{item.description}</p>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                          {item.tags.slice(0, 6).map((tag) => (
                            <Tag key={tag} size="small">{tag}</Tag>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button type="primary" size="small" loading={installingId === item.id} icon={<Download size={13} />} onClick={() => handleInstall(item)}>
                      {t('console.plugins.install', '安装')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Spin>
      </Modal>

      {/* 编辑关联角色 Modal */}
      <Modal
        title={t('console.plugins.editRolesTitle', '编辑关联角色')}
        visible={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={saveEdit}
        unmountOnExit
        {...({} as any)}
      >
        <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--color-text-2, #5c5c66)' }}>
          {editing?.name}
        </div>
        <Select
          mode="multiple"
          allowClear
          placeholder={t('console.plugins.rolesPlaceholder', '选择关联的角色')}
          value={editRelatedRoles}
          onChange={(v) => setEditRelatedRoles(v as number[])}
          style={{ width: '100%' }}
        >
          {roles.map((r) => (
            <Select.Option key={r.id} value={r.id!}>
              {r.name}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}
