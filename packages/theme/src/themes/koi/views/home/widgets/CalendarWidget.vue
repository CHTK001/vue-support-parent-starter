<template>
  <div class="calendar-widget">
    <div v-if="!widget.hideTitle" class="calendar-widget__header">
      <div class="calendar-widget__title">
        <el-icon class="calendar-widget__title-icon"><Calendar /></el-icon>
        <span>{{ widget.title }}</span>
        <span class="calendar-widget__count" v-if="eventCount">{{ eventCount }} 项</span>
      </div>
      <div class="calendar-widget__actions">
        <button
          type="button"
          class="calendar-widget__action"
          :class="{ 'is-on': showFestival }"
          :title="showFestival ? '隐藏节日与农历' : '显示节日与农历'"
          :aria-label="showFestival ? '隐藏节日与农历' : '显示节日与农历'"
          :aria-pressed="showFestival"
          @click="toggleFestival"
        >
          <el-icon><Sunny /></el-icon>
        </button>
        <button
          type="button"
          class="calendar-widget__action"
          title="节日与放假安排"
          aria-label="节日与放假安排"
          @click="holidayVisible = true"
        >
          <el-icon><Present /></el-icon>
        </button>
        <button
          type="button"
          class="calendar-widget__add"
          :title="`添加于 ${todayLabel}`"
          :aria-label="`添加日程于 ${todayLabel}`"
          @click="openAdd(todayKey)"
        >
          <el-icon><Plus /></el-icon>
        </button>
      </div>
    </div>

    <!-- 今日摘要：农历 + 节日 + 假期进度 -->
    <div v-if="showFestival" class="calendar-widget__today" v-loading="loading">
      <template v-if="todayInfo">
        <div class="calendar-widget__today-row">
          <span class="calendar-widget__today-date">{{ todayText }}</span>
          <span class="calendar-widget__today-lunar">{{ todayLunarText }}</span>
        </div>
        <div class="calendar-widget__today-row">
          <span v-if="todayFestival" class="calendar-widget__today-festival">{{ todayFestival }}</span>
          <span v-else class="calendar-widget__today-lunar">{{ todayGanZhi }}</span>
          <span v-if="todayPeriod" class="calendar-widget__today-holiday">
            <span class="calendar-widget__today-progress">
              {{ todayPeriod.name }}
              <em>{{ todayPeriodDay }}/{{ todayPeriodDays }} 天</em>
            </span>
            <span class="calendar-widget__today-pips" aria-hidden="true">
              <i
                v-for="n in todayPeriodDays"
                :key="n"
                class="calendar-widget__today-pip"
                :class="{ 'is-done': n <= todayPeriodDay }"
              />
            </span>
            <em v-if="todayInfo.provisional" class="calendar-widget__today-provisional">待公布</em>
          </span>
          <span v-else-if="todayInfo.badge === '班'" class="calendar-widget__today-work">
            调休上班
          </span>
          <span v-else-if="todayInfo.isWeekend" class="calendar-widget__today-rest">周末休息</span>
        </div>
        <div v-if="nextHolidayText" class="calendar-widget__today-next">
          <el-icon><Right /></el-icon>
          <span>{{ nextHolidayText }}</span>
        </div>
      </template>
    </div>

    <!-- 图例：休/班与节日色阶的含义不写出来就只能靠猜 -->
    <div v-if="showLegend" class="calendar-widget__legend">
      <span v-if="showBadge" class="calendar-widget__legend-item">
        <i class="calendar-widget__legend-badge is-rest">休</i>放假
      </span>
      <span v-if="showBadge" class="calendar-widget__legend-item">
        <i class="calendar-widget__legend-badge is-work">班</i>调休上班
      </span>
      <span v-if="showFestival" class="calendar-widget__legend-item">
        <i class="calendar-widget__legend-bar is-lv1" />法定节日
      </span>
      <span v-if="showFestival" class="calendar-widget__legend-item">
        <i class="calendar-widget__legend-bar is-lv3" />纪念日 / 节气
      </span>
      <span v-if="showFestival" class="calendar-widget__legend-item">
        <i class="calendar-widget__legend-bar is-lunar" />农历
      </span>
    </div>

    <div
      class="calendar-widget__body"
      :class="{ 'is-fixed-height': fixedCellHeight }"
      v-loading="loading"
    >
      <el-calendar v-model="calendarDate">
        <template #date-cell="{ data }">
          <div
            class="calendar-widget__cell"
            :class="cellClassOf(data.day)"
          >
            <div class="calendar-widget__cell-head">
              <span class="calendar-widget__cell-date">{{ dayNumberOf(data.day) }}</span>
              <span v-if="showBadge && infoOf(data.day)?.badge" class="calendar-widget__cell-badge">
                {{ infoOf(data.day)?.badge }}
              </span>
            </div>
            <!-- 节日行（无节日时这一行显示农历） -->
            <div v-if="showFestival && festivalTextOf(data.day)" class="calendar-widget__cell-sub">
              <span
                class="calendar-widget__cell-festival"
                :class="festivalClassOf(data.day)"
                :title="festivalTitleOf(data.day)"
              >{{ festivalTextOf(data.day) }}</span>
            </div>
            <!-- 农历行：仅在「全部显示」且当天确有节日时才占一行。
                 两个条件缺一不可：① 当天没节日时节日行已经在显示农历，这里再出一行是
                 「十三」上面又写「十三」；② lunarLineTextOf 无节日时返回空串，而本行
                 .cell-sub 有 min-height，不加这个判断就会在全年 271 个无节日日各留一条
                 16px 的空行，把格子撑高。 -->
            <div v-if="showLunarLine && lunarLineTextOf(data.day)" class="calendar-widget__cell-sub">
              <span class="calendar-widget__cell-festival is-lunar">{{ lunarLineTextOf(data.day) }}</span>
            </div>
            <ul class="calendar-widget__cell-events" v-if="grouped[data.day]?.length && eventRows > 0">
              <li
                v-for="ev in grouped[data.day].slice(0, eventRows)"
                :key="ev.id"
                class="calendar-widget__cell-event"
                :title="ev.title"
                @click.stop="openEdit(ev)"
              >
                <span class="calendar-widget__cell-bullet" :style="{ background: categoryColor(ev.category) }" />
                <span class="calendar-widget__cell-text">{{ ev.title }}</span>
              </li>
              <li v-if="grouped[data.day].length > eventRows" class="calendar-widget__cell-more">
                +{{ grouped[data.day].length - eventRows }} 更多
              </li>
            </ul>
          </div>
        </template>
      </el-calendar>
    </div>

    <CalendarHolidayDialog
      v-model="holidayVisible"
      :remote-status="remoteStatus"
      :remote-count="remoteCount"
      @refresh="refreshRemoteHolidays"
    />

    <!-- 新增 / 编辑 -->
    <ReDialog
      v-model="dialogVisible"
      :title="editing ? '编辑日程' : '添加日程'"
      :width="420"
      confirm-text="保存"
      cancel-text="取消"
      destroy-on-close
      @confirm="save"
      @cancel="dialogVisible = false"
    >
      <template #content>
        <div class="calendar-widget__form-head" v-if="editing">
          <ReButton type="danger" plain @click="remove">删除</ReButton>
        </div>
        <el-form :model="form" label-width="80px" size="default">
          <el-form-item label="日期">
            <ReDatePicker
              v-model="form.date"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="标题" required>
            <ReInput v-model="form.title" maxlength="40" placeholder="日程标题" />
          </el-form-item>
          <el-form-item label="全天">
            <ReSwitch layout="square" v-model="form.allDay">
              <el-icon><Sunny /></el-icon>
            </ReSwitch>
          </el-form-item>
          <el-form-item label="时间" v-if="!form.allDay">
            <el-time-picker
              v-model="form.time"
              placeholder="开始时间"
              format="HH:mm"
              value-format="HH:mm"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="分类">
            <el-select v-model="form.category" placeholder="选择分类" style="width: 100%">
              <el-option v-for="opt in CATEGORY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value">
                <span class="calendar-widget__category-dot" :style="{ background: opt.color }" />
                <span>{{ opt.label }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <ReInput v-model="form.note" type="textarea" :rows="2" maxlength="120" placeholder="可选" />
          </el-form-item>
        </el-form>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts" name="CalendarWidget">

/**
 * 日历 widget（el-calendar + IndexedDB 持久化）
 *
 * 数据：按当前用户 ID 隔离的 IndexedDB 数据库（koi-home-calendar-{userId}）。
 * 每个事件包含：date / title / time / allDay / category / note / id / createdAt。
 *
 * 节日信息（农历 / 节气 / 节日 / 法定放假调休）全部由 ./calendar 聚合层提供，
 * 本组件只负责取数与呈现，不自行做历法换算 —— 换算逻辑集中在一处，
 * 格子与「节日安排」面板才不会显示不一致的内容。
 */
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Calendar, Plus, Present, Right, Sunny } from "@element-plus/icons-vue";
// CalendarCategory 由 calendarStore 定义（calendarCategories 只导入未再导出），
// 从来源直接取，避免依赖一个并不存在的再导出
import { getCalendarStore, type CalendarCategory, type CalendarEvent } from "./calendarStore";
import { CATEGORY_OPTIONS, categoryColor } from "./calendarCategories";
import {
  diffDays,
  festivalDisplayText,
  findNextHoliday,
  getDayInfo,
  invalidateDayCache,
  lunarFullText,
  setRemoteHolidays,
  type DayInfo,
} from "./calendar";
import { fetchHolidays } from "@repo/core";
import useAuthStore from "@repo/pinia/modules/auth";
import {
  calendarEventRows,
  isFixedCellHeight,
  type CalendarCellMode,
  type WidgetItem,
} from "../types";

