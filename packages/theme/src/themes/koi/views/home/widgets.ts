/**
 * 主页仪表板 Widget 类型定义
 *
 * 每个 widget 维护自身的元数据（id / type / title）和在网格中的位置（x / y / w / h）。
 * id 用于关联 widgets 与 grid:layout（grid-layout-plus 的 Layout 与 widget 一一对应）。
 *
 * WidgetPermission 仅描述 widget 自身要求的权限等级（user / admin / superadmin），
 * 实际角色名从 app.yaml permissionConfig.{superadmin,admin} 读取，
 * 由 @repo/utils 的 canAccess() 统一判断，避免业务代码硬编码角色字面量。
 */
import { canAccess, type UserPermission } from "@repo/utils";

/** widget 类型（与系统提供的组件一一对应） */
export type WidgetType =
  | "stats"
  | "welcome-extra"
  | "weather"
  | "todo"
  | "announcement"
  | "system-info"
  | "chart"
  | "calendar";

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
  /** 组件分类（用于面板分组展示） */
  category: WidgetCategory;
  /** 可见性要求：user 全员可见，admin / superadmin 仅对应角色可见 */
  requiredPermission: WidgetPermission;
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

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: "welcome-extra",
    title: "欢迎语",
    description: "个性化欢迎卡片",
    icon: "Sunny",
    defaultSize: { w: 4, h: 2 },
    category: "common",
    requiredPermission: "user",
  },
  {
    type: "weather",
    title: "天气",
    description: "当前城市天气与预报",
    icon: "Cloudy",
    defaultSize: { w: 4, h: 2 },
    category: "common",
    requiredPermission: "user",
  },
  {
    type: "calendar",
    title: "日历",
    description: "添加日程，IndexedDB 持久化",
    icon: "Calendar",
    defaultSize: { w: 6, h: 4 },
    category: "personal",
    requiredPermission: "user",
  },
  {
    type: "todo",
    title: "待办",
    description: "今日待办事项",
    icon: "List",
    defaultSize: { w: 4, h: 3 },
    category: "common",
    requiredPermission: "user",
  },
  {
    type: "announcement",
    title: "公告",
    description: "系统公告与通知",
    icon: "Bell",
    defaultSize: { w: 4, h: 3 },
    category: "common",
    requiredPermission: "user",
  },
  {
    type: "stats",
    title: "数据概览",
    description: "关键指标快速一览",
    icon: "DataAnalysis",
    defaultSize: { w: 6, h: 3 },
    category: "admin",
    requiredPermission: "admin",
  },
  {
    type: "system-info",
    title: "系统信息",
    description: "运行环境 / 浏览器 / 屏幕",
    icon: "Monitor",
    defaultSize: { w: 4, h: 3 },
    category: "admin",
    requiredPermission: "admin",
  },
  {
    type: "chart",
    title: "趋势图",
    description: "近 7 天访问量趋势",
    icon: "TrendCharts",
    defaultSize: { w: 6, h: 4 },
    category: "admin",
    requiredPermission: "admin",
  },
];

export function findWidgetCatalogItem(type: WidgetType): WidgetCatalogItem {
  return WIDGET_CATALOG.find((w) => w.type === type) ?? WIDGET_CATALOG[0];
}

/** 按权限过滤目录（user 全部可见，admin / superadmin 仅对应角色可见） */
/**
 * 按当前用户权限过滤 widget 目录。
 *
 * - 当前用户为 user      → 仅看 user widget
 * - 当前用户为 admin     → 看 user + admin widget
 * - 当前用户为 superadmin → 看全部 widget
 *
 * 角色字面量（"admin" / "superadmin" / 自定义）由 app.yaml permissionConfig 提供，
 * canAccess() 内部统一读取，避免业务代码硬编码。
 */
export function filterCatalogByPermission(
  catalog: WidgetCatalogItem[],
  userPermission: WidgetPermission,
): WidgetCatalogItem[] {
  return catalog.filter((w) => canAccess(w.requiredPermission, userPermission));
}
