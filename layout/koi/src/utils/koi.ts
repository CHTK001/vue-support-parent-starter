// Message utility wrappers (simplified, no i18n dependency)
import { ElNotification, ElMessageBox, ElMessage } from "element-plus";

type MessageType = "primary" | "info" | "success" | "error" | "warning";

export function koiNotice(message: any, title = "Reminder", duration = 2000, type: MessageType = "info", parseHtml = false) {
  ElNotification.closeAll();
  ElNotification({ message, title, type, duration, showClose: true, dangerouslyUseHTMLString: parseHtml });
}

export function koiNoticeSuccess(message: any, title = "Reminder", duration = 2000, type: MessageType = "success", parseHtml = false) {
  ElNotification.closeAll();
  ElNotification({ message, type, title, duration, showClose: true, dangerouslyUseHTMLString: parseHtml });
}

export function koiNoticeError(message: any, title = "Reminder", duration = 2000, type: MessageType = "error", parseHtml = false) {
  ElNotification.closeAll();
  ElNotification({ message, type, title, duration, showClose: true, dangerouslyUseHTMLString: parseHtml });
}

export function koiNoticeWarning(message: any, title = "Reminder", duration = 2000, type: MessageType = "warning", parseHtml = false) {
  ElNotification.closeAll();
  ElNotification({ message, title, type, duration, showClose: true, dangerouslyUseHTMLString: parseHtml });
}

export function koiNoticeInfo(message: any, title = "Reminder", duration = 2000, type: MessageType = "info", parseHtml = false) {
  ElNotification.closeAll();
  ElNotification({ message, type, title, duration, showClose: true, dangerouslyUseHTMLString: parseHtml });
}

export function koiMsg(message: any, plain = true, duration = 2000, type: MessageType = "info", parseHtml = false) {
  ElMessage.closeAll();
  ElMessage({ message, plain, duration, type, showClose: true, dangerouslyUseHTMLString: parseHtml });
}

export function koiMsgSuccess(message: any, plain = true, duration = 2000, type: MessageType = "success", parseHtml = false) {
  ElMessage.closeAll();
  ElMessage({ message, plain, duration, type, showClose: true, dangerouslyUseHTMLString: parseHtml });
}

export function koiMsgError(message: any, plain = true, duration = 2000, type: MessageType = "error", parseHtml = false) {
  ElMessage.closeAll();
  ElMessage({ message, plain, duration, type, showClose: true, dangerouslyUseHTMLString: parseHtml });
}

export function koiMsgWarning(message: any, plain = true, duration = 2000, type: MessageType = "warning", parseHtml = false) {
  ElMessage.closeAll();
  ElMessage({ message, plain, duration, type, showClose: true, dangerouslyUseHTMLString: parseHtml });
}

export function koiMsgInfo(message: any, plain = true, duration = 2000, type: MessageType = "info", parseHtml = false) {
  ElMessage.closeAll();
  ElMessage({ message, plain, duration, type, showClose: true, dangerouslyUseHTMLString: parseHtml });
}

export function koiMsgBox(
  message: any = "Are you sure to close?",
  title: string = "Confirm",
  confirmButtonText: string = "OK",
  cancelButtonText: string = "Cancel",
  type: string = "warning"
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    ElMessageBox.confirm(message as any, title as any, {
      confirmButtonText, cancelButtonText, type, draggable: true, dangerouslyUseHTMLString: true
    } as any)
      .then(() => resolve(true))
      .catch(() => reject(false));
  });
}

export function koiMsgBoxPrompt(
  message: any = "Please enter data?",
  title: string = "Prompt",
  confirmButtonText: string = "OK",
  cancelButtonText: string = "Cancel",
  type: string = "info"
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    ElMessageBox.prompt(message as any, title as any, {
      confirmButtonText, cancelButtonText, type, draggable: true
    } as any)
      .then((res: any) => resolve(res))
      .catch(() => reject(false));
  });
}
