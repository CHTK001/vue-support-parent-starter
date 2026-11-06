/**
 * 调度台账的静态选项与常量，供列表列配置、搜索区、任务表单共用。
 *
 * 抽到独立文件有两个原因：
 *  1) 组件化后，列表（JobView）与弹层（任务表单 / 详情 / 预览）都要用同一份选项，
 *     留在视图里没法被别的组件 import；
 *  2) 这些是「领域常量 + 展示文案」，与视图状态无关，放在常量文件里语义更准。
 */
import type { ReOption } from "@repo/ui/re-select";

/** 状态下拉：空串是「全部状态」这一档，过筛时归一为不带该条件 */
export const STATUS_OPTIONS: ReOption[] = [
  { label: "全部状态", value: "" },
  { label: "启用中", value: 1 },
  { label: "已停用", value: 0 },
];

/** 分发筛选下拉：首项即「全部分发」，与「状态」筛选取同一种 select 形态 */
export const DISPATCH_OPTIONS: ReOption[] = [
  { label: "全部分发", value: "", icon: "Grid" },
  { label: "本地执行", value: "LOCAL", icon: "Monitor" },
  { label: "远程分发", value: "REMOTE", icon: "Connection" },
];

/** 调度类型取值与后端 JobSpec 常量一致 */
export const SCHEDULE_OPTIONS: ReOption[] = [
  { label: "CRON 表达式", value: "CRON" },
  { label: "固定频率（毫秒）", value: "FIXED" },
  { label: "固定延迟（毫秒）", value: "DELAY" },
  { label: "不自动调度", value: "NONE" },
];

/**
 * 表单校验提示的展示时长（毫秒）。
 *
 * 比 msgError 默认的 2 秒更长：这些提示都要求用户回到表单改字段，
 * 2 秒内常常还没看清就消失了（自动化验收里直接读不到）。
 */
export const FORM_MSG_DURATION = 4000;

/** 调度类型 → 简称：校验提示里用它对齐下拉选项，避免用户找不到说的是哪一项 */
export const SCHEDULE_NAME: Record<string, string> = {
  CRON: "CRON 表达式",
  FIXED: "固定频率",
  DELAY: "固定延迟",
  NONE: "不自动调度",
};

/** 调度类型 → 该填的调度配置举例，直接告诉用户填什么格式 */
export const SCHEDULE_TIME_HINT: Record<string, string> = {
  CRON: "cron 表达式（6 段，例如 0 0/30 * * * ?）",
  FIXED: "固定频率毫秒数（例如 60000 表示每分钟一次）",
  DELAY: "固定延迟毫秒数（例如 60000 表示上次结束后隔一分钟）",
};

/** 错过策略下拉：错过触发时刻时是补跑一次还是直接跳过 */
export const MISFIRE_OPTIONS: ReOption[] = [
  { label: "错过不补跑", value: "DO_NOTHING" },
  { label: "错过补跑一次", value: "FIRE_ONCE_NOW" },
];

/** 失败告警类型：空串表示不告警，值域与后端 JobAlarmMessage 常量一致 */
export const ALARM_TYPE_OPTIONS: ReOption[] = [
  { label: "不告警", value: "" },
  { label: "邮件", value: "EMAIL" },
  { label: "Webhook", value: "WEBHOOK" },
];

/**
 * 执行类型（顶部三张卡片，与后端 GlueTypes 收敛后的三类语义一致）：
 *  - 对象（BEAN）：从已注册执行器对象（@Job 处理器）里选一个执行，任务键即处理器名，正文为空；
 *  - 脚本（裸引擎名，如 java / groovy）：写**完整文件**（完整 Java 类 / 完整 Groovy 脚本），
 *    保存时由对应引擎预编译校验，执行时复用同一份编译产物；
 *  - 片段（GLUE_ + 引擎名大写，如 GLUE_JAVA / GLUE_GROOVY）：只写 @Job 方法的**方法体**，
 *    由后端 GlueScriptSynthesizer 合成完整脚本后再交同一引擎。
 *
 * 判据只有一条：值以 GLUE_ 开头就是片段（需要后端合成），否则是脚本；BEAN 是对象。
 * 语言不写死在前端，由 SPI 运行时枚举（GET /glue/engines）驱动，装了新引擎自动进下拉。
 */
export const GLUE_BEAN = "BEAN";
/** 片段类型前缀：带此前缀表示只写方法体，需要后端合成完整脚本 */
export const GLUE_FRAGMENT_PREFIX = "GLUE_";
/** 用户首次点脚本 / 片段时的默认语言；选过之后由 lastGlueEngine 记住 */
export const DEFAULT_GLUE_ENGINE = "groovy";
/** 引擎枚举拉取失败时的兜底清单，保证下拉始终可用 */
export const FALLBACK_GLUE_ENGINES = ["groovy", "java", "python"];
/** 已注册引擎名 -> 下拉展示名；未收录的引擎原样显示 */
export const GLUE_ENGINE_LABELS: Record<string, string> = { java: "Java", groovy: "Groovy", python: "Python" };