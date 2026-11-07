/**
 * 主页仪表板 Widget 类型定义
 *
 * 每个 widget 维护自身的元数据（id / type / title）和在网格中的位置（x / y / w / h）。
 * id 用于关联 widgets 与 grid:layout（grid-layout-plus 的 Layout 与 widget 一一对应）。
 *
 * WidgetPermission 仅描述 widget 自身要求的权限等级（user / admin / superadmin），
 * 实际角色名从 app.yaml permissionConfig.{superadmin,admin} 读取，
 * 由 @repo/core 的 canAccess() 统一判断，避免业务代码硬编码角色字面量。
 *
 * environment 标识 widget 所属环境（正式 / 测试），区块面板会按环境分组。
 */
import { canAccess, type UserPermission } from "@repo/core";
// 仅运行时依赖 registerWidgets（值导入）；registry.ts 对本文件只有 type 导入（编译期擦除），
// 因此运行期不存在循环依赖
import { registerWidgets, type WidgetRegistration } from "./registry";

/**
 * 内置 widget 的 type 字面量。
 *
 * <p>仅用于文档、提示与内置目录的自我约束；<b>不是</b> {@link WidgetType} 的定义 ——
 * 各 {@code pages/xx} 模块可以贡献这之外的任意 type。</p>
 */
export type BuiltinWidgetType =
  | "calendar"
  | "custom"
  | "note"
  | "client-info"
  | "system-config"
  | "alarm"
  | "bookmark"
  | "quick-access"
  | "weather"
  | "metals"
  | "machine-info";

/**
 * widget 类型标识。
 *
 * <p>开放为 string 而非封闭联合：TypeScript 的模块增强（declaration merging）只对
 * interface / namespace 生效，<b>对联合类型无效</b>，所以 {@code pages/xx} 无法用
 * {@code .d.ts} 扩展一个封闭联合。要让各模块贡献自己的 widget，唯一办法是开放类型、
 * 改由运行时注册表校验（见 {@code ./registry.ts}）。</p>
 *
 * <p>随之而来的取舍：编译器不再能校验 type 拼写。兜底是注册表 ——
 * 未注册的 type 会被渲染成<b>占位卡片</b>（而不是静默丢弃或坏卡片），
 * 开发环境的注册期自检会指出「注册项缺 component」之类的登记错误。</p>
 */
export type WidgetType = string;

/** widget 所属环境（正式 / 测试） */
export type WidgetEnvironment = "prod" | "test";

/** widget 分类（图标 + 不同分组的视觉区分） */
export type WidgetCategory = "common" | "admin" | "personal";

/** 重新导出，保持 widget 模块对外语义统一 */
export type WidgetPermission = UserPermission;

/** 已放置的 widget（保存到 layout 中） */
export interface WidgetItem {
  /** 唯一 id（与 GridPosition.i 一致） */
  id: string;
  /** widget 类型（决定渲染器） */
  type: WidgetType;
  /** 显示标题 */
  title: string;
  /** 是否隐藏标题栏 */
  hideTitle?: boolean;
  /**
   * 贡献该 widget 的模块标识（如 {@code "collect"}），随布局持久化。
   *
   * <p>用途：当前应用<b>未启用</b>该模块时（注册表里查不到这个 type），
   * 渲染成占位卡片并显示「该组件由 collect 模块提供，当前应用未启用」，
   * 而不是把 widget 丢弃 —— 位置得以保留，切回有该模块的 app 即可复原。</p>
   *
   * <p>由内置目录派生的 widget 不带此字段（内置 widget 在所有 app 中都可用）。</p>
   */
  source?: string;
  /** 自定义组件配置（仅 type === 'custom' 时使用） */
  config?: CustomWidgetConfig;
  /** 便签组件配置（仅 type === 'note' 时使用） */
  noteConfig?: NoteWidgetConfig;
  /** 日历组件配置（仅 type === 'calendar' 时使用） */
  calendarConfig?: CalendarWidgetConfig;
  /** 外观配置（所有组件通用） */
  appearance?: WidgetAppearance;
}

/** box-shadow 可选级别 */
export type WidgetShadowLevel = "none" | "soft" | "medium" | "strong";

