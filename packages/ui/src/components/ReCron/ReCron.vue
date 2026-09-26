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
import { computed, reactive, ref, watch } from "vue";
import { ElPopover } from "element-plus";
import { CronExpression } from "@repo/utils";
import ReButton from "../ReButton";
import ReInput from "../ReInput";
import ReInputNumber from "../ReInputNumber";
import ReSelect from "../ReSelect";
import type { ReOption } from "../ReSelect/types";
import ReTab from "../ReTab";
import type { ReTabItem } from "../ReTab/types";

defineOptions({ name: "ReCron", inheritAttrs: true });

type FieldMode = "all" | "step" | "range" | "points" | "last" | "nearest" | "nth";

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

/** 周字段数值语义与服务端一致：0=周日 … 6=周六 */
const WEEK_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

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
  nearest: "最近工作日",
  nth: "第 N 个周几",
};

function optionsOf(spec: { min: number; max: number; key: string }): { value: number; label: string }[] {
  const out: { value: number; label: string }[] = [];
  for (let v = spec.min; v <= spec.max; v++) {
    out.push({ value: v, label: spec.key === "week" ? `${v} ${WEEK_NAMES[v]}` : String(v) });
  }
  return out;
}

const SPEC: Record<string, { min: number; max: number; modes: FieldMode[] }> = {
  sec: { min: 0, max: 59, modes: ["all", "step", "range", "points"] },
  min: { min: 0, max: 59, modes: ["all", "step", "range", "points"] },
  hour: { min: 0, max: 23, modes: ["all", "step", "range", "points"] },
  day: { min: 1, max: 31, modes: ["all", "step", "range", "points", "last", "nearest"] },
  month: { min: 1, max: 12, modes: ["all", "step", "range", "points"] },
  week: { min: 0, max: 6, modes: ["all", "step", "range", "points", "nth"] },
};

/** 六个字段页签（ReTab 的 tabs 入参） */
const FIELDS = [SECOND, MINUTE, HOUR, DAY, MONTH, WEEK];
const FIELD_TABS: ReTabItem[] = FIELDS.map(f => ({ name: f.key, label: f.label }));

/** 某字段可用的匹配方式（ReTab 胶囊分段的 tabs 入参，name 即 FieldMode） */
function modesOf(key: string): ReTabItem[] {
  return SPEC[key].modes.map(m => ({ name: m, label: MODE_LABELS[m] }));
}

const PRESET_OPTIONS: ReOption[] = PRESETS.map(p => ({ label: p.label, value: p.cron }));
const WEEK_OPTIONS: ReOption[] = WEEK_NAMES.map((n, i) => ({ label: n, value: i }));

/** 面板状态 → 单字段 token */
function tokenOf(key: string): string {
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
    case "nearest":
      return `${f.start}W`;
    case "nth":
      return `${f.start}#${f.nth}`;
    default:
      return "*";
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
  if (token === "L" && key === "day") {
    f.mode = "last";
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
  const keys = ["sec", "min", "hour", "day", "month", "week"];
  const parsed = keys.map((k, i) => parseToken(k, tokens[i]));
  rawMode.value = parsed.some((p) => !p);
  rawExpression.value = value.trim();
}

watch(
  model,
  (v) => {
    if (!rawMode.value && v === expression.value) {
      rawExpression.value = v;
      return;
    }
    syncFromModel(v || "");
  },
  { immediate: true },
);

/** 面板改动 → 表达式（表达式模式下不反向覆盖用户输入） */
watch(expression, (v) => {
  if (rawMode.value || props.disabled) return;
  if (v !== model.value) model.value = v;
});

const trimmed = computed(() => (model.value || "").trim());

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
  if (!analysis.value.valid) return analysis.value.error || "表达式非法";
  if (rawMode.value) return "已按表达式直填（面板未同步该表达式）";
  return "";
});

