import React from 'react';
import CapabilityConfigForm from './CapabilityConfigForm';

/**
 * 布局识别配置页。
 *
 * <p>按后端 LayoutGlobalSettingProvider（分组 layout）管线渲染，
 * 模型下拉从模型目录（/v2/ai/models/capabilities）按对应能力拉取。</p>
 */
const LayoutSettingsPage: React.FC = () => {
  return (
    <CapabilityConfigForm
      endpoint='/v2/layout/config'
      modelCapabilities={{
        layout_model: 'layout',
        pose_model: 'pose',
        super_resolution_model: 'enhance',
      }}
      i18nPrefix='settings.layout'
    />
  );
};

export default LayoutSettingsPage;