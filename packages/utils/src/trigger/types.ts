/**
 * 触发器统一类型定义（@repo/utils/trigger）
 *
 * 提供任务触发时间点计算规范，支持两种触发模式：
 * Cron 表达式触发与固定时间间隔触发。
 */

/** 触发器接口：计算未来处理时间点 */
export interface Trigger {
  /**
   * 计算下一次执行时间点
   *
   * 基于当前时间计算任务的下一次触发时间。
   *
   * @returns 下一次执行时间点，如果无法计算则返回 null
   */
  nextExecutionTime(): Date | null;

  /**
   * 从指定时间开始计算下一次执行时间点
   *
   * 以给定的时间点为基准，计算在此之后的下一次触发时间。
   *
   * @param from 基准时间点
   * @returns 下一次执行时间点，如果无法计算则返回 null
   */
  nextExecutionTime(from: Date): Date | null;

  /**
   * 获取后续 N 条执行时间点
   *
   * 基于当前时间，批量计算接下来的 N 次触发时间。
   *
   * @param count 需要获取的执行时间点数量
   * @returns 按时间排序的执行时间点列表
   */
  getFireTimes(count: number): Date[];

  /**
   * 从指定时间开始获取 N 条执行时间点
   *
   * @param count 需要获取的执行时间点数量
   * @param from  基准时间点
   * @returns 按时间排序的执行时间点列表
   */
  getFireTimes(count: number, from: Date): Date[];
}

/** 固定时间间隔触发配置 */
export interface FixedTriggerOptions {
  /** 首次执行前的初始延迟时间（毫秒），默认 0 */
  initialDelay?: number;
  /** 两次任务触发之间的时间间隔（毫秒） */
  interval: number;
  /** 触发器创建的基准时间（默认当前时间） */
  startTime?: Date;
}

/** Cron 表达式触发配置 */
export interface CronTriggerOptions {
  /** 标准 6 字段 Cron 表达式（秒 分 时 日 月 周） */
  cron: string;
  /** 基准时间（默认当前时间） */
  baseTime?: Date;
}
