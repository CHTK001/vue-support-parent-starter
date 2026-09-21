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

/** 触发方式 → 中文 */
export const TRIGGER_TEXT: Record<string, string> = {
  CRON: "定时",
  MANUAL: "手动",
  TEST: "试运行",
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
 * 耗时格式化：<1s 用毫秒，否则保留一位小数的秒。
 *
 * @param ms 后端返回的毫秒数
 */
export function costText(ms: unknown): string {
  if (ms == null || ms === "") {
    return "—";
  }
  const value = Number(ms);
  return value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(1)}s`;
}
