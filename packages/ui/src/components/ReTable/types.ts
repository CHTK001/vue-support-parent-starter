import type { ReTableColumnStorage } from "./columnStorage";

/**
 * 行内编辑 select 可用的选项值类型。
 *
 * <p>与 {@link ReTableColumn.editOptions} 的 value 保持一致，取 Element Plus
 * {@code el-option} / {@code el-select} 接受的取值范围。</p>
 */
export type EditOptionValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | Array<unknown>
  | undefined;

/** ReTable 列定义 */
export interface ReTableColumn {
  /** 字段名（对应行数据的属性） */
  prop: string;
  /** 列标题 */
  label: string;
  /** 列宽 */
  width?: string | number;
  /** 最小宽度（拖拽列宽时的下限） */
  minWidth?: string | number;
  /** 最大宽度（拖拽列宽时的上限）；不传表示不限 */
  maxWidth?: string | number;
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
  /** 单元格内容超出时是否显示 tooltip */
  showOverflowTooltip?: boolean;
  /** 是否可编辑（批量编辑模式下显示输入框） */
  editable?: boolean;
  /** 编辑类型：text / number / select / date */
  editType?: "text" | "number" | "select" | "date";
  /**
   * 编辑选项（editType='select' 时生效）
   *
   * <p>value 用 {@link EditOptionValue}：基础为 string / number / boolean，
   * 另允许对象与数组以覆盖多选值等场景。用 unknown 会让 el-option 的 value 绑定
   * 报 TS2322，故此处给出可赋值的宽类型。</p>
   */
  editOptions?: Array<{ label: string; value: EditOptionValue }>;
  /** 是否可拖拽调整列宽（默认 true，需 border 模式） */
  resizable?: boolean;
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
  /** 边框（默认 true） */
  border?: boolean;
  /** 紧凑模式：size='small' */
  compact?: boolean;
  /** 显示斑马纹列（hover 高亮） */
  highlightCurrentRow?: boolean;
  /** 可调整列宽（需 border 模式，默认 true） */
  resizable?: boolean;
}

/** 表格布局模式：table（默认）/ view / card；modern / virtual / canvas / radial 已随功能下线移除 */
export type ReTableLayout = "table" | "view" | "card";

/** 布局切换器里可展示的布局（视图/卡片自带默认模板，调用方无需额外传模板） */
export type ReTableSwitchLayout = Extract<ReTableLayout, "table" | "view" | "card">;

/** 视图模式单个字段定义（默认模板用；也可整体用 #view 插槽替换） */
export interface ReViewField {
  /** 字段名（对应行数据的属性） */
  prop: string;
  /** 标签（省略则只显示值） */
  label?: string;
  /** 自定义渲染函数（返回字符串） */
  render?: (row: Record<string, unknown>, value: unknown) => string;
  /** 作为视图主标题（最多一个） */
  title?: boolean;
  /** 作为副标题（最多一个） */
  desc?: boolean;
  /** 作为标签徽标（可多个，渲染为一排 chip） */
  tag?: boolean;
  /** 字段值类型：text 默认；tag 走 chip 样式；time 走等宽数字 */
  type?: "text" | "tag" | "time";
  /** 固定宽度（px），用于数值列 */
  width?: number;
}

/** 视图模式专属属性（CSS 类名前缀 layout-view） */
export interface ReViewLayoutProps {
  /** 视图内展示的字段；不传则用 columns 转视图字段 */
  fields?: ReViewField[];
  /** 自定义字段顺序的 prop 列表（默认 columns 顺序） */
  fieldOrder?: string[];
  /** 单条视图最小高度（px），默认 72 */
  minHeight?: number;
  /** 视图间距（px），默认 10 */
  gap?: number;
  /** 视图圆角（px），默认 12 */
  radius?: number;
  /** 是否显示序号（默认 true） */
  showIndex?: boolean;
  /** 序号起始值（配合分页，默认 1） */
  indexStart?: number;
  /** 悬浮高亮（默认 true） */
  hoverable?: boolean;
  /** 视图背景色（CSS color） */
  background?: string;
}

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
  /** 是否作为"副标题"字段 */
  desc?: boolean;
  /** 是否作为标签徽标（渲染为一排 chip） */
  tag?: boolean;
  /** 字段值类型：text 默认；tag 走 chip 样式；time 走等宽数字 */
  type?: "text" | "tag" | "time";
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

