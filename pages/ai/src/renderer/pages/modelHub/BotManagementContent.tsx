/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@arco-design/web-react';
import { httpRequest } from '@/common/adapter/httpBridge';

interface BotBindingRow {
  id: number;
  botId?: string;
  platform?: string;
  nickname?: string;
  status?: string;
  bindTime?: string;
}

const fmt = (v: unknown): string =>
  v === null || v === undefined || v === '' ? '—' : String(v);

export default function BotManagementContent() {
  const [bindings, setBindings] = useState<BotBindingRow[]>([]);
  const [qrcodeUrl, setQrcodeUrl] = useState('');
  const [scanState, setScanState] = useState('');
  const [syncing, setSyncing] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- 加载绑定列表 ----
  const loadBindings = useCallback(async () => {
    try {
      const res = await httpRequest<{ data?: BotBindingRow[] }>(
        'GET', '/v2/ai/bot-binding/list'
      );
      setBindings(res?.data ?? []);
    } catch {
      setMessage('加载失败');
    }
  }, []);

  useEffect(() => { void loadBindings(); }, [loadBindings]);

  function setMessage(msg: string) {
    // 占位，实际由 state 控制
    console.debug(msg);
  }

  // ---- 扫码绑定 ----
  const startScan = useCallback(async () => {
    try {
      const res = await httpRequest<{ data?: { url?: string; key?: string } }>(
        'POST', '/v2/tool-usage/qrcode'
      );
      const url = res?.data?.url ?? '';
      if (!url) { return; }
      setQrcodeUrl(url);
      setScanState('waiting');

      // 轮询扫码状态
      const timer = setInterval(async () => {
        try {
          const st = await httpRequest<{ data?: { state?: string } }>(
            'GET', `/v2/tool-usage/qrcode/status?key=${encodeURIComponent(url)}`
          );
          const s = st?.data?.state ?? '';
          setScanState(s);
          if (s === 'confirmed') {
            clearInterval(timer);
            await loadBindings();
            setQrcodeUrl('');
            setScanState('');
          } else if (s === 'expired') {
            clearInterval(timer);
            setScanState('expired');
          }
        } catch { /* 忽略 */ }
      }, 3000);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }, []);

  // ---- 解绑 ----
  const handleUnbind = async (id: number) => {
    try {
      await httpRequest('DELETE', `/v2/ai/bot-binding/${id}`);
      setBindings(prev => prev.filter(b => b.id !== id));
    } catch { /* 静默 */ }
  };

  // ---- 清理定时器 ----
  useEffect(() => () => {
    // cleanup handled by interval closure
  }, []);

  return (
    <div className='flex flex-col gap-16px'>
      {/* 绑定列表 */}
      <div>
        <div className='mb-8px flex items-center justify-between'>
          <span className='text-13px font-500'>已绑定 Bot（{bindings.length}）</span>
          <Button size='mini' type='primary' onClick={startScan}>+ 扫码绑定</Button>
        </div>
        <table className='w-full border-collapse text-13px'>
          <thead><tr>
            {['Bot ID', '昵称', '状态', '绑定时间', '操作'].map(h =>
              <th key={h} className='bg-fill-1 px-8px py-6px text-left text-t-secondary'>{h}</th>)}
          </tr></thead>
          <tbody>
            {bindings.length === 0 && (
              <tr><td colSpan={5} className='py-12px text-center text-t-secondary'>暂无绑定</td></tr>
            )}
            {bindings.map(b => (
              <tr key={b.id} className='hover:bg-fill-1'>
                <td className='px-8px py-5px font-mono'>{fmt(b.botId)}</td>
                <td className='px-8px py-5px'>{esc(b.nickname ?? '')}</td>
                <td className='px-8px py-5px'>{fmt(b.status)}</td>
                <td className='px-8px py-5px'>{fmt(b.bindTime)}</td>
                <td className='px-8px py-5px'>
                  <Button size='mini' status='danger' onClick={() => handleUnbind(b.id)}>解绑</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 二维码区域 */}
      {qrcodeUrl && (
        <div className='flex items-center gap-16px rounded-8px border p-12px'>
          <img src={qrcodeUrl} alt='二维码' width={160} height={160} />
          <div>
            <div>请使用微信扫描二维码</div>
            <Button size='mini' onClick={() => setQrcodeUrl('')}>取消</Button>
          </div>
        </div>
      )}

      {/* 扫码状态提示 */}
      {scanState === 'scanned' && <div>已扫码，请在微信上确认…</div>}
      {scanState === 'expired' && <div>二维码已过期</div>}
    </div>
  );
}

const HTML_ESC_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

function esc(s: string): string {
  return String(s ?? '').replace(/[&<>"]/g, (c: string) => HTML_ESC_MAP[c] ?? c);
}
