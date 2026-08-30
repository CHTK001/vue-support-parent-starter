/**
 * vue-support-ai-starter 入口 —— 挂载 NomiFun AI 渲染器。
 *
 * 应用启动契约：
 *  - app.yaml: 由 createVite 暴露为 /apps/vue-support-ai-starter/app.yaml，
 *    业务侧 configService 会自动拉取并合并。
 *  - 渲染器: pages/ai 提供的 `<NomiFunApp />` 根组件，已含完整 Provider 栈。
 *  - dev 端口: 5173（与 Tauri 桌面壳 devUrl 对齐）
 *
 * 桌面壳（Tauri）部署场景：把 base 改成 './'，由 vite.config.ts 切换。
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { NomiFunApp } from '@pages/ai';

const host = document.getElementById('root');
if (!host) {
  throw new Error('[vue-support-ai-starter] 挂载节点 #root 不存在');
}

const root = createRoot(host);
root.render(
  <React.StrictMode>
    <NomiFunApp />
  </React.StrictMode>
);
