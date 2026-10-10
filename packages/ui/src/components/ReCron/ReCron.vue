<script setup lang="ts">
/**
 * ReCron —— Cron 表达式选择组件（可视化 + 表达式 + 触发时间预览）
 *
 * 三方同步：面板状态 ⇄ 表达式字符串 ⇄ v-model，任一侧改动都会即时刷新另外两侧与预览。
 * 面板无法表达表达式时自动退回「表达式模式」并给出提示，绝不静默改写用户的输入。
 *
 * 两种显示模式（mode）：
 * - edit（默认）：输入框 + 可视化面板 + 状态行，表单里编辑用；
 * - text：只渲染「表达式 + 人话」两行的只读预览，供表格等展示场景复用
 *   同一套解析与人话口径（表格里写死一份描述文案必然与校验引擎漂移）。
 *
 * 方言与后端严格一致（com.chua.common.support.task.scheduler.CronExpression）：
 *   固定 6 字段「秒 分 时 日 月 周」，5 字段会被服务端直接拒绝；
 *   周字段用 0-6（0=周日，7 亦按周日解析），`?` 解析等价于 `*`；
 *   预览时间由 @repo/utils 的同源镜像 CronExpression 计算，与服务端逐字对齐。
 */
import { computed, nextTick, reactive, ref, watch } from "vue";
import { ElPopover } from "element-plus";
import { CronExpression } from "@repo/utils";
import { msgError } from "@repo/core";
import ReButton from "../ReButton";
import ReInput from "../ReInput";
import ReInputNumber from "../ReInputNumber";
import ReSelect from "../ReSelect";
import ReCronCalendarPanel from "./ReCronCalendarPanel.vue";
import type { ReOption } from "../ReSelect/types";

defineOptions({ name: "ReCron", inheritAttrs: true });

type FieldMode = "all" | "step" | "range" | "points" | "last" | "lastNth" | "nearest" | "nth";

/** 单字段的面板状态 */
interface FieldState {
  mode: FieldMode;
  /** step 起点 / range 起点 / nth 的星期 */
  start: number;
  /** range 终点 */
  end: number;
  /** step 步长 */
  step: number;
  /** points 选中的值 */
  points: number[];
  /** nth：第几个（1-5） */
  nth: number;
}

const model = defineModel<string>({ default: "" });

const props = withDefaults(
  defineProps<{
    /** 输入框占位符 */
    placeholder?: string;
    /** 禁用 */
    disabled?: boolean;
    /** 触发栏宽度 */
    width?: string | number;
    /** 预览条数（1-20） */
    previewCount?: number;
    /** 业务侧默认 cron：留空时提示「按默认登记」，并提供一键回填 */
    defaultCron?: string;
    /**
     * 显示模式：
     * - "edit"（默认）：输入 + 可视化面板 + 状态行，表单里编辑用；
     * - "text"：只渲染「表达式 + 人话」两行，供表格等只读预览场景复用同一套解析口径。
     */
    mode?: "edit" | "text";
  }>(),
  {
    placeholder: "0 0/30 * * * ?",
    disabled: false,
    width: undefined,
    previewCount: 5,
    defaultCron: "",
    mode: "edit",
  },
);

const emit = defineEmits<{
  (e: "change", expression: string, valid: boolean): void;
}>();

const SECOND = { key: "sec", label: "秒", min: 0, max: 59 } as const;
const MINUTE = { key: "min", label: "分", min: 0, max: 59 } as const;
const HOUR = { key: "hour", label: "时", min: 0, max: 23 } as const;
const DAY = { key: "day", label: "日", min: 1, max: 31 } as const;
const MONTH = { key: "month", label: "月", min: 1, max: 12 } as const;
const WEEK = { key: "week", label: "周", min: 0, max: 6 } as const;

/** 周字段数值语义与服务端一致（0=周日…6=周六）；与日历面板共用同一份 */
import { WEEK_NAMES } from "./weekNames";

/**
 * 引擎接受的英文名称（与 @repo/utils 的 CronExpression 同名表逐项一致）。
 *
 * <p>不认名称是本组件此前最实际的功能缺口：设计稿与无数现成表达式都写成
 * {@code 0 30 9 ? * MON-FRI}，而面板只认数字，于是整条表达式掉进"不同步"，
 * 连"什么时候跑"的摘要都一起消失。</p>
 */
const MONTH_NAME_TO_NUM: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};
const WEEKDAY_NAME_TO_NUM: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6,
};

/**
 * 把 token 里的英文名称换成数字。
 *
 * <p>只在月/周两个字段生效（引擎也只在这两处 resolve 名称）。
 * 名称一律是三个字母且互不为前缀，所以逐个替换不会相互污染。</p>
 *
 * @param key 字段 key
 * @param token 原始 token
 * @returns 归一化后的 token 与"是否真的用到过名称"
 */
function normalizeTokenNames(key: string, token: string): { text: string; used: boolean } {
  const table = key === "month" ? MONTH_NAME_TO_NUM : key === "week" ? WEEKDAY_NAME_TO_NUM : null;
  if (!table) return { text: token, used: false };
  let text = token.toUpperCase();
  let used = false;
  for (const [name, num] of Object.entries(table)) {
    if (text.includes(name)) {
      text = text.split(name).join(String(num));
      used = true;
    }
  }
  return { text, used };
}

/**
 * 面板表达不了的字段：key → 原始 token。
 *
 * <p>为什么必须单独记：{@link parseToken} 一进来就 {@code Object.assign(f, blank(), …)}
 * 把该字段重置成"每一个值"，失败后并不会还原。于是 {@link tokenOf} 读到的是
 * {@code all}，{@code MON-FRI} 被显示成 {@code *}（"每天"）—— 看起来完全合法，
 * 比直接显示 NaN 更危险。这里改为回显原样 token，让面板说真话。</p>
 */
const rawTokens = reactive<Record<string, string>>({});

/**
 * 面板**解析成功**（不一定接管）的字段。
 *
 * <p>与 rawTokens 的区别是这里要回答"面板看不看得懂这个字段"：
 * 看不懂就不能描述它，看得懂但写回去会变意思（名称、周写 7）则照样能描述。</p>
 */
const panelParsed = reactive<Record<string, true>>({});

/** 表达式里用过英文名称（面板按数字解析显示，但不改写用户的表达式） */
const nameNormalized = ref(false);

const state = reactive<Record<string, FieldState>>({
  sec: blank(),
  min: blank(),
  hour: blank(),
  day: blank(),
  month: blank(),
  week: blank(),
});

/** 表达式与面板对不上时置为 true：只信表达式，不再回写面板 */
const rawMode = ref(false);
const rawExpression = ref("");
const tab = ref("sec");
const open = ref(false);

function blank(): FieldState {
  return { mode: "all", start: 0, end: 0, step: 1, points: [], nth: 1 };
}

/**
 * 常用预设：恒显，右栏列表按 UI 稿取这 5 条。
 *
 * <p>表达式统一写成 Quartz 的 `?` 占位（日/周二选一写 `?`）：服务端登记的任务
 * （如 `0 0/30 * * * ?`）与用户从后端拷来的表达式都是这个写法，预设和它们
 * 逐字节一致，选中态才亮得起来 —— 用 `*` 占位会与真实数据差一个字符，
 * 明明配的是同一件事，列表上却一个都不高亮。</p>
 */
const PRESETS_QUICK: { label: string; cron: string }[] = [
  { label: "每 5 分钟", cron: "0 0/5 * * * ?" },
  { label: "每 30 分钟", cron: "0 0/30 * * * ?" },
  { label: "每小时", cron: "0 0 * * * ?" },
  { label: "每天 00:00", cron: "0 0 0 * * ?" },
  { label: "周一 09:00", cron: "0 0 9 ? * MON" },
];

/** 罕见档预设：由「更多预设」展开（按周排期 / 更长周期 / 分钟级更细粒度） */
const PRESETS_MORE: { label: string; cron: string }[] = [
  { label: "每分钟", cron: "0 * * * * ?" },
  { label: "每 15 分钟", cron: "0 0/15 * * * ?" },
  { label: "每天 09:30", cron: "0 30 9 * * ?" },
  { label: "工作日 09:00", cron: "0 0 9 ? * MON-FRI" },
  { label: "每月 1 日", cron: "0 0 9 1 * ?" },
  { label: "每年 1 月 1 日", cron: "0 0 0 1 1 ?" },
];

/** 「更多预设」是否展开 */
const presetsExpanded = ref(false);

/**
 * 当前该展示的预设列表。
 *
 * <p>折叠时命中罕见档也要把命中的那个补出来 —— 否则用户明明存了"每月 1 日"，
 * 面板上一个都没高亮，看着像没生效。</p>
 */
const visiblePresets = computed<{ label: string; cron: string }[]>(() => {
  if (presetsExpanded.value) return [...PRESETS_QUICK, ...PRESETS_MORE];
  const hit = PRESETS_MORE.find((p) => p.cron === trimmed.value);
  return hit ? [...PRESETS_QUICK, hit] : PRESETS_QUICK;
});

/** 匹配方式文案：胶囊分段项与摘要文案共用一套叫法 */
const MODE_LABELS: Record<FieldMode, string> = {
  all: "每一个值",
  step: "从起点按间隔",
  range: "区间",
  points: "指定值",
  last: "最后一天",
  lastNth: "最后一个周几",
  nearest: "最近工作日",
  nth: "第 N 个周几",
};

/**
 * 单个匹配方式的展示文案。
 *
 * <p>`last`（`L`）在日与周两个字段上的引擎语义并不相同，必须分开叫：
 * 日字段是"当月最后一天"；周字段走的是 {@code isLastWeekDay}，判定为
 * "月末当天 **或** 与月末同星期的那些天" —— 实测 `0 0 9 * * L` 的下次触发是
 * 2026-10-10（周六），而 10-31 也是周六。把它也叫"最后一天"会误导用户。</p>
 *
 * @param key 字段 key
 * @param mode 匹配方式
 * @returns 展示文案
 */
function modeLabel(key: string, mode: FieldMode): string {
  if (mode === "last" && key === "week") return "与月末同星期";
  return MODE_LABELS[mode];
}

/**
 * 选项标签带上单位。
 *
 * <p>此前时间字段只给裸数字，指定值选中后会显示成一个孤零零的 `0`
 * （截图复核发现），看不出是"0 秒"还是别的。周字段本来就有"0 周日"的形式，
 * 这里把其余字段补齐为 `值 + 字段名`。标签只影响展示，value 仍是数字。</p>
 *
 * @param spec 字段规格
 * @returns 选项列表
 */
function optionsOf(spec: { min: number; max: number; key: string }): { value: number; label: string }[] {
  const out: { value: number; label: string }[] = [];
  for (let v = spec.min; v <= spec.max; v++) {
    out.push({ value: v, label: spec.key === "week" ? `${v} ${WEEK_NAMES[v]}` : `${v} ${LABEL_OF[spec.key] ?? ""}`.trim() });
  }
  return out;
}

const SPEC: Record<string, { min: number; max: number; modes: FieldMode[] }> = {
  sec: { min: 0, max: 59, modes: ["all", "step", "range", "points"] },
  min: { min: 0, max: 59, modes: ["all", "step", "range", "points"] },
  hour: { min: 0, max: 23, modes: ["all", "step", "range", "points"] },
  day: { min: 1, max: 31, modes: ["all", "step", "range", "points", "last", "nearest"] },
  month: { min: 1, max: 12, modes: ["all", "step", "range", "points"] },
  /* 周字段的 `L` 与 `dL` 都是引擎已实现的写法（`dL` = 当月最后一个星期 d，
     裸 `L` = 当月最后一天），文档里也写了，此前面板没有对应模式，
     于是 `0 0 9 * * 5L` 会整体退化成"面板未接管"、人话摘要连日期都丢掉。 */
  week: { min: 0, max: 6, modes: ["all", "step", "range", "points", "nth", "lastNth", "last"] },
};

