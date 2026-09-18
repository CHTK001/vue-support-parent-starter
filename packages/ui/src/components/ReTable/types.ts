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
  /** 单元格内容超出时是否显示 tooltip */
  showOverflowTooltip?: boolean;
  /** 是否可编辑（批量编辑模式下显示输入框） */
  editable?: boolean;
  /** 编辑类型：text / number / select / date */
  editType?: "text" | "number" | "select" | "date";
  /** 编辑选项（editType='select' 时生效） */
  editOptions?: Array<{ label: string; value: unknown }>;
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

/** 表格布局模式 */
export type ReTableLayout = "table" | "virtual" | "card" | "modern" | "canvas" | "radial";

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

/** Canvas 表格模式专属属性（基于 AG Grid，CSS 类名前缀 layout-canvas） */
export interface ReCanvasLayoutProps {
  /** 行高（px），默认 40 */
  rowHeight?: number;
  /** 表头高度（px），默认 48 */
  headerHeight?: number;
  /** 表格高度（px 或 'auto'） */
  height?: string | number;
  /** 是否启用固定表头（默认 true） */
  fixedHeader?: boolean;
  /** 是否启用固定列（默认 false） */
  fixedColumns?: boolean;
  /** 是否显示边框（默认 true） */
  bordered?: boolean;
  /** 是否显示斑马纹（默认 false） */
  striped?: boolean;
  /** 是否启用行悬停高亮（默认 true） */
  hoverable?: boolean;
  /** 是否启用列宽拖拽调整（默认 true） */
  resizable?: boolean;
  /** 是否启用列排序（默认 true） */
  sortable?: boolean;
  /** 是否启用列筛选（默认 false） */
  filterable?: boolean;
  /** 行选择模式：不选 / 单选 / 多选 */
  rowSelection?: "none" | "single" | "multiple";
  /** 主题：alpine（默认）/ balham / material */
  theme?: "alpine" | "balham" | "material";
  /** AG Grid 原生 gridOptions 透传（高级用法，会覆盖上述配置） */
  gridOptions?: Record<string, unknown>;
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
  /** 拖拽行数据 */
  row: Record<string, unknown>;
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
  /** 虚拟表格模式专属属性 */
  virtual?: ReVirtualLayoutProps;
  /** 卡片模式专属属性 */
  card?: ReCardLayoutProps;
  /** Canvas 表格模式专属属性（AG Grid） */
  canvas?: ReCanvasLayoutProps;
  /** 放射菜单模式专属属性 */
  radial?: ReRadialLayoutProps;
}

/** 放射菜单模式单行子菜单项 */
export interface ReRadialMenuItem {
  /** 唯一标识 */
  key: string;
  /** 显示文字（留空时仅显示图标） */
  label?: string;
  /** 是否纯图标模式（不渲染文字） */
  iconOnly?: boolean;
  /** 图标（Element Plus 图标组件或 SVG 字符串） */
  icon?: any;
  /** 颜色类型：primary / success / warning / danger / info */
  type?: "primary" | "success" | "warning" | "danger" | "info";
  /** 是否禁用 */
  disabled?: boolean;
  /** tooltip 提示文字（纯图标模式下默认用 label，否则显示此字段） */
  tip?: string;
}

/** 放射菜单模式专属属性（CSS 类名前缀 layout-radial） */
export interface ReRadialLayoutProps {
  /** 中心图表尺寸（px），默认 48 */
  chartSize?: number;
  /** 中心图表形状：square / circle，默认 circle */
  chartShape?: "square" | "circle";
  /** 中心图表颜色字段名（对应行数据属性），不传则用 type 字段 */
  chartTypeField?: string;
  /** 中心图表背景色（CSS color 或函数） */
  chartColor?: string | ((row: Record<string, unknown>) => string);
  /** 子菜单方向：'auto'（根据位置自动选择）| 'all'（四个方向全开）| 字符串数组 */
  menuDirections?: "auto" | "all" | ("top" | "bottom" | "left" | "right")[];
  /** 子菜单项数据（静态） */
  menuItems?: ReRadialMenuItem[];
  /** 子菜单项数据生成函数 */
  menuItemsFn?: (row: Record<string, unknown>) => ReRadialMenuItem[];
  /** 子菜单展开方向偏移量（px），默认 60 */
  menuOffset?: number;
  /** 子菜单项宽度（px），默认 80 */
  menuItemWidth?: number;
  /** 是否可多选展开（默认 true = 同时展开多个） */
  multipleOpen?: boolean;
  /** 纯图标模式：子菜单项仅显示图标 + tooltip，不显示文字 */
  iconOnly?: boolean;
  /** 行高（px），默认 56 */
  rowHeight?: number;
  /** 是否显示 checkbox */
  selectable?: boolean;
  /** 点击行本身是否也触发展开 */
  rowExpandable?: boolean;
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
