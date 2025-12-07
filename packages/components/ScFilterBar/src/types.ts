/**
 * ScFilterBar 组件类型定义
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
 */

/**
 * 筛选字段类型
 */
export type FilterFieldType =
  | "input"
  | "select"
  | "date"
  | "daterange"
  | "datetime"
  | "datetimerange"
  | "number"
  | "cascader"
  | "tree-select"
  | "switch"
  | "radio"
  | "checkbox"
  | "slider"
  | "rate"
  | "color"
  | "custom";

/**
 * 布局方式
 */
export type FilterLayout = "horizontal" | "vertical" | "inline" | "grid";

/**
 * 筛选字段配置
 */
export interface FilterField {
  /**
   * 字段唯一标识
   */
  prop: string;

  /**
   * 字段标签
   */
  label: string;

  /**
   * 字段类型
   * @default 'input'
   */
  type?: FilterFieldType;

  /**
   * 默认值
   */
  defaultValue?: unknown;

  /**
   * 占位符
   */
  placeholder?: string;

  /**
   * 选项列表（select、radio、checkbox 类型使用）
   */
  options?: FilterOption[];

  /**
   * 远程获取选项的函数
   */
  fetchOptions?: () => Promise<FilterOption[]>;

  /**
   * 是否必填
   * @default false
   */
  required?: boolean;

  /**
   * 验证规则
   */
  rules?: unknown[];

  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean;

  /**
   * 是否可清除
   * @default true
   */
  clearable?: boolean;

  /**
   * 是否多选（select 类型使用）
   * @default false
   */
  multiple?: boolean;

  /**
   * 组件属性透传
   */
  props?: Record<string, unknown>;

  /**
   * 所占列数（grid 布局使用）
   * @default 1
   */
  span?: number;

  /**
   * 是否折叠隐藏（超出显示数量时）
   * @default false
   */
  collapsed?: boolean;

  /**
   * 是否始终显示（不受折叠影响）
   * @default false
   */
  alwaysShow?: boolean;

  /**
   * 排序权重（数值越小越靠前）
   * @default 0
   */
  order?: number;

  /**
   * 字段宽度
   */
  width?: string | number;

  /**
   * 标签宽度
   */
  labelWidth?: string | number;

  /**
   * 自定义渲染插槽名
   */
  slot?: string;

  /**
   * 值变化时的回调
   */
  onChange?: (value: unknown, field: FilterField) => void;

  /**
   * 联动字段配置
   */
  linkage?: {
    /**
     * 目标字段
     */
    target: string;
    /**
     * 联动方式
     */
    type: "show" | "hide" | "enable" | "disable" | "options" | "value";
    /**
     * 触发条件
     */
    condition?: (value: unknown) => boolean;
    /**
     * 联动数据（options 类型使用）
     */
    data?: FilterOption[] | ((value: unknown) => FilterOption[]);
  }[];
}

/**
 * 选项配置
 */
export interface FilterOption {
  /**
   * 选项值
   */
  value: string | number | boolean;

  /**
   * 选项标签
   */
  label: string;

  /**
   * 是否禁用
   */
  disabled?: boolean;

  /**
   * 子选项（级联选择使用）
   */
  children?: FilterOption[];

  /**
   * 额外数据
   */
  [key: string]: unknown;
}

/**
 * 筛选值
 */
export type FilterValue = Record<string, unknown>;

/**
 * ScFilterBar 组件属性
 */
export interface ScFilterBarProps {
  /**
   * 筛选字段配置
   */
  fields: FilterField[];

  /**
   * 筛选值（v-model）
   */
  modelValue?: FilterValue;

  /**
   * 布局方式
   * @default 'inline'
   */
  layout?: FilterLayout;

  /**
   * 默认显示的字段数量
   * @default 3
   */
  visibleCount?: number;

  /**
   * 是否显示展开/收起按钮
   * @default true
   */
  showExpand?: boolean;

  /**
   * 展开按钮文本
   * @default '更多筛选'
   */
  expandText?: string;

  /**
   * 收起按钮文本
   * @default '收起'
   */
  collapseText?: string;

  /**
   * 是否显示搜索按钮
   * @default true
   */
  showSearch?: boolean;

  /**
   * 搜索按钮文本
   * @default '搜索'
   */
  searchText?: string;

  /**
   * 是否显示重置按钮
   * @default true
   */
  showReset?: boolean;

  /**
   * 重置按钮文本
   * @default '重置'
   */
  resetText?: string;

  /**
   * 标签宽度
   * @default '80px'
   */
  labelWidth?: string | number;

  /**
   * 标签位置
   * @default 'right'
   */
  labelPosition?: "left" | "right" | "top";

  /**
   * 表单大小
   * @default 'default'
   */
  size?: "large" | "default" | "small";

  /**
   * 是否内联显示
   * @default true
   */
  inline?: boolean;

  /**
   * 栅格列数（grid 布局使用）
   * @default 4
   */
  columns?: number;

  /**
   * 栅格间距
   * @default 16
   */
  gutter?: number;

  /**
   * 是否显示边框
   * @default false
   */
  border?: boolean;

  /**
   * 是否显示背景
   * @default false
   */
  background?: boolean;

  /**
   * 是否显示标签
   * @default true
   */
  showLabel?: boolean;

  /**
   * 是否实时搜索（值变化时自动触发搜索）
   * @default false
   */
  realtime?: boolean;

  /**
   * 实时搜索防抖延迟（毫秒）
   * @default 300
   */
  debounceTime?: number;

  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean;

  /**
   * 是否加载中
   * @default false
   */
  loading?: boolean;

  /**
   * 默认展开状态
   * @default false
   */
  defaultExpanded?: boolean;

  /**
   * 快捷筛选项（常用筛选）
   */
  quickFilters?: QuickFilter[];

  /**
   * 是否显示快捷筛选
   * @default true
   */
  showQuickFilters?: boolean;

  /**
   * 按钮是否只显示图标
   * @default false
   */
  iconOnly?: boolean;
}

/**
 * 快捷筛选配置
 */
export interface QuickFilter {
  /**
   * 快捷筛选标识
   */
  key: string;

  /**
   * 快捷筛选标签
   */
  label: string;

  /**
   * 快捷筛选值
   */
  value: FilterValue;

  /**
   * 图标
   */
  icon?: string;

  /**
   * 是否选中
   */
  active?: boolean;
}