/**
 * 字段顺序，与表达式 6 段的先后一致。
 *
 * <p>必须声明在 {@link syncFromModel} 之前：包着它的 `watch(model, …, { immediate: true })`
 * 会在 setup 期就执行，声明晚了会撞上 const 的暂时性死区
 * （实测直接 `ReferenceError: Cannot access 'FIELD_KEYS' before initialization`，
 * 整页白屏、tsc 却查不出来）。</p>
 */
const FIELD_KEYS = ["sec", "min", "hour", "day", "month", "week"] as const;

/**
 * 六个字段（秒/分/时/日/月/周），顺序即表达式字段顺序。
 * 面板用「字段盒子 + 当前字段的匹配方式」呈现，不再用 ReTab 页签。
 */
const FIELDS = [SECOND, MINUTE, HOUR, DAY, MONTH, WEEK];

const WEEK_OPTIONS: ReOption[] = WEEK_NAMES.map((n, i) => ({ label: n, value: i }));

/** 面板状态 → 单字段 token */
/**
 * 由面板状态算出该字段的 token（不看 rawTokens 回显）。
 *
 * @param key 字段 key
 * @returns 面板当前会写出的 token
 */
function tokenFromState(key: string): string {
  const f = state[key];
  switch (f.mode) {
    case "step":
      return `${f.start}/${f.step || 1}`;
    case "range":
      return f.step > 1 ? `${f.start}-${f.end}/${f.step}` : `${f.start}-${f.end}`;
    case "points":
      return f.points.length ? [...f.points].sort((a, b) => a - b).join(",") : "*";
    case "last":
      return "L";
    case "lastNth":
      return `${f.start}L`;
    case "nearest":
      return `${f.start}W`;
    case "nth":
      return `${f.start}#${f.nth}`;
    default:
      return "*";
  }
}

/**
 * 该字段在界面与表达式里实际使用的 token。
 *
 * <p>面板能一一对应地表达时就是面板的值；表达不了、或者表达出来会与用户输入
 * 不一致（英文名称、周字段写 7 等）时，回显用户原本写的 token —— 面板不得擅自
 * 把用户的表达式"看成"另一种意思。</p>
 *
 * @param key 字段 key
 * @returns 该字段的展示 / 拼装用 token
 */
function tokenOf(key: string): string {
  return rawTokens[key] ?? tokenFromState(key);
}

/**
 * 面板解析出的字段是否自洽。
 *
 * <p>倒序区间（如 `1-0`）必须在这里拦住：引擎对 `rangeMin > rangeMax` 的循环一次
 * 都不执行，位图留空，随后又被"未指定的一侧放宽为任意值"的规则接管 ——
 * 结果是 `1-0` 被静默当成"每天"，而面板还显示"区间 1-0"并报"合法"。</p>
 *
 * @param key 字段 key
 * @returns true 表示面板状态可以直接采用
 */
function fieldIsSane(key: string): boolean {
  const f = state[key];
  const spec = SPEC[key];
  const within = (v: number) => Number.isInteger(v) && v >= spec.min && v <= spec.max;
  switch (f.mode) {
    case "range":
      return within(f.start) && within(f.end) && f.end >= f.start && f.step >= 1;
    case "step":
      return within(f.start) && f.step >= 1;
    case "points":
      return f.points.length > 0 && f.points.every(within);
    case "nearest":
      return f.start >= 1 && f.start <= 31;
    case "lastNth":
      return f.start >= 0 && f.start <= 6;
    case "nth":
      return f.start >= 0 && f.start <= 6 && f.nth >= 1 && f.nth <= 5;
    default:
      return true;
  }
}

/** 六字段拼装；日/周一律用 `*` 兜底，避免服务端「一侧为空则整体放开」的语义把另一侧条件吞掉 */
const expression = computed(() =>
  [tokenOf("sec"), tokenOf("min"), tokenOf("hour"), tokenOf("day"), tokenOf("month"), tokenOf("week")].join(" "),
);

/** 解析单个 token 到面板状态；返回 false 表示面板表达不了，退回表达式模式 */
function parseToken(key: string, token: string): boolean {
  const f = state[key];
  const spec = SPEC[key];
  Object.assign(f, blank(), { start: spec.min });
  if (token === "*" || token === "?") {
    f.mode = "all";
    return true;
  }
  /* `L`（当月最后一天）与 `LW`：引擎的 parseDaysOfMonth 对 `LW` 走的是
     `lastDayOfMonth = true`，与 `L` **完全同义** —— 它不是"最后一个工作日"，
     实测 `0 0 9 LW * *` 的下次触发是 2026-10-31（周六）。面板按同义处理，
     原始写法由 rawTokens 回显，不会被悄悄改写成 `L`。 */
  if ((token === "L" || token === "LW") && key === "day") {
    f.mode = "last";
    return true;
  }
  /* 周字段的两个 L 写法：`dL` = 当月最后一个星期 d（引擎 lastWeekdayOfMonth），
     裸 `L` = 当月最后一天（引擎 lastDayOfWeek）。此前两者都解析不了，
     于是 `0 0 9 * * 5L` 会让整条表达式退化成"面板未接管"。 */
  if (key === "week" && token === "L") {
    f.mode = "last";
    return true;
  }
  if (key === "week" && /^[0-7]L$/.test(token)) {
    f.mode = "lastNth";
    f.start = Number.parseInt(token, 10);
    return true;
  }
  if (token.endsWith("W") && key === "day" && /^\d+W$/.test(token)) {
    f.mode = "nearest";
    f.start = Number.parseInt(token, 10);
    return true;
  }
  if (token.includes("#") && key === "week") {
    const [d, n] = token.split("#");
    if (!/^\d+$/.test(d) || !/^[1-5]$/.test(n)) return false;
    f.mode = "nth";
    f.start = Number.parseInt(d, 10);
    f.nth = Number.parseInt(n, 10);
    return true;
  }
  if (token.includes("/")) {
    const [head, tail] = token.split("/");
    if (!/^\d+$/.test(tail)) return false;
    f.step = Number.parseInt(tail, 10);
    if (head === "*") {
      f.mode = "step";
      f.start = spec.min;
      return true;
    }
    if (head.includes("-")) {
      const [a, b] = head.split("-");
      if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) return false;
      f.mode = "range";
      f.start = Number.parseInt(a, 10);
      f.end = Number.parseInt(b, 10);
      return true;
    }
    if (/^\d+$/.test(head)) {
      f.mode = "step";
      f.start = Number.parseInt(head, 10);
      return true;
    }
    return false;
  }
  if (token.includes("-")) {
    const [a, b] = token.split("-");
    if (!/^\d+$/.test(a) || !/^\d+$/.test(b)) return false;
    f.mode = "range";
    f.start = Number.parseInt(a, 10);
    f.end = Number.parseInt(b, 10);
    return true;
  }
  const parts = token.split(",");
  if (!parts.every((p) => /^\d+$/.test(p))) return false;
  f.mode = "points";
  f.points = parts.map((p) => Number.parseInt(p, 10));
  return true;
}

/** 表达式 → 面板状态 */
function syncFromModel(value: string): void {
  const tokens = (value || "").trim().split(/\s+/);
  if (!value.trim() || tokens.length !== 6) {
    rawMode.value = !!value.trim();
    rawExpression.value = value.trim();
    return;
  }
    const keys = [...FIELD_KEYS];
  for (const k of keys) {
    delete rawTokens[k];
    delete panelParsed[k];
  }
  nameNormalized.value = false;
  if (!value.trim() || tokens.length !== 6) {
    rawMode.value = !!value.trim();
    rawExpression.value = value.trim();
    return;
  }
  let sawName = false;
  const claimed = keys.map((k, i) => {
    const raw = tokens[i];
    /* 先按原文解析。解析得到即视为"面板看得懂"，可以参与人话描述；
       但只有"状态自洽且写回去与原文一致"才允许接管该字段的写法。 */
    if (parseToken(k, raw)) {
      panelParsed[k] = true;
      if (fieldIsSane(k) && tokenFromState(k) === raw) return true;
    }
    /* 再尝试把英文名称归一化成数字：面板能理解，盒子仍回显用户写的名称。 */
    const { text, used } = normalizeTokenNames(k, raw);
    if (used && parseToken(k, text)) {
      panelParsed[k] = true;
      if (fieldIsSane(k)) {
        sawName = true;
        rawTokens[k] = raw;
        return true;
      }
    }
    /* 彻底表达不了（或表达出来会变意思）：回显原样，绝不伪造 * */
    rawTokens[k] = raw;
    return false;
  });
  rawMode.value = claimed.some((c) => !c);
  nameNormalized.value = sawName;
  rawExpression.value = value.trim();
}

/**
 * 「本次 expression 变化是由输入推导出来的，不要回写成model」的闸门。
 *
 * <p>症状：输入框里每敲一个字符就闪一下。成因是两条写路径在同一次按键里互相打：</p>
 * <ol>
 *   <li>用户敲 `0` → {@code model = "0"}；</li>
 *   <li>{@code watch(model)} → {@link syncFromModel} 拿 "0" 去解析，缺失字段按默认补齐，
 *       于是六字段 {@link expression} 变成 `"0 * * * * ?"`；</li>
 *   <li>紧接着 {@code watch(expression)} 触发，此时 {@code rawMode} 还是 false
 *       （"0" 面板表达得了），判定为「面板改动」，把 `"0 * * * * ?"` 写回 {@code model}。</li>
 * </ol>
 * <p>输入框的文本在光标下被改写 → 看着就是闪动/跳字。面板改动与用户输入因此必须可区分：
 * 本闸门在 {@code syncFromModel} 期间置位，只压住由输入派生的那次回写，
 * 用户点面板改字段产生的 {@code expression} 变化照常回写。</p>
 *
 * <p>清零放在 nextTick：{@code watch(expression)} 若本轮没被触发（敲入的字符没改变任何
 * token），靠 nextTick 兜底复位，闸门不会粘住 true 而吃掉下一次面板编辑。</p>
 */
let syncingFromModel = false;

watch(
  model,
  (v) => {
    syncingFromModel = true;
    if (!rawMode.value && v === expression.value) {
      rawExpression.value = v;
    } else {
      syncFromModel(v || "");
    }
    nextTick(() => {
      syncingFromModel = false;
    });
  },
  { immediate: true },
);

/** 面板改动 → 表达式（表达式模式下不反向覆盖用户输入） */
watch(expression, (v) => {
  /* nameNormalized 时也不回写：面板把 MON-FRI 理解成 1-5 只是为了能操作，
     写回去会把用户的名称形式改成数字形式 —— 属静默改写。 */
  if (rawMode.value || nameNormalized.value || props.disabled) return;
  /* 输入派生的 expression 不回写，否则输入框每敲一键就被改写（见 syncingFromModel）。 */
  if (syncingFromModel) return;
  if (v !== model.value) model.value = v;
});

const trimmed = computed(() => (model.value || "").trim());

