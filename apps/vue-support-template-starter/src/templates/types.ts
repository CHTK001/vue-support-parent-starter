/**
 * 组件模板元数据 —— 左侧参数面板 + 右侧代码生成的数据源
 *
 * PropField 描述一个可调参数（控件 + 默认值 + 代码片段生成）；
 * TemplateMeta 描述一个组件的全部参数、默认值插槽与代码生成器。
 */

/** 参数控件类型 */
export type PropFieldType = "string" | "number" | "boolean" | "select" | "slot" | "json";

/** 选项（select 类型） */
export interface PropOption {
  label: string;
  value: string | number | boolean;
}

/** 单个参数字段 */
export interface PropField {
  /** 字段名（prop key） */
  key: string;
  /** 中文标签 */
  label: string;
  /** 控件类型 */
  type: PropFieldType;
  /** 默认值 */
  default: unknown;
  /** 提示说明 */
  description?: string;
  /** 选项（select 专用） */
  options?: PropOption[];
  /** 最小值（number 专用） */
  min?: number;
  /** 最大值（number 专用） */
  max?: number;
  /** 步进（number 专用） */
  step?: number;
  /** 是否为插槽（标记后渲染插槽输入区） */
  isSlot?: boolean;
}

/** 插槽定义（用于默认插槽内容编辑） */
export interface SlotDef {
  /** 插槽名 */
  name: string;
  /** 中文说明 */
  label: string;
  /** 默认文本 */
  defaultText: string;
}

/** 组件模板元数据 */
export interface TemplateMeta {
  /** 组件名（PascalCase） */
  name: string;
  /** 中文标题 */
  title: string;
  /** 一句话描述（首页卡片展示） */
  description?: string;
  /** 组件引用（懒加载） */
  component: () => Promise<{ default: import("vue").Component }>;
  /** 参数列表 */
  props: PropField[];
  /** 插槽定义 */
  slots?: SlotDef[];
  /** 是否使用 v-model（控制是否显示开关控件） */
  modelable?: boolean;
  /** v-model 默认值 */
  modelDefault?: boolean | string | number;
  /** 代码生成器（默认走通用生成） */
  generate?: (state: TemplateState) => string;
}

/** 调试页状态（参数面板绑定） */
export interface TemplateState {
  /** props 字段值映射 */
  values: Record<string, unknown>;
  /** 默认插槽文本（按插槽名分） */
  slots: Record<string, string>;
  /** v-model 绑定值 */
  model: boolean | string | number;
}

/** 根据 schema 创建初始状态 */
export function createInitialState(meta: TemplateMeta): TemplateState {
  const values: Record<string, unknown> = {};
  for (const field of meta.props) {
    values[field.key] = field.default;
  }
  const slots: Record<string, string> = {};
  if (meta.slots) {
    for (const slot of meta.slots) {
      slots[slot.name] = slot.defaultText;
    }
  }
  return {
    values,
    slots,
    model: meta.modelDefault ?? false,
  };
}