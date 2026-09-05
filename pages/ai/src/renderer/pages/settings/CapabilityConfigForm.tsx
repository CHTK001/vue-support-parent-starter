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
   * 若某字段未在映射中，仍会作为普通 STRING 渲染（描述里有枚举则下拉）。
   */
  modelCapabilities?: Record<string, string>;
  i18nPrefix: string;
}

const toBoolean = (v: unknown, def = false) =>
  v == null || v === '' ? def : String(v).toLowerCase() === 'true' || String(v) === '1';

/**
 * 配置字段的最终渲染控件。
 *  - BOOLEAN → Switch
 *  - NUMBER/FLOAT/INT → 数字输入
 *  - STRING → 有可选列表则下拉（模型目录 > description 括号解析），否则文本输入
 */
type FieldControl = { kind: 'switch' } | { kind: 'number' } | { kind: 'select'; options: string[] } | { kind: 'input' };

/**
 * 通用 AI 能力配置表单 —— 后端管线分组（OCR / 人脸识别等）的数据驱动渲染。
 *
 * <p>从 {@code GET endpoint} 拉取全部配置项（{field,value,valueType,description}），
 * 按 valueType 与可选枚举自动渲染控件。保存时向 {@code PUT endpoint}
 * 提交 { group, fields:[{field,value}] } 整组替换。</p>
 *
 * <p>渲染规范（与既有设置页一致）：
 *  - 开关 / 选择 / 输入统一用 {@link PreferenceRow} 排版；
 *  - 描述内嵌的"（模型a / 模型b / …）"清单剥掉，只保留功能说明，选项由下拉承担；
 *  - 布尔开关是字段格式化来源（如 `liveness_enabled`），其直接关联的模型/阈值
 *    分组随开关显隐（见 face 的 enabled 联动）。</p>
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

  const isNumberType = (type: string) => ['NUMBER', 'FLOAT', 'INT', 'DOUBLE', 'LONG'].includes(type);

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
    setItems((prev) =>
      prev.map((it) => (it.field === field ? { ...it, value: value as CapabilityConfigItem['value'] } : it)),
    );
  }, []);

  /** 从 description 括号内解析" a / b / c "枚举（含空格分隔统一去空白）。 */
  const parseEnums = useCallback((description: string | undefined): string[] => {
    if (!description) return [];
    const match = description.match(/[（(]([^）)]+)[）)]/);
    if (match && match[1].includes('/')) {
      return match[1]
        .split(/\s*\/\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }, []);

  const optionsFor = useCallback(
    (field: string, description: string | undefined): string[] => {
      const cap = modelCapabilities[field];
      if (cap) {
        const fromCatalog = catalog[cap];
        if (fromCatalog && fromCatalog.length > 0) return fromCatalog;
      }
      // 兜底：从 description 括号模型清单里解析（如"文字识别模型（paddleocrv6-rec / svtr-extractor）"）
      const parsed = parseEnums(description);
      return parsed.length > 0 ? parsed : [];
    },
    [catalog, modelCapabilities, parseEnums],
  );

  const controlFor = useCallback(
    (item: CapabilityConfigItem): FieldControl => {
      if (item.valueType === 'BOOLEAN') return { kind: 'switch' };
      if (isNumberType(item.valueType)) return { kind: 'number' };
      const options = optionsFor(item.field, item.description);
      // 纯数字枚举（如 device cpu/cuda、vector_algorithm COSINE/…）也应下拉
      if (options.length > 0) return { kind: 'select', options };
      return { kind: 'input' };
    },
    [optionsFor],
  );

  /** 带 `_enabled` 开关的关联子字段：均以开关的 field 前缀分组 */
  const enabledGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const it of items) {
      const m = it.field.match(/^(.*)_enabled$/);
      if (m && it.valueType === 'BOOLEAN') {
        const prefix = m[1];
        const children = items
          .filter((x) => x.field !== it.field && x.field.startsWith(`${prefix}_`))
          .map((x) => x.field)
          .sort((a, b) => (items.find((i) => i.field === a)?.sort ?? 0) - (items.find((i) => i.field === b)?.sort ?? 0));
        if (children.length > 0) groups.set(prefix, children);
      }
    }
    return groups;
  }, [items]);

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

  const stripModelList = (description: string): string =>
    description
      .replace(/（[^）]*\/[^）]*）/g, '')
      .replace(/\([^)]*\/[^)]*\)/g, '')
      .trim();

  const renderControl = (item: CapabilityConfigItem) => {
    const control = controlFor(item);
    if (control.kind === 'switch') {
      return (
        <Switch
          checked={toBoolean(item.value)}
          onChange={(v) => setField(item.field, String(v))}
        />
      );
    }
    if (control.kind === 'number') {
      return (
        <Input
          className='w-160px'
          type='number'
          step='any'
          value={item.value == null ? '' : String(item.value)}
          onChange={(v) => setField(item.field, v)}
        />
      );
    }
    if (control.kind === 'select') {
      return (
        <Select
          className='w-320px'
          value={String(item.value ?? '')}
          onChange={(v) => setField(item.field, v as string)}
          allowClear
          placeholder={t(`${i18nPrefix}.selectModel`, { defaultValue: '请选择' })}
        >
          {control.options.map((m) => (
            <Select.Option key={m} value={m}>
              {m}
            </Select.Option>
          ))}
        </Select>
      );
    }
    return (
      <Input
        className='w-320px'
        value={item.value == null ? '' : String(item.value)}
        onChange={(v) => setField(item.field, v)}
      />
    );
  };

  /** 渲染一个字段行；若其在某个 enabled 分组的 children 中，根据开关状态决定是否禁用 */
  const renderRow = (item: CapabilityConfigItem) => {
    const label = stripModelList(item.description || item.field);
    // 寻找所属 enabled 分组
    let disabledByGroup: { field: string; on: boolean } | null = null;
    for (const [prefix, children] of enabledGroups) {
      if (children.includes(item.field)) {
        const switchItem = items.find((x) => x.field === `${prefix}_enabled`);
        disabledByGroup = {
          field: `${prefix}_enabled`,
          on: switchItem != null ? toBoolean(switchItem.value) : true,
        };
        break;
      }
    }

    return (
      <div key={item.field} className={disabledByGroup && !disabledByGroup.on ? 'opacity-50' : undefined}>
        <PreferenceRow label={label}>
          {disabledByGroup ? (
            <div className={disabledByGroup.on ? undefined : 'pointer-events-none'}>{renderControl(item)}</div>
          ) : (
            renderControl(item)
          )}
        </PreferenceRow>
      </div>
    );
  };

  return (
    <SettingsPageWrapper>
      <div className='flex flex-col h-full w-full'>
        <NomiScrollArea className='flex-1 min-h-0 pb-16px' disableOverflow>
          <div className='px-[12px] md:px-[32px] py-16px bg-2 rd-16px space-y-12px'>
            <div className='w-full flex flex-col divide-y divide-x-0 divide-solid divide-[var(--color-border-2)]'>
              {items.map((item) => renderRow(item))}
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