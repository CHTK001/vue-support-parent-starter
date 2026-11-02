import type { ReTableColumnStorage } from "./columnStorage";
import type { ReSelectLoader } from "../ReSelect/types";

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
  /**
   * 自定义表头插槽名（父组件用这个名字提供插槽）。
   *
   * <p>表头有时不只是「一个字」：两行表头（字段名 + 类型/注释）、排序图标、
   * 悬浮提示都要参与渲染，纯文本 label 表达不了。给了本项且父组件确有该插槽时，
   * 两个引擎都把 `<template #header>` 转发给它。</p>
   */
  headerSlot?: string;
  /**
   * 表头补充行的当前文本（自适应列宽时一并参与测宽）。
   *
   * <p>宿主用 {@link headerSlot} 在字段名下面又画了几行（注释、类型）时，那几行
   * 不在 {@link label} 里：只量 label 就把列宽算窄了，双击手柄「自适应」之后
   * 补充行照样被省略号截掉，看着像没生效。</p>
   *
   * <p>做成**函数**而不是数组：内容随宿主的开关与元数据变化，数组会让宿主在每次
   * 变化时重建整个 columns 数组，而本组件对 columns 是 deep watch（会连带重载列宽存档）。
   * 函数只在真正测宽的那一刻取值，宿主不必为了它重建列定义。</p>
   *
   * @returns 当前实际显示在表头里的附加行文本；空串会被忽略
   */
  headerFitLines?: () => string[];
  /** 单元格内容超出时是否显示 tooltip */
  showOverflowTooltip?: boolean;
  /** 列单元格的 class-name（透传给 el-table-column，如操作列 .op-col 的按钮组样式） */
  className?: string;
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

/** 远程（后端分页）数据加载器签名：接收分页 + 查询参数，返回分页结果 */
export type ReTableLoader = (
  params: ReTableLoadParams,
) => RePageResult | Promise<RePageResult>;

export interface ReTableLoadParams {
  /** 当前页码，从 1 开始 */
  page: number;
  /** 每页条数（组件已按 MAX_PAGE_SIZE 钳制） */
  pageSize: number;
  /**
   * 查询参数 = 页面 {@code params} + 内置搜索区提交值 + **必定存在的 page / pageSize**。
   *
   * <p>page / pageSize 由组件在合并之后写回，页面自己塞的同名字段会被覆盖 ——
   * 分页真值只能来自组件内部状态。</p>
   */
  params: Record<string, unknown>;
}

/** 列持久化配置 */
export interface ReTableColumnState {
  /** 列顺序（按 prop 排序） */
  order: string[];
  /** 隐藏的列 prop 集合 */
  hidden: string[];
  /** 拖拽调整后的列宽（按 prop 记录，px）；仅记录用户改过的列，未改的列沿用列定义的 width */
  widths?: Record<string, number>;
}

/** 表格完整持久化状态（列配置 + 分页 + 设置 + 布局） */
export interface ReTableFullState extends ReTableColumnState {
  /** 当前页码 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 分页方式（页码菜单 / 滚动加载；仅 paginationModeSwitch 开启的表会写入） */
  paginationMode?: RePaginationMode;
  /** 表格设置 */
  settings?: ReTableSettings;
  /** 布局（表格 / 视图 / 卡片） */
  layout?: ReTableSwitchLayout;
  /**
   * 内置搜索区的筛选条件快照（仅 search 配置了 filters 的表写入）。
   *
   * <p>恢复的前提：页面没有传初始 {@code searchModel}（页面显式给值视为受控，不覆盖）。
   * 仅远程模式会因恢复而补一次取数；本地数组模式只回填表单值。</p>
   */
  searchModel?: Record<string, unknown>;
  /** 排序字段 */
  sortProp?: string;
  /** 排序方向 */
  sortOrder?: "ascending" | "descending" | null;
}

