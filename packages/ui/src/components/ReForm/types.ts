/**
 * ReForm 表单字段类型
 */
import type { Component } from "vue";

/** 支持的字段组件类型 */
export type ReFieldComponent =
  | "input"
  | "select"
  | "date"
  | "date-range"
  | "datetime"
  | "datetime-range"
  | "textarea"
  | "number"
  | "switch"
  | "checkbox"
  | "radio"
  | "slider"
  | "rate"
  | "color-picker"
  | "cascader"
  | "tree-select"
  | "icon-select";

/** 选项类型 */
export interface ReFieldOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

/** 表单字段定义 */
export interface ReFormField {
  /** 字段名（对应 model 的属性） */
  prop: string;
  /** 标签 */
  label?: string;
  /** 渲染组件 */
  component?: ReFieldComponent | Component;
  /** 占位符 */
  placeholder?: string;
  /** 选项（select/radio/checkbox 使用） */
  options?: ReFieldOption[];
  /** 选项数据源 url / 函数 */
  dataSource?: string | (() => Promise<unknown>);
  /** 是否必填 */
  required?: boolean;
  /** 校验规则 */
  rules?: Array<Record<string, unknown>>;
  /** 隐藏 */
  hidden?: boolean;
  /** 是否修剪输入值（默认 true） */
  trim?: boolean;
  /** 禁用 */
  disabled?: boolean;
  /** 栅格列宽（0-24）；开启 span 模式时生效 */
  span?: number;
  /** 透传给渲染组件的属性 */
  attrs?: Record<string, unknown>;
  /** 渲染子组件前格式化 */
  format?: (value: unknown) => unknown;
  /** 帮助文本（显示在字段下方） */
  help?: string;
  /** 字段默认值 */
  defaultValue?: unknown;
}