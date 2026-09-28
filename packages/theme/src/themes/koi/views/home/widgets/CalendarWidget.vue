<template>
  <div class="calendar-widget">
    <div v-if="!widget.hideTitle" class="calendar-widget__header">
      <div class="calendar-widget__title">
        <el-icon class="calendar-widget__title-icon"><Calendar /></el-icon>
        <span>{{ widget.title }}</span>
        <span class="calendar-widget__count" v-if="eventCount">{{ eventCount }} 项</span>
      </div>
      <div class="calendar-widget__actions">
        <button type="button" class="calendar-widget__add" :title="`添加于 ${todayLabel}`" @click="openAdd(todayKey)">
          <el-icon><Plus /></el-icon>
        </button>
      </div>
    </div>

    <div class="calendar-widget__body" v-loading="loading">
      <el-calendar v-model="calendarDate">
        <template #date-cell="{ data }">
          <div class="calendar-widget__cell" :class="{ 'is-today': data.isSelected }">
            <div class="calendar-widget__cell-date">{{ data.day.split('-').slice(2).join('') }}</div>
            <ul class="calendar-widget__cell-events" v-if="grouped[data.day]?.length">
              <li
                v-for="ev in grouped[data.day].slice(0, 2)"
                :key="ev.id"
                class="calendar-widget__cell-event"
                :title="ev.title"
                @click.stop="openEdit(ev)"
              >
                <span class="calendar-widget__cell-bullet" :style="{ background: categoryColor(ev.category) }" />
                <span class="calendar-widget__cell-text">{{ ev.title }}</span>
              </li>
              <li v-if="grouped[data.day].length > 2" class="calendar-widget__cell-more">
                +{{ grouped[data.day].length - 2 }} 更多
              </li>
            </ul>
          </div>
        </template>
      </el-calendar>
    </div>

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
// @ts-nocheck

// @ts-nocheck
/**
 * 日历 widget（el-calendar + IndexedDB 持久化）
 *
 * 数据：按当前用户 ID 隔离的 IndexedDB 数据库（koi-home-calendar-{userId}）。
 * 每个事件包含：date / title / time / allDay / category / note / id / createdAt。
 */
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Calendar, Plus, Sunny } from "@element-plus/icons-vue";
import { getCalendarStore, type CalendarEvent } from "./calendarStore";
import { CATEGORY_OPTIONS, categoryColor, type CalendarCategory } from "./calendarCategories";
import useAuthStore from "@repo/pinia/modules/auth";
import type { WidgetItem } from "../types";

const ReDialog = defineAsyncComponent(() => import("@repo/ui/re-dialog").then((m) => m.default));
const ReSwitch = defineAsyncComponent(() => import("@repo/ui/re-switch").then((m) => m.default));
const ReButton = defineAsyncComponent(() => import("@repo/ui/re-button").then((m) => m.default));
const ReInput = defineAsyncComponent(() => import("@repo/ui/re-input").then((m) => m.default));
const ReDatePicker = defineAsyncComponent(() => import("@repo/ui/re-date-picker").then((m) => m.default));

const props = defineProps<{ widget: WidgetItem }>();

const authStore = useAuthStore();
const userId = computed(() => String(authStore.loginUser?.userId ?? authStore.loginUser?.id ?? "anonymous"));

const calendarDate = ref<Date>(new Date());
const events = ref<CalendarEvent[]>([]);
const loading = ref(true);
const errored = ref(false);

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

const today = new Date();
const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
const todayLabel = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

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

onMounted(() => {
  load();
});

// 用户切换时重新加载
watch(userId, () => load());
</script>

<style lang="scss" scoped>
.calendar-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
}

.calendar-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}

.calendar-widget__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.calendar-widget__title-icon {
  color: var(--el-color-primary);
}

.calendar-widget__count {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: 999px;
}

.calendar-widget__add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
  cursor: pointer;
  transition: background 0.15s;
}

.calendar-widget__add:hover {
  background: color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.calendar-widget__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 12px 12px;
}

.calendar-widget__cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  height: 100%;
  padding: 2px 4px;
}

.calendar-widget__cell-date {
  font-size: 12px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.calendar-widget__cell-events {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.calendar-widget__cell-event {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-widget__cell-bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.calendar-widget__cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.calendar-widget__cell-more {
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.calendar-widget__category-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.calendar-widget__form-head {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

/* el-calendar 内部样式微调（现代化扁平） */
:deep(.el-calendar) {
  --el-calendar-cell-width: 60px;
  --el-calendar-selected-bg-color: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  border-radius: 10px;
  overflow: hidden;
}

:deep(.el-calendar__header) {
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-calendar-table thead th) {
  padding: 8px 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

:deep(.el-calendar-table .el-calendar-day) {
  padding: 2px 4px;
  height: 60px;
  transition: background 0.12s;
}

:deep(.el-calendar-table .el-calendar-day:hover) {
  background: var(--el-fill-color-light);
}
</style>
