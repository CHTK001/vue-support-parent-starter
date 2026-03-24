/**
 * ScSelect 组件类型定义
 * @author CH
 * @date 2024-01-20
 * @version 1.0.0
 */

import type { TreeKey, TreeNodeData } from '../ScTree/types';

/**
 * 基础选项接口
 */
export interface BaseOption {
  /** 选项标签 */
  label: string;
  /** 选项值 */
  value: string | number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 图标 */
  icon?: string;
  /** 描述信息 */
  desc?: string;
  /** 自定义属性 */
  [key: string]: any;
}

/**
 * 卡片选项接口
 */
export interface CardOption extends BaseOption {
  /** 图片配置 */
  image?: {
    /** 图片宽度 */
    width: string;
    /** 图片高度 */
    height: string;
  };
  /** 预览图 */
  preview?: string;
}

/**
 * 下拉选项接口
 */
export interface DropdownOption extends BaseOption {
  /** 名称（兼容字段） */
  name?: string;
  /** 描述（兼容字段） */
  describe?: string;
  /** 描述信息（兼容字段） */
  description?: string;
  /** 图片配置 */
  image?: {
    /** 图片宽度 */
    width: string;
    /** 图片高度 */
    height: string;
  };
  /** 预览图 */
  preview?: string;
}

/**
 * 树形选项接口
 */
export interface TreeSelectOption extends TreeNodeData {
  /** 选项值 */
  value: TreeKey;
  /** 选项标签 */
  label: string;
  /** 子节点 */
  children?: TreeSelectOption[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 图标 */
  icon?: string;
  /** 描述信息 */
  desc?: string;
  /** 自定义属性 */
  [key: string]: any;
}

/**
 * 过滤器选项接口
 */
export interface FilterOption {
  /** 字段键 */
  key: string;
  /** 字段标题 */
  title: string;
  /** 是否多选 */
  multiple: boolean;
  /** 选项列表 */
  options: BaseOption[];
}

/**
 * 表格列配置接口
 */
export interface TableColumn {
  /** 字段属性 */
  prop: string;
  /** 列标题 */
  label: string;
  /** 最小宽度 */
  minWidth: string;
}

/**
 * 选择器属性配置接口
 */
export interface SelectProps {
  /** 标签字段 */
  label: string;
  /** 值字段 */
  prop: string;
  /** 图标字段 */
  icon: string;
}

/**
 * 过滤器字段类型接口
 */
export interface FilterFieldType {
  /** 字段属性 */
  prop: string;
  /** 字段类型 */
  type: string;
}

/**
 * 树形属性配置接口
 */
export interface TreeProps {
  /** 子节点字段 */
  children?: string;
  /** 标签字段 */
  label?: string;
  /** 禁用字段 */
  disabled?: string;
}

/**
 * 布局类型
 */
export type LayoutType = 'card' | 'select' | 'pill' | 'dropdown' | 'filter' | 'table' | 'tree';

/**
 * 输出格式类型
 */
export type OutputFormat = 'default' | 'tree' | 'flat';

/**
 * 过滤器输出格式类型
 */
export type FilterOutputFormat = 'sql' | 'object' | 'array';

/**
 * 过滤器操作符类型
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'not_in';

/**
 * 图标位置类型
 */
export type IconPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * ScSelect 组件 Props 接口
 */
export interface ScSelectProps {
  /** v-model绑定值 */
  modelValue?: string | number | Array<string | number>;
  /** 数据源URL函数 */
  url?: Function;
  /** URL参数 */
  urlParams?: Record<string, any>;
  /** 选项数组 */
  options: BaseOption[] | CardOption[] | DropdownOption[] | TreeSelectOption[] | FilterOption[];
  /** 属性配置 */
  props?: SelectProps;
  /** 是否远程数据 */
  isRemote?: boolean;
  /** 每行显示的卡片数量 */
  columns?: number | string;
  /** 卡片间距 */
  gap?: number;
  /** 布局类型 */
  layout?: LayoutType;
  /** 是否多选 */
  multiple?: boolean;
  /** 多选模式下最多可选择的数量 */
  limit?: number;
  /** 多选模式下最多显示的标签数量 */
  maxCollapseTags?: number;
  /** 是否显示批量操作按钮 */
  showBatchActions?: boolean;
  /** 组件宽度 */
  width?: string;
  /** 组件高度 */
  height?: string;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否显示边框 */
  border?: boolean;
  /** 图标 */
  icon?: string;
  /** 图标位置 */
  iconPosition?: IconPosition;
  /** 下拉标题 */
  dropdownTitle?: string;
  /** 下拉占位符 */
  dropdownPlaceholder?: string;
  /** 标签宽度 */
  labelWidth?: number;
  /** 输出格式 */
  outputFormat?: OutputFormat;
  /** 过滤器输出格式 */
  filterOutputFormat?: FilterOutputFormat;
  /** 过滤器操作符 */
  filterOperator?: FilterOperator;
  /** 过滤器字段 */
  filterField?: string;
  /** 表格列配置 */
  tableColumns?: TableColumn[];
  /** 表格页大小 */
  tablePageSize?: number;
  /** 表格远程搜索 */
  tableRemoteSearch?: boolean;
  
  // 树形布局相关属性
  /** 树节点配置 */
  treeProps?: TreeProps;
  /** 树节点唯一标识字段 */
  treeNodeKey?: string;
  /** 树节点图标字段 */
  treeIconProp?: string;
  /** 树节点描述字段 */
  treeDescProp?: string;
  /** 是否显示搜索框 */
  treeShowSearch?: boolean;
  /** 搜索框占位符 */
  treeSearchPlaceholder?: string;
  /** 是否显示操作栏 */
  treeShowActions?: boolean;
  /** 是否默认展开所有节点 */
  treeDefaultExpandAll?: boolean;
  /** 是否在点击节点时展开/收起节点 */
  treeExpandOnClickNode?: boolean;
  /** 在显示复选框的情况下，是否严格的遵循父子不互相关联的做法 */
  treeCheckStrictly?: boolean;
  /** 是否只能选择叶子节点 */
  treeLeafOnly?: boolean;
}

/**
 * ScSelect 组件 Emits 接口
 */
export interface ScSelectEmits {
  /** 更新v-model值 */
  'update:modelValue': [value: string | number | Array<string | number>];
  /** 值变化事件 */
  'change': [value: string | number | Array<string | number>, option?: any];
  /** 节点点击事件（树形布局） */
  'node-click': [data: TreeNodeData, node: any];
  /** 复选框变化事件（树形布局） */
  'check': [data: TreeNodeData, checked: boolean, indeterminate: boolean];
  /** 当前选中节点变化事件（树形布局） */
  'current-change': [data: TreeNodeData, node: any];
}