/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Tabs, Typography, Upload, Space } from '@arco-design/web-react';
import { Camera, ScanCode, Picture, Format, ImageFiles } from '@icon-park/react';
import type { UploadItem } from '@arco-design/web-react';

const { TabPane } = Tabs;
const { Title, Paragraph } = Typography;

interface ImageUploadAreaProps {
  hintKey: string;
  acceptKey: string;
  icon?: React.ReactNode;
  onUpload?: (files: File[]) => void;
}

/**
 * 通用图片上传区域
 * 使用 Arco Upload 基础 drag prop 支持拖拽
 */
const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({
  hintKey,
  acceptKey,
  icon,
  onUpload,
}) => {
  const { t } = useTranslation();

  const handleChange = useCallback(
    (fileList: UploadItem[]) => {
      const files = fileList
        .map((item) => item.originFile)
        .filter((f): f is File => Boolean(f));
      if (files.length > 0) {
        onUpload?.(files);
      }
    },
    [onUpload]
  );

  return (
    <Upload
      accept="image/*"
      multiple={false}
      autoUpload={false}
      showUploadList={true}
      onChange={handleChange}
      drag
      className="mb-16px"
    >
      <div className="arco-upload-drag-wrapper text-center p-40px">
        <div className="mb-16px text-48px text-gray-400 flex items-center justify-center">
          {icon || <ImageFiles />}
        </div>
        <Paragraph className="!mb-8px">{t(hintKey)}</Paragraph>
        <Paragraph type="secondary" className="text-12px">
          {t(acceptKey)}
        </Paragraph>
      </div>
    </Upload>
  );
};

// 人脸识别模块
const FaceRecognition: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-24px">
      <Card className="mb-16px">
        <Title heading={5}>{t('imageSpace.face.title')}</Title>
        <Paragraph type="secondary">{t('imageSpace.face.description')}</Paragraph>
        <ImageUploadArea
          hintKey="imageSpace.upload.dragHint"
          acceptKey="imageSpace.upload.acceptFormat"
          icon={<Camera />}
        />
        <Space>
          <Button type="primary">{t('imageSpace.face.detectButton')}</Button>
          <Button>{t('imageSpace.face.attributeButton')}</Button>
        </Space>
      </Card>
    </div>
  );
};

// OCR 模块
const OcrRecognition: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-24px">
      <Card className="mb-16px">
        <Title heading={5}>{t('imageSpace.ocr.title')}</Title>
        <Paragraph type="secondary">{t('imageSpace.ocr.description')}</Paragraph>
        <ImageUploadArea
          hintKey="imageSpace.upload.dragHint"
          acceptKey="imageSpace.upload.acceptFormat"
          icon={<ScanCode />}
        />
        <Space>
          <Button type="primary">{t('imageSpace.ocr.recognizeButton')}</Button>
          <Button>{t('imageSpace.ocr.annotateButton')}</Button>
        </Space>
      </Card>
    </div>
  );
};

// 图片识别模块
const ImageRecognition: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-24px">
      <Card className="mb-16px">
        <Title heading={5}>{t('imageSpace.recognition.title')}</Title>
        <Paragraph type="secondary">{t('imageSpace.recognition.description')}</Paragraph>
        <ImageUploadArea
          hintKey="imageSpace.upload.dragHint"
          acceptKey="imageSpace.upload.acceptFormat"
          icon={<Picture />}
        />
        <Space>
          <Button type="primary">{t('imageSpace.recognition.analyzeButton')}</Button>
          <Button>{t('imageSpace.recognition.enhanceButton')}</Button>
        </Space>
      </Card>
    </div>
  );
};

// 布局检测模块
const LayoutDetection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-24px">
      <Card className="mb-16px">
        <Title heading={5}>{t('imageSpace.layout.title')}</Title>
        <Paragraph type="secondary">{t('imageSpace.layout.description')}</Paragraph>
        <ImageUploadArea
          hintKey="imageSpace.upload.dragHint"
          acceptKey="imageSpace.upload.acceptFormat"
          icon={<Format />}
        />
        <Space>
          <Button type="primary">{t('imageSpace.layout.detectButton')}</Button>
          <Button>{t('imageSpace.layout.parseButton')}</Button>
        </Space>
      </Card>
    </div>
  );
};

/**
 * ImageSpace — 图像空间页面
 *
 * 包含 4 个子功能模块：人脸识别、OCR、图片识别、布局检测
 * 支持从 URL ?tab= 参数切换功能，侧边栏子菜单导航联动
 */
const ImageSpace: React.FC = () => {
  const { t } = useTranslation();
  // HashRouter 下 ?tab= 参数位于 hash 内部（#/image-space?tab=face），
  // window.location.search 读不到，需要从 hash 解析。
  const activeTab = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('tab') ?? 'face';

  const handleTabChange = (key: string) => {
    window.location.hash = `#/image-space?tab=${key}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-12px mb-16px px-24px pt-24px">
        <ImageFiles className="text-20px text-primary-6" />
        <Title heading={4} className="!mb-0">
          {t('imageSpace.title')}
        </Title>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <Tabs
          activeTab={activeTab}
          onChange={handleTabChange}
          size="large"
          className="px-24px"
        >
          <TabPane key="face" title={t('imageSpace.tabs.face')}>
            <FaceRecognition />
          </TabPane>
          <TabPane key="ocr" title={t('imageSpace.tabs.ocr')}>
            <OcrRecognition />
          </TabPane>
          <TabPane key="recognition" title={t('imageSpace.tabs.recognition')}>
            <ImageRecognition />
          </TabPane>
          <TabPane key="layout" title={t('imageSpace.tabs.layout')}>
            <LayoutDetection />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default ImageSpace;
