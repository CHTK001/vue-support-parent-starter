import { LogLevel, Logger, LoggerOptions } from './types';
import { LoggerImpl } from './logger';

// 导出类型
export type { Logger, LoggerOptions };
export { LogLevel };

// 创建默认日志实例
const defaultLogger = new LoggerImpl();

// 导出日志实例方法
export const debug = (...args: any[]): void => defaultLogger.debug(...args);
export const info = (...args: any[]): void => defaultLogger.info(...args);
export const warn = (...args: any[]): void => defaultLogger.warn(...args);
export const error = (...args: any[]): void => defaultLogger.error(...args);
export const fatal = (...args: any[]): void => defaultLogger.fatal(...args);

// 配置方法
export const setLevel = (level: LogLevel): void => defaultLogger.setLevel(level);
export const setOptions = (options: Partial<LoggerOptions>): void => defaultLogger.setOptions(options);

// 导出日志实现类，允许创建自定义日志实例
export const createLogger = (options?: Partial<LoggerOptions>): Logger => new LoggerImpl(options);

// 导出默认日志实例
export default defaultLogger;

const LEVEL_COLORS = {
  [LogLevel.DEBUG]: '#8a8a8a',  // 灰色
  [LogLevel.INFO]: '#2196f3',   // 蓝色
  [LogLevel.WARN]: '#ff9800',   // 橙色
  [LogLevel.ERROR]: '#f44336',  // 红色
  [LogLevel.FATAL]: '#b71c1c',  // 深红色
}; 