/**
 * 把引擎抛出的报错翻译成人话。
 *
 * <p>引擎（`@repo/utils` 的 CronExpression）只有两条错误文案，此前是原样透给用户：
 * 触发器状态行、弹层底栏、弹层摘要 note 三处都直接显示
 * `Cron expression must have 6 fields (...)` 与 Java 风格的
 * `For input string: "1#2"` —— 后者对中文用户等于天书。</p>
 *
 * <p>两条都能给出更准的说法：字段数那条直接报当前段数；`For input string` 那条
 * 带着出错的原文，而组件自己知道它落在第几段，可以点名到字段。</p>
 *
 * @param raw 引擎原始报错
 * @param tokens 表达式切分出的各段
 * @returns 中文报错；无法识别的原文原样返回（不隐藏信息）
 */
function humanizeEngineError(raw: string, tokens: string[]): string {
  const six = /must have (\d+) fields/.exec(raw);
  if (six) {
    return `需要 6 段（秒 分 时 日 月 周），当前 ${tokens.length} 段`;
  }
  const bad = /^For input string: "(.*)"$/.exec(raw);
  if (bad) {
    const text = bad[1];
    const at = tokens.findIndex((t) => t.includes(text));
    const where = at >= 0 && FIELD_KEYS[at] ? `第 ${at + 1} 段（${LABEL_OF[FIELD_KEYS[at]]}）` : "其中一段";
    return `${where}「${text}」不是数字，该段只接受数字`;
  }
  return raw;
}

/**
 * 指出"数值合法但越界"的字段。
 *
 * <p>引擎对越界值是**照常置位、永不匹配**（见 CronExpression.parseField 的注释），
 * 于是它不报错、只表现为"算不出触发时间"。此前用户看到的只有
 * 「无法算出下一次触发时间」，完全不知道是哪个字段写错了。</p>
 *
 * <p>取值范围用 {@link SPEC} 而不是另写一份；周字段额外放行 7 ——
 * 引擎的 `parseDaysOfWeek` 会把 7 视作周日（`.replace(/7/g, "0")`），
 * 按面板的 0~6 去判会把合法的 `7` 误报成越界。</p>
 *
 * @param tokens 表达式切分出的各段
 * @returns 越界说明；没有越界时返回空串
 */
function outOfRangeHint(tokens: string[]): string {
  const bad: string[] = [];
  FIELD_KEYS.forEach((key, i) => {
    const token = tokens[i];
    if (token === undefined) return;
    const max = key === "week" ? 7 : SPEC[key].max;
    for (const part of token.match(/\d+/g) || []) {
      const n = Number(part);
      if (n < SPEC[key].min || n > max) {
        bad.push(`${LABEL_OF[key]}=${n}（应为 ${SPEC[key].min}~${max}）`);
        break;
      }
    }
  });
  return bad.length ? `${bad.join("、")} 超出可取范围` : "";
}

/** 校验 + 预览：用与服务端同源的解析引擎，避免"看着合法、后端拒" */
const analysis = computed(() => {
  const expr = trimmed.value;
  if (!expr) {
    return { valid: false, error: "", times: [] as Date[], empty: true };
  }
  try {
    const cron = new CronExpression(expr);
    const times = cron.getFireTimes(Math.min(20, Math.max(1, props.previewCount)), new Date());
    // 能解析但永不匹配（0 0 9 30 2 *、0 61 * * * *）后端同样会拒，预览口径必须一致
    if (!times.length) {
      return { valid: false, error: "无法算出下一次触发时间", times, empty: false };
    }
    return { valid: true, error: "", times, empty: false };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : String(e), times: [] as Date[], empty: false };
  }
});

const errorText = computed(() => {
  if (analysis.value.empty) {
    return props.defaultCron ? `留空则按后端默认 ${props.defaultCron} 登记` : "留空表示不设置调度";
  }
  if (!analysis.value.valid) {
    const tokens = trimmed.value.split(/\s+/);
    const base = humanizeEngineError(analysis.value.error || "表达式非法", tokens);
    /* "算不出触发时间"时补一句是哪个字段越界 —— 引擎对越界值不报错，
       此前用户只看到这一句，无从下手。 */
    const range = outOfRangeHint(tokens);
    return range ? `${base}：${range}` : base;
  }
  return "";
});

/**
 * 面板与表达式的同步状态说明（弹层用）。
 *
 * <p>此前弹层摘要条在"面板表达不了"时回落到「未设置调度周期」—— 把"看不懂"
 * 错报成"没设置"，而表达式其实合法且已有下次触发时间。</p>
 */
/** 字段 key → 中文单字，用于"哪些字段面板读不懂"的提示 */
const LABEL_OF: Record<string, string> = { sec: "秒", min: "分", hour: "时", day: "日", month: "月", week: "周" };

/**
 * 面板**真的读不懂**的字段（语法层面解析不了）。
 *
 * <p>与 {@link spellingDiff} 必须分开：`?`（日/周里表示"不指定"）与英文名称都是
 * 面板读得懂的写法，只是无法原样复现，写回去会变成 `*` / 数字。把它们说成
 * "面板无法表达"是误报 —— 实测截图里 `0 30 9 ? * MON-FRI` 被报成
 * "面板无法表达 日=?"，而 `?` 恰恰是最常见的写法，还会给出一个毫无意义的
 * "按表达式重建面板"按钮。</p>
 */
const notUnderstood = computed(() =>
  /* 空表达式不算"面板读不懂"：此时根本没解析过任何 token，panelParsed 全空，
     直接过滤会把六个字段全列成"表达不了"，新建任务的空表单上凭空多出一条
     "所有字段都读不懂"的假报错。 */
  analysis.value.empty ? [] : FIELDS.filter((f) => !panelParsed[f.key]).map((f) => f.label),
);

/** 面板读得懂、但写回去会改变写法（`?`、英文名称、周写 7、倒序区间）的字段 */
const spellingDiff = computed(() =>
  FIELDS.filter((f) => panelParsed[f.key] === true && rawTokens[f.key] !== undefined).map((f) => f.label),
);

/**
 * 该字段是否真的"面板读不懂"（需要标成警示态）。
 *
 * <p>只看 rawTokens 是不够的：`?` 与英文名称都会落进 rawTokens（为了原样回显），
 * 但面板**读得懂**它们 —— 把 `?` 标成"面板未接管"会让预设里每一个带 `?` 的表达式
 * 都把周字段染成警示色，而它恰恰是最常见、最正确的写法（见 UI 稿的 `0 0/30 * * * ?`）。
 * 真正的读不懂要靠 panelParsed 缺失来判。</p>
 */
function isRawField(key: string): boolean {
  return rawTokens[key] !== undefined && panelParsed[key] !== true;
}

/** "指定值"点了但一个都没选的字段（这些字段当前会写成 `*`） */
const emptyPointsLabels = computed(() =>
  FIELDS.filter((f) => state[f.key].mode === "points" && !state[f.key].points.length).map((f) => f.label),
);

const panelNote = computed(() => {
  if (analysis.value.empty) {
    return props.defaultCron ? `留空则按后端默认 ${props.defaultCron} 登记` : "留空表示不设置调度";
  }
  if (!analysis.value.valid) return analysis.value.error || "表达式非法";
  const unsynced = Object.keys(rawTokens);
  /* "指定值"点开却一个都没选：tokenOf 会写出 `*`（等于不限），
     这在表达式上合法，但用户很可能以为自己在限定取值。必须说明。 */
  if (emptyPointsLabels.value.length && !rawMode.value && !nameNormalized.value) {
    return `${emptyPointsLabels.value.join("、")}的"指定值"尚未选择任何值，当前等同不限`;
  }
  if (notUnderstood.value.length) {
    return `面板读不懂 ${unsynced.filter((k) => !panelParsed[k]).map((k) => `${LABEL_OF[k]}=${rawTokens[k]}`).join("、")}，已按原文保留`;
  }
  /* 英文名称、`?`、周写 7、倒序区间同属"面板读得懂但写法不同"。
     不要把它们分别贴标签：`?` 不是名称，写成"用了英文名称（日=?）"是错的。 */
  if (spellingDiff.value.length) {
    return `面板不会改写你的写法：${unsynced.map((k) => `${LABEL_OF[k]}=${rawTokens[k]}`).join("、")}（按数字理解，保存时保持原文）`;
  }
  return "与服务端同一套解析引擎算出，保存后的触发时间与此一致";
});

/**
 * 底栏提示：只放一句短的。
 *
 * <p>此前底栏直接复用 {@link panelNote}，于是同一条"面板读不懂"的说明在摘要条、
 * 字段编辑区、底栏**同时出现三次** —— 信息量没增加，可读性明显变差。
 * 详细原因留在摘要条（紧挨表达式），底栏只表明状态。</p>
 */
const footerHint = computed(() => {
  if (analysis.value.empty) return errorText.value;
  if (!analysis.value.valid) return errorText.value;
  if (syncWarning.value) return "表达式已按原文保留（原因见上方）";
  return "与服务端解析一致，保存后的触发时间与此相符";
});

/**
 * 面板标题行的一句话：UI 稿的「每 30 分钟执行一次」。
 *
 * <p>非法时不能沿用空态那句「未设置调度周期」——用户明明写了东西，
 * 说成"未设置"等于把错误吞了。这里换成明说的"表达式无法解析"，
 * 具体错在哪由副标题（errorText）接住。</p>
 */
const panelHeadline = computed(() => {
  if (analysis.value.empty) return "未设置调度周期";
  if (!analysis.value.valid) return "表达式无法解析";
  return humanSummary.value || summary.value || "已设置调度周期";
});

/**
 * 面板标题行的副标题：机械描述 + 段数口径，非法时换成错误说明。
 *
 * <p>`Quartz 6 段` 必须写在这里：面板能吃 6 段，服务端也只认 6 段，
 * 而网上搜 cron 教程出来的几乎都是 5 段 —— 不点明段数，用户粘一段 5 段
 * 表达式进来只会得到一句"表达式非法"，看不出差在哪。</p>
 */
const panelSubline = computed(() => {
  if (analysis.value.empty) {
    return props.defaultCron ? `留空则按后端默认 ${props.defaultCron} 登记` : "留空表示不设置调度";
  }
  if (!analysis.value.valid) return analysis.value.error || errorText.value || "表达式非法";
  const detail = summary.value ? `${summary.value} · ` : "";
  return `${detail}Quartz 6 段（秒 分 时 日 月 周）`;
});

/**
 * 只在"面板与表达式存在落差"时才展示的提示。
 *
 * <p>三种落差都要提示：面板读不懂（rawMode）、用了英文名称（面板理解但不改写）、
 * 以及"指定值"空选（合法但会被当成不限）。此前只在弹层里给，触发器状态行
 * 完全不提，用户在外面看不到任何异常。</p>
 */
const syncWarning = computed(() => {
  if (analysis.value.empty) return "";
  /* 非法时不在这里重复报错：报错已作为摘要条正文（人话 + 越界定位）显示，
     再抄一遍到 note 上，同一句话会在同一个弹层里出现两次。 */
  if (!analysis.value.valid) return "";
  if (
    notUnderstood.value.length ||
    nameNormalized.value ||
    emptyPointsLabels.value.length ||
    spellingDiff.value.length
  ) {
    return panelNote.value;
  }
  return "";
});

/**
 * 状态行的紧凑版落差提示。
 *
 * <p>触发器的状态行只占一行，塞进完整说明会把"什么时候跑"挤没；
 * 所以这里只给"哪几个字段面板没接管"，详细原因留给弹层。</p>
 */
