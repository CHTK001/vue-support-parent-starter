///
/// Copyright (c) 2019 Of Him Code Technology Studio
/// Jpom is licensed under Mulan PSL v2.
/// You can use this software according to the terms and conditions of the Mulan PSL v2.
/// You may obtain a copy of Mulan PSL v2 at:
/// 			http://license.coscl.org.cn/MulanPSL2
/// THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT, MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
/// See the Mulan PSL v2 for more details.
///

import { createVNode } from "vue";
import {
  FileOutlined,
  SettingOutlined,
  FileTextOutlined,
  CloudServerOutlined,
  UserOutlined,
  DesktopOutlined,
  ToolOutlined,
  MonitorOutlined,
  CodeOutlined,
  BuildOutlined,
  SaveOutlined,
  HddOutlined,
  ApartmentOutlined,
  DashboardOutlined,
  ProjectOutlined,
  GatewayOutlined,
  LaptopOutlined,
} from "@ant-design/icons-vue";
import { message, notification, Modal } from "ant-design-vue";
import { NotificationArgsProps } from "ant-design-vue/es/notification";
import { ModalFuncProps } from "ant-design-vue/es/modal/Modal";
import { increaseZIndex } from "@/utils/utils";
import { App } from "vue";

const iconObj = {
  file: FileOutlined,
  desktop: DesktopOutlined,
  setting: SettingOutlined,
  hdd: HddOutlined,
  save: SaveOutlined,
  user: UserOutlined,
  apartment: ApartmentOutlined,
  build: BuildOutlined,
  code: CodeOutlined,
  "file-text": FileTextOutlined,
  "cloud-server": CloudServerOutlined,
  monitor: MonitorOutlined,
  tool: ToolOutlined,
  dashboard: DashboardOutlined,
  project: ProjectOutlined,
  gateway: GatewayOutlined,
  laptop: LaptopOutlined,
};

const Icon = (props: { type: string }) => {
  const { type } = props;
  // @ts-ignore
  return createVNode(iconObj[type]);
};

// 更新通知的 z-index
const updateNotificationZIndex = () => {
  // document.documentElement.style.setProperty('--increase-z-index', String(increaseZIndex()))
};

// 创建全局通知方法
export const $notification = {
  ...notification,
  success: (config: NotificationArgsProps) => {
    updateNotificationZIndex();
    return notification.success(config);
  },
  error: (config: NotificationArgsProps) => {
    updateNotificationZIndex();
    return notification.error(config);
  },
  info: (config: NotificationArgsProps) => {
    updateNotificationZIndex();
    return notification.info(config);
  },
  warning: (config: NotificationArgsProps) => {
    updateNotificationZIndex();
    return notification.warning(config);
  },
  open: (config: NotificationArgsProps) => {
    updateNotificationZIndex();
    return notification.open(config);
  },
};

// 创建全局确认框方法
export const $confirm = (props: ModalFuncProps) => {
  return Modal.confirm({ ...props, zIndex: increaseZIndex() });
};
export const $info = (props: ModalFuncProps) => {
  return Modal.info({ ...props, zIndex: increaseZIndex() });
};
export const $error = (props: ModalFuncProps) => {
  return Modal.error({ ...props, zIndex: increaseZIndex() });
};
export const $warning = (props: ModalFuncProps) => {
  return Modal.warning({ ...props, zIndex: increaseZIndex() });
};
export const $success = (props: ModalFuncProps) => {
  return Modal.success({ ...props, zIndex: increaseZIndex() });
};

// 配置通知默认设置
$notification.config({
  top: "100px",
  duration: 4,
});

// 配置消息默认设置
message.config({ duration: 4 });

// 导出消息方法
export const $message = message;

// 注册全局方法的插件
export default {
  install: (app: App) => {
    app.config.globalProperties.$confirm = $confirm;
    app.config.globalProperties.$notification = $notification;
    app.config.globalProperties.$message = $message;
    app.config.globalProperties.$info = $info;
    app.config.globalProperties.$error = $error;
    app.config.globalProperties.$warning = $warning;
    app.config.globalProperties.$success = $success;
  },
};
