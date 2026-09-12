/**
 * GlobalBeansPage — 系统设置 · 全局 Bean
 *
 * 分组：chat（ChatClient 会话，/v2/global-settings）+
 * generate（文生图/文生视频）/ ocr / layout / face / image（各分组 config 接口）。
 * 全部为系统内部使用的全局 Bean 配置，保存后由后端重建对应 Bean。
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Input, InputNumber, Message, Select, Spin, Switch } from '@arco-design/web-react';
import {
  Application,
  ConnectionPoint,
  FaceRecognition,
  FileWord,
  Pic,
  Refresh,
  Save,
  TextRecognition,
  VideoTwo,
} from '@icon-park/react';
import {
  ChatGlobalBean,
  getGroupConfig,
  globalBeanApi,
  modelApi,
  AiModelDTO,
  SettingField,
  updateGroupConfig,
} from '@/renderer/services/api/aiConsoleApi';
import '@/renderer/styles/ai-page.css';

/* ---------- 字段中文标签 ---------- */
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

const SECRET_FIELDS = ['api_key', 'image_api_key', 'video_api_key'];

function humanizeField(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/_/g, ' ');
}

/* ---------- 单个分组配置卡片 ---------- */
function GroupConfigCard({
  title,
  hint,
  group,
  formKey,
  icon,
  initialFields,
  onSave,
}: {
  title: string;
  hint: string;
  group: string;
  formKey: string;
  icon: React.ReactNode;
  initialFields: SettingField[];
  onSave: (group: string, fields: SettingField[]) => Promise<unknown>;
}) {
  const { t } = useTranslation('settings');
  const [form] = Form.useForm();
  const [fields, setFields] = useState<SettingField[]>(initialFields);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const f = await getGroupConfig(group);
      setFields(f);
      const values: Record<string, unknown> = {};
      f.forEach((item) => {
        values[item.field] = item.valueType === 'BOOLEAN' ? item.value === 'true' : item.value;
      });
      form.setFieldsValue(values);
      setLoaded(true);
    } catch {
      Message.error(`${title}${t('console.globalBean.loadFailed', '配置加载失败')}`);
    } finally {
      setLoading(false);
    }
  }, [group, title, form, t]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey]);

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
      await onSave(group, payload);
      Message.success(`${title}${t('console.globalBean.saveOk', '已保存并生效')}`);
      load();
    } catch {
      Message.error(`${title}${t('console.globalBean.saveFailed', '保存失败')}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ai-pipeline-block" style={{ marginTop: 16 }}>
      <div className="block-head">
        <span style={{ display: 'inline-flex', color: 'var(--color-primary-6, var(--primary, #165dff))', marginRight: 4 }}>{icon}</span>
        <span className="block-title">{title}</span>
        <span className="block-sub">{hint}</span>
        <div style={{ flex: 1 }} />
        <Button size="small" icon={<Refresh size={13} />} onClick={load} />
        <Button size="small" type="primary" icon={<Save size={13} />} onClick={handleSave} loading={saving}>
          {t('console.capability.save', '保存')}
        </Button>
      </div>
      <div style={{ padding: '4px 16px 14px' }}>
        {loading && !loaded ? (
          <div style={{ padding: 28, textAlign: 'center' }}>
            <Spin size={24} />
          </div>
        ) : (
          <Form form={form} layout="vertical" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', columnGap: 20 }}>
            {fields.map((item) => (
              <Form.Item key={item.field} field={item.field} label={humanizeField(item.field)} extra={item.description} style={{ marginBottom: 10 }}>
                {item.valueType === 'BOOLEAN' ? (
                  <Switch />
                ) : item.valueType === 'NUMBER' ? (
                  <InputNumber style={{ width: '100%' }} />
                ) : (
                  <Input.Password autoComplete="new-password" placeholder={SECRET_FIELDS.some((s) => item.field.includes(s)) ? '••••••••' : ''} />
                )}
              </Form.Item>
            ))}
          </Form>
        )}
      </div>
    </div>
  );
}

/* ---------- ChatClient 会话配置 ---------- */
function ChatClientCard() {
  const { t } = useTranslation('settings');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modelOptions, setModelOptions] = useState<Array<{ label: string; value: string }>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, models]: [ChatGlobalBean, AiModelDTO[]] = await Promise.all([
        globalBeanApi.get(),
        modelApi.list().catch(() => [] as AiModelDTO[]),
      ]);
      setModelOptions(models.map((m) => ({ label: `${m.name} (${m.code})`, value: m.code })));
      form.setFieldsValue({
        chatClientEnabled: g.chatClientEnabled ?? true,
        defaultModel: g.defaultModel ?? '',
        temperature: g.temperature ?? 0.7,
        maxTokens: g.maxTokens ?? 2048,
        timeout: g.timeout ?? 30,
        enableCache: g.enableCache ?? false,
        stream: g.stream ?? true,
        systemPrompt: g.systemPrompt ?? '',
      });
    } catch {
      Message.error(t('console.globalBean.chatLoadFailed', '全局会话配置加载失败'));
    } finally {
      setLoading(false);
    }
  }, [form, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    const values = (await form.validate()) as ChatGlobalBean;
    setSaving(true);
    try {
      await globalBeanApi.update(values);
      Message.success(t('console.globalBean.chatSaveOk', '全局会话已保存并重建 ChatClient Bean'));
      load();
    } catch {
      Message.error(t('console.globalBean.chatSaveFailed', '保存失败'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ai-pipeline-block" style={{ marginTop: 16 }}>
      <div className="block-head">
        <span style={{ display: 'inline-flex', color: 'var(--color-primary-6, var(--primary, #165dff))', marginRight: 4 }}>
          <ConnectionPoint theme="outline" size={16} strokeWidth={4} fill="currentColor" />
        </span>
        <span className="block-title">{t('console.globalBean.chatTitle', 'ChatClient 会话')}</span>
        <span className="block-sub">{t('console.globalBean.chatHint', '系统内部对话使用，保存后重建全局 ChatClient Bean')}</span>
        <div style={{ flex: 1 }} />
        <Button size="small" icon={<Refresh size={13} />} onClick={load} />
        <Button size="small" type="primary" icon={<Save size={13} />} onClick={handleSave} loading={saving}>
          {t('console.capability.save', '保存')}
        </Button>
      </div>
      <div style={{ padding: '4px 16px 14px' }}>
        {loading ? (
          <div style={{ padding: 28, textAlign: 'center' }}>
            <Spin size={24} />
          </div>
        ) : (
          <Form form={form} layout="vertical" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', columnGap: 20 }}>
            <Form.Item field="chatClientEnabled" label={t('console.globalBean.chatEnabled', '启用会话')} triggerPropName="checked" style={{ marginBottom: 10 }}>
              <Switch />
            </Form.Item>
            <Form.Item field="defaultModel" label={t('console.globalBean.defaultModel', '默认模型')} style={{ marginBottom: 10 }}>
              <Select
                showSearch
                allowCreate
                placeholder={t('console.globalBean.defaultModelPlaceholder', '选择或输入模型标识')}
                options={modelOptions}
                filterOption={(inputValue, option) => String((option as any)?.label ?? '').toLowerCase().includes(inputValue.toLowerCase())}
              />
            </Form.Item>
            <Form.Item field="temperature" label={t('console.globalBean.temperature', '温度')} style={{ marginBottom: 10 }}>
              <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item field="maxTokens" label={t('console.globalBean.maxTokens', '最大 Tokens')} style={{ marginBottom: 10 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item field="timeout" label={t('console.globalBean.timeout', '超时（秒）')} style={{ marginBottom: 10 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item field="stream" label={t('console.globalBean.stream', '流式输出')} triggerPropName="checked" style={{ marginBottom: 10 }}>
              <Switch />
            </Form.Item>
            <Form.Item field="enableCache" label={t('console.globalBean.enableCache', '启用缓存')} triggerPropName="checked" style={{ marginBottom: 10 }}>
              <Switch />
            </Form.Item>
            <Form.Item field="systemPrompt" label={t('console.globalBean.systemPrompt', '系统提示词')} style={{ marginBottom: 10, gridColumn: '1 / -1' }}>
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        )}
      </div>
    </div>
  );
}

/* ---------- 页面 ---------- */
export default function GlobalBeansPage() {
  const { t } = useTranslation('settings');

  const onSave = useCallback(async (group: string, fields: SettingField[]) => {
    await updateGroupConfig(group, fields);
  }, []);

  return (
    <div className="ai-page">
      <div className="ai-page-header">
        <span className="ai-icon-tile">
          <ConnectionPoint theme="outline" size={20} strokeWidth={4} fill="currentColor" />
        </span>
        <div>
          <h1 className="title">{t('console.globalBean.title', '全局 Bean')}</h1>
          <p className="desc">{t('console.globalBean.desc', 'ChatClient 会话、文生图 / 文生视频、OCR、布局、人脸识别、图像识别管线的全局配置，供系统内部使用')}</p>
        </div>
      </div>

      <ChatClientCard />

      <GroupConfigCard
        formKey="generate"
        group="generate"
        title={t('console.globalBean.generateTitle', '生成管线（文生图 / 文生视频）')}
        hint={t('console.globalBean.generateHint', '全局生成会话，系统内部使用')}
        icon={<Pic theme="outline" size={16} strokeWidth={4} fill="currentColor" />}
        initialFields={[]}
        onSave={onSave}
      />

      <GroupConfigCard
        formKey="ocr"
        group="ocr"
        title={t('console.globalBean.ocrTitle', 'OCR 文字识别管线')}
        hint={t('console.globalBean.ocrHint', '全局 OCR 会话')}
        icon={<TextRecognition theme="outline" size={16} strokeWidth={4} fill="currentColor" />}
        initialFields={[]}
        onSave={onSave}
      />

      <GroupConfigCard
        formKey="layout"
        group="layout"
        title={t('console.globalBean.layoutTitle', '版面布局管线')}
        hint={t('console.globalBean.layoutHint', '全局版面分析会话')}
        icon={<FileWord theme="outline" size={16} strokeWidth={4} fill="currentColor" />}
        initialFields={[]}
        onSave={onSave}
      />

      <GroupConfigCard
        formKey="face"
        group="face"
        title={t('console.globalBean.faceTitle', '人脸识别管线')}
        hint={t('console.globalBean.faceHint', '全局人脸识别会话')}
        icon={<FaceRecognition theme="outline" size={16} strokeWidth={4} fill="currentColor" />}
        initialFields={[]}
        onSave={onSave}
      />

      <GroupConfigCard
        formKey="image"
        group="image"
        title={t('console.globalBean.imageTitle', '图像识别管线')}
        hint={t('console.globalBean.imageHint', '全局图像识别会话')}
        icon={<Application theme="outline" size={16} strokeWidth={4} fill="currentColor" />}
        initialFields={[]}
        onSave={onSave}
      />

      <div style={{ height: 24 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-4, #b4b4be)' }}>
        <VideoTwo theme="outline" size={14} strokeWidth={4} fill="currentColor" />
        {t('console.globalBean.tip', '提示：以上均为系统内部使用的全局 Bean，外部调用请使用对应能力页或模型管理中的独立配置')}
      </div>
    </div>
  );
}
