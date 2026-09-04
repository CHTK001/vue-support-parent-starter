import React from 'react';
import { TableFile } from '@icon-park/react';
import LocalCapabilityModelsPanel from './LocalCapabilityModelsPanel';

/** 文本布局识别区：版面分析/文档结构/姿态等本地管线模型。 */
const LayoutModelsContent: React.FC = () => (
  <LocalCapabilityModelsPanel
    capabilityKeys={['layout', 'pose']}
    icon={<TableFile theme='outline' size='18' strokeWidth={3} />}
    titleKey='settings.modelHub.modality.layoutTitle'
    subtitleKey='settings.modelHub.modality.layoutSubtitle'
  />
);

export default LayoutModelsContent;