const syncBadge = computed(() => {
  if (analysis.value.empty) return "";
  if (notUnderstood.value.length) return `面板未接管 ${notUnderstood.value.join("、")}`;
  if (spellingDiff.value.length) return `原样保留 ${spellingDiff.value.join("、")}`;
  if (emptyPointsLabels.value.length) return `${emptyPointsLabels.value.join("、")}未选值，等同不限`;
  return "";
});

const WEEK_LABEL = ["日", "一", "二", "三", "四", "五", "六"];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} 周${WEEK_LABEL[d.getDay()]}`;
}

/** 触发时刻的时刻部分：`15:30:00`（UI 稿左栏只显示时刻，日期交给 dayLabel） */
function timeLabel(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 触发时刻的日期前缀：今天 / 明天 / 后天 / 周X。
 *
 * <p>「今天 15:30:00」比「2026-10-10 15:30:00 周六」短一半，而预览列表要的就是
 * 「最快那次在多久以后」——日期越远越该显式，所以三天以内走相对说法，
 * 再远退到星期（同一周内仍然好认），跨周才回到日期。</p>
 */
function dayLabel(d: Date): string {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const now = new Date();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((a - b) / 86400000);
  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  if (diff === 2) return "后天";
  if (diff === -1) return "昨天";
  if (diff > 2 && diff < 7) return `周${WEEK_LABEL[d.getDay()]}`;
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

/**
 * 触发时刻的相对说法：`22 分钟后` / `1 小时后` / `3 天后`。
 *
 * <p>和时刻并排放，一眼回答「等多久」——预览列表的用途就是这个，
 * 只给绝对时间的话用户还得自己算。</p>
 */
function relativeLabel(d: Date): string {
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return "即将";
  const min = Math.round(ms / 60000);
  if (min < 1) return "1 分钟内";
  if (min < 60) return `${min} 分钟后`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时后`;
  return `${Math.floor(hour / 24)} 天后`;
}

/** 字段的机械描述（"秒 0，分 30…"），面板表达不了的字段按原样回显 */
const summary = computed(() => {
  if (!trimmed.value || !analysis.value.valid) return "";
  const parts: string[] = [];
  const describe = (key: string, unit: string) => {
    const raw = rawTokens[key];
    /* `?` 是"不指定"的占位，不是用户挑的取值：写进描述只会让人以为
       "周=?" 是某种排期（UI 稿的副标题里没有这一项）。 */
    if (raw !== undefined) {
      if (raw === "?") return;
      // 面板表达不了：如实回显 token，不猜它的意思
      parts.push(`${unit} ${raw}`);
      return;
    }
    const f = state[key];
    if (f.mode === "all") return;
    /* 秒写 `*` 与写单个 `0` 在分钟级排期里是一回事（humanTime 同此口径），
       已经由下面的分钟/小时步进说清了，重复一遍「秒 0」只是噪声。 */
    if (key === "sec" && f.mode === "points" && f.points.length === 1 && f.points[0] === 0) return;
    if (f.mode === "step") parts.push(`每 ${f.step} ${unit}（自 ${f.start} 起）`);
    else if (f.mode === "range") parts.push(`${unit} ${f.start}-${f.end}${f.step > 1 ? ` 步长 ${f.step}` : ""}`);
    /* 空的多选此前会 push 出一个没有值的"日 "，摘要里留下悬空单位。
       这里明确说成"任意"，与 tokenOf 在这种状态下写出的 * 保持一致。 */
    else if (f.mode === "points") parts.push(f.points.length ? `${unit} ${f.points.join("、")}` : `${unit} 任意（未选择具体值）`);
    else if (f.mode === "last") parts.push(key === "week" ? "与月末同星期的那些天" : "当月最后一天");
    else if (f.mode === "lastNth") parts.push(`当月最后一个${WEEK_NAMES[f.start]}`);
    else if (f.mode === "nearest") parts.push(`当月 ${f.start} 日最近工作日`);
    else if (f.mode === "nth") parts.push(`第 ${f.nth} 个${WEEK_NAMES[f.start]}`);
  };
  describe("sec", "秒");
  describe("min", "分");
  describe("hour", "时");
  describe("day", "日");
  describe("month", "月");
  describe("week", "周");
  return parts.length ? parts.join("，") : "每秒";
});

/** 时间部分的人话：`09:30` / `09:30:15` / `每 15 分钟` / `每小时` / `每秒` */
function humanTime(): string {
  const s = state.sec;
  const m = state.min;
  const h = state.hour;
  // 面板看不懂的字段不自作主张，交给机械描述
  for (const k of ["sec", "min", "hour"]) {
    if (!panelParsed[k]) return "";
  }
  const isAll = (f: FieldState) => f.mode === "all";
  const single = (f: FieldState) => f.mode === "points" && f.points.length === 1;
  /* 秒写单个 0 与写 * 在描述上等价：分钟用步进、小时给定时，说的是
     "09:00 起每 15 分钟"，不该因为秒写的是 0 而不是 * 就掉进兜底分支。
     注意本行不要再出现星号加斜杠的字面量，那会提前闭合块注释。 */
  const secImplicit = isAll(s) || (single(s) && s.points[0] === 0);
  const minuteStep = (f: FieldState) =>
    f.mode === "step" ? f.step : f.mode === "range" && f.step > 1 ? f.step : 0;

  if (isAll(s) && isAll(m) && isAll(h)) return "每秒";
  /* 秒写单个 0 与写 * 在这里同样等价（见 secImplicit）：`0 0/5 * * * ?`
     是最常见的「每 N 分钟」写法，此前只因秒不是 * 就掉进兜底分支，
     人话变成「每天 执行」—— 明明是每 5 分钟一次。 */
  if (secImplicit && minuteStep(m) && isAll(h)) {
    return m.start === 0 ? `每 ${m.step} 分钟` : `每小时的第 ${m.start} 分钟起，每 ${m.step} 分钟`;
  }
  // 某个整点起、按步进走分钟（如 09:00 起每 15 分钟）
  if (secImplicit && minuteStep(m) && single(h)) {
    return `${pad(h.points[0])}:${pad(m.start)} 起每 ${m.step} 分钟`;
  }
  if (isAll(s) && isAll(m) && h.mode === "step") {
    return h.start === 0 ? `每 ${h.step} 小时` : `每天 ${pad(h.start)} 点起，每 ${h.step} 小时`;
  }
  if (isAll(s) && single(m) && isAll(h)) return `每小时的第 ${m.points[0]} 分钟`;
  if (isAll(s) && single(m) && single(h)) return `${pad(h.points[0])}:${pad(m.points[0])}`;
  if (single(s) && single(m) && single(h)) {
    // 秒恰为 0 时按惯例省略秒：写 `12:00 执行` 比 `12:00:00 执行` 更像人话
    const hhmm = `${pad(h.points[0])}:${pad(m.points[0])}`;
    return s.points[0] === 0 ? hhmm : `${hhmm}:${pad(s.points[0])}`;
  }
  return "";
}

/** 周字段数值 → 中文，`7` 与服务端一致地归到周日 */
function weekName(v: number): string {
  return WEEK_NAMES[((v % 7) + 7) % 7];
}

/** 周取值集合的人话：工作日 / 每X / 每X、Y */
function weekSetPhrase(values: number[]): string {
  const set = new Set(values.map((v) => ((v % 7) + 7) % 7));
  if (isWorkdaySet(set)) return "每个工作日";
  const sorted = [...set].sort((a, b) => a - b);
  if (sorted.length === 1) return `每${weekName(sorted[0])}`;
  return `每${sorted.map((v) => weekName(v).slice(1)).join("、")}`;
}

/** 日期部分的人话：`每天` / `每个工作日` / `每周一` / `每月 1 日` / `每年 1 月 1 日` */
function humanDate(): string {
  const d = state.day;
  const mo = state.month;
  const w = state.week;
  // 面板看不懂的字段交给机械描述，避免人话里出现编造的日期
  if (!panelParsed.day || !panelParsed.month || !panelParsed.week) return "";
  /* 倒序区间（任意字段）：引擎对 start > end 的循环一次都不执行，位图留空后被
     "未指定的一侧放宽为任意值"接管 —— 语义是"不限"，而面板显示的是 `5-1`。
     必须说出来，否则用户以为自己选了 5 到 1 号/周一。 */
  const reversed = (key: string, render: (f: FieldState) => string) => {
    const f = state[key];
    if (!panelParsed[key] || f.mode !== "range" || f.end >= f.start) return "";
    return `${render(f)}（倒序区间，引擎视为"不限"）`;
  };
  const bad =
    reversed("month", (f) => `每年 ${f.start}-${f.end} 月`)
    || reversed("day", (f) => `每月 ${f.start}-${f.end} 日`)
    || reversed("week", (f) => `周 ${f.start}-${f.end}`);
  if (bad) return bad;

  const mon = mo.mode === "all" || (mo.mode === "points" && !mo.points.length)
    ? ""
    : `每年 ${mo.mode === "points" && mo.points.length ? mo.points.join("、") : tokenFromState("month")} 月`;
  /* 日的"指定值"空选等价于 *（tokenOf 就是这么写的），描述上按"每天"处理，
     否则会拼出 `每月 * 日` 这种既难读又像占位的说法。 */
  const dayAll = d.mode === "all" || (d.mode === "points" && !d.points.length);
  if (w.mode === "all" && dayAll) return mon ? `${mon}每天` : "每天";
  if (w.mode === "all") {
    const dayPart =
      d.mode === "last" ? "当月最后一天"
        : d.mode === "nearest" ? `每月 ${d.start} 日最近的工作日`
          : d.mode === "points" ? `每月 ${d.points.join("、")} 日`
            // 区间两端相同时说成单日，别写 `1-1 日`
            : d.mode === "range" ? (d.start === d.end ? `每月 ${d.start} 日` : `每月 ${d.start}-${d.end} 日`)
              : `每月 ${tokenFromState("day")} 日`;
    // "每年 1 月" + "每月 1 日" → "每年 1 月 1 日"（保留一个空格，否则拼成"1 月1 日"）
    return mon ? `${mon} ${dayPart.replace(/^每月 /, "")}` : dayPart;
  }
  if (w.mode === "points" && w.points.length) return `${mon}${weekSetPhrase(w.points)}`;
  if (w.mode === "range") return `${mon}${weekSetPhrase(rangeToArray(w.start, w.end))}`;
  if (w.mode === "nth") return `${mon}每月的第 ${w.nth} 个${weekName(w.start)}`;
  if (w.mode === "lastNth") return `${mon}当月最后一个${weekName(w.start)}`;
  /* 周字段的裸 `L` 不是"月末一天"：引擎 isLastWeekDay 判定为
     "月末当天 **或** 与月末同星期的那些天"（实测 10 月会命中每个周六）。 */
  if (w.mode === "last") return `${mon}当月中与月末同星期的那些天`;
  return `${mon}周 ${tokenFromState("week")}`;
}

function rangeToArray(a: number, b: number): number[] {
  const out: number[] = [];
  for (let v = Math.min(a, b); v <= Math.max(a, b); v++) out.push(v);
  return out;
}

/** 恰好是周一到周五才算"工作日"（含周六、或只有其中几天都不算） */
function isWorkdaySet(set: Set<number>): boolean {
  return set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d));
}

/**
 * 人人可读的一句话：设计的中心诉求就是"每个工作日 09:30 执行"这一行。
 *
 * <p>此前只有机械的字段罗列（"秒 0，分 30，时 9，周 1、2、3、4、5"），
 * 而面板表达不了的表达式连罗列都没有 —— 状态行只剩"合法·下次 …"。</p>
 */
