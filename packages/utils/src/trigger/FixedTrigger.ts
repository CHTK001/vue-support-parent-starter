/**
 * 固定时间间隔触发器
 *
 * 基于固定时间间隔的触发器实现，支持首次初始延迟。触发时间点的计算基于
 * 创建时刻的基准时间，通过 `startTime + initialDelay + N * interval` 计算。
 *
 * 用法：
 *   // 每 5 秒执行一次（无初始延迟）
 *   const trigger = new FixedTrigger({ interval: 5000 });
 *
 *   // 首次延迟 1 秒后，每 3 秒执行一次
 *   const trigger = new FixedTrigger({ initialDelay: 1000, interval: 3000 });
 */
import type { FixedTriggerOptions, Trigger } from "./types";

/**
 * 固定时间间隔触发器
 *
 * @param options 触发配置
 */
export class FixedTrigger implements Trigger {
  /** 首次执行前的初始延迟时间（毫秒） */
  private readonly initialDelay: number;
  /** 两次任务触发之间的时间间隔（毫秒） */
  private readonly interval: number;
  /** 触发器创建的基准时间 */
  private readonly startTime: Date;

  constructor(options: FixedTriggerOptions) {
    this.initialDelay = options.initialDelay ?? 0;
    this.interval = options.interval;
    if (!Number.isFinite(this.interval) || this.interval <= 0) {
      throw new Error("interval must be a positive number");
    }
    this.startTime = options.startTime ?? new Date();
  }

  /** 计算下一次执行时间（缺省以当前时间为基准） */
  nextExecutionTime(from?: Date): Date | null {
    return this.nextExecutionTimeFrom(from ?? new Date());
  }

  /**
   * 计算从指定时间开始的下一次执行时间
   *
   * 计算公式：`startTime + initialDelay + (floor((from - startTime - initialDelay) / interval) + 1) * interval`
   *
   * @param from 基准时间点
   * @returns 下一次执行时间点
   */
  private nextExecutionTimeFrom(from: Date): Date | null {
    const base = this.startTime.getTime() + this.initialDelay;
    if (from.getTime() < base) {
      return new Date(base);
    }
    const elapsed = from.getTime() - base;
    const periods = Math.floor(elapsed / this.interval);
    return new Date(base + (periods + 1) * this.interval);
  }

  /** 获取从指定时间开始的 N 条执行时间（缺省以当前时间为基准） */
  getFireTimes(count: number, from?: Date): Date[] {
    const result: Date[] = [];
    let current = from ?? new Date();
    for (let i = 0; i < count; i++) {
      const next = this.nextExecutionTime(current);
      if (next === null) {
        break;
      }
      result.push(next);
      current = new Date(next.getTime() + 1);
    }
    return result;
  }

  /** 获取初始延迟时间（毫秒） */
  getInitialDelay(): number {
    return this.initialDelay;
  }

  /** 获取固定时间间隔（毫秒） */
  getInterval(): number {
    return this.interval;
  }

  /** 获取基准时间 */
  getStartTime(): Date {
    return this.startTime;
  }
}
