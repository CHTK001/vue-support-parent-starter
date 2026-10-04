<template>
  <ReDialog
    v-model="visible"
    title="节日与放假安排"
    width="580"
    top="8vh"
    destroy-on-close
  >
    <template #content>
      <div class="holiday-panel">
        <!-- 正在放假时的进度概览 -->
        <div
          v-if="current"
          class="holiday-panel__banner"
          :class="{ 'is-provisional': current.provisional }"
        >
          <div class="holiday-panel__banner-main">
            <span class="holiday-panel__banner-name">{{ current.name }}</span>
            <span class="holiday-panel__banner-tag">
              {{ current.provisional ? "按放假办法推算" : "官方公布" }}
            </span>
          </div>
          <div class="holiday-panel__banner-sub">
            {{ formatRange(current) }} · 共 {{ periodDays(current) }} 天
          </div>
          <div v-if="current.provisional" class="holiday-panel__banner-hint">
            调休安排通常于当年 11 月由国务院办公厅公布，届时会自动显示补班日。
          </div>
        </div>

        <el-tabs v-model="tab" class="holiday-panel__tabs">
          <!-- ============ 近期节日 ============ -->
          <el-tab-pane :label="`近期（${upcoming.length}）`" name="upcoming">
            <ul v-if="upcoming.length" class="holiday-panel__list">
              <li
                v-for="it in upcoming"
                :key="it.key + it.name"
                class="holiday-panel__item"
                :class="{
                  'is-work': it.kind === 'makeup',
                  'is-plain': !it.isRest && it.kind !== 'makeup',
                  'is-today': it.ongoing || it.days === 0,
                }"
              >
                <div class="holiday-panel__item-date">
                  <span class="holiday-panel__item-md">{{ mdOf(it.key) }}</span>
                  <span class="holiday-panel__item-week">周{{ weekdayName(it.key) }}</span>
                </div>
                <div class="holiday-panel__item-body">
                  <span class="holiday-panel__item-name">
                    {{ it.name }}
                    <em v-if="it.spanDays > 1" class="holiday-panel__item-span">连休 {{ it.spanDays }} 天</em>
                    <em v-if="it.provisional" class="holiday-panel__item-prov">待公布</em>
                  </span>
                  <span class="holiday-panel__item-lunar">{{ lunarOf(it.key) }}</span>
                </div>
                <div class="holiday-panel__item-when">
                  <span v-if="it.ongoing" class="is-today-text">进行中</span>
                  <span v-else-if="it.days === 0" class="is-today-text">今天</span>
                  <span v-else>{{ it.days }} 天后</span>
                </div>
              </li>
            </ul>
            <ReEmpty v-else description="未来一年没有可展示的节日" />
          </el-tab-pane>

          <!-- ============ 全年放假安排 ============ -->
          <el-tab-pane :label="`${year} 年放假`" name="year">
            <div class="holiday-panel__year-bar">
              <el-button-group>
                <el-button size="small" :disabled="yearOffset <= -3" @click="yearOffset -= 1">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <el-button size="small" @click="yearOffset = 0">{{ year }} 年</el-button>
                <el-button size="small" :disabled="yearOffset >= 3" @click="yearOffset += 1">
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </el-button-group>
              <div class="holiday-panel__year-right">
                <el-tag size="small" :type="sourceTagType">{{ sourceText }}</el-tag>
                <el-button size="small" :loading="refreshing" @click="onRefresh">
                  <el-icon><Refresh /></el-icon>
                </el-button>
              </div>
            </div>

            <div v-if="remoteStatus === 'unavailable'" class="holiday-panel__notice">
              <el-icon><InfoFilled /></el-icon>
              <span>后台节假日接口不可用，以下为日历内置数据（含按《放假办法》推算的部分）。</span>
            </div>
            <div v-else-if="remoteStatus === 'empty'" class="holiday-panel__notice">
              <el-icon><InfoFilled /></el-icon>
              <span>后台已连通，但 {{ year }} 年尚无节假日数据，以下为日历内置数据。</span>
            </div>
            <div v-else-if="!yearPublished" class="holiday-panel__notice">
              <el-icon><InfoFilled /></el-icon>
              <span>
                以下仅按《全国年节及纪念日放假办法》列出法定假日当天，<b>不含补班日</b> ——
                调休取决于当年双休排布，无据可推，故不臆造。
              </span>
            </div>

            <ul class="holiday-panel__list">
              <li v-for="p in yearPeriods" :key="p.name" class="holiday-panel__period">
                <div class="holiday-panel__period-head">
                  <span class="holiday-panel__period-name">{{ p.name }}</span>
                  <span class="holiday-panel__period-days">{{ periodDays(p) }} 天</span>
                </div>
                <div class="holiday-panel__period-body">
                  <div class="holiday-panel__period-row">
                    <span class="holiday-panel__period-label">放假</span>
                    <span class="holiday-panel__period-value">{{ formatRange(p) }}</span>
                  </div>
                  <div v-if="p.workdays.length" class="holiday-panel__period-row">
                    <span class="holiday-panel__period-label is-work">补班</span>
                    <span class="holiday-panel__period-value is-work">
                      {{ p.workdays.map(mdOf).join("、") }}
                    </span>
                  </div>
                </div>
              </li>
            </ul>

            <!-- 后台下发的自定义安排（如公司年会、特殊调休） -->
            <div v-if="remoteGroups.length" class="holiday-panel__remote">
              <div class="holiday-panel__remote-title">后台自定义安排</div>
              <ul class="holiday-panel__list">
                <li v-for="g in remoteGroups" :key="g.name + g.start" class="holiday-panel__period">
                  <div class="holiday-panel__period-head">
                    <span class="holiday-panel__period-name">{{ g.name }}</span>
                    <span class="holiday-panel__period-days" :class="{ 'is-work': !g.isHoliday }">
                      {{ g.isHoliday ? `${g.days} 天假期` : "调休上班" }}
                    </span>
                  </div>
                  <div class="holiday-panel__period-body">
                    <div class="holiday-panel__period-row">
                      <span class="holiday-panel__period-label" :class="{ 'is-work': !g.isHoliday }">
                        {{ g.isHoliday ? "放假" : "补班" }}
                      </span>
                      <span class="holiday-panel__period-value" :class="{ 'is-work': !g.isHoliday }">
                        {{ g.start }} ~ {{ g.end }}
                      </span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </el-tab-pane>

          <!-- ============ 二十四节气 ============ -->
          <el-tab-pane label="二十四节气" name="terms">
            <div class="holiday-panel__term-note">
              节气按太阳视黄经每 15° 划分，与农历月份无关，日期以北京时间为准。
            </div>
            <div class="holiday-panel__term-grid">
              <div
                v-for="t in terms"
                :key="t.name"
                class="holiday-panel__term"
                :class="{ 'is-past': t.past }"
              >
                <span class="holiday-panel__term-name">{{ t.name }}</span>
                <span class="holiday-panel__term-date">{{ t.date.slice(5).replace("-", "/") }}</span>
                <span class="holiday-panel__term-lunar">{{ t.lunar }}</span>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
  </ReDialog>
