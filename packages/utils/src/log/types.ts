/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * 日志处理函数类型
 */
export type LogHandler = (level: LogLevel, ...args: any[]) => void;

/**
 * 日志配置选项接口
 */
export interface LoggerOptions {
  /** 是否在生产环境中记录日志 */
  logInProduction: boolean;
  /** 是否显示时间戳 */
  showTimestamp: boolean;
  /** 当前日志级别 */
  level: LogLevel;
  /** 是否在控制台输出日志 */
  console: boolean;
  /** 自定义日志处理器 */
  handler?: LogHandler;
}

/**
 * 日志接口
 */
export interface Logger {
  /**
   * 设置日志级别
   * @param level 日志级别
   */
  setLevel(level: LogLevel): void;
  
  /**
   * 设置日志选项
   * @param options 日志选项
   */
  setOptions(options: Partial<LoggerOptions>): void;
  
  /**
   * 调试日志
   * @param args 日志参数
   */
  debug(...args: any[]): void;
  
  /**
   * 信息日志
   * @param args 日志参数
   */
  info(...args: any[]): void;
  
  /**
   * 警告日志
   * @param args 日志参数
   */
  warn(...args: any[]): void;
  
  /**
   * 错误日志
   * @param args 日志参数
   */
  error(...args: any[]): void;
  
  /**
   * 致命错误日志
   * @param args 日志参数
   */
  fatal(...args: any[]): void;
} 
