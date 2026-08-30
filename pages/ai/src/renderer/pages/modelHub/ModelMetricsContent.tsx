/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { httpRequest } from '@/common/adapter/httpBridge';
import { Input } from '@arco-design/web-react';
import { Brain, Search } from '@icon-park/react';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';

interface MetricsModelRow {
  id: string;
  name?: string;
  description?: string;
  capabilities?: string[];
  price_input_per_musd?: number;
  price_output_per_musd?: number;
  intelligence_index?: number;
  output_speed_tps?: number;
  latency_first_token_seconds?: number;
  icon_url?: string;
  reasoning_model?: boolean;
  web_search?: boolean;
  image_input?: boolean;
}

type SortKey = keyof MetricsModelRow;

const COLUMNS: { key: SortKey | ''; label: string; num: boolean }[] = [
  { key: '', label: '', num: false },
  { key: 'id', label: '模型 ID', num: false },
  { key: 'name', label: '名称', num: false },
  { key: 'price_input_per_musd', label: '输入 $/M', num: true },
  { key: 'price_output_per_musd', label: '输出 $/M', num: true },
  { key: 'intelligence_index', label: '智能指数', num: true },
  { key: 'output_speed_tps', label: '速度 T/s', num: true },
  { key: 'latency_first_token_seconds', label: '首块延迟 s', num: true },
];

/** 能力 badge 列（不排序） */
const CAPABILITY_BADGES = [
  { key: 'reasoning_model' as const, label: '深度思考', icon: <Brain theme='outline' size='10' strokeWidth={3} /> },
  { key: 'web_search' as const, label: '联网查询', icon: <Search theme='outline' size='10' strokeWidth={3} /> },
  { key: 'image_input' as const, label: '图片识别', icon: null },
] as const;

/** 数值列格式化：空值显示占位符 */
const fmt = (v: unknown): string =>
  v === null || v === undefined || v === '' ? '—' : String(v);

/**
 * 模型价格与指标面板。
 *
 * <p>读取后端统一模型列表（含 Artificial Analysis 价格与指标扩展字段），
 * 提供过滤与按数值列排序。</p>
 */
const ModelMetricsContent: React.FC = () => {
  const [rows, setRows] = useState<MetricsModelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('intelligence_index');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    httpRequest<{ data: MetricsModelRow[] }>('GET', '/v2/v1/models')
      .then((res) => {
        if (!active) return;
        setRows((res?.data ?? []) as MetricsModelRow[]);
        setError('');
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const kw = filter.trim().toLowerCase();
    const filtered = kw
      ? rows.filter((r) =>
          `${r.id} ${r.name ?? ''} ${r.description ?? ''}`
            .toLowerCase()
            .includes(kw),
        )
      : rows;
    const sorted = [...filtered].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDesc ? vb - va : va - vb;
      }
      return String(va ?? '').localeCompare(String(vb ?? ''));
    });
    return sorted;
  }, [rows, filter, sortKey]);

  const handleSort = (key: SortKey | '') => {
    if (!key) return;
    if (sortKey === key) {
      setSortDesc((d) => !d);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  if (error) {
    return (
      <div className='py-24px text-center text-t-secondary'>加载失败：{error}</div>
    );
  }

  return (
    <div className='flex flex-col gap-10px'>
      <Input
        allowClear
        placeholder='过滤：输入关键字…'
        value={filter}
        onChange={setFilter}
        className='max-w-320px'
      />
      <NomiScrollArea className='max-h-[70vh]'>
        <table className='w-full border-collapse text-13px'>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.label}
                  onClick={() => handleSort(c.key)}
                  className='sticky top-0 z-1 cursor-pointer bg-fill-1 px-10px py-8px text-left text-t-secondary select-none'
                >
                  {c.label}
                  {sortKey === c.key ? (sortDesc ? ' ↓' : ' ↑') : ''}
                </th>
              ))}
              <th className='sticky top-0 z-1 bg-fill-1 px-10px py-8px text-left text-t-secondary'>
                能力
              </th>
              {CAPABILITY_BADGES.map((b) => (
                <th key={b.key} className='sticky top-0 z-1 bg-fill-1 px-8px py-8px text-center text-t-secondary'>
                  {b.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={COLUMNS.length + 1 + CAPABILITY_BADGES.length} className='px-10px py-20px text-center text-t-secondary'>
                  加载中…
                </td>
              </tr>
            )}
            {!loading &&
              visible.map((m) => (
                <tr key={m.id} className='hover:bg-fill-1'>
                  <td className='px-10px py-6px'>
                    {m.icon_url && (
                      <img
                        src={m.icon_url}
                        alt=''
                        width={18}
                        height={18}
                        className='rd-4px align-middle'
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </td>
                  <td className='px-10px py-6px font-mono'>{m.id}</td>
                  <td className='px-10px py-6px'>{m.name ?? '—'}</td>
                  <td className='num px-10px py-6px text-right'>{fmt(m.price_input_per_musd)}</td>
                  <td className='num px-10px py-6px text-right'>{fmt(m.price_output_per_musd)}</td>
                  <td className='num px-10px py-6px text-right'>{fmt(m.intelligence_index)}</td>
                  <td className='num px-10px py-6px text-right'>{fmt(m.output_speed_tps)}</td>
                  <td className='num px-10px py-6px text-right'>{fmt(m.latency_first_token_seconds)}</td>
              <td className='px-10px py-6px'>
                    {(m.capabilities ?? []).map((c) => (
                      <span
                        key={c}
                        className='mr-2px inline-block rounded-4px bg-fill-2 px-6px py-1px text-11px text-t-secondary'
                      >
                        {c}
                      </span>
                    ))}
                  </td>
                  {CAPABILITY_BADGES.map((b) => (
                    <td key={b.key} className='px-8px py-6px text-center'>
                      {m[b.key] ? (
                        <span className='inline-flex items-center gap-3px text-11px text-primary-6' title={b.label}>
                          {b.icon}
                          ✓
                        </span>
                      ) : (
                        <span className='text-11px text-t-tertiary'>—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1 + CAPABILITY_BADGES.length} className='py-20px text-center text-t-secondary'>
                  无匹配数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </NomiScrollArea>
      {!loading && (
        <div className='text-12px text-t-tertiary'>共 {visible.length} 个模型</div>
      )}
    </div>
  );
};

export default ModelMetricsContent;
