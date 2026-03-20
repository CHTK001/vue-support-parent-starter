import { LogLevel, Logger, LoggerOptions } from "./types";

/**
 * 默认日志选项
 */
const DEFAULT_OPTIONS: LoggerOptions = {
  level: LogLevel.INFO,
  showTimestamp: true,
  logInProduction: process.env.NODE_ENV === "production",
  console: true,
};

/**
 * 日志级别颜色配置
 */
const LEVEL_COLORS = {
  [LogLevel.DEBUG]: "#8a8a8a",
  [LogLevel.INFO]: "#2196f3",
  [LogLevel.WARN]: "#ff9800",
  [LogLevel.ERROR]: "#f44336",
  [LogLevel.FATAL]: "#b71c1c",
};

/**
 * 日志级别标识
 */
const LEVEL_EMOJIS = {
  [LogLevel.DEBUG]: "🔍",
  [LogLevel.INFO]: "ℹ️",
  [LogLevel.WARN]: "⚠️",
  [LogLevel.ERROR]: "❌",
  [LogLevel.FATAL]: "☠️",
};

/**
 * 日志级别优先级
 */
const LEVEL_PRIORITY = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
};

/**
 * 格式化日期为 yyyy-MM-dd HH:mm:ss 格式
 * @param date 日期对象
 * @returns 格式化后的日期字符串
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 处理log4j风格的{}占位符
 * @param args 日志参数
 * @returns 处理后的参数
 */
function processPlaceholders(args: any[]): any[] {
  if (args.length <= 1) return args;

  const message = args[0];
  if (typeof message !== "string") return args;

  const placeholders = message.match(/\{\}/g);
  if (!placeholders) return args;

  const values = args.slice(1, placeholders.length + 1);
  const remaining = args.slice(placeholders.length + 1);

  let formattedMessage = message;
  values.forEach((value) => {
    formattedMessage = formattedMessage.replace("{}", String(value));
  });

  return [formattedMessage, ...remaining];
}

/**
 * 日志实现类
 */
export class LoggerImpl implements Logger {
  private options: LoggerOptions;

  /**
   * 创建日志实例
   * @param options 日志选项
   */
  constructor(options?: Partial<LoggerOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 设置日志级别
   * @param level 日志级别
   */
  setLevel(level: LogLevel): void {
    this.options.level = level;
  }

  /**
   * 更新日志选项
   * @param options 日志选项
   */
  setOptions(options: Partial<LoggerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 获取日志前缀
   * @param level 日志级别
   * @returns 格式化的前缀
   */
  private getPrefix(level: LogLevel): string {
    const parts: string[] = [];

    // 添加时间戳，使用自定义格式
    if (this.options.showTimestamp) {
      parts.push(`[${formatDate(new Date())}]`);
    }

    // 添加日志级别和表情
    parts.push(`${LEVEL_EMOJIS[level]} ${level.toUpperCase()}`);

    return parts.join(" ");
  }

  /**
   * 判断是否应该记录该级别的日志
   * @param level 日志级别
   * @returns 是否记录
   */
  private shouldLog(level: LogLevel): boolean {
    // 生产环境且禁用控制台日志时不记录
    if (
      process.env.NODE_ENV === "production" &&
      !this.options.logInProduction
    ) {
      return false;
    }

    // 根据日志级别优先级判断
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.options.level];
  }

  /**
   * 记录日志
   * @param level 日志级别
   * @param args 日志参数
   */
  private log(level: LogLevel, ...args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // 处理占位符
    const processedArgs = processPlaceholders(args);

    // 使用自定义处理函数
    if (this.options.handler) {
      this.options.handler(level, ...processedArgs);
      return;
    }

    // 在控制台显示
    if (this.options.console) {
      const prefix = this.getPrefix(level);
      const color = LEVEL_COLORS[level];
      // 添加字体样式，包括更大的字号
      const style = `color: ${color}; font-size: 14px; font-weight: 500;`;

      // 使用控制台特定方法
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`%c${prefix}`, style, ...processedArgs);
          break;
        case LogLevel.INFO:
          console.info(`%c${prefix}`, style, ...processedArgs);
          break;
        case LogLevel.WARN:
          console.warn(`%c${prefix}`, style, ...processedArgs);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(`%c${prefix}`, style, ...processedArgs);
          break;
      }
    }
  }

  /**
   * 调试日志
   * @param args 日志参数
   */
  debug(...args: any[]): void {
    this.log(LogLevel.DEBUG, ...args);
  }

  /**
   * 信息日志
   * @param args 日志参数
   */
  info(...args: any[]): void {
    this.log(LogLevel.INFO, ...args);
  }

  /**
   * 警告日志
   * @param args 日志参数
   */
  warn(...args: any[]): void {
    this.log(LogLevel.WARN, ...args);
  }

  /**
   * 错误日志
   * @param args 日志参数
   */
  error(...args: any[]): void {
    this.log(LogLevel.ERROR, ...args);
  }

  /**
   * 致命错误日志
   * @param args 日志参数
   */
  fatal(...args: any[]): void {
    this.log(LogLevel.FATAL, ...args);
  }
}
