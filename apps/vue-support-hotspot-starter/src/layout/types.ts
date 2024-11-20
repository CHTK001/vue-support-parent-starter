import type { IconifyIcon } from "@iconify/vue";
import type { RouteMetaType } from "@repo/core";

const { VITE_HIDE_HOME } = import.meta.env;

export const routerArrays: Array<RouteConfigs> =
  VITE_HIDE_HOME === "false"
    ? [
        {
          path: "/home",
          meta: {
            title: "menus.pureHome",
            icon: "ep:home-filled"
          }
        }
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
};

export interface scrollbarDomType extends HTMLElement {
  wrap?: {
    offsetWidth: number;
  };
}