const ReDialog = defineAsyncComponent(() => import("@repo/ui/re-dialog").then((m) => m.default));
const ReSwitch = defineAsyncComponent(() => import("@repo/ui/re-switch").then((m) => m.default));
const ReButton = defineAsyncComponent(() => import("@repo/ui/re-button").then((m) => m.default));
const ReInput = defineAsyncComponent(() => import("@repo/ui/re-input").then((m) => m.default));
const ReDatePicker = defineAsyncComponent(() => import("@repo/ui/re-date-picker").then((m) => m.default));
const CalendarHolidayDialog = defineAsyncComponent(
  () => import("./calendar/CalendarHolidayDialog.vue").then((m) => m.default),
);

const props = defineProps<{ widget: WidgetItem }>();

/**
 * widget 自己改了配置 → 交给页面层落盘。
 *
 * <p>{@code widget} 是 props，不能直接写。头部开关要能持久化，就只能向上抛；
 * 页面层用 {@code patchWidget} 深一层合并，不会连带抹掉设置弹窗里的其它项。</p>
 */
const emit = defineEmits<{ (e: "patch-config", patch: Partial<WidgetItem>): void }>();

const authStore = useAuthStore();
const userId = computed(() => String(authStore.loginUser?.userId ?? authStore.loginUser?.id ?? "anonymous"));

