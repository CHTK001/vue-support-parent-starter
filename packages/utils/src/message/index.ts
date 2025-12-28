import type { VNode } from "vue";
import { isFunction } from "@pureadmin/utils";
import { type MessageHandler, ElMessage, ElMessageBox } from "element-plus";
import { ElLoading } from "element-plus";

type messageStyle = "el" | "antd";
type messageTypes = "info" | "success" | "warning" | "error";

interface MessageParams {
  /** 消息类型，可选 `info` 、`success` 、`warning` 、`error` ，默认 `info` */
  type?: messageTypes;
  /** 自定义图标，该属性会覆盖 `type` 的图标 */
  icon?: any;
  /** 是否将 `message` 属性作为 `HTML` 片段处理，默认 `false` */
  dangerouslyUseHTMLString?: boolean;
  /** 消息风格，可选 `el` 、`antd` ，默认 `antd` */
  customClass?: messageStyle;
  /** 显示时间，单位为毫秒。设为 `0` 则不会自动关闭，`element-plus` 默认是 `3000` ，平台改成默认 `2000` */
  duration?: number;
  /** 是否显示关闭按钮，默认值 `false` */
  showClose?: boolean;
  /** 文字是否居中，默认值 `false` */
  center?: boolean;
  /** `Message` 距离窗口顶部的偏移量，默认 `20` */
  offset?: number;
  /** 设置组件的根元素，默认 `document.body` */
  appendTo?: string | HTMLElement;
  /** 合并内容相同的消息，不支持 `VNode` 类型的消息，默认值 `false` */
  grouping?: boolean;
  /** 关闭时的回调函数, 参数为被关闭的 `message` 实例 */
  onClose?: Function | null;
}

/** 用法非常简单，参考 src/views/components/message/index.vue 文件 */

/**
 * `Message` 消息提示函数
 */
const messageFunction = (message: string | VNode | (() => VNode), params?: MessageParams): MessageHandler => {
  if (!params) {
    return ElMessage({
      message,
      customClass: "pure-message",
    });
  } else {
    const { icon, type = "info", dangerouslyUseHTMLString = false, customClass = "antd", duration = 2000, showClose = false, center = false, offset = 20, appendTo = document.body, grouping = false, onClose } = params;

    return ElMessage({
      message,
      type,
      icon,
      dangerouslyUseHTMLString,
      duration,
      showClose,
      center,
      offset,
      appendTo,
      grouping,
      // 全局搜 pure-message 即可知道该类的样式位置
      customClass: customClass === "antd" ? "pure-message" : "",
      onClose: () => (isFunction(onClose) ? onClose() : null),
    });
  }
};

/**
 * 关闭所有 `Message` 消息提示函数
 */
const closeAllMessage = (): void => ElMessage.closeAll();

// Loading实例存储映射
const loadingInstances: Record<string, ReturnType<typeof ElLoading.service>> = {};

// 创建包含便捷方法的消息对象
interface MessageFunction {
  (message: string | VNode | (() => VNode), params?: MessageParams): MessageHandler;
  info: (message: string | VNode | (() => VNode), params?: Omit<MessageParams, "type">) => MessageHandler;
  success: (message: string | VNode | (() => VNode), params?: Omit<MessageParams, "type">) => MessageHandler;
  warning: (message: string | VNode | (() => VNode), params?: Omit<MessageParams, "type">) => MessageHandler;
  error: (message: string | VNode | (() => VNode), params?: Omit<MessageParams, "type">) => MessageHandler;
  loading: (
    text?: string,
    options?: {
      target?: string | HTMLElement;
      background?: string;
      fullscreen?: boolean;
      name?: string;
      duration?: number;
    }
  ) => void;
  closeLoading: (name?: string) => void;
  closeAllLoading: () => void;
  closeAll: () => void;
}

// 构建增强版message对象
const message = messageFunction as MessageFunction;

// 添加便捷方法
message.info = (msg, params = {}) => messageFunction(msg, { ...params, type: "info" });
message.success = (msg, params = {}) => messageFunction(msg, { ...params, type: "success" });
message.warning = (msg, params = {}) => messageFunction(msg, { ...params, type: "warning" });
message.error = (msg, params = {}) => messageFunction(msg, { ...params, type: "error" });

// 加载中方法 - 使用Element Plus的ElLoading服务
message.loading = (text = "加载中...", options = {}) => {
  // 获取loading名称，默认为'default'
  const name = options.name || "default";

  // 如果已经有相同名称的loading实例，先关闭它
  if (loadingInstances[name]) {
    loadingInstances[name].close();
  }

  // 创建新的loading实例并存储到映射中
  loadingInstances[name] = ElLoading.service({
    lock: true,
    text,
    background: options.background || "rgba(255, 255, 255, 0.7)",
    target: options.target || "body",
    fullscreen: options.fullscreen !== false,
  });

  // 设置自动关闭定时器
  const duration = options.duration ?? 3000; // 默认3秒自动关闭
  if (duration > 0) {
    setTimeout(() => {
      // 检查实例是否还存在，避免已手动关闭的情况
      if (loadingInstances[name]) {
        loadingInstances[name].close();
        delete loadingInstances[name];
      }
    }, duration);
  }
};

// 关闭指定名称的loading方法，默认关闭'default'
message.closeLoading = (name = "default") => {
  if (loadingInstances[name]) {
    loadingInstances[name].close();
    delete loadingInstances[name];
  }
};

// 关闭所有loading实例
message.closeAllLoading = () => {
  Object.keys(loadingInstances).forEach((name) => {
    loadingInstances[name].close();
  });
  // 清空实例映射
  Object.keys(loadingInstances).forEach((key) => {
    delete loadingInstances[key];
  });
};

message.closeAll = closeAllMessage;

// 导出 MessageBox 作为 messageBox
export const messageBox = ElMessageBox;

/**
 * 确认对话框
 */
export const confirm = (message: string, title?: string, options?: any) => {
  return ElMessageBox.confirm(message, title || '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    ...options
  });
};

export { message, closeAllMessage };
