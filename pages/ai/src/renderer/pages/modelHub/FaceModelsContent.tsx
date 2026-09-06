import React from 'react';
import { ScanCode } from '@icon-park/react';
import LocalCapabilityModelsPanel from './LocalCapabilityModelsPanel';

/** 人脸识别区：人脸检测/人脸特征值/人脸识别/活体检测等本地管线模型。 */
const FaceModelsContent: React.FC = () => (
  <LocalCapabilityModelsPanel
    capabilityKeys={[
      'detect',
      'face-recognize',
      'feature',
      'eye-detect',
      'smile-detect',
      'face-quality',
      'liveness',
      'enhance',
    ]}
    icon={<ScanCode theme='outline' size='18' strokeWidth={3} />}
    titleKey='settings.modelHub.modality.faceTitle'
    subtitleKey='settings.modelHub.modality.faceSubtitle'
  />
);

export default FaceModelsContent;