const calendarDate = ref<Date>(new Date());
const events = ref<CalendarEvent[]>([]);
const loading = ref(true);
const errored = ref(false);

/**
 * 显示配置。
 *
 * <p>存在 widget.calendarConfig 里，随布局一起持久化 —— 与 noteConfig / config 同一套路，
 * 这样「A 用户全部显示、B 用户 3 行」能各自生效，且换设备后保持一致。
 * 缺省即 {@link CalendarCellMode} 的 {@code "all"}（全部显示）。</p>
 */
const cellMode = computed<CalendarCellMode>(() => props.widget.calendarConfig?.cellMode ?? "all");
const showFestival = computed(() => props.widget.calendarConfig?.showFestival ?? true);
const showBadge = computed(() => props.widget.calendarConfig?.showBadge ?? true);

/** 格子是否固定高度；「全部显示」模式随内容增长，其余固定 */
const fixedCellHeight = computed(() => isFixedCellHeight(cellMode.value));

/** 「全部显示」模式下才给农历单开一行 */
const showLunarLine = computed(() => cellMode.value === "all" && showFestival.value);

/**
 * 图例是否显示。
 *
 * <p>角标与节日色阶的含义没有任何文字说明时只能靠猜（「班」到底是上班还是补班？
 * 红色是节日还是错误？）。图例很占一行，故只在对应内容可见时才出现 ——
 * 节日关掉就不显示节日色阶那一段，而不是留一行空图例。</p>
 */
const showLegend = computed(() => showFestival.value || showBadge.value);

/** 头部 Sunny 按钮：切换节日行（与设置弹窗里的开关是同一份配置） */
function toggleFestival(): void {
  emit("patch-config", { calendarConfig: { showFestival: !showFestival.value } });
}

