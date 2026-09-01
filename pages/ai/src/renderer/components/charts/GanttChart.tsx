/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';

export interface GanttTask {
  id: string;
  label: string;
  start: number;
  end: number;
  status: 'completed' | 'running' | 'failed' | 'pending';
}

export interface GanttChartProps {
  tasks: GanttTask[];
  /** 自定义行标题宽度，默认 140 */
  rowWidth?: number;
  /** 自定义高度，默认自动 */
  height?: number;
  /** 空状态提示 */
  emptyText?: string;
}

const STATUS_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  completed: { bar: '#52c41a', text: '#389e0d', bg: '#f6ffed' },
  running: { bar: '#1677ff', text: '#0958d9', bg: '#e6f4ff' },
  failed: { bar: '#ff4d4f', text: '#cf1322', bg: '#fff2f0' },
  pending: { bar: '#d9d9d9', text: '#8c8c8c', bg: '#fafafa' },
};

const STATUS_LABELS: Record<string, string> = {
  completed: '已完成',
  running: '进行中',
  failed: '失败',
  pending: '等待中',
};

/** 格式化工时为 HH:MM */
function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 通用甘特图组件
 *
 * @example
 * <GanttChart
 *   tasks={[
 *     { id: '1', label: '任务A', start: Date.now()-3600000, end: Date.now(), status: 'running' },
 *   ]}
 * />
 */
const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  rowWidth = 140,
  height,
  emptyText = '暂无任务',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const hasTasks = tasks.length > 0;

  const minStart = useMemo(() => hasTasks ? Math.min(...tasks.map((t) => t.start)) : Date.now(), [tasks, hasTasks]);
  const maxEnd = useMemo(() => hasTasks ? Math.max(...tasks.map((t) => t.end)) : Date.now() + 3600000, [tasks, hasTasks]);
  const totalDuration = maxEnd - minStart || 1;

  const hours = useMemo(() => {
    if (!hasTasks) return [];
    const h: string[] = [];
    const start = new Date(minStart);
    start.setMinutes(0, 0, 0);
    const end = new Date(maxEnd);
    end.setMinutes(0, 0, 0);
    for (let t = start.getTime(); t <= end.getTime(); t += 3600_000) {
      h.push(fmtTime(t));
    }
    return h;
  }, [minStart, maxEnd, hasTasks]);

  const completedCount = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks]);
  const runningCount = useMemo(() => tasks.filter((t) => t.status === 'running').length, [tasks]);
  const failedCount = useMemo(() => tasks.filter((t) => t.status === 'failed').length, [tasks]);
  const pendingCount = useMemo(() => tasks.filter((t) => t.status === 'pending').length, [tasks]);

  if (!hasTasks) {
    return (
      <div style={{ width: '100%', fontSize: 12, color: '#86909c', textAlign: 'center', padding: '40px 0' }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', fontSize: 12, color: '#1d2129', height }}>
      {/* 图例 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([key, val]) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: val.bar, display: 'inline-block' }} />
            <span style={{ color: '#86909c' }}>{STATUS_LABELS[key]}</span>
          </span>
        ))}
      </div>

      {/* 甘特图主体 */}
      <div style={{ overflowX: 'auto', border: '1px solid #e5e6eb', borderRadius: 8 }}>
        {/* 时间头 */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e6eb', background: '#fafbfc' }}>
          <div style={{ width: rowWidth, minWidth: rowWidth, padding: '8px 12px', fontWeight: 600, color: '#86909c', borderRight: '1px solid #e5e6eb' }}>
            任务
          </div>
          <div style={{ flex: 1, display: 'flex', position: 'relative', height: 32 }}>
            {hours.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  lineHeight: '32px',
                  color: '#86909c',
                  borderRight: '1px solid #f0f0f0',
                  minWidth: 50,
                }}
              >
                {h}
              </div>
            ))}
          </div>
        </div>

        {/* 任务行 */}
        {tasks.map((task) => {
          const leftPct = ((task.start - minStart) / totalDuration) * 100;
          const widthPct = Math.max(((task.end - task.start) / totalDuration) * 100, 1.5);
          const colors = STATUS_COLORS[task.status];
          const isHovered = hoveredId === task.id;

          return (
            <div
              key={task.id}
              style={{
                display: 'flex',
                borderBottom: '1px solid #f0f0f0',
                transition: 'background 0.15s',
                background: isHovered ? '#f5f5f5' : 'transparent',
              }}
              onMouseEnter={() => setHoveredId(task.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                style={{
                  width: rowWidth,
                  minWidth: rowWidth,
                  padding: '10px 12px',
                  fontWeight: isHovered ? 600 : 400,
                  color: isHovered ? '#1677ff' : '#1d2129',
                  borderRight: '1px solid #e5e6eb',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                }}
              >
                {task.label}
              </div>
              <div style={{ flex: 1, position: 'relative', height: 40, padding: '6px 0' }}>
                {/* 竖线网格 */}
                {hours.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${(i / (hours.length - 1 || 1)) * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: '#f0f0f0',
                    }}
                  />
                ))}
                {/* 任务条 */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    top: 8,
                    bottom: 8,
                    minWidth: 6,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${colors.bar}, ${colors.bar}dd)`,
                    boxShadow: isHovered ? `0 2px 8px ${colors.bar}40` : 'none',
                    transition: 'box-shadow 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 6,
                    overflow: 'hidden',
                  }}
                >
                  {widthPct > 12 && (
                    <span style={{ fontSize: 10, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                      {fmtTime(task.start)} - {fmtTime(task.end)}
                    </span>
                  )}
                </div>
                {/* hover tooltip */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      top: -28,
                      background: '#1d2129',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                      pointerEvents: 'none',
                    }}
                  >
                    {fmtTime(task.start)} 至 {fmtTime(task.end)} · {STATUS_LABELS[task.status]}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 底部状态栏 */}
        <div style={{ display: 'flex', borderTop: '1px solid #e5e6eb', background: '#fafbfc' }}>
          <div style={{ width: rowWidth, minWidth: rowWidth, padding: '6px 12px', color: '#86909c', borderRight: '1px solid #e5e6eb' }}>
            {tasks.length} 个任务
          </div>
          <div style={{ flex: 1, padding: '6px 12px', color: '#86909c' }}>
            {completedCount} 完成 · {runningCount} 进行中 · {failedCount} 失败 · {pendingCount} 等待
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
