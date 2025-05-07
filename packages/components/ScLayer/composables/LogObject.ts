/**
 * 日志对象类
 * @description 统一处理ScLayer组件中的日志输出
 */

// 日志级别枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// 日志颜色配置
const LOG_COLORS = {
  DEBUG: '#888888', // 灰色
  INFO: '#0088ff',  // 蓝色
  WARN: '#ff8800',  // 橙色
  ERROR: '#ff0000', // 红色
  GROUP: '#888888'  // 灰色
};

// 日志配置接口
export interface LogConfig {
  level: LogLevel;
  prefix: string;
  enabled: boolean;
  showTime: boolean;
  showLevel: boolean;
  useColors: boolean;
}

/**
 * 日志对象类
 * 提供统一的日志处理功能，可控制日志级别和输出格式
 */
export class LogObject {
  private config: LogConfig;
  private static instance: LogObject;

  /**
   * 构造函数
   * @param config 日志配置
   */
  private constructor(config?: Partial<LogConfig>) {
    this.config = {
      level: LogLevel.INFO,
      prefix: 'ScLayer',
      enabled: true,
      showTime: true,
      showLevel: true,
      useColors: true,
      ...config
    };
  }

  /**
   * 获取日志实例（单例模式）
   * @param config 日志配置
   * @returns 日志对象实例
   */
  public static getInstance(config?: Partial<LogConfig>): LogObject {
    if (!LogObject.instance) {
      LogObject.instance = new LogObject(config);
    } else if (config) {
      // 更新配置
      LogObject.instance.updateConfig(config);
    }
    return LogObject.instance;
  }

  /**
   * 更新日志配置
   * @param config 日志配置
   */
  public updateConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   * @returns 日志配置
   */
  public getConfig(): LogConfig {
    return { ...this.config };
  }

  /**
   * 启用日志
   */
  public enable(): void {
    this.config.enabled = true;
  }

  /**
   * 禁用日志
   */
  public disable(): void {
    this.config.enabled = false;
  }

  /**
   * 设置日志级别
   * @param level 日志级别
   */
  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 启用颜色
   */
  public enableColors(): void {
    this.config.useColors = true;
  }

  /**
   * 禁用颜色
   */
  public disableColors(): void {
    this.config.useColors = false;
  }

  /**
   * 格式化日志消息，并添加颜色样式
   * @param level 日志级别
   * @param message 日志消息
   * @returns 格式化后的日志消息与样式
   */
  private formatMessage(level: string, message: string): { text: string; style?: string } {
    const parts: string[] = [];
    
    // 添加前缀
    parts.push(`[${this.config.prefix}]`);
    
    // 添加时间
    if (this.config.showTime) {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      parts.push(`[${time}]`);
    }
    
    // 添加级别
    if (this.config.showLevel) {
      parts.push(`[${level}]`);
    }
    
    // 组合消息
    const formattedText = `${parts.join(' ')} ${message}`;
    
    // 如果启用颜色，返回带样式的对象
    if (this.config.useColors) {
      const color = LOG_COLORS[level as keyof typeof LOG_COLORS] || '#000000';
      return {
        text: formattedText,
        style: `color: ${color}; font-weight: ${level === 'ERROR' ? 'bold' : 'normal'};`
      };
    }
    
    // 否则仅返回文本
    return { text: formattedText };
  }

  /**
   * 调试日志
   * @param message 日志消息
   * @param args 附加参数
   */
  public debug(message: string, ...args: any[]): void {
    if (!this.config.enabled || this.config.level > LogLevel.DEBUG) return;
    
    const { text, style } = this.formatMessage('DEBUG', message);
    if (style) {
      console.log(`%c${text}`, style, ...args);
    } else {
      console.log(text, ...args);
    }
  }

  /**
   * 信息日志
   * @param message 日志消息
   * @param args 附加参数
   */
  public info(message: string, ...args: any[]): void {
    if (!this.config.enabled || this.config.level > LogLevel.INFO) return;
    
    const { text, style } = this.formatMessage('INFO', message);
    if (style) {
      console.info(`%c${text}`, style, ...args);
    } else {
      console.info(text, ...args);
    }
  }

  /**
   * 警告日志
   * @param message 日志消息
   * @param args 附加参数
   */
  public warn(message: string, ...args: any[]): void {
    if (!this.config.enabled || this.config.level > LogLevel.WARN) return;
    
    const { text, style } = this.formatMessage('WARN', message);
    if (style) {
      console.warn(`%c${text}`, style, ...args);
    } else {
      console.warn(text, ...args);
    }
  }

  /**
   * 错误日志
   * @param message 日志消息
   * @param args 附加参数
   */
  public error(message: string, ...args: any[]): void {
    if (!this.config.enabled || this.config.level > LogLevel.ERROR) return;
    
    const { text, style } = this.formatMessage('ERROR', message);
    if (style) {
      console.error(`%c${text}`, style, ...args);
    } else {
      console.error(text, ...args);
    }
  }

  /**
   * 分组日志开始
   * @param label 分组标签
   */
  public group(label: string): void {
    if (!this.config.enabled) return;
    
    const { text, style } = this.formatMessage('GROUP', label);
    if (style) {
      console.group(`%c${text}`, style);
    } else {
      console.group(text);
    }
  }

  /**
   * 分组日志结束
   */
  public groupEnd(): void {
    if (!this.config.enabled) return;
    
    console.groupEnd();
  }

  /**
   * 计时开始
   * @param label 计时标签
   */
  public time(label: string): void {
    if (!this.config.enabled) return;
    
    console.time(label);
  }

  /**
   * 计时结束
   * @param label 计时标签
   */
  public timeEnd(label: string): void {
    if (!this.config.enabled) return;
    
    console.timeEnd(label);
  }

  /**
   * 清空控制台
   */
  public clear(): void {
    if (!this.config.enabled) return;
    
    console.clear();
  }
  
  /**
   * 启用调试模式
   * 将日志级别设置为DEBUG，并启用详细日志
   */
  public enableDebug(): void {
    this.config.level = LogLevel.DEBUG;
    this.config.enabled = true;
    this.info('已启用调试模式，将显示所有日志');
  }
  
  /**
   * 禁用调试模式
   * 将日志级别设置为INFO，保留基本日志输出
   */
  public disableDebug(): void {
    this.config.level = LogLevel.INFO;
    this.info('已禁用调试模式，仅显示INFO级别以上日志');
  }
  
  /**
   * 是否处于调试模式
   * @returns 是否处于调试模式
   */
  public isDebugEnabled(): boolean {
    return this.config.enabled && this.config.level <= LogLevel.DEBUG;
  }
}

// 导出默认实例
export default LogObject.getInstance();