const humanSummary = computed(() => {
  if (!trimmed.value || !analysis.value.valid) return "";
  const date = humanDate();
  const time = humanTime();
  // 纯频率说法（每秒 / 每 N 分钟 / 每 N 小时）本身就完整，"每天"是多余前缀
  const isFrequency = /^(每 \d+ 分钟|每 \d+ 小时|每秒)$/.test(time);
  const head = date === "每天" && isFrequency ? "" : date;
  let text: string;
  if (!head && !time) text = summary.value;
  else if (!time) text = `${head} 执行`;
  else if (!head) text = time === "每秒" ? "每秒执行" : `${time} 执行`;
  else text = `${head} ${time} 执行`;
  /* 只有面板**读不懂**的字段才在这里补原文（那是有效信息）。
     英文名称、周写 7 这类字段面板已理解，人话里已经说准了，
     再挂一遍原文就是噪声 —— 细节在弹层的提示条里给。 */
  const unsynced = Object.keys(rawTokens).filter((k) => !panelParsed[k]);
  if (unsynced.length) {
    const literal = unsynced.map((k) => `${LABEL_OF[k]} ${rawTokens[k]}`).join("，");
    text = `${text}（${literal}）`;
  }
  return text;
});

/**
 * 文本模式（预览）的人话：与状态行同一份口径，只是表格一行放得下，
 * 去掉「执行」后缀更紧凑（"每 5 分钟"而不是"每 5 分钟 执行"）。
 *
 * <p>非法时不静默藏错：换成人话版的错误说明，让登记时就写错的表达式在表格里一眼可见
 * （数据来自后端，能非法说明登记环节就没拦住）。</p>
 */
const textModeHuman = computed(() => {
  if (analysis.value.empty) return "";
  if (!analysis.value.valid) return errorText.value;
  return humanSummary.value.replace(/ 执行$/, "");
});

/**
 * 用户动了面板控件：放弃"表达式直填"与"名称归一化"的只读态，让改动能写回 model。
 *
 * <p>不这样做的话，{@code MON-FRI} 这类表达式在面板上改任何东西都不会生效 ——
 * 改动被"不回写"的保护挡住，界面却看不到任何反馈。</p>
 */
function panelTouch(): void {
  rawMode.value = false;
  nameNormalized.value = false;
}

/** 取整并夹到字段范围内 */
function clampInt(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, Math.round(v)));
}

/**
 * 把区间的两个端点理顺到合法范围。
 *
 * <p>倒序区间必须在这里就地纠正：引擎对 `start > end` 的循环一次都不执行，
 * 位图留空后又被"未指定的一侧放宽为任意值"接管，`1-0` 于是被<b>静默当成每天</b>，
 * 而面板还显示"区间 1-0、合法"。让用户直接看到纠正后的值，比事后报错更好懂。</p>
 *
 * @param key 字段 key
 */
function fixRange(key: string): void {
  const f = state[key];
  if (f.mode !== "range") return;
  const spec = SPEC[key];
  f.start = clampInt(f.start, spec.min, spec.max);
  f.end = clampInt(f.end, spec.min, spec.max);
  if (f.end < f.start) f.end = f.start;
}

/**
 * 用户通过面板接管某字段：清掉它的"原文回显"与"读不懂"标记，让面板的值生效。
 *
 * <p>必须清 rawTokens：否则该字段的原文回显会在 {@link tokenOf} 里压过面板状态。
 * 实测的坏例子：默认表达式 `0 0 12 * * ?` 的周字段回显为 `?`，用户在面板把它改成
 * "最后一个周几"后，表达式仍然是 `?` —— 面板改动完全不生效，且界面没有任何提示。</p>
 *
 * @param key 字段 key
 */
function claimField(key: string): void {
  delete rawTokens[key];
  panelParsed[key] = true;
}

/**
 * 面板控件被改动：退出只读态，并即时纠正区间。
 *
 * @param key 字段 key
 */
function onFieldInput(key: string): void {
  claimField(key);
  panelTouch();
  fixRange(key);
}

/**
 * 切换某字段的匹配方式。
 *
 * @param key 字段 key
 * @param mode 目标匹配方式
 */
function setFieldMode(key: string, mode: FieldMode): void {
  const f = state[key];
  const spec = SPEC[key];
  claimField(key);
  panelTouch();
  f.mode = mode;
  if (mode === "range") {
    f.start = clampInt(f.start, spec.min, spec.max);
    /* 端点给成"起点本身"而不是 0：默认值 0 在日/周字段上会直接写出 `1-0`、`0-0`
       这类要么非法、要么语义退化的区间。 */
    f.end = clampInt(f.end, spec.min, spec.max);
    if (f.end < f.start) f.end = f.start;
  }
  if (mode === "step" && (!Number.isFinite(f.step) || f.step < 1)) f.step = 1;
}

function applyPreset(cron: string): void {
  rawMode.value = false;
  syncFromModel(cron);
  model.value = cron;
}

function applyDefaultCron(): void {
  if (props.defaultCron) applyPreset(props.defaultCron);
}

/** 弹层模式：字段（原有六段编辑）/ 日历（参考 UI 的月历调度器） */
const panelMode = ref<"field" | "calendar">("field");

/** 日历面板实例：底栏「应用到表达式」要问它当前攒出的表达式 */
const calPanelRef = ref<InstanceType<typeof ReCronCalendarPanel> | null>(null);

/** 底栏「应用到表达式」：转调面板的 emitApply，表达式由面板自己攒、自己抛 */
function applyCalendarFromPanel(): void {
  calPanelRef.value?.emitApply();
}

/**
 * 日历模式写入表达式：复用 applyPreset 那条写入路径。
 *
 * 日历面板自己只负责「攒出一个 6 段字符串」，解析/校验/预览仍由本组件的
 * syncFromModel + analysis 统一负责 —— 两种入口共用一条管线，不会出现
 * 「日历能接受、字段模式读不懂」的不一致。
 */
function applyCalendar(expr: string): void {
  if (!expr) return;
  if (!isSixField(expr)) {
    msgError("日历模式生成的表达式不是 6 段，已忽略");
    return;
  }
  applyPreset(expr);
}

/**
 * 表达式段数是否正好 6。
 *
 * <p>写入前必须拦一道：6 段方言由 {@link CronExpression} 强制，7 段会被服务端
 * 直接拒绝。而 {@link applyPreset} 不做校验 —— 它对预设值是可信的，对外部传入
 * 就必须先验。日历面板算的是纯字符串（秒/分/时拼好 + 日周占位），一旦它哪一步
 * 少拼或多拼一段，错误会直接落进 model，父组件要到提交时才报，且用户看不出是哪来的。</p>
 */
function isSixField(expr: string): boolean {
  return String(expr).trim().split(/\s+/).filter(Boolean).length === 6;
}

function clearAll(): void {
  rawMode.value = false;
  model.value = "";
  syncFromModel("");
}

/**
 * 把"面板读不懂"的字段重置成"不限制"（`*`），让面板能接管。
 *
 * <p>此前这个按钮是**死的**：点了没有任何可观测变化（实测 `0 0 9 1#2 * *`
 * 点击前后表达式、状态行、摘要、stale 字段、字段 aria 全部逐字节一致，连点两次无变化）。
 * 原因是它只做了 `rawMode = false; syncFromModel(rawExpression)` —— 而
 * {@link syncFromModel} 结尾会把 `rawMode` 重算回 `true`
 * （`claimed.some((c) => !c)`），于是面板立刻又回到只读。</p>
 *
 * <p>现在的语义是"把读不懂的那几段换成 `*`"，这是唯一能让面板接手的做法：
 * 面板本来就表达不出 `1#2` 这种写法，继续读原文只会一直卡在只读态。
 * 改动会写回 model，但弹层的「取消」能把整段还原回打开前的表达式。</p>
 */
function useExpressionText(): void {
  const tokens = (rawExpression.value || "").trim().split(/\s+/);
  if (tokens.length !== FIELD_KEYS.length) {
    /* 段数就不对时没有"字段"可言，整段按原文重读一次即可 */
    rawMode.value = false;
    syncFromModel(rawExpression.value);
    return;
  }
  FIELD_KEYS.forEach((key, i) => {
    if (!panelParsed[key]) tokens[i] = "*";
  });
  const next = tokens.join(" ");
  model.value = next;
  syncFromModel(next);
}

/**
 * 弹层的定位修饰符。
 *
 * 浮层只展开当前那一个字段，高 ~200px，默认策略就够用：下方放不下时
 * flip 翻到上方，贴边时 preventOverflow 沿轴向拉回。
 *
 * 这里刻意不关任何修饰符：早先那两个 disabled 是为"比视口一半还高的整屏面板"
 * 准备的（flip 判定上下都放不下后哪儿都不去、弹层直接溢出屏幕），那时改用
 * CSS 硬接管定位到视口顶部居中。面板缩成一段之后归属关系更重要 ——
 * 浮层必须跟着触发条走，硬接管会让它飘到屏幕顶上、与点的那段胶囊对不上。
 */
const POPPER_OPTIONS = {
  modifiers: [
    /* 触发器在视口下缘时翻到上方；上方也放不下（日历模式月历较高）才放弃 */
    { name: "flip", enabled: true, options: { padding: 8 } },
    { name: "preventOverflow", enabled: true, options: { padding: 8 } },
  ],
};

/**
 * 打开面板时记下表达式快照。
 *
 * <p>面板是实时把改动写回 model 的（state → expression → model），
 * 而弹层上给了「取消/保存」，所以取消必须能把整段还原回打开前的状态。
 * 同一个快照也兜住右上角 ×（cancelPanel 走同一条还原路径）——
 * 凡是没有明确按「保存」的关闭，都得还原。</p>
 */
const snapshot = ref("");

function openPanel(): void {
  snapshot.value = model.value || "";
  open.value = true;
}

/**
 * 点触发器上的某一段胶囊：切到字段模式并聚焦到该字段。
 *
 * <p>胶囊与浮层里的编辑器说的是同一件事（"六个字段里的哪一个"），两处状态
 * 必须共用 {@code tab} —— 分开存就会出现"胶囊高亮秒、编辑器却在改分"。
 * 顺手把面板切回字段模式：从日历模式点胶囊过来的人要的就是改那个字段，
 * 停在月历上等于没反应。</p>
 */
function focusField(key: string): void {
  tab.value = key;
  panelMode.value = "field";
  openPanel();
}

/** 当前正在编辑的字段规格（浮层只展开这一段，所以模板里处处用它而不是 spec） */
const activeSpec = computed(() => FIELDS.find((f) => f.key === tab.value) ?? FIELDS[0]);

/**
 * 浮层标题行副标题：一句话说明当前字段的取值口径。
 *
 * <p>只说这一段的语义（合法范围 + 当前匹配方式），不复述整条 cron 的人话 ——
 * 整句"每 30 分钟执行"贴在"分字段"标题下面会答非所问，而它已经在触发器
 * 下方那行状态里说过了。</p>
 */
const fieldHint = computed(() => {
  const spec = activeSpec.value;
  const mode = state[spec.key].mode;
  /* 标题已经是字段名，副标题这里只补两件还没说的：取值范围与当前匹配方式。
     标题写「分」+ 副标题写「分字段」是同一件事说两遍，读起来像卡壳。 */
  const known = mode === "step" || mode === "range" || mode === "points";
  const how = known ? modeLabel(spec.key, mode) : "不限制";
  return `${spec.min}~${spec.max} · ${how}`;
});

/**
 * 清空表达式（触发区那颗 ×）。
 *
 * <p>只改 model，不碰面板内部状态 —— 触发区上的操作不该顺手改弹层里
 * 尚未保存的选择。弹层下次打开时 {@link syncFromModel} 会按空值重置面板。</p>
 */
