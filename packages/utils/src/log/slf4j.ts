/**
 * SLF4J 风格的日志工具
 * @description 提供类似 Java SLF4J 的日志接口，支持按类名/模块创建 Logger 实例
 */
import { LogLevel } from "./types";
import { initStackTrace, formatErrorStack } from "./stack-trace";

// 初始化堆栈劫持（支持 Node.js 和浏览器环境）
initStackTrace({
  showFileName: true,
  showLineNumber: true,
  showColumnNumber: false,
  showFunctionName: true,
  filterInternal: true,
  maxDepth: 15,
  showNative: false,
});

/**
 * SLF4J 风格的 Logger 接口
 */
export interface Slf4jLogger {
  /**
   * 调试日志
   * @param message 日志消息，支持 {} 占位符
   * @param args 占位符参数
   */
  debug(message: string, ...args: any[]): void;

  /**
   * 信息日志
   * @param message 日志消息，支持 {} 占位符
   * @param args 占位符参数
   */
  info(message: string, ...args: any[]): void;

  /**
   * 警告日志
   * @param message 日志消息，支持 {} 占位符
   * @param args 占位符参数
   */
  warn(message: string, ...args: any[]): void;

  /**
   * 错误日志
   * @param message 日志消息，支持 {} 占位符
   * @param args 占位符参数
   */
  error(message: string, ...args: any[]): void;

  /**
   * 错误日志（带异常）
   * @param message 日志消息，支持 {} 占位符
   * @param error 异常对象
   * @param args 占位符参数
   */
  error(message: string, error: Error, ...args: any[]): void;

  /**
   * 致命错误日志
   * @param message 日志消息，支持 {} 占位符
   * @param args 占位符参数
   */
  fatal(message: string, ...args: any[]): void;

  /**
   * 致命错误日志（带异常）
   * @param message 日志消息，支持 {} 占位符
   * @param error 异常对象
   * @param args 占位符参数
   */
  fatal(message: string, error: Error, ...args: any[]): void;

  /**
   * 是否启用调试级别
   */
  isDebugEnabled(): boolean;

  /**
   * 是否启用信息级别
   */
  isInfoEnabled(): boolean;

  /**
   * 是否启用警告级别
   */
  isWarnEnabled(): boolean;

  /**
   * 是否启用错误级别
   */
  isErrorEnabled(): boolean;
}

/**
 * 日志配置选项
 */
export interface Slf4jLoggerOptions {
  /** 日志级别，默认 INFO */
  level?: LogLevel;
  /** 是否显示时间戳，默认 true */
  showTimestamp?: boolean;
  /** 是否在生产环境记录日志，默认 false */
  logInProduction?: boolean;
  /** 是否在控制台输出，默认 true */
  console?: boolean;
}

/**
 * 默认日志配置
 */
const DEFAULT_OPTIONS: Required<Slf4jLoggerOptions> = {
  level: LogLevel.INFO,
  showTimestamp: true,
  logInProduction: false,
  console: true,
};

/**
 * 日志级别优先级
 */
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
};

/**
 * 日志级别颜色
 */
const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "#8a8a8a",
  [LogLevel.INFO]: "#2196f3",
  [LogLevel.WARN]: "#ff9800",
  [LogLevel.ERROR]: "#f44336",
  [LogLevel.FATAL]: "#b71c1c",
};

/**
 * 格式化日期为 yyyy-MM-dd HH:mm:ss.SSS 格式
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function safeStringify(value: any): string {
  try {
    const seen = new WeakSet();
    return JSON.stringify(value, (_key, val) => {
      if (val instanceof Error) {
        return {
          name: val.name,
          message: val.message,
          stack: val.stack,
        };
      }
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) {
          return "[Circular]";
        }
        seen.add(val);
      }
      return val;
    });
  } catch {
    try {
      return String(value);
    } catch {
      return "[Unserializable]";
    }
  }
}

/**
 * 处理占位符，将 {} 替换为实际值
 */
