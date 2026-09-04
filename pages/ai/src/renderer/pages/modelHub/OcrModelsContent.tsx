import React from 'react';
import { DocSearch } from '@icon-park/react';
import LocalCapabilityModelsPanel from './LocalCapabilityModelsPanel';

/** OCR 识别区：本地文字识别（detector/recognizer 等）管线模型。 */
const OcrModelsContent: React.FC = () => (
  <LocalCapabilityModelsPanel
    capabilityKeys={['ocr']}
    icon={<DocSearch theme='outline' size='18' strokeWidth={3} />}
    titleKey='settings.modelHub.modality.ocrTitle'
    subtitleKey='settings.modelHub.modality.ocrSubtitle'
  />
);

export default OcrModelsContent;
