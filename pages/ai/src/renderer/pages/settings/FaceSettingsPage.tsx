import React from 'react';
import CapabilityConfigForm from './CapabilityConfigForm';

/**
 * 人脸识别配置页。
 *
 * <p>按后端 FaceGlobalSettingProvider（分组 face）管线渲染。
 * 核心模型字段映射到对应的模型目录能力标签（detect / feature / enhance / classify），
 * 辅助能力字段（liveness / quality / super_resolution / restore / emotion / landmark / deepfake）
 * 也映射到 catalog 能力以获得可选模型列表。</p>
 */
const FaceSettingsPage: React.FC = () => {
  return (
    <CapabilityConfigForm
      endpoint='/v2/face/config'
      modelCapabilities={{
        detector_model: 'detect',
        feature_model: 'feature',
        liveness_model: 'classify',
        super_resolution_model: 'enhance',
        restore_model: 'enhance',
        attribute_model: 'classify',
        emotion_model: 'classify',
        landmark_model: 'feature',
        deepfake_model: 'classify',
        anime_detector_model: 'detect',
      }}
      i18nPrefix='settings.face'
    />
  );
};

export default FaceSettingsPage;