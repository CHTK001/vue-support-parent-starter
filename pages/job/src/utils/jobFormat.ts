/**
 * 调度台账的纯展示函数：判形态、算标签、拼文案，全部无状态、不碰响应式。
 *
 * 列表列、任务表单、详情弹层、预览弹层都要用同一套口径
 * （什么叫「流程镜像行」、脚本/片段标签怎么写、调度表达式怎么展示），
 * 所以集中在这里，避免每个组件各写一份判据而漂移。
 */
import type { JobRuntime } from "../types/job";
import { COLLECT_FLOW_GROUP } from "../types/job";
import { GLUE_BEAN, GLUE_FRAGMENT_PREFIX } from "../constants/jobOptions";

/** 代码片段任务：执行类型非 BEAN，不依赖处理器注册表（脚本与片段都算） */
export function isScriptJob(job: JobRuntime): boolean {
  return Boolean(job.glueType) && job.glueType !== GLUE_BEAN;
}

/** 从 glueType 原值判形态：GLUE_ 前缀 = 片段，BEAN（含空）= 对象，其余 = 脚本 */
export function kindOfGlueType(glueType: string | null | undefined): "bean" | "script" | "fragment" {
  const value = String(glueType ?? "");
  if (!value || value === GLUE_BEAN) {
    return "bean";
  }
  return value.toUpperCase().startsWith(GLUE_FRAGMENT_PREFIX) ? "fragment" : "script";
}

/** 从 glueType 原值取引擎名：片段去掉 GLUE_ 前缀，脚本原样；对象返回空串 */
export function engineOfGlueType(glueType: string | null | undefined): string {
  const kind = kindOfGlueType(glueType);
  if (kind === "bean") {
    return "";
  }
  const value = String(glueType);
  return (kind === "fragment" ? value.slice(GLUE_FRAGMENT_PREFIX.length) : value).toLowerCase();
}

/** 引擎展示名：java / groovy 归一成首字母大写，其余引擎名原样，空串落到「脚本」 */
export function glueEngineLabel(engine: string): string {
  if (engine === "java") {
    return "Java";
  }
  if (engine === "groovy") {
    return "Groovy";
  }
  return engine || "脚本";
}

/** 台账行回到流程：优先用执行参数里的流程 ID，退回按 collect-flow-<id> 约定解析 */
export function flowIdOf(job: JobRuntime): number {
  const fromParam = Number(job.executeParam);
  if (Number.isFinite(fromParam) && fromParam > 0) {
    return fromParam;
  }
  const matched = /(\d+)$/.exec(job.jobKey ?? "");
  return matched ? Number(matched[1]) : 0;
}

/**
 * 台账行是否按「采集流程镜像」处理（启停/删除都回落到采集流程接口）。
 *
 * 不能只看分组：脚本与片段任务同样登记在 collect-flow 分组下，
 * 但它们的 jobKey 是 script-<脚本ID>，末尾那串是脚本的雪花 ID——
 * 既不是流程 ID，也远超 Integer 范围。若按流程行处理，flowIdOf 会用正则
 * 从 jobKey 末尾抓出该数字发给 /collect/flow/status，后端以 Integer 接收
 * 直接 400（且 JS Number 已把雪花末位舍掉），启用与删除整个不可用。
 *
 * 所以这里要求同时满足：属于该分组、不是脚本类任务、且真能解析出流程 ID。
 * 解析不出的行（如 collect.self.check 这类非流程的内置任务）走调度治理接口，
 * 与批量启停「缺流程 ID 的行跳过」的口径一致。
 *
 * @param job 台账行
 * @returns true 表示应走采集流程接口，false 表示走调度治理接口
 */
export function isFlowRow(job: JobRuntime): boolean {
  return job.group === COLLECT_FLOW_GROUP && !isScriptJob(job) && flowIdOf(job) > 0;
}

/** 列表标签用：片段 / 脚本 前缀 + 语言，例如「片段 · Java」「脚本 · Groovy」 */
export function glueKindLabel(job: JobRuntime): string {
  const kind = kindOfGlueType(job.glueType);
  const label = glueEngineLabel(engineOfGlueType(job.glueType));
  return kind === "fragment" ? `片段 · ${label}` : `脚本 · ${label}`;
}

/** 详情正文标签：片段写方法体、脚本写完整文件，按语言分别说明 */
export function detailSourceLabel(job: JobRuntime): string {
  const kind = kindOfGlueType(job.glueType);
  const isJava = engineOfGlueType(job.glueType) === "java";
  if (kind === "fragment") {
    return isJava ? "Java 片段（方法体）" : `${glueEngineLabel(engineOfGlueType(job.glueType))} 片段`;
  }
  return isJava ? "Java 脚本（完整类）" : `${glueEngineLabel(engineOfGlueType(job.glueType))} 脚本（完整文件）`;
}

/**
 * 告警类型展示名。
 *
 * @param alarmType 台账告警类型
 * @param target    告警目标
 * @returns 展示名（空类型但有目标时按邮件，与后端兼容口径一致）
 */
export function alarmTypeText(alarmType: unknown, target: unknown): string {
  const key = String(alarmType ?? "").toUpperCase();
  if (key === "WEBHOOK") {
    return "Webhook";
  }
  if (key === "EMAIL") {
    return "邮件";
  }
  return target ? "邮件" : "不告警";
}

/** 调度表达式展示名（列 + 详情共用） */
export function scheduleText(job: JobRuntime): string {
  if (job.scheduleType === "NONE" || !job.scheduleTime) {
    return "不自动调度";
  }
  if (job.scheduleType === "CRON") {
    return `CRON · ${job.scheduleTime}`;
  }
  return `${job.scheduleType} · ${job.scheduleTime}ms`;
}

/** 后续执行时间是否可看：仅 cron 任务 */
export function canPreviewFireTimes(job: JobRuntime): boolean {
  return String(job.scheduleType ?? "").toUpperCase() === "CRON" && Boolean(String(job.scheduleTime ?? "").trim());
}

/** 预览弹层里的时间展示格式 */
export function fmtFireTime(value: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return (
    `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ` +
    `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
  );
}