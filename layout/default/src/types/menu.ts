/**
 * 菜单类型定义
 * @description 统一管理菜单相关类型，增强类型安全
 */
import type { RouteRecordRaw } from "vue-router";

/**
 * 菜单元数据
 */
export interface MenuMeta {
  /** 菜单标题 */
  title?: string;
  /** 国际化键值 */
  i18nKey?: string;
  /** 菜单图标 */
  icon?: string;
  /** 额外图标 */
  extraIcon?: string | { svg?: boolean; name: string };
  /** 是否显示在菜单中 */
  showLink?: boolean;
  /** 是否显示父级 */
  showParent?: boolean;
  /** 菜单排序 */
  rank?: number;
  /** 激活路径（用于高亮） */
  activePath?: string;
  /** 是否缓存 */
  keepAlive?: boolean;
  /** 是否固定标签 */
  fixedTag?: boolean;
  /** 是否是新菜单 */
  isNew?: boolean;
  /** 新菜单创建时间 */
  newMenuTime?: number;
  /** 是否在 iframe 中打开 */
  frameSrc?: string;
  /** 是否全屏 */
  frameLoading?: boolean;
  /** 过渡动画名称 */
  transition?: {
    name?: string;
    enterTransition?: string;
    leaveTransition?: string;
  };
  /** 是否隐藏标签 */
  hiddenTag?: boolean;
  /** 动态路由层级 */
  dynamicLevel?: number;
  /** 角色权限 */
  roles?: string[];
  /** 按钮权限 */
  auths?: string[];
}

/**
 * 菜单项类型
 */
export interface MenuItem {
  /** 路由路径 */
  path: string;
  /** 路由名称 */
  name?: string;
  /** 重定向路径 */
  redirect?: string;
  /** 菜单元数据 */
  meta?: MenuMeta;
  /** 子菜单 */
  children?: MenuItem[];
  /** 组件路径 */
  component?: RouteRecordRaw["component"];
}

/**
 * 侧边栏菜单项 Props
 */
export interface SidebarItemProps {
  /** 菜单项数据 */
  item: MenuItem;
  /** 是否是嵌套菜单 */
  isNest?: boolean;
  /** 基础路径 */
  basePath?: string;
}

/**
 * 导航发射事件类型
 */
export interface NavEmits {
  /** 菜单点击事件 */
  menuClick: [menu: MenuItem];
  /** 收藏切换事件 */
  favoriteToggle: [menu: MenuItem, isFavorited: boolean];
}
