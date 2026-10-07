<!--
  日历调度器：ReCron 弹层的「日历」模式。

  与字段模式的关系：两者都是「state → 6 字段 cron」这一条写入路径，只是入口不同。
  本组件**不自己写 model**，而是通过 {@link ReCronCalendarPanelEmits.apply} 把
  拼好的 6 段表达式交回 ReCron，由它统一走 syncFromModel —— 这样两种模式
  共享同一份解析/校验/预览，不会各自长出一套不一致的口径。

  为什么不用 el-date-picker：
  参考 UI 的月历里每个格子带「当天是否被选中」的圆点、选中态是描边方块，
  这些都与 el-date-picker 的 multiple/shortcuts 行为对不上；且日期面板自带
  teleport + 内部动效，与 ReCron 已有的「整树去动效」策略相冲。这里手写月历，
  全部尺寸与配色走 koi 令牌。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ReButton from "../ReButton";
import ReInputNumber from "../ReInputNumber";
import { WEEK_NAMES } from "./weekNames";

/** 传给 ReCron 的 6 字段表达式 */
export type CalendarExpression = string;

export interface ReCronCalendarPanelEmits {
  (e: "apply", expression: CalendarExpression): void;
}

const props = withDefaults(
  defineProps<{
    /** 当前表达式，用于反向初始化选中日期 */
    expression?: string;
    /** 预览条数（1-20），与服务端同源 */
    previewCount?: number;
  }>(),
  { expression: "", previewCount: 5 },
);

const emit = defineEmits<ReCronCalendarPanelEmits>();

/** 周期档位：与参考 UI 的四个胶囊一一对应 */
type Cadence = "daily" | "weekday" | "weekend" | "custom";

const CADENCES: { key: Cadence; label: string; cron: string; days: number[] }[] = [
  { key: "daily", label: "每天", cron: "0 0 9 * * *", days: [] },
  { key: "weekday", label: "工作日", cron: "0 30 9 ? * 1-5", days: [1, 2, 3, 4, 5] },
  { key: "weekend", label: "周末", cron: "0 30 9 ? * 0,6", days: [0, 6] },
];

const cadence = ref<Cadence>("daily");
const hour = ref(9);
const minute = ref(0);
const second = ref(0);

/** 自定义模式下被选中的日期（本月内，存 1-31） */
const pickedDays = ref<number[]>([]);

/** 当前展示的月份，存该月 1 号的 Date */
const cursor = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

/** 月历 6 行 × 7 列，WEEK_NAMES 顺序即 cron 的 0=周日 */
const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

interface Cell {
  /** 该格是否属于当前展示月份（false = 补位的邻月灰格） */
  inMonth: boolean;
  date: number;
  /** 0=周日 … 6=周六 */
  weekday: number;
  key: string;
}

const cells = computed<Cell[]>(() => {
  const y = cursor.value.getFullYear();
  const m = cursor.value.getMonth();
  const first = new Date(y, m, 1);
  const offset = first.getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const out: Cell[] = [];
  // 固定 6 行：月首补位 + 月尾补位凑满 42 格，行高不随月份跳动
  for (let i = 0; i < 42; i++) {
    const day = i - offset + 1;
    const inMonth = day >= 1 && day <= days;
    const d = new Date(y, m, day);
    out.push({
      inMonth,
      date: inMonth ? day : day < 1 ? new Date(y, m - 1, 0).getDate() + day : day - days,
      weekday: d.getDay(),
      key: `${y}-${m}-${i}`,
    });
  }
  return out;
});

const monthLabel = computed(
  () => `${cursor.value.getFullYear()} 年 ${cursor.value.getMonth() + 1} 月`,
);

/** 该日期是否被选中：自定义看 pickedDays，其余档位按 cadence 的星期集合 */
function isPicked(cell: Cell): boolean {
  if (!cell.inMonth) return false;
  const hit =
    cadence.value === "custom"
      ? pickedDays.value.includes(cell.date)
      : (CADENCES.find((c) => c.key === cadence.value)?.days ?? []).includes(cell.weekday);
  return hit;
}

function isToday(cell: Cell): boolean {
  const now = new Date();
  return (
    cell.inMonth &&
    cell.date === now.getDate() &&
    cursor.value.getMonth() === now.getMonth() &&
    cursor.value.getFullYear() === now.getFullYear()
  );
}

function shiftMonth(delta: number): void {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + delta, 1);
}

function toggleDay(cell: Cell): void {
  if (!cell.inMonth) return;
  // 点日期即切到自定义，避免"看着改了、实际档位没变"
  cadence.value = "custom";
  pickedDays.value = pickedDays.value.includes(cell.date)
    ? pickedDays.value.filter((d) => d !== cell.date)
    : [...pickedDays.value, cell.date].sort((a, b) => a - b);
}

