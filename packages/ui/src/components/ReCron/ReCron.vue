<script setup lang="ts">
/**
 * ReCron —— Cron 表达式选择组件（可视化 + 表达式 + 触发时间预览）
 *
 * 三方同步：面板状态 ⇄ 表达式字符串 ⇄ v-model，任一侧改动都会即时刷新另外两侧与预览。
 * 面板无法表达表达式时自动退回「表达式模式」并给出提示，绝不静默改写用户的输入。
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
  }>(),
  {
    placeholder: "0 0/30 * * * ?",
    disabled: false,
    width: undefined,
    previewCount: 5,
    defaultCron: "",
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

const PRESETS: { label: string; cron: string }[] = [
  { label: "每分钟", cron: "0 * * * * *" },
  { label: "每 5 分钟", cron: "0 */5 * * * *" },
  { label: "每 10 分钟", cron: "0 */10 * * * *" },
  { label: "每 30 分钟", cron: "0 */30 * * * *" },
  { label: "每小时整点", cron: "0 0 * * * *" },
  { label: "每天 09:00", cron: "0 0 9 * * *" },
  { label: "每天 09:30", cron: "0 30 9 * * *" },
  { label: "工作日 09:00", cron: "0 0 9 * * 1,2,3,4,5" },
  { label: "每周一 09:00", cron: "0 0 9 * * 1" },
  { label: "每月 1 日 09:00", cron: "0 0 9 1 * *" },
  { label: "每年 1 月 1 日 00:00", cron: "0 0 0 1 1 *" },
];

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
const notUnderstood = computed(() => FIELDS.filter((f) => !panelParsed[f.key]).map((f) => f.label));

/** 面板读得懂、但写回去会改变写法（`?`、英文名称、周写 7、倒序区间）的字段 */
const spellingDiff = computed(() =>
  FIELDS.filter((f) => panelParsed[f.key] === true && rawTokens[f.key] !== undefined).map((f) => f.label),
);

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