/** 所有组件通用的外观配置 */
export interface WidgetAppearance {
  shadow?: WidgetShadowLevel;
  borderRadius?: number;
  showHorizontalScrollbar?: boolean;
  showVerticalScrollbar?: boolean;
  /**
   * 背景控制：`auto`｜默认主题色（var(--el-bg-color))；`none`｜无背景色（透明，直接透底层
   * 容器颜色）；其他值＝自由颜色（如 `#f0f2f5`），会覆盖默认主色。
   */
  background?: "auto" | "none" | string;
  /** 是否显示刷新图标（放在标题栏右侧，默认开启） */
  showRefresh?: boolean;
  /**
   * 组件的额外样式（例如 `--custom-primary: #e6a23c`），会原样注入到 widget 根节点上。
   * 让每个 widget 自己管理自己的样式，不用改主题变量。
   */
  style?: string;
  /**
   * 组件的额外 class（例如 `my-widget`）。
   *
   * <p>WidgetRenderer 负责把 style/class 透给组件根节点；组件内部用这些 class/变量
   * 写自己的样式，等于每个 widget 都能自己配置自定义样式。</p>
   */
  styleClass?: string;
}

/** 便签组件配置 */
export interface NoteWidgetConfig {
  /** 外观主题 */
  theme?: NoteTheme;
}

/**
 * 日历格子的显示密度。
 *
 * <p>格子里的内容有四类：日期数字（含休/班角标）、节日名、农历、以及用户日程。
 * 格子宽度由 Element Plus 表格自动分配、宽度不可控，而行数是可控的，
 * 因此把「显示多少」表达成<b>行数上限</b>，而不是让用户去调像素。</p>
 */
export type CalendarCellMode =
  /** 全部显示：节日与农历各占一行，日程尽量多列，格子高度随内容增长 */
  | "all"
  /** 最多 4 行：日期 + 节日 + 2 条日程 */
  | "max4"
  /** 最多 3 行：日期 + 节日 + 1 条日程（最常用的一屏视图） */
  | "max3";

/** 日历组件配置（仅 type === 'calendar' 时使用） */
export interface CalendarWidgetConfig {
  /** 格内显示密度；缺省为 {@link CalendarCellMode} 的 {@code "all"} */
  cellMode?: CalendarCellMode;
  /** 是否显示节日与农历；缺省 true。关掉后行数让给日程 */
  showFestival?: boolean;
  /** 是否显示休/班角标；缺省 true */
  showBadge?: boolean;
}

/** 日历显示密度选项（设置弹窗展示，顺序即视觉顺序） */
export const CALENDAR_CELL_MODE_OPTIONS: { value: CalendarCellMode; label: string; hint: string }[] = [
  { value: "all", label: "全部显示", hint: "节日、农历各一行，日程尽量多列，格子按内容变高" },
  { value: "max4", label: "最多 4 行", hint: "日期 + 节日 + 2 条日程，格子高度固定" },
  { value: "max3", label: "最多 3 行", hint: "日期 + 节日 + 1 条日程，格子高度固定" },
];

/**
 * 各模式下格子里能用的「除日期行外」的行数。
 *
 * <p>日期数字那一行恒占 1 行（它还承载休/班角标，不能省），
 * 所以这里的值是「总行数 − 1」。</p>
 */
export const CALENDAR_MODE_CONTENT_ROWS: Record<CalendarCellMode, number> = {
  all: 8,
  max4: 3,
  max3: 2,
};

/** 是否为「格子高度固定」的模式（all 模式随内容增长，不固定） */
export function isFixedCellHeight(mode: CalendarCellMode): boolean {
  return mode !== "all";
}

