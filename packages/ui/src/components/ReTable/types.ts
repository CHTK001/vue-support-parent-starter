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