function formatMessage(message: string, args: any[]): string {
  if (!args || args.length === 0) {
    return message;
  }

  let formatted = message;
  let argIndex = 0;

  // 替换 {} 占位符
  formatted = formatted.replace(/\{\}/g, () => {
    if (argIndex < args.length) {
      const arg = args[argIndex++];
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}`;
      }
      if (typeof arg === "object") {
        try {
          return safeStringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }
    return "{}";
  });

  return formatted;
}

/**
 * 获取错误堆栈信息
 * @description 使用统一的堆栈格式化函数，支持 Node.js 和浏览器环境
 */
function getErrorStack(error: Error): string {
  return formatErrorStack(error);
}

/**
 * SLF4J Logger 实现类
 */
class Slf4jLoggerImpl implements Slf4jLogger {
  private readonly name: string;
  private readonly options: Required<Slf4jLoggerOptions>;

  constructor(name: string, options?: Slf4jLoggerOptions) {
    this.name = name;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 判断是否应该记录该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    if (
      process.env.NODE_ENV === "production" &&
      !this.options.logInProduction
    ) {
      return false;
    }
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.options.level];
  }

  /**
   * 获取日志前缀
   */
  private getPrefix(level: LogLevel): string {
    const parts: string[] = [];

    if (this.options.showTimestamp) {
      parts.push(formatDate(new Date()));
    }

    parts.push(level.toUpperCase().padEnd(5));
    parts.push(`[${this.name}]`);

    return parts.join(" ");
  }

  /**
   * 记录日志
   */
  private log(
    level: LogLevel,
    message: string,
    error?: Error,
    ...args: any[]
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = formatMessage(message, args);
    const prefix = this.getPrefix(level);
    const color = LEVEL_COLORS[level];

    if (this.options.console) {
      const style = `color: ${color}; font-weight: 500;`;

      // 如果有 name（分组），使用 console.group
      const hasGroup = this.name && this.name.trim() !== "";

      if (hasGroup) {
        console.groupCollapsed(`%c${prefix}`, style, formattedMessage);
      }

      switch (level) {
        case LogLevel.DEBUG:
          if (hasGroup) {
            console.debug(formattedMessage, ...(error ? [error] : []));
          } else {
            console.debug(
              `%c${prefix}`,
              style,
              formattedMessage,
              ...(error ? [error] : []),
            );
          }
          break;
        case LogLevel.INFO:
          if (hasGroup) {
            console.info(formattedMessage, ...(error ? [error] : []));
          } else {
            console.info(
              `%c${prefix}`,
              style,
              formattedMessage,
              ...(error ? [error] : []),
            );
          }
          break;
        case LogLevel.WARN:
          if (hasGroup) {
            console.warn(formattedMessage, ...(error ? [error] : []));
          } else {
            console.warn(
              `%c${prefix}`,
              style,
              formattedMessage,
              ...(error ? [error] : []),
            );
          }
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          if (error) {
            if (hasGroup) {
              console.error(formattedMessage);
              console.error(getErrorStack(error));
            } else {
              console.error(`%c${prefix}`, style, formattedMessage);
              console.error(`%c${prefix}`, style, getErrorStack(error));
            }
          } else {
            if (hasGroup) {
              console.error(formattedMessage);
            } else {
              console.error(`%c${prefix}`, style, formattedMessage);
            }
          }
          break;
      }

      if (hasGroup) {
        console.groupEnd();
      }
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, undefined, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, undefined, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, undefined, ...args);
  }

  error(message: string, ...args: any[]): void;
  error(message: string, error: Error, ...args: any[]): void;
  error(message: string, errorOrArg?: Error | any, ...args: any[]): void {
    if (errorOrArg instanceof Error) {
      this.log(LogLevel.ERROR, message, errorOrArg, ...args);
    } else {
      this.log(LogLevel.ERROR, message, undefined, errorOrArg, ...args);
    }
  }

  fatal(message: string, ...args: any[]): void;
  fatal(message: string, error: Error, ...args: any[]): void;
  fatal(message: string, errorOrArg?: Error | any, ...args: any[]): void {
    if (errorOrArg instanceof Error) {
      this.log(LogLevel.FATAL, message, errorOrArg, ...args);
    } else {
      this.log(LogLevel.FATAL, message, undefined, errorOrArg, ...args);
    }
  }

  isDebugEnabled(): boolean {
    return this.shouldLog(LogLevel.DEBUG);
  }

  isInfoEnabled(): boolean {
    return this.shouldLog(LogLevel.INFO);
  }

  isWarnEnabled(): boolean {
    return this.shouldLog(LogLevel.WARN);
  }

  isErrorEnabled(): boolean {
    return this.shouldLog(LogLevel.ERROR);
  }
}

/**
 * Logger 缓存
 */
const loggerCache = new Map<string, Slf4jLogger>();

/**
 * 全局日志配置
 */
let globalOptions: Slf4jLoggerOptions = {};

/**
 * SLF4J 风格的 LoggerFactory
 */
export class LoggerFactory {
  /**
   * 设置全局日志配置
   * @param options 日志配置选项
   */
  static setGlobalOptions(options: Slf4jLoggerOptions): void {
    globalOptions = { ...globalOptions, ...options };
    // 清除缓存，使新配置生效
    loggerCache.clear();
  }

  /**
   * 获取 Logger 实例
   * @param name 类名或模块名，格式如 "com.example.Service" 或 "[模块][功能]"
   * @returns Logger 实例
   */
  static getLogger(name: string | (new () => any)): Slf4jLogger {
    let loggerName: string;

    if (typeof name === "string") {
      loggerName = name;
    } else {
      // 从构造函数获取类名
      loggerName = name.name || "Unknown";
    }

    // 从缓存获取
    let logger = loggerCache.get(loggerName);
    if (!logger) {
      logger = new Slf4jLoggerImpl(loggerName, globalOptions);
      loggerCache.set(loggerName, logger);
    }

    return logger;
  }

  /**
   * 清除 Logger 缓存
   */
  static clearCache(): void {
    loggerCache.clear();
  }
}

/**
 * 便捷方法：获取 Logger 实例
 * @param name 类名或模块名
 * @returns Logger 实例
 */
export function getLogger(name: string | (new () => any)): Slf4jLogger {
  return LoggerFactory.getLogger(name);
}