/** 表格外观设置 */
export interface ReTableSettings {  /** 斑马纹 */
  stripe?: boolean;
  /** 边框（默认 true） */
  border?: boolean;
  /** 紧凑模式：size='small' */
  compact?: boolean;
  /** 显示斑马纹列（hover 高亮） */
  highlightCurrentRow?: boolean;
  /** 十字高亮：悬停表体单元格时，同时高亮所在行与所在列（含表头列） */
  crosshairHighlight?: boolean;
  /** 可调整列宽（需 border 模式，默认 true） */
  resizable?: boolean;
  /**
   * 记住页码（默认 true）。
   *
   * <p>按 {@code tableId} 各自独立：刷新 / 重进页面时回到上次所在页。关闭后不再恢复，
   * 且下一次保存会清掉已存页码。仅 {@code paginationMode="pager"} 生效
   * （滚动分页始终从第 1 批开始）。</p>
   */
  pageCache?: boolean;
  /**
   * 键盘快捷键（默认 true）。
   *
   * <p>← / → 切换上一页 / 下一页。独立开关：某些页面方向键另有用途（画布、甘特图、
   * 图表横向浏览）时需要能整体关掉。生效范围仅限「当前归属」的表格 ——
   * focus 优先、其次 hover，一页多表时互不干扰。</p>
   */
  shortcuts?: boolean;
}

/** 表格布局模式：table（默认）/ view / card；modern / virtual / canvas / radial 已随功能下线移除 */
export type ReTableLayout = "table" | "view" | "card";

/**
 * 分页方式：
 * - "pager"（默认）：页码 + 每页条数菜单（RePagination）
 * - "scroll"：滚动分页——隐藏分页菜单，表格触底自动追加下一批
 *   （本地数据按 pageSize 逐步放出；远程 loader 按页取数追加）
 */
export type RePaginationMode = "pager" | "scroll";

/** 列表结果缓存的载体：session（默认，随标签页关闭失效）/ local（跨会话保留） */
export type ReTableCacheStorage = "local" | "session";

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

/**
 * 右键菜单提供者：静态数组，或按右键上下文动态生成的函数。
 *
 * <p><strong>为什么支持函数</strong>：右键同一张表的不同行/列，菜单项往往不同
 * （如数据源列表：行菜单有「编辑/删除」，列菜单有「排序/筛选」）。
 * 写成函数后 ReTable 统一负责弹窗定位、显隐、关闭，使用方只需
 * {@code :context-menu="ctx => [...]"} + {@code @context-menu-select} 两处，
 * 不再各自维护 visible/x/y/context 一套状态 —— 这就是「封装右键事件、
 * 使用方免维护」的落点。</p>
 */
export type ReTableContextMenuProvider =
  | ReTableContextMenuItem[]
  | ((ctx: ReTableContextMenuContext) => ReTableContextMenuItem[]);

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
  /**
   * 删除回调（返回 Promise 时自动处理 loading）。
   *
   * <p><b>必填才能生效</b>：只写 {@code batchDelete: true} 而不挂 handler 时，
   * 按钮点下去没有任何动作 —— 组件因此直接不渲染这个按钮（{@link batchDelete} 同款判据），
   * 避免出现「可见、可点、永远无效」的死按钮。</p>
   */
  handler?: (rows: Record<string, unknown>[]) => void | Promise<void>;
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
  /** 保存回调（返回 Promise 时自动处理 loading）；没有它时批量修改按钮不渲染 */
  handler?: (rows: Record<string, unknown>[]) => void | Promise<void>;
}

/**
 * toolbar 单个按钮的配置（刷新 / 列设置 / 表格设置共用）。
 *
 * <p>与批量按钮同一种思路：写成对象就能挂 {@code handler}。给了 handler 时点击执行它，
 * 不再走组件内置行为（例如刷新按钮就不再自动 reload，交给调用方决定怎么刷）。</p>
 */
