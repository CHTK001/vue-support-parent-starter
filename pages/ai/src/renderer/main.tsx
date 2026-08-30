/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * pages/ai 独立开发入口 —— 仅供「直接跑 pages/ai 本身」的场景使用：
 *
 *  - 单仓调试（不启动 apps/vue-support-ai-starter）
 *  - Tauri 桌面壳构建（依然以 pages/ai 为 root）
 *
 * 正式应用启动（webdev / 同源部署）请使用 apps/vue-support-ai-starter，
 * 由其入口通过 `@pages/ai` 导入 `NomiFunApp` 根组件挂载，避免出现「pages/ai 同时
 * 是组件库又是可启动应用」的角色冲突。
 */
import { createRoot } from 'react-dom/client';
import { NomiFunApp } from './App';
import { registerPwa } from './services/registerPwa';

void registerPwa();

const root = createRoot(document.getElementById('root')!);
root.render(<NomiFunApp />);
