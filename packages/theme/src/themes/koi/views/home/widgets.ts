/**
 * 主页仪表板 Widget 类型定义
 *
 * 每个 widget 维护自身的元数据（id / type / title）和在网格中的位置（x / y / w / h）。
 * id 用于关联 widgets 与 grid:layout（grid-layout-plus 的 Layout 与 widget 一一对应）。
 */

/** widget 类型（与系统提供的组件一一对应） */
export type WidgetType =
  | "stats"
  | "welcome-extra"
  | "weather"
  | "todo"
  | "announcement"
  | "system-info"
  | "chart";

/** 已放置的 widget（保存到 layout 中） */
export interface WidgetItem {
  /** 唯一 id（与 GridPosition.i 一致） */
  id: string;
  /** widget 类型（决定渲染器） */
  type: WidgetType;
  /** 显示标题 */
  title: string;
}

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

/** 系统提供的可放置 widget 目录（中央面板展示） */
export interface WidgetCatalogItem {
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
  /** 默认尺寸 */
  defaultSize: { w: number; h: number };
}

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: "stats",
    title: "数据概览",
    description: "关键指标快速一览",
    icon: "DataAnalysis",
    defaultSize: { w: 6, h: 3 },
  },
  {
    type: "welcome-extra",
    title: "欢迎语",
    description: "个性化欢迎卡片",
    icon: "Sunny",
    defaultSize: { w: 4, h: 2 },
  },
  {
    type: "weather",
    title: "天气",
    description: "当前城市天气与预报",
    icon: "Cloudy",
    defaultSize: { w: 4, h: 2 },
  },
  {
    type: "todo",
    title: "待办",
    description: "今日待办事项",
    icon: "List",
    defaultSize: { w: 4, h: 3 },
  },
  {
    type: "announcement",
    title: "公告",
    description: "系统公告与通知",
    icon: "Bell",
    defaultSize: { w: 4, h: 3 },
  },
  {
    type: "system-info",
    title: "系统信息",
    description: "运行环境 / 浏览器 / 屏幕",
    icon: "Monitor",
    defaultSize: { w: 4, h: 3 },
  },
  {
    type: "chart",
    title: "趋势图",
    description: "近 7 天访问量趋势",
    icon: "TrendCharts",
    defaultSize: { w: 6, h: 4 },
  },
];

export function findWidgetCatalogItem(type: WidgetType): WidgetCatalogItem {
  return WIDGET_CATALOG.find((w) => w.type === type) ?? WIDGET_CATALOG[0];
}
