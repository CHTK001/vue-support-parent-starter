import type { ReTableColumnStorage } from "./columnStorage";

/** ReTable 列定义 */
export interface ReTableColumn {
  /** 字段名（对应行数据的属性） */
  prop: string;
  /** 列标题 */
  label: string;
  /** 列宽 */
  width?: string | number;
  /** 最小宽度 */
  minWidth?: string | number;
  /** 固定列 */
  fixed?: boolean | "left" | "right";
  /** 对齐方式 */
  align?: "left" | "center" | "right";
  /** 是否可排序 */
  sortable?: boolean | "custom";
  /** 是否显示 */
  hidden?: boolean;
  /** 格式化 */
  formatter?: (row: Record<string, unknown>, column: ReTableColumn, cellValue: unknown) => string;
  /** 插槽名（表格列自定义插槽） */
  slot?: string;
}

/**
 * 分页响应结构（兼容常见后端包裹）
 * - 必填：total
 * - 选填：data / records / rows / list / items / content（任意一种数组字段）
 */
export interface RePageResult<T = Record<string, unknown>> {
  total: number;
  /** 数据数组（兼容多种命名，loader 内部会自动识别） */
  data?: T[];
  records?: T[];
  rows?: T[];
  list?: T[];
  items?: T[];
  content?: T[];
}

/** 远程数据加载器签名：接收分页 + 查询参数，返回分页结果 */
export type ReTableLoader = (
  params: ReTableLoadParams,
) => RePageResult | Promise<RePageResult>;

export interface ReTableLoadParams {
  page: number;
  pageSize: number;
  params: Record<string, unknown>;
}

/** 列持久化配置 */
export interface ReTableColumnState {
  /** 列顺序（按 prop 排序） */
  order: string[];
  /** 隐藏的列 prop 集合 */
  hidden: string[];
}

/** 表格完整持久化状态（列配置 + 分页 + 设置） */
export interface ReTableFullState extends ReTableColumnState {
  /** 当前页码 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 表格设置 */
  settings?: ReTableSettings;
  /** 排序字段 */
  sortProp?: string;
  /** 排序方向 */
  sortOrder?: "ascending" | "descending" | null;
}

/** 表格外观设置 */
export interface ReTableSettings {
  /** 斑马纹 */
  stripe?: boolean;
  /** 边框 */
  border?: boolean;
  /** 紧凑模式：size='small' */
  compact?: boolean;
  /** 显示斑马纹列（hover 高亮） */
  highlightCurrentRow?: boolean;
}

/** 表格布局模式 */
export type ReTableLayout = "table" | "virtual" | "card" | "modern";

/** 卡片模式单卡渲染字段定义 */
export interface ReCardField {
  /** 字段名（对应行数据的属性） */
  prop: string;
  /** 标签（可省略，省略时不显示标签） */
  label?: string;
  /** 自定义渲染函数 */
  render?: (row: Record<string, unknown>, value: unknown) => string;
  /** 是否作为卡片的"标题"字段（用于卡片头部放大展示） */
  title?: boolean;
  /** 是否作为"封面图"字段（值为 url，渲染为 img） */
  cover?: boolean;
}

/** 卡片模式专属属性（CSS 类名前缀 layout-card） */
export interface ReCardLayoutProps {
  /** 卡片栅格列数（1-6），默认 3 */
  columns?: number;
  /** 卡片最小宽度（px），瀑布流布局生效 */
  minWidth?: number;
  /** 卡片间距（px） */
  gap?: number;
  /** 封面图高度（px） */
  coverHeight?: number;
  /** 卡片圆角（px） */
  radius?: number;
  /** 卡片悬浮阴影 */
  hoverable?: boolean;
  /** 卡片背景色（CSS color） */
  background?: string;
  /** 卡片内展示的字段；不传则用 columns 转卡片字段 */
  fields?: ReCardField[];
  /** 自定义字段顺序的 prop 列表（默认 columns 顺序） */
  fieldOrder?: string[];
}

/** 虚拟表格模式专属属性（CSS 类名前缀 layout-virtual） */
export interface ReVirtualLayoutProps {
  /** 行高（px），默认 50 */
  rowHeight?: number;
  /** 可见行数（不传则自动计算） */
  visibleRows?: number;
  /** 预估总行数（用于优化滚动条） */
  estimatedRowHeight?: number;
  /** 是否启用固定表头 */
  fixedHeader?: boolean;
  /** 表头高度（px），默认 50 */
  headerHeight?: number;
}

/** 表格默认模式专属属性（CSS 类名前缀 layout-table） */
export interface ReTableLayoutProps {
  /** el-table 原生 props 透传（已在 props 中直接接收） */
  showHeader?: boolean;
  /** 表格高度 */
  height?: string | number;
  /** 最大高度 */
  maxHeight?: string | number;
}

/** 表格完整布局配置 */
export interface ReTableLayoutConfig {
  /** 当前布局模式 */
  mode: ReTableLayout;
  /** 表格模式专属属性 */
  table?: ReTableLayoutProps;
  /** 虚拟表格模式专属属性 */
  virtual?: ReVirtualLayoutProps;
  /** 卡片模式专属属性 */
  card?: ReCardLayoutProps;
}