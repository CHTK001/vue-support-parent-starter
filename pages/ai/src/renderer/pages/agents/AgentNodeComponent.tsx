/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Node } from '@antv/x6';

export interface AgentNodeData {
  label: string;
  kind: 'master' | 'sub-agent';
  model?: string;
  status?: 'active' | 'idle' | 'error';
  description?: string;
  created_at?: number;
}

interface AgentNodeComponentProps {
  node: Node;
}

const STATUS_COLORS = {
  active: '#22c55e',
  idle: '#64748b',
  error: '#ef4444',
} as const;

const STATUS_LABELS: Record<string, string> = {
  active: '运行中',
  idle: '空闲',
  error: '错误',
};

const fmtTime = (ts?: number): string => {
  if (!ts) return '-';
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const AgentIcon: React.FC<{ kind: 'master' | 'sub-agent' }> = ({ kind }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm0 2h-2v2h2v-2zm4-2h-2V8h2v8zm0 2h-2v2h2v-2z" fill="currentColor" opacity="0.3" />
    {kind === 'master' && (
      <path d="M17 8l2-2 1 1-2 2-1-1zm-7-4l1-1h2l1 1-1 1h-2l-1-1z" fill="currentColor" opacity="0.6" />
    )}
  </svg>
);

const AgentNodeComponent: React.FC<AgentNodeComponentProps> = ({ node }) => {
  const { label = '', kind = 'sub-agent', model, status = 'idle', description, created_at } = (node.getData() as AgentNodeData) || {};
  const [hovered, setHovered] = React.useState(false);

  const isMaster = kind === 'master';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-1px)' : 'none',
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 卡片主体 */}
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: isMaster ? 14 : 10,
        background: isMaster
          ? 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: `1.5px solid ${isMaster ? '#3b82f6' : '#334155'}`,
        boxShadow: hovered
          ? isMaster ? '0 8px 24px rgba(59,130,246,0.25)' : '0 4px 16px rgba(0,0,0,0.4)'
          : isMaster ? '0 4px 12px rgba(59,130,246,0.15)' : '0 2px 8px rgba(0,0,0,0.3)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        overflow: 'hidden',
      }}>
        {/* 图标 */}
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: isMaster ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #475569, #334155)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#fff',
        }}>
          <AgentIcon kind={kind} />
        </div>

        {/* 文本 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: isMaster ? '#f1f5f9' : '#e2e8f0',
            lineHeight: '18px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </div>
          <div style={{
            fontSize: 11,
            color: '#64748b',
            lineHeight: '16px',
            marginTop: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {isMaster ? '主 Agent' : '子 Agent'}
            {model ? ` · ${model}` : ''}
          </div>
        </div>

        {/* 状态点 */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: STATUS_COLORS[status],
            flexShrink: 0,
            boxShadow: status === 'active' ? `0 0 6px ${STATUS_COLORS.active}` : 'none',
          }}
          title={STATUS_LABELS[status]}
        />
      </div>

      {/* Hover 详情浮层 */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 11,
          color: '#94a3b8',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          zIndex: 50,
          pointerEvents: 'none',
        }}>
          {description && (
            <div style={{ marginBottom: 4, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {description}
            </div>
          )}
          <div style={{ color: '#64748b' }}>
            创建: {fmtTime(created_at)}
          </div>
        </div>
      )}

      {/* 左右连接点 */}
      <div style={{
        position: 'absolute',
        left: -5,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: '#0f172a',
        border: `2px solid ${isMaster ? '#3b82f6' : '#475569'}`,
      }} />
      <div style={{
        position: 'absolute',
        right: -5,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: '#0f172a',
        border: `2px solid ${isMaster ? '#3b82f6' : '#475569'}`,
      }} />
    </div>
  );
};

export default AgentNodeComponent;