/**
 * 当前档位拼出的 6 字段 cron。
 *
 * 日与周不能同时受限（服务端语义是「一侧为空则整体放开」），所以：
 *  - 按星期跑的档位：日位写 `?`、周位写星期集合；
 *  - 每天：日周都写 `*`；
 *  - 自定义选日期：日位写逗号分隔的日期、周位写 `?`。
 */
const expression = computed<string>(() => {
  const base = `${second.value} ${minute.value} ${hour.value}`;
  if (cadence.value === "daily") return `${base} * * * *`;
  if (cadence.value === "custom") {
    if (!pickedDays.value.length) return "";
    return `${base} ? * ${pickedDays.value.join(",")}`;
  }
  const days = CADENCES.find((c) => c.key === cadence.value)?.days ?? [];
  if (!days.length) return "";
  // 连续区间写成 1-5 更好读，也与服务端解析一致
  const list = days.length === 2 && days[1] - days[0] === 1 ? `${days[0]}-${days[1]}` : days.join(",");
  return `${base} ? * ${list}`;
});

const timeLabel = computed(
  () =>
    `${String(hour.value).padStart(2, "0")}:${String(minute.value).padStart(2, "0")}`,
);

/** 档位下的一句人话，替代字段模式那串 token */
const cadenceLabel = computed(() => {
  if (cadence.value === "custom") {
    if (!pickedDays.value.length) return "未选择日期";
    return `每月 ${pickedDays.value.join("、")} 日 ${timeLabel.value}`;
  }
  if (cadence.value === "daily") return `每天 ${timeLabel.value}`;
  return `${CADENCES.find((c) => c.key === cadence.value)?.label ?? ""} ${timeLabel.value}`;
});

/** 从现有表达式反向初始化：能认出来就落到对应档位，认不出来就停在自定义 */
function initFromExpression(text: string): void {
  const parts = String(text ?? "").trim().split(/\s+/);
  if (parts.length !== 6) return;
  const [s, mi, h, day, , week] = parts;
  if (/^\d+$/.test(s)) second.value = Number(s);
  if (/^\d+$/.test(mi)) minute.value = Number(mi);
  if (/^\d+$/.test(h)) hour.value = Number(h);

  const known = CADENCES.find(
    (c) => c.cron.endsWith(`${day} * ${week === "?" ? "*" : week}`) && c.cron.startsWith(`${s} ${mi} ${h}`),
  );
  if (known) {
    cadence.value = known.key;
    pickedDays.value = [];
    return;
  }
  if (day !== "*" && day !== "?") {
    cadence.value = "custom";
    pickedDays.value = day
      .split(",")
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v) && v >= 1 && v <= 31);
  }
}

watch(
  () => props.expression,
  (v) => initFromExpression(v),
  { immediate: true },
);

function pickCadence(key: Cadence): void {
  cadence.value = key;
  if (key === "custom" && !pickedDays.value.length) {
    // 自定义没选日期时先给今天，避免面板空着无从下手
    pickedDays.value = [new Date().getDate()];
  }
}

function emitApply(): void {
  if (expression.value) emit("apply", expression.value);
}

defineExpose({ expression });
</script>

