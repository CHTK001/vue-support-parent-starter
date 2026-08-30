/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 渲染器运行时副作用 — 必须在最早阶段执行。
 *
 * - runtimePatches: 修补运行时差异（platform/polyfill 等）。
 * - 浏览器适配器: 建立 fetch/storage 在浏览器/桌面壳下的一致性。
 */
import './utils/ui/runtimePatches';
import '@/common/adapter/browser';

/** Arco Design 全局样式与 React 19 适配。 */
import '@arco-design/web-react/es/_util/react-19-adapter';
import '@arco-design/web-react/dist/css/arco.css';
import enUS from '@arco-design/web-react/es/locale/en-US';
import zhCN from '@arco-design/web-react/es/locale/zh-CN';

/** UnoCSS global 模式入口 + 项目主题/契约样式。 */
import 'uno.css';
import './styles/arco-override.css';
import './styles/themes/index.css';
import './styles/modal-contract.css';
import './styles/ai-module-beauty.css';

/** 配置服务提前初始化（i18n/theme 启动路径会 await configService.whenReady()）。 */
import { configService } from '@/common/config/configService';
configService.initialize().catch((err) => {
  console.error('Failed to initialize config:', err);
});

/** i18n 初始化。 */
import './services/i18n';

/**
 * 暴露给外部应用（apps/vue-support-ai-starter 等）挂载的 React 根组件。
 *
 * 内部已包含 RouteErrorBoundary → AppProviders → App(Config(Main)) 的完整 Provider 栈，
 * 业务侧只需 `createRoot(el).render(<NomiFunApp />)` 即可启动整套 UI。
 */
import type { PropsWithChildren } from 'react';
import React, { useEffect, useState } from 'react';

import { ConfigProvider } from '@arco-design/web-react';
import { useTranslation } from 'react-i18next';
import { mutate as swrMutate } from 'swr';

import { AuthProvider, useAuth } from './hooks/context/AuthContext';
import { FeedbackProvider } from './hooks/context/FeedbackContext';
import { ThemeProvider } from './hooks/context/ThemeContext';
import { ConversationHistoryProvider } from './hooks/context/ConversationHistoryContext';

import { application } from '@/common/adapter/ipcBridge';
import { isHandledAuthExpiredHttpError } from '@/common/adapter/httpBridge';
import { setBrowserStorageGeneration } from '@/common/utils/browserStorageKey';

import { DETECTED_AGENTS_SWR_KEY, fetchDetectedAgents } from './utils/model/agentTypes';
import { repairAllCronJobTimeZonesOnce } from '@renderer/pages/cron/repairCronJobTimeZone';

import AppLoader from './components/layout/AppLoader';
import Layout from './components/layout/Layout';
import RouteErrorBoundary from './components/layout/RouteErrorBoundary';
import Router from './components/layout/Router';
import Sider from './components/layout/Sider';

import HOC from './utils/ui/HOC';

const arcoLocales: Record<string, typeof enUS> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

const AppProviders: React.FC<PropsWithChildren> = ({ children }) =>
  React.createElement(
    AuthProvider,
    null,
    React.createElement(ThemeProvider, null, React.createElement(FeedbackProvider, null, children))
  );

const Config: React.FC<PropsWithChildren> = ({ children }) => {
  const {
    i18n: { language },
  } = useTranslation();
  const arcoLocale = arcoLocales[language] ?? enUS;

  return React.createElement(ConfigProvider, { theme: { primaryColor: '#4E5969' }, locale: arcoLocale }, children);
};

const Main = () => {
  const { ready, status } = useAuth();
  const [configReady, setConfigReady] = useState(false);
  const [configError, setConfigError] = useState<Error | null>(null);

  useEffect(() => {
    // Browser sessions must pass the auth probe before any protected startup
    // request runs. In particular, `/api/system/info` returns 403 for an
    // expired session; starting it while unauthenticated would turn the normal
    // login transition into an application-level render failure.
    if (!ready || status !== 'authenticated') {
      setConfigReady(false);
      setConfigError(null);
      return;
    }

    let active = true;
    setConfigReady(false);
    setConfigError(null);
    // Prefetch `/api/agents` in parallel with configService.initialize() and
    // seed the shared SWR cache so the Guid page's model/mode selectors can
    // read `handshake.available_models` on the very first render — without
    // waiting for a session to be created.
    void Promise.all([
      application.systemInfo
        .invoke()
        .then((info) => setBrowserStorageGeneration(info.storageGeneration))
        .catch((err) => {
          console.error('Failed to initialize browser storage generation:', err);
          throw err;
        }),
      configService.initialize().catch((err) => {
        console.error('Failed to initialize config:', err);
      }),
      fetchDetectedAgents()
        .then((agents) => swrMutate(DETECTED_AGENTS_SWR_KEY, agents, false))
        .catch((err) => {
          console.error('Failed to prefetch agents:', err);
        }),
    ])
      .then(() => {
        if (active) setConfigReady(true);
      })
      .catch((error: unknown) => {
        // httpBridge already cleared the expired browser session and notified
        // AuthProvider. Let the auth state render `/login`; never latch this
        // expected transition into the root error boundary.
        if (!active || isHandledAuthExpiredHttpError(error)) return;
        setConfigError(error instanceof Error ? error : new Error(String(error)));
      });

    return () => {
      active = false;
    };
  }, [ready, status]);

  useEffect(() => {
    if (!ready || status !== 'authenticated') return;
    void repairAllCronJobTimeZonesOnce();
  }, [ready, status]);

  const router = (
    <Router
      layout={
        <ConversationHistoryProvider>
          <Layout sider={<Sider />} />
        </ConversationHistoryProvider>
      }
    />
  );

  if (!ready) {
    return <AppLoader />;
  }

  // The login route is intentionally independent from authenticated startup
  // data. This also makes an in-flight session expiry recover immediately.
  if (status !== 'authenticated') {
    return router;
  }

  if (configError) {
    throw configError;
  }

  if (!configReady) {
    return <AppLoader />;
  }

  return router;
};

const App = HOC.Wrapper(Config)(Main);

/**
 * NomiFun 渲染器根组件 —— 外部应用（apps/vue-support-ai-starter）挂载的最小入口。
 *
 * 包含完整 Provider 栈：RouteErrorBoundary → AppProviders(Auth/Theme/Feedback) → App。
 * 业务侧只需 createRoot(el).render(<NomiFunApp />) 即可启动整套 UI。
 *
 * 注意：PWA 注册仍在 main.tsx 中由调用方决定（桌面壳场景需要主动清理）。
 */
export const NomiFunApp: React.FC = () => (
  <RouteErrorBoundary scope='application'>
    <AppProviders>
      <App />
    </AppProviders>
  </RouteErrorBoundary>
);

export default NomiFunApp;
