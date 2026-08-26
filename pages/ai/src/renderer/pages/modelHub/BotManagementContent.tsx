/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Input,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react';
import { httpRequest } from '@/common/adapter/httpBridge';

const { Text, Title } = Typography;

/* ── 类型 ─────────────────────────────────────────── */

interface BotBindingRow {
  id: number;
  botId?: string;
  platform?: string;
  nickname?: string;
  status?: string;
  bindTime?: string;
}

interface QrState {
  url: string;
  key: string;
}

type ScanPhase = 'idle' | 'waiting' | 'scanned' | 'confirmed' | 'expired';

/* ── 样式常量 ─────────────────────────────────────── */

const ACCENT = '#7c5cff';
const ACCENT_DIM = '#9d85ff';
const SURFACE = 'var(--color-bg-2, #171a21)';
const SURFACE_RAISED = 'var(--color-fill-1, #1e2230)';
const BORDER = 'var(--color-border-2, #2a2f3e)';
const TEXT_PRIMARY = 'var(--color-text-1, #e8eaf0)';
const TEXT_SECONDARY = 'var(--color-text-3, #7c8399)';

/* ── 工具 ─────────────────────────────────────────── */

const fmt = (v: unknown): string =>
  v === null || v === undefined || v === '' ? '—' : String(v);

/** 状态点颜色 */
const statusDot = (s?: string): string =>
  s === 'online' ? '#00e676' : s === 'expired' ? '#ff5252' : '#6b7280';

/** 状态标签文本 */
const statusLabel = (s?: string): string =>
  s === 'online' ? '在线' : s === 'expired' ? '已过期' : '离线';

/* ── 子组件 ───────────────────────────────────────── */