</template>

<script setup lang="ts" name="CalendarHolidayDialog">

/**
 * 节日与放假安排面板
 *
 * 三个页签对应三类信息：
 * <ol>
 *   <li>近期：未来一年内值得记住的节日与假期（只收录 1—2 级，避免刷屏）</li>
 *   <li>全年放假：国务院办公厅公布的放假区间与补班日</li>
 *   <li>二十四节气：按太阳黄经推算的节气日期</li>
 * </ol>
 *
 * 数据全部来自 {@link ./index} 聚合层，本组件不重复实现任何历法换算 ——
 * 与日历格子共用同一套换算，两处才不会显示不一致的内容。
 */
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { ArrowLeft, ArrowRight, InfoFilled, Refresh } from "@element-plus/icons-vue";
import {
  addDateKeyDays,
  diffDays,
  fromDateKey,
  getDayInfo,
  getRemoteHolidays,
  getStatutoryPeriods,
  getUpcomingItems,
  getYearSolarTerms,
  isStatutoryPublished,
  SOLAR_TERM_NAMES,
  toDateKey,
  WEEKDAY_NAMES,
  type StatutoryPeriod,
} from "./index";
import type { UpcomingItem } from "./dayInfo";

const ReDialog = defineAsyncComponent(() => import("@repo/ui/re-dialog").then((m) => m.default));
const ReEmpty = defineAsyncComponent(() => import("@repo/ui/re-empty").then((m) => m.default));

/** 后台数据来源状态（由父组件填入） */
const props = defineProps<{
  /** unknown=尚未加载 ok=有数据 empty=后台无数据 unavailable=接口不可用 */
  remoteStatus?: "unknown" | "ok" | "empty" | "unavailable";
  /** 后台下发的记录条数 */
  remoteCount?: number;
}>();

const emit = defineEmits<{ refresh: [] }>();

/** 是否打开（父组件用 v-model 绑定） */
const open = ref(false);
const visible = computed({
  get: () => open.value,
  set: (v: boolean) => {
    open.value = v;
  },
});

