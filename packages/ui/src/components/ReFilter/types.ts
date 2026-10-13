import type { ReSelectLoader } from "../ReSelect/types";

/** ReFilter 筛选项类型 */
export interface ReFilterItem {
  /** 字段名（对应查询参数 key） */
  prop: string;
  /** 显示标签 */
  label: string;
  /** 控件类型 */
  type?: "input" | "select" | "date" | "daterange" | "checkbox" | "number" | "slot";
  /** 占位符 */
  placeholder?: string;
  /** select 类型选项 */
  options?: Array<{ label: string; value: string | number }>;
  /**
   * 远端数据源（与 options 二选一）：url 字符串或加载函数。
   *
   * <p>提供后 select 改走 ReSelect 远端加载（同 ReTable / ReSelect 约定）：
   * 字符串视为 {@link url}，函数视为 {@link loader}。也可分别用 url / loader 显式声明。</p>
   */
  dataSource?: string | ReSelectLoader;
  /** 远端 url（与 options/dataSource 二选一） */
  url?: string;
  /** 远端加载函数（与 options/dataSource 二选一，等价于 url） */
  loader?: ReSelectLoader;
  /** 是否多选 */
  multiple?: boolean;
  /** 是否可清空 */
  clearable?: boolean;
  /** 默认值 */
  defaultValue?: unknown;
  /** 是否始终显示（不在"更多"中） */
  always?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 栅格跨度（1-24，默认 6） */
  span?: number;
}

/** ReFilter 组件 Props */
export interface ReFilterProps {
  /** 筛选项配置 */
  items?: ReFilterItem[];
  /** 一行显示几个（默认 4，即 span=6） */
  columns?: number;
  /** 超过一行时显示"展开更多" */
  collapsible?: boolean;
  /** 默认是否展开 */
  expanded?: boolean;
  /** 是否显示重置/查询按钮 */
  showActions?: boolean;
  /** 查询按钮文案 */
  searchText?: string;
  /** 重置按钮文案 */
  resetText?: string;
  /** 是否显示抽屉模式（高级筛选） */
  drawerEnabled?: boolean;
  /** 抽屉标题 */
  drawerTitle?: string;
  /** 抽屉宽度 */
  drawerSize?: string | number;
}