/**
 * 固定密度模式下写死的格子高度（px）。
 *
 * <p>它必须装下该模式**自己承诺的行数**，否则 `overflow:hidden` 会把文字从中间切掉 ——
 * 原来写死 60px，而「最多 4 行」的自然高度实测 92.6px，整月有 5/42 格被裁一半。</p>
 *
 * <p>行高均取自 CalendarWidget.vue 的对应规则，推导：</p>
 * <pre>
 *   格子 = border-top 2 + padding 8 + 各行(18 / 16.8 / 18) + gap 4 × (行数-1)
 * </pre>
 *
 * <p><b>约束项来自「关掉节日」那一档</b>，不是开节日：关掉后 {@code .cell-sub} 整行不渲染，
 * 但省下的额度变成多一条日程 —— 行数没少、行高还全变成整数，反而顶得更高：</p>
 * <pre>
 *   max3 关节日 = 2 + 8 + 18+4 + 18+4 + 18   = 72    &lt;- 约束项（开节日只有 70.8）
 *   max4 关节日 = 2 + 8 + 18+4 + 18+4 + 18+4 + 18 = 94 &lt;- 约束项（开节日只有 92.8）
 * </pre>
 *
 * <p>取 <b>76 / 96</b>：在约束项之上留 4 / 2px，容掉字体度量与亚像素舍入。
 * 实测关节日那档是 71.8 / 93.8 —— 若按约束项写成 72，只剩 0.2px，换台机器的
 * 字体或 DPR 就会重新裁字（裁切只出现在固定密度模式，很难被发现）。</p>
 *
 * <p>日期行与日程行靠 {@code .cell-head / .cell-event} 的显式 {@code line-height: 18px} 锁死，
 * 否则会跟随继承的行高漂移、这里算出来的高度随之失准 ——
 * 改这两处或改 {@code .cell-festival} 的 line-height，都必须同步本表，
 * 由 mode-verify.cjs 从 CSS 反解行高做漂移哨兵，另由 calendar-density 门禁在浏览器里复验零裁切。</p>
 *
 * <p>{@code all} 不固定高度，此项仅为了类型完整，不会被使用。</p>
 */
export const CALENDAR_FIXED_CELL_HEIGHT: Record<CalendarCellMode, number> = {
  all: 60,
  max4: 96,
  max3: 76,
};

/**
 * 算出格子里还能放几条日程。
 *
 * <p>行数预算是「总行数 − 日期行（恒占 1，承载休/班角标）− 节日行 − 农历行」，
 * 剩下的全给日程。关掉节日时那份额度自动让给日程，而不是白白浪费。</p>
 *
 * @param mode 显示密度
 * @param showFestival 是否显示节日与农历
 * @returns 可显示的日程条数（不小于 0）
 */
export function calendarEventRows(mode: CalendarCellMode, showFestival: boolean): number {
  const used = showFestival ? 1 : 0;
  // 农历只在「全部显示」且节日行开着时单占一行
  const lunar = mode === "all" && showFestival ? 1 : 0;
  return Math.max(0, CALENDAR_MODE_CONTENT_ROWS[mode] - used - lunar);
}

/** 便签外观主题 */
export type NoteTheme = "default" | "yellow" | "blue" | "green" | "purple" | "peach";

/** box-shadow 级别 → 实际 CSS 值映射（低饱和度柔和阴影） */
export const WIDGET_SHADOW_MAP: Record<WidgetShadowLevel, string> = {
  none: "none",
  soft: "0 1px 3px rgba(0, 0, 0, 0.06)",
  medium: "0 4px 12px rgba(0, 0, 0, 0.12)",
  strong: "0 8px 24px rgba(0, 0, 0, 0.2)",
};

/** box-shadow 级别选项（设置弹窗展示） */
export const WIDGET_SHADOW_OPTIONS: { value: WidgetShadowLevel; label: string }[] = [
  { value: "none", label: "无" },
  { value: "soft", label: "柔和" },
  { value: "medium", label: "中等" },
  { value: "strong", label: "强烈" },
];

/** 背景选项（按钮展示） */
export const WIDGET_BACKGROUND_OPTIONS: { value: "auto" | "none" | "custom"; label: string; preview: string }[] = [
  { value: "auto", label: "默认", preview: "#ffffff" },
  { value: "none", label: "透明", preview: "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 50% / 16px 16px" },
  { value: "custom", label: "自由", preview: "#f0f2f5" },
];

export type WidgetScrollDir = "none" | "horizontal" | "vertical" | "both";

