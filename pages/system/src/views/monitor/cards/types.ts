/**
 * 监控大屏「动态卡片」数据模型（宿主侧）
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
 *
 * <p>共享的卡片契约（{@code MonitorCardType} / {@code MonitorCardCatalogItem} /
 * {@code MonitorCardItem} / {@code MonitorCardSourceConfig} …）与运行时注册表位于
 * {@code @repo/monitor-cards}：它是宿主与各 {@code pages/xx} 贡献方的共同语言，放在更低
 * 一层，避免领域包反向依赖本宿主包。这里只保留本页专属的网格常量与布局类型。</p>
 */
import type {
  MonitorCardCatalogItem,
  MonitorCardCategory,
  MonitorCardItem,
  MonitorCardSize,
  MonitorCardSourceConfig,
  MonitorCardType,
} from "@repo/monitor-cards";

/**
 * 卡片类型标识（类型定义见 {@code @repo/monitor-cards}，这里 re-export 保持宿主导出面不变）。
 */
export type {
  MonitorCardCatalogItem,
  MonitorCardCategory,
  MonitorCardItem,
  MonitorCardSize,
  MonitorCardSourceConfig,
  MonitorCardType,
} from "@repo/monitor-cards";

/**
 * 页面区块的类型前缀。
 *
 * <p>页头以下是<b>整页</b>都可以自定义的：KPI、趋势图、磁盘分区这些原生区块，与注册表里的
 * 外围卡片（Actuator / OTel / 自定义）住在同一张网格里。原生区块不像外围卡片那样有自己的
 * .vue 组件 —— 它们依赖页面里成百上千行现成的绑定（SSE 实时数据、图表 option…），
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

/** 网格坐标（与 {@code grid-layout-plus} 的 LayoutItem 同构）。
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
