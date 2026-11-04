/**
 * 监控大屏「动态卡片」数据模型
 *
 * <p>设计目标与首页自定义组件（{@code packages/theme/src/themes/koi/views/home}）
 * <b>完全一致</b>：卡片 = 元数据 + 组件加载器，由运行时注册表统一登记；布局则是
 * 「widgets + grid」两份数据 —— 卡片清单决定渲染什么，网格坐标决定它摆在哪、多大。</p>
 *
 * <p>早期版本用的是「有序数组 + span/height」的 CSS 栅格：能上下移动、能换整/半宽，
 * 但<b>不能自由摆放</b>，也做不到「所见即所得」。现在改成和首页同一套
 * {@code grid-layout-plus} 网格模型（12 列 + 行高），拖拽 / 缩放的结果就是存档本身。</p>
 *
 * <p>与首页的唯一差异在<b>行高策略</b>：首页是满屏看板，行高按容器可用高度反解
 * （{@link ../../../packages/theme/src/themes/koi/views/home/useFillRowHeight.ts}）；
 * 监控大屏是一个可滚动的长页面，卡片区只占其中一段，反解会把几行拉成巨块，
 * 因此这里用<b>固定行高</b>（{@link MONITOR_ROW_HEIGHT}）。</p>
 */

/**
 * 卡片类型标识。
 *
 * <p>刻意开放为 {@code string} 而不是封闭联合：TypeScript 的模块增强只对
 * interface / namespace 生效，对联合类型无效，{@code pages/xx} 无法用 {@code .d.ts}
 * 扩展一个封闭联合。要让模块贡献自己的卡片，唯一办法是开放类型、改由运行时注册表校验
 * —— 未注册的 type 会渲染成<b>占位卡片</b>（而不是静默丢弃或坏卡片）。</p>
 */
export type MonitorCardType = string;

/**
 * 卡片分类（决定「组件目录」面板里的分组）。
 *
 * <ul>
 *   <li>{@code page} —— 本页原生区块（KPI、RESTful 趋势、磁盘分区…），由页面自己渲染</li>
 *   <li>{@code actuator} —— Spring Actuator 端点可视化（由 {@code @pages/actuator} 贡献）</li>
 *   <li>{@code apm} —— APM 观测数据（由 {@code @pages/apm} 贡献，SkyWalking / OTel 合并视图）</li>
 *   <li>{@code custom} —— 用户自建卡片（自定义数据源 / iframe）</li>
 * </ul>
 *
 * <p><b>分类是开放的</b>：本页只维护「宿主认识的几类」，各 {@code pages/xx} 模块贡献卡片时
 * 若用了新分类，目录面板会把它排在末尾而不是丢掉。历史上 {@code otel} 这一类已随
 * {@code @pages/apm} 接管观测视图而退役。</p>
 */
export type MonitorCardCategory = "page" | "actuator" | "apm" | "custom";

/**
 * 页面区块的类型前缀。
 *
 * <p>页头以下是<b>整页</b>都可以自定义的：KPI、趋势图、磁盘分区这些原生区块，
 * 与注册表里的外围卡片（Actuator / OTel / 自定义）住在同一张网格里。原生区块不像外围卡片
 * 那样有自己的 .vue 组件 —— 它们依赖页面里成百上千行现成的绑定（SSE 实时数据、图表 option…），
 * 抽成组件等于把这堆状态重新接一遍。所以用前缀区分：命中的卡片由页面通过
 * {@code #block} 插槽渲染，其余仍由注册表加载组件。</p>
 */
export const MONITOR_PAGE_BLOCK_PREFIX = "page:";

/** 该 type 是否为本页原生区块（由页面插槽渲染，而不是注册表组件） */
export function isPageBlockType(type: MonitorCardType): boolean {
  return typeof type === "string" && type.startsWith(MONITOR_PAGE_BLOCK_PREFIX);
}

/** 网格列数（与 grid-layout-plus 的 :cols 一致） */
export const MONITOR_GRID_COLS = 12;

/** 行高（px）：一行的像素高度，卡片高度 = h 行 */
export const MONITOR_ROW_HEIGHT = 48;

/** 网格间距（px），横竖一致（与 GridLayout 的 :margin 两项对应） */
export const MONITOR_GRID_MARGIN = 12;

/** 卡片最小尺寸（网格单位）：再小就什么都放不下了 */
export const MONITOR_MIN_W = 2;
export const MONITOR_MIN_H = 2;

/** 卡片默认尺寸（网格单位，新增卡片时落在这个尺寸上） */
export interface MonitorCardSize {
  /** 横向占几列（1..12） */
  w: number;
  /** 纵向占几行，1 行 = {@link MONITOR_ROW_HEIGHT} px */
  h: number;
}

