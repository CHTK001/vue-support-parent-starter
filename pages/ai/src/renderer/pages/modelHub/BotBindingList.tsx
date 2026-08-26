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
  platform?: string;
  nickname?: string;
  gatewayPort?: number | null;
  status?: string;
  bindTime?: string;
  lastActiveTime?: string;
}

const fmt = (v: unknown): string =>
  v === null || v === undefined || v === '' ? '—' : String(v);

export default function BotBindingList() {
  const [bindings, setBindings] = useState<BotBindingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpRequest<{ data?: BotBindingRow[] }>(
        'GET', '/v2/tool-usage/list'
      );
      setBindings(res?.data ?? []);
    } catch {
      setMessage('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, []);

  const handleDelete = async (id: number) => {
    try {
      await httpRequest('DELETE', `/v2/ai/bot-binding/${id}`);
      setBindings(prev => prev.filter(b => b.id !== id));
    } catch { /* 静默 */ }
  };

  return (
    <div className='flex flex-col gap-12px'>
      <div className='flex items-center justify-between'>
        <span className='text-13px font-500 text-t-primary'>
          已绑定 Bot（{bindings.length}）
        </span>
        <Button size='mini' type='primary'>+ 扫码添加</Button>
      </div>
      <table className='w-full border-collapse text-13px'>
        <thead><tr>
          {['状态', 'Bot ID', '昵称', '端口', '绑定时间', '最后活跃', '操作'].map(h =>
            <th key={h}>{h}</th>)}
        </tr></thead>
        <tbody>
          {bindings.length === 0 && (
            <tr><td colSpan={7}>暂无绑定</td></tr>
          )}
          {bindings.map(r => (
            <tr key={r.id}>
              <td>{r.status}</td>
              <td>{r.botId}</td>
              <td>{r.nickname}</td>
              <td>{fmt(r.gatewayPort)}</td>
              <td>{fmt(r.bindTime)}</td>
              <td>{fmt(r.lastActiveTime)}</td>
              <td><Button size='mini' onClick={() => handleDelete(r.id)}>删除</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {message && <div className='text-12px text-warning-6'>{message}</div>}
    </div>
  );

  function setBindings(data: BotBindingRow[] | undefined) {
    if (data) setBindings(data);
  }
}
