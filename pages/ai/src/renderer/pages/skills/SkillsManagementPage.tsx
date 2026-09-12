/**
 * SkillsManagementPage — 技能管理
 *
 * 功能：
 * - 已安装技能列表（按 builtin / custom 分组）
 * - 扫描本地技能按钮（依据 skills-config 中 local provider 是否有开启来显示）
 * - 市场按钮 → 弹窗（关键字搜索 + 安装）
 * - 卸载按钮（Popconfirm 二次确认）
 * 后端：/api/skills、/api/skills/scan、/api/skills/{name}、/api/skills/market/search、/api/skills/market/package/install
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
  Spin,
  Tag,
  Tooltip,
} from '@arco-design/web-react';
import {
  Delete,
  Download,
  FolderOpen,
  Refresh,
  Search,
  Tool,
} from '@icon-park/react';
import {
  InstalledSkill,
  MarketSearchItem,
  skillApi,
  skillsConfigApi,
} from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

const iconProps = { theme: 'outline' as const, size: 16, strokeWidth: 4, fill: 'currentColor' as const };

export default function SkillsManagementPage() {
  const { t } = useTranslation('settings');

  const [skills, setSkills] = useState<InstalledSkill[]>([]);
  const [loading, setLoading] = useState(false);
  /** 是否有已开启的本地 Provider（决定「扫描」按钮是否存在） */
  const [localScanEnabled, setLocalScanEnabled] = useState(false);
  /** 是否有已开启的在线市场 Provider（决定「技能市场」按钮是否存在） */
  const [onlineMarketEnabled, setOnlineMarketEnabled] = useState(false);
  /** 已开启在线 Provider 的 source 列表（市场搜索按此过滤） */
  const [enabledSources, setEnabledSources] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  // 市场弹窗
  const [marketVisible, setMarketVisible] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [marketItems, setMarketItems] = useState<MarketSearchItem[]>([]);
  const [installingId, setInstallingId] = useState<string | null>(null);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const list = await skillApi.list();
      setSkills(list ?? []);
    } catch {
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await skillsConfigApi.list();
      const locals = cfg.localProviders ?? [];
      const online = (cfg.onlineProviders ?? []).filter((p) => p.enabled);
      setLocalScanEnabled(locals.some((p) => p.enabled));
      setOnlineMarketEnabled(online.length > 0);
      setEnabledSources(online.map((p) => p.providerKey));
    } catch {
      setLocalScanEnabled(false);
      setOnlineMarketEnabled(false);
      setEnabledSources([]);
    }
  }, []);

  useEffect(() => {
    loadSkills();
    loadConfig();
  }, [loadSkills, loadConfig]);

  const builtinSkills = useMemo(() => skills.filter((s) => s.source === 'builtin'), [skills]);
  const customSkills = useMemo(() => skills.filter((s) => s.source !== 'builtin'), [skills]);

  const handleScan = async () => {
    setScanning(true);
    try {
      await skillApi.scan('');
      Message.success(t('console.skills.scanOk', '本地技能扫描完成'));
      loadSkills();
    } catch {
      Message.error(t('console.skills.scanFailed', '本地技能扫描失败'));
    } finally {
      setScanning(false);
    }
  };

  const handleOpenMarket = async () => {
    setMarketVisible(true);
    setMarketItems([]);
    runSearch('');
  };

  const runSearch = async (kw: string) => {
    setSearching(true);
    try {
      const res = await skillApi.marketSearch({ search: kw, page: 1, limit: 20 });
      const all = res.items ?? [];
      // 只展示已开启在线 Provider 的 source
      setMarketItems(enabledSources.length > 0 ? all.filter((it) => enabledSources.includes(it.source)) : all);
    } catch {
      setMarketItems([]);
      Message.error(t('console.skills.marketSearchFailed', '市场搜索失败'));
    } finally {
      setSearching(false);
    }
  };

  const handleInstall = async (item: MarketSearchItem) => {
    setInstallingId(item.id);
    try {
      const res = await skillApi.marketInstall({ source: item.source, id: item.id, url: item.url });
      Message.success(t('console.skills.installOk', '已安装：{{name}}', { name: res.skill_name ?? item.name }));
      loadSkills();
    } catch (e: any) {
      Message.error(t('console.skills.installFailed', '安装失败：{{msg}}', { msg: e?.message ?? '' }));
    } finally {
      setInstallingId(null);
    }
  };

  const handleUninstall = async (skill: InstalledSkill) => {
    try {
      await skillApi.remove(skill.name);
      Message.success(t('console.skills.uninstallOk', '已卸载'));
      loadSkills();
    } catch {
      Message.error(t('console.skills.uninstallFailed', '卸载失败'));
    }
  };

  const renderGroup = (title: string, list: InstalledSkill[]) => (
    <section key={title} style={{ marginBottom: 20 }}>
      <div className="ai-section-head">
        <h2 className="ai-section-title">
          <Tool size={16} />
          {title}
          <span className="ai-section-count">{list.length}</span>
        </h2>
      </div>
      {list.length === 0 ? (
        <div className="ai-empty" style={{ padding: 24 }}>
          <span className="title">{t('console.skills.groupEmpty', '暂无技能')}</span>
        </div>
      ) : (
        <div className="ai-skills-provider-grid">
          {list.map((skill) => (
            <Card key={skill.name} className="ai-skills-provider-card ai-card" hoverable style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="ai-skills-provider-info">
                <span className="ai-skills-provider-icon">
                  <Tool size={16} />
                </span>
                <div>
                  <div className="ai-skills-provider-name">{skill.name}</div>
                  <div className="ai-skills-provider-meta">
                    {skill.description ? <span>{skill.description}</span> : null}
                    {skill.path ? (
                      <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{skill.path}</span>
                    ) : null}
                    <Tag size="small" color={skill.source === 'builtin' ? 'arcoblue' : 'green'}>
                      {skill.source === 'builtin' ? t('console.skills.builtin', '内置') : t('console.skills.custom', '自定义')}
                    </Tag>
                  </div>
                </div>
              </div>
              {skill.source !== 'builtin' && (
                <Popconfirm title={t('console.skills.confirmUninstall', '确定卸载该技能？')} onOk={() => handleUninstall(skill)}>
                  <Button size="small" status="danger" icon={<Delete size={13} />}>
                    {t('console.skills.uninstall', '卸载')}
                  </Button>
                </Popconfirm>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <span className="ai-icon-tile">
          <Tool theme="outline" size={20} strokeWidth={4} fill="currentColor" />
        </span>
        <div>
          <h1 className="title">{t('console.skills.title', '技能管理')}</h1>
          <p className="desc">
            {t('console.skills.desc', '查看已安装技能、扫描本地技能目录、从在线市场搜索并安装技能')}
          </p>
        </div>
        <div className="ai-page-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {localScanEnabled && (
            <Button icon={<FolderOpen size={14} />} onClick={handleScan} loading={scanning}>
              {t('console.skills.scan', '扫描本地技能')}
            </Button>
          )}
          {onlineMarketEnabled && (
            <Button type="primary" icon={<Download size={14} />} onClick={handleOpenMarket}>
              {t('console.skills.market', '技能市场')}
            </Button>
          )}
          <Button icon={<Refresh size={14} />} onClick={loadSkills} />
        </div>
      </div>

      <Spin loading={loading} style={{ display: 'block', marginTop: 20 }}>
        {skills.length === 0 ? (
          <Empty description={t('console.skills.empty', '暂未安装任何技能，可从技能市场安装')} />
        ) : (
          <>
            {renderGroup(t('console.skills.builtinGroup', '内置技能'), builtinSkills)}
            {renderGroup(t('console.skills.customGroup', '自定义技能'), customSkills)}
          </>
        )}
      </Spin>

      <Modal
        title={t('console.skills.marketTitle', '技能市场')}
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
            placeholder={t('console.skills.marketPlaceholder', '搜索技能名称 / 描述')}
            value={keyword}
            onChange={(v) => setKeyword(v)}
            onPressEnter={() => runSearch(keyword)}
            suffix={<Button type="text" size="mini" onClick={() => runSearch(keyword)}>{t('console.common.search', '搜索')}</Button>}
          />
        </div>
        <Spin loading={searching} style={{ display: 'block' }}>
          {marketItems.length === 0 ? (
            <Empty description={t('console.skills.marketEmpty', '未找到相关技能')} />
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
                    <Button
                      type="primary"
                      size="small"
                      loading={installingId === item.id}
                      icon={<Download size={13} />}
                      onClick={() => handleInstall(item)}
                    >
                      {t('console.skills.install', '安装')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
}
