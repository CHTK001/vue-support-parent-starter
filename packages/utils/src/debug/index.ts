/**
 * 调试工具模块
 * 提供调试模式、控制台代理等功能
 * @author CH
 * @version 2.0.0
 * @since 2025-12-03
 */
import { addListener, launch, removeListener, stop } from "devtools-detector";

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

const DEBUG_GUARD_OVERLAY_ID = "repo-debug-guard-overlay";
const DEBUG_GUARD_DATASET_KEY = "debugGuardActive";
const DEFAULT_LOOP_DEBUGGER_INTERVAL = 1200;

let loopDebuggerTimer: ReturnType<typeof setInterval> | null = null;
let redirectDebuggerCleanup: (() => void) | null = null;
let devtoolsListener: ((isOpen: boolean) => void) | null = null;

const emitDebugGuardEvent = (isOpen: boolean) => {
  if (typeof window === "undefined" || typeof CustomEvent === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("repo:devtools-detected", {
      detail: { isOpen },
    }),
  );
};

const getDebugGuardOverlay = () =>
  document.getElementById(DEBUG_GUARD_OVERLAY_ID) as HTMLDivElement | null;

const ensureDebugGuardOverlay = () => {
  if (typeof document === "undefined") {
    return null;
  }

  const current = getDebugGuardOverlay();
  if (current) {
    return current;
  }

  const overlay = document.createElement("div");
  overlay.id = DEBUG_GUARD_OVERLAY_ID;
  overlay.setAttribute("role", "alert");
  overlay.setAttribute("aria-live", "assertive");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483647",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "padding:24px",
    "background:rgba(15,23,42,0.78)",
    "backdrop-filter:blur(18px)",
    "color:#f8fafc",
    "text-align:center",
  ].join(";");
  overlay.innerHTML =
    '<div style="max-width:420px;padding:28px 30px;border-radius:24px;border:1px solid rgba(148,163,184,0.18);background:linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92));box-shadow:0 24px 48px rgba(2,6,23,0.35);">' +
    '<div style="font-size:18px;font-weight:700;margin-bottom:10px;">检测到开发者工具已开启</div>' +
    '<div style="font-size:13px;line-height:1.7;color:rgba(226,232,240,0.82);">当前页面已启用前端源码保护。请关闭开发者工具后继续使用系统。</div>' +
    "</div>";
  document.body?.appendChild(overlay);
  return overlay;
};

const setDebugGuardState = (isOpen: boolean) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset[DEBUG_GUARD_DATASET_KEY] = String(isOpen);

  if (isOpen) {
    ensureDebugGuardOverlay();
    console.warn("[debug-guard] 检测到开发者工具已开启，已限制页面交互。");
  } else {
    getDebugGuardOverlay()?.remove();
  }

  emitDebugGuardEvent(isOpen);
};

const isBlockedDebugShortcut = (event: KeyboardEvent) =>
  event.key === "F12" ||
  (event.ctrlKey && event.shiftKey && ["I", "J", "C"].includes(event.key)) ||
  (event.ctrlKey && event.key.toLowerCase() === "u");

export const stopLoopDebugger = (): void => {
  if (!loopDebuggerTimer) {
    return;
  }

  clearInterval(loopDebuggerTimer);
  loopDebuggerTimer = null;
};

export const loopDebugger = (
  intervalMs = DEFAULT_LOOP_DEBUGGER_INTERVAL,
): (() => void) => {
  if (loopDebuggerTimer || typeof window === "undefined") {
    return stopLoopDebugger;
  }

  loopDebuggerTimer = setInterval(() => {
    if (document.hidden) {
      return;
    }
    try {
      Function("debugger")();
    } catch {
      // noop
    }
  }, Math.max(intervalMs, 300));

  return stopLoopDebugger;
};

export const stopRedirectDebugger = (): void => {
  redirectDebuggerCleanup?.();
  redirectDebuggerCleanup = null;
};

export const redirectDebugger = (): (() => void) => {
  if (redirectDebuggerCleanup || typeof window === "undefined") {
    return stopRedirectDebugger;
  }

  const keydownHandler = (event: KeyboardEvent) => {
    if (!isBlockedDebugShortcut(event)) {
      return;
    }
    event.preventDefault();
  };

  devtoolsListener = (isOpen: boolean) => {
    setDebugGuardState(isOpen);
  };

  addListener(devtoolsListener);
  launch();
  document.addEventListener("keydown", keydownHandler, true);

  redirectDebuggerCleanup = () => {
    if (devtoolsListener) {
      removeListener(devtoolsListener);
      devtoolsListener = null;
    }
    document.removeEventListener("keydown", keydownHandler, true);
    setDebugGuardState(false);
    delete document.documentElement.dataset[DEBUG_GUARD_DATASET_KEY];
    stop();
    redirectDebuggerCleanup = null;
  };

  return stopRedirectDebugger;
};

export const __resetDebugRuntimeForTests = (): void => {
  stopLoopDebugger();
  stopRedirectDebugger();
};
