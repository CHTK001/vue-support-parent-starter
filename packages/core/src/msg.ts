/**
 * 消息提示（core）
 *
 * 通用消息 / 通知 / 确认框封装，供所有主题 / 应用复用。
 * 依赖 element-plus 的 ElMessage / ElNotification / ElMessageBox。
 */
import { ElNotification, ElMessageBox, ElMessage } from "element-plus";

type MessageType = "primary" | "info" | "success" | "error" | "warning";

/** 封装任意提示类型通知，默认 info */
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

/** 提示信息，默认 info */
export function msg(message: any, plain = true, duration = 2000, type: MessageType = "info", parseHtml = false) {
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
  type: string = "info"
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    ElMessageBox.prompt(message as any, title as any, {
      confirmButtonText,
      cancelButtonText,
      type,
      draggable: true,
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
