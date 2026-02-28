import type { IconifyIcon } from "@iconify/vue";
import type { RouteMetaType } from "@repo/core";
import { $t } from "@repo/config";

const { VITE_HIDE_HOME } = import.meta.env;

export const routerArrays: Array<RouteConfigs> =
  VITE_HIDE_HOME === "false"
    ? [
        {
          path: "/home",
          meta: {
            title: $t("menus.pureHome"),
            icon: "ep:home-filled",
          },
        },
      ]
    : [];

export type RouteConfigs = {
  path?: string;
  query?: object;
  params?: object;
  meta?: RouteMetaType;
  children?: RouteConfigs[];
  name?: string;
};

export type multiTagsType = {
  tags: Array<RouteConfigs>;
};

export type tagsViewsType = {
  icon: string | IconifyIcon;
  text: string;
  divided: boolean;
  disabled: boolean;
  show: boolean;
};

export interface setType {
  sidebar: {
    opened: boolean;
    withoutAnimation: boolean;
    isClickCollapse: boolean;
  };
  device: string;
  fixedHeader: boolean;
  classes: {
    hideSidebar: boolean;
    openSidebar: boolean;
    withoutAnimation: boolean;
    mobile: boolean;
  };
  hideTabs: boolean;
}

export type themeColorsType = {
  color: string;
  themeColor: string;
  description?: string;
};

export interface scrollbarDomType extends HTMLElement {
  wrap?: {
    offsetWidth: number;
  };
}

/**
 * 布局事件类型定义
 * 用于 emitter 事件总线的类型约束
 */
export interface LayoutEmitterEvents {
  // 标签页相关
  tagViewsChange: string;
  tagViewsShowModel: string;
  showTagIconChange: boolean;

  // 布局相关
  changLayoutRoute: string;
  openPanel: void;
  logoChange: boolean;
  hideFooterChange: boolean;
  hideHeaderChange: boolean;

  // 面包屑相关
  breadcrumbChange: boolean;
  breadcrumbModeChange: "icon" | "icon-text";

  // 主题相关
  systemThemeChange: string;
  aiChatThemeChange: string;
  aiChatSkinChange: string;

  // 功能开关
  keepAliveChange: boolean;
  debugModeChange: boolean;
  debugModeChanged: boolean;
  messagePopupConfigChange: void;

  // 设置面板
  settingPanelClosed: void;
}
