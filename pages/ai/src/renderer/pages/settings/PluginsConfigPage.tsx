/**
 * PluginsConfigPage — 插件配置
 *
 * 显示本地 PluginOfflineProvider 与在线 PluginMarketSourceProvider 列表，支持开关即时保存。
 * 后端：/v2/plugins-config
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Message, Spin, Switch } from '@arco-design/web-react';
import { Cloudy, Puzzle } from '@icon-park/react';
import { pluginsConfigApi, SkillProviderConfig } from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

export default function PluginsConfigPage() {
  const { t } = useTranslation('settings');
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [localProviders, setLocalProviders] = useState<SkillProviderConfig[]>([]);
  const [onlineProviders, setOnlineProviders] = useState<SkillProviderConfig[]>([]);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await pluginsConfigApi.list();
      setLocalProviders(resp.localProviders ?? []);
      setOnlineProviders(resp.onlineProviders ?? []);
    } catch {
      Message.error(t('console.pluginsConfig.loadFailed', '插件配置加载失败'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleToggle = async (provider: SkillProviderConfig, enabled: boolean) => {
    setSavingKey(provider.key);
    try {
      await pluginsConfigApi.update({ [provider.key]: enabled });
      if (provider.type === 'local') {
        setLocalProviders((prev) => prev.map((p) => (p.key === provider.key ? { ...p, enabled } : p)));
      } else {
        setOnlineProviders((prev) => prev.map((p) => (p.key === provider.key ? { ...p, enabled } : p)));
      }
      Message.success(t('console.pluginsConfig.saved', '已保存'));
    } catch {
      Message.error(t('console.pluginsConfig.saveFailed', '保存失败'));
    } finally {
      setSavingKey(null);
    }
  };

  const renderProviderCard = (p: SkillProviderConfig) => (
    <div key={p.key} className="ai-card ai-skills-provider-card">
      <div className="ai-skills-provider-info">
        <span className="ai-skills-provider-icon">
          {p.type === 'local' ? <Puzzle size={16} /> : <Cloudy size={16} />}
        </span>
        <div>
          <div className="ai-skills-provider-name">{p.name}</div>
          <div className="ai-skills-provider-meta">
            <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.providerKey}</span>
            {p.marketType && <span className="ai-skills-provider-tag">{p.marketType}</span>}
            {p.url && (
              <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--color-primary-6, #165dff)' }}>
                {t('console.pluginsConfig.visitMarket', '访问市场')}
              </a>
            )}
          </div>
        </div>
      </div>
      <Switch checked={p.enabled} loading={savingKey === p.key} disabled={savingKey === p.key} onChange={(checked) => handleToggle(p, checked)} />
    </div>
  );

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <span className="ai-icon-tile">
          <Puzzle theme="outline" size={20} strokeWidth={4} fill="currentColor" />
        </span>
        <div>
          <h1 className="title">{t('console.pluginsConfig.title', '插件配置')}</h1>
          <p className="desc">{t('console.pluginsConfig.desc', '本地 PluginProvider 与在线插件市场源开关')}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin size={28} />
        </div>
      ) : (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section>
            <div className="ai-section-head">
              <h2 className="ai-section-title">
                <Puzzle size={16} />
                {t('console.pluginsConfig.localProviders', '本地 Provider')}
                <span className="ai-section-count">{localProviders.length}</span>
              </h2>
            </div>
            {localProviders.length === 0 ? (
              <div className="ai-empty" style={{ padding: 24 }}>
                <span className="title">{t('console.pluginsConfig.noLocal', '未发现本地 PluginProvider')}</span>
              </div>
            ) : (
              <div className="ai-skills-provider-grid">{localProviders.map(renderProviderCard)}</div>
            )}
          </section>

          <section>
            <div className="ai-section-head">
              <h2 className="ai-section-title">
                <Cloudy size={16} />
                {t('console.pluginsConfig.onlineProviders', '在线市场源')}
                <span className="ai-section-count">{onlineProviders.length}</span>
              </h2>
            </div>
            {onlineProviders.length === 0 ? (
              <div className="ai-empty" style={{ padding: 24 }}>
                <span className="title">{t('console.pluginsConfig.noOnline', '未发现在线市场源')}</span>
              </div>
            ) : (
              <div className="ai-skills-provider-grid">{onlineProviders.map(renderProviderCard)}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
