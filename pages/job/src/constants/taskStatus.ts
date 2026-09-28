/**
 * 任务状态的展示映射。
 *
 * 键是后端常量（CollectTaskStatus / CollectTriggerType）的字面值，这里只做展示翻译，
 * 不参与业务判断；未知值原样回显，避免后端加枚举时页面显示空白。
 */

/** 状态 → 中文 */
export const STATUS_TEXT: Record<string, string> = {
  RUNNING: "执行中",
  SUCCESS: "成功",
  FAILURE: "失败",
  STOPPED: "已停止",
  SKIPPED: "未执行",
};

/** 状态 → ReTag 语义色 */
export const STATUS_TAG: Record<string, "primary" | "success" | "danger" | "info" | "warning"> = {
  RUNNING: "primary",
  SUCCESS: "success",
  FAILURE: "danger",
  STOPPED: "warning",
  SKIPPED: "info",
};

/** 触发方式 → 中文（采集任务用 CRON/MANUAL/TEST，作业日志带的是台账调度类型） */
export const TRIGGER_TEXT: Record<string, string> = {
  CRON: "定时",
  MANUAL: "手动",
  TEST: "试运行",
  FIXED: "固定频率",
  DELAY: "固定延迟",
  NONE: "不自动",
};

/**
 * 触发方式 → ReTag 语义色。
 *
 * 定时/固定频率/固定延迟是系统自己发起的（primary），手动与试运行是人点的（warning），
 * 不自动的没有 ReTag 语义，归 info。未知值同样落 info，与 statusTagType 的兜底一致。
 */
export const TRIGGER_TAG: Record<string, "primary" | "success" | "danger" | "info" | "warning"> = {
  CRON: "primary",
  FIXED: "primary",
  DELAY: "primary",
  MANUAL: "warning",
  TEST: "warning",
  NONE: "info",
};

/**
 * 状态中文名。
 *
 * @param status 后端状态字面值
 */
export function statusText(status: unknown): string {
  const key = String(status ?? "");
  return STATUS_TEXT[key] ?? key;
}

/**
 * 状态对应的 ReTag 类型。
 *
 * @param status 后端状态字面值
 */
export function statusTagType(status: unknown): "primary" | "success" | "danger" | "info" | "warning" {
  return STATUS_TAG[String(status ?? "")] ?? "info";
}

/**
 * 触发方式中文名。
 *
 * @param trigger 后端触发类型字面值
 */
export function triggerText(trigger: unknown): string {
  const key = String(trigger ?? "");
  return TRIGGER_TEXT[key] ?? key;
}

/**
 * 触发方式对应的 ReTag 类型。
 *
 * @param trigger 后端触发类型字面值
 */
export function triggerTagType(trigger: unknown): "primary" | "success" | "danger" | "info" | "warning" {
  return TRIGGER_TAG[String(trigger ?? "")] ?? "info";
}

/**
 * 耗时毫秒数归一，供 ReTime 的 duration 格式消费。
 *
 * 为什么不直接把后端字段丢给 ReTime：ReTime 的 duration 分支只认 number，
 * 传字符串会先走 toMs 的时间戳解析（"800" 会被当成秒级时间戳放大 1000 倍变成
 * 13 分钟），所以这里必须先转成 number。空值一律返回 undefined，
 * 让 ReTime 走自己的 placeholder，避免 Number(null) = 0 显示成 "0 毫秒"。
 *
 * 与 pages/collect 的同名函数保持一致：运行记录与作业日志是同一类「耗时」，
 * 两边各写一套格式化会让同一份数据在两个页面显示成不同文本。
 *
 * 实现已上提到 `@repo/utils`（{@code packages/utils/src/modules/costMs.ts}），
 * 与系统日志、发送日志共用一份；这里只做转出，保留本模块既有的导入路径不变。
 */
export { costMs } from "@repo/utils";