/** 节日安排弹窗 */
const holidayVisible = ref(false);
/** 已从后台加载的年份，避免每月都重复请求 */
const remoteLoadedYears = new Set<number>();
/** 后台数据来源状态，供面板显示 */
const remoteStatus = ref<"unknown" | "ok" | "empty" | "unavailable">("unknown");
const remoteCount = ref(0);

/**
 * 拉取后台节假日并装入覆盖层。
 *
 * <p>失败<b>不报错</b>：日历有内置表 + 推算兜底，取不到就退回本地，
 * 让整页挂掉反而不划算。只有「后台有但今年没录数据」才提示，便于管理员发现漏录。</p>
 *
 * @param force 忽略「该年已加载」缓存，强制重新请求
 * @returns 是否成功拿到后台数据
 */
async function loadRemoteHolidays(force = false): Promise<boolean> {
  const year = now.value.getFullYear();
  if (!force && remoteLoadedYears.has(year)) return remoteStatus.value === "ok" || remoteStatus.value === "empty";
  remoteLoadedYears.add(year);
  const list = await fetchHolidays(year);
  if (list === null) {
    remoteStatus.value = "unavailable";
    return false;
  }
  remoteCount.value = setRemoteHolidays(year, list);
  remoteStatus.value = list.length ? "ok" : "empty";
  // 覆盖层变了，已缓存的 DayInfo 必须重算，否则格子仍显示本地结果
  invalidateDayCache();
  midnightTick.value += 1;
  return true;
}

/** 面板里的手动刷新 */
async function refreshRemoteHolidays(): Promise<void> {
  const ok = await loadRemoteHolidays(true);
  if (ok) {
    ElMessage.success(remoteCount.value ? `已更新，后台共 ${remoteCount.value} 条` : "后台今年暂无数据");
  } else {
    ElMessage.warning("后台节假日接口不可用，已使用内置数据");
  }
}

const store = computed(() => getCalendarStore(userId.value));

const dialogVisible = ref(false);
const editing = ref(false);
const form = ref<{
  id?: string;
  date: string;
  title: string;
  allDay: boolean;
  time: string;
  category: CalendarCategory;
  note: string;
}>({
  date: "",
  title: "",
  allDay: true,
  time: "09:00",
  category: "work",
  note: "",
});

/**
 * 「现在」。
 *
 * <p>做成响应式而不是模块加载时算一次的常量：后台标签页挂一整夜很常见，
 * 而「今天」的日期、星期、假期第几天全都依赖它。只在跨零点时替换引用，
 * 不需要刷新页面，也不会打断正在填写的日程弹窗。</p>
 */
const now = ref(new Date());
const todayKey = computed(() => formatKey(now.value));
const todayLabel = computed(() => todayKey.value);
const todayWeekday = computed(() => now.value.getDay());

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * 跨零点后强制重渲染的信号量。
 *
 * <p>{@link getDayInfo} 的结果是普通对象（含 {@code isToday} 等字段），本身不是响应式的。
 * 跨零点清了缓存之后若没有这个信号，格子里「今天」的高亮会停在昨天，
 * 因为没有任何响应式依赖发生变化。</p>
 */
const midnightTick = ref(0);

/** 取格子的展示数据；顺带读一下 {@link midnightTick} 建立渲染依赖 */
function infoOf(dayKey: string): DayInfo | undefined {
  midnightTick.value;
  return getDayInfo(dayKey);
}

/** 格子左侧的公历日（去掉前导零，「1」比「01」省一格宽度） */
function dayNumberOf(dayKey: string): string {
  return String(Number(dayKey.slice(8, 10)));
}

/**
 * 格子里那一行优先显示什么。
 *
 * <p>顺序：法定节假日 / 除夕 / 后台下发 → 农历节日 → 公历节日 → 第 N 个星期 X → 节气，
 * 都取优先级最高的一个；一个都没有才退回农历日。春节当天不能显示「情人节」，
 * 平时也不该让「三八妇女节」把农历挤掉，所以法定与农历节日在前、节气最后。</p>
 *
 * <p>取的是<b>短名</b>：格子宽度由表格自动分配，长名会变省略号；
 * 全称在 {@link festivalTitleOf} 的悬浮提示与节日面板里。</p>
 */
function festivalTextOf(dayKey: string): string {
  const info = infoOf(dayKey);
  if (!info) return "";
  const f = info.festivals[0];
  if (!f) return info.lunarText;
  return festivalDisplayText(f);
}

