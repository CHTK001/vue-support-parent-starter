/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@arco-design/web-react';
import { httpRequest } from '@/common/adapter/httpBridge';

interface BotBindingRow {
  id: number;
  botId: string;
  platform: string;
  nickname: string;
  gatewayPort: number | null;
  status: string;
  bindTime: string;
  lastActiveTime: string;
}

const fmt = (v: unknown): string =>
  v === null || v === undefined || v === '' ? '—' : String(v);

export default function BotManagementPage() {
  const [bindings, setBindings] = useState<BotBindingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpRequest<{ data?: BotBindingRow[] }>(
        'GET', '/v2/ai/bot-binding/list'
      );
      setBindings(res?.data ?? []);
    } catch {
      setMessage('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, []);

  return (
    <div style={{ padding: '24px', maxWidth: 960 }}>
      <h2>Bot 管理</h2>
      <p>共 {bindings.length} 个绑定</p>
      <table>
        <thead><tr>
          {['ID', 'Bot ID', '平台', '昵称', '端口', '状态'].map(h => <th key={h}>{h}</th>)}
        </tr></thead>
        <tbody>
          {bindings.length === 0 && <tr><td colSpan={6}>暂无数据</td></tr>}
          {bindings.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td><td>{r.botId}</td><td>{r.platform}</td>
              <td>{r.nickname}</td><td>{fmt(r.gatewayPort)}</td><td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {message && <p>{message}</p>}
    </div>
  );
}
