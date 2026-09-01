/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';

export interface ActivityCell {
  date: string;
  dateLabel: string;
  count: number;
}

export interface HeatmapChartProps {
  /** 每日活动数据 */
  cells: ActivityCell[];
  /** 统计摘要 */
  summary?: {
    total?: number;
    streak?: number;
    totalLabel?: string;
    streakLabel?: string;
  };
  /** 自定义层级 */
  levels?: { min: number; color: string; label: string }[];
  /** 空状态提示 */
  emptyText?: string;
}

const DEFAULT_LEVELS = [
  { min: 0, color: '#ebedf0', label: '无活动' },
  { min: 1, color: '#9be9a8', label: '1-2 次' },
  { min: 3, color: '#40c463', label: '3-5 次' },
  { min: 6, color: '#30a14e', label: '6-9 次' },
  { min: 10, color: '#216e39', label: '10+ 次' },
];

const DAY_LABELS = ['', '一', '', '二', '', '三', ''];
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function getLevelColor(count: number, levels: { min: number; color: string; label: string }[]): string {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (count >= levels[i].min) return levels[i].color;
  }
  return levels[0].color;
}

function getLevelLabel(count: number, levels: { min: number; color: string; label: string }[]): string {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (count >= levels[i].min) return levels[i].label;
  }
  return levels[0].label;
}

/** 计算月份标签位置 */
function getMonthPositions(cells: ActivityCell[]): { label: string; week: number }[] {
  const months: { label: string; week: number }[] = [];
  let lastMonth = -1;
  cells.forEach((cell) => {
    const month = new Date(cell.date).getMonth();
    if (month !== lastMonth) {
      const week = Math.floor((cells.length - 1 - cells.findIndex((c) => c.date === cell.date)) / 7);
      months.push({ label: MONTH_LABELS[month], week });
      lastMonth = month;
    }
  });
  return months.reverse();
}

/**
 * 通用活跃热力图组件（GitHub 风格）
 *
 * @example
 * <HeatmapChart
 *   cells={[
 *     { date: '2024-01-01', dateLabel: '1月1日 周一', count: 5 },
 *   ]}
 *   summary={{ total: 1234, streak: 10 }}
 * />
 */
const HeatmapChart: React.FC<HeatmapChartProps> = ({
  cells,
  summary,
  levels = DEFAULT_LEVELS,
  emptyText = '暂无活动数据',
}) => {
  const [hovered, setHovered] = useState<ActivityCell | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const hasCells = cells.length > 0;

  const totalContributions = useMemo(() => hasCells ? cells.reduce((sum, c) => sum + c.count, 0) : 0, [cells, hasCells]);
  const streakDays = useMemo(() => {
    if (!hasCells) return 0;
    let streak = 0;
    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i].count > 0) streak++;
      else break;
    }
    return streak;
  }, [cells, hasCells]);

  const weeksCount = useMemo(() => {
    if (!hasCells) return 0;
    return cells.length > 0 ? Math.ceil(cells.length / 7) : 0;
  }, [cells, hasCells]);

  const monthLabels = useMemo(() => getMonthPositions(cells), [cells]);

  const CELL_SIZE = 12;
  const CELL_GAP = 3;

  if (!hasCells) {
    return (
      <div style={{ width: '100%', fontSize: 12, color: '#86909c', textAlign: 'center', padding: '40px 0' }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', fontSize: 12, color: '#1d2129' }}>
      {/* 统计摘要 */}
      {(summary?.total !== undefined || summary?.streak !== undefined || totalContributions > 0 || streakDays > 0) && (
        <div style={{ display: 'flex', gap: 24, marginBottom: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1d2129', lineHeight: 1.2 }}>
              {summary?.total ?? totalContributions}.toLocaleString()
            </div>
            <div style={{ color: '#86909c', marginTop: 2 }}>{summary?.totalLabel ?? '过去活跃'}</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1677ff', lineHeight: 1.2 }}>{streakDays}</div>
            <div style={{ color: '#86909c', marginTop: 2 }}>{summary?.streakLabel ?? '当前连续天数'}</div>
          </div>
        </div>
      )}

      {/* 热力图主体 */}
      <div
        style={{
          overflowX: 'auto',
          border: '1px solid #e5e6eb',
          borderRadius: 8,
          padding: '12px 16px',
          background: '#fff',
        }}
      >
        {/* 月份标签 */}
        {monthLabels.length > 0 && (
          <div style={{ display: 'flex', marginBottom: 4, paddingLeft: CELL_SIZE + CELL_GAP, position: 'relative', height: 16 }}>
            {monthLabels.map((m, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: m.week * (CELL_SIZE + CELL_GAP),
                  fontSize: 11,
                  color: '#86909c',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
          {/* 星期标签 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: CELL_GAP, marginRight: 6 }}>
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: '#86909c',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* 热力格子 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${weeksCount}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
              gap: CELL_GAP,
            }}
          >
            {cells.map((cell) => (
              <div
                key={cell.date}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  borderRadius: 2,
                  background: getLevelColor(cell.count, levels),
                  cursor: 'pointer',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                  transform: hovered?.date === cell.date ? 'scale(1.6)' : 'scale(1)',
                  boxShadow: hovered?.date === cell.date ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                  position: 'relative',
                  zIndex: hovered?.date === cell.date ? 10 : 1,
                }}
                onMouseEnter={(e) => {
                  setHovered(cell);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
                }}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </div>
        </div>

        {/* 图例 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, color: '#86909c' }}>少</span>
          {levels.map((level, i) => (
            <div
              key={i}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: 2,
                background: level.color,
              }}
            />
          ))}
          <span style={{ fontSize: 11, color: '#86909c' }}>多</span>
        </div>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: 'translate(-50%, -100%)',
            background: '#1d2129',
            color: '#fff',
            padding: '4px 10px',
            borderRadius: 4,
            fontSize: 11,
            whiteSpace: 'nowrap',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 600 }}>{hovered.count} 次活动</div>
          <div style={{ opacity: 0.8 }}>{hovered.dateLabel}</div>
        </div>
      )}
    </div>
  );
};

export default HeatmapChart;
