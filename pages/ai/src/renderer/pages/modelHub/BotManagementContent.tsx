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

const { Text } = Typography;

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

/** 格式化空值 */
const fmt = (v: unknown): string =>
  v === null || v === undefined || v === '' ? '—' : String(v);

export default function BotManagementContent() {
  const [bindings, setBindings] = useState<BotBindingRow[]>([]);
  const [qr, setQr] = useState<QrState | null>(null);
  const [scanState, setScanState] = useState<
    'idle' | 'waiting' | 'scanned' | 'confirmed' | 'expired'
  >('idle');
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- 加载绑定列表 ----
  const loadBindings = useCallback(async () => {
    try {
      const res = await httpRequest<{ data?: BotBindingRow[] }>(
        'GET', '/v2/ai/bot-binding/list'
      );
      if (res?.data) setBindings(res.data);
    } catch { /* 静默降级 */ }
  }, []);

  useEffect(() => { void loadBindings(); }, [loadBindings]);

  // ---- 扫码绑定 ----
  const startScan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpRequest<{ data?: QrState }>(
        'POST', '/v2/tool-usage/qrcode'
      );
      if (res?.data?.url) {
        setQr({ url: res.data.url, key: res.data.key ?? '' });
        setScanState('waiting');
        // 轮询扫码状态
        const timer = setInterval(async () => {
          try {
            const st = await httpRequest<{ data?: { state?: string } }>(
              'GET', `/v2/tool-usage/qrcode/status?key=${encodeURIComponent(res.data.key ?? '')}`
            );
            const s = st?.data?.state ?? '';
            setScanState(s as typeof scanState);
            if (s === 'confirmed') {
              clearInterval(timer);
              await loadBindings();
              setQr(null);
              setScanState('idle');
            } else if (s === 'expired') {
              clearInterval(timer);
              setScanState('expired');
            }
          } catch { /* 忽略轮询异常 */ }
        }, 3000);
      }
    } catch { /* 静默 */ }
    finally { setLoading(false); }
  }, [loadBindings]);

  // ---- 解绑 ----
  const handleUnbind = useCallback(async (id: number) => {
    try {
      await httpRequest('DELETE', `/v2/ai/bot-binding/${id}`);
      setBindings(prev => prev.filter(b => b.id !== id));
    } catch { /* 静默 */ }
  }, []);

  // ---- 清理定时器 ----
  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  return (
    <div className='flex flex-col gap-16px'>
      {/* ===== 已绑定 Bot 列表 ===== */}
      <div>
        <div className='mb-8px flex items-center justify-between'>
          <Text bold>已绑定 Bot（{bindings.length}）</Text>
          <Button
            size='small'
            type='primary'
            loading={loading}
            onClick={startScan}
          >
            + 扫码绑定
          </Button>
        </div>
        <Table
          size='small'
          border={{ wrapper: true, cell: true }}
          columns={[
            { title: 'Bot ID', dataIndex: 'botId', ellipsis: true },
            { title: '昵称', dataIndex: 'nickname' },
            {
              title: '状态', dataIndex: 'status', width: 90,
              render: (_: unknown, row: BotBindingRow) => (
                <Tag color={row.status === 'online' ? 'green' : 'gray'} size='small'>
                  {fmt(row.status)}
                </Tag>
              ),
            },
            { title: '绑定时间', dataIndex: 'bindTime', width: 160 },
            {
              title: '操作', dataIndex: 'op', width: 70,
              render: (_: unknown, row: BotBindingRow) => (
                <Button
                  size='mini' status='danger'
                  onClick={() => void handleUnbind(row.id)}
                >
                  解绑
                </Button>
              ),
            },
          ]}
          data={bindings}
          pagination={false}
          noDataElement={<div className='py-12px text-center text-t-secondary'>暂无绑定</div>}
        />
      </div>

      {/* ===== 二维码扫码区域 ===== */}
      {qr && (
        <div className='flex items-center gap-20px rounded-8px border border-[var(--color-border-2)] bg-[var(--color-fill-1)] p-16px'>
          <img
            src={qr.url}
            alt='登录二维码'
            width={180}
            height={180}
            className='rounded-4px'
          />
          <div className='flex flex-col gap-6px'>
            <Text bold>微信扫码绑定</Text>
            <Text type='secondary' style={{ fontSize: 12 }}>
              打开微信扫一扫，确认后完成绑定
            </Text>
            {scanState === 'scanned' && (
              <Text type='success' style={{ fontSize: 12 }}>✓ 已扫码，请在微信上确认</Text>
            )}
            {scanState === 'expired' && (
              <Text type='error' style={{ fontSize: 12 }}>二维码已过期，请刷新</Text>
            )}
            <Button
              size='mini'
              onClick={() => { setQr(null); setScanState('idle'); }}
            >
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
