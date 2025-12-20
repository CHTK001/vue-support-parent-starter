import type { Emitter } from "mitt";
import mitt from "mitt";

/** 全局公共事件需要在此处添加类型 */
type Events = {
  openPanel: string;
  tagViewsChange: string;
  tagViewsShowModel: string;
  logoChange: boolean;
  changLayoutRoute: string;
  settingPanelClosed: void;
  hideFooterChange: boolean;
  breadcrumbChange: boolean;
  breadcrumbModeChange: string;
  keepAliveChange: boolean;
  systemThemeChange: string;
  /** 消息开关变化事件 */
  showMessageChange: boolean;
};

export const emitter: Emitter<Events> = mitt<Events>();
