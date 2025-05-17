/**
 * 日志对象
 * @description 为地图组件提供统一的日志记录工具
 */

// 日志级别枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

class LogObject {
  private level: LogLevel = LogLevel.INFO; // 默认日志级别
  private prefix: string = '[ScMap]'; // 日志前缀

  /**
   * 设置日志级别
   * @param level 日志级别
   */
  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * 获取当前日志级别
   * @returns 日志级别
   */
  public getLevel(): LogLevel {
    return this.level;
  }

  /**
   * 设置日志前缀
   * @param prefix 日志前缀
   */
  public setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  /**
   * 记录调试级别日志
   * @param message 日志消息
   * @param params 其他参数
   */
  public debug(message: string, ...params: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`${this.prefix} [DEBUG] ${message}`, ...params);
    }
  }

  /**
   * 记录信息级别日志
   * @param message 日志消息
   * @param params 其他参数
   */
  public info(message: string, ...params: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`${this.prefix} [INFO] ${message}`, ...params);
    }
  }

  /**
   * 记录警告级别日志
   * @param message 日志消息
   * @param params 其他参数
   */
  public warn(message: string, ...params: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`${this.prefix} [WARN] ${message}`, ...params);
    }
  }

  /**
   * 记录错误级别日志
   * @param message 日志消息
   * @param params 其他参数
   */
  public error(message: string, ...params: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`${this.prefix} [ERROR] ${message}`, ...params);
    }
  }

  /**
   * 记录带时间戳的日志
   * @param level 日志级别
   * @param message 日志消息
   * @param params 其他参数
   */
  public log(level: LogLevel, message: string, ...params: any[]): void {
    if (level < this.level) return;

    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level] || 'UNKNOWN';
    
    console.log(`${this.prefix} [${timestamp}] [${levelStr}] ${message}`, ...params);
  }

  /**
   * 清除控制台日志
   */
  public clear(): void {
    console.clear();
  }

  /**
   * 记录性能计时器开始
   * @param label 计时器标签
   */
  public time(label: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.time(`${this.prefix} ${label}`);
    }
  }

  /**
   * 记录性能计时器结束并输出
   * @param label 计时器标签
   */
  public timeEnd(label: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.timeEnd(`${this.prefix} ${label}`);
    }
  }

  /**
   * 分组日志开始
   * @param label 分组标签
   */
  public group(label: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.group(`${this.prefix} ${label}`);
    }
  }

  /**
   * 分组日志结束
   */
  public groupEnd(): void {
    if (this.level <= LogLevel.DEBUG) {
      console.groupEnd();
    }
  }
}

// 创建单例实例
const logger = new LogObject();

// 导出日志对象和日志级别
export { LogLevel };
export default logger; 