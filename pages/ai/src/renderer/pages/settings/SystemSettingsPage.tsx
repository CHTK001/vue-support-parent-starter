/**
 * SystemSettingsPage — 系统设置首页（卡片导航）
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ConnectionPoint, SettingOne, Timer, LinkTwo, IdCard, Puzzle } from '@icon-park/react';
import '@/renderer/styles/ai-page.css';

export default function SystemSettingsPage() {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();

  const cards = [
    {
      key: 'global-beans',
      path: '/settings/global-beans',
      title: t('console.settings.globalBeans', '全局 Bean'),
      desc: t('console.settings.globalBeansDesc', 'ChatClient 会话、文生图 / 文生视频、OCR、布局、人脸识别、图像识别管线——全局配置供系统内部使用'),
      icon: <ConnectionPoint theme="outline" size={18} strokeWidth={4} fill="currentColor" />,
    },
    {
      key: 'usage-config',
      path: '/settings/usage-config',
      title: t('console.settings.usageConfig', '用量配置'),
      desc: t('console.settings.usageConfigDesc', '定时同步时间、Provider SPI 配置开关、用量开关、后台时间轮'),
      icon: <Timer theme="outline" size={18} strokeWidth={4} fill="currentColor" />,
    },
    {
      key: 'skills-config',
      path: '/settings/skills-config',
      title: t('console.settings.skillsConfig', 'Skills 配置'),
      desc: t('console.settings.skillsConfigDesc', '本地 SkillProvider 与在线市场源开关——开启的 Provider 才会在 Skills 页面扫描和市场搜索中显示'),
      icon: <LinkTwo theme="outline" size={18} strokeWidth={4} fill="currentColor" />,
    },
    {
      key: 'roles-config',
      path: '/settings/roles-config',
      title: t('console.settings.rolesConfig', '角色配置'),
      desc: t('console.settings.rolesConfigDesc', '本地 RoleProvider 与在线角色市场源开关'),
      icon: <IdCard theme="outline" size={18} strokeWidth={4} fill="currentColor" />,
    },
    {
      key: 'mcp-config',
      path: '/settings/mcp-config',
      title: t('console.settings.mcpConfig', 'MCP 配置'),
      desc: t('console.settings.mcpConfigDesc', '本地 McpProvider 与在线 MCP 市场源开关'),
      icon: <LinkTwo theme="outline" size={18} strokeWidth={4} fill="currentColor" />,
    },
    {
      key: 'plugins-config',
      path: '/settings/plugins-config',
      title: t('console.settings.pluginsConfig', '插件配置'),
      desc: t('console.settings.pluginsConfigDesc', '本地 PluginProvider 与在线插件市场源开关'),
      icon: <Puzzle theme="outline" size={18} strokeWidth={4} fill="currentColor" />,
    },
  ];

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <span className="ai-icon-tile">
          <SettingOne theme="outline" size={20} strokeWidth={4} fill="currentColor" />
        </span>
        <div>
          <h1 className="title">{t('console.settings.title', '系统设置')}</h1>
          <p className="desc">{t('console.settings.desc', '全局 Bean 与用量行为配置')}</p>
        </div>
      </div>

      <div className="ai-settings-grid" style={{ marginTop: 20 }}>
        {cards.map((c) => (
          <div
            key={c.key}
            className="ai-card ai-settings-card"
            role="button"
            tabIndex={0}
            onClick={() => navigate(c.path)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(c.path);
              }
            }}
          >
            <div className="ai-settings-card-head">
              <span className="ai-settings-card-icon">{c.icon}</span>
              <span className="ai-settings-card-title">{c.title}</span>
            </div>
            <span className="ai-settings-card-desc">{c.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
