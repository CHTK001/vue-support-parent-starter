import React from 'react';
import { TableFile } from '@icon-park/react';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import LocalCapabilityModelsPanel from '../modelHub/LocalCapabilityModelsPanel';

/**
 * 布局识别设置页（与人脸识别同级入口）。
 *
 * <p>该能力对应后端模型目录能力：layout(版面分析/文档结构) 与 pose(姿态估计)。
 * 页面复用模型中心的能力模型面板，展示本地已注册模型；暂无模型时引导前往模型中心管理。</p>
 */
const LayoutSettingsPage: React.FC = () => {
  return (
    <SettingsPageWrapper>
      <div className='flex flex-col h-full w-full'>
        <NomiScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow>
          <LocalCapabilityModelsPanel
            capabilityKeys={['layout', 'pose']}
            icon={<TableFile theme='outline' size='18' strokeWidth={3} />}
            titleKey='settings.modelHub.modality.layoutTitle'
            subtitleKey='settings.modelHub.modality.layoutSubtitle'
          />
        </NomiScrollArea>
      </div>
    </SettingsPageWrapper>
  );
};

export default LayoutSettingsPage;