/**
 * 通用类型定义
 */

/** 组件通用类型属性（与 element-plus 保持一致） */
export type ComponentType =
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "";

/** 组件尺寸 */
export type ComponentSize = "large" | "default" | "small";

/**
 * 动态数据源：支持直接传入值 / 远程 url / 返回数据的函数
 */
export type DataSource<T = unknown> =
  | T
  | T[]
  | string
  | (() => T | T[] | Promise<T | T[]>);

/** 数据加载结果 */
export interface LoadResult<T = unknown> {
  /** 加载中的标记 */
  loading: boolean;
  /** 数据本体 */
  data: T | null;
  /** 加载失败时的错误 */
  error?: Error;
  /** 重新加载 */
  reload: () => Promise<void>;
}