/** 悬浮提示：把当天所有节日的全称与农历一次说清 */
function festivalTitleOf(dayKey: string): string {
  const info = infoOf(dayKey);
  if (!info) return "";
  const parts = [lunarFullText(info.lunar)];
  if (info.festivals.length) parts.push(info.festivals.map((f) => f.name).join("、"));
  if (info.badge === "班") parts.push("调休上班");
  return parts.filter(Boolean).join(" · ");
}

/**
 * 农历独立行显示什么。
 *
 * <p>当天有节日时显示农历（如「端午」下一行「五月初五」）；
 * 没有节日时节日行已经在显示农历了，这里返回空串避免重复。</p>
 */
function lunarLineTextOf(dayKey: string): string {
  const info = infoOf(dayKey);
  if (!info || !info.festivals.length) return "";
  return info.lunarText;
}

/** 节日名按级别着色：1 级主色、2 级次要、3 级弱化 */
function festivalClassOf(dayKey: string): string {
  const info = infoOf(dayKey);
  const f = info?.festivals[0];
  if (!f) return "is-lunar";
  if (info?.badge === "班") return "is-work";
  return `is-lv${f.level}`;
}

/** 整格的底色与描边：假期 / 调休 / 今天 / 周末 */
function cellClassOf(dayKey: string): Record<string, boolean> {
  const info = infoOf(dayKey);
  return {
    "is-today": !!info?.isToday,
    // 只看 isWeekend，不看 isRest：调休上班的周六也是周末，但日期色仍应与工作日有别，
    // 否则「周六上班」和「周六休息」在日期数字上完全一样，只能靠角标分辨
    "is-weekend": !!info?.isWeekend,
    "is-holiday": !!info?.isRest && !info?.isMakeupWork,
    "is-workday": !!info?.isMakeupWork,
  };
}

/**
 * 格子里最多放几条日程。
 *
 * <p>算法与说明都在 {@link calendarEventRows} 里，这里只做响应式转接，
 * 免得同一套行数预算在两处各写一遍后漂移。</p>
 */
const eventRows = computed(() => calendarEventRows(cellMode.value, showFestival.value));

const todayInfo = computed(() => getDayInfo(todayKey.value));
const todayText = computed(
  () =>
    `${now.value.getFullYear()} 年 ${now.value.getMonth() + 1} 月 ${now.value.getDate()} 日 · 星期${
      "日一二三四五六"[todayWeekday.value]
    }`,
);
const todayLunarText = computed(() => todayInfo.value?.lunarText ?? "");
/** 干支纪年：第二行的兜底内容，比重复一遍农历日多给一个信息 */
const todayGanZhi = computed(() => todayInfo.value?.lunar?.ganzhi ?? "");
const todayFestival = computed(() => todayInfo.value?.festivals[0]?.name ?? "");
const todayPeriod = computed(() => todayInfo.value?.period ?? null);

/** 今天在整段假期里的第几天（1 起） */
const todayPeriodDay = computed(() => {
  const p = todayPeriod.value;
  return p ? diffDays(p.start, todayKey.value) + 1 : 0;
});

/** 整段假期共几天 */
const todayPeriodDays = computed(() => {
  const p = todayPeriod.value;
  return p ? diffDays(p.start, p.end) + 1 : 0;
});

/** 下一个法定假期还有几天；正在放假中则不提示 */
const nextHolidayText = computed(() => {
  if (todayPeriod.value) return "";
  const next = findNextHoliday(todayKey.value, 400);
  if (!next) return "";
  const days = diffDays(todayKey.value, next.start);
  const when = days === 0 ? "今天开始" : `${days} 天后`;
  return `${next.name}：${next.start.slice(5).replace("-", " 月 ")} 日（${when}）`;
});

const grouped = computed(() => {
  const m: Record<string, CalendarEvent[]> = {};
  events.value.forEach((ev) => {
    if (!m[ev.date]) m[ev.date] = [];
    m[ev.date].push(ev);
  });
  return m;
});

const eventCount = computed(() => events.value.length);

function load(): void {
  loading.value = true;
  errored.value = false;
  store.value
    .getAll<CalendarEvent>()
    .then((list) => {
      events.value = list.sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));
    })
    .catch((err) => {
      errored.value = true;
      console.warn("[calendar-widget] load failed", err);
    })
    .finally(() => {
      loading.value = false;
    });
}

