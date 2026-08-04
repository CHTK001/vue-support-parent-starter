/**
 * Cron 触发器
 *
 * 基于 Cron 表达式的触发器实现，支持标准 6 字段 Cron 表达式的解析和匹配。
 * 适用于需要按照固定时间点执行任务的场景，如"每天中午 12 点"、"每周一上午 9 点"等。
 * 用法：
 *   const trigger = new CronTrigger("0 0 12 * * ?");
 *   const next = trigger.nextExecutionTime();        // 下一次执行时间
 *   const times = trigger.getFireTimes(5);           // 后续 5 条执行时间
 */
import { CronExpression } from "./CronExpression";
import type { Trigger } from "./types";

/**
 * Cron 触发器
 *
 * @param cron 标准 6 字段 Cron 表达式（秒 分 时 日 月 周）
 * @param baseTime 基准时间（默认当前时间，仅供扩展使用）
 */
export class CronTrigger implements Trigger {
  /** Cron 表达式原始字符串 */
  private readonly cron: string;
  /** Cron 表达式解析引擎 */
  private readonly cronExpression: CronExpression;
  /** 基准时间 */
  private readonly baseTime: Date;

  constructor(cron: string, baseTime: Date = new Date()) {
    this.cron = cron;
    this.cronExpression = new CronExpression(cron);
    this.baseTime = baseTime;
  }

  /** 计算下一次执行时间（缺省以当前时间为基准） */
  nextExecutionTime(from?: Date): Date | null {
    return this.cronExpression.nextExecutionTime(from ?? new Date());
  }

  /** 获取从指定时间开始的 N 条执行时间（缺省以当前时间为基准） */
  getFireTimes(count: number, from?: Date): Date[] {
    return this.cronExpression.getFireTimes(count, from ?? new Date());
  }

  /** 获取 Cron 表达式原始字符串 */
  getCron(): string {
    return this.cron;
  }
}
