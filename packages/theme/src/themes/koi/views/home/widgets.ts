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
export type WidgetType = "calendar" | "custom";

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
  /** 自定义组件配置（仅 type === 'custom' 时使用） */
  config?: CustomWidgetConfig;
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

/** 自定义组件（iframe 嵌入）配置 */
export interface CustomWidgetConfig {
  url: string;
  /** iframe 高度模式：100% 跟随父容器 / 固定像素 */
  heightMode: "fill" | "fixed";
  /** 固定高度（heightMode === 'fixed' 时生效，单位 px） */
  fixedHeight?: number;
  /** 标题（覆盖默认 widget.title） */
  title?: string;
  /** 是否允许滚动 */
  scrolling?: boolean;
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
  /** 所属环境（正式 / 测试） */
  environment: WidgetEnvironment;
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

/** 环境标签（中文） */
export const WIDGET_ENVIRONMENT_LABEL: Record<WidgetEnvironment, string> = {
  prod: "正式",
  test: "测试",
};

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: "calendar",
    title: "日历",
    description: "添加日程，IndexedDB 持久化",
    icon: "Calendar",
    defaultSize: { w: 6, h: 4 },
    category: "personal",
    environment: "prod",
    requiredPermission: "user",
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