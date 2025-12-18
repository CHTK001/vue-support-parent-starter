/**
 * 调试工具模块
 * 提供调试模式、控制台代理等功能
 * @author CH
 * @version 2.0.0
 * @since 2025-12-03
 */
import { addListener, crashBrowserCurrentTab, launch } from "devtools-detector";

/** 日志类型 */
export type LogType = "log" | "info" | "warn" | "error" | "debug";

/** 日志条目接口 */
export interface LogEntry {
  id: string;
  type: LogType;
  message: string;
  timestamp: number;
  args: unknown[];
}

/** 日志回调函数类型 */
type LogCallback = (entry: LogEntry) => void;

/** 控制台代理状态 */
interface ConsoleProxyState {
  isEnabled: boolean;
  callbacks: Set<LogCallback>;
  originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };
  logHistory: LogEntry[];
  maxHistorySize: number;
}

/** 控制台代理状态 */
const proxyState: ConsoleProxyState = {
  isEnabled: false,
  callbacks: new Set(),
  originalConsole: {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  },
  logHistory: [],
  maxHistorySize: 100,
};

/** 生成唯一 ID */
const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/** 格式化日志参数为字符串 */
const formatArgs = (args: unknown[]): string => {
  return args
    .map((arg) => {
      if (arg === null) return "null";
      if (arg === undefined) return "undefined";
      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(" ");
};

/** 创建代理函数 */
const createProxyMethod = (type: LogType) => {
  return (...args: unknown[]): void => {
    // 调用原始方法
    proxyState.originalConsole[type](...args);

    // 如果代理已启用，创建日志条目并通知回调
    if (proxyState.isEnabled) {
      const entry: LogEntry = {
        id: generateId(),
        type,
        message: formatArgs(args),
        timestamp: Date.now(),
        args,
      };

      // 添加到历史记录
      proxyState.logHistory.push(entry);
      if (proxyState.logHistory.length > proxyState.maxHistorySize) {
        proxyState.logHistory.shift();
      }

      // 通知所有回调
      proxyState.callbacks.forEach((callback) => {
        try {
          callback(entry);
        } catch (e) {
          proxyState.originalConsole.error("日志回调执行失败:", e);
        }
      });
    }
  };
};

/**
 * 启用控制台代理
 * @param callback - 日志回调函数
 * @returns 取消订阅函数
 */
export const enableConsoleProxy = (callback?: LogCallback): (() => void) => {
  if (!proxyState.isEnabled) {
    // 替换 console 方法
    console.log = createProxyMethod("log");
    console.info = createProxyMethod("info");
    console.warn = createProxyMethod("warn");
    console.error = createProxyMethod("error");
    console.debug = createProxyMethod("debug");
    proxyState.isEnabled = true;
  }

  // 注册回调
  if (callback) {
    proxyState.callbacks.add(callback);
  }

  // 返回取消订阅函数
  return () => {
    if (callback) {
      proxyState.callbacks.delete(callback);
    }
    // 如果没有回调了，禁用代理
    if (proxyState.callbacks.size === 0) {
      disableConsoleProxy();
    }
  };
};

/**
 * 禁用控制台代理
 */
export const disableConsoleProxy = (): void => {
  if (proxyState.isEnabled) {
    // 恢复原始 console 方法
    console.log = proxyState.originalConsole.log;
    console.info = proxyState.originalConsole.info;
    console.warn = proxyState.originalConsole.warn;
    console.error = proxyState.originalConsole.error;
    console.debug = proxyState.originalConsole.debug;
    proxyState.isEnabled = false;
    proxyState.callbacks.clear();
    proxyState.logHistory = [];
  }
};

/**
 * 获取控制台代理状态
 */
export const isConsoleProxyEnabled = (): boolean => proxyState.isEnabled;

/**
 * 获取日志历史记录
 */
export const getLogHistory = (): LogEntry[] => [...proxyState.logHistory];

/**
 * 清空日志历史记录
 */
export const clearLogHistory = (): void => {
  proxyState.logHistory = [];
};

export const loopDebugger = () => {
  (() => {
    function block() {
      setInterval(() => {
        // 清除控制台
        console.clear();
        
        // 无限 debugger
        (function () {
          return false;
        })
          ["constructor"]("debugger")
          ["call"]();
      }, 50);
    }
    try {
      block();
    } catch (err) {}
  })();
};

export const redirectDebugger = () => {
  // 1. 防止调试器检测
  addListener((isOpen) => {
    if (isOpen) {
      setTimeout(crashBrowserCurrentTab, 10);
      // 清除浏览器历史记录并跳转到百度
      if (window.history && window.history.replaceState) {
        // 清除当前页面的历史记录
        window.history.replaceState(null, "", "about:blank");
        // 清除所有历史记录
        window.history.go(-(window.history.length - 1));
      }

      // 使用replace方式跳转，不会在历史记录中留下痕迹
      window.location.replace("https://www.baidu.com");
    }
  });

  // 2. 防止浏览器后退
  history.pushState(null, "", location.href);
  window.addEventListener("popstate", function (event) {
    history.pushState(null, "", location.href);
  });

  // 3. 防止页面刷新和常用快捷键
  document.addEventListener("keydown", function (e) {
    // 防止F5刷新
    if (e.key === "F5" || (e.ctrlKey && e.key === "r")) {
      e.preventDefault();
      return false;
    }
    // 防止Ctrl+Shift+I (开发者工具)
    if (e.ctrlKey && e.shiftKey && e.key === "I") {
      e.preventDefault();
      return false;
    }
    // 防止F12 (开发者工具)
    if (e.key === "F12") {
      e.preventDefault();
      return false;
    }
    // 防止Ctrl+U (查看源代码)
    if (e.ctrlKey && e.key === "u") {
      e.preventDefault();
      return false;
    }
    // 防止Ctrl+S (保存页面)
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      return false;
    }
    // 防止Ctrl+A (全选)
    if (e.ctrlKey && e.key === "a") {
      e.preventDefault();
      return false;
    }
    // 防止Ctrl+P (打印)
    if (e.ctrlKey && e.key === "p") {
      e.preventDefault();
      return false;
    }
  });

  // 4. 防止右键菜单
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    return false;
  });

  // 5. 防止文本选择
  document.addEventListener("selectstart", function (e) {
    e.preventDefault();
    return false;
  });

  // 6. 防止拖拽
  document.addEventListener("dragstart", function (e) {
    e.preventDefault();
    return false;
  });

  // 7. 监听页面可见性变化，防止切换标签页后返回
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      // 页面被隐藏时记录状态
      sessionStorage.setItem("pageHidden", "true");
    } else {
      // 页面重新可见时检查
      if (sessionStorage.getItem("pageHidden") === "true") {
        // 清除浏览器历史记录并跳转到百度
        if (window.history && window.history.replaceState) {
          // 清除当前页面的历史记录
          window.history.replaceState(null, "", "about:blank");
          // 清除所有历史记录
          window.history.go(-(window.history.length - 1));
        }

        // 使用replace方式跳转，不会在历史记录中留下痕迹
        window.location.replace("https://www.baidu.com");
      }
    }
  });

  // 8. 防止通过历史记录API操作
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(history, arguments);
    // 确保始终有一个状态阻止后退
    setTimeout(() => {
      history.pushState(null, "", location.href);
    }, 0);
  };

  history.replaceState = function () {
    originalReplaceState.apply(history, arguments);
    // 确保始终有一个状态阻止后退
    setTimeout(() => {
      history.pushState(null, "", location.href);
    }, 0);
  };

  // 9. 启动调试器检测
  launch();

  // 10. 定期检查页面完整性
  setInterval(() => {
    // 检查关键DOM元素是否被篡改
    if (!document.body || !document.documentElement) {
      // 清除浏览器历史记录并跳转到百度
      if (window.history && window.history.replaceState) {
        // 清除当前页面的历史记录
        window.history.replaceState(null, "", "about:blank");
        // 清除所有历史记录
        window.history.go(-(window.history.length - 1));
      }

      // 使用replace方式跳转，不会在历史记录中留下痕迹
      window.location.replace("https://www.baidu.com");
    }
  }, 1000);
};
