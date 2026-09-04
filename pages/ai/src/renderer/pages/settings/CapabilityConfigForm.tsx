import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Message, Select, Switch } from '@arco-design/web-react';
import NomiScrollArea from '@/renderer/components/base/NomiScrollArea';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import PreferenceRow from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent/PreferenceRow';
import { httpRequest } from '@/common/adapter/httpBridge';

/** 后端统一能力配置项（/v2 下 config 接口返回结构） */
export interface CapabilityConfigItem {
  field: string;
  value: string | number | boolean | null;
  valueType: string;
  description?: string;
  sort?: number;
}

interface CapabilityConfigFormProps {
  /** 配置分组对应的接口路径，如 /v2/ocr/config、/v2/face/config */
  endpoint: string;
  /**
   * 模型类字段 → 从模型目录按该能力标签拉取可选模型。
   * key = 字段名（如 detector_model），value = 模型目录能力标签（如 detect / feature / ocr / enhance）。
   * 若某字段未在映射中，仍会作为普通 Input 渲染。
   */
  modelCapabilities?: Record<string, string>;
  i18nPrefix: string;
}

const isBoolean = (v: unknown) => String(v).toLowerCase() === 'true' || String(v) === 'false';
const toBoolean = (v: unknown, def = false) =>
  v == null || v === '' ? def : String(v).toLowerCase() === 'true' || String(v) === '1';

/**
 * 通用 AI 能力配置表单 —— 后端管线分组（OCR / 人脸识别等）的数据驱动渲染。
 *
 * <p>从 {@code GET endpoint} 拉取全部配置项（{field,value,valueType,description}），
 * 按 valueType 自动渲染控件：BOOLEAN→Switch、NUMBER→数字输入、STRING→文本输入 或
 * （字段在 modelCapabilities 映射内）→ 模型下拉。保存时向 {@code PUT endpoint}
 * 提交 { group, fields:[{field,value}] } 整组替换。</p>
 */
const CapabilityConfigForm: React.FC<CapabilityConfigFormProps> = ({
  endpoint,
  modelCapabilities = {},
  i18nPrefix,
}) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<CapabilityConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /** 能力 → 模型 ID 列表（从 /v2/ai/models/capabilities 拉取） */
  const [catalog, setCatalog] = useState<Record<string, string[]>>({});

  // 拉取模型目录（能力 → 模型 ID 列表），供模型下拉使用
  useEffect(() => {
    (async () => {
      try {
        const res = await httpRequest<Record<string, string[]>>('GET', '/v2/ai/models/capabilities');
        if (res && typeof res === 'object') setCatalog(res);
      } catch { /* ignore */ }
    })();
  }, []);

  // 拉取当前配置项
  useEffect(() => {
    (async () => {
      try {
        const res = await httpRequest<CapabilityConfigItem[]>('GET', endpoint);
        if (Array.isArray(res)) setItems(res.filter((x) => x && x.field));
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, [endpoint]);

  const setField = useCallback((field: string, value: unknown) => {
    setItems((prev) => prev.map((it) => (it.field === field ? { ...it, value } : it)));
  }, []);

  const optionsFor = useCallback(
    (field: string): string[] => {
      const cap = modelCapabilities[field];
      return cap ? (catalog[cap] ?? []) : [];
    },
    [catalog, modelCapabilities],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const fields = items.map((it) => ({
        field: it.field,
        value: String(it.value ?? ''),
      }));
      await httpRequest('PUT', endpoint, { group: '', fields });
      Message.success(t(`${i18nPrefix}.saveSuccess`, { defaultValue: '已保存' }));
    } catch {
      Message.error(t(`${i18nPrefix}.saveFailed`, { defaultValue: '保存失败' }));
    } finally {
      setSaving(false);
    }
  }, [endpoint, items, t, i18nPrefix]);

  if (loading) {
    return (
      <SettingsPageWrapper>
        <div className='py-20px text-center text-14px text-t-secondary'>
          {t('settings.globalSettingsLoading', { defaultValue: '加载中…' })}
        </div>
      </SettingsPageWrapper>
    );
  }

  if (items.length === 0) {
    return (
      <SettingsPageWrapper>
        <div className='py-20px text-center text-14px text-t-secondary'>
          {t(`${i18nPrefix}.empty`, { defaultValue: '暂无可用配置' })}
        </div>
      </SettingsPageWrapper>
    );
  }

  return (
    <SettingsPageWrapper>
      <div className='flex flex-col h-full w-full'>
        <NomiScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow>
          <div className='px-[12px] md:px-[32px] py-16px bg-2 rd-16px space-y-12px'>
            <div className='w-full flex flex-col divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
              {items.map((item) => {
                const label = item.description || item.field;
                const isBool = item.valueType === 'BOOLEAN';
                const isNum = item.valueType === 'NUMBER';
                const capModels = optionsFor(item.field);
                const isModelSelect = capModels.length > 0;

                return (
                  <PreferenceRow key={item.field} label={label}>
                    {isBool ? (
                      <Switch
                        checked={toBoolean(item.value)}
                        onChange={(v) => setField(item.field, String(v))}
                      />
                    ) : isModelSelect ? (
                      <Select
                        className='w-320px'
                        value={String(item.value ?? '')}
                        onChange={(v) => setField(item.field, v as string)}
                        allowClear
                        placeholder={t(`${i18nPrefix}.selectModel`, { defaultValue: '选择模型' })}
                      >
                        {capModels.map((m) => (
                          <Select.Option key={m} value={m}>
                            {m}
                          </Select.Option>
                        ))}
                      </Select>
                    ) : isNum ? (
                      <Input
                        className='w-160px'
                        type='number'
                        step='any'
                        value={item.value == null ? '' : String(item.value)}
                        onChange={(v) => setField(item.field, v)}
                      />
                    ) : (
                      <Input
                        className='w-320px'
                        value={item.value == null ? '' : String(item.value)}
                        onChange={(v) => setField(item.field, v)}
                      />
                    )}
                  </PreferenceRow>
                );
              })}
            </div>
          </div>
        </NomiScrollArea>
        <div className='flex items-center justify-end px-[12px] md:px-[32px] py-16px bg-2 rd-16px'>
          <Button type='primary' loading={saving} onClick={handleSave} className='min-w-120px rounded-8px'>
            {t('common.save', { defaultValue: '保存' })}
          </Button>
        </div>
      </div>
    </SettingsPageWrapper>
  );
};

export default CapabilityConfigForm;