/**
 * AiConsoleApp — AI 控制台自包含外壳
 *
 * 提供 HashRouter + 左侧菜单 + 路由表，可直接被宿主以 <AiConsoleApp /> 挂载；
 * 同时导出 aiConsoleRoutes 与 AiConsoleShell，供已自带路由的宿主接入。
 */
import React from 'react';
import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AiConsoleSidebar from '@/renderer/components/layout/AiConsoleSidebar';
import BotManagementPage from '@/renderer/pages/bots/BotManagementPage';
import BotImPage from '@/renderer/pages/bots/BotImPage';
import ModelManagementPage from '@/renderer/pages/models/ModelManagementPage';
import AgentManagementPage from '@/renderer/pages/agents/AgentManagementPage';
import ServiceManagementPage from '@/renderer/pages/services/ServiceManagementPage';
import SkillsManagementPage from '@/renderer/pages/skills/SkillsManagementPage';
import RolesManagementPage from '@/renderer/pages/roles/RolesManagementPage';
import McpManagementPage from '@/renderer/pages/mcp/McpManagementPage';
import PluginsManagementPage from '@/renderer/pages/plugins/PluginsManagementPage';
import CapabilityPipelinePage from '@/renderer/pages/capabilities/CapabilityPipelinePage';
import UsageManagementPage from '@/renderer/pages/usage/UsageManagementPage';
import UsageSyncLogPage from '@/renderer/pages/usage/UsageSyncLogPage';
import SystemSettingsPage from '@/renderer/pages/settings/SystemSettingsPage';
import GlobalBeansPage from '@/renderer/pages/settings/GlobalBeansPage';
import UsageConfigPage from '@/renderer/pages/settings/UsageConfigPage';
import SkillsConfigPage from '@/renderer/pages/settings/SkillsConfigPage';
import RolesConfigPage from '@/renderer/pages/settings/RolesConfigPage';
import McpConfigPage from '@/renderer/pages/settings/McpConfigPage';
import PluginsConfigPage from '@/renderer/pages/settings/PluginsConfigPage';
import '@/renderer/styles/ai-console.css';

/** 路由注册表：宿主接入时可直接复用 */
export const aiConsoleRoutes: Array<{ path: string; element: React.ReactElement }> = [
  { path: '/bots/users', element: <BotManagementPage /> },
  { path: '/bots/im', element: <BotImPage /> },
  { path: '/models', element: <ModelManagementPage /> },
  { path: '/agents', element: <AgentManagementPage /> },
  { path: '/services', element: <ServiceManagementPage /> },
  { path: '/skills', element: <SkillsManagementPage /> },
  { path: '/roles', element: <RolesManagementPage /> },
  { path: '/mcp', element: <McpManagementPage /> },
  { path: '/plugins', element: <PluginsManagementPage /> },
  { path: '/capabilities/:pipeline', element: <CapabilityPipelinePage /> },
  { path: '/usage', element: <UsageManagementPage /> },
  { path: '/usage/sync-logs', element: <UsageSyncLogPage /> },
  { path: '/settings', element: <SystemSettingsPage /> },
  { path: '/settings/global-beans', element: <GlobalBeansPage /> },
  { path: '/settings/usage-config', element: <UsageConfigPage /> },
  { path: '/settings/skills-config', element: <SkillsConfigPage /> },
  { path: '/settings/roles-config', element: <RolesConfigPage /> },
  { path: '/settings/mcp-config', element: <McpConfigPage /> },
  { path: '/settings/plugins-config', element: <PluginsConfigPage /> },
];

/** 控制台布局：左侧菜单 + 主内容区 */
export function AiConsoleShell() {
  return (
    <div className="ai-console">
      <AiConsoleSidebar />
      <main className="ai-console-main">
        <div className="ai-console-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/** 自包含应用：HashRouter + 路由表（推荐宿主直接挂载） */
export default function AiConsoleApp() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AiConsoleShell />}>
          <Route path="/" element={<Navigate to="/bots/users" replace />} />
          {aiConsoleRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          <Route path="*" element={<Navigate to="/bots/users" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