/** 表格默认模式专属属性（CSS 类名前缀 layout-table） */
export interface ReTableLayoutProps {
  /** el-table 原生 props 透传（已在 props 中直接接收） */
  showHeader?: boolean;
  /** 表格高度 */
  height?: string | number;
  /** 最大高度 */
  maxHeight?: string | number;
}

/** 右键菜单项 */
export interface ReTableContextMenuItem {
  /** 唯一标识 */
  key: string;
  /** 显示文字 */
  label: string;
  /** 图标（Element Plus 图标组件或图标类名） */
  icon?: any;
  /** 是否禁用 */
  disabled?: boolean | ((ctx: ReTableContextMenuContext) => boolean);
  /** 是否显示分割线 */
  divided?: boolean;
  /** 子菜单 */
  children?: ReTableContextMenuItem[];
}

/** 右键菜单上下文（传入行/cell 信息） */
export interface ReTableContextMenuContext {
  /** 右键所在行数据 */
  row: Record<string, unknown>;
  /** 右键所在行索引 */
  rowIndex: number;
  /** 右键所在列字段名 */
  columnProp?: string;
  /** 右键所在列标签 */
  columnLabel?: string;
  /** 原生鼠标事件 */
  event: MouseEvent;
}

/** cell-click 事件载荷 */
export interface ReTableCellClickPayload {
  /** 行数据 */
  row: Record<string, unknown>;
  /** 行索引 */
  rowIndex: number;
  /** 列字段名 */
  columnProp: string;
  /** 列标签 */
  columnLabel: string;
  /** 单元格值 */
  cellValue: unknown;
  /** 原生鼠标事件 */
  event: MouseEvent;
}

/** toolbar 批量删除按钮配置 */
export interface ReTableToolbarBatchDelete {
  /** 是否启用 */
  enabled?: boolean;
  /** 图标 */
  icon?: any;
  /** 提示文字 */
  tip?: string;
  /** 确认消息 */
  confirmMessage?: string;
  /** 删除回调（返回 Promise 时自动处理 loading） */
  handler: (rows: Record<string, unknown>[]) => void | Promise<void>;
}

/** toolbar 批量选择按钮配置 */
export interface ReTableToolbarBatchSelect {
  /** 是否启用 */
  enabled?: boolean;
  /** 图标 */
  icon?: any;
  /** 提示文字 */
  tip?: string;
}

/** toolbar 批量修改按钮配置 */
export interface ReTableToolbarBatchEdit {
  /** 是否启用 */
  enabled?: boolean;
  /** 图标（编辑态） */
  icon?: any;
  /** 提示文字（编辑态） */
  tip?: string;
  /** 保存图标 */
  saveIcon?: any;
  /** 保存提示文字 */
  saveTip?: string;
  /** 保存回调（返回 Promise 时自动处理 loading） */
  handler: (rows: Record<string, unknown>[]) => void | Promise<void>;
}

/** toolbar 配置 */
export interface ReTableToolbarConfig {
  /** 是否启用批量删除 */
  batchDelete?: boolean | ReTableToolbarBatchDelete;
  /** 是否启用批量选择（checkbox 列） */
  batchSelect?: boolean | ReTableToolbarBatchSelect;
  /** 是否启用批量修改（编辑→保存切换） */
  batchEdit?: boolean | ReTableToolbarBatchEdit;
  /** 是否显示刷新按钮（默认 true） */
  refresh?: boolean;
  /** 是否显示列设置按钮（默认 true） */
  columnSettings?: boolean;
  /** 是否显示表格设置按钮（默认 true） */
  tableSettings?: boolean;
  /** toolbar 位置：'top' 表格上方 | 'bottom' 分页同行（默认 'bottom'） */
  position?: "top" | "bottom";
}

