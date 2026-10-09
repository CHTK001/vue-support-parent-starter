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
import ReInputNumber from "../ReInputNumber";
import { WEEK_NAMES } from "./weekNames";

/** 传给 ReCron 的 6 字段表达式 */
export type CalendarExpression = string;

/**
 * 面板向外抛的事件。
 *
 * <p>只有 {@code update:expression} 一条，而且是**实时**的：改档位、勾日期、改时间
 * 都立刻把新的 6 段表达式抛给 ReCron。</p>
 *
 * <p>早先这里还有个 {@code apply} 事件，靠面板底部那颗「应用此时间」按钮触发。
 * 去掉它是因为它与字段模式的行为不一致 —— 字段模式是改一下就实时写回 model、
 * 由弹层的「取消/保存」统一收口，日历模式却要用户记得再点一次按钮才生效，
 * 按了之后弹层状态毫无变化，很容易被当成按钮坏了。现在两种模式口径一致。</p>
 */
export interface ReCronCalendarPanelEmits {
  (e: "update:expression", expression: CalendarExpression): void;
}

const props = defineProps<{
  /** 当前表达式，用于反向初始化选中日期 */
  expression?: string;
}>();

const emit = defineEmits<ReCronCalendarPanelEmits>();

/** 周期档位：与参考 UI 的四个胶囊一一对应 */
type Cadence = "daily" | "weekday" | "weekend" | "custom";

/**
 * 三个内置档位。
 *
 * <p>这里**只存语义（label + 星期集合），不存 cron 字面量**：一旦把
 * {@code "0 30 9 ? * 1-5"} 这样的样例串写死，它与 {@link expression} 里的拼接逻辑
 * 就是两份独立事实，改一处忘另一处就会出现「面板显示工作日、实际拼出别的」这种
 * 静默不一致（此前 daily 就因此多拼出一段、变成 7 段被引擎判非法）。
 * 拼串一律由 {@link dayMonthWeekOf} 从 days 现算。</p>
 */
const CADENCES: { key: Cadence; label: string; days: number[] }[] = [
  { key: "daily", label: "每天", days: [] },
  { key: "weekday", label: "工作日", days: [1, 2, 3, 4, 5] },
  { key: "weekend", label: "周末", days: [0, 6] },
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
  touched.value = true;
  cadence.value = "custom";
  pickedDays.value = pickedDays.value.includes(cell.date)
    ? pickedDays.value.filter((d) => d !== cell.date)
    : [...pickedDays.value, cell.date].sort((a, b) => a - b);
  publish();
}

/**
 * 当前档位拼出的 6 字段 cron。
 *
 * 日与周不能同时受限（服务端语义是「一侧为空则整体放开」），所以：
 *  - 按星期跑的档位：日位写 `?`、周位写星期集合；
 *  - 每天：日周都写 `*`；
 *  - 自定义选日期：日位写逗号分隔的日期、周位写 `?`。
 */
/**
 * 星期集合 → cron 的周字段写法。
 *
 * <p>连续区间写成 {@code 1-5}（可读性），离散写成 {@code 0,6}。
 * 服务端与 {@link CronExpression} 两种都解析。</p>
 */
function weekTokenOf(days: number[]): string {
  if (!days.length) return "*";
  if (days.length === 2 && days[1] - days[0] === 1) return `${days[0]}-${days[1]}`;
  return [...days].sort((a, b) => a - b).join(",");
}

/**
 * 当前档位的「日 / 月 / 周」三段。
 *
 * <p>日与周不能同时受限（服务端语义是「一侧为空则整体放开」），所以：
 * 按星期跑 → 日位 {@code ?}；按日期跑 → **日期落日位**、周位 {@code ?}；
 * 每天 → 两侧都是 {@code *}。</p>
 *
 * <p>「日期落哪一段」必须写死且与 {@link initFromExpression} 对称：把 {@code 1,15,28}
 * 塞进周位会变成「每周 1/15/28 号」，语义全错且引擎不报错。</p>
 */
function dayMonthWeekOf(key: Cadence): [string, string, string] {
  if (key === "daily") return ["*", "*", "*"];
  /* 自定义按日期跑：日期列表落在**日位**，周位让位成 `?`。
   * 早前误写成 ["?", "*", 日期列表]，等于把「每月 1/15/28 日」表达成
   * 「每周 1/15/28 号」，引擎照跑不误，于是面板说选日期、实际每周触发 ——
   * 引擎不会报错，只能靠断言比对触发日才能发现。 */
  if (key === "custom") {
    return pickedDays.value.length ? [pickedDays.value.join(","), "*", "?"] : ["", "*", "?"];
  }
  const days = CADENCES.find((c) => c.key === key)?.days ?? [];
  return days.length ? ["?", "*", weekTokenOf(days)] : ["?", "*", ""];
}

