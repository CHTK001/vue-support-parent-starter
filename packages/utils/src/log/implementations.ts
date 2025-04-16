import { LogLevel, Logger, LoggerOptions, LogHandler } from './types';

/**
 * 默认日志选项
 */
const DEFAULT_OPTIONS: LoggerOptions = {
  logInProduction: false,
  showTimestamp: true,
  level: LogLevel.INFO,
  console: true
};

/**
 * 日志级别优先级映射
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4
};

/**
 * 获取当前时间戳
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 处理log4j风格的{}占位符
 * @param args 日志参数
 * @returns 处理后的参数
 */
function processPlaceholders(args: any[]): any[] {
  if (args.length <= 1) return args;
  
  const message = args[0];
  if (typeof message !== 'string') return args;
  
  const placeholders = message.match(/\{\}/g);
  if (!placeholders) return args;
  
  const values = args.slice(1, placeholders.length + 1);
  const remaining = args.slice(placeholders.length + 1);
  
  let formattedMessage = message;
  values.forEach(value => {
    formattedMessage = formattedMessage.replace('{}', String(value));
  });
  
  return [formattedMessage, ...remaining];
}

/**
 * 默认日志处理函数
 */
function defaultLogHandler(level: LogLevel, ...args: any[]): void {
  const method = level === LogLevel.FATAL ? 'error' : level;
  console[method](...args);
}

/**
 * 日志实现类
 */
export class LoggerImpl implements Logger {
  private options: LoggerOptions;
  
  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.options.level = level;
  }
  
  /**
   * 更新日志选项
   */
  setOptions(options: Partial<LoggerOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * 检查日志级别是否应该被记录
   */
  private shouldLog(level: LogLevel): boolean {
    // 在生产环境中，根据配置决定是否记录日志
    if (process.env.NODE_ENV === 'production' && !this.options.logInProduction) {
      return false;
    }
    
    // 检查日志级别优先级
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.options.level];
  }
  
  /**
   * 记录日志
   */
  private log(level: LogLevel, ...args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }
    
    // 处理占位符
    const processedArgs = processPlaceholders(args);
    const logArgs = [...processedArgs];
    
    // 添加时间戳
    if (this.options.showTimestamp) {
      logArgs.unshift(`[${getTimestamp()}]`);
    }
    
    // 添加日志级别标识
    logArgs.unshift(`[${level.toUpperCase()}]`);
    
    // 使用自定义处理器或默认处理器
    const handler: LogHandler = this.options.handler || defaultLogHandler;
    handler(level, ...logArgs);
  }
  
  /**
   * 调试日志
   */
  debug(...args: any[]): void {
    this.log(LogLevel.DEBUG, ...args);
  }
  
  /**
   * 信息日志
   */
  info(...args: any[]): void {
    this.log(LogLevel.INFO, ...args);
  }
  
  /**
   * 警告日志
   */
  warn(...args: any[]): void {
    this.log(LogLevel.WARN, ...args);
  }
  
  /**
   * 错误日志
   */
  error(...args: any[]): void {
    this.log(LogLevel.ERROR, ...args);
  }
  
  /**
   * 致命错误日志
   */
  fatal(...args: any[]): void {
    this.log(LogLevel.FATAL, ...args);
  }
} 