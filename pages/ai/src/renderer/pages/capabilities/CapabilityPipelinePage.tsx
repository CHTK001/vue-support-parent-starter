/**
 * CapabilityPipelinePage — 管线能力页（文生图 / 文生视频 / OCR / 布局 / 人脸识别 / 图片识别）
 *
 * 结构：
 * 1) 管线概览（必填/非必填能力）；
 * 2) 全局 Bean 配置表单（GET/PUT 分组配置，即系统内部使用的全局会话）；
 * 3) 必填管线模型清单（必填能力所属模型，均属于该管线）；
 * 4) 非必填管线模型清单（非必填能力所属模型，也属于该管线）。
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Form, Input, InputNumber, Message, Select, Spin, Switch } from '@arco-design/web-react';
import {
  Application,
  Box,
  FaceRecognition,
  FileWord,
  Pic,
  Refresh,
  Save,
  TextRecognition,
  VideoTwo,
} from '@icon-park/react';
import {
  AiModelDTO,
  capabilityLabel,
  getGroupConfig,
  modelApi,
  pipelineApi,
  PipelineDef,
  SettingField,
  updateGroupConfig,
} from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

const PIPELINE_ICONS: Record<string, React.ReactNode> = {
  'text-to-image': <Pic theme="outline" size={20} strokeWidth={4} fill="currentColor" />,
  'text-to-video': <VideoTwo theme="outline" size={20} strokeWidth={4} fill="currentColor" />,
  ocr: <TextRecognition theme="outline" size={20} strokeWidth={4} fill="currentColor" />,
  layout: <FileWord theme="outline" size={20} strokeWidth={4} fill="currentColor" />,
  face: <FaceRecognition theme="outline" size={20} strokeWidth={4} fill="currentColor" />,
  image: <Application theme="outline" size={20} strokeWidth={4} fill="currentColor" />,
};

/** 通用字段中文标签（与后端 description 互补） */
const FIELD_LABELS: Record<string, string> = {
  enabled: '启用',
  provider: '供应商',
  api_key: 'API Key',
  url: '服务地址',
  base_url: '服务地址',
  model: '默认模型',
  size: '默认尺寸',
  ratio: '默认比例',
  duration: '默认时长（秒）',
  device: '推理设备',
  negative_prompt: '默认负面提示词',
  temperature: '温度',
  max_tokens: '最大 Tokens',
  timeout: '超时（秒）',
  detect_model: '检测模型',
  recognize_model: '识别模型',
  direction_model: '方向矫正模型',
  restore_model: '超分恢复模型',
  layout_model: '版面模型',
  classify_model: '分类模型',
  segment_model: '分割模型',
  caption_model: '描述模型',
  quality_model: '质量模型',
  liveness_model: '活体模型',
  eye_model: '眼睛检测模型',
  smile_model: '微笑检测模型',
  image_model: '文生图模型',
  video_model: '文生视频模型',
  image_provider: '文生图供应商',
  video_provider: '文生视频供应商',
  image_enabled: '启用文生图',
  video_enabled: '启用文生视频',
  image_api_key: '文生图 API Key',
  video_api_key: '文生视频 API Key',
  image_base_url: '文生图服务地址',
  video_base_url: '文生视频服务地址',
  image_size: '默认出图尺寸',
  image_device: '文生图推理设备',
  image_negative_prompt: '文生图负面提示词',
  video_duration: '默认视频时长（秒）',
  video_ratio: '默认视频比例',
};

function humanizeField(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/_/g, ' ');
}

const SECRET_FIELDS = ['api_key', 'image_api_key', 'video_api_key'];

