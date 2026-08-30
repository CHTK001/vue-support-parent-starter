/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileViewer, setDefaultFullAssetBaseUrl } from '@file-viewer/react-full';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface FileViewerViewerProps {
  file_path?: string;
  content?: string;
}

// 与 utils-support-resource-filestorage Maven 模块版本保持一致
// 服务器端 FileViewerStaticFilter 会识别此版本号作为路径前缀
const FILEVIEWER_VERSION = '4.0.0.42';
const FILEVIEWER_ASSET_BASE = `/file-viewer/${FILEVIEWER_VERSION}/`;

// 模块加载时一次性设置 asset base URL（必须在 FileViewer 首次渲染前）
setDefaultFullAssetBaseUrl(FILEVIEWER_ASSET_BASE);

const FileViewerViewer: React.FC<FileViewerViewerProps> = ({ file_path, content }) => {
  const { t } = useTranslation();
  const [loadError, setLoadError] = React.useState(false);

  if (!file_path) {
    return (
      <div className='h-full w-full flex items-center justify-center bg-1'>
        <div className='text-14px text-t-secondary'>{t('preview.errors.missingFilePath', { defaultValue: 'No file path' })}</div>
      </div>
    );
  }

  const filename = file_path.split(/[/\\]/).pop() || 'file';
  const url = `file://${encodeURI(file_path)}`;

  return (
    <div className='h-full w-full bg-1 relative'>
      <FileViewer
        url={url}
        filename={filename}
        onStateChange={(state) => {
          if (state.error !== null) {
            setLoadError(true);
          }
        }}
        className='h-full w-full'
      />
      {loadError && (
        <div className='absolute inset-0 flex items-center justify-center bg-1'>
          <div className='text-center text-14px text-t-secondary'>
            <div className='text-16px text-danger mb-8px'>⚠️ {t('preview.fileViewer.assetMissing', { defaultValue: 'Preview assets not found' })}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileViewerViewer;
