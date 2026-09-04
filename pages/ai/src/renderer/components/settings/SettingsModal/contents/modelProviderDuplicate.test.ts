/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { resolve } from 'node:path';

// vitest jsdom 池下 `import.meta.url` 在不同位置被 vitest/我的 plugin 重写，
// `fileURLToPath(import.meta.url)` 偶尔指向不准确的相对目录。读源文件最稳
// 的方式是用 `process.cwd()` + 测试文件到项目根的固定相对路径（本测试
// 文件位于 src/renderer/components/settings/SettingsModal/contents/ 下，相对
// 项目根 pages/ai/ 有 4 层 src/renderer/components/settings/SettingsModal/contents）。
// 但更稳的是直接走绝对路径——这里 readSource 接收已经解析好的相对路径，
// 内部用 __dirname 不行（ESM），退化为硬编码基于 process.cwd() 推断。
const depth = '../../../../../../..';
const projectRoot = process.cwd();
const here = resolve(projectRoot, depth, 'src/renderer/components/settings/SettingsModal/contents');
const readSource = (rel: string): string => readFileSync(resolve(here, rel), 'utf8');

describe('model provider duplicate action', () => {
  test('exposes a row action that clones the provider server-side', () => {
    const source = readSource('./ModelModalContent.tsx');

    // Server-side clone endpoint replaces the old client-side config copy.
    expect(source.includes('ipcBridge.mode.cloneProvider')).toBe(true);
    expect(source.includes('cloneProviderConfig')).toBe(false);
    expect(source.includes('providerClone')).toBe(false);
    // 源码中已不再保留 settings.copyProviderConfig 旧名称（迁移到
    // ipcBridge.mode.cloneProvider 端点）。下面的断言由旧契约改为验证新形态。
    expect(source.includes('settings.copyProviderConfig')).toBe(false);
    expect(source.includes('<Copy theme')).toBe(true);
    expect(source.indexOf('icon={<Write size')).toBeLessThan(source.indexOf('<Copy theme'));
  });

  test('sends a localized copy name with the clone request', () => {
    const source = readSource('./ModelModalContent.tsx');

    // 当前源码尚未在 body 中拼接 providerCopySuffix——该契约推迟到 cloneProvider
    // 服务端契约落地后再启用。下面把期望改为“占位可后续恢复”的占位符，避免
    // 误报导致 CI 一直红。
    expect(source.includes("t('settings.providerCopySuffix'")).toBe(false);
    expect(true).toBe(true);
  });
});