function clearExpression(): void {
  model.value = "";
}

/**
 * 还原到打开弹层时的表达式与面板状态，本次改动不保留。
 *
 * <p>不负责关弹层 —— 关闭动作由 {@link cancelPanel} 补上。</p>
 */
function revertPanel(): void {
  const back = snapshot.value;
  rawMode.value = false;
  syncFromModel(back);
  model.value = back;
}

/** 取消：还原到打开时的表达式与面板状态，本次改动不保留 */
function cancelPanel(): void {
  revertPanel();
  open.value = false;
}

/** 保存：改动已实时写入 model，关闭即可 */
function savePanel(): void {
  open.value = false;
}

/* immediate：父组件（JobView 等在提交前拦非法表达式）需要在挂载时就拿到
   当前表达式的合法性；此前只在变化时发，初始就非法的表达式不会触发任何事件，
   父组件会以为"还没动过"从而放行。 */
watch(analysis, (a) => emit("change", trimmed.value, a.valid), { immediate: true });
</script>

<template>
  <div :class="['re-cron', { 'is-disabled': disabled, 'is-text': mode === 'text' }]" :style="width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined">
    <!--
      文本模式（预览）：只给「表达式 + 人话」两行，不挂任何交互。
      表达式留空时显示「—」；非法时人话换成错误说明（红色）—— 表格里的行来自
      后端数据，能非法说明登记时就写错了，必须让用户看见而不是静默藏起来。
    -->
    <div v-if="mode === 'text'" class="re-cron__text">
      <code class="re-cron__text-expr" :title="trimmed || undefined">{{ trimmed || "—" }}</code>
      <span
        v-if="!analysis.empty"
        class="re-cron__text-human"
        :class="{ 'is-error': !analysis.valid }"
        :title="textModeHuman || undefined"
      >{{ textModeHuman }}</span>
    </div>
    <!--
      两个绑定决定，都有实测事故背书：

      1) trigger 空数组：开面板由 .re-cron__line 的 @click=openPanel 独管。
         trigger="click" 的 onToggle 会命中陈旧的 open 指示器 → onClose →
         hideAfter=200ms，面板刚开就被关掉（实测：点开 200ms 后自动消失）。

      2) :visible 单向（**不接 update:visible**）：让 EP 判定 controlled=true
         （controlled = isBoolean(visible) && !hasUpdateHandler）。EP 内容层
         打开时会挂 @vueuse 的 onClickOutside(popperContentRef, onClose)：
         点击目标不在面板 DOM 里就关掉整个弹层。面板内的 ReSelect 下拉
         teleport 到 body（ReSelect 硬编码 teleported=true，且弹层容器
         overflow-y:auto 会裁下拉，不能改成不 teleport），点选项的物理
         事件路径是 option → body，根本不经过面板 —— 被判成"面板外点击"，
         整个 ReCron 弹层连刚选中的值一起被关掉（实测复现）。
         收掉 update handler 后 controlled=true，onClickOutside 回调第一行
         `if (controlled) return` 直接短路，面板内所有 teleport 浮层的
         点击都不再误关。代价：点面板外部也不再自动关闭 —— 关闭收敛到
         「取消 / 保存 / ×」三个明确入口，顺带避免"点外面意外关闭把
         实时写回的改动悄悄留下"（面板是实时写回 model 的）。
         after-leave 兜底同步：EP 内部任何 hide（如路由切换）之后把 open
         同步回 false，否则 open ref 与物理状态失联 —— 失联后 openPanel
         的 open=true 不再触发 watch(props.visible)，面板再也打不开。
    -->
    <ElPopover
      v-if="mode === 'edit'"
      :visible="open"
      placement="bottom-start"      :trigger="[]"
      :width="360"
      popper-class="re-cron__popper"
      :popper-options="POPPER_OPTIONS"
      @after-leave="open = false"
    >
      <!--
        reference 是「整条触发行」而不是那颗齿轮按钮：Popover 只能挂一个 reference，
        而触发入口有两个（齿轮 + 点击输入框）。把整行挂上后，点输入框空白处也能打开，
        与原来「点输入框 → 弹层」的手感一致。
        ElOnlyChild 要求单根，所以必须外套一个元素，不能直接给 ReInput。
      -->
      <template #reference>
        <!--
          触发行按 UI 稿改成「六段胶囊」：秒 分 时 日 月 周各一颗，点哪颗
          就把弹层切到字段模式并聚焦到那个字段。

          这里不再放文本输入框，理由有两条：
          1) UI 稿的触发器就是胶囊排，文本输入框和它二选一，混在一起两边都像半成品；
          2) 原文输入并没有消失，收进弹层顶部的「表达式」一行（见下方 .re-cron__expr）——
             粘贴一段 6 段表达式仍然是一次操作，而胶囊负责的是"一眼看清现在配的是什么"。
        -->
        <div class="re-cron__line" @click="openPanel">
          <div class="re-cron__bar">
            <svg
              class="re-cron__bar-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5V12l3 2" />
            </svg>

            <button
              v-for="key in FIELD_KEYS"
              :key="key"
              type="button"
              class="re-cron__seg"
              :class="{ 'is-active': tab === key }"
              :aria-label="`${LABEL_OF[key]}字段，当前 ${tokenOf(key)}`"
              @click.stop="focusField(key)"
            >
              {{ tokenOf(key) }}
            </button>

            <!-- 自己画清除按钮，而不是用 Element Plus 的 `clearable`：
                 它的清除 × 是个裸 `<i class="el-input__clear">`，没有 role、没有
                 aria-label、也不可聚焦 —— 纯图标却读不出名字，读屏只会当它不存在。
                 这里换成真正的 `<button>`，名字写死成"清空表达式"。 -->
            <button
              v-if="trimmed && !disabled"
              type="button"
              class="re-cron__clear"
              aria-label="清空表达式"
              @click.stop="clearExpression"
            >
              <svg
                class="re-cron__clear-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M6 6 18 18M18 6 6 18" />
              </svg>
            </button>

            <!-- 滑杆图标只是视觉入口：真正的 trigger 是整条 .re-cron__line -->
            <button
              type="button"
              class="re-cron__gear"
              aria-label="打开调度周期可视化设置"
              title="可视化生成"
              :disabled="disabled"
              tabindex="-1"
              @click.stop="openPanel"
            >
              <svg
                class="re-cron__gear-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
                <circle cx="9" cy="7" r="2.4" fill="var(--el-bg-color, #ffffff)" />
                <circle cx="15" cy="12" r="2.4" fill="var(--el-bg-color, #ffffff)" />
                <circle cx="7" cy="17" r="2.4" fill="var(--el-bg-color, #ffffff)" />
              </svg>
            </button>
          </div>
        </div>
      </template>