export const WIDGET_SCROLL_OPTIONS: { value: WidgetScrollDir; label: string; icon: string }[] = [
  { value: "none", label: "无", icon: "⊘" },
  { value: "horizontal", label: "横向", icon: "↔" },
  { value: "vertical", label: "纵向", icon: "↕" },
  { value: "both", label: "双向", icon: "⇿" },
];

/** 便签外观主题选项（设置弹窗展示） */
export const NOTE_THEME_OPTIONS: { value: NoteTheme; label: string; color: string }[] = [
  { value: "default", label: "默认", color: "#F1F5F9" },
  { value: "yellow", label: "柠檬", color: "#FEF3C7" },
  { value: "blue", label: "海蓝", color: "#DBEAFE" },
  { value: "green", label: "薄荷", color: "#D1FAE5" },
  { value: "purple", label: "雾紫", color: "#EDE9FE" },
  { value: "peach", label: "蜜桃", color: "#FFE4E6" },
];

/** 网格位置（grid-layout-plus 的 Layout 子项） */
export interface GridPosition {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 主页布局状态：已放置的 widget + 网格位置 */
export interface HomeLayoutState {
  widgets: WidgetItem[];
  grid: GridPosition[];
}

/** 自定义组件（iframe 嵌入）配置 */
export interface CustomWidgetConfig {
  /**
   * iframe 地址。
   *
   * <p>可选而非必填：新建 widget 时并不带 config（见 home/index.vue 的 addWidget），
   * 配置也在设置弹窗里才补齐；未配置时 CustomWidget 走 `hasUrl === false` 分支提示去设置。
   * 此前声明为必填，会让 `props.config ?? {}`、`initialConfig: () => ({})` 这类
   * 真实存在的用法全部报类型错误。</p>
   */
  url?: string;
  /** iframe 高度模式：100% 跟随父容器 / 固定像素；未配置按 "fill" 处理 */
  heightMode?: "fill" | "fixed";
  /** 固定高度（heightMode === 'fixed' 时生效，单位 px） */
  fixedHeight?: number;
  /** 标题（覆盖默认 widget.title） */
  title?: string;
  /** iframe 滚动模式：auto=自动 / yes=始终显示 / no=禁用 */
  scrolling?: "auto" | "yes" | "no";
}

/** 系统提供的可放置 widget 目录（中央面板展示） */
export interface WidgetCatalogItem {
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  defaultSize: { w: number; h: number };
  category: WidgetCategory;
  environment: WidgetEnvironment;
  requiredPermission: WidgetPermission;
  maxCount: number;
  /** 已添加数量（运行时计算，不参与持久化） */
  counted?: number;
}

/** 分类分组的列表顺序（影响面板视觉顺序） */
export const WIDGET_CATEGORY_ORDER: WidgetCategory[] = ["common", "personal", "admin"];

/** 分类标签（中文） */
export const WIDGET_CATEGORY_LABEL: Record<WidgetCategory, string> = {
  common: "通用",
  personal: "个人",
  admin: "管理员",
};

/** 权限标签（中文） */
export const WIDGET_PERMISSION_LABEL: Record<WidgetPermission, string> = {
  user: "全员可见",
  admin: "仅管理员",
  superadmin: "仅超管",
};

/** 环境标签（中文） */
export const WIDGET_ENVIRONMENT_LABEL: Record<WidgetEnvironment, string> = {
  prod: "正式",
  test: "测试",
};

/**
 * 内置 widget 注册项（自注册到 {@link ./registry}）。
 *
 * <p>模块求值时即完成注册，早于任何 app 的 {@code main.ts → mount()}，
 * 因此内置 widget 在任何 app 中都默认可用。各 {@code pages/xx} 随后追加自己的条目，
 * 顺序即面板视觉顺序（模块贡献的排在内置之后）。</p>
 *
 * <p>注意此处<b>不写</b> {@code source}：内置 widget 不依赖任何模块，
 * 占位卡片对它们没有意义。</p>
 */
const BUILTIN_WIDGETS: WidgetRegistration[] = [
  {
    type: "calendar",
    title: "日历",
    description: "添加日程，显示农历、节气、节日与法定放假调休",
    icon: "Calendar",
    defaultSize: { w: 7, h: 5 },
    category: "personal",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    component: () => import("./widgets/CalendarWidget.vue"),
  },
  {
    type: "custom",
    title: "自定义页面",
    description: "通过 iframe 嵌入任意 URL",
    icon: "Connection",
    defaultSize: { w: 6, h: 4 },
    category: "common",
    environment: "test",
    requiredPermission: "user",
    maxCount: 1,
    component: () => import("./widgets/CustomWidget.vue"),
  },
  {
    type: "note",
    title: "便签",
    description: "随手记录待办与灵感",
    icon: "Memo",
    defaultSize: { w: 4, h: 3 },
    category: "personal",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    component: () => import("./widgets/NoteWidget.vue"),
  },
  {
    type: "client-info",
    title: "客户端信息",
    description: "公网 IP、实时 CPU / FPS、浏览器与系统信息",
    icon: "Monitor",
    defaultSize: { w: 5, h: 4 },
    category: "common",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    component: () => import("./widgets/ClientInfoWidget.vue"),
  },
  {
    type: "system-config",
    title: "系统配置",
    description: "查看当前系统配置（仅管理员可见）",
    icon: "Setting",
    defaultSize: { w: 6, h: 5 },
    category: "admin",
    environment: "prod",
    requiredPermission: "admin",
    maxCount: 1,
    component: () => import("./widgets/SystemConfigWidget.vue"),
  },
  {
    type: "alarm",
    title: "闹钟",
    description: "设置定时提醒，到点推送站内消息",
    icon: "AlarmClock",
    defaultSize: { w: 4, h: 4 },
    category: "personal",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    component: () => import("./widgets/AlarmWidget.vue"),
  },
  {
    type: "bookmark",
    title: "书签",
    description: "收藏常用链接，一键跳转",
    icon: "Collection",
    defaultSize: { w: 5, h: 4 },
    category: "personal",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    component: () => import("./widgets/BookmarkWidget.vue"),
  },
  {
    type: "quick-access",
    title: "快捷入口",
    description: "系统菜单快捷跳转",
    icon: "Grid",
    defaultSize: { w: 5, h: 4 },
    category: "common",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    component: () => import("./widgets/QuickAccessWidget.vue"),
  },
  {
    type: "weather",
    title: "天气",
    description: "7 天天气预报，含日间/夜间预报",
    icon: "Sunny",
    defaultSize: { w: 8, h: 5 },
    category: "common",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    component: () => import("./widgets/WeatherWidget.vue"),
  },
  {
    type: "metals",
    title: "贵金属行情",
    description: "金/银/铂/钯现货价格与前 30 秒涨跌幅",
    icon: "TrendCharts",
    defaultSize: { w: 8, h: 5 },
    category: "common",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    component: () => import("./widgets/MetalsPriceWidget.vue"),
  },
  {
    type: "machine-info",
    title: "本机指标",
    description: "本机 CPU / 内存 / 电池 / 存储与网络状态",
    icon: "Monitor",
    defaultSize: { w: 6, h: 4 },
    category: "common",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
    component: () => import("./widgets/MachineInfoWidget.vue"),
  },
];

// 自注册：必须在本模块求值时完成，早于 app 的 mount() 与各 pages 模块的贡献
registerWidgets(BUILTIN_WIDGETS);

/**
 * 按当前用户权限过滤 widget 目录。
 *
 * - 当前用户为 user      → 仅看 user widget
 * - 当前用户为 admin     → 看 user + admin widget
 * - 当前用户为 superadmin → 看全部 widget
 *
 * 角色字面量（"admin" / "superadmin" / 自定义）由 app.yaml permissionConfig 提供，
 * canAccess() 内部统一读取，避免业务代码硬编码。
 *
 * @param catalog 待过滤的目录（通常传响应式 {@code widgetCatalog.value}，以便模块贡献的 widget 也能被看到）
 * @param userPermission 当前用户权限等级
 * @returns 该用户可见的目录条目
 */
export function filterCatalogByPermission(
  catalog: WidgetCatalogItem[],
  userPermission: WidgetPermission,
): WidgetCatalogItem[] {
  return catalog.filter((w) => canAccess(w.requiredPermission, userPermission));
}