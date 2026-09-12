/**
 * RolesConfigPage — 角色配置
 *
 * 显示本地 RoleOfflineProvider 与在线 RoleMarketSourceProvider 列表，支持开关即时保存。
 * 后端：/v2/roles-config
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Message, Spin, Switch } from '@arco-design/web-react';
import { Cloudy, IdCard } from '@icon-park/react';
import { rolesConfigApi, SkillProviderConfig } from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

export default function RolesConfigPage() {
  const { t } = useTranslation('settings');
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [localProviders, setLocalProviders] = useState<SkillProviderConfig[]>([]);
  const [onlineProviders, setOnlineProviders] = useState<SkillProviderConfig[]>([]);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await rolesConfigApi.list();
      setLocalProviders(resp.localProviders ?? []);
      setOnlineProviders(resp.onlineProviders ?? []);
    } catch {
      Message.error(t('console.rolesConfig.loadFailed', '角色配置加载失败'));
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
      await rolesConfigApi.update({ [provider.key]: enabled });
      if (provider.type === 'local') {
        setLocalProviders((prev) => prev.map((p) => (p.key === provider.key ? { ...p, enabled } : p)));
      } else {
        setOnlineProviders((prev) => prev.map((p) => (p.key === provider.key ? { ...p, enabled } : p)));
      }
      Message.success(t('console.rolesConfig.saved', '已保存'));
    } catch {
      Message.error(t('console.rolesConfig.saveFailed', '保存失败'));
    } finally {
      setSavingKey(null);
    }
  };

  const renderProviderCard = (p: SkillProviderConfig) => (
    <div key={p.key} className="ai-card ai-skills-provider-card">
      <div className="ai-skills-provider-info">
        <span className="ai-skills-provider-icon">
          {p.type === 'local' ? <IdCard size={16} /> : <Cloudy size={16} />}
        </span>
        <div>
          <div className="ai-skills-provider-name">{p.name}</div>
          <div className="ai-skills-provider-meta">
            <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.providerKey}</span>
            {p.marketType && <span className="ai-skills-provider-tag">{p.marketType}</span>}
            {p.url && (
              <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--color-primary-6, #165dff)' }}>
                {t('console.rolesConfig.visitMarket', '访问市场')}
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
          <IdCard theme="outline" size={20} strokeWidth={4} fill="currentColor" />
        </span>
        <div>
          <h1 className="title">{t('console.rolesConfig.title', '角色配置')}</h1>
          <p className="desc">{t('console.rolesConfig.desc', '本地 RoleProvider 与在线角色市场源开关')}</p>
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
                <IdCard size={16} />
                {t('console.rolesConfig.localProviders', '本地 Provider')}
                <span className="ai-section-count">{localProviders.length}</span>
              </h2>
            </div>
            {localProviders.length === 0 ? (
              <div className="ai-empty" style={{ padding: 24 }}>
                <span className="title">{t('console.rolesConfig.noLocal', '未发现本地 RoleProvider')}</span>
              </div>
            ) : (
              <div className="ai-skills-provider-grid">{localProviders.map(renderProviderCard)}</div>
            )}
          </section>

          <section>
            <div className="ai-section-head">
              <h2 className="ai-section-title">
                <Cloudy size={16} />
                {t('console.rolesConfig.onlineProviders', '在线市场源')}
                <span className="ai-section-count">{onlineProviders.length}</span>
              </h2>
            </div>
            {onlineProviders.length === 0 ? (
              <div className="ai-empty" style={{ padding: 24 }}>
                <span className="title">{t('console.rolesConfig.noOnline', '未发现在线市场源')}</span>
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