export interface ReTableToolbarButton {
  /** 是否启用（默认 true；等价于旧写法传 false 关掉） */
  enable?: boolean;
  /** 悬浮提示（覆盖组件默认文案） */
  tip?: string;
  /** 图标（覆盖组件默认图标） */
  icon?: any;
  /** 自定义点击行为；不传则走组件内置行为 */
  handler?: () => void | Promise<void>;
}

/** toolbar 配置 */
export interface ReTableToolbarConfig {
  /** 是否显示工具栏（等价于顶层 toolbar prop；两者都写时以本字段为准） */
  enable?: boolean;
  /** 是否启用批量删除 */
  batchDelete?: boolean | ReTableToolbarBatchDelete;
  /** 是否启用批量选择（checkbox 列） */
  batchSelect?: boolean | ReTableToolbarBatchSelect;
  /** 是否启用批量修改（编辑→保存切换） */
  batchEdit?: boolean | ReTableToolbarBatchEdit;
  /** 是否显示刷新按钮（默认 true；可传对象以挂自定义 handler） */
  refresh?: boolean | ReTableToolbarButton;
  /**
   * 是否显示列设置按钮（默认 true）。
   * 注意：列改由 `<ReTableColumn>` 子节点声明（未传 `columns` prop）时，ReTable 会强制关掉它
   * —— 列设置面板只读 `props.columns`，那种写法下按钮点开是空面板（死按钮）。
   * 表现就是「有的表 3 个按钮、有的只有表格设置+刷新」。
   */
  columnSettings?: boolean | ReTableToolbarButton;
  /** 是否显示表格设置按钮（默认 true；可传对象覆盖提示） */
  tableSettings?: boolean | ReTableToolbarButton;
  /**
   * toolbar 位置：'top' 表格上方（默认） | 'bottom' 与分页行同行。
   * 默认 'top'：批量操作按钮渲染在表格上方，分页行只保留右侧工具区（列设置/表格设置/刷新）。
   */
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
  /**
   * 在搜索区网格里横跨几列（默认 1）。
   *
   * <p>日期区间这类控件本身就要 ~350px（开始 + 结束两段输入），塞进 220px 的默认列宽里
   * 会画到相邻字段和右侧按钮上。给 {@code span: 2} 让它占两列即可。</p>
   */
  span?: number;
  /** select / treeselect 选项数据 */
  options?: Array<{ label: string; value: string | number; children?: any[] }>;
  /**
   * 远端数据源（与 options 二选一）：url 字符串或加载函数，透传给内置 ReSearch 的过滤项。
   *
   * <p>提供后该项的 select 改走 ReSelect 远端加载：字符串视为 {@link url}，函数视为 {@link loader}。
   * 也可分别用 url / loader 显式声明。</p>
   */
  dataSource?: string | ReSelectLoader;
  /** 远端 url（与 options/dataSource 二选一） */
  url?: string;
  /** 远端加载函数（与 options/dataSource 二选一，等价于 url） */
  loader?: ReSelectLoader;
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
 * ReTable 内置自动刷新：工具栏出现一枚纯方块计时入口（ReSwitch 的 popover 布局），
 * 点开在浮层里选间隔，选中即生效并点亮按钮；表格自身持有定时器轮询 reload。
 *
 * <p>页面不要再自己 setInterval —— 定时器跟着组件与 keep-alive 的激活态一起起停。
 * 只需开关时传 {@code true}，要调间隔 / 默认开启 / 倒计时显隐时传对象。</p>
 */
export type ReTableAutoRefresh = boolean | {
  /** 默认轮询间隔（ms），下限 1000 */
  interval?: number;
  /** 挂载即按 interval 开启（默认 false，关闭态由用户在浮层里选档） */
  defaultOn?: boolean;
  /**
   * 浮层里的可选档位（ms）；传 0 表示「关闭」这一档。
   *
   * 缺省（不传 / 传空数组）时用内置档：
   * {@code [0, 5000, 10000, 30000, 60000]}（关 / 5s / 10s / 30s / 1min）。
   */
  intervals?: number[];
  /**
   * 浮层底部是否显示「下次刷新 N 秒后」倒计时（默认 true）。
   *
   * 关闭态不显示（没有下一次）；设 false 则只保留静态说明。
   */
  showCountdown?: boolean;
};


// ============================================================================
// 分组配置（新 API，向后兼容）
// ============================================================================

/**
 * 分页组配置。
 *
 * <p>把原来散落的 `pagination` / `page` / `pageSize` / `pageSizes` /
 * `paginationMode` / `paginationModeSwitch` / `paginationModePersist` /
 * `paginationLayout` / `autoReload` 收进一个对象。</p>
 *
 * <p><b>优先级</b>：本对象里的值 > 同名顶层 prop > 内置默认值。所以旧写法的页面
 * 完全不受影响，新页面可以只写分组。</p>
 */
export interface ReTablePaginationConfig {
  /** 是否启用分页（默认 true） */
  enable?: boolean;
  /** 当前页码（受控；等价于顶层 page） */
  page?: number;
  /** 每页条数（受控；等价于顶层 pageSize） */
  pageSize?: number;
  /** 可选每页条数档位（等价于顶层 pageSizes） */
  pageSizes?: number[];
  /** 分页方式：pager（页码）/ scroll（滚动追加） */
  mode?: RePaginationMode;
  /** 是否给用户「分页 / 滚动」切换入口 */
  modeSwitch?: boolean;
  /** 切换后的选择是否随 tableId 持久化（默认 true） */
  modePersist?: boolean;
  /** 页码 / 参数变化后是否自动重新取数（默认 true） */
  autoReload?: boolean;
  /** 是否记住页码（写入表格设置，默认 true） */
  remember?: boolean;
}

/**
 * ReTable 分组配置（新 API）。
 *
 * <p>目标是把 40+ 个平行 props 按功能收成几个对象，调用方只需记住
 * 「分页 / 工具栏 / 搜索 / 选择」四件事。所有字段都可选，且与旧 props 并存 ——
 * 分组值优先，未写的字段继续读旧 props，因此可以逐页迁移。</p>
 */
export interface ReTableGroupedConfig {
  /** 分页 */
  pagination?: ReTablePaginationConfig;
  /**
   * 工具栏（与页面上旧的 toolbarConfig prop 同构）。
   *
   * <p>分组里的字段优先；未写的字段继续读旧 toolbarConfig。{@code enable} 对应旧的
   * 顶层 `toolbar` prop —— 于是「工具栏开关 + 各按钮配置」也能收进一个对象。</p>
   */
  toolbar?: ReTableToolbarConfig;
  /**
   * 内置搜索区。
   *
   * <p>{@code false} 关闭；对象形态在旧 {@code search} prop 的全部字段基础上多了
   * {@code enable}（写 false 等同于整体关闭，便于「配置留着、开关关掉」）。</p>
   */
  search?: boolean | ReTableSearchGroupConfig;
  /**
   * 行选择（常驻复选框列）。
   *
   * <p>对应旧的 {@code showSelection} prop。注意只是「常驻勾选列」，批量动作仍由
   * {@code toolbar.batchDelete / batchSelect / batchEdit} 控制。</p>
   */
  selection?: ReTableSelectionGroupConfig;
}

/** 搜索组配置（旧 ReTableSearchConfig + enable 开关） */
export interface ReTableSearchGroupConfig extends ReTableSearchConfig {
  /** 是否启用（false 时整块关闭，但 filters 等配置可以保留） */
  enable?: boolean;
}

/** 选择组配置 */
export interface ReTableSelectionGroupConfig {
  /** 是否常驻勾选列（等价于旧的 showSelection prop） */
  enable?: boolean;
}
