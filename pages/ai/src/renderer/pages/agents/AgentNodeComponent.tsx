/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface AgentNodeProps {
  label: string;
  kind: 'master' | 'sub-agent';
  model?: string;
  status?: 'active' | 'idle' | 'error';
  onClick?: () => void;
}

const STATUS_COLORS = {
  active: '#52c41a',
  idle: '#d9d9d9',
  error: '#ff4d4f',
} as const;

const KIND_STYLES = {
  master: {
    border: '2px solid #1677ff',
    background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 100%)',
    badge: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
    icon: '#1677ff',
  },
  'sub-agent': {
    border: '1.5px solid #d9d9d9',
    background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
    badge: 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)',
    icon: '#8c8c8c',
  },
} as const;

const AgentIcon: React.FC<{ kind: 'master' | 'sub-agent'; color: string }> = ({ kind, color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
      fill={color}
    />
    {kind === 'master' && (
      <path
        d="M17 8l2-2 1 1-2 2-1-1zm-7-4l1-1h2l1 1-1 1h-2l-1-1z"
        fill={color}
        opacity="0.6"
      />
    )}
  </svg>
);

const AgentNodeComponent: React.FC<AgentNodeProps> = ({ label, kind, model, status = 'idle', onClick }) => {
  const styles = KIND_STYLES[kind];

  return (
    <div
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 12,
        border: styles.border,
        background: styles.background,
        boxShadow: kind === 'master'
          ? '0 4px 12px rgba(22, 119, 255, 0.15)'
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = kind === 'master'
          ? '0 6px 16px rgba(22, 119, 255, 0.25)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = kind === 'master'
          ? '0 4px 12px rgba(22, 119, 255, 0.15)'
          : '0 2px 8px rgba(0, 0, 0, 0.06)';
      }}
    >
      {/* 头部区域 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px 6px',
        }}
      >
        {/* 头像 */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: styles.badge,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AgentIcon kind={kind} color="#fff" />
        </div>

        {/* 名称和类型 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#1d2129',
              lineHeight: '18px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#86909c',
              lineHeight: '16px',
              marginTop: 1,
            }}
          >
            {kind === 'master' ? '主 Agent' : '子 Agent'}
            {model ? ` · ${model}` : ''}
          </div>
        </div>

        {/* 状态指示器 */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: STATUS_COLORS[status],
            flexShrink: 0,
            boxShadow: status === 'active' ? `0 0 6px ${STATUS_COLORS.active}` : 'none',
          }}
        />
      </div>

      {/* 连接端口 */}
      <div
        style={{
          position: 'absolute',
          left: -5,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#fff',
          border: `2px solid ${kind === 'master' ? '#1677ff' : '#d9d9d9'}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -5,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#fff',
          border: `2px solid ${kind === 'master' ? '#1677ff' : '#d9d9d9'}`,
        }}
      />
    </div>
  );
};

export default AgentNodeComponent;
