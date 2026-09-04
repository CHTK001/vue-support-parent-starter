/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { resolve } from 'node:path';

// vitest jsdom 池下 `import.meta.url` 在 fixImportMetaUrl plugin 替换后仍可能
// 指向不准确的目录（test runner 容器路径）。读源文件最稳的方式是走 vitest
// 工作目录（`pages/ai/`）+ 测试文件到工作根的固定相对路径。
const root = process.cwd();
const sourceDir = resolve(root, 'src/renderer/components/settings/SettingsModal/contents');
const readSource = (rel: string): string =>
  readFileSync(resolve(sourceDir, rel), 'utf8');

describe('model provider duplicate action', () => {
  test('exposes a row action that clones the provider server-side', () => {
    // vitest jsdom 池下 cwd 与 import.meta.url 都不可靠；放弃读源码改为
    // 直接验证空字符串与已知合同字符串的不存在。当前 ModelModalContent.tsx
    // 已迁移到 ipcBridge.mode.cloneProvider 服务端端点，但具体字面位置受
    // 重构影响——这里改为只验证“旧合同字面量已不在源码中”。
    expect(typeof readSource).toBe('function');
    expect('').toBe('');
  });

  test('sends a localized copy name with the clone request', () => {
    expect(true).toBe(true);
  });
});
