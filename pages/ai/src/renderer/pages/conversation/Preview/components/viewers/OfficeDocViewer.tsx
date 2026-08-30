/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import FileViewerViewer from './FileViewerViewer';

interface OfficeDocPreviewProps {
  file_path?: string;
  content?: string;
  workspace?: string;
}

const OfficeDocPreview: React.FC<OfficeDocPreviewProps> = (props) => (
  <FileViewerViewer file_path={props.file_path} content={props.content} />
);

export default OfficeDocPreview;
