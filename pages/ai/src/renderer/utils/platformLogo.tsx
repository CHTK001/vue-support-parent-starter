/**
 * 平台 Logo — 聊天记录与会话列表用的平台图标。
 *
 * 与 BotImPage.tsx 内部的 PlatformLogo 保持一致，但作为独立组件供
 * BotManagementPage.tsx 复用。
 */
import React from 'react';

export const PLATFORM_LABEL: Record<string, string> = {
  wechat: '微信',
  wecom: '企业微信',
  feishu: '飞书',
};

export interface PlatformLogoProps {
  platform?: string;
  className?: string;
}

const DEFAULT_CLASS = 'h-18px w-18px';

export const PlatformLogo: React.FC<PlatformLogoProps> = ({ platform, className = DEFAULT_CLASS }) => {
  if (platform === 'wechat') {
    return (
      <svg className={className} viewBox='0 0 24 24' fill='none'>
        <path d='M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66l-.7 2.1 2.46-1.23c.78.22 1.6.34 2.46.34.34 0 .68-.02 1-.06A5.97 5.97 0 0 1 10 14c0-3.31 3.13-6 7-6 .34 0 .68.02 1 .06C17.36 5.69 13.64 4 9.5 4ZM7 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z' fill='#07C160'/>
        <path d='M22 14c0-2.76-2.69-5-6-5s-6 2.24-6 5 2.69 5 6 5c.7 0 1.37-.1 2-.3l2 1-.56-1.68C21.08 16.56 22 15.36 22 14Zm-7.5-.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm3 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z' fill='#07C160'/>
      </svg>
    );
  }
  if (platform === 'feishu') {
    return (
      <svg className={className} viewBox='0 0 24 24' fill='none'>
        <path d='M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5' stroke='#3370FF' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/>
      </svg>
    );
  }
  if (platform === 'wecom') {
    return (
      <svg className={className} viewBox='0 0 24 24' fill='none'>
        <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z' fill='#1AAD19'/>
        <path d='M8.5 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3ZM12 18c-2.21 0-4-1.34-4-3h8c0 1.66-1.79 3-4 3Z' fill='white'/>
      </svg>
    );
  }
  return (
    <div className={`${className} flex items-center justify-center rounded-full bg-fill-2 text-10px text-t-secondary`}>
      {(platform || '?')[0].toUpperCase()}
    </div>
  );
};