/** 排序变化事件载荷 */
export interface ReTableSortChangePayload {
  /** 排序列字段名 */
  prop: string;
  /** 排序方向 */
  order: "ascending" | "descending" | null;
}

/** 行拖拽排序事件载荷 */
export interface ReTableRowSortPayload {
  /** 拖拽行数据；工具栏「确认排序」整体提交时为 null */
  row: Record<string, unknown> | null;
  /** 原始索引 */
  fromIndex: number;
  /** 目标索引 */
  toIndex: number;
  /** 排序后的数据 */
  newData: Array<Record<string, unknown>>;
}

/** 树形数据配置（透传 el-table tree-props） */
export interface ReTableTreeProps {
  /** 子节点字段名，默认 children */
  children?: string;
  /** 是否懒加载子节点 */
  lazy?: boolean;
  /** 懒加载函数 */
  load?: (row: Record<string, unknown>, treeNode: unknown, resolve: (data: Record<string, unknown>[]) => void) => void;
  /** 是否有子节点字段名（lazy 模式），默认 hasChildren */
  hasChildren?: string;
  /** 是否严格模式（父子不关联） */
  checkStrictly?: boolean;
}

/** 表格完整布局配置 */
export interface ReTableLayoutConfig {
  /** 当前布局模式 */
  mode: ReTableLayout;
  /** 表格模式专属属性 */
  table?: ReTableLayoutProps;
  /** 卡片模式专属属性 */
  card?: ReCardLayoutProps;
}

/** ReTable 内置搜索过滤项（透传 ReSearch filters 模式） */
export interface ReTableSearchFilter {
  /** 字段 key（与 searchModel / params 中的键对应） */
  key: string;
  /** 标签文案 */
  label?: string;
  /** 组件类型：input / select / date / daterange / treeselect（默认 input） */
  type?: "input" | "select" | "date" | "daterange" | "treeselect";
  /** 占位文案 */
  placeholder?: string;
  /** select / treeselect 选项数据 */
  options?: Array<{ label: string; value: string | number; children?: any[] }>;
  /** 其他透传给子组件的属性 */
  attrs?: Record<string, unknown>;
}

/** ReTable 内置 ReSearch 搜索区配置（search 传对象时的字段） */
export interface ReTableSearchConfig {
  /** 过滤项配置（filters 优先；不传时回退到 #search 插槽） */
  filters?: ReTableSearchFilter[];
  /** 搜索区标题（默认 "搜索"） */
  title?: string;
  /** 默认展开的最大表项数（0=不限） */
  max?: number;
  /** 工具栏按钮模式：icon=图标+tooltip / text=图标+文字 */
  btnMode?: "icon" | "text";
  /** 是否显示"显示/隐藏搜索"切换按钮（默认 true） */
  showToggle?: boolean;
  /** 是否显示搜索按钮（默认 true） */
  showSearchBtn?: boolean;
  /** 是否显示重置按钮（默认 true） */
  showResetBtn?: boolean;
  /** 是否显示刷新按钮（默认 true） */
  showRefreshBtn?: boolean;
}

/** ReTable 内置搜索区属性（search 属性类型） */
export type ReTableSearch = boolean | ReTableSearchConfig;

/**
 * ReTable 内置自动刷新：工具栏出现计时按钮，点亮后由表格自身持有定时器轮询 reload。
 *
 * <p>页面不要再自己 setInterval —— 定时器跟着组件与 keep-alive 的激活态一起起停。
 * 只需开关时传 {@code true}，要调间隔 / 默认开启时传对象。</p>
 */
export type ReTableAutoRefresh = boolean | {
  /** 默认轮询间隔（ms），下限 1000 */
  interval?: number;
  /** 挂载即按 interval 开启（默认 false，关闭态由用户在浮层里选档） */
  defaultOn?: boolean;
  /** 浮层里的可选档位（ms）；传 0 表示「关闭」这一档 */
  intervals?: number[];
};