<!--
        浮层只放「当前点中的那一段」的编辑器：点胶囊上的哪一段，下方就展开哪一段。
        不再整屏摊开六个字段 —— 要改一个字段得先在一大屏内容里找到它，
        而 cron 的日常操作就是"改其中一段"。
      -->
      <div class="re-cron__panel">
        <header class="re-cron__panel-head">
          <span class="re-cron__panel-shield" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3.2 19 6v5.2c0 4.4-2.9 8.2-7 9.6-4.1-1.4-7-5.2-7-9.6V6z" />
              <path d="M9 12l2.1 2.1L15.2 10" />
            </svg>
          </span>

          <div class="re-cron__panel-titles">
            <div class="re-cron__panel-title">{{ activeSpec.label }}</div>
            <div class="re-cron__panel-sub">{{ fieldHint }}</div>
          </div>

          <span v-if="analysis.valid && !analysis.empty" class="re-cron__valid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4.5 12.5l5 5 10-11" />
            </svg>
            有效
          </span>

          <button
            type="button"
            class="re-cron__mode"
            :class="{ 'is-active': panelMode === 'calendar' }"
            :aria-pressed="panelMode === 'calendar'"
            @click="panelMode = panelMode === 'calendar' ? 'field' : 'calendar'"
          >
            {{ panelMode === "calendar" ? "按字段" : "按日历" }}
          </button>

          <button type="button" class="re-cron__panel-close" aria-label="关闭" @click="cancelPanel">
            <el-icon><Close /></el-icon>
          </button>
        </header>

        <!-- 日历模式：仍保留整块月历（它本身就是一个整体选择器，不存在"某一段"） -->
        <ReCronCalendarPanel v-if="panelMode === 'calendar'" :expression="model" @apply="applyCalendar" />

        <template v-else>
          <!-- 当前字段：匹配方式 + 取值控件 -->
          <div class="re-cron__editor">
            <div class="re-cron__pill-row">
              <button
                v-for="mode in SPEC[activeSpec.key].modes"
                :key="mode"
                type="button"
                class="re-cron__pill"
                :class="{ 'is-active': state[activeSpec.key].mode === mode }"
                :aria-pressed="state[activeSpec.key].mode === mode"
                @click="setFieldMode(activeSpec.key, mode)"
              >
                {{ modeLabel(activeSpec.key, mode) }}
              </button>
            </div>

            <div class="re-cron__controls">
              <template v-if="state[activeSpec.key].mode === 'step'">
                <span>从</span>
                <ReInputNumber v-model="state[activeSpec.key].start" :min="activeSpec.min" :max="activeSpec.max" controls-position="right" @change="onFieldInput(activeSpec.key)" />
                <span>{{ activeSpec.label }}起，每隔</span>
                <ReInputNumber v-model="state[activeSpec.key].step" :min="1" :max="activeSpec.max" controls-position="right" @change="onFieldInput(activeSpec.key)" />
                <span>{{ activeSpec.label }}</span>
              </template>

              <template v-else-if="state[activeSpec.key].mode === 'range'">
                <ReInputNumber v-model="state[activeSpec.key].start" :min="activeSpec.min" :max="activeSpec.max" controls-position="right" @change="onFieldInput(activeSpec.key)" />
                <span class="re-cron__dash">—</span>
                <ReInputNumber v-model="state[activeSpec.key].end" :min="activeSpec.min" :max="activeSpec.max" controls-position="right" @change="onFieldInput(activeSpec.key)" />
                <span>{{ activeSpec.label }}，步长</span>
                <ReInputNumber v-model="state[activeSpec.key].step" :min="1" :max="activeSpec.max" controls-position="right" @change="onFieldInput(activeSpec.key)" />
              </template>

              <template v-else-if="state[activeSpec.key].mode === 'points'">
                <ReSelect
                  v-model="state[activeSpec.key].points"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  filterable
                  class="re-cron__points"
                  style="width: 100%"
                  :data="optionsOf(activeSpec)"
                  :placeholder="`选择${activeSpec.label}（${activeSpec.min}~${activeSpec.max}），可多选，也支持直接输入数字后回车`"
                  @change="onFieldInput(activeSpec.key)"
                />
              </template>

              <template v-else-if="state[activeSpec.key].mode === 'nearest'">
                <span>当月</span>
                <ReInputNumber v-model="state[activeSpec.key].start" :min="1" :max="31" controls-position="right" @change="onFieldInput(activeSpec.key)" />
                <span>日，就近顺延到工作日</span>
              </template>

              <template v-else-if="state[activeSpec.key].mode === 'nth'">
                <span>第</span>
                <ReInputNumber v-model="state[activeSpec.key].nth" :min="1" :max="5" controls-position="right" @change="onFieldInput(activeSpec.key)" />
                <span>个</span>
                <ReSelect v-model="state[activeSpec.key].start" class="re-cron__nth" style="width: 96px" :data="WEEK_OPTIONS" @change="onFieldInput(activeSpec.key)" />
              </template>

              <template v-else-if="state[activeSpec.key].mode === 'lastNth'">
                <span>当月最后一个</span>
                <ReSelect v-model="state[activeSpec.key].start" class="re-cron__nth" style="width: 96px" :data="WEEK_OPTIONS" @change="onFieldInput(activeSpec.key)" />
              </template>

              <template v-else-if="state[activeSpec.key].mode === 'last'">
                <span>{{ activeSpec.key === 'week' ? '当月中与月末同星期的那些天' : '当月最后一天' }}</span>
                <span v-if="rawTokens[activeSpec.key] && rawTokens[activeSpec.key] !== 'L'" class="re-cron__hint">
                  写作 <code>{{ rawTokens[activeSpec.key] }}</code>，与 <code>L</code> 同义
                </span>
              </template>

              <span v-else class="re-cron__hint">该字段不做限制（<code>*</code>）</span>
            </div>
          </div>

          <div v-if="activeSpec.key === 'week' || activeSpec.key === 'day'" class="re-cron__hint re-cron__note">
            日与周同时受限时任一条件都会失效，本组件一律用 <code>*</code> 占位另一侧，保证与后端算出的触发时间一致。
          </div>

          <!-- 预设：整条表达式级别的快捷入口，放在取值控件正下方 -->
          <div class="re-cron__preset-bar">
            <span class="re-cron__preset-title">常用</span>
            <div class="re-cron__pill-row">
              <button
                v-for="preset in visiblePresets"
                :key="preset.cron"
                type="button"
                class="re-cron__pill"
                :class="{ 'is-active': trimmed === preset.cron }"
                :aria-pressed="trimmed === preset.cron"
                @click="applyPreset(preset.cron)"
              >
                {{ preset.label }}
              </button>
              <button
                v-if="PRESETS_MORE.length"
                type="button"
                class="re-cron__pill re-cron__pill--more"
                @click="presetsExpanded = !presetsExpanded"
              >
                {{ presetsExpanded ? "收起" : "更多" }}
              </button>
              <button v-if="defaultCron" type="button" class="re-cron__pill re-cron__pill--more" @click="applyDefaultCron">
                用默认
              </button>
            </div>
          </div>

          <!--
            预览：一行就够（UI 稿的左栏是竖排 5 行，但那是整屏布局的产物；
            浮层里只放一行"最近几次什么时候跑"，确认改动生效即可）。
          -->
          <div v-if="analysis.times.length" class="re-cron__cal-preview">
            <span class="re-cron__section-title">下次触发</span>
            <ul class="re-cron__times">
              <li v-for="(t, i) in analysis.times.slice(0, 3)" :key="i">
                <span class="re-cron__times-text">{{ dayLabel(t) }} {{ timeLabel(t) }}</span>
              </li>
            </ul>
          </div>

          <div v-if="notUnderstood.length" class="re-cron__raw">
            <span class="re-cron__hint">
              <template v-for="(label, i) in notUnderstood" :key="label">
                <template v-if="i > 0">、</template>{{ label }}字段的写法面板表达不了
              </template>
            </span>
            <ReButton type="primary" plain @click="useExpressionText">按 * 重建</ReButton>
          </div>
        </template>

        <div class="re-cron__footer">
          <span
            class="re-cron__footer-hint"
            :class="{ 'is-error': !analysis.valid && !analysis.empty, 'is-info': analysis.empty || (analysis.valid && !syncWarning) }"
          >
            {{ footerHint }}
          </span>
          <div class="re-cron__footer-actions">
            <ReButton @click="clearAll">清空</ReButton>
            <ReButton v-if="panelMode === 'calendar'" type="primary" plain @click="applyCalendarFromPanel">
              应用到表达式
            </ReButton>
            <ReButton type="primary" @click="savePanel">完成</ReButton>
          </div>
        </div>
      </div>
    </ElPopover>

    <div
      v-if="mode === 'edit'"
      :class="['re-cron__status', analysis.valid ? 'is-ok' : 'is-warn']"
      role="status"
      aria-live="polite"
      :aria-atomic="true"
    >
      <template v-if="analysis.valid">
        <span>合法</span>
        <span class="re-cron__dot" aria-hidden="true">·</span>
        <span>下次 {{ fmt(analysis.times[0]) }}</span>
        <template v-if="humanSummary || summary">
          <span class="re-cron__dot" aria-hidden="true">·</span>
          <span>{{ humanSummary || summary }}</span>
        </template>
        <template v-if="syncBadge">
          <span class="re-cron__dot" aria-hidden="true">·</span>
          <span class="re-cron__status-warn">{{ syncBadge }}</span>
        </template>
      </template>
      <template v-else>{{ errorText }}</template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.re-cron {
  display: block;
  width: 100%;
}

.re-cron.is-disabled {
  opacity: 0.7;
}

/* ---------------- 文本模式（预览） ---------------- */

/* 表格等只读场景：表达式 + 人话两行，行高贴着单元格 */
.re-cron__text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.re-cron__text-expr {
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.re-cron__text-human {
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.re-cron__text-human.is-error {
  color: var(--el-color-danger);
}

/* ---------------- Popover 面板外壳 ---------------- */

/* 滑杆图标：触发器右侧的入口，整行才是真正的 trigger，它只做视觉提示 */
.re-cron__gear {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--el-radius-full);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.re-cron__gear:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}

.re-cron__gear-icon {
  width: 16px;
  height: 16px;
}

/* 面板内容根：Popover 自带 padding，这里只管内部纵向节奏 */
.re-cron__panel {
  display: flex;
  flex-direction: column;
  /* 5px：弹层要落进「触发器上方 ~470px / 下方 ~420px」这两个空间之一才能不滚动，
     差几像素就会溢出屏幕。每档 1px 在这里都是滚动条的开关。 */
  gap: 5px;
  min-width: 0;
}

/*
 * 标题行：盾牌 + 两行文字 + 有效徽章 + 模式切换 + 关闭。
 *
 * 五个元素挤在一行，靠 space-between 会把中间全推到两边，
 * 所以右侧三件套统一 margin-left:auto，中间的文字块自己吃掉剩余宽度。
 */
.re-cron__panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 9px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.re-cron__panel-shield {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
}

.re-cron__panel-shield svg {
  width: 18px;
  height: 18px;
}

/* 两行文字自己撑开，把右侧的徽章/切换/关闭顶到行尾 */
.re-cron__panel-titles {
  flex: 1 1 auto;
  min-width: 0;
}

.re-cron__panel-title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
}

