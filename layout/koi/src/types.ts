import type { Component } from "vue";

export type KoiLayoutType = "vertical" | "columns" | "classic" | "horizontal" | "optimum";

export type TabsStyle = "google" | "card" | "plain";

export interface KoiGlobalState {
  isFullScreen: boolean;
  isCollapse: boolean;
  isColumnFirstCollapse: boolean;
  menuWidth: number;
  isDark: boolean;
  dimension: string;
  maximize: boolean;
  language: string;
  themeColor: string;
  layout: KoiLayoutType;
  tabsStyle: TabsStyle;
  transition: string;
  uniqueOpened: boolean;
  isGrey: boolean;
  isWeak: boolean;
  asideInverted: boolean;
  headerInverted: boolean;
}

export interface KoiTabItem {
  path: string;
  name: string;
  title: string;
  icon?: string;
  isKeepAlive?: string;
  isAffix?: string;
  parentId?: string;
  menuId?: string;
}

export interface KoiAuthState {
  menuList: any[];
  recursiveMenuList: any[];
  breadcrumbList: any[];
  roleList: string[];
  buttonList: string[];
}

export interface LayoutComponentMap {
  vertical: Component;
  columns: Component;
  classic: Component;
  horizontal: Component;
  optimum: Component;
}