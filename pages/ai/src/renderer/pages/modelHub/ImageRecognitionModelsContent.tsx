import React from 'react';
import { Picture } from '@icon-park/react';
import LocalCapabilityModelsPanel from './LocalCapabilityModelsPanel';

/** 图像识别区：目标检测/图像分类/图像分割/描述/深度估计等本地管线模型。 */
const ImageRecognitionModelsContent: React.FC = () => (
  <LocalCapabilityModelsPanel
    capabilityKeys={[
      'classify',
      'image-detect',
      'segment',
      'captioning',
      'depth',
      'pedestrian',
      'image-quality',
      'enhance',
    ]}
    icon={<Picture theme='outline' size='18' strokeWidth={3} />}
    titleKey='settings.modelHub.modality.imageRecognitionTitle'
    subtitleKey='settings.modelHub.modality.imageRecognitionSubtitle'
  />
);

export default ImageRecognitionModelsContent;