/**
 * 网格坐标（与 {@code grid-layout-plus} 的 LayoutItem 同构）。
 *
 * <p>{@code i} 对应 {@link MonitorCardItem.id}，两者必须一一对应；对齐与清洗在
 * {@code useMonitorCards} 里做，渲染层只管画。</p>
 */
export interface MonitorGridItem {
  /** 与卡片 id 一致 */
  i: string;
  /** 列起始下标（0 起） */
  x: number;
  /** 行起始下标（0 起） */
  y: number;
  /** 横向占列数 */
  w: number;
  /** 纵向占行数 */
  h: number;
}

/** 监控卡片区布局（持久化结构：卡片清单 + 网格坐标） */
export interface MonitorLayoutState {
  cards: MonitorCardItem[];
  grid: MonitorGridItem[];
}

/** 分类分组顺序（「组件目录」面板视觉顺序） */
export const MONITOR_CARD_CATEGORY_ORDER: MonitorCardCategory[] = [
  "page",
  "actuator",
  "apm",
  "custom",
];

/** 分类中文名 */
export const MONITOR_CARD_CATEGORY_LABEL: Record<MonitorCardCategory, string> = {
  page: "页面区块",
  actuator: "Actuator 端点",
  apm: "APM 观测",
  custom: "自定义卡片",
};

/** 分类说明（面板副标题） */
export const MONITOR_CARD_CATEGORY_HINT: Record<MonitorCardCategory, string> = {
  page: "本页原生区块，拖动摆放、缩放大小都可以改",
  actuator: "直接读取 /actuator/** 原始 JSON，无需额外埋点",
  apm: "统一 APM 接口，自动适配 SkyWalking / OpenTelemetry 引擎",
  custom: "自选数据源与展示方式，也可直接嵌入任意页面",
};

/**
 * 数据源配置（自定义卡片必填，内置卡片按需使用）。
 *
 * <p>内置卡片只用到 {@code intervalSec}（轮询间隔）等少量字段；
 * 自定义卡片则要用户自选数据源与展示方式 —— 这正是「自己定制卡片」的入口。</p>
 */
export interface MonitorCardSourceConfig {
  /**
   * 数据源类型：
   * - {@code actuator} 走系统 API 代理的 /actuator 端点（同源、带登录态，推荐）
   * - {@code url} 直连绝对地址（需对方允许跨域）
   * - {@code iframe} 直接把地址嵌进卡片（不受跨域限制，但不能取数加工）
   */
  kind?: "actuator" | "url" | "iframe";
  /** actuator 路径（如 {@code metrics/jvm.memory.used}）或绝对 URL */
  path?: string;
  /** 自动刷新间隔（秒），0 或未填 = 不自动刷新 */
  intervalSec?: number;
  /** 取值路径（点号分段，支持数组下标），如 {@code measurements.0.value} */
  valuePath?: string;
  /** 展示方式 */
  render?: "kv" | "table" | "json" | "value";
  /** 数值单位后缀（render = value 时生效） */
  unit?: string;
  /** 表格 / 键值列表最多展示条数，未填 = 不截断 */
  limit?: number;
}

/** 已放置的卡片（落盘到本地缓存 + 用户配置接口） */
export interface MonitorCardItem {
  /** 唯一 id（新增时生成，同时是网格坐标的 key） */
  id: string;
  /** 卡片类型（决定渲染器） */
  type: MonitorCardType;
  /** 显示标题（可覆盖注册项默认标题） */
  title: string;
  /**
   * 贡献该卡片的模块标识，随卡片持久化。
   *
   * <p>当前应用未注册该 type 时，渲染成占位卡片并显示「由 xx 模块提供」，
   * 而不是把卡片丢弃 —— 位置得以保留，切回有该模块的应用即可复原。</p>
   */
  source?: string;
  /** 卡片配置（自定义卡片必填，内置卡片选填） */
  config?: MonitorCardSourceConfig;
}

/** 目录元数据（「组件目录」面板用，剥离组件与图标） */
export interface MonitorCardCatalogItem {
  type: MonitorCardType;
  title: string;
  description: string;
  /** 内置图标名（不在内置映射里时回退默认图标） */
  icon: string;
  category: MonitorCardCategory;
  /** 新增卡片时的默认尺寸 */
  defaultSize: MonitorCardSize;
  /** 最多添加几份（0 或负数视为不限） */
  maxCount: number;
  /** 新增时的默认配置 */
  defaultConfig?: MonitorCardSourceConfig;
  /** 是否在设置弹窗里暴露「数据源 / 刷新 / 展示方式」等字段 */
  editableSource?: boolean;
  /** 已添加数量（运行时计算，不参与持久化） */
  counted?: number;
}