const expression = computed<string>(() => {
  // 「秒 分 时」三段 + 「日 月 周」三段 = 固定 6 段。
  // 拼接只在这里发生，且由 dayMonthWeekOf 保证恰好补 3 段 ——
  // 早前手写成 `${base} * * * *` 时多算一段，产出 7 段并被引擎判非法。
  const head = `${second.value} ${minute.value} ${hour.value}`;
  const [day, month, week] = dayMonthWeekOf(cadence.value);
  // 日周至少一侧要有实际限制；两侧都空（自定义未选日期）时不产出表达式，
  // 免得写出 `0 0 9  * * ?` 这种空日位被引擎当成"每月全部"而误触发。
  if (!day && week === "?") return "";
  if (!week && !day) return "";
  return `${head} ${day || "?"} ${month} ${week || "?"}`;
});

const timeLabel = computed(
  () => `${String(hour.value).padStart(2, "0")}:${String(minute.value).padStart(2, "0")}`,
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

/**
 * 周字段归一化，让 `1-5` / `1,2,3,4,5` / `?` / `*` 落到可比较的同一形式。
 *
 * <p>不归一的后果：面板自己拼出的是 `1-5`，用户从别处粘进来的是 `1,2,3,4,5`，
 * 两者语义相同但字符串不等，反向初始化就会把「工作日」误判成自定义。</p>
 */
function normalizeWeek(token: string): number[] | null {
  const t = String(token ?? "").trim();
  if (t === "*" || t === "?") return [];
  const out: number[] = [];
  for (const part of t.split(",")) {
    const seg = part.trim();
    if (!seg) continue;
    const range = /^(\d+)-(\d+)$/.exec(seg);
    if (range) {
      for (let n = Number(range[1]); n <= Number(range[2]); n++) out.push(n);
    } else if (/^\d+$/.test(seg)) {
      out.push(Number(seg));
    } else {
      // 英文星期名（MON-FRI 等）交给字段模式处理，日历模式不硬解
      return null;
    }
  }
  return [...new Set(out)].sort((a, b) => a - b);
}

function sameDays(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * 从现有表达式反向初始化。
 *
 * <p>先按「日位是日期还是占位」分流，再让 {@link expression} 自己回算一次做校验 ——
 * 反向识别与正向拼串共用 {@link dayMonthWeekOf}，这样两边不会各写一套判据而漂移。</p>
 */
function initFromExpression(text: string): void {
  const parts = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length !== 6) return;
  const [s, mi, h, day, , week] = parts;
  if (/^\d+$/.test(s)) second.value = Number(s);
  if (/^\d+$/.test(mi)) minute.value = Number(mi);
  if (/^\d+$/.test(h)) hour.value = Number(h);

  // 日位是具体日期 → 自定义选日期
  if (/^\d/.test(day)) {
    const days = day
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isInteger(v) && v >= 1 && v <= 31);
    if (days.length) {
      cadence.value = "custom";
      pickedDays.value = days.sort((a, b) => a - b);
      return;
    }
  }

  // 日位是占位（* / ?）→ 看周位能否对上某个内置档位
  const weeks = normalizeWeek(week);
  if (weeks) {
    const hit = CADENCES.find((c) => sameDays(weeks, [...c.days].sort((a, b) => a - b)));
    if (hit) {
      cadence.value = hit.key;
      pickedDays.value = [];
      return;
    }
  }

  // 对不上任何内置档位：停在自定义，保留用户原有选日（不覆盖为今天）
  cadence.value = "custom";
}

watch(
  () => props.expression ?? "",
  (v) => {
    initFromExpression(v);
    // 外部改进来的（不是我们抛出去的）就停手，否则会用面板旧状态把它盖回去
    if (v !== lastEmitted) touched.value = false;
  },
  { immediate: true },
);

// 时间输入框直接双向绑在 hour/minute/second 上，改完同样要实时抛出去
watch([hour, minute, second], publish);

/**
 * 是否已经发生过用户操作。
 *
 * <p>只有用户动过面板才往外抛。用它把「面板从表达式反向初始化」和「用户改了」
 * 区分开：打开弹层时 {@link initFromExpression} 会写一堆内部状态，若那时也抛，
 * 就会把用户手写的、面板本来读不懂的表达式覆盖成面板的猜测值。</p>
 */
const touched = ref(false);

