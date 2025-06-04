/**
 * Ant Design Vue 全局配置文件
 * 用于设置全局通知、确认框等方法
 */
import { message, notification, Modal } from "ant-design-vue";
import type { NotificationArgsProps } from "ant-design-vue/es/notification";
import type { ModalFuncProps } from "ant-design-vue/es/modal/Modal";
import type { App } from "vue";

// 向Window接口添加全局方法声明
declare global {
  interface Window {
    $notification: typeof $notification;
    $confirm: typeof $confirm;
    $message: typeof message;
    $info: typeof Modal.info;
    $success: typeof Modal.success;
    $error: typeof Modal.error;
    $warning: typeof Modal.warning;
  }
}

// 更新通知组件的 z-index
const updateNotificationZIndex = () => {
  // 设置全局 zIndex，确保弹窗在最上层
  notification.config({
    top: "50px",
    duration: 3,
    maxCount: 3,
    placement: "topRight",
  });

  message.config({
    top: "60px",
    duration: 2,
    maxCount: 3,
  });
};

// 创建全局通知对象
export const $notification = {
  success(options: NotificationArgsProps | string) {
    updateNotificationZIndex();
    return typeof options === "string" ? notification.success({ message: options }) : notification.success(options);
  },
  error(options: NotificationArgsProps | string) {
    updateNotificationZIndex();
    return typeof options === "string" ? notification.error({ message: options }) : notification.error(options);
  },
  info(options: NotificationArgsProps | string) {
    updateNotificationZIndex();
    return typeof options === "string" ? notification.info({ message: options }) : notification.info(options);
  },
  warn(options: NotificationArgsProps | string) {
    updateNotificationZIndex();
    return typeof options === "string" ? notification.warning({ message: options }) : notification.warning(options);
  },
  warning(options: NotificationArgsProps | string) {
    updateNotificationZIndex();
    return typeof options === "string" ? notification.warning({ message: options }) : notification.warning(options);
  },
  open(options: NotificationArgsProps) {
    updateNotificationZIndex();
    return notification.open(options);
  },
};

// 创建全局确认框方法
export const $confirm = (props: ModalFuncProps) => {
  return Modal.confirm({
    okText: "确定",
    cancelText: "取消",
    ...props,
  });
};

// 其他模态框方法
export const $info = Modal.info;
export const $success = Modal.success;
export const $error = Modal.error;
export const $warning = Modal.warning;

// 创建全局消息对象
export const $message = message;

// 立即将方法挂载到全局window对象
window.$notification = $notification;
window.$confirm = $confirm;
window.$message = $message;
window.$info = $info;
window.$success = $success;
window.$error = $error;
window.$warning = $warning;

// 注册全局方法的插件
export const setupAntdConfig = {
  install(app: App) {
    // 全局注册方法
    app.config.globalProperties.$notification = $notification;
    //@ts-ignore
    app.config.globalProperties.$confirm = $confirm;
    //@ts-ignore
    app.config.globalProperties.$info = $info;
    //@ts-ignore
    app.config.globalProperties.$success = $success;
    //@ts-ignore
    app.config.globalProperties.$error = $error;
    //@ts-ignore
    app.config.globalProperties.$warning = $warning;
    //@ts-ignore
    app.config.globalProperties.$message = $message;
  },
};

export default setupAntdConfig;
