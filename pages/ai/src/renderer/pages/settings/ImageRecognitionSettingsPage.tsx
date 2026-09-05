import React from 'react';
import CapabilityConfigForm from './CapabilityConfigForm';

/**
 * 图片识别配置页。
 *
 * <p>按后端 ImageRecognitionGlobalSettingProvider（分组 image）管线渲染，
 * 模型下拉从模型目录（/v2/ai/models/capabilities）按对应能力拉取。</p>
 */
const ImageRecognitionSettingsPage: React.FC = () => {
  return (
    <CapabilityConfigForm
      endpoint='/v2/image-recognition/config'
      modelCapabilities={{
        classify_model: 'classify',
        detect_model: 'image-detect',
        segment_model: 'segment',
        captioning_model: 'captioning',
      }}
      i18nPrefix='settings.imageRecognition'
    />
  );
};

export default ImageRecognitionSettingsPage;