/** 区域标题 */
const SectionHeader: React.FC<{ title: string; extra?: React.ReactNode }> = ({
  title,
  extra,
}) => (
  <div className='mb-12px flex items-center justify-between'>
    <div className='flex items-center gap-8px'>
      <span
        style={{
          width: 3, height: 14, borderRadius: 2,
          background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT_DIM})`,
        }}
      />
      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY }}>{title}</span>
    </div>
    {extra}
  </div>
);

/** 状态指示灯 + 文字 */
const StatusPill: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <span
      style={{
        width: 7, height: 7, borderRadius: '50%', background: color,
        boxShadow: `0 0 6px ${color}66`,
      }}
    />
    <span style={{ fontSize: 12, color: TEXT_SECONDARY }}>{label}</span>
  </span>
);

/* ── 主组件 ───────────────────────────────────────── */

export default function BotManagementContent() {
  const [bindings, setBindings] = useState<BotBindingRow[]>([]);
  const [qr, setQr] = useState<QrState | null>(null);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- 加载绑定列表 ---- */
  const loadBindings = useCallback(async () => {
    try {
      const res = await httpRequest<{ data?: BotBindingRow[] }>(
        'GET', '/v2/ai/bot-binding/list'
      );
      if (res?.data) setBindings(res.data);
    } catch { /* 静默降级 */ }
  }, []);

  useEffect(() => { void loadBindings(); }, [loadBindings]);

  /* ---- 扫码绑定 ---- */
  const startScan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpRequest<{ data?: QrState }>(
        'POST', '/v2/tool-usage/qrcode'
      );
      if (res?.data?.url) {
        setQr(res.data);
        setPhase('waiting');
        const timer = setInterval(async () => {
          try {
            const st = await httpRequest<{ data?: { state?: string } }>(
              'GET',
              `/v2/tool-usage/qrcode/status?key=${encodeURIComponent(res.data.key ?? '')}`
            );
            const s = st?.data?.state ?? '';
            setPhase(s as ScanPhase);
            if (s === 'confirmed') {
              clearInterval(timer);
              await loadBindings();
              setQr(null);
              setPhase('idle');
            } else if (s === 'expired') {
              clearInterval(timer);
              setPhase('expired');
            }
          } catch { /* 忽略 */ }
        }, 3000);
      }
    } catch { /* 静默 */ }
    finally { setLoading(false); }
  }, [loadBindings]);

  /* ---- 解绑 ---- */
  const handleUnbind = useCallback(async (id: number) => {
    try {
      await httpRequest('DELETE', `/v2/ai/bot-binding/${id}`);
      setBindings(prev => prev.filter(b => b.id !== id));
    } catch { /* 静默 */ }
  }, []);

  /* ---- 清理 ---- */
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  /* ══════ 渲染 ══════ */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ═══ 状态概览卡 ═══ */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
        }}
      >
        {[
          { label: '已绑定', value: bindings.length, accent: ACCENT },
          { label: '在线', value: bindings.filter(b => b.status === 'online').length, accent: '#00e676' },
          { label: '离线', value: bindings.filter(b => b.status !== 'online').length, accent: '#6b7280' },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: SURFACE_RAISED,
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginBottom: 4 }}>
              {stat.label}
            </div>
            <div
              style={{
                fontSize: 26, fontWeight: 700, lineHeight: 1,
                color: stat.accent,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ 绑定列表 ═══ */}
      <SectionHeader
        title='已绑定 Bot'
        extra={
          <Button size='small' type='primary' loading={loading} onClick={startScan}>
            + 扫码绑定
          </Button>
        }
      />
      {bindings.length > 0 ? (
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {bindings.map((b, idx) => (
            <div
              key={b.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: idx < bindings.length - 1 ? `1px solid ${BORDER}` : 'none',
                background: idx % 2 === 0 ? 'transparent' : `${SURFACE_RAISED}80`,
              }}
            >
              {/* 状态点 */}
              <StatusPill
                color={statusDot(b.status)}
                label={statusLabel(b.status)}
              />
              {/* 信息 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>
                  {fmt(b.nickname) || fmt(b.botId)}
                </div>
                <div style={{ fontSize: 11, color: TEXT_SECONDARY }}>
                  {fmt(b.platform)} · {fmt(b.bindTime)}
                </div>
              </div>
              {/* 操作 */}
              <Button size='mini' status='danger' onClick={() => void handleUnbind(b.id)}>
                解绑
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center', padding: '32px 16px',
            color: TEXT_SECONDARY, fontSize: 13,
            border: `1px dashed ${BORDER}`, borderRadius: 10,
          }}
        >
          暂无绑定 · 点击上方「扫码绑定」开始
        </div>
      )}

      {/* ═══ 扫码区域 ═══ */}
      {(qr || phase === 'waiting' || phase === 'scanned') && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 24,
            padding: '24px 28px',
            background: `linear-gradient(135deg, ${SURFACE_RAISED}, var(--color-bg-3, #141824))`,
            border: `1px solid ${ACCENT}33`,
            borderRadius: 12,
            boxShadow: `0 0 40px ${ACCENT}11`,
          }}
        >
          {/* 二维码图 */}
          <div
            style={{
              width: 160, height: 160,
              background: '#fff', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden', flexShrink: 0,
            }}
          >
            {qr?.url && (
              <img src={qr.url} alt='QR' style={{ width: '100%', height: '100%' }} />
            )}
            {phase === 'waiting' && !qr?.url && (
              <div style={{ color: '#999', fontSize: 12 }}>生成中…</div>
            )}
            {phase === 'scanned' && (
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(255,255,255,.92)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <div
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: '#00e676', opacity: .15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span style={{ color: '#00b42a', fontSize: 24 }}>✓</span>
                </div>
                <span style={{ color: '#00b42a', fontSize: 13, fontWeight: 600 }}>
                  已扫码
                </span>
              </div>
            )}
          </div>

          {/* 说明文字 */}
          <div style={{ flex: 1 }}>
            <Title heading={6} style={{ margin: 0, color: TEXT_PRIMARY }}>
              微信扫码绑定
            </Title>
            <Text type='secondary' style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              打开微信扫一扫，确认后完成绑定
            </Text>
            {phase === 'scanned' && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#00e676' }}>
                ✓ 已扫码，等待确认…
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <Button
                size='mini' onClick={() => { setQr(null); setPhase('idle'); }}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {phase === 'expired' && (
        <div
          style={{
            padding: '10px 14px', borderRadius: 8,
            background: '#ff525214', fontSize: 12, color: '#ff7875',
          }}
        >
          二维码已过期，请重新获取
        </div>
      )}

      {/* 底部提示 */}
      {!qr && phase !== 'scanned' && phase !== 'expired' && (
        <div
          style={{
            fontSize: 11, color: TEXT_SECONDARY, opacity: .6,
            borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginTop: 4,
          }}
        >
          提示：绑定后可通过微信与 AI 对话、接收推送通知。
          部分平台需要登录后才能获取二维码，请确保网络畅通。
        </div>
      )}
    </div>
  );
}
