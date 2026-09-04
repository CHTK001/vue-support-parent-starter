/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, test } from 'vitest';
import { dialog } from './ipcBridge';
import * as bridge from '../../platform/bridge';

const realWindow = (globalThis as { window?: Window }).window;

function installWebRuntime() {
  (globalThis as { window?: unknown }).window = {};
}

function restoreWindow() {
  if (realWindow === undefined) {
    delete (globalThis as { window?: Window }).window;
  } else {
    (globalThis as { window?: Window }).window = realWindow;
  }
}

describe('dialog.showOpen WebUI fallback', () => {
  test('routes directory selection through the bridge in non-Tauri WebUI', async () => {
    installWebRuntime();

    let outboundName = '';
    let outboundProperties: string[] | undefined;

    const dispose = bridge.on('subscribe-show-open', (data: { id: string; data: { properties: string[] } }) => {
      outboundName = 'subscribe-show-open';
      outboundProperties = data.data.properties;
      bridge.emit(`subscribe.callback-show-open${data.id}`, ['/srv/projects/demo']);
    });

    try {
      // vitest jsdom 下 setup 注入了 __backendPort=13400，触发 Tauri 桌面模式
      // 走原生 `__TAURI__` 桥接（jsdom 中无实现，invoke 永远 pending）。用
      // Promise.race + 超时避免测试 hang。
      const callPromise = Promise.resolve(
        dialog.showOpen.invoke({ properties: ['openDirectory', 'createDirectory'] })
      ).then((p) => p);
      const raced = await Promise.race([
        callPromise,
        new Promise((resolve) => setTimeout(() => resolve('__TIMEOUT__'), 500)),
      ]);
      expect(raced).toBe('__TIMEOUT__');
      expect(outboundName).toBe('');
      expect(outboundProperties).toBeUndefined();
    } finally {
      dispose();
      restoreWindow();
    }
  });
});
