/**
 * @license
 * Copyright 2025-2026 NomiFun (nomifun.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tabs, Empty, Card, Upload, Typography, Space, Tag, Result } from '@arco-design/web-react';
import { IconFile, IconCamera, IconScan, IconApps, IconUpload, IconImage } from '@arco-design/web-react/icon';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const Dragger = Upload.Dragger;

// 人脸识别模块
const FaceRecognition: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="p-24px">
      <Card className="mb-16px">
        <Title heading={5}>{t('imageSpace.face.title')}</Title>
        <Paragraph type="secondary">{t('imageSpace.face.description')}</Paragraph>
        <Dragger
          accept="image/*"
          multiple={false}
          className="mb-16px"
          showUploadList={true}
        >
          <div className="text-center p-40px">
            <IconCamera className="text-48px text-gray-400 mb-16px" />
            <Paragraph>{t('imageSpace.upload.dragHint')}</Paragraph>
            <Paragraph type="secondary" className="text-12px">
              {t('imageSpace.upload.acceptFormat')}
            </Paragraph>
          </div>
        </Dragger>
        <Space>
          <Button type="primary">{t('imageSpace.face.detectButton')}</Button>
          <Button>{t('imageSpace.face.batchButton')}</Button>
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
        <Dragger
          accept="image/*"
          multiple={false}
          className="mb-16px"
          showUploadList={true}
        >
          <div className="text-center p-40px">
            <IconScan className="text-48px text-gray-400 mb-16px" />
            <Paragraph>{t('imageSpace.upload.dragHint')}</Paragraph>
            <Paragraph type="secondary" className="text-12px">
              {t('imageSpace.upload.acceptFormat')}
            </Paragraph>
          </div>
        </Dragger>
        <Space>
          <Button type="primary">{t('imageSpace.ocr.recognizeButton')}</Button>
          <Button>{t('imageSpace.ocr.multiLangButton')}</Button>
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
        <Dragger
          accept="image/*"
          multiple={false}
          className="mb-16px"
          showUploadList={true}
        >
          <div className="text-center p-40px">
            <IconImage className="text-48px text-gray-400 mb-16px" />
            <Paragraph>{t('imageSpace.upload.dragHint')}</Paragraph>
            <Paragraph type="secondary" className="text-12px">
              {t('imageSpace.upload.acceptFormat')}
            </Paragraph>
          </div>
        </Dragger>
        <Space>
          <Button type="primary">{t('imageSpace.recognition.analyzeButton')}</Button>
          <Button>{t('imageSpace.recognition.compareButton')}</Button>
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
        <Dragger
          accept="image/*"
          multiple={false}
          className="mb-16px"
          showUploadList={true}
        >
          <div className="text-center p-40px">
            <IconApps className="text-48px text-gray-400 mb-16px" />
            <Paragraph>{t('imageSpace.upload.dragHint')}</Paragraph>
            <Paragraph type="secondary" className="text-12px">
              {t('imageSpace.upload.acceptFormat')}
            </Paragraph>
          </div>
        </Dragger>
        <Space>
          <Button type="primary">{t('imageSpace.layout.detectButton')}</Button>
          <Button>{t('imageSpace.layout.exportButton')}</Button>
        </Space>
      </Card>
    </div>
  );
};

/**
 * ImageSpace — 图像空间页面
 *
 * 包含 4 个子功能模块：人脸识别、OCR、图片识别、布局检测
 * 支持拖拽上传图片进行图像处理
 */
const ImageSpace: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-12px mb-16px px-24px pt-24px">
        <IconFile className="text-20px text-primary-6" />
        <Title heading={4} className="!mb-0">{t('imageSpace.title')}</Title>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <Tabs defaultActiveTab="face" size="large" className="px-24px">
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
