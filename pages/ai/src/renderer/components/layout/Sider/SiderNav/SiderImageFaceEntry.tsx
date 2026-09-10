/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@arco-design/web-react';
import { Camera } from '@icon-park/react';
import classNames from 'classnames';
import type { SiderTooltipProps } from '@renderer/utils/ui/siderTooltip';

interface SiderImageFaceEntryProps {
  isMobile: boolean;
  isActive: boolean;
  collapsed: boolean;
  siderTooltipProps: SiderTooltipProps;
  onClick: () => void;
}

/**
 * SiderImageFaceEntry — 图像空间分区下的「人脸识别」子菜单。
 */
const SiderImageFaceEntry: React.FC<SiderImageFaceEntryProps> = ({
  isMobile,
  isActive,
  collapsed,
  siderTooltipProps,
  onClick,
}) => {
  const { t } = useTranslation();

  if (collapsed) {
    return (
      <Tooltip {...siderTooltipProps} content={t('imageSpace.tabs.face')} position='right'>
        <div
          className={classNames(
            'w-full h-28px flex items-center justify-center cursor-pointer transition-colors rd-8px text-t-primary',
            isActive ? '!bg-primary-1 !text-primary-6' : 'hover:bg-fill-2 active:bg-fill-3'
          )}
          onClick={onClick}
        >
          <Camera theme='outline' size='20' fill='currentColor' className='block leading-none' />
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip {...siderTooltipProps} content={t('imageSpace.tabs.face')} position='right'>
      <div
        className={classNames(
          'box-border group h-28px w-full flex items-center justify-start gap-8px pl-10px pr-8px rd-0.5rem cursor-pointer shrink-0 transition-all text-t-primary',
          isMobile && 'sider-action-btn-mobile',
          isActive ? '!bg-primary-1 !text-primary-6' : 'hover:bg-fill-2 active:bg-fill-3'
        )}
        onClick={onClick}
      >
        <span className='relative size-22px flex items-center justify-center shrink-0'>
          <Camera theme='outline' size='16' fill='currentColor' className='block leading-none' />
        </span>
        <span className='collapsed-hidden text-14px font-[500] leading-24px'>{t('imageSpace.tabs.face')}</span>
      </div>
    </Tooltip>
  );
};

export default SiderImageFaceEntry;
