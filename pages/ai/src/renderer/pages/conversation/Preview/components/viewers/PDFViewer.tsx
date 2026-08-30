/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import { usePreviewToolbarExtras } from '../../context/PreviewToolbarExtrasContext';
import { Button, Message } from '@arco-design/web-react';
import { useArcoMessage } from '@/renderer/utils/ui/useArcoMessage';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FileViewerViewer from './FileViewerViewer';

interface PDFPreviewProps {
  file_path?: string;
  content?: string;
  hideToolbar?: boolean;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ file_path, content, hideToolbar = false }) => {
  const { t } = useTranslation();
  const [messageApi, messageContextHolder] = useArcoMessage();
  const toolbarExtrasContext = usePreviewToolbarExtras();
  const usePortalToolbar = Boolean(toolbarExtrasContext) && !hideToolbar;

  const handleOpenInSystem = useCallback(async () => {
    if (!file_path) {
      messageApi.error(t('preview.errors.openWithoutPath'));
      return;
    }
    try {
      await ipcBridge.shell.openFile.invoke(file_path);
      messageApi.success(t('preview.openInSystemSuccess'));
    } catch (err) {
      messageApi.error(t('preview.openInSystemFailed'));
    }
  }, [file_path, messageApi, t]);

  useEffect(() => {
    if (!usePortalToolbar || !toolbarExtrasContext) return;
    toolbarExtrasContext.setExtras({
      left: (
        <div className='flex items-center gap-8px'>
          <span className='text-13px text-t-secondary'>📄 {t('preview.pdf.title')}</span>
          <span className='text-11px text-t-tertiary'>{t('preview.readOnlyLabel')}</span>
        </div>
      ),
      right: null,
    });
    return () => toolbarExtrasContext.setExtras(null);
  }, [usePortalToolbar, toolbarExtrasContext, t]);

  return (
    <div className='h-full w-full bg-1 flex flex-col'>
      {messageContextHolder}
      {!usePortalToolbar && !hideToolbar && (
        <div className='flex items-center justify-between h-40px px-12px bg-2 flex-shrink-0'>
          <div className='flex items-center gap-8px'>
            <span className='text-13px text-t-secondary'>📄 {t('preview.pdf.title')}</span>
            <span className='text-11px text-t-tertiary'>{t('preview.readOnlyLabel')}</span>
          </div>
          {file_path && (
            <Button size='mini' type='text' onClick={handleOpenInSystem} title={t('preview.openInSystemApp')}>
              <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
                <polyline points='15 3 21 3 21 9' />
                <line x1='10' y1='14' x2='21' y2='3' />
              </svg>
              <span>{t('preview.openInSystemApp')}</span>
            </Button>
          )}
        </div>
      )}
      <div className='flex-1 overflow-hidden bg-1'>
        <FileViewerViewer file_path={file_path} content={content} />
      </div>
    </div>
  );
};

export default PDFPreview;