/** 刷新按钮的 loading */
const refreshing = ref(false);

const remoteStatus = computed(() => props.remoteStatus ?? "unknown");
const remoteCount = computed(() => props.remoteCount ?? 0);

/** 「数据来源」标签文案与配色 */
const sourceText = computed(() => {
  switch (remoteStatus.value) {
    case "ok":
      return `后台 ${remoteCount.value} 条`;
    case "empty":
      return "后台无数据";
    case "unavailable":
      return "内置数据";
    default:
      return yearPublished.value ? "内置数据" : "推算数据";
  }
});

const sourceTagType = computed<"success" | "info" | "warning">(() => {
  if (remoteStatus.value === "ok") return "success";
  if (remoteStatus.value === "unknown") return "info";
  return "warning";
});

const tab = ref("upcoming");
const todayKey = toDateKey(new Date());

/** 当前是否正在假期中 */
const current = computed(() => getDayInfo(todayKey).period);

/** 未来 400 天内的节日与假期 */
const upcoming = computed<UpcomingItem[]>(() => getUpcomingItems(todayKey, 400));

/** 年份翻页偏移（以今年为 0） */
const yearOffset = ref(0);
const year = computed(() => new Date().getFullYear() + yearOffset.value);
const yearPeriods = computed(() => getStatutoryPeriods(year.value));
const yearPublished = computed(() => isStatutoryPublished(year.value));

/**
 * 后台下发的记录按「同名 + 连续 + 同休息属性」归并成区间。
 *
 * <p>后台按<b>日期逐行</b>存储（7 天假期 = 7 行），不归并的话列表里会看到
 * 7 条一模一样的「国庆节」。</p>
 */
const remoteGroups = computed(() => {
  const rows = getRemoteHolidays(year.value);
  const groups: Array<{ name: string; isHoliday: boolean; start: string; end: string; days: number }> = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    // 同名 + 同属性 + 与上一条日期相邻，才算同一段
    if (last && last.name === row.name && last.isHoliday === row.isHoliday && last.end === addDateKeyDays(row.key, -1)) {
      last.end = row.key;
      last.days += 1;
      continue;
    }
    groups.push({ name: row.name, isHoliday: row.isHoliday, start: row.key, end: row.key, days: 1 });
  }
  return groups;
});

/** 二十四节气（附农历对照与「已过」弱化） */
const terms = computed(() =>
  getYearSolarTerms(year.value).map((date, i) => {
    const info = date ? getDayInfo(date) : null;
    return {
      name: SOLAR_TERM_NAMES[i],
      date,
      lunar: info?.lunarText ?? "",
      past: date !== "" && date < todayKey,
    };
  }),
);

/**
 * 假期总天数。
 *
 * @param p 假期区间
 * @returns 含首含尾的天数
 */
function periodDays(p: StatutoryPeriod): number {
  return diffDays(p.start, p.end) + 1;
}

/**
 * 假期区间的紧凑中文表示。
 *
 * @param p 假期区间
 * @returns 如「10 月 1 日 — 10 月 7 日」；跨月时补上月份
 */
function formatRange(p: StatutoryPeriod): string {
  const s = p.start;
  const e = p.end;
  const head = mdOf(s);
  if (s.slice(5, 7) === e.slice(5, 7)) {
    return `${head} — ${Number(e.slice(8, 10))} 日`;
  }
  return `${head} — ${mdOf(e)}`;
}

/**
 * 日期键转「10 月 10 日」。
 *
 * @param key {@code YYYY-MM-DD}
 * @returns 中文月日
 */
function mdOf(key: string): string {
  return `${Number(key.slice(5, 7))} 月 ${Number(key.slice(8, 10))} 日`;
}

/**
 * 日期键的中文星期。
 *
 * @param key {@code YYYY-MM-DD}
 * @returns 如「六」
 */
function weekdayName(key: string): string {
  return WEEKDAY_NAMES[fromDateKey(key).getDay()];
}

/**
 * 该日的农历短文本。
 *
 * @param key {@code YYYY-MM-DD}
 * @returns 如「八月廿三」；农历数据不可用时为空串
 */
function lunarOf(key: string): string {
  return getDayInfo(key).lunarText;
}

// 打开时把年份复位，避免上次翻到 2029，再打开还停在那
watch(open, (v) => {
  if (v) yearOffset.value = 0;
});

/**
 * 触发后台重新下发。
 *
 * <p>loading 状态由父组件的请求时长决定会很难看，这里只包一层最短反馈：
 * 请求未在 400ms 内返回就显示 loading，避免快接口闪一下按钮。</p>
 */
