import type { IconifyIcon } from "@iconify/vue";

export type RouteMetaType = {
  title?: string;
  icon?: string | IconifyIcon;
  iconOnline?: string | IconifyIcon;
  showLink?: boolean;
  backstage?: boolean;
  savedPosition?: boolean;
  auths?: Array<string>;
  i18nKey?: string;
  permanentNew?: boolean;
  alwaysIncludeStatic?: boolean;
  createTime?: string;
  hidden?: boolean;
  hiddenTag?: boolean;
  fixedTag?: boolean;
  keepAlive?: boolean;
  showParent?: boolean;
  activePath?: string;
  frameSrc?: string;
  frameLoading?: boolean;
  transition?: {
    name?: string;
    enterTransition?: string;
    leaveTransition?: string;
  };
  remainingSelf?: boolean;
  remaining?: boolean;
  badgeType?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "custom";
  badgeText?: string;
  routeComponentMissing?: boolean;
};

export type MenuType = {
  id?: number;
  name?: string;
  path?: string;
  noShowingChildren?: boolean;
  children?: MenuType[];
  value: unknown;
  component?: unknown;
  components?: Record<string, unknown>;
  hasSubMenu?: boolean;
  level?: number;
  meta?: {
    icon?: string;
    iconOnline?: string | IconifyIcon;
    title?: string;
    rank?: number;
    showParent?: boolean;
    extraIcon?: string;
    showLink?: boolean;
    backstage?: boolean;
    i18nKey?: string;
    permanentNew?: boolean;
    alwaysIncludeStatic?: boolean;
    createTime?: string;
    remainingSelf?: boolean;
    remaining?: boolean;
    hidden?: boolean;
    hiddenTag?: boolean;
    fixedTag?: boolean;
    keepAlive?: boolean;
    activePath?: string;
    frameSrc?: string;
    frameLoading?: boolean;
    badgeType?:
      | "default"
      | "primary"
      | "success"
      | "warning"
      | "danger"
      | "custom";
    badgeText?: string;
    routeComponentMissing?: boolean;
  };
  showTooltip?: boolean;
  parentId?: number | null;
  pathList?: number[];
  redirect?: string;
};
