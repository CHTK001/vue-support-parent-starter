/**
 * 日志工具 —— 事件驱动、分级、彩色输出
 *
 * 所有日志通过事件派发，默认注册一个 console 监听器输出（带颜色）。
 * 可通过 `on()` 订阅额外监听器（文件 / 远程 / UI），或用官方方式接管输出。
 * 日志级别从 app.yaml other.logLevel 读取（trace / debug / info / warn / error）。
 *
 * 用法：
 *   import { log } from "@repo/utils";
 *   log.info("createApp", "开始加载");
 *   log.debug("createApp", "配置已读取");
 *   log.error("createApp", "加载失败", err);
 */

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  timestamp: number;
}

type LogListener = (entry: LogEntry) => void;

const LEVEL_STYLES: Record<LogLevel, string> = {
  trace: "color:#94a3b8;font-weight:400",
  debug: "color:#6366f1;font-weight:600",
  info: "color:#22c55e;font-weight:600",
  warn: "color:#f59e0b;font-weight:600;background:#fffbeb",
  error: "color:#ef4444;font-weight:700;background:#fef2f2",
};

const LEVEL_LABELS: Record<LogLevel, string> = {
  trace: "TRACE",
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

const LEVEL_RANK: Record<LogLevel, number> = {
  trace: 0, debug: 1, info: 2, warn: 3, error: 4,
};

const listeners: LogListener[] = [];

let configuredLevel: LogLevel = "info";

function readLevelFromStorage(): void {
  try {
    const cfg = localStorage.getItem("app-config");
    if (cfg) {
      const lvl = JSON.parse(cfg)?.other?.logLevel;
      if (lvl && lvl in LEVEL_RANK) configuredLevel = lvl;
    }
  } catch { /* use default */ }
}
readLevelFromStorage();

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[configuredLevel];
}

function emit(entry: LogEntry) {
  for (const fn of listeners) {
    try { fn(entry); } catch { /* ignore */ }
  }
}

function writeLog(level: LogLevel, module: string, message: string, data?: unknown) {
  if (!shouldLog(level)) return;
  emit({ level, module, message, data, timestamp: Date.now() });
}

/** 默认 console 监听器：带颜色、时间戳输出 */
function consoleListener(entry: LogEntry) {
  const { level, module, message, data, timestamp } = entry;
  const style = LEVEL_STYLES[level];
  const label = LEVEL_LABELS[level];
  const ts = new Date(timestamp).toLocaleTimeString("zh-CN", { hour12: false });
  if (data !== undefined) {
    console.log(`%c[${ts}][${label}][${module}] ${message}`, style, data);
  } else {
    console.log(`%c[${ts}][${label}][${module}] ${message}`, style);
  }
}

// 默认注册 console 监听器
listeners.push(consoleListener);

export const log = {
  trace(module: string, message: string, data?: unknown) { writeLog("trace", module, message, data); },
  debug(module: string, message: string, data?: unknown) { writeLog("debug", module, message, data); },
  info(module: string, message: string, data?: unknown) { writeLog("info", module, message, data); },
  warn(module: string, message: string, data?: unknown) { writeLog("warn", module, message, data); },
  error(module: string, message: string, data?: unknown) { writeLog("error", module, message, data); },
  /** 订阅日志事件 */
  on(fn: LogListener) { listeners.push(fn); },
  /** 取消订阅 */
  off(fn: LogListener) { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); },
  /** 移除默认 console 监听器，完全接管输出 */
  removeConsole() { const i = listeners.indexOf(consoleListener); if (i >= 0) listeners.splice(i, 1); },
  /** 动态更新日志级别 */
  setLevel(level: LogLevel) { configuredLevel = level; },
};

export default log;