<template>
  <div class="re-cron-cal">
    <!-- 档位胶囊：每天 / 工作日 / 周末 / 自定义 -->
    <div class="re-cron-cal__cadences">
      <button
        v-for="c in CADENCES"
        :key="c.key"
        type="button"
        class="re-cron-cal__cadence"
        :class="{ 'is-active': cadence === c.key }"
        :aria-pressed="cadence === c.key"
        @click="pickCadence(c.key)"
      >
        {{ c.label }}
      </button>
      <button
        type="button"
        class="re-cron-cal__cadence"
        :class="{ 'is-active': cadence === 'custom' }"
        :aria-pressed="cadence === 'custom'"
        @click="pickCadence('custom')"
      >
        自定义
      </button>
    </div>

    <div class="re-cron-cal__body">
      <!-- 左：月历 -->
      <div class="re-cron-cal__calendar">
        <header class="re-cron-cal__cal-head">
          <button type="button" class="re-cron-cal__nav" aria-label="上个月" @click="shiftMonth(-1)">
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <span class="re-cron-cal__cal-title">{{ monthLabel }}</span>
          <button type="button" class="re-cron-cal__nav" aria-label="下个月" @click="shiftMonth(1)">
            <el-icon><ArrowRight /></el-icon>
          </button>
        </header>

        <div class="re-cron-cal__week" role="row">
          <span v-for="w in WEEK_LABELS" :key="w" class="re-cron-cal__week-cell">{{ w }}</span>
        </div>

        <div class="re-cron-cal__grid" role="grid">
          <button
            v-for="cell in cells"
            :key="cell.key"
            type="button"
            class="re-cron-cal__day"
            :class="{
              'is-out': !cell.inMonth,
              'is-picked': isPicked(cell),
              'is-today': isToday(cell),
            }"
            :aria-pressed="isPicked(cell)"
            :aria-label="`${cell.date} 日 周${WEEK_NAMES[cell.weekday]}`"
            @click="toggleDay(cell)"
          >
            <span class="re-cron-cal__day-num">{{ cell.date }}</span>
            <span v-if="isPicked(cell)" class="re-cron-cal__day-dot" aria-hidden="true"></span>
          </button>
        </div>
      </div>

      <!-- 右：执行时间 + 应用 -->
      <div class="re-cron-cal__side">
        <div class="re-cron-cal__side-title">执行时间</div>

        <!-- 表盘：纯 CSS 画一个静态指针示意，真正可调的是下面三个数字 -->
        <div class="re-cron-cal__clock" aria-hidden="true">
          <span class="re-cron-cal__hand re-cron-cal__hand--hour" :style="{ transform: `rotate(${(hour % 12) * 30 + minute * 0.5}deg)` }"></span>
          <span class="re-cron-cal__hand re-cron-cal__hand--min" :style="{ transform: `rotate(${minute * 6}deg)` }"></span>
          <span class="re-cron-cal__clock-dot"></span>
        </div>

        <div class="re-cron-cal__time">
          <ReInputNumber v-model="hour" :min="0" :max="23" :controls="false" aria-label="小时" />
          <span class="re-cron-cal__time-colon">:</span>
          <ReInputNumber v-model="minute" :min="0" :max="59" :controls="false" aria-label="分钟" />
        </div>

        <p class="re-cron-cal__hint">
          按{{ cadenceLabel }}执行
        </p>

        <ReButton type="primary" class="re-cron-cal__apply" :disabled="!expression" @click="emitApply">
          应用此时间
        </ReButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 全部配色走 koi / Element Plus 令牌，不写死色值 */
.re-cron-cal {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.re-cron-cal__cadences {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.re-cron-cal__cadence {
  height: 32px;
  padding: 0 18px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-family: inherit;
  font-size: 13px;
  line-height: 30px;
  cursor: pointer;
}

.re-cron-cal__cadence:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.re-cron-cal__cadence.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.re-cron-cal__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 16px;
}

@media (width <= 520px) {
  .re-cron-cal__body {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ---------------- 月历 ---------------- */

.re-cron-cal__calendar {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
  background: var(--el-bg-color);
  overflow: hidden;
}

.re-cron-cal__cal-head {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  align-items: center;
  padding: 10px 8px;
}

.re-cron-cal__cal-title {
  text-align: center;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 600;
}

.re-cron-cal__nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--el-radius-sm);
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
}

.re-cron-cal__nav:hover {
  background: var(--el-fill-color-light);
  color: var(--el-color-primary);
}

.re-cron-cal__week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  padding: 6px 8px;
  background: var(--el-fill-color-light);
}

.re-cron-cal__week-cell {
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.re-cron-cal__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  padding: 8px;
}

.re-cron-cal__day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  aspect-ratio: 1;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}

/* 邻月补位格：留白而不是置灰，保持网格视觉整齐 */
.re-cron-cal__day.is-out {
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: default;
}

.re-cron-cal__day.is-picked {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.re-cron-cal__day.is-today:not(.is-picked) {
  border-color: var(--el-color-primary-light-5);
}

.re-cron-cal__day-dot {
  width: 4px;
  height: 4px;
  border-radius: var(--el-radius-full);
  background: var(--el-color-primary);
}

/* ---------------- 右列 ---------------- */

.re-cron-cal__side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
  background: var(--el-bg-color);
}

.re-cron-cal__side-title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

/* 表盘：只做视觉示意，指针角度由小时/分钟驱动 */
.re-cron-cal__clock {
  position: relative;
  width: 96px;
  height: 96px;
  border: 2px solid var(--el-border-color);
  border-radius: var(--el-radius-full);
  background: var(--el-fill-color-blank);
}

.re-cron-cal__hand {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  border-radius: var(--el-radius-full);
  background: var(--el-color-primary);
}

.re-cron-cal__hand--hour {
  width: 26px;
  height: 3px;
  margin-top: -1.5px;
}

.re-cron-cal__hand--min {
  width: 38px;
  height: 2px;
  margin-top: -1px;
}

.re-cron-cal__clock-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: var(--el-radius-full);
  background: var(--el-color-primary);
}

.re-cron-cal__time {
  display: flex;
  align-items: center;
  gap: 4px;
}

.re-cron-cal__time :deep(.el-input__inner) {
  width: 56px;
  text-align: center;
  font-family: var(--cc-font-num);
  font-size: 18px;
  font-weight: 600;
}

.re-cron-cal__time-colon {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
}

.re-cron-cal__hint {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;
}

.re-cron-cal__apply {
  width: 100%;
  margin-top: auto;
}
</style>