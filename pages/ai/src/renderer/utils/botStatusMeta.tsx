/**
 * 状态/平台 共享展示映射 — 供 BotManagementPage 与 BotImPage 复用。
 *
 * 徽章风格全部走 ai-page.css 的 .ai-badge-* 语义类（低饱和语义色胶囊），
 * 禁止硬编码色值。
 */
import React from 'react';
import classNames from 'classnames';
import { PLATFORM_LABEL, PlatformLogo } from '@/renderer/utils/platformLogo';

/** 状态 → 展示文案与徽章风格 */
export const STATUS_META: Record<string, { label: string; badge: string }> = {
  online: { label: '在线', badge: 'ai-badge-success' },
  offline: { label: '离线', badge: 'ai-badge-neutral' },
  expired: { label: '已过期', badge: 'ai-badge-warning' },
};

export interface StatusBadgeProps {
  status?: string;
  /** 在线状态点是否带呼吸动画（默认不带） */
  pulse?: boolean;
  className?: string;
}

/** 状态徽章：彩色胶囊 + 圆点，未知状态兜底为中性「未知」。
 *  pulse 开启时在线态圆点带呼吸动画（用于 IM 会话列表等需要强调"活跃"的场景）。 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, pulse = false, className }) => {
  const meta = STATUS_META[status ?? ''] ?? { label: '未知', badge: 'ai-badge-neutral' };
  const showPulse = pulse && status === 'online';
  return (
    <span className={classNames('ai-badge shrink-0', meta.badge, className)}>
      <span className={classNames('dot', showPulse && 'pulse')} />
      <span>{meta.label}</span>
    </span>
  );
};

/** 平台徽标：小图标 + 文字胶囊 */
export const PlatformBadge: React.FC<{ platform?: string }> = ({ platform }) => {
  if (!platform || !PLATFORM_LABEL[platform]) return null;
  return (
    <span className='inline-flex shrink-0 items-center gap-3px rounded-full bg-fill-2 px-6px py-1px text-10px font-500 leading-14px text-t-secondary'>
      <PlatformLogo platform={platform} className='h-10px w-10px' />
      {PLATFORM_LABEL[platform]}
    </span>
  );
};
