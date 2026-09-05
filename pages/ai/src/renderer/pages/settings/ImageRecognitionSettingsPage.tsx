import React from 'react';
import { Picture } from '@icon-park/react';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import LocalCapabilityModelsPanel from '../modelHub/LocalCapabilityModelsPanel';

/**
 * 图片识别设置页（与人脸识别同级入口）。
 *
 * <p>该能力对应后端模型目录能力：classify(图像分类) / image-detect(目标检测) /
 * segment(图像分割) / captioning(图像描述) / depth(深度估计) / pedestrian(行人与异常) /
 * image-quality(图像质量)。页面复用模型中心的能力模型面板，展示本地已注册模型；
 * 暂无模型时引导前往模型中心管理，不伪造模型。</p>
 */
const ImageRecognitionSettingsPage: React.FC = () => {
  return (
    <SettingsPageWrapper>
      <div className='flex flex-col h-full w-full'>
        <NomiScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow>
          <LocalCapabilityModelsPanel
            capabilityKeys={[
              'classify',
              'image-detect',
              'segment',
              'captioning',
              'depth',
              'pedestrian',
              'image-quality',
            ]}
            icon={<Picture theme='outline' size='18' strokeWidth={3} />}
            titleKey='settings.modelHub.modality.imageRecognitionTitle'
            subtitleKey='settings.modelHub.modality.imageRecognitionSubtitle'
          />
        </NomiScrollArea>
      </div>
    </SettingsPageWrapper>
  );
};

export default ImageRecognitionSettingsPage;