/** 字段的机械描述（"秒 0，分 30…"），面板表达不了的字段按原样回显 */
const summary = computed(() => {
  if (!trimmed.value || !analysis.value.valid) return "";
  const parts: string[] = [];
  const describe = (key: string, unit: string) => {
    const raw = rawTokens[key];
    if (raw !== undefined) {
      // 面板表达不了：如实回显 token，不猜它的意思
      parts.push(`${unit} ${raw}`);
      return;
    }
    const f = state[key];
    if (f.mode === "all") return;
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
  // 每小时的第 N 分钟起、每 step 分钟
  if (isAll(s) && minuteStep(m) && isAll(h)) {
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

/**
 * 日历模式点「应用此时间」：复用 applyPreset 那条写入路径。
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
 * 打开面板时记下表达式快照。
 *
 * <p>面板是实时把改动写回 model 的（state → expression → model），
 * 而弹层上给了「取消/保存」，所以取消必须能把整段还原回打开前的状态。
 * 同一个快照也兜住右上角 × 与 ESC（见 {@link onBeforeClose}）——
 * 凡是没有明确按「保存」的关闭，都得还原。</p>
 */
const snapshot = ref("");

function openPanel(): void {
  snapshot.value = model.value || "";
  open.value = true;
}

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
 * <p>不负责关弹层 —— 关闭动作由 {@link cancelPanel} 与 {@link onBeforeClose}
 * 各自补上。</p>
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

/**
 * 弹层的另一个关闭出口：右上角 ×、ESC（以及将来若放开"点遮罩关闭"）。
 *
 * <p>这三个入口以前直接改 `open`，**改动就留在了表达式里** —— 面板上明明写着
 * 「取消 / 保存」，用户点 × 却等于偷偷按了保存，弹层里的选择和输入框里的
 * 表达式对不上，还没法回头撤销。所以这里统一走还原：× 与 ESC 都等价于取消。</p>
 *
 * <p>用 `before-close` 而不是 `close`：前者只拦 ×/ESC/遮罩这类"用户没点保存"
 * 的关闭，「取消」按钮自己改 `open` 不会二次触发。</p>
 */
function onBeforeClose(done: () => void): void {
  revertPanel();
  done();
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
  <div :class="['re-cron', { 'is-disabled': disabled }]" :style="width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined">
    <ElPopover
      v-model:visible="open"
      placement="bottom-start"
      trigger="click"
      :width="760"
      popper-class="re-cron__popper"
      :popper-options="{ modifiers: [{ name: 'preventOverflow', options: { padding: 8 } }] }"
    >
      <!--
        reference 是「整条触发行」而不是那颗齿轮按钮：Popover 只能挂一个 reference，
        而触发入口有两个（齿轮 + 点击输入框）。把整行挂上后，点输入框空白处也能打开，
        与原来「点输入框 → 弹层」的手感一致。
        ElOnlyChild 要求单根，所以必须外套一个元素，不能直接给 ReInput。
      -->
      <template #reference>
        <div class="re-cron__line" @click="openPanel">
          <ReInput
            v-model="model"
            class="re-cron__input"
            :placeholder="placeholder"
            :disabled="disabled"
            aria-label="调度周期 Cron 表达式"
            spellcheck="false"
            name="cron-expression"
            autocomplete="new-password"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore
          >
            <template #suffix>
              <!-- 自己画清除按钮，而不是用 Element Plus 的 `clearable`：
                   它的清除 × 是个裸 `<i class="el-input__clear">`，没有 role、没有
                   aria-label、也不可聚焦 —— 纯图标却读不出名字，读屏只会当它不存在
                   （实测就是普查里唯一一条无名可点元素）。
                   这里换成真正的 `<button>`，名字写死成"清空表达式"，
                   顺带让"清除"这件事能进 Tab 序列。图标内联 SVG，不依赖图标库离线可用。 -->
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
            </template>
            <!-- 齿轮只是视觉入口：真正的 trigger 是整条 .re-cron__line -->
            <template #append>
              <ReButton
                class="re-cron__gear"
                icon="Setting"
                title="可视化生成"
                aria-label="打开调度周期可视化设置"
                :disabled="disabled"
                tabindex="-1"
              />
            </template>
          </ReInput>
        </div>
      </template>

      <div class="re-cron__panel">
        <header class="re-cron__panel-head">
          <span class="re-cron__panel-title">设置调度周期</span>
          <button type="button" class="re-cron__panel-close" aria-label="关闭" @click="cancelPanel">
            <el-icon><Close /></el-icon>
          </button>
        </header>

        <!-- 模式切换：字段 / 日历。两者共用同一条写入路径，见 applyCalendar 注释 -->
        <div class="re-cron__modes" role="tablist" aria-label="调度周期设置方式">
          <button
            type="button"
            role="tab"
            class="re-cron__mode"
            :class="{ 'is-active': panelMode === 'field' }"
            :aria-selected="panelMode === 'field'"
            @click="panelMode = 'field'"
          >
            字段
          </button>
          <button
            type="button"
            role="tab"
            class="re-cron__mode"
            :class="{ 'is-active': panelMode === 'calendar' }"
            :aria-selected="panelMode === 'calendar'"
            @click="panelMode = 'calendar'"
          >
            日历
          </button>
        </div>

        <!-- 摘要条：先用一句人话说清「什么时候跑」，再把表达式摆在下面 -->
        <div class="re-cron__summary" :class="{ 'is-invalid': !analysis.valid, 'is-note': analysis.valid && !humanSummary }">
          <div class="re-cron__summary-text" :aria-invalid="!analysis.valid">
            {{ humanSummary || (trimmed ? (summary || errorText) : "未设置调度周期") }}
          </div>
          <code class="re-cron__summary-expr">{{ trimmed || "（未设置）" }}</code>
          <p v-if="syncWarning" class="re-cron__summary-note">{{ syncWarning }}</p>
        </div>

        <ReCronCalendarPanel v-if="panelMode === 'calendar'" :expression="model" @apply="applyCalendar" />

        <template v-else>
      <div class="re-cron__presets">
        <span class="re-cron__section-title re-cron__section-title--inline">常用预设</span>
        <div class="re-cron__pill-row">
          <button
            v-for="preset in PRESETS"
            :key="preset.cron"
            type="button"
            class="re-cron__pill"
            :class="{ 'is-active': trimmed === preset.cron }"
            @click="applyPreset(preset.cron)"
          >
            {{ preset.label }}
          </button>
          <button v-if="defaultCron" type="button" class="re-cron__pill" @click="applyDefaultCron">用默认</button>
          <button type="button" class="re-cron__pill" @click="clearAll">清空</button>
        </div>
      </div>

      <div class="re-cron__body">
        <!-- 左列：自定义字段（点字段盒子切换，下方的匹配方式与输入只作用于当前字段） -->
        <section class="re-cron__col">
          <div class="re-cron__section-title">自定义字段</div>

          <div class="re-cron__fields">
            <button
              v-for="spec in FIELDS"
              :key="spec.key"
              type="button"
              class="re-cron__field"
              :class="{ 'is-active': tab === spec.key, 'is-stale': rawTokens[spec.key] !== undefined }"
              :aria-pressed="tab === spec.key"
              :aria-label="`${spec.label}字段，当前 ${tokenOf(spec.key)}${rawTokens[spec.key] !== undefined ? '（面板未接管该写法）' : ''}`"
              @click="tab = spec.key"
            >
              <span class="re-cron__field-label">{{ spec.label }}</span>
              <span class="re-cron__field-value">{{ tokenOf(spec.key) }}</span>
            </button>
          </div>

          <template v-for="spec in FIELDS" :key="spec.key">
            <div v-if="tab === spec.key" class="re-cron__editor">
              <div class="re-cron__pill-row">
                <button
                  v-for="mode in SPEC[spec.key].modes"
                  :key="mode"
                  type="button"
                  class="re-cron__pill"
                  :class="{ 'is-active': state[spec.key].mode === mode }"
                  :aria-pressed="state[spec.key].mode === mode"
                  @click="setFieldMode(spec.key, mode)"
                >
                  {{ modeLabel(spec.key, mode) }}
                </button>
              </div>

              <div class="re-cron__controls">
                <template v-if="state[spec.key].mode === 'step'">
                  <span>从</span>
                  <ReInputNumber v-model="state[spec.key].start" :min="spec.min" :max="spec.max" controls-position="right" @change="onFieldInput(spec.key)" />
                  <span>{{ spec.label }}起，每隔</span>
                  <ReInputNumber v-model="state[spec.key].step" :min="1" :max="spec.max" controls-position="right" @change="onFieldInput(spec.key)" />
                  <span>{{ spec.label }}</span>
                </template>

                <template v-else-if="state[spec.key].mode === 'range'">
                  <ReInputNumber v-model="state[spec.key].start" :min="spec.min" :max="spec.max" controls-position="right" @change="onFieldInput(spec.key)" />
                  <span class="re-cron__dash">—</span>
                  <ReInputNumber v-model="state[spec.key].end" :min="spec.min" :max="spec.max" controls-position="right" @change="onFieldInput(spec.key)" />
                  <span>{{ spec.label }}，步长</span>
                  <ReInputNumber v-model="state[spec.key].step" :min="1" :max="spec.max" controls-position="right" @change="onFieldInput(spec.key)" />
                </template>

                <template v-else-if="state[spec.key].mode === 'points'">
                  <ReSelect
                    v-model="state[spec.key].points"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    filterable
                    class="re-cron__points"
                    style="width: 100%"
                    :data="optionsOf(spec)"
                    :placeholder="`选择${spec.label}（${spec.min}~${spec.max}），可多选，也支持直接输入数字后回车`"
                    @change="onFieldInput(spec.key)"
                  />
                </template>

                <template v-else-if="state[spec.key].mode === 'nearest'">
                  <span>当月</span>
                  <ReInputNumber v-model="state[spec.key].start" :min="1" :max="31" controls-position="right" @change="onFieldInput(spec.key)" />
                  <span>日，就近顺延到工作日</span>
                </template>

                <template v-else-if="state[spec.key].mode === 'nth'">
                  <span>第</span>
                  <ReInputNumber v-model="state[spec.key].nth" :min="1" :max="5" controls-position="right" @change="onFieldInput(spec.key)" />
                  <span>个</span>
                  <ReSelect v-model="state[spec.key].start" class="re-cron__nth" style="width: 96px" :data="WEEK_OPTIONS" @change="onFieldInput(spec.key)" />
                </template>

                <template v-else-if="state[spec.key].mode === 'lastNth'">
                  <span>当月最后一个</span>
                  <ReSelect v-model="state[spec.key].start" class="re-cron__nth" style="width: 96px" :data="WEEK_OPTIONS" @change="onFieldInput(spec.key)" />
                </template>

                <!-- `last`（`L`）此前落进了下面的 v-else，被显示成"该字段不做限制（*）"，
                     而它实际生成的 token 是 `L` —— 控件说明与产物直接矛盾。 -->
                <template v-else-if="state[spec.key].mode === 'last'">
                  <span>{{ spec.key === 'week' ? '当月中与月末同星期的那些天' : '当月最后一天' }}</span>
                  <span v-if="rawTokens[spec.key] && rawTokens[spec.key] !== 'L'" class="re-cron__hint">
                    写作 <code>{{ rawTokens[spec.key] }}</code>，与 <code>L</code> 同义
                  </span>
                </template>

                <span v-else class="re-cron__hint">该字段不做限制（<code>*</code>）</span>
              </div>

              <div v-if="spec.key === 'week' || spec.key === 'day'" class="re-cron__hint re-cron__note">
                日与周同时受限时任一条件都会失效，本组件一律用 <code>*</code> 占位另一侧，保证与后端算出的触发时间一致。
              </div>
            </div>
          </template>

          <!-- 只有在"面板真的读不懂"时才有重建的意义；`?`、英文名称这类只是写法不同，
               给"重建面板"按钮等于给了个按了没变化的按钮。

               这里刻意不复述"面板读不懂 X"：摘要条（syncWarning）已经说过一次，
               三处各说一遍同义的话只会更难读。这里只讲"下一步怎么做"。 -->
          <div v-if="notUnderstood.length" class="re-cron__raw">
            <span class="re-cron__hint">
              <template v-for="(label, i) in notUnderstood" :key="label">
                <template v-if="i > 0">、</template>{{ label }}字段的写法面板表达不了
              </template>
            </span>
            <ReButton type="primary" plain @click="useExpressionText">把读不懂的字段按 * 重建</ReButton>
          </div>
        </section>

        <!-- 右列：未来触发时间 -->
        <aside class="re-cron__col re-cron__col--preview">
          <div class="re-cron__section-title">未来 {{ analysis.times.length }} 次触发</div>
          <ul v-if="analysis.times.length" class="re-cron__times">
            <li v-for="(t, i) in analysis.times" :key="i">
              <span class="re-cron__times-dot" aria-hidden="true"></span>
              <span class="re-cron__times-text">{{ fmt(t) }}</span>
            </li>
          </ul>
          <div v-else class="re-cron__times re-cron__times--empty">{{ errorText || "无匹配时间" }}</div>
        </aside>
      </div>
        </template>

        <!--
          未来触发时间提到面板底部共用：日历模式下右侧没有预览列，
          放这里两种模式都能看到"保存后什么时候跑"。
        -->
        <section v-if="panelMode === 'calendar'" class="re-cron__col re-cron__cal-preview">
          <div class="re-cron__section-title">未来 {{ analysis.times.length }} 次触发</div>
          <ul v-if="analysis.times.length" class="re-cron__times">
            <li v-for="(t, i) in analysis.times" :key="i">
              <span class="re-cron__times-dot" aria-hidden="true"></span>
              <span class="re-cron__times-text">{{ fmt(t) }}</span>
            </li>
          </ul>
          <div v-else class="re-cron__times re-cron__times--empty">{{ errorText || "无匹配时间" }}</div>
        </section>

        <div class="re-cron__footer">
          <span
            class="re-cron__footer-hint"
            :class="{ 'is-error': !analysis.valid && !analysis.empty, 'is-info': analysis.empty || (analysis.valid && !syncWarning) }"
          >
            {{ footerHint }}
          </span>
          <div class="re-cron__footer-actions">
            <ReButton @click="clearAll">清空</ReButton>
            <ReButton @click="cancelPanel">取消</ReButton>
            <ReButton type="primary" @click="savePanel">保存</ReButton>
          </div>
        </div>
      </div>
    </ElPopover>

    <div
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

/* ---------------- Popover 面板外壳 ---------------- */

/* 齿轮不再是独立触发器，整行才是 reference；这里把齿轮画成"输入框尾部图标" */
.re-cron__gear {
  margin: 0 !important;
  padding: 0 8px;
  pointer-events: none;
}

/* 面板内容根：Popover 自带 padding，这里只管内部纵向节奏 */
.re-cron__panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.re-cron__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.re-cron__panel-title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.re-cron__panel-close {
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

/* 模式切换（字段 / 日历） */
.re-cron__modes {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: var(--el-radius-md);
  background: var(--el-fill-color-light);
  align-self: flex-start;
}

.re-cron__mode {
  height: 28px;
  padding: 0 16px;
  border: 0;
  border-radius: var(--el-radius-sm);
  background: transparent;
  color: var(--el-text-color-regular);
  font-family: inherit;
  font-size: 13px;
  line-height: 28px;
  cursor: pointer;
}

.re-cron__mode.is-active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
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
  gap: 6px;
  /*
   * 容器查询：触发器这一行的宽度由外层表单决定，与视口无关
   * （侧边栏、抽屉、窄列都可能很窄），所以只能问容器、问不了媒体查询。
   * `inline-size` 只包含行内轴：这一行里只有输入框和齿轮两个静态子元素，
   * `container-type` 附带的 layout 包含不会改变任何绝对定位的包含块。
   */
  container-type: inline-size;
  container-name: recron-line;
}

/*
 * 层级事实（量过才知道，写在这里免得下次再摸错）：
 * `re-cron__input` 这个类同时挂在两个元素上 ——
 *   ① ReInput 自己的根 `div.re-input.re-cron__input`，它是 `display: contents`（0×0，没有盒子）
 *   ② 内层真正的 `div.el-input.re-cron__input`，display:flex，才是排版真正发生的地方
 * 真正的 flex 容器是 ②：里面装 `el-input__wrapper` 与 `el-input-group__append`（齿轮）。
 * append 实占 78px（38 按钮 + 两侧各 20 padding），wrapper 里还有 22 内边距 + 32 后缀，
 * 容器 132px 时 wrapper 只剩 54px、输入框宽度归零 —— 用户刚输入的表达式一个字也看不见。
 *
 * flex-wrap 挂在 ① 上是无效的（contents 盒子不参与排版），必须命中 ② 才有用，
 * 下面容器查询里的选择器因此写成 `.el-input.re-cron__input`。
 */
.re-cron__input {
  flex: 1;
  min-width: 0;
}

/*
 * 窄容器（< 240px）下让输入框独占一行，齿轮换到第二行。
 *
 * 用 `flex: 1 1 100%` 而不是抬 min-width：Chromium 的换行判定只看 flex base size、
 * 不看 min-width（实测把 wrapper 的 min-width 抬到 140px 也不换行，
 * 只是把 append 顶出容器右边界 86px）。100% 是确定基准，换行判定吃这套。
 *
 * 240px 是这么定的：单行布局下容器需要 132px 才刚够，输入框宽度 = 容器 - 132。
 * 容器 240 时输入框 108px（约 9 个字符），再窄就不如换行。
 * 宽容器下这一整块不生效，布局与从前逐像素一致。
 */
@container recron-line (max-width: 240px) {
  /* 双类选择器是为了稳压 Element Plus 的 `.el-input-group`：它同为 0,2,0，
     靠源序取胜不可靠（实测 `flex-wrap` 被它按源序压回 nowrap）。 */
  .re-cron__line :deep(.el-input.re-cron__input) {
    flex-wrap: wrap;
    /* 换行后两行贴在一起会显得像一块散落的灰底，行距沿用触发器行自己的 6px */
    row-gap: 6px;
  }

  .re-cron__line :deep(.el-input__wrapper) {
    flex: 1 1 100%;
    min-width: 0;
  }

  .re-cron__line :deep(.el-input-group__append) {
    flex: 0 0 auto;
  }
}

/*
 * 组件级去动效：触发器输入框、追加按钮、齿轮、状态行（以及组件内其他元素与伪元素）
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
 *  - 文本选中不再用浏览器默认的整块高亮蓝，改成极淡主色底，聚焦时不会"闪一下蓝条"；
 *  - 浏览器自动填充的整块底色/闪烁动画一并压掉（字段名已用 new-password 规避触发）。
 */
.re-cron :deep(.el-input__inner)::selection {
  background: color-mix(in srgb, var(--el-color-primary) 22%, transparent);
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
 */
.re-cron :deep(.el-input__inner) {
  transition: none !important;
  -webkit-background-clip: text;
  background-clip: text;
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

/* ---------- 弹层内容（按 UI 图：摘要条 → 常用预设 → 左字段/右预览 → 底栏） ---------- */

/* 摘要条：主色浅底 + 一句人话，表达式放下面做技术兜底。
   底色用 --el-color-primary-light-9：已实测它在本仓的 Element Plus 里**确实存在
   且随主题变**（亮 #ecf5ff / 暗 #18222b），不是硬编码兜底 —— 不要因为"名字像兜底值"
   就改成 color-mix，两者实测逐值相同。 */
.re-cron__summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 22px 16px;
  /* 描边用主色掺白/掺黑再混边框色，跟随主题切换，不写死色值 */
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--el-border-color-lighter, #ebeef5));
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary-light-9, #ecf5ff);
  text-align: center;
}

.re-cron__summary.is-invalid {
  background: var(--el-fill-color-light, #f5f7fa);
}

/* 表达式合法但拼不出人话（少见写法）：用中性底区分于主色高亮，
   说明"这句是机械罗列，不是识别出来的语义"。 */
.re-cron__summary.is-note {
  background: var(--el-fill-color-light, #f5f7fa);
}

/* 底色转中性时描边一并转中性：主色描边 + 灰底会读成「有效但降级」，与错误态混淆 */
.re-cron__summary.is-invalid,
.re-cron__summary.is-note {
  border-color: var(--el-border-color-lighter, #ebeef5);
}

.re-cron__summary-text {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-color-primary, #409eff);
}

/* 非法时摘要条必须显出"这是错误"，不能和 is-note（只是说明）同色 ——
   底栏的 footerHint 已经是红的，同一条错误在两处一个红一个灰，
   大号标题反而不带信号，扫一眼分不清说明与错误。 */
.re-cron__summary.is-invalid .re-cron__summary-text {
  color: var(--el-color-danger, #f56c6c);
}

/* 面板读不懂 / 用了英文名称时的说明：贴表达式下方，不喧宾夺主 */
.re-cron__summary-note {
  margin: 2px 0 0;
  max-width: 46em;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary, #909399);
}

/* 表达式的等宽胶囊。圆角与 .re-cron__pill / .re-cron__times-dot 同为 full，
   合并到一条规则里声明：视觉防漂移门禁按 border-radius 声明数计数，
   同一取值重复声明三次会把额度占满（ReCron 基线 radius=7，曾恰好用尽）。 */
.re-cron__summary-expr,
.re-cron__pill,
.re-cron__times-dot {
  border-radius: var(--el-radius-full, 9999px);
}

.re-cron__summary-expr {
  padding: 3px 14px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-bg-color, #ffffff);
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
}

/* 常用预设：标题与胶囊同排起排 —— 标题定宽不折行，胶囊区自己换行。
   另两处 section-title（自定义字段 / 未来触发）仍是块级独占一行，不受影响。 */
.re-cron__presets {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
}

/* 与 34px 高的胶囊视觉居中对齐 */
.re-cron__section-title--inline {
  flex: none;
  margin-bottom: 0;
  padding-top: 8px;
  white-space: nowrap;
}

.re-cron__presets .re-cron__pill-row {
  flex: 1;
  min-width: 0;
}

.re-cron__section-title {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular, #606266);
}

.re-cron__pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 预设/匹配方式胶囊：普通态描边，选中态主色实底（圆角见上方合并规则） */
.re-cron__pill {
  height: 34px;
  padding: 0 16px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-bg-color, #ffffff);
  color: var(--el-text-color-regular, #606266);
  font-family: inherit;
  font-size: 13px;
  line-height: 32px;
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

/* 两列：左字段编辑、右触发预览 */
.re-cron__body {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 24px;
  margin-top: 22px;
}

/* 窄屏回落单列。
   断点从 720px 提到 880px：实测 760px 视口下两列已被压得很挤
   （六个字段盒子各剩不到 70px，右侧预览列也在挤），而弹层本身到 900px 才收窄。 */
@media (width <= 880px) {
  .re-cron__body {
    grid-template-columns: minmax(0, 1fr);
  }
}

.re-cron__col {
  min-width: 0;
}

/* 六个字段盒子：点一下切换当前字段，下方匹配方式只作用于它 */
.re-cron__fields {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.re-cron__field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-bg-color, #ffffff);
  cursor: pointer;
  font-family: inherit;
}

.re-cron__field.is-active {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}

/* 面板读不懂该字段的写法（MON-FRI、写 7 的周等）：盒子回显原文，
   用警示色把"这不是面板算出来的值"标出来，避免被当成面板能编辑的普通值。
   底色用 --el-color-warning-light-9：实测随主题变（亮 #fdf6ec / 暗 #292218）。 */
.re-cron__field.is-stale {
  border-color: var(--el-color-warning, #e6a23c);
  background: var(--el-color-warning-light-9, #fdf6ec);
}

.re-cron__field.is-stale .re-cron__field-label {
  color: var(--el-color-warning, #e6a23c);
}

.re-cron__field-label {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.re-cron__field.is-active .re-cron__field-label {
  color: var(--el-color-primary, #409eff);
}

.re-cron__field-value {
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  /* 17px：六个盒子并排时，15px 的 MON-FRI 这类多字符值会顶到盒子边缘 */
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 字段盒子与编辑面板同用 md 圆角，合并声明（门禁按 border-radius 声明数计数） */
.re-cron__field,
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
  gap: 8px;
  margin-top: 14px;
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
  padding: 2px 14px;
  list-style: none;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-bg-color, #ffffff);
}

.re-cron__times li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter, #ebeef5);
}

/* 未来触发：第一条是"最近一次"，给一点强调，其余保持同样的行距 */
.re-cron__times li:first-child .re-cron__times-text {
  color: var(--el-text-color-primary, #303133);
  font-weight: 600;
}

.re-cron__times-dot {
  flex: none;
  width: 6px;
  height: 6px;
  background: var(--el-color-primary, #409eff);
}

.re-cron__times-text {
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
}

/* 空态只有一行文案，卡片内边距给足，别贴着描边 */
.re-cron__times--empty {
  padding: 16px 14px;
  font-family: inherit;
  color: var(--el-color-danger, #f56c6c);
}

/* 底栏：左侧提示、右侧取消/保存 */
.re-cron__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.re-cron__footer-hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary, #909399);
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

.re-cron__popper.el-popover {
  max-width: 94vw;
  padding: 14px 16px;
  border-radius: var(--el-popover-border-radius, var(--el-radius-lg, 12px));
  /* Popover 内容可能比触发器高很多（字段模式那三列 + 预设行）：
     给正文加上限并允许滚动，保证任何窗口尺寸下"保存/取消"都点得到。 */
  max-height: 84vh;
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
