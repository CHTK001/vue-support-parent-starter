/**
 * 路由配置类型（RouteConfigsTable）
 *
 * 兼容 pages/spider 等业务模块的路由配置写法：
 *   path / name / redirect / component / children / meta
 * meta 支持 icon / title / rank / showLink 等菜单渲染字段。
 */
import type { RouteRecordRaw } from "vue-router";

/** 菜单/路由 meta 元数据 */
export interface RouteMeta {
  /** 菜单标题 */
  title?: string;
  /** 菜单图标（iconify 名称或图标组件名） */
  icon?: string;
  /** 排序（越小越靠前） */
  rank?: number;
  /** 是否在侧边栏显示 */
  showLink?: boolean;
  /** 是否缓存页面（keep-alive） */
  keepAlive?: boolean;
  /** 是否脱离菜单控制（true = 只注册路由，不被 router 当作菜单处理） */
  remind?: boolean;
  /** 是否固定标签页 */
  affix?: boolean;
  /** 访问所需角色 */
  roles?: string[];
  /** 访问所需权限码 */
  perms?: string[];
  /** 链接地址（新窗口打开） */
  linkUrl?: string;
  /** 激活的菜单路径（高亮父级） */
  activeMenu?: string;
  /** 额外任意字段 */
  [key: string]: unknown;
}

/**
 * 业务模块路由配置（meta 已类型化）
 *
 * <p>{@code children} 与 {@code meta} 都要从 {@code RouteRecordRaw} 里 Omit：
 * 只 Omit meta 时，交叉类型会把 children 收成
 * {@code RouteRecordRaw[] & RouteConfigsTable[]}，元素必须同时满足两套约束，
 * 于是把 {@code RouteConfigsTable[]} 数组（例如各 pages 包的路由工厂产出）
 * 直接挂进分组就报 TS2322。</p>
 */
export type RouteConfigsTable = Omit<RouteRecordRaw, "meta" | "children"> & {
  name?: RouteRecordRaw["name"];
  path: string;
  component?: RouteRecordRaw["component"];
  redirect?: RouteRecordRaw["redirect"];
  children?: RouteConfigsTable[];
  meta?: RouteMeta;
};

/** 权限校验结果 */
export interface RouteAuthResult {
  /** 是否放行 */
  allowed: boolean;
  /** 拒绝时跳转路径（如 /login、/403） */
  redirect?: string;
}
