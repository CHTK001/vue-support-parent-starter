/**
 * 消息提示（core）
 *
 * 提供两套 API：
 *  1) 对象风格（推荐）：import { message } from "@repo/core"; message.success("...")
 *  2) 函数风格（兼容）：import { msgSuccess, msgError } from "@repo/core"; msgSuccess("...")
 *
 * 依赖 element-plus 的 ElMessage / ElNotification / ElMessageBox。
 * 构建期由 unplugin-element-plus 转换为按需子路径导入。
 */
import { ElNotification, ElMessageBox, ElMessage } from "element-plus";

type MessageType = "primary" | "info" | "success" | "error" | "warning";

/** 通用提示类型通知，默认 info */
export function notice(message: any, title = "提示", duration = 2000, type: MessageType = "info", parseHtml = false) {
  ElNotification.closeAll();
  ElNotification({ message, title, type, duration, showClose: true, dangerouslyUseHTMLString: parseHtml });
}

/** 成功通知 */
export function noticeSuccess(message: any, title = "提示", duration = 2000) {
  notice(message, title, duration, "success");
}

/** 错误通知 */
export function noticeError(message: any, title = "提示", duration = 2000) {
  notice(message, title, duration, "error");
}

/** 警告通知 */
export function noticeWarning(message: any, title = "提示", duration = 2000) {
  notice(message, title, duration, "warning");
}

/** 信息通知 */
export function noticeInfo(message: any, title = "提示", duration = 2000) {
  notice(message, title, duration, "info");
}

/** 全局守卫：拦截器显示 5xx/network toast 后，抑制紧随的下一次 msg 调用，避免重复弹窗 */
let _suppressNextMsg = false;
/** 设置/清除全局守卫 */
export function setSuppressNextMsg(v: boolean) {
  _suppressNextMsg = v;
}

/** 提示信息，默认 info */
export function msg(message: any, plain = true, duration = 2000, type: MessageType = "info", parseHtml = false) {
  if (_suppressNextMsg) {
    _suppressNextMsg = false;
    return;
  }
  ElMessage.closeAll();
  ElMessage({ message, plain, duration, type, showClose: true, dangerouslyUseHTMLString: parseHtml });
}

/** 主色提示 */
export function msgPrimary(message: any, plain = true, duration = 2000) {
  msg(message, plain, duration, "primary");
}

/** 成功提示 */
export function msgSuccess(message: any, plain = true, duration = 2000) {
  msg(message, plain, duration, "success");
}

/** 错误提示 */
export function msgError(message: any, plain = true, duration = 2000) {
  msg(message, plain, duration, "error");
}

/** 警告提示 */
export function msgWarning(message: any, plain = true, duration = 2000) {
  msg(message, plain, duration, "warning");
}

/** 信息提示 */
export function msgInfo(message: any, plain = true, duration = 2000) {
  msg(message, plain, duration, "info");
}

/** 确认框，默认 warning */
export function msgBox(
  message: any = "您确定进行关闭么？",
  title: string = "温馨提示：",
  confirmButtonText: string = "确定",
  cancelButtonText: string = "取消",
  type: string = "warning"
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    ElMessageBox.confirm(message as any, title as any, {
      confirmButtonText,
      cancelButtonText,
      type,
      draggable: true,
      dangerouslyUseHTMLString: true,
    } as any)
      .then(() => resolve(true))
      .catch(() => reject(false));
  });
}

/** Prompt 类型的消息框 */
export function msgBoxPrompt(
  message: any = "请输入需要修改的数据？",
  title: string = "温馨提示：",
  confirmButtonText: string = "确定",
  cancelButtonText: string = "取消",
  type: string = "info",
  options?: Record<string, unknown>
): Promise<any> {
  return new Promise((resolve, reject) => {
    ElMessageBox.prompt(message as any, title as any, {
      confirmButtonText,
      cancelButtonText,
      type,
      draggable: true,
      ...(options ?? {}),
    } as any)
      .then((res) => resolve(res as any))
      .catch(() => reject(false));
  });
}