export default function CapabilityPipelinePage() {
  const { pipeline: pipelineCode = 'ocr' } = useParams<{ pipeline: string }>();
  const { t } = useTranslation('settings');
  const [form] = Form.useForm();

  const [pipeline, setPipeline] = useState<PipelineDef | null>(null);
  const [fields, setFields] = useState<SettingField[]>([]);
  const [models, setModels] = useState<AiModelDTO[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!pipeline) return;
    setConfigLoading(true);
    try {
      const f = await getGroupConfig(pipeline.configGroup);
      setFields(f);
      const values: Record<string, unknown> = {};
      f.forEach((item) => {
        values[item.field] = item.valueType === 'BOOLEAN' ? item.value === 'true' : item.value;
      });
      form.setFieldsValue(values);
    } catch {
      Message.error(t('console.capability.loadConfigFailed', '配置加载失败'));
    } finally {
      setConfigLoading(false);
    }
  }, [pipeline, form, t]);

  const loadModels = useCallback(async () => {
    try {
      const list = await modelApi.list();
      setModels(list);
    } catch {
      /* 模型清单非关键路径 */
    }
  }, []);

  useEffect(() => {
    let alive = true;
    pipelineApi
      .list()
      .then((list) => {
        const found = list.find((p) => p.code === pipelineCode);
        if (alive) setPipeline(found ?? null);
      })
      .catch(() => setPipeline(null));
    return () => {
      alive = false;
    };
  }, [pipelineCode]);

  useEffect(() => {
    if (pipeline) {
      loadConfig();
      loadModels();
    }
  }, [pipeline, loadConfig, loadModels]);

  const requiredModels = useMemo(() => {
    if (!pipeline) return [];
    const caps = new Set(pipeline.required);
    return models.filter((m) => (m.capabilities ?? []).some((c) => caps.has(c)));
  }, [models, pipeline]);

  const optionalModels = useMemo(() => {
    if (!pipeline) return [];
    const req = new Set(pipeline.required);
    const caps = new Set(pipeline.optional);
    return models.filter((m) => (m.capabilities ?? []).some((c) => caps.has(c)) && !(m.capabilities ?? []).some((c) => req.has(c)));
  }, [models, pipeline]);

  const handleSave = async () => {
    const values = (await form.validate()) as Record<string, unknown>;
    const payload: SettingField[] = fields.map((item) => ({
      field: item.field,
      valueType: item.valueType,
      description: item.description,
      sort: item.sort,
      value: String(values[item.field] ?? ''),
    }));
    setSaving(true);
    try {
      await updateGroupConfig(pipeline!.configGroup, payload);
      Message.success(t('console.capability.saveOk', '配置已保存并生效'));
      loadConfig();
    } catch {
      Message.error(t('console.capability.saveFailed', '保存失败'));
    } finally {
      setSaving(false);
    }
  };

  if (!pipeline) {
    return (
      <div className="ai-page">
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Spin size={28} tip={t('console.capability.loading', '加载管线中…')} />
        </div>
      </div>
    );
  }

  const isSecret = (field: string) => SECRET_FIELDS.some((s) => field.includes(s));

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <span className="ai-icon-tile">{PIPELINE_ICONS[pipeline.code]}</span>
        <div>
          <h1 className="title">{pipeline.name}</h1>
          <p className="desc">{pipeline.description}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        <span className="ai-badge ai-badge-success">
          <span className="dot" />
          {t('console.capability.required', '必填')}
        </span>
        {pipeline.required.map((c) => (
          <span key={c} className="ai-model-chip required">
            {capabilityLabel(c)}
          </span>
        ))}
        <span className="ai-badge ai-badge-warning" style={{ marginLeft: 8 }}>
          <span className="dot" />
          {t('console.capability.optional', '非必填')}
        </span>
        {pipeline.optional.map((c) => (
          <span key={c} className="ai-model-chip optional">
            {capabilityLabel(c)}
          </span>
        ))}
      </div>

      {/* 全局 Bean 配置 */}
      <div className="ai-pipeline-block" style={{ marginTop: 18 }}>
        <div className="block-head">
          <span className="block-title">{t('console.capability.globalBean', '全局会话配置')}</span>
          <span className="block-sub">{t('console.capability.globalBeanHint', '系统内部使用：修改后全局 Bean 立即重建')}</span>
          <div style={{ flex: 1 }} />
          <Button size="small" icon={<Refresh size={13} />} onClick={loadConfig} />
          <Button size="small" type="primary" icon={<Save size={13} />} onClick={handleSave} loading={saving}>
            {t('console.capability.save', '保存')}
          </Button>
        </div>
        <div style={{ padding: '4px 16px 14px' }}>
          {configLoading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <Spin size={26} />
            </div>
          ) : (
            <Form form={form} layout="vertical">
              {fields.map((item) => (
                <Form.Item key={item.field} field={item.field} label={humanizeField(item.field)} extra={item.description} style={{ marginBottom: 12 }}>
                  {item.valueType === 'BOOLEAN' ? (
                    <Switch />
                  ) : item.valueType === 'NUMBER' ? (
                    <InputNumber style={{ width: '100%', maxWidth: 280 }} />
                  ) : (
                    <Input.Password
                      autoComplete="new-password"
                      placeholder={isSecret(item.field) ? '••••••••' : ''}
                      style={{ maxWidth: 560 }}
                    />
                  )}
                </Form.Item>
              ))}
            </Form>
          )}
        </div>
      </div>

      {/* 必填管线模型 */}
      <div className="ai-pipeline-block" style={{ marginTop: 16 }}>
        <div className="block-head">
          <span className="block-title">{t('console.capability.requiredModels', '必填管线模型')}</span>
          <span className="block-sub">{t('console.capability.requiredModelsHint', '缺一不可，均属于本管线模型集合')}</span>
        </div>
        {requiredModels.length === 0 ? (
          <div className="ai-empty" style={{ padding: '32px 16px' }}>
            <span className="icon">
              <Box size={24} />
            </span>
            <span className="title">{t('console.capability.noRequiredModels', '暂无必填管线模型')}</span>
            <span className="hint">{t('console.capability.noRequiredModelsHint', '请到「模型管理」中为该管线能力添加模型')}</span>
          </div>
        ) : (
          <div style={{ padding: '12px 16px 16px', display: 'grid', gap: 8 }}>
            {requiredModels.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--ai-radius-sm)', background: 'var(--color-fill-2, #f5f5f7)' }}>
                <span style={{ fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-3, #9a9aa5)', fontFamily: 'monospace' }}>{m.code}</span>
                <div style={{ flex: 1 }} />
                {m.enabled ? (
                  <span className="ai-badge ai-badge-success">
                    <span className="dot" />
                    {t('console.model.enabled', '启用')}
                  </span>
                ) : (
                  <span className="ai-badge ai-badge-neutral">
                    <span className="dot" />
                    {t('console.model.disabled', '停用')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 非必填管线模型 */}
      <div className="ai-pipeline-block" style={{ marginTop: 16 }}>
        <div className="block-head">
          <span className="block-title">{t('console.capability.optionalModels', '非必填管线模型')}</span>
          <span className="block-sub">{t('console.capability.optionalModelsHint', '可选增强子能力，同样属于本管线模型集合')}</span>
        </div>
        {optionalModels.length === 0 ? (
          <div className="ai-empty" style={{ padding: '32px 16px' }}>
            <span className="icon">
              <Application size={24} />
            </span>
            <span className="title">{t('console.capability.noOptionalModels', '暂无非必填管线模型')}</span>
          </div>
        ) : (
          <div style={{ padding: '12px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {optionalModels.map((m) => (
              <span key={m.id} className="ai-model-chip optional">
                {m.name} · {m.code}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