function openAdd(date: string): void {
  editing.value = false;
  form.value = {
    date,
    title: "",
    allDay: true,
    time: "09:00",
    category: "work",
    note: "",
  };
  dialogVisible.value = true;
}

function openEdit(ev: CalendarEvent): void {
  editing.value = true;
  form.value = {
    id: ev.id,
    date: ev.date,
    title: ev.title,
    allDay: ev.allDay,
    time: ev.time ?? "09:00",
    category: ev.category,
    note: ev.note ?? "",
  };
  dialogVisible.value = true;
}

async function save(): Promise<void> {
  const title = form.value.title.trim();
  if (!title) {
    ElMessage.warning("请输入标题");
    return;
  }
  const now = Date.now();
  const ev: CalendarEvent = {
    id: form.value.id ?? `ev_${now}_${Math.random().toString(36).slice(2, 6)}`,
    date: form.value.date,
    title,
    allDay: form.value.allDay,
    time: form.value.allDay ? undefined : form.value.time,
    category: form.value.category,
    note: form.value.note?.trim() || undefined,
    createdAt: editing.value
      ? events.value.find((e) => e.id === form.value.id)?.createdAt ?? now
      : now,
  };
  try {
    await store.value.put(ev);
    dialogVisible.value = false;
    load();
    ElMessage.success("已保存");
  } catch (err) {
    console.error(err);
    ElMessage.error("保存失败");
  }
}

async function remove(): Promise<void> {
  if (!form.value.id) return;
  try {
    await ElMessageBox.confirm("确认删除该日程？", "提示", { type: "warning" });
    await store.value.remove(form.value.id);
    dialogVisible.value = false;
    load();
    ElMessage.success("已删除");
  } catch (err) {
    if (err === "cancel") return;
    console.error(err);
    ElMessage.error("删除失败");
  }
}

/** 跨零点的巡检定时器 */
let timer: number | undefined;

/**
 * 每分钟比对一次日期，变了就清「今天」缓存并前移 {@link now}。
 *
 * <p>缓存里存了 {@code isToday}，不清理的话高亮会停在昨天；{@code now} 不更新的话
 * 「今日摘要」里的星期与假期天数也跟着错。</p>
 */
function onMidnight(): void {
  const fresh = formatKey(new Date());
  if (fresh === todayKey.value) return;
  invalidateDayCache();
  now.value = new Date();
  midnightTick.value += 1;
  // 跨年后要拉新一年的后台数据，旧年份的记录仍在覆盖层里但不会被读到
  remoteLoadedYears.clear();
  void loadRemoteHolidays();
}

onMounted(() => {
  load();
  // 后台节假日为可选增强：失败静默退回内置表，不打断首页渲染
  void loadRemoteHolidays();
  // 后台标签页常开着过夜：每分钟检查一次，跨零点则清缓存并前移「今天」
  timer = window.setInterval(onMidnight, 60_000);
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});

// 用户切换时重新加载
watch(userId, () => load());
</script>

<style lang="scss" scoped>
/* ============================================================
   日历 widget 样式
   对齐 koi 风格清单：
     - 圆角只用令牌 xs4 / sm6 / md8 / lg12 / full9999，无魔法值
     - 字号最小 12px（caption），正文 14，不发明 9/10/11px
     - 颜色只用 --el-*，暗色靠变量自动翻转
     - 卡片无投影，靠 border 与背景分层
     - 间距走 4 / 8 基准
   ============================================================ */
.calendar-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  overflow: hidden;
}

/* ---------------- 头部 ---------------- */
.calendar-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px 8px;
}

.calendar-widget__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.calendar-widget__title-icon {
  flex-shrink: 0;
  color: var(--el-color-primary);
}

.calendar-widget__count {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
}

.calendar-widget__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* ---------------- 头部按钮 ----------------
   裸 <button> 而非 ReButton：这里只需要 icon-only + tooltip，
   套组件反而多一层 DOM。用 sm 圆角（控件级）与 32px 命中区。 */
.calendar-widget__add,
.calendar-widget__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);
}

/* 键盘可达：图标按钮同样需要焦点环，否则只能靠鼠标点 */
.calendar-widget__add:focus-visible,
.calendar-widget__action:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.calendar-widget__add {
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
}

.calendar-widget__add:hover {
  background: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
}

