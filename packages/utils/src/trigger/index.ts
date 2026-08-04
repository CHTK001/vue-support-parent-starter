/**
 * 触发器模块（@repo/utils/trigger）
 *
 * 提供统一的任务触发时间点计算能力，支持 Cron 表达式触发与固定时间间隔触发。
 *
 * 用法：
 *   // Cron 触发器：每天中午 12 点执行
 *   const trigger = new CronTrigger("0 0 12 * * ?");
 *   const next = trigger.nextExecutionTime();
 *
 *   // 固定间隔触发器：每 5 秒执行一次
 *   const fixed = new FixedTrigger({ interval: 5000 });
 *   const times = fixed.getFireTimes(10);
 */
export { CronExpression } from "./CronExpression";
export { CronTrigger } from "./CronTrigger";
export { FixedTrigger } from "./FixedTrigger";
export type { FixedTriggerOptions, CronTriggerOptions, Trigger } from "./types";
