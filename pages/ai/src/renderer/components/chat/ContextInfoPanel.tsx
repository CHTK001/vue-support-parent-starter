/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 *
 * 会话上下文信息面板
 * 显示当前会话的上下文容量、各部分占比、缓存命中率、余额、模型信息等
 */

import React, { useMemo, useState } from 'react';
import { Tooltip } from '@arco-design/web-react';
import { Info } from '@icon-park/react';

/** 上下文各部分占比 */
interface ContextBreakdown {
  label: string;
  percent: number;
  color: string;
}

/** 上下文信息数据 */
interface ContextInfoData {
  /** 已用上下文（token数） */
  usedTokens: number;
  /** 总上下文容量（token数） */
  totalTokens: number;
  /** 各部分占比 */
  breakdown: ContextBreakdown[];
  /** 平均缓存命中率 */
  cacheHitRate: number;
  /** 今日余额（元） */
  todayBalance: number;
  /** 配额使用百分比 */
  quotaPercent: number;
  /** 当前模型名称 */
  modelName: string;
  /** 模型使用百分比 */
  modelPercent: number;
  /** 模型日期 */
  modelDate: string;
}

/** 默认模拟数据 */
const DEFAULT_DATA: ContextInfoData = {
  usedTokens: 138000,
  totalTokens: 1000000,
  breakdown: [
    { label: '消息', percent: 86.9, color: '#165DFF' },
    { label: '系统工具', percent: 9.4, color: '#00B42A' },
    { label: '技能', percent: 1.7, color: '#FF7D00' },
    { label: '系统提示词', percent: 1.3, color: '#722ED1' },
    { label: 'MCP工具', percent: 0.6, color: '#F53F3F' },
    { label: '其他', percent: 0.2, color: '#86909C' },
  ],
  cacheHitRate: 98,
  todayBalance: 0,
  quotaPercent: 150,
  modelName: 'GLM-5.3-Flash',
  modelPercent: 67,
  modelDate: '9月14日',
};

/** 格式化token数 */
function formatTokens(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

/** 进度条组件 */
const ProgressBar: React.FC<{
  percent: number;
  color?: string;
  height?: number;
}> = ({ percent, color = '#165DFF', height = 6 }) => (
  <div
    className='w-full overflow-hidden rounded-full bg-[var(--color-fill-3)]'
    style={{ height }}
  >
    <div
      className='h-full rounded-full transition-all duration-300'
      style={{
        width: `${Math.min(100, Math.max(0, percent))}%`,
        backgroundColor: color,
      }}
    />
  </div>
);

/** 上下文信息面板 */
export const ContextInfoPanel: React.FC<{
  data?: Partial<ContextInfoData>;
  modelName?: string;
}> = ({ data, modelName }) => {
  const [expanded, setExpanded] = useState(true);

  const merged = useMemo<ContextInfoData>(() => ({
    ...DEFAULT_DATA,
    ...data,
    modelName: modelName || data?.modelName || DEFAULT_DATA.modelName,
  }), [data, modelName]);

  const usagePercent = (merged.usedTokens / merged.totalTokens) * 100;

  return (
    <div className='shrink-0 border-b border-solid border-[var(--color-border-2)] bg-[var(--color-fill-1)]'>
      {/* 头部：标题 + 展开/收起 */}
      <div
        className='flex cursor-pointer items-center justify-between px-12px py-8px hover:bg-[var(--color-fill-2)]'
        onClick={() => setExpanded(!expanded)}
      >
        <div className='flex items-center gap-x-6px'>
          <span className='text-13px font-500 text-t-primary'>上下文信息</span>
          <Tooltip content='当前会话的上下文使用情况'>
            <Info theme='outline' size='14' className='text-t-tertiary' />
          </Tooltip>
        </div>
        <span className='text-11px text-t-tertiary'>
          {expanded ? '收起' : '展开'}
        </span>
      </div>

      {expanded && (
        <div className='space-y-10px px-12px pb-12px'>
          {/* 上下文容量 */}
          <div>
            <div className='mb-4px flex items-center justify-between'>
              <span className='text-12px text-t-secondary'>上下文容量</span>
              <span className='text-12px font-500 text-t-primary'>
                {formatTokens(merged.usedTokens)}/{formatTokens(merged.totalTokens)}
                <span className='ml-4px text-t-tertiary'>({usagePercent.toFixed(1)}%)</span>
              </span>
            </div>
            <ProgressBar percent={usagePercent} color='#165DFF' />
          </div>

          {/* 各部分占比 */}
          <div className='space-y-4px'>
            {merged.breakdown.map((item) => (
              <div key={item.label} className='flex items-center gap-x-8px'>
                <span
                  className='inline-block h-8px w-8px shrink-0 rounded-full'
                  style={{ backgroundColor: item.color }}
                />
                <span className='flex-1 truncate text-11px text-t-secondary'>{item.label}</span>
                <span className='shrink-0 text-11px font-400 text-t-tertiary'>{item.percent}%</span>
              </div>
            ))}
          </div>

          {/* 分隔线 */}
          <div className='border-t border-solid border-[var(--color-border-2)]' />

          {/* 缓存命中率 */}
          <div className='flex items-center justify-between'>
            <span className='text-12px text-t-secondary'>平均缓存命中率</span>
            <span className='text-12px font-500 text-[#00B42A]'>{merged.cacheHitRate}%</span>
          </div>

          {/* 今日余额/配额 */}
          <div className='flex items-center justify-between'>
            <span className='text-12px text-t-secondary'>今日余额</span>
            <div className='flex items-center gap-x-6px'>
              <span className='text-12px font-500 text-t-primary'>¥{merged.todayBalance.toFixed(2)}</span>
              <span className='rounded bg-[var(--color-fill-3)] px-4px py-1px text-10px text-t-secondary'>
                升级 {merged.quotaPercent}% 配额
              </span>
            </div>
          </div>

          {/* 分隔线 */}
          <div className='border-t border-solid border-[var(--color-border-2)]' />

          {/* 模型信息 */}
          <div>
            <div className='mb-4px flex items-center justify-between'>
              <span className='text-12px text-t-secondary'>当前模型</span>
              <span className='text-12px font-500 text-t-primary'>{merged.modelName}</span>
            </div>
            <div className='mb-4px flex items-center justify-between'>
              <span className='text-11px text-t-tertiary'>{merged.modelPercent}% · {merged.modelDate}</span>
            </div>
            <ProgressBar percent={merged.modelPercent} color='#722ED1' height={4} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextInfoPanel;