.calendar-widget__action:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 开启态与「+」同色系，让用户看得出这个开关现在是开的 */
.calendar-widget__action.is-on {
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
}

/* ---------------- 今日摘要 ---------------- */
.calendar-widget__today {
  margin: 0 16px 8px;
  padding: 12px 16px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
}

.calendar-widget__today-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  /* min-width:0 让长内容能收缩，否则「国庆节 第 4 天 / 共 7 天」会把左侧日期挤出格 */
  min-width: 0;
}

.calendar-widget__today-row + .calendar-widget__today-row {
  margin-top: 8px;
}

.calendar-widget__today-date {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.calendar-widget__today-lunar {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.calendar-widget__today-festival {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
}

/* 假期进度：名称 + 天数 + 进度点，一眼看出「还剩几天」 */
.calendar-widget__today-holiday {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.calendar-widget__today-progress {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-success);
}

.calendar-widget__today-progress em {
  font-style: normal;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.calendar-widget__today-pips {
  display: flex;
  align-items: center;
  gap: 3px;
  min-width: 0;
}

.calendar-widget__today-pip {
  width: 5px;
  height: 5px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-border-color);
}

.calendar-widget__today-pip.is-done {
  background: var(--el-color-success);
}

.calendar-widget__today-work {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-warning);
}

.calendar-widget__today-rest {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 推算值必须弱化：它是「按放假办法推出法定假日当天」，不是官方调休安排 */
.calendar-widget__today-provisional {
  flex-shrink: 0;
  padding: 0 4px;
  font-style: normal;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xs, 4px);
}

.calendar-widget__today-next {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---------------- 图例 ----------------
   「班」到底是上班还是补班？红色是节日还是报错？
   这些含义不写出来就只能靠猜，所以图例是功能而非装饰。 */
.calendar-widget__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  margin: 0 16px 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.calendar-widget__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.calendar-widget__legend-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 16px;
  font-style: normal;
  font-size: 12px;
  line-height: 1;
  color: #fff;
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-color-success);
}

.calendar-widget__legend-badge.is-work {
  background: var(--el-color-warning);
}

.calendar-widget__legend-bar {
  width: 3px;
  height: 12px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-danger);
}

.calendar-widget__legend-bar.is-lv3 {
  background: var(--el-text-color-secondary);
}

.calendar-widget__legend-bar.is-lunar {
  background: var(--el-text-color-placeholder);
}

/* ---------------- 日历主体 ---------------- */
.calendar-widget__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 16px 16px;
}

/* ---------------- 格子 ---------------- */
.calendar-widget__cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  height: 100%;
  padding: 4px;
  border-radius: var(--el-radius-sm, 6px);
  /* 顶部 2px 色条标记「这段是假期 / 这天要上班」，比逐日底色更容易连成一片读出来。
     跨行时色条会断开 —— 强行做首尾圆角在表格跨行结构上极易错位，不值得。*/
  border-top: 2px solid transparent;
  transition: background var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);
}

/* 放假日：淡绿底 + 绿条 */
.calendar-widget__cell.is-holiday {
  background: color-mix(in srgb, var(--el-color-success) 8%, transparent);
  border-top-color: var(--el-color-success);
}

/* 调休上班日：淡橙底 + 橙条。语义是「这天要上班」，不能被读成「放假」 */
.calendar-widget__cell.is-workday {
  background: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
  border-top-color: var(--el-color-warning);
}

/* 今天：主色内描边。刻意不叠背景色 —— 会盖掉 is-holiday / is-workday 的语义底色 */
.calendar-widget__cell.is-today {
  box-shadow: inset 0 0 0 1.5px var(--el-color-primary);
}

.calendar-widget__cell-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
  min-height: 18px;
}

.calendar-widget__cell-date {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

/* 周末日期用次要色，与工作日一眼区分（不只靠背景） */
.calendar-widget__cell.is-weekend:not(.is-today) .calendar-widget__cell-date {
  color: var(--el-text-color-secondary);
}

.calendar-widget__cell.is-today .calendar-widget__cell-date {
  font-weight: 700;
  color: var(--el-color-primary);
}

.calendar-widget__cell-badge {
  flex-shrink: 0;
  padding: 0 4px;
  font-size: 12px;
  line-height: 16px;
  color: #fff;
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-color-success);
}