/**
 * 上一次抛出去的表达式。
 *
 * <p>用来分辨「表达式变化是我自己抛出去的」还是「外面改了它」：后者要停手，
 * 否则外部刚同步进来的值会被面板的旧状态又盖回去。</p>
 */
let lastEmitted = "";

/** 把当前表达式实时抛给 ReCron。只在用户动过面板后才有意义。 */
function publish(): void {
  if (!touched.value) return;
  const value = expression.value;
  if (!value || value === lastEmitted) return;
  lastEmitted = value;
  emit("update:expression", value);
}

function pickCadence(key: Cadence): void {
  touched.value = true;
  cadence.value = key;
  if (key === "custom" && !pickedDays.value.length) {
    // 自定义没选日期时先给今天，避免面板空着无从下手
    pickedDays.value = [new Date().getDate()];
  }
  publish();
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

      <!-- 下：执行时间（独占整行，见 .re-cron-cal__body 注释）。改动实时生效，
           与字段模式同一口径，这里不再有「应用此时间」按钮 -->
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

        <p class="re-cron-cal__hint">按 {{ cadenceLabel }} 执行</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 全部配色走 koi / Element Plus 令牌，不写死色值 */
.re-cron-cal {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.re-cron-cal__cadences {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.re-cron-cal__cadence {
  height: 26px;
  padding: 0 11px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-family: inherit;
  font-size: 12px;
  line-height: 24px;
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

/*
 * 单列：月历在上，「执行时间」独占下方一整行。
 *
 * 原来是 `1fr 180px` 左右并排，右列只有 180px —— 扣掉 side 的内距后剩 ~156px，
 * 时/分输入框 + 冒号 + 「应用此时间」按钮挤在一起，输入框窄到 44px，
 * 打两位小时分钟都要盯着看；而月历被压到 7 列每格 34px，日期数字顶边。
 * 两边都不够。改成上下并置后月历拿到全宽（约 62px 每格），执行时间也拿到全宽。
 */
.re-cron-cal__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
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
  grid-template-columns: 24px minmax(0, 1fr) 24px;
  align-items: center;
  padding: 5px 6px;
}

.re-cron-cal__cal-title {
  text-align: center;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.re-cron-cal__nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
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
  padding: 4px 6px;
  background: var(--el-fill-color-light);
}

.re-cron-cal__week-cell {
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.re-cron-cal__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 3px;
  padding: 6px;
}

.re-cron-cal__day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  /*
   * 固定高度而不是 aspect-ratio: 1。
   *
   * 弹层 480px 宽时每格有 59px 宽，正方形就意味着 59px 高 —— 六行连间隙整整
   * 380px，单它一个就吃掉整个可用高度（~420px），底下的「应用此时间」
   * 和「保存」只能靠滚动才够得到。压到 20px 高后整块月历 147px。
   * 格子因此是扁的（59×20），但日期只有两位数，视觉上仍读得清。
   */
  height: 20px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-family: inherit;
  font-size: 12px;
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

/*
 * 「执行时间」独占一行后改成横向排布：标题 · 表盘 · 时分 · 提示 · 应用按钮。
 *
 * 表盘在这里只是视觉示意（真正的输入是时/分两个框），横向布局下不需要再抢高度，
 * 收到 46px；同时指针长度按 46px 直径重算，否则会捅出圆外。
 */
.re-cron-cal__side {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 4px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
  background: var(--el-bg-color);
}

.re-cron-cal__side-title {
  flex: none;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.re-cron-cal__clock {
  position: relative;
  flex: none;
  width: 38px;
  height: 38px;
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
  width: 10px;
  height: 2px;
  margin-top: -1px;
}

.re-cron-cal__hand--min {
  width: 15px;
  height: 2px;
  margin-top: -1px;
}

.re-cron-cal__clock-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  margin: -2.5px 0 0 -2.5px;
  border-radius: var(--el-radius-full);
  background: var(--el-color-primary);
}

.re-cron-cal__time {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
}

/* 独占一行后有富余宽度，输入框从 44px 放回 62px，打两位时分不用盯着看 */
.re-cron-cal__time :deep(.el-input__inner) {
  width: 62px;
  text-align: center;
  font-family: var(--cc-font-num);
  font-size: 16px;
  font-weight: 600;
}

.re-cron-cal__time-colon {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.re-cron-cal__hint {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  text-align: left;
  /*
   * 必须单行省略：横向 flex 里 hint 是唯一可压缩项，不锁住它就会自己换行，
   * 把整条「执行时间」从 60px 撑到 170px（实测）。锁住后剩余空间不够就出省略号。
   */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>