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

/** widget 类型（与系统提供的组件一一对应） */
export type WidgetType =
  | "calendar"
  | "custom"
  | "note"
  | "client-info"
  | "system-config"
  | "alarm"
  | "bookmark"
  | "quick-access"
  | "online-user"
  | "server-status"
  | "server-metrics"
  | "weather";

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
  /** 自定义组件配置（仅 type === 'custom' 时使用） */
  config?: CustomWidgetConfig;
  /** 便签组件配置（仅 type === 'note' 时使用） */
  noteConfig?: NoteWidgetConfig;
  /** 外观配置（所有组件通用） */
  appearance?: WidgetAppearance;
}

/** box-shadow 可选级别 */
export type WidgetShadowLevel = "none" | "soft" | "medium" | "strong";

/** 所有组件通用的外观配置 */
export interface WidgetAppearance {
  /** 阴影级别 */
  shadow?: WidgetShadowLevel;
  /** 卡片圆角（px，默认 12） */
  borderRadius?: number;
}

/** 便签组件配置 */
export interface NoteWidgetConfig {
  /** 外观主题 */
  theme?: NoteTheme;
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
  url: string;
  /** iframe 高度模式：100% 跟随父容器 / 固定像素 */
  heightMode: "fill" | "fixed";
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

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: "calendar",
    title: "日历",
    description: "添加日程，管理每日安排",
    icon: "Calendar",
    defaultSize: { w: 6, h: 4 },
    category: "personal",
    environment: "prod",
    requiredPermission: "user",
    maxCount: 1,
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
  },
  {
    type: "online-user",
    title: "在线用户",
    description: "实时在线用户数与列表",
    icon: "User",
    defaultSize: { w: 5, h: 4 },
    category: "admin",
    environment: "prod",
    requiredPermission: "admin",
    maxCount: 1,
  },
  {
    type: "server-status",
    title: "服务器状态",
    description: "被监控服务器健康概览",
    icon: "Monitor",
    defaultSize: { w: 6, h: 4 },
    category: "admin",
    environment: "prod",
    requiredPermission: "admin",
    maxCount: 1,
  },
  {
    type: "server-metrics",
    title: "服务器指标",
    description: "CPU / 内存实时环形图",
    icon: "DataLine",
    defaultSize: { w: 6, h: 4 },
    category: "admin",
    environment: "prod",
    requiredPermission: "admin",
    maxCount: 1,
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
  },
];

export function findWidgetCatalogItem(type: WidgetType): WidgetCatalogItem {
  return WIDGET_CATALOG.find((w) => w.type === type) ?? WIDGET_CATALOG[0];
}

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