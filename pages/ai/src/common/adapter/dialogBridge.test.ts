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
      const selection = dialog.showOpen.invoke({ properties: ['openDirectory', 'createDirectory'] });

      // vitest jsdom 下 `window.__backendPort` 已被 setup 注入 13400，被视作
      // Tauri 桌面模式，所以走的是原生 `__TAURI__` 桥接而非 WebUI `subscribe-*`
      // 桥接。outboundName 因此保持空字符串。
      expect(outboundName).toBe('');
      expect(outboundProperties).toBeUndefined();
      expect(await selection).toEqual([]);
    } finally {
      dispose();
      restoreWindow();
    }
  });
});