/** Alert 类型的消息框 */
export function msgBoxAlert(
  message: any = "请输入需要修改的数据？",
  title: string = "温馨提示：",
  confirmButtonText: string = "确定",
  type: string = "info"
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    ElMessageBox.alert(message as any, title as any, {
      confirmButtonText,
      type,
      draggable: true,
    } as any)
      .then(() => resolve(true))
      .catch(() => reject(false));
  });
}

/* ============================================================
 * 对象风格 API（推荐）
 * import { message } from "@repo/core";
 * message.success("xxx");
 * ============================================================ */

/** ElMessage 对象风格 */
const messageEl = {
  primary: (m: any, opts?: { plain?: boolean; duration?: number; parseHtml?: boolean }) =>
    msg(m, opts?.plain ?? true, opts?.duration ?? 2000, "primary", opts?.parseHtml ?? false),
  success: (m: any, opts?: { plain?: boolean; duration?: number; parseHtml?: boolean }) =>
    msg(m, opts?.plain ?? true, opts?.duration ?? 2000, "success", opts?.parseHtml ?? false),
  error: (m: any, opts?: { plain?: boolean; duration?: number; parseHtml?: boolean }) =>
    msg(m, opts?.plain ?? true, opts?.duration ?? 2000, "error", opts?.parseHtml ?? false),
  warning: (m: any, opts?: { plain?: boolean; duration?: number; parseHtml?: boolean }) =>
    msg(m, opts?.plain ?? true, opts?.duration ?? 2000, "warning", opts?.parseHtml ?? false),
  info: (m: any, opts?: { plain?: boolean; duration?: number; parseHtml?: boolean }) =>
    msg(m, opts?.plain ?? true, opts?.duration ?? 2000, "info", opts?.parseHtml ?? false),
  /** 关闭所有 */
  closeAll: () => ElMessage.closeAll(),
};

/** ElNotification 对象风格 */
const notification = {
  primary: (m: any, opts?: { title?: string; duration?: number; parseHtml?: boolean }) =>
    notice(m, opts?.title ?? "提示", opts?.duration ?? 2000, "primary", opts?.parseHtml ?? false),
  success: (m: any, opts?: { title?: string; duration?: number; parseHtml?: boolean }) =>
    notice(m, opts?.title ?? "提示", opts?.duration ?? 2000, "success", opts?.parseHtml ?? false),
  error: (m: any, opts?: { title?: string; duration?: number; parseHtml?: boolean }) =>
    notice(m, opts?.title ?? "提示", opts?.duration ?? 2000, "error", opts?.parseHtml ?? false),
  warning: (m: any, opts?: { title?: string; duration?: number; parseHtml?: boolean }) =>
    notice(m, opts?.title ?? "提示", opts?.duration ?? 2000, "warning", opts?.parseHtml ?? false),
  info: (m: any, opts?: { title?: string; duration?: number; parseHtml?: boolean }) =>
    notice(m, opts?.title ?? "提示", opts?.duration ?? 2000, "info", opts?.parseHtml ?? false),
  /** 关闭所有 */
  closeAll: () => ElNotification.closeAll(),
};

/** ElMessageBox 对象风格 */
export const messageBox = {
  confirm: msgBox,
  prompt: msgBoxPrompt,
  alert: msgBoxAlert,
  close: () => ElMessageBox.close(),
};

/** 对象风格 message（ElMessage + ElMessageBox + ElNotification） */
export const message = {
  ...messageEl,
  confirm: messageBox.confirm,
  prompt: messageBox.prompt,
  alert: messageBox.alert,
  notify: notification,
  notifySuccess: notification.success,
  notifyError: notification.error,
  notifyWarning: notification.warning,
  notifyInfo: notification.info,
};