import React from 'react';
import CapabilityConfigForm from './CapabilityConfigForm';

/**
 * OCR 文字识别配置页。
 *
 * <p>按后端 OcrGlobalSettingProvider（分组 ocr）管线渲染，模型下拉
 * 从模型目录（/v2/ai/models/capabilities）按 ocr 能力拉取。</p>
 */
const OcrSettingsPage: React.FC = () => {
  return (
    <CapabilityConfigForm
      endpoint='/v2/ocr/config'
      modelCapabilities={{
        detector_model: 'image-detect',
        recognizer_model: 'ocr',
        direction_model: 'ocr',
        restorer_model: 'enhance',
      }}
      i18nPrefix='settings.ocr'
    />
  );
};

export default OcrSettingsPage;