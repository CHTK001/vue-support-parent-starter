/**
 * vue-support-ai-starter 入口 —— 挂载 NomiFun AI 渲染器。
 *
 * 渲染器（pages/ai）为自包含 React 渲染器（内置 HashRouter + Auth/Theme/Provider 栈），
 * 因此通过 `createContextApp({ selfContained: true })` 的自包含模式承载，
 * 使全量应用统一经 @repo/app 入口装配（入口、日志、指纹等共享治理），同时避免
 * 双路由/双装配冲突。不影响其他经 createContextApp 的现有应用。
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
import { createContextApp } from '@repo/app';
import { NomiFunApp } from '@pages/ai';

await createContextApp({ framework: 'react', appName: 'ai', selfContained: true }).root(<NomiFunApp />).mount('#app');