/* 「班」与「休」同形不同字，不只靠颜色区分（色觉障碍用户也要能读出来） */
.calendar-widget__cell.is-workday .calendar-widget__cell-badge {
  background: var(--el-color-warning);
}

/* ---------------- 节日 / 农历行 ---------------- */
.calendar-widget__cell-sub {
  display: flex;
  align-items: center;
  min-height: 16px;
  overflow: hidden;
}

.calendar-widget__cell-festival {
  /* 左侧色条按级别着色：扫整月时先看到色条再看字，比只靠字色快得多。
     padding-left 5px 要大于 border-left 3px，否则首字会贴着色条。*/
  padding-left: 5px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-left: 3px solid var(--el-text-color-placeholder);
}

/* 农历（无节日时的回退文本）最弱 */
.calendar-widget__cell-festival.is-lunar {
  color: var(--el-text-color-placeholder);
  border-left-color: var(--el-border-color);
}

/* 节日级别：1 级红加粗、2 级主色、3 级弱化 */
.calendar-widget__cell-festival.is-lv1 {
  color: var(--el-color-danger);
  font-weight: 600;
  border-left-color: var(--el-color-danger);
}

.calendar-widget__cell-festival.is-lv2 {
  color: var(--el-color-primary);
  font-weight: 500;
  border-left-color: var(--el-color-primary);
}

.calendar-widget__cell-festival.is-lv3 {
  border-left-color: var(--el-text-color-secondary);
}

/* 调休上班日的节日名不走红色 —— 那天是要上班的，红色会被误读成放假 */
.calendar-widget__cell-festival.is-work {
  color: var(--el-color-warning);
  font-weight: 600;
  border-left-color: var(--el-color-warning);
}

/* ---------------- 日程 ---------------- */
.calendar-widget__cell-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.calendar-widget__cell-event {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  overflow: hidden;
}

.calendar-widget__cell-event:hover .calendar-widget__cell-text {
  color: var(--el-color-primary);
}

.calendar-widget__cell-bullet {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: var(--el-radius-full, 9999px);
}

.calendar-widget__cell-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-widget__cell-more {
  padding-left: 10px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.calendar-widget__category-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 6px;
  border-radius: var(--el-radius-full, 9999px);
}

.calendar-widget__form-head {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

/* ---------------- el-calendar 内部微调 ---------------- */
:deep(.el-calendar) {
  /* 注意：Element Plus 的 --el-calendar-cell-width 只控制 el-calendar-day 的「高度」
     （默认 85px），td 并没有宽度规则 —— 每格宽度由表格按 widget 实际渲染宽度自动分配。
     所以格内文本一律单行 + 省略号兜底，长节日名用短名（见 festivals.ts 的 short）。*/
  --el-calendar-cell-width: 60px;
  /* 选中底色置空：el-calendar 会给「当前选中日」上底色，与 is-today 的主色描边
     以及 is-holiday / is-workday 的语义底色三者打架，置空后由格子自己表达状态。*/
  --el-calendar-selected-bg-color: transparent;
  border-radius: var(--el-radius-md, 8px);
  overflow: hidden;
}

:deep(.el-calendar__header) {
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-calendar__title) {
  font-size: 15px;
  font-weight: 600;
}

:deep(.el-calendar-table thead th) {
  padding: 8px 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

/* 60px 只是下限：「全部显示」模式要靠格子长高来容纳多行，
   固定 height 会把内容压掉（Element Plus 默认就是写死 height）。*/
:deep(.el-calendar-table .el-calendar-day) {
  padding: 0;
  min-height: 60px;
  height: auto;
  vertical-align: top;
  transition: background var(--el-transition-duration, 0.2s);
}

/* 固定行数模式（最多 3 / 4 行）才写死高度，否则同一天日程多寡会让整行忽高忽低 */
.calendar-widget__body.is-fixed-height :deep(.el-calendar-table .el-calendar-day) {
  height: 60px;
  overflow: hidden;
}

:deep(.el-calendar-table .el-calendar-day:hover) {
  background: var(--el-fill-color-light);
}

:deep(.el-calendar-table td) {
  border-color: var(--el-border-color-lighter);
}

/* 表头分隔线用虚线，与格子实线区分，避免误以为也是假期 */
:deep(.el-calendar-table thead tr:first-child th) {
  border-bottom: 1px dashed var(--el-border-color-lighter);
}
</style>