async function onRefresh(): Promise<void> {
  refreshing.value = true;
  emit("refresh");
  window.setTimeout(() => {
    refreshing.value = false;
  }, 400);
}
</script>

<style lang="scss" scoped>
.holiday-panel {
  min-height: 320px;
}

/* ---- 正在放假时的横幅 ---- */
.holiday-panel__banner {
  margin-bottom: 12px;
  padding: 12px 16px;
  border-radius: var(--el-radius-md, 8px);
  background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-success) 30%, transparent);
}

.holiday-panel__banner.is-provisional {
  background: var(--el-fill-color-light);
  border-color: var(--el-border-color-lighter);
}

.holiday-panel__banner-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.holiday-panel__banner-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-color-success);
}

.holiday-panel__banner.is-provisional .holiday-panel__banner-name {
  color: var(--el-text-color-primary);
}

.holiday-panel__banner-tag {
  flex-shrink: 0;
  padding: 0 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
}

.holiday-panel__banner-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.holiday-panel__banner-hint {
  margin-top: 8px;
  padding-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  border-top: 1px dashed color-mix(in srgb, var(--el-color-success) 30%, transparent);
}

/* ---- 列表 ---- */
.holiday-panel__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.holiday-panel__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
  /* 左侧色条：与日历格子的语义色一致，两处对同一份数据给同一套读法 */
  border-left: 3px solid var(--el-color-success);
}

.holiday-panel__item.is-work {
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
  border-left-color: var(--el-color-warning);
}

/* 普通节日（不放假）用中性色条，避免每条都是「放假绿」而失去区分度 */
.holiday-panel__item.is-plain {
  border-left-color: var(--el-border-color);
}

.holiday-panel__item.is-today {
  box-shadow: inset 0 0 0 1px var(--el-color-primary);
}

.holiday-panel__item-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 78px;
  flex: none;
}

.holiday-panel__item-md {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.holiday-panel__item-week {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.holiday-panel__item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.holiday-panel__item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 连休天数：紧跟名称，是用户最想看的信息 */
.holiday-panel__item-span {
  margin-left: 4px;
  padding: 0 4px;
  font-style: normal;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-color-success);
  border: 1px solid color-mix(in srgb, var(--el-color-success) 40%, transparent);
  border-radius: var(--el-radius-xs, 4px);
}

.holiday-panel__item-prov {
  margin-left: 4px;
  padding: 0 4px;
  font-style: normal;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
}

.holiday-panel__item-lunar {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.holiday-panel__item-when {
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.is-today-text {
  font-weight: 600;
  color: var(--el-color-primary);
}

/* ---- 全年假期 ---- */
.holiday-panel__year-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.holiday-panel__year-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ---- 后台下发的自定义安排 ---- */
.holiday-panel__remote {
  margin-top: 12px;
}

.holiday-panel__remote-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.holiday-panel__period-days.is-work,
.holiday-panel__period-value.is-work {
  color: var(--el-color-warning);
}

/* 提示条：说明「为什么少了一部分数据」，避免用户以为漏了 */
.holiday-panel__notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: var(--el-radius-md, 8px);
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
}

.holiday-panel__period {
  padding: 8px 12px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
  border-left: 3px solid var(--el-color-success);
}

.holiday-panel__period-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.holiday-panel__period-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.holiday-panel__period-days {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.holiday-panel__period-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.holiday-panel__period-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}

.holiday-panel__period-label {
  flex: none;
  width: 32px;
  font-size: 12px;
  color: #fff;
  text-align: center;
  background: var(--el-color-success);
  border-radius: var(--el-radius-xs, 4px);
}

.holiday-panel__period-label.is-work {
  background: var(--el-color-warning);
}

.holiday-panel__period-value {
  color: var(--el-text-color-regular);
}

.holiday-panel__period-value.is-work {
  font-weight: 600;
  color: var(--el-color-warning);
}

/* ---- 节气 ---- */
.holiday-panel__term-note {
  margin-bottom: 8px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.holiday-panel__term-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.holiday-panel__term {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
  border-left: 3px solid var(--el-color-primary);
}

/* 已过的节气弱化，让「接下来是什么」一眼可见 */
.holiday-panel__term.is-past {
  opacity: 0.45;
  border-left-color: var(--el-border-color);
}

.holiday-panel__term-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.holiday-panel__term-date {
  font-size: 12px;
  color: var(--el-color-primary);
}

.holiday-panel__term-lunar {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>