const WEEK_LABEL = ["日", "一", "二", "三", "四", "五", "六"];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} 周${WEEK_LABEL[d.getDay()]}`;
}

/** 人话摘要：让"保存后到底什么时候跑"一眼可见 */
const summary = computed(() => {
  if (rawMode.value || !trimmed.value || !analysis.value.valid) return "";
  const parts: string[] = [];
  const describe = (key: string, unit: string) => {
    const f = state[key];
    if (f.mode === "all") return;
    if (f.mode === "step") parts.push(`每 ${f.step} ${unit}（自 ${f.start} 起）`);
    else if (f.mode === "range") parts.push(`${unit} ${f.start}-${f.end}${f.step > 1 ? ` 步长 ${f.step}` : ""}`);
    else if (f.mode === "points") parts.push(`${unit} ${f.points.join("、")}`);
    else if (f.mode === "last") parts.push("当月最后一天");
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

function applyPreset(cron: string): void {
  rawMode.value = false;
  syncFromModel(cron);
  model.value = cron;
}

function applyDefaultCron(): void {
  if (props.defaultCron) applyPreset(props.defaultCron);
}

function clearAll(): void {
  rawMode.value = false;
  model.value = "";
  syncFromModel("");
}

function useExpressionText(): void {
  rawMode.value = false;
  syncFromModel(rawExpression.value);
}

watch(analysis, (a) => emit("change", trimmed.value, a.valid));
</script>

<template>
  <div :class="['re-cron', { 'is-disabled': disabled }]" :style="width ? { width: typeof width === 'number' ? `${width}px` : width } : undefined">
    <div class="re-cron__line">
      <ReInput
        v-model="model"
        class="re-cron__input"
        :placeholder="placeholder"
        :disabled="disabled"
        clearable
        spellcheck="false"
        name="cron-expression"
        autocomplete="new-password"
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore
      >
        <template #append>
          <ElPopover
            v-model:visible="open"
            trigger="click"
            placement="bottom-end"
            :width="620"
            :disabled="disabled"
            popper-class="re-cron__popper"
          >
            <template #reference>
              <ReButton class="re-cron__gear" icon="Setting" title="可视化生成" :disabled="disabled"/>
            </template>

            <div class="re-cron__panel">
              <div class="re-cron__row">
                <span class="re-cron__label">常用周期</span>
                <ReSelect
                  :model-value="''"
                  size="small"
                  class="re-cron__preset"
                  style="width: 168px"
                  :data="PRESET_OPTIONS"
                  placeholder="选择一个预设"
                  @change="applyPreset"
                />
                <ReButton v-if="defaultCron" size="small" text type="primary" @click="applyDefaultCron">
                  用默认
                </ReButton>
                <ReButton size="small" text @click="clearAll">清空</ReButton>
              </div>

              <ReTab v-model="tab" :tabs="FIELD_TABS" size="small" class="re-cron__tabs">
                <template v-for="spec in FIELDS" :key="spec.key" #[spec.key]>
                  <div class="re-cron__pane">
                    <ReTab :tabs="modesOf(spec.key)" variant="capsule" nav-only v-model="state[spec.key].mode"/>

                    <div class="re-cron__controls">
                      <template v-if="state[spec.key].mode === 'step'">
                        <span>从</span>
                        <ReInputNumber v-model="state[spec.key].start" size="small" :min="spec.min" :max="spec.max" controls-position="right"/>
                        <span>{{ spec.label }}起，每隔</span>
                        <ReInputNumber v-model="state[spec.key].step" size="small" :min="1" :max="spec.max" controls-position="right"/>
                        <span>{{ spec.label }}</span>
                      </template>

                      <template v-else-if="state[spec.key].mode === 'range'">
                        <span>从</span>
                        <ReInputNumber v-model="state[spec.key].start" size="small" :min="spec.min" :max="spec.max" controls-position="right"/>
                        <span>到</span>
                        <ReInputNumber v-model="state[spec.key].end" size="small" :min="spec.min" :max="spec.max" controls-position="right"/>
                        <span>{{ spec.label }}，步长</span>
                        <ReInputNumber v-model="state[spec.key].step" size="small" :min="1" :max="spec.max" controls-position="right"/>
                      </template>

                      <template v-else-if="state[spec.key].mode === 'points'">
                        <ReSelect
                          v-model="state[spec.key].points"
                          multiple
                          collapse-tags
                          collapse-tags-tooltip
                          filterable
                          size="small"
                          class="re-cron__points"
                          style="width: 100%"
                          :data="optionsOf(spec)"
                          placeholder="可多选，支持直接输入数字后回车"
                        />
                      </template>

                      <template v-else-if="state[spec.key].mode === 'nearest'">
                        <span>当月</span>
                        <ReInputNumber v-model="state[spec.key].start" size="small" :min="1" :max="31" controls-position="right"/>
                        <span>日，就近顺延到工作日</span>
                      </template>

                      <template v-else-if="state[spec.key].mode === 'nth'">
                        <span>第</span>
                        <ReInputNumber v-model="state[spec.key].nth" size="small" :min="1" :max="5" controls-position="right"/>
                        <span>个</span>
                        <ReSelect v-model="state[spec.key].start" size="small" class="re-cron__nth" style="width: 96px" :data="WEEK_OPTIONS"/>
                      </template>

                      <span v-else class="re-cron__hint">该字段不做限制（<code>*</code>）</span>
                    </div>

                    <div v-if="spec.key === 'week' || spec.key === 'day'" class="re-cron__hint re-cron__note">
                      日与周同时受限时任一条件都会失效，本组件一律用 <code>*</code> 占位另一侧，保证与后端算出的触发时间一致。
                    </div>
                  </div>
                </template>
              </ReTab>

              <div class="re-cron__expr">
                <code class="re-cron__expr-text">{{ trimmed || '（未设置）' }}</code>
                <span v-if="summary" class="re-cron__expr-desc">{{ summary }}</span>
              </div>

              <div class="re-cron__preview">
                <div class="re-cron__preview-title">未来 {{ analysis.times.length }} 次触发</div>
                <ul v-if="analysis.times.length" class="re-cron__times">
                  <li v-for="(t, i) in analysis.times" :key="i">{{ fmt(t) }}</li>
                </ul>
                <div v-else class="re-cron__times re-cron__times--empty">{{ errorText || '无匹配时间' }}</div>
                <div class="re-cron__hint re-cron__note">与服务端同一套解析引擎算出，保存后的下次执行时间与此一致。</div>
              </div>

              <div v-if="rawMode" class="re-cron__row re-cron__row--foot">
                <span class="re-cron__hint">面板与该表达式不同步</span>
                <ReButton size="small" type="primary" plain @click="useExpressionText">按表达式重建面板</ReButton>
              </div>
            </div>
          </ElPopover>
        </template>
      </ReInput>
    </div>

    <div :class="['re-cron__status', analysis.valid ? 'is-ok' : 'is-warn']">
      <template v-if="analysis.valid">
        <span>合法</span>
        <span class="re-cron__dot">·</span>
        <span>下次 {{ fmt(analysis.times[0]) }}</span>
        <span v-if="summary" class="re-cron__dot">·</span>
        <span v-if="summary">{{ summary }}</span>
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

.re-cron__line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.re-cron__input {
  flex: 1;
  min-width: 0;
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
  transition: background-color 999999s ease-out 0s !important;
  caret-color: var(--el-text-color-primary);
}

.re-cron :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

/* 齿轮弹出的可视化面板：去掉 ElPopover 默认的 zoom 弹出动画 */
.re-cron :deep(.el-zoom-in-center-enter-active),
.re-cron :deep(.el-zoom-in-center-leave-active) {
  transition: none !important;
}

/* 面板里 ReTab 默认档的滑块过渡 */
.re-cron :deep(.el-tabs__animated-bar) {
  transition: none !important;
}

/* 面板里 ReTab 胶囊档的变色过渡 */
.re-cron :deep(.re-tab-capsule__item) {
  transition: none !important;
}

.re-cron__gear {
  margin: 0 !important;
  padding: 0 8px;
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

.re-cron__panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.re-cron__row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.re-cron__row--foot {
  justify-content: space-between;
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  padding-top: 6px;
}

.re-cron__label {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.re-cron__tabs :deep(.el-tabs__header) {
  margin-bottom: 6px;
}

.re-cron__pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 108px;
}

.re-cron__controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 13px;
}

.re-cron__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.re-cron__note {
  line-height: 1.5;
}

.re-cron__expr {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--el-fill-color-light, #f5f7fa);
}

.re-cron__expr-text {
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 13px;
}

.re-cron__expr-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.re-cron__preview-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.re-cron__times {
  margin: 4px 0 0;
  padding: 0 0 0 4px;
  list-style: none;
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-regular, #606266);
}

.re-cron__times--empty {
  font-family: inherit;
  color: var(--el-color-danger, #f56c6c);
}
</style>

<style lang="scss">
/*
 * 可视化设置面板（teleport 到 body，scoped 管不到）：
 * 面板根及其内部元素（含伪元素）一律不做动画/过渡，弹出收起瞬时完成。
 */
.re-cron__popper,
.re-cron__popper *,
.re-cron__popper *::before,
.re-cron__popper *::after {
  animation: none !important;
  transition: none !important;
}
</style>
