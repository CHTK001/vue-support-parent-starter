/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@arco-design/web-react';
import { httpRequest } from '@/common/adapter/httpBridge';

interface LocalUsageRow {
  id?: number;
  provider?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  callTime?: string;
}

interface CompressionRow {
  sysAiSessionCompressionId?: number;
  sysAiSessionId?: number;
  sysAiManufacturerCode?: string;
  sysAiCompressionMessageCount?: number;
  sysAiCompressionContext?: string;
  createTime?: string;
}

const fmt = (v: unknown): string =>
  v === null || v === undefined || v === '' ? '—' : String(v);

const ESC_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

const esc = (s: string): string =>
  String(s ?? '').replace(/[&<>"]/g, (c: string) => ESC_MAP[c] ?? c);

/**
 * 本地工具用量与压缩记录面板。
 *
 * <p>展示从本地 AI 工具同步的用量明细、压缩上下文记录，
 * 并提供手动触发同步的按钮。</p>
 */
const LocalToolUsageContent: React.FC = () => {
  const [rows, setRows] = useState<LocalUsageRow[]>([]);
  const [compressions, setCompressions] = useState<CompressionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const usageRes = await httpRequest<LocalUsageRow[]>('GET', '/v2/tool-usage/list');
      setRows(usageRes ?? []);
      const compRes = await httpRequest<CompressionRow[]>('GET', '/v2/tool-usage/compressions');
      setCompressions(compRes ?? []);
    } catch (e) {
      setMessage('加载失败：' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await httpRequest('POST', '/v2/tool-usage/sync');
      await loadList();
      setMessage('');
    } catch (e) {
      setMessage('同步失败：' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className='flex flex-col gap-14px'>
      <div className='flex items-center justify-between'>
        <span className='text-13px text-t-secondary'>
          从本机 AI 工具（Claude Code、Codex++ 等）同步用量到本地库
        </span>
        <Button size='small' loading={syncing} onClick={handleSync}>
          立即同步
        </Button>
      </div>
      {message && (
        <div className='text-12px text-warning-6'>{esc(message)}</div>
      )}

      {/* 用量表 */}
      <table className='w-full border-collapse text-13px'>
        <thead>
          <tr>
            {['时间', '来源', '模型', '输入 tok', '输出 tok', '总 tok'].map((h) => (
              <th key={h} className='bg-fill-1 px-10px py-6px text-left text-t-secondary'>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={6} className='py-16px text-center text-t-secondary'>暂无数据</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className='hover:bg-fill-1'>
              <td className='px-10px py-5px'>{fmt(r.callTime)}</td>
              <td className='px-10px py-5px'>{esc(r.provider ?? '')}</td>
              <td className='px-10px py-5px'>{esc(r.model ?? '')}</td>
              <td className='num px-10px py-5px text-right'>{fmt(r.promptTokens)}</td>
              <td className='num px-10px py-5px text-right'>{fmt(r.completionTokens)}</td>
              <td className='num px-10px py-5px text-right'>{fmt(r.totalTokens)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 压缩记录表 */}
      <div className='mt-8px text-13px font-600 text-t-primary'>压缩上下文记录</div>
      <table className='w-full border-collapse text-13px'>
        <thead>
          <tr>
            {['会话 ID', '厂商', '消息数', '创建时间'].map((h) => (
              <th key={h} className='bg-fill-1 px-10px py-6px text-left text-t-secondary'>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {compressions.length === 0 && (
            <tr><td colSpan={4} className='py-16px text-center text-t-secondary'>暂无压缩记录</td></tr>
          )}
          {compressions.map((c, i) => (
            <tr key={c.sysAiSessionCompressionId ?? i} className='hover:bg-fill-1'>
              <td className='px-10px py-5px'>{fmt(c.sysAiSessionId)}</td>
              <td className='px-10px py-5px'>{esc(c.sysAiManufacturerCode ?? '')}</td>
              <td className='px-10px py-5px'>{fmt(c.sysAiCompressionMessageCount)}</td>
              <td className='px-10px py-5px'>{fmt(c.createTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LocalToolUsageContent;