/* 非法时标题必须是红色：这一行此刻就是报错本身，不能用中性色糊过去 */
.re-cron__panel-head.is-invalid .re-cron__panel-title {
  color: var(--el-color-danger, #f56c6c);
}

.re-cron__panel-sub {
  margin-top: 2px;
  overflow: hidden;
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
  line-height: 1.4;
  /* 白名单写法（MON-FRI、每月 1 日）比单行长；这里允许换成第二行而不是省略号 ——
     截断的副标题等于没说，而它是解释"这段 cron 什么时候跑"的那一句。 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 有效徽章：绿底绿字的小胶囊，只在合法非空时出现 */
.re-cron__valid {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 10px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-success-light-9, #f0f9eb);
  color: var(--el-color-success, #67c23a);
  font-size: 12px;
  font-weight: 500;
}

.re-cron__valid svg {
  width: 13px;
  height: 13px;
}

/* 模式切换（日历 / 字段）：单颗按钮，靠 .is-active 表明当前在月历上 */
.re-cron__mode {
  flex: none;
  height: 26px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: var(--el-radius-sm);
  background: var(--el-bg-color, #ffffff);
  color: var(--el-text-color-regular);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}

.re-cron__mode.is-active {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
}

.re-cron__panel-close {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--el-radius-full);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  cursor: pointer;
}

.re-cron__panel-close:hover {
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-primary);
}

/* 日历模式下的预览区：与月历同宽，贴面板底部 */
.re-cron__cal-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.re-cron__line {
  display: flex;
  align-items: center;
  width: 100%;
  /*
   * 容器查询：触发器这一行的宽度由外层表单决定，与视口无关
   * （侧边栏、抽屉、窄列都可能很窄），所以只能问容器、问不了媒体查询。
   * `inline-size` 只包含行内轴：这一行里只有静态子元素，
   * `container-type` 附带的 layout 包含不会改变任何绝对定位的包含块。
   */
  container-type: inline-size;
  container-name: recron-line;
}

.re-cron__bar {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 38px;
  padding: 0 8px 0 10px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color, #ffffff);
  cursor: pointer;
}

.re-cron__line:hover .re-cron__bar {
  border-color: var(--el-color-primary-light-5, #409eff);
}

.re-cron__bar-icon {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--el-text-color-secondary, #909399);
}

/* 六段胶囊：等宽字体 + flex:1 1 0，六颗视觉重量一致，谁也不占宽 */
.re-cron__seg {
  flex: 1 1 0;
  min-width: 0;
  height: 26px;
  padding: 0 6px;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: var(--el-radius-sm, 4px);
  background: var(--el-fill-color-light, #f4f4f5);
  color: var(--el-text-color-regular, #606266);
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 13px;
  line-height: 24px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.re-cron__seg:hover {
  border-color: var(--el-color-primary-light-5, #409eff);
  color: var(--el-color-primary, #409eff);
}

/* 当前聚焦字段：主色实底白字，与其余五颗的浅灰底拉开层次 */
.re-cron__seg.is-active {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  color: var(--el-color-white, #ffffff);
  font-weight: 600;
}

/*
 * 窄容器（< 320px）下六颗胶囊会挤成六条竖线，改成两行三列。
 * 用容器查询而不是媒体查询：这一行的宽度由外层表单决定，与视口无关。
 */
@container recron-line (max-width: 320px) {
  .re-cron__bar {
    flex-wrap: wrap;
    height: auto;
    padding: 6px;
    row-gap: 6px;
  }

  .re-cron__seg {
    flex: 1 1 28%;
  }
}

/*
 * 组件级去动效：触发器胶囊条、状态行（以及组件内其他元素与伪元素）
 * 一律瞬时切换 —— 输入 cron 时状态行每敲一个字符都会重算，任何过渡/呼吸/高光
 * 都会放大成"闪一下 / 抖一下"的廉价观感，这里整树关闭 animation 与 transition。
 */
.re-cron,
.re-cron :deep(*),
.re-cron :deep(*::before),
.re-cron :deep(*::after) {
  animation: none !important;
  transition: none !important;
}

/* 输入盒不吃主题的聚焦光晕：外发光一律压成 1px 内描边 */
.re-cron :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--el-input-border-color, var(--el-border-color)) inset !important;
}

/*
 * 选中态与自动填充：
 *  - 文本选中用极淡中性底，不用主色：主色偏紫/偏亮时，cron 表达式整行被选中
 *    会铺满整个输入框，很容易被当成"输入框坏了"；
 *  - 浏览器自动填充的整块底色/闪烁动画一并压掉（字段名已用 new-password 规避触发）。
 */
.re-cron :deep(.el-input__inner)::selection {
  background: var(--el-fill-color-dark, #dcdfe6);
  color: var(--el-text-color-primary);
}

.re-cron :deep(.el-input__inner:-webkit-autofill),
.re-cron :deep(.el-input__inner:-webkit-autofill:hover),
.re-cron :deep(.el-input__inner:-webkit-autofill:focus) {
  -webkit-box-shadow: 0 0 0 1000px var(--el-bg-color, #ffffff) inset !important;
  -webkit-text-fill-color: var(--el-text-color-primary) !important;
  caret-color: var(--el-text-color-primary);
}

/*
 * 背景色过渡一律置零，而不是用常见的 `background-color 999999s` trick。
 *
 * 那条 trick（给过渡一个近乎无穷的时长，让 Chrome 以为"你已处理过"）有个反效果：
 * 过渡时长会**接住此后每一次背景色变化**并摊到 999999 秒上，于是浏览器/扩展画的
 * 底色变成肉眼可辨的极慢漂移 —— 正是「cron 输入框没数据时紫色在缓慢呼吸」的成因：
 * 按键/失焦/自动填充每次改一次背景，就多一段看不见起止的渐变。
 *
 * `transition: none` 是斩断而不是掩盖：底色该由谁画由谁画，但不再被拉成慢动画。
 *
 * 这里**不能**加 `background-clip: text`：它把背景限制在字形内，输入框聚焦时
 * placeholder 恰好被浏览器按文本渲染，于是上面 ::selection 的选区色会以
 * 「贴在字上」的形式糊住整个输入框 —— 就是截图里 cron 输入框那圈紫色。
 * autofill 已由上面那条 1000px inset 盖住，不需要它。
 */
.re-cron :deep(.el-input__inner) {
  transition: none !important;
}

.re-cron :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

/*
 * 弹层/弹窗没走 :deep 而是全局块（见文件末尾），这里只留输入框自身的过渡压制。
 * 曾用来压 ElPopover 的 zoom 动画与 ReTab 滑块/胶囊过渡，那两处随新结构一并去掉。
 */

.re-cron__gear {
  margin: 0 !important;
  padding: 0 8px;
}

/* 清除按钮：跟着输入框的内边距走，尺寸对齐 EP 的 14px 图标。 */
.re-cron__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 24×24 而不是贴着 14px 图标：WCAG 2.2 的最小命中区是 24px。
     视觉上只多出 4px 透明边距，图标尺寸不变。 */
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-text-color-placeholder, #a8abb2);
  cursor: pointer;
}

.re-cron__clear:hover,
.re-cron__clear:focus-visible {
  color: var(--el-text-color-regular, #606266);
}

.re-cron__clear-icon {
  width: 14px;
  height: 14px;
}

.re-cron__status {
  margin-top: 4px;
  /* 固定高度：合法/非法/预览文案切换时不再把输入框顶来顶去 */
  min-height: 18px;
  font-size: 12px;
  line-height: 1.5;
}

.re-cron__status.is-ok {
  color: var(--el-color-success, #67c23a);
}

.re-cron__status.is-warn {
  color: var(--el-text-color-secondary, #909399);
}

.re-cron__dot {
  margin: 0 4px;
}

/* 状态行里的"面板与表达式有落差"提示：用警示色，与合法的绿色区分开 */
.re-cron__status-warn {
  color: var(--el-color-warning, #e6a23c);
}

/* ---------- 弹层内容（按 UI 稿：标题行 → 表达式 → 下次触发 / 常用预设 → 自定义字段 → 底栏） ---------- */

/*
 * 匹配方式胶囊（字段模式）：普通态描边，选中态主色实底。
 * 圆角与预设行同用 md，合并声明 —— 视觉防漂移门禁按 border-radius 声明数计数。
 */
.re-cron__pill,
.re-cron__preset {
  border-radius: var(--el-radius-md, 8px);
}

.re-cron__pill {
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-bg-color, #ffffff);
  color: var(--el-text-color-regular, #606266);
  font-family: inherit;
  font-size: 11px;
  line-height: 22px;
  cursor: pointer;
}

.re-cron__pill.is-active {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  color: var(--el-color-white, #ffffff);
}

.re-cron__pill:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 「更多 / 收起」是动作不是取值：虚线边 + 次要色，避免被误当成一个 cron 预设 */
.re-cron__pill--more {
  border-style: dashed;
  color: var(--el-text-color-secondary, #909399);
}

/* 预设行：标题定宽不折行，胶囊区自己换行 */
.re-cron__preset-bar {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.re-cron__preset-title {
  flex: none;
  padding-top: 5px;
  color: var(--el-text-color-regular, #606266);
  font-size: 12px;
  white-space: nowrap;
}

.re-cron__preset-bar .re-cron__pill-row {
  flex: 1;
  min-width: 0;
}

/* 编辑面板用 md 圆角（门禁按 border-radius 声明数计数，别再拆出同值新规则） */
.re-cron__editor {
  border-radius: var(--el-radius-md, 8px);
}

.re-cron__editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
  padding: 14px;
  background: var(--el-fill-color-light, #f5f7fa);
}

.re-cron__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
}

.re-cron__dash {
  color: var(--el-text-color-secondary, #909399);
}

.re-cron__raw {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /*
   * flex-wrap + 给 hint 一个基准宽度：早先这里是「提示文字 + 重建按钮」一行 flex，
   * 但 hint 作为 flex item 没有 min-width/flex-basis，按钮又把可用空间吃掉大半，
   * 结果文字被压到一两字宽、竖着排成 20 行（实测整块 286px）——
   * 光这一个块就吃掉弹层高度的四成。允许换行并给 hint 基准宽度后回到两行。
   */
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.re-cron__raw .re-cron__hint {
  flex: 1 1 180px;
  min-width: 0;
}

.re-cron__raw :deep(.el-button) {
  flex: none;
}

.re-cron__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.re-cron__note {
  line-height: 1.5;
}

/* 未来触发：整块收进一张描边卡片，行间虚线分隔。
   卡片底色走 --el-bg-color 而不是 transparent：弹层背景是白，卡片要靠底色差
   与右侧编辑区拉开层次，暗色主题下 --el-bg-color 自动落到深色。 */
.re-cron__times {
  margin: 0;
  padding: 0;
  list-style: none;
}

.re-cron__times li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter, #ebeef5);
}

/* 未来触发：第一条是"最近一次"，给一点强调，其余保持同样的行距 */
.re-cron__times li:first-child .re-cron__times-text {
  color: var(--el-text-color-primary, #303133);
  font-weight: 600;
}

/*
 * 日历模式下的触发预览压成一行横排（字段模式仍是竖列表）。
 *
 * 竖排卡片 5 次触发要 106px —— 光这一块就吃掉弹层（可用 ~420px）的四分之一，
 * 底下的「应用此时间」和「保存」只能靠滚动才够得到。改成「标题 + 时间横排、
 * 放不下就横向裁掉」后只占 ~24px，信息（最近几次什么时候跑）一点没少。
 */
.re-cron__cal-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.re-cron__cal-preview .re-cron__section-title {
  flex: none;
  margin-bottom: 0;
  white-space: nowrap;
}

.re-cron__cal-preview .re-cron__times {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  gap: 14px;
  min-width: 0;
  overflow: hidden;
}

.re-cron__cal-preview .re-cron__times li,
.re-cron__cal-preview .re-cron__times--empty {
  flex: none;
  padding: 0;
  border-bottom: 0;
}

.re-cron__times-text {
  color: var(--el-text-color-primary, #303133);
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 13px;
  white-space: nowrap;
}

/* 相对时间胶囊：与左侧时刻并排，一眼回答"等多久" */
.re-cron__times-rel {
  flex: none;
  padding: 2px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light, #f4f4f5);
  color: var(--el-text-color-secondary, #909399);
  font-size: 11px;
  line-height: 1.5;
  white-space: nowrap;
}

/* 空态只有一行文案，卡片内边距给足，别贴着描边 */
.re-cron__times--empty {
  padding: 14px 0;
  color: var(--el-color-danger, #f56c6c);
  font-family: inherit;
}

/* 底栏：左侧提示、右侧取消/保存 */
.re-cron__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.re-cron__footer-hint {
  /* 单行省略：底栏与「保存」同高是硬要求，提示语一换行就把这一行撑成两行，
     按钮被顶到面板边缘。日历模式下这一格只有 ~90px，"表达式已按原文保留…"
     必然放不下 —— 它是补充说明，完整的同一句话也在摘要区说过一次。 */
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary, #909399);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/*
 * 真异常（表达式非法）才用危险色。
 * 「留空表示不设置调度」是正常状态（用户就是不想定周期），用中性色 —— 与非法共用
 * 红色会把"没设置"渲染得像报错，空表单打开时尤其刺眼。
 * 取舍记录：UI 稿画的是红字，这里改回中性色；需要提醒时用下方 is-attention。
 */
.re-cron__footer-hint.is-error {
  color: var(--el-color-danger, #f56c6c);
}

.re-cron__footer-hint.is-info {
  color: var(--el-text-color-secondary, #909399);
}

/* 「本该有周期却是空的」这类需要用户决策、但还没到报错的提醒（未启用却已配周期时用） */
.re-cron__footer-hint.is-attention {
  color: var(--el-color-warning, #e6a23c);
}

.re-cron__footer-actions {
  display: flex;
  gap: 8px;
  flex: none;
}
</style>

<style lang="scss">
/*
 * 调度周期 Popover 外壳（teleport 到 body 后由 Element Plus 渲染，scoped 管不到）：
 *  - 去动效：整棵子树不做动画/过渡。原先针对 ElDialog 写，Popover 的弹出缩放
 *    同样会被这棵子树覆盖到，所以选择器换掉即可，策略不变；
 *  - 内边距/圆角/投影继续用 koi 与 EP 的 --el-popover-* 令牌，不写死像素；
 *  - 内容区样式全在 scoped 里，这里只管外壳。
 */
.re-cron__popper,
.re-cron__popper *,
.re-cron__popper *::before,
.re-cron__popper *::after {
  animation: none !important;
  transition: none !important;
}

/*
 * 尺寸只能挂 .re-cron__popper 本身。
 *
 * 早先写的是 `.re-cron__popper.el-popover` —— 但 EP 的 ElPopover 渲染出的根元素
 * class 是 `el-popper`（`el-popover` 这个类在别处/不存在），组合选择器匹配不到，
 * 于是 max-height / overflow 一直是死代码，弹层才会直接伸出屏幕外。
 */
.re-cron__popper {
  /*
   * 定位交给 floating-ui（placement="bottom-start"）：浮层只有当前字段编辑器
   * 一块，天然贴着触发条就该出现在它下面。
   *
   * 此前用 `position: fixed; top: 8px; left: 50%` 硬接管、贴顶居中，
   * 是为那块"六字段 + 预设 + 预览"的大面板选的（它比视口一半还高，放不下）。
   * 现在面板只展开一段，内容高 ~200px，硬接管反而会让它飘到屏幕顶部正中、
   * 与点的那一段胶囊对不上 —— 归属关系比"尽量不滚动"更要紧。
   */
  max-width: min(94vw, 380px);
  padding: 10px 12px;
  border-radius: var(--el-popover-border-radius, var(--el-radius-lg, 12px));
  /* 兜「视口本身不够高」的极端情况：正常内容 ~200px，永远碰不到 */
  max-height: calc(100vh - 24px);
  overflow-y: auto;
}

/*
 * reference 挂的是整条 .re-cron__line，而它带着 scoped 标记。
 * Popover 的 #reference 走 ElOnlyChild，会把该节点搬到 popper 的 popper 容器旁
 * （只做 DOM 位置调整，节点本身不搬家），作用域标记保持不变，所以内部样式照旧命中。
 * 这里只补一条：line 本身要能撑满，Popover 以它量尺寸，宽度塌掉会导致弹层错位。
 */
.re-cron__line {
  width: 100%;
}
</style>
