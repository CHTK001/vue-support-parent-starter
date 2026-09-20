/**
 * 系统管理模块通用 CRUD 类型定义
 *
 * 为 useSystemCrud 提供类型约束，覆盖列表查询、分页、弹窗表单等常见模式。
 */
import type { PageQuery } from "../api/types";

/** 通用弹窗模式 */
export type DialogMode = "create" | "edit";

/** 确认函数签名 */
export type ConfirmFn = (message: string, title?: string) => Promise<void>;

/** useSystemCrud 配置项 */
export interface UseSystemCrudOptions<T, Q extends PageQuery, F> {
  /** 初始查询条件（必须包含 page / pageSize） */
  query: Q;
  /** 列表加载函数：返回 Promise<PageResult<T>> */
  load: (params: Q) => Promise<{ data?: { data?: T[]; records?: T[]; total?: number } | null }>;
  /** 新增接口 */
  save?: (data: F) => Promise<unknown>;
  /** 编辑接口 */
  update?: (data: F) => Promise<unknown>;
  /** 删除接口（接收主键） */
  remove?: (id: string | number) => Promise<unknown>;
  /** 初始化空表单 */
  initForm?: () => F;
  /** 提交前校验 */
  validate?: (form: F, mode: DialogMode) => string | undefined;
  /** 操作成功后的提示文案 */
  messages?: {
    save?: string;
    update?: string;
    remove?: string;
  };
}

/** useSystemCrud 返回值 */
export interface UseSystemCrudReturn<T, Q extends PageQuery, F> {
  /** 查询条件 */
  query: Q;
  /** 列表数据 */
  list: T[];
  /** 总条数 */
  total: number;
  /** 列表加载状态 */
  loading: boolean;
  /** 加载列表 */
  loadList: () => Promise<void>;
  /** 搜索：重置到第 1 页并加载 */
  handleSearch: () => Promise<void>;
  /** 重置查询条件并加载 */
  handleReset: (fields?: Partial<Q>) => Promise<void>;
  /** 弹窗显隐 */
  dialogVisible: boolean;
  /** 当前弹窗模式 */
  dialogMode: DialogMode;
  /** 表单对象 */
  form: F;
  /** 提交 loading */
  saving: boolean;
  /** 打开新增弹窗 */
  handleAdd: () => void;
  /** 打开编辑弹窗（建议传入深拷贝后的行数据） */
  handleEdit: (row: T) => void;
  /** 表单提交 */
  handleSubmit: () => Promise<void>;
  /** 删除单行 */
  handleDelete: (row: T, idKey?: keyof T) => Promise<void>;
  /** 关闭弹窗 */
  closeDialog: () => void;
}
