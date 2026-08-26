/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input, Table, Tag } from '@arco-design/web-react';
import { httpRequest } from '@/common/adapter/httpBridge';

const { Text } = Typography;

/* ── 类型 ── */

interface BotBindingRow {
  id: number;
  botId?: string;
  platform?: string;
  nickname?: string;
  status?: string;
  bindTime?: string;
}

interface QrState { url: string; key: string }
type ScanPhase = 'idle' | 'waiting' | 'scanned' | 'confirmed' | 'expired';

/* ── 常量 ── */

const ACCENT = '#7c5cff';
const BORDER = 'var(--color-border-2)';
const SURFACE = 'var(--color-fill-1)';

const fmt = (v: unknown): string =>
  v === null || v === undefined || v === '' ? '—' : String(v);

export default function BotManagementContent() {
  const [bindings, setBindings] = useState<BotBindingRow[]>([]);
  const [qr, setQr] = useState<QrState | null>(null);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadBindings = useCallback(async () => {
    try {
      const res = await httpRequest<{ data?: BotBindingRow[] }>('GET', '/v2/ai/bot-binding/list');
      if (res?.data) setBindings(res.data);
    } catch { /* 静默 */ }
  }, []);

  useEffect(() => { void loadBindings(); }, [loadBindings]);

  const startScan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpRequest<{ data?: QrState }>('POST', '/v2/tool-usage/qrcode');
      if (res?.data?.url) {
        setQr(res.data);
        setPhase('waiting');
        const timer = setInterval(async () => {
          try {
            const st = await httpRequest<{ data?: { state?: string } }>(
              'GET', `/v2/tool-usage/qrcode/status?key=${encodeURIComponent(res.data.key ?? '')}`
            );
            const s = st?.data?.state ?? '';
            setPhase(s as ScanPhase);
            if (s === 'confirmed') {
              clearInterval(timer);
              await loadBindings();
              setQr(null); setPhase('idle');
            } else if (s === 'expired') {
              clearInterval(timer); setPhase('expired');
            }
          } catch { /* ignore */ }
        }, 3000);
      }
    } catch { /* 静默 */ }
    finally { setLoading(false); }
  }, [loadBindings]);

  const handleUnbind = useCallback(async (id: number) => {
    try {
      await httpRequest('DELETE', `/v2/ai/bot-binding/${id}`);
      setBindings(prev => prev.filter(b => b.id !== id));
    } catch { /* 静默 */ }
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 状态卡 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12,
      }}>
        {[
          { label: '已绑定', value: bindings.length, color: ACCENT },
          { label: '在线', value: bindings.filter(b => b.status === 'online').length, color: '#00e676' },
          { label: '离线', value: bindings.filter(b => b.status !== 'online').length, color: '#6b7280' },
        ].map(s => (
          <div key={s.label} style={{
            background: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 绑定列表 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>已绑定</span>
          <Button size='small' type='primary' onClick={startScan}>+ 扫码绑定</Button>
        </div>
        <Table
          size='small'
          border={{ wrapper: true, cell: true }}
          pagination={false}
          columns={[
            { title: 'Bot ID', dataIndex: 'botId', ellipsis: true },
            { title: '昵称', dataIndex: 'nickname' },
            { title: '状态', dataIndex: 'status', width: 90,
              render: (_: unknown, r: BotBindingRow) =>
                <Tag size='small' color={r.status === 'online' ? 'green' : 'gray'}>{fmt(r.status)}</Tag> },
            { title: '绑定时间', dataIndex: 'bindTime', width: 160 },
            { title: '操作', width: 70,
              render: (_: unknown, r: BotBindingRow) =>
                <Button size='mini' status='danger'
                  onClick={() => handleUnbind(r.id)}>解绑</Button> },
          ]}
          data={bindings}
          noDataElement={<div style={{ textAlign: 'center', padding: 32 }}>暂无绑定</div>}
        />
      </div>

      {/* 扫码区域 */}
      {(qr || phase === 'waiting' || phase === 'scanned') && (
        <div style={{
          display: 'flex', gap: 20, padding: 20,
          background: `linear-gradient(135deg, ${SURFACE}, var(--color-bg-3))`,
          border: `1px solid ${ACCENT}33`, borderRadius: 12,
          boxShadow: `0 0 30px ${ACCENT}15`,
        }}>
          <img src={qr?.url} alt='QR' width={160} height={160}
            style={{ borderRadius: 8, background: '#fff' }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>微信扫码绑定</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
              打开微信扫一扫确认登录
            </div>
            {scanState === 'scanned' && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#00b42a' }}>
                ✓ 已扫码，等待确认
              </div>
            )}
            <Button size='mini' style={{ marginTop: 10 }} onClick={() => { setQr(null); setPhase('idle'); }}>
              取消
            </Button>
          </div>
        </div>
      )}

      {phase === 'expired' && (
        <div style={{ padding: 10, background: '#ff525214', borderRadius: 6, fontSize: 12, color: '#ff7875' }}>
          二维码已过期，请重新获取
        </div>
      )}
    </div>